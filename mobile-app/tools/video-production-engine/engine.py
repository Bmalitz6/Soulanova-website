#!/usr/bin/env python3
"""Soulanova Video Production Engine V1. Local review exports; never publishes."""
import argparse
import copy
import hashlib
import html
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone

VERSION = '1.0.0'
MEDIA_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.m4v', '.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'}
DEFAULT_QA = {'freeze_seconds': 2.0, 'freeze_noise_db': -50,
              'pause_seconds': 4.0, 'pause_noise_db': -35,
              'black_seconds': 0.15, 'black_ratio': 0.98,
              'silence_seconds': 5.0, 'silence_db': -50}
TEMPLATES = {
    'tai_chi': {'fps': 30, 'notes': 'Preserve instructor framing and approved bows; review loop joins and balance positions.'},
    'strength': {'fps': 30, 'notes': 'Instructor must approve exercise order, reps, rest and safe loop boundaries; no automatic rep counting.'},
    'stretching': {'fps': 30, 'notes': 'Declare intentional holds; no automatic removal of low-motion intervals or clinical safety claims.'},
}


class EngineError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise EngineError(message)


def number(value, label, minimum=None, maximum=None):
    require(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value), label + ' must be a finite number')
    if minimum is not None:
        require(value >= minimum, label + ' is below its minimum')
    if maximum is not None:
        require(value <= maximum, label + ' exceeds its maximum')
    return float(value)


def write_json(path, value):
    # Only called inside an exclusively-created run directory.
    Path(path).write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def run(args, log_dir=None, label='command', timeout=7200):
    try:
        p = subprocess.run([str(a) for a in args], capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as e:
        raise EngineError('Could not complete ' + label + ': ' + str(e)) from e
    if log_dir:
        log = Path(log_dir)
        log.mkdir(exist_ok=True)
        (log / (label + '.log')).write_text(p.stderr)
        (log / (label + '.command.json')).write_text(json.dumps([str(a) for a in args], indent=2))
    require(p.returncode == 0, label + ' failed: ' + p.stderr[-1800:])
    return p


def ffmpeg():
    return ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'info', '-n', '-filter_complex_threads', '1', '-threads', '2']


def input_args(path):
    # No network protocols or playlists; all references must be existing local files.
    return ['-protocol_whitelist', 'file,pipe', '-i', str(path)]


def toolcheck():
    for binary in ['ffmpeg', 'ffprobe']:
        require(shutil.which(binary), binary + ' must be installed')
    filters = run(['ffmpeg', '-hide_banner', '-filters']).stdout
    for name in ['freezedetect', 'blackdetect', 'silencedetect', 'loudnorm', 'sidechaincompress', 'xfade', 'alimiter']:
        require(re.search(r'\s' + name + r'\s', filters), 'FFmpeg filter unavailable: ' + name)


def media_path(raw, root):
    require(isinstance(raw, str) and raw and '://' not in raw and '\x00' not in raw, 'Only local media paths are accepted')
    path = Path(os.path.expandvars(raw)).expanduser()
    if not path.is_absolute():
        path = root / path
    path = path.resolve()
    require(path.is_file() and path.suffix.lower() in MEDIA_EXTENSIONS, 'Missing or unsupported local media: ' + str(path))
    return path


def probe(path):
    data = json.loads(run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe',
                           '-show_streams', '-show_format', '-of', 'json', str(path)]).stdout)
    result = {'path': str(path), 'duration': float(data['format']['duration']), 'bytes': path.stat().st_size}
    require(math.isfinite(result['duration']) and result['duration'] > 0, 'Invalid media duration')
    for kind in ['video', 'audio']:
        stream = next((s for s in data.get('streams', []) if s.get('codec_type') == kind), None)
        if stream:
            result[kind] = {k: stream[k] for k in ['codec_name', 'width', 'height', 'r_frame_rate', 'sample_rate', 'channels', 'duration', 'pix_fmt', 'color_transfer'] if k in stream}
            if kind == 'video':
                rotation = next((s.get('rotation', 0) for s in stream.get('side_data_list', []) if 'rotation' in s), 0)
                require(not rotation, 'Rotated video needs an explicitly reviewed orientation export before use')
                require(stream.get('color_transfer') not in ['smpte2084', 'arib-std-b67'], 'HDR source needs a reviewed SDR conversion; V1 does not silently tone-map')
    return result


def frames(seconds, fps, label):
    n = round(seconds * fps)
    require(n >= 1 and abs(n / fps - seconds) < 0.001, label + ' must align with output frames')
    return n


def resolution(infos, settings):
    requested = settings.get('resolution', 'auto')
    require(requested in ['auto', '480p', '720p', '1080p'], 'Unsupported resolution')
    choices = {'480p': (854, 480), '720p': (1280, 720), '1080p': (1920, 1080)}
    heights = [min(i['video']['height'], i.get('effective_height', i['video']['height'])) for i in infos]
    widths = [i['video']['width'] for i in infos]
    if requested == 'auto':
        # 704-line production sources are preserved on a padded 720 canvas.
        requested = '1080p' if min(heights) >= 1080 and min(widths) >= 1920 else '720p' if min(heights) >= 704 and min(widths) >= 1280 else '480p'
    w, h = choices[requested]
    if requested == '1080p':
        require((min(heights) >= 1080 and min(widths) >= 1920) or settings.get('allow_upscale') is True,
                '1080p requested from lower-resolution sources. Use auto, or explicitly acknowledge allow_upscale=true (no recovered detail).')
    return {'label': requested, 'width': w, 'height': h, 'low_resolution_source': min(heights) < h,
            'allow_upscale': settings.get('allow_upscale') is True}


def load_plan(manifest_path, asset_root=None):
    manifest_path = Path(manifest_path).resolve()
    data = json.loads(manifest_path.read_text())
    require(isinstance(data, dict), 'Manifest must be a JSON object')
    require(data.get('version') == 1, 'Manifest version must be 1')
    template = data.get('template', 'tai_chi')
    require(template in TEMPLATES, 'Unknown template')
    root = Path(asset_root) if asset_root else Path(os.path.expandvars(data.get('asset_root', '.'))).expanduser()
    if not root.is_absolute():
        root = manifest_path.parent / root
    root = root.resolve()
    assets = data.get('assets', {})
    require(isinstance(assets, dict) and 1 <= len(assets) <= 128, 'Manifest needs 1–128 assets')
    infos = {}
    for key, spec in assets.items():
        require(re.fullmatch(r'[A-Za-z0-9_-]{1,64}', key), 'Asset IDs must be simple identifiers')
        require(isinstance(spec, dict) and spec.get('approved') is True and isinstance(spec.get('approval_note'), str) and spec['approval_note'].strip(),
                'Asset needs explicit approved=true and an approval_note: ' + key)
        path = media_path(spec.get('path'), root)
        info = probe(path)
        info['sha256'] = digest(path)
        require(not spec.get('sha256') or spec['sha256'] == info['sha256'], 'Source hash mismatch: ' + key)
        info['approval_note'] = spec['approval_note']
        info['expected_audio'] = spec.get('expected_audio', 'optional')
        require(info['expected_audio'] in ['required', 'silent', 'optional'], 'Invalid expected_audio for ' + key)
        if info['expected_audio'] == 'required':
            require('audio' in info, 'Required audio stream missing: ' + key)
        if 'effective_height' in spec:
            info['effective_height'] = number(spec['effective_height'], 'effective_height', 1, 4320)
        info['baked_timer'] = spec.get('baked_timer') is True
        info['lesson_id'] = spec.get('lesson_id')
        infos[key] = info
    settings = data.get('output', {})
    require(isinstance(settings, dict), 'output must be an object')
    raw_fps = number(settings.get('fps', TEMPLATES[template]['fps']), 'fps', 24, 60)
    require(raw_fps.is_integer(), 'fps must be an integer')
    fps = int(raw_fps)
    require(fps in [24, 25, 30, 50, 60], 'Unsupported output frame rate')
    crf = int(number(settings.get('crf', 20), 'crf', 10, 30))
    preset = settings.get('preset', 'veryfast')
    require(preset in ['ultrafast', 'veryfast', 'fast', 'medium', 'slow'], 'Unsupported encoding preset')
    segments = data.get('segments', [])
    require(isinstance(segments, list) and 1 <= len(segments) <= 64, 'Need 1–64 timeline segments')
    planned, ids, clock, warnings = [], set(), 0.0, []
    for pos, s in enumerate(segments):
        require(isinstance(s, dict), 'Each segment must be an object')
        sid = s.get('id')
        require(isinstance(sid, str) and re.fullmatch(r'[A-Za-z0-9_-]{1,64}', sid) and sid not in ids, 'Segment IDs must be unique simple identifiers')
        ids.add(sid)
        aid = s.get('asset')
        require(aid in infos and 'video' in infos[aid], 'Segment requires a video asset: ' + str(aid))
        info = infos[aid]
        source_in = number(s.get('source_in', 0), sid + '.source_in', 0)
        source_out = number(s.get('source_out', info['duration']), sid + '.source_out', source_in + 0.001)
        available = float(info['video'].get('duration', info['duration']))
        require(source_out <= available + 0.001, 'Trim exceeds video stream: ' + sid)
        cycle = source_out - source_in
        duration = number(s.get('duration', cycle), sid + '.duration', 1 / fps, 7200)
        frames(duration, fps, sid + '.duration')
        loop = s.get('loop')
        repeat, blend = 1, 0.0
        if duration > cycle + 0.001:
            require(isinstance(loop, dict), 'Short clip requires an explicit controlled loop: ' + sid)
            frames(cycle, fps, sid + '.loop cycle')
            raw_limit = number(loop.get('max_repeats', 1), 'max_repeats', 2, 32)
            require(raw_limit.is_integer(), 'max_repeats must be an integer')
            limit = int(raw_limit)
            blend = number(loop.get('crossfade', 0), 'loop.crossfade', 0, min(2, cycle / 3))
            if blend:
                frames(blend, fps, 'loop.crossfade')
            repeat = math.ceil((duration - blend) / (cycle - blend) - 1e-8)
            require(repeat <= limit, 'Loop repeat limit exceeded: ' + sid)
            warnings.append(sid + ': controlled repetition requires visual loop-seam approval')
        transition = s.get('transition_in', {})
        require(isinstance(transition, dict), 'transition_in must be an object')
        kind = transition.get('type', 'cut')
        require(kind in ['cut', 'dissolve'], 'Only cut/dissolve transitions are supported')
        overlap = number(transition.get('duration', 0), sid + '.transition duration', 0, 3)
        require((kind == 'cut' and overlap == 0) or (kind == 'dissolve' and pos > 0 and overlap > 0), 'Invalid transition: ' + sid)
        if overlap:
            frames(overlap, fps, 'transition duration')
            require(overlap < min(duration, planned[-1]['duration']) / 2, 'Dissolve is too long')
        clock -= overlap
        planned.append({'id': sid, 'asset': aid, 'kind': s.get('kind', 'movement'), 'source_in': source_in,
                        'source_out': source_out, 'duration': duration, 'cycle': min(cycle, duration),
                        'repeats': repeat, 'loop_crossfade': blend, 'transition_in': kind,
                        'overlap': overlap, 'start': round(clock, 6), 'end': round(clock + duration, 6)})
        clock += duration
        if s.get('kind') in ['opening_bow', 'closing_bow'] and info.get('lesson_id') and info['lesson_id'] != data.get('lesson_id'):
            require(s.get('allow_bow_label_mismatch') is True, 'Bow lesson label does not match this class/lesson: ' + sid)
            warnings.append(sid + ': acknowledged baked bow-label mismatch; replace class graphics in a separate reviewed derivative before delivery')
        if info['baked_timer']:
            warnings.append(sid + ': source has a baked timer; retained unchanged, no second timer added')
        if 'audio' in info:
            warnings.append(sid + ': embedded source audio is deliberately omitted; use an explicit audio cue to avoid double narration')
    require(clock <= 7200, 'V1 timeline is limited to two hours')
    frames(clock, fps, 'Timeline duration')
    if 'expected_duration' in data:
        require(abs(number(data['expected_duration'], 'expected_duration', 0) - clock) < 0.001, 'Expected duration does not match trims/transitions')
    res = resolution([infos[s['asset']] for s in planned], settings)
    if res['low_resolution_source']:
        warnings.append('Delivery canvas exceeds at least one source; padding is used unless allow_upscale=true. No new image detail is created.')
    cues = []
    require(isinstance(data.get('narration', []), list), 'narration must be a list')
    for index, cue in enumerate(data.get('narration', [])):
        require(isinstance(cue, dict), 'Each narration cue must be an object')
        aid = cue.get('asset')
        require(aid in infos and 'audio' in infos[aid], 'Narration cue requires an audio asset')
        at = number(cue.get('at', 0), 'cue.at', 0)
        if 'segment' in cue:
            match = next((s for s in planned if s['id'] == cue['segment']), None)
            require(match is not None, 'Cue references unknown segment')
            require('at' not in cue, 'Use either cue.at or cue.segment with offset')
            at = match['start'] + number(cue.get('offset', 0), 'cue.offset', 0)
        source_in = number(cue.get('source_in', 0), 'cue.source_in', 0)
        source_out = number(cue.get('source_out', infos[aid]['duration']), 'cue.source_out', source_in + 0.001)
        require(source_out <= infos[aid]['duration'] + 0.001, 'Cue trim exceeds audio')
        duration = source_out - source_in
        require(at + duration <= clock + 0.001, 'Narration cue spills beyond class')
        current = {'asset': aid, 'at': at, 'source_in': source_in, 'source_out': source_out,
                   'duration': duration, 'gain_db': number(cue.get('gain_db', 0), 'cue.gain_db', -60, 12)}
        for previous in cues:
            if max(previous['at'], at) < min(previous['at'] + previous['duration'], at + duration) - 0.001:
                require(cue.get('allow_overlap') is True, 'Narration overlap must be explicitly acknowledged')
                warnings.append('Explicit narration overlap at ' + str(at) + ' seconds')
        cues.append(current)
    require(len(cues) <= 128, 'Too many narration cues')
    music = copy.deepcopy(data.get('music'))
    if music:
        require(isinstance(music, dict), 'music must be an object')
        require(music.get('asset') in infos and 'audio' in infos[music['asset']], 'Music requires an audio asset')
        music['source_in'] = number(music.get('source_in', 0), 'music.source_in', 0)
        require(music['source_in'] + clock <= infos[music['asset']]['duration'] + 0.001, 'Music too short; V1 requires an explicitly prepared class-length music bed')
        music['gain_db'] = number(music.get('gain_db', -24), 'music.gain_db', -60, 24)
        music['fade_seconds'] = number(music.get('fade_seconds', 1), 'music.fade_seconds', 0, clock / 2)
    audio_required = settings.get('audio_required', True)
    require(not audio_required or cues or music, 'Audio is required but no narration/music is configured')
    expected_holds = data.get('expected_holds', [])
    require(isinstance(expected_holds, list), 'expected_holds must be a list')
    for hold in expected_holds:
        require(isinstance(hold, dict), 'Each intentional hold must be an object')
        start = number(hold.get('start'), 'hold.start', 0, clock)
        end = number(hold.get('end'), 'hold.end', start + 0.001, clock)
        require(isinstance(hold.get('reason'), str) and hold['reason'].strip(), 'Intentional holds need a reason')
    qa = dict(DEFAULT_QA)
    require(isinstance(data.get('qa', {}), dict), 'qa must be an object')
    for key, value in data.get('qa', {}).items():
        require(key in DEFAULT_QA, 'Unknown QA option: ' + key)
        qa[key] = number(value, 'qa.' + key, -100 if key.endswith('_db') else 0.01,
                         0 if key.endswith('_db') else 1 if key == 'black_ratio' else 120)
    return {'engine_version': VERSION, 'manifest': str(manifest_path), 'title': str(data.get('title', 'Soulanova local review')),
            'template': template, 'template_notes': TEMPLATES[template]['notes'], 'assets': infos,
            'segments': planned, 'narration': cues, 'music': music, 'duration': round(clock, 6), 'qa': qa,
            'output': dict(res, fps=fps, crf=crf, preset=preset, audio_required=audio_required,
                           normalize_audio=settings.get('normalize_audio', False) is True),
            'warnings': warnings, 'expected_holds': expected_holds, 'review_only': True}


def new_output(path, sources):
    path = Path(path).expanduser().resolve()
    require(not path.exists(), 'Refusing existing output directory: ' + str(path))
    for source in sources:
        p = Path(source).resolve()
        require(path != p.parent and p.parent not in path.parents and path not in p.parents,
                'Reviews must be in a separate tree, outside source directories: ' + str(path))
    path.mkdir(parents=True, exist_ok=False)
    return path


def intervals(log, prefix, duration):
    """Parse FFmpeg intervals, including an unfinished freeze/silence at EOF."""
    found, start = [], None
    for match in re.finditer(re.escape(prefix) + r'_(start|end):\s*(-?\d+(?:\.\d+)?)', log):
        if match.group(1) == 'start':
            start = max(0, float(match.group(2)))
        elif start is not None:
            end = min(duration, float(match.group(2)))
            if end > start:
                found.append({'start': round(start, 3), 'end': round(end, 3), 'duration': round(end - start, 3)})
            start = None
    if start is not None and start < duration:
        found.append({'start': round(start, 3), 'end': round(duration, 3), 'duration': round(duration - start, 3)})
    return found


def loudness(path, log_dir=None, label='loudness'):
    p = run(ffmpeg() + input_args(path) + ['-vn', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], log_dir, label)
    matches = re.findall(r'\{\s*"input_i".*?\}', p.stderr, re.S)
    require(matches, 'Could not parse FFmpeg loudness measurements')
    return json.loads(matches[-1])


def inspect_media(info, qa, log_dir, label):
    path, duration = Path(info['path']), info['duration']
    result = {'media': info, 'events': [], 'errors': [], 'warnings': []}
    try:
        if 'video' in info:
            # Black scan is full-frame. Motion scans exclude static letterboxing by
            # looking at the central half; a timer/panel cannot hide a frozen body.
            common = ffmpeg() + input_args(path) + ['-an', '-sn']
            visual = ('scale=640:-2,blackdetect=d={}:pix_th=0.10:pic_th={},'
                      'crop=iw/2:ih:iw/4:0,freezedetect=n={}dB:d={}').format(
                          qa['black_seconds'], qa['black_ratio'], qa['freeze_noise_db'], qa['freeze_seconds'])
            p = run(common + ['-vf', visual, '-f', 'null', '-'], log_dir, label + '-frames')
            if re.search(r'corrupt|invalid.*nal|error while decoding', p.stderr, re.I):
                result['warnings'].append('Decoder warnings found; inspect the source log')
            for kind, prefix in [('black_frame', 'black'), ('possible_freeze', 'freeze')]:
                for event in intervals(p.stderr, prefix, duration):
                    result['events'].append(dict(event, type=kind, severity='review'))
            p = run(common + ['-vf', 'scale=320:-2,crop=iw/2:ih:iw/4:0,freezedetect=n={}dB:d={}'.format(qa['pause_noise_db'], qa['pause_seconds']), '-f', 'null', '-'], log_dir, label + '-pauses')
            for event in intervals(p.stderr, 'freeze', duration):
                result['events'].append(dict(event, type='possible_long_pause', severity='review'))
        if 'audio' in info:
            p = run(ffmpeg() + input_args(path) + ['-vn', '-af', 'silencedetect=noise={}dB:d={}'.format(qa['silence_db'], qa['silence_seconds']), '-f', 'null', '-'], log_dir, label + '-silence')
            for event in intervals(p.stderr, 'silence', duration):
                result['events'].append(dict(event, type='audio_silence', severity='review'))
            measurements = loudness(path, log_dir, label + '-loudness')
            result['loudness'] = measurements
            integrated, peak = float(measurements['input_i']), float(measurements['input_tp'])
            if not math.isfinite(integrated):
                target = result['errors'] if info.get('expected_audio') == 'required' else result['warnings']
                target.append('Audio stream is effectively silent')
            elif integrated < -32:
                result['warnings'].append('Very quiet audio; check intended gain and intelligibility')
            if peak >= -0.1:
                result['warnings'].append('Possible clipping/true-peak overload (>= -0.1 dBTP); inspect the waveform and listen')
            if info.get('expected_audio') == 'silent':
                result['warnings'].append('Unexpected audio stream in a declared silent master')
        elif info.get('expected_audio') == 'required':
            result['errors'].append('Required audio stream is missing')
        if 'video' in info and 'audio' in info:
            vd, ad = info['video'].get('duration'), info['audio'].get('duration')
            if vd and ad and abs(float(vd) - float(ad)) > 0.1:
                result['warnings'].append('Audio/video stream durations differ by more than 100 ms')
    except EngineError as error:
        result['errors'].append(str(error))
    return result


def encode_settings(output):
    return ['-c:v', 'libx264', '-preset', output['preset'], '-crf', str(output['crf']),
            '-pix_fmt', 'yuv420p', '-r', str(output['fps']), '-video_track_timescale', '90000',
            '-map_metadata', '-1', '-movflags', '+faststart']


def join_videos(paths, durations, overlaps, destination, output, logs, label, trim=None):
    if not any(overlaps):
        listing = destination.with_suffix('.concat.txt')
        # Paths here are engine-generated numeric filenames, never manifest text.
        listing.write_text(''.join("file '{}'\n".format(p.name) for p in paths))
        args = ffmpeg() + ['-f', 'concat', '-safe', '0', '-i', str(listing), '-an', '-c:v', 'copy', '-map_metadata', '-1', '-movflags', '+faststart']
        if trim is not None:
            args += ['-t', str(trim)]
        run(args + [str(destination)], logs, label)
        return
    args = ffmpeg()
    filters = []
    for i, path in enumerate(paths):
        args += input_args(path)
        filters.append('[{}:v]settb=AVTB,setpts=PTS-STARTPTS[v{}]'.format(i, i))
    current, elapsed = 'v0', durations[0]
    for i in range(1, len(paths)):
        nxt = 'join' + str(i)
        if overlaps[i] > 0:
            filters.append('[{}][v{}]xfade=transition=fade:duration={}:offset={}[{}]'.format(current, i, overlaps[i], elapsed - overlaps[i], nxt))
        else:
            filters.append('[{}][v{}]concat=n=2:v=1:a=0,settb=AVTB[{}]'.format(current, i, nxt))
        elapsed += durations[i] - overlaps[i]
        current = nxt
    args += ['-filter_complex', ';'.join(filters), '-map', '[' + current + ']', '-an'] + encode_settings(output)
    args += ['-frames:v', str(frames(trim if trim is not None else elapsed, output['fps'], 'Joined duration')), str(destination)]
    run(args, logs, label)


def render_segment(segment, info, work, output, logs, index):
    cycle = work / ('cycle-%03d.mp4' % index)
    v = info['video']
    ratio = min(output['width'] / v['width'], output['height'] / v['height'])
    if not output['allow_upscale']:
        ratio = min(1, ratio)
    w, h = max(2, int(v['width'] * ratio) // 2 * 2), max(2, int(v['height'] * ratio) // 2 * 2)
    vf = 'scale={}:{},pad={}:{}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={},format=yuv420p,setpts=PTS-STARTPTS'.format(w, h, output['width'], output['height'], output['fps'])
    cycle_duration = round(segment['cycle'] * output['fps']) / output['fps']
    require(cycle_duration > 0, 'Loop cycle too short')
    args = ffmpeg() + ['-ss', str(segment['source_in'])] + input_args(info['path'])
    args += ['-an', '-sn', '-vf', vf, '-frames:v', str(frames(cycle_duration, output['fps'], 'Cycle duration'))] + encode_settings(output) + [str(cycle)]
    run(args, logs, 'segment-%03d' % index)
    require(abs(probe(cycle)['duration'] - cycle_duration) <= 1 / output['fps'] + 0.002, 'Source did not supply the requested frames; no frozen padding was added')
    if segment['repeats'] == 1:
        return cycle
    destination = work / ('loop-%03d.mp4' % index)
    count = segment['repeats']
    join_videos([cycle] * count, [cycle_duration] * count, [0] + [segment['loop_crossfade']] * (count - 1),
                destination, output, logs, 'loop-%03d' % index, trim=segment['duration'])
    return destination


def render_audio(plan, work, logs):
    total = plan['duration']
    args = ffmpeg() + ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
    filters, voices = [], []
    for i, cue in enumerate(plan['narration']):
        args += input_args(plan['assets'][cue['asset']]['path'])
        tag = 'voice' + str(i)
        filters.append('[{}:a]atrim=start={}:end={},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={}dB,adelay={}:all=1[{}]'.format(
            i + 1, cue['source_in'], cue['source_out'], cue['gain_db'], round(cue['at'] * 1000), tag))
        voices.append('[' + tag + ']')
    if voices:
        filters.append(''.join(voices) + 'amix=inputs={}:normalize=0:duration=longest,apad,atrim=duration={}[voices]'.format(len(voices), total))
    else:
        filters.append('[0:a]atrim=duration={}[voices]'.format(total))
    if plan['music']:
        music = plan['music']
        args += input_args(plan['assets'][music['asset']]['path'])
        filters.append('[{}:a]atrim=start={}:duration={},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={}dB,afade=t=in:d={},afade=t=out:st={}:d={}[music]'.format(
            len(voices) + 1, music['source_in'], total, music['gain_db'], music['fade_seconds'], total - music['fade_seconds'], music['fade_seconds']))
        if voices and music.get('duck', True):
            filters += ['[voices]asplit=2[spoken][side]', '[music][side]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=300[ducked]',
                        '[spoken][ducked]amix=inputs=2:normalize=0:duration=longest[mixed]']
        else:
            filters.append('[voices][music]amix=inputs=2:normalize=0:duration=longest[mixed]')
    else:
        filters.append('[voices]anull[mixed]')
    filters.append('[mixed]alimiter=limit=0.89:level=false:latency=true,atrim=duration={}[audio]'.format(total))
    destination = work / 'audio.wav'
    run(args + ['-filter_complex', ';'.join(filters), '-map', '[audio]', '-t', str(total), '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', '-map_metadata', '-1', str(destination)], logs, 'audio-mix')
    return destination


def thumbnails(video, output_dir, duration, logs):
    folder = output_dir / 'thumbnails'
    folder.mkdir()
    times = []
    for i in range(9):
        at = (i + 0.5) * duration / 9
        times.append(round(at, 3))
        run(ffmpeg() + ['-ss', str(at)] + input_args(video) + ['-an', '-vf', 'scale=320:-2', '-frames:v', '1', '-q:v', '3', str(folder / ('%03d.jpg' % i))], logs, 'thumbnail-%02d' % i)
    run(ffmpeg() + ['-framerate', '1', '-i', str(folder / '%03d.jpg'), '-vf', 'tile=3x3', '-frames:v', '1', '-q:v', '3', str(output_dir / 'contact-sheet.jpg')], logs, 'contact-sheet')
    return times


def report_html(report, path):
    esc = lambda v: html.escape(str(v))
    cards = []
    for name, qa in report.get('qa', {}).items():
        events = ''.join('<tr><td>{}</td><td>{}</td><td>{}</td></tr>'.format(esc(e['type']), esc(e['start']), esc(e['end'])) for e in qa['events'])
        notes = qa['errors'] + qa['warnings']
        measured = qa.get('loudness', {})
        if measured:
            notes = notes + ['Measured integrated loudness: {} LUFS; true peak: {} dBTP'.format(measured['input_i'], measured['input_tp'])]
        cards.append('<section><h2>{}</h2><p>{}</p><table><tr><th>Possible issue</th><th>Start (s)</th><th>End (s)</th></tr>{}</table><pre>{}</pre></section>'.format(
            esc(name), esc(qa['media']['path']), events or '<tr><td colspan="3">No threshold events detected</td></tr>', esc('\n'.join(notes))))
    markup = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soulanova review QA</title><style>body{font:16px/1.5 system-ui;max-width:1100px;margin:32px auto;padding:20px;color:#173238;background:#f7f8f5}section{padding:20px;background:white;margin:16px 0;border-radius:12px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:8px;border-bottom:1px solid #ddd}video,img{max-width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#086b63}</style><h1>Soulanova Video Production Engine V1</h1><p><strong>LOCAL REVIEW — manual approval required; never auto-published.</strong></p>'''
    markup += '<p>{}</p><pre>{}</pre>'.format(esc(report.get('title', 'Media QA')), esc('\n'.join(report.get('warnings', []))))
    markup += '<p>Status: <strong>{}</strong></p>'.format(esc(report.get('status', 'unknown')))
    if report.get('failure'):
        markup += '<section><h2>Export failed</h2><pre>{}</pre></section>'.format(esc(report['failure']))
    plan = report.get('plan', {})
    if plan:
        markup += '<section><h2>Timeline and cue sheet</h2><p>Duration: {} seconds; canvas: {}×{}; {} fps. Source findings below use source time; output findings use class time.</p>'.format(
            esc(plan['duration']), esc(plan['output']['width']), esc(plan['output']['height']), esc(plan['output']['fps']))
        markup += '<table><tr><th>Segment</th><th>Start (s)</th><th>End (s)</th><th>Asset</th></tr>'
        for segment in plan['segments']:
            markup += '<tr><td>{}</td><td>{}</td><td>{}</td><td>{}</td></tr>'.format(*[esc(segment[k]) for k in ['id', 'start', 'end', 'asset']])
        markup += '</table><h3>Narration cues</h3><pre>{}</pre></section>'.format(esc(json.dumps(plan['narration'], indent=2)))
    if report.get('review_file'):
        markup += '<video controls preload="metadata" src="review.mp4"></video><p><a href="review.mp4">Review MP4</a> · <a href="report.json">QA JSON / cue sheet</a> · <a href="contact-sheet.jpg">Contact sheet</a></p><img src="contact-sheet.jpg" alt="Nine sampled frames"><p>Sample times (seconds): {}</p>'.format(esc(report.get('thumbnail_times', [])))
    if report.get('thumbnail_times') and not report.get('review_file'):
        markup += '<p><a href="contact-sheet.jpg">Contact sheet</a></p><img src="contact-sheet.jpg" alt="Nine sampled source frames">'
    markup += ''.join(cards) + '<h2>Manual QA checklist</h2><ul>' + ''.join('<li>' + esc(x) + '</li>' for x in MANUAL_QA) + '</ul></html>'
    Path(path).write_text(markup)


MANUAL_QA = [
    'Watch the full review: detector thresholds cannot certify natural motion, technique, instructor identity, hand/foot anatomy, or beginner suitability.',
    'Review every loop seam, trim and dissolve. Slow Tai Chi and Stretching holds may be intentional; no detected interval was automatically removed.',
    'Listen to every spoken cue, pronunciation and class welcome/closing. Check visual alignment, voice intelligibility, music ducking and headphones/speakers.',
    'Inspect original bow labels, baked timers and branding. This engine retains them, cannot remove baked graphics, and does not approve lesson-label reuse.',
    'Inspect full-body framing, native source quality and any letterboxing. A 1080p container is not proof of 1080p source detail.',
    'Verify ownership, consent, approved revisions, instructor sign-off and accessibility captions before any delivery. The engine does not publish or spend generation credits.',
]


def render(manifest_path, output_dir, asset_root=None):
    toolcheck()
    plan = load_plan(manifest_path, asset_root)
    out = new_output(output_dir, [a['path'] for a in plan['assets'].values()])
    work, logs = out / '_work', out / 'logs'
    work.mkdir(); logs.mkdir()
    report = {'engine_version': VERSION, 'created_utc': datetime.now(timezone.utc).isoformat(),
              'title': plan['title'], 'status': 'rendering', 'plan': plan, 'warnings': plan['warnings'], 'qa': {}}
    write_json(out / 'plan.json', plan)
    try:
        for key, info in plan['assets'].items():
            print('QA source:', key, flush=True)
            report['qa'][key] = inspect_media(info, plan['qa'], logs, 'source-' + key)
            require(not report['qa'][key]['errors'], 'Source QA failed for ' + key + ': ' + '; '.join(report['qa'][key]['errors']))
        clips = []
        for i, s in enumerate(plan['segments']):
            print('Render:', s['id'], flush=True)
            clips.append(render_segment(s, plan['assets'][s['asset']], work, plan['output'], logs, i))
        silent = work / 'visuals.mp4'
        join_videos(clips, [s['duration'] for s in plan['segments']], [s['overlap'] for s in plan['segments']], silent, plan['output'], logs, 'join-timeline')
        audio = render_audio(plan, work, logs)
        args = ffmpeg() + input_args(silent) + input_args(audio)
        if plan['output']['normalize_audio']:
            measured = loudness(audio, logs, 'normalization-pass1')
            require(math.isfinite(float(measured['input_i'])), 'Cannot normalize silent audio')
            af = 'loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true:print_format=json'.format(**measured)
            args += ['-af', af]
        provisional = out / 'review.incomplete.mp4'
        run(args + ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', str(plan['duration']), '-map_metadata', '-1', '-movflags', '+faststart', str(provisional)], logs, 'final-mux')
        info = probe(provisional)
        require('video' in info and 'audio' in info and abs(info['duration'] - plan['duration']) <= 1 / plan['output']['fps'] + 0.01, 'Final stream/duration validation failed')
        require(abs(float(info['video'].get('duration', 0)) - plan['duration']) <= 1 / plan['output']['fps'] + 0.01, 'Final video stream is short/long')
        require(abs(float(info['audio'].get('duration', 0)) - plan['duration']) <= 0.06, 'Final audio stream is short/long')
        require(info['video']['width'] == plan['output']['width'] and info['video']['height'] == plan['output']['height'], 'Wrong delivery dimensions')
        report['qa']['output'] = inspect_media(dict(info, expected_audio='required' if plan['output']['audio_required'] else 'optional'), plan['qa'], logs, 'output')
        require(not report['qa']['output']['errors'], 'Final output QA has errors')
        for event in report['qa']['output']['events']:
            if event['type'] in ['possible_freeze', 'possible_long_pause']:
                for hold in plan.get('expected_holds', []):
                    if event['start'] >= hold['start'] and event['end'] <= hold['end']:
                        event['declared_intentional_hold'] = hold['reason']
        # Intentional-hold annotations never delete findings or certify a clip.
        for key, asset in plan['assets'].items():
            require(digest(asset['path']) == asset['sha256'], 'Source changed during export: ' + key)
        report['sources_unchanged'] = True
        # Destination is in this run's exclusively-created directory. No overwrite.
        require(not (out / 'review.mp4').exists(), 'Unexpected existing review')
        provisional.rename(out / 'review.mp4')
        report['review_file'] = str(out / 'review.mp4')
        report['qa']['output']['media']['path'] = report['review_file']
        report['thumbnail_times'] = thumbnails(out / 'review.mp4', out, info['duration'], logs)
        report['status'] = 'needs_manual_review'
        report['manual_qa'] = MANUAL_QA
        write_json(out / 'report.json', report)
        report_html(report, out / 'report.html')
        print('LOCAL REVIEW:', out / 'review.mp4', flush=True)
        print('QA REPORT:', out / 'report.html', flush=True)
        return report
    except BaseException as error:
        report['status'] = 'failed'
        report['failure'] = str(error)
        write_json(out / 'report.json', report)
        report_html(report, out / 'report.html')
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    for name in ['validate', 'render']:
        child = commands.add_parser(name)
        child.add_argument('manifest', type=Path)
        child.add_argument('--asset-root', type=Path)
        if name == 'render':
            child.add_argument('--output-dir', required=True, type=Path)
    child = commands.add_parser('inspect')
    child.add_argument('source', type=Path)
    child.add_argument('--output-dir', required=True, type=Path)
    child.add_argument('--expected-audio', choices=['required', 'silent', 'optional'], default='optional')
    commands.add_parser('templates')
    args = parser.parse_args()
    try:
        if args.command == 'templates':
            print(json.dumps(TEMPLATES, indent=2))
        elif args.command == 'validate':
            toolcheck()
            p = load_plan(args.manifest, args.asset_root)
            print(json.dumps(p, indent=2))
        elif args.command == 'render':
            render(args.manifest, args.output_dir, args.asset_root)
        else:
            toolcheck()
            source = media_path(str(args.source), Path.cwd())
            info = dict(probe(source), sha256=digest(source), expected_audio=args.expected_audio)
            out = new_output(args.output_dir, [source]); logs = out / 'logs'; logs.mkdir()
            qa = inspect_media(info, DEFAULT_QA, logs, 'inspect')
            require(digest(source) == info['sha256'], 'Source changed during inspection')
            report = {'engine_version': VERSION, 'title': source.name, 'status': 'needs_manual_review', 'sources_unchanged': True, 'qa': {'source': qa}}
            if 'video' in info:
                report['thumbnail_times'] = thumbnails(source, out, info['duration'], logs)
            write_json(out / 'report.json', report); report_html(report, out / 'report.html')
            print(out / 'report.html')
            return 2 if qa['errors'] else 0
        return 0
    except (EngineError, ValueError, KeyError, TypeError, OSError) as error:
        print('ERROR:', error, file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
