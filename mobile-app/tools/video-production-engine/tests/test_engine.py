"""Local synthetic QA fixtures only; no instructor footage, network or paid services."""
import copy
import importlib.util
import json
import math
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('engine', Path(__file__).resolve().parents[1] / 'engine.py')
engine = importlib.util.module_from_spec(spec)
spec.loader.exec_module(engine)


class EngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='soulanova-engine-tests-')
        cls.root = Path(cls.temp.name)
        cls.sources = cls.root / 'sources'; cls.sources.mkdir()
        cls.video = cls.sources / 'motion.mp4'
        cls.voice = cls.sources / 'voice.wav'
        cls.still = cls.sources / 'black-and-frozen.mp4'
        cls.silence = cls.sources / 'silent.wav'
        cls.clipped = cls.sources / 'overloaded.wav'
        def ff(args):
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-n', '-threads', '2', *args], check=True, capture_output=True)
        ff(['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=3', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(cls.video)])
        ff(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4', '-c:a', 'pcm_s16le', str(cls.voice)])
        ff(['-f', 'lavfi', '-i', 'color=c=black:s=320x180:r=30:d=1', '-f', 'lavfi', '-i', 'color=c=red:s=320x180:r=30:d=2',
            '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]', '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(cls.still)])
        ff(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '2', '-c:a', 'pcm_s16le', str(cls.silence)])
        ff(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=1', '-af', 'volume=100', '-c:a', 'pcm_s16le', str(cls.clipped)])
        cls.source_hashes = {p: engine.digest(p) for p in cls.sources.iterdir()}

    @classmethod
    def tearDownClass(cls):
        for p, digest in cls.source_hashes.items():
            assert engine.digest(p) == digest, 'Test changed a source fixture'
        cls.temp.cleanup()

    def manifest(self):
        return {'version': 1, 'title': 'Synthetic integration review', 'template': 'tai_chi',
                'asset_root': str(self.sources), 'assets': {
                    'motion': {'path': 'motion.mp4', 'approved': True, 'approval_note': 'Synthetic test pattern; never instructor content', 'expected_audio': 'silent'},
                    'voice': {'path': 'voice.wav', 'approved': True, 'approval_note': 'Synthetic test tone', 'expected_audio': 'required'}},
                'segments': [{'id': 'practice', 'asset': 'motion', 'source_in': 0, 'source_out': 2}],
                'narration': [{'asset': 'voice', 'at': 0, 'source_in': 0, 'source_out': 1}],
                'output': {'resolution': 'auto', 'fps': 30, 'normalize_audio': True}}

    def save(self, data, name='manifest.json'):
        path = self.root / name; path.write_text(json.dumps(data)); return path

    def test_quality_gate_does_not_claim_upscaled_1080(self):
        native = [{'video': {'width': 1920, 'height': 1080}}]
        low = [{'video': {'width': 864, 'height': 480}}]
        self.assertEqual(engine.resolution(native, {})['label'], '1080p')
        self.assertEqual(engine.resolution(low, {})['label'], '480p')
        with self.assertRaises(engine.EngineError):
            engine.resolution(low, {'resolution': '1080p'})
        self.assertTrue(engine.resolution(low, {'resolution': '1080p', 'allow_upscale': True})['low_resolution_source'])

    def test_unapproved_or_wrong_hash_is_rejected(self):
        data = self.manifest(); data['assets']['motion']['approved'] = False
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))
        data = self.manifest(); data['assets']['motion']['sha256'] = '0' * 64
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))

    def test_network_media_is_rejected(self):
        with self.assertRaises(engine.EngineError): engine.media_path('https://example.com/master.mp4', self.sources)

    def test_invalid_trims_and_uncontrolled_loop_are_rejected(self):
        data = self.manifest(); data['segments'][0]['source_out'] = 5
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))
        data = self.manifest(); data['segments'][0].update(source_out=1, duration=5)
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))
        data['segments'][0]['loop'] = {'max_repeats': 2}
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))

    def test_cue_spill_and_accidental_overlap_are_rejected(self):
        data = self.manifest(); data['narration'][0]['at'] = 1.5
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))
        data = self.manifest(); data['narration'] += [{'asset': 'voice', 'at': 0.5, 'source_out': 1}]
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))
        data['narration'][1]['allow_overlap'] = True
        self.assertTrue(engine.load_plan(self.save(data))['warnings'])

    def test_bow_number_mismatch_is_not_silently_reused(self):
        data = self.manifest(); data['assets']['motion']['lesson_id'] = '005'; data['segments'][0]['kind'] = 'opening_bow'
        with self.assertRaises(engine.EngineError): engine.load_plan(self.save(data))
        data['segments'][0]['allow_bow_label_mismatch'] = True
        self.assertIn('bow-label', ' '.join(engine.load_plan(self.save(data))['warnings']))

    def test_detects_black_freeze_and_low_motion_including_eof(self):
        log = self.root / 'detector-logs'; log.mkdir()
        info = dict(engine.probe(self.still), expected_audio='silent')
        qa = dict(engine.DEFAULT_QA, freeze_seconds=0.4, pause_seconds=0.8, black_seconds=0.1)
        report = engine.inspect_media(info, qa, log, 'fixture')
        kinds = {e['type'] for e in report['events']}
        self.assertTrue({'black_frame', 'possible_freeze', 'possible_long_pause'} <= kinds)
        self.assertFalse(report['errors'])
        self.assertTrue(any(e['end'] >= 2.9 for e in report['events'] if e['type'] == 'possible_freeze'))

    def test_detects_silent_required_audio_and_peak_overload(self):
        log = self.root / 'audio-logs'; log.mkdir()
        silent = engine.inspect_media(dict(engine.probe(self.silence), expected_audio='required'), engine.DEFAULT_QA, log, 'silent')
        self.assertTrue(silent['errors'])
        overloaded = engine.inspect_media(dict(engine.probe(self.clipped), expected_audio='required'), engine.DEFAULT_QA, log, 'overload')
        self.assertIn('clipping', ' '.join(overloaded['warnings']))

    def test_output_must_be_new_and_outside_source_tree(self):
        with self.assertRaises(engine.EngineError): engine.new_output(self.sources / 'review', [self.video])
        existing = self.root / 'existing'; existing.mkdir()
        with self.assertRaises(engine.EngineError): engine.new_output(existing, [self.video])

    def test_all_templates_and_intentional_holds_plan(self):
        for template in ['tai_chi', 'strength', 'stretching']:
            data = self.manifest(); data['template'] = template
            data['expected_holds'] = [{'start': 0, 'end': 1, 'reason': 'Instructor-approved stretch hold'}]
            plan = engine.load_plan(self.save(data))
            self.assertEqual(plan['template'], template)
            self.assertTrue(plan['expected_holds'])

    def test_native_1080p_export(self):
        native = self.sources / 'native-1080.mp4'
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-n', '-f', 'lavfi', '-i',
                        'testsrc2=size=1920x1080:rate=30:duration=1', '-an', '-c:v', 'libx264',
                        '-preset', 'ultrafast', '-threads', '2', '-pix_fmt', 'yuv420p', str(native)],
                       check=True, capture_output=True)
        data = self.manifest()
        data['assets']['motion']['path'] = native.name
        data['segments'][0]['source_out'] = 1
        data['narration'][0]['source_out'] = 1
        data['output']['normalize_audio'] = False
        report = engine.render(self.save(data, '1080.json'), self.root / '1080-review')
        self.assertEqual(report['plan']['output']['label'], '1080p')
        video = report['qa']['output']['media']['video']
        self.assertEqual((video['width'], video['height']), (1920, 1080))
        self.assertTrue(report['sources_unchanged'])

    def test_complete_class_with_loop_dissolve_and_delayed_audio(self):
        data = self.manifest()
        data['expected_duration'] = 3.8
        data['segments'] = [
            {'id': 'opening', 'asset': 'motion', 'source_in': 0, 'source_out': 0.5},
            {'id': 'looped', 'asset': 'motion', 'source_in': 0, 'source_out': 1, 'duration': 2,
             'loop': {'max_repeats': 3, 'crossfade': 0.1}},
            {'id': 'second', 'asset': 'motion', 'source_in': 1, 'source_out': 2,
             'transition_in': {'type': 'dissolve', 'duration': 0.2}},
            {'id': 'closing', 'asset': 'motion', 'source_in': 0, 'source_out': 0.5}]
        data['narration'] = [{'asset': 'voice', 'segment': 'looped', 'offset': 0.2, 'source_in': 0, 'source_out': 1}]
        manifest = self.save(data, 'class.json'); out = self.root / 'class-review'
        report = engine.render(manifest, out)
        self.assertEqual(report['status'], 'needs_manual_review')
        self.assertTrue(report['sources_unchanged'])
        self.assertAlmostEqual(report['plan']['duration'], 3.8)
        for name in ['review.mp4', 'report.json', 'report.html', 'contact-sheet.jpg', 'plan.json']:
            self.assertTrue((out / name).is_file(), name)
        self.assertEqual(len(list((out / 'thumbnails').glob('*.jpg'))), 9)
        def rms(at):
            pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(at), '-i', str(out / 'review.mp4'), '-t', '0.2', '-vn', '-ac', '1', '-ar', '48000', '-f', 's16le', '-'])
            samples = struct.unpack('<' + 'h' * (len(pcm) // 2), pcm)
            return math.sqrt(sum(x*x for x in samples) / len(samples))
        self.assertLess(rms(0.2), 100, 'Cue leaked before the scheduled 0.7s onset')
        self.assertGreater(rms(0.9), 500, 'Narration did not play at its scheduled onset')
        with self.assertRaises(engine.EngineError): engine.render(manifest, out)


if __name__ == '__main__':
    unittest.main()
