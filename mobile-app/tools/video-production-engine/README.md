# Soulanova Video Production Engine V1

Local, manifest-driven review production. Python standard library plus FFmpeg/ffprobe; no network service, generation credits, application dependencies or publishing. Original videos and audio are read only. This tool is independent of Expo and the website.

## Requirements and quick start

Python 3.9+ and an FFmpeg build with libx264, AAC, freezedetect, blackdetect, silencedetect, loudnorm, sidechaincompress and xfade. Tested locally with Python 3.9.6 and FFmpeg 9.0.2. It does not install software automatically.

From `mobile-app`:

```sh
python3 tools/video-production-engine/engine.py templates
python3 tools/video-production-engine/engine.py validate tools/video-production-engine/examples/taichi-005.json
python3 tools/video-production-engine/engine.py render tools/video-production-engine/examples/taichi-005.json --output-dir tools/video-production-engine/runs/brush-knee-review-002
python3 tools/video-production-engine/engine.py inspect /absolute/path/to/master.mp4 --expected-audio silent --output-dir tools/video-production-engine/runs/master-inspection-001
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tools/video-production-engine/tests -v
```

Use a **new output directory for every run**. Existing output directories are refused, including failed runs. Output directories must be outside the source directories. A default-deny Git/EAS allowlist includes only this engine, its tests, documentation and four reviewed examples. Everything else here—including `runs/`, `local/`, the machine-specific audit inventory, media, credentials, logs, temporary files and Python caches—is excluded. Keep local manifests with private paths in `local/`. Do not force-add excluded files. These rules apply to this tooling directory; keep source media in its existing external library or ignored local storage. Logs contain local file paths and commands, so inspect them before sharing.

The completed POC is `runs/taichi-005-v1-review/review.mp4`; open the adjacent `report.html` for playback, findings and the contact sheet. The run also has JSON reports, the resolved timeline, nine thumbnails and FFmpeg command/log pairs. `_work/` retains intermediate exports for troubleshooting. Outputs remain local.

## Manifest contract

`examples/taichi-005.json` is the working two-minute example. `asset_root` resolves `~` and environment variables; relative roots resolve against the manifest. `--asset-root` overrides the root. Media must be existing local files, not URLs or playlists. No manifest-supplied shell commands or FFmpeg filters execute.

| Field | Behavior |
| --- | --- |
| `version`, `template` | Version 1; `tai_chi`, `strength` or `stretching`. Profiles provide editorial guidance and consistent defaults, not exercise expertise. |
| `assets` | Each asset requires `path`, `approved: true` and a meaningful `approval_note`. Optional `sha256` pins the approved revision. Flags record an operator's attestation; the engine cannot establish approval or ownership. |
| `expected_audio` | `required`, `silent` or `optional`. Silent video is normal for these masters; required missing/silent narration fails QA. |
| `lesson_id`, `baked_timer` | Identify existing bow labels and timers. Mismatched bow labels require a deliberate segment-level `allow_bow_label_mismatch: true`, with a report warning. Baked graphics remain in place. |
| `segments` | Ordered clips with unique `id`, `asset`, `kind`, `source_in`, `source_out` in seconds. Source bounds are checked. Optional `duration` shortens the selection or requests an explicit loop. |
| `loop` | Required when duration exceeds selected footage: `max_repeats` (2–32) and optional `crossfade` (seconds). Repetitions are bounded. No cloned-frame padding is used. Review every seam for natural motion. |
| `transition_in` | Default cut. `{"type":"dissolve","duration":0.5}` blends adjacent clips and **subtracts** 0.5 seconds from the timeline. All timeline durations must align with the chosen output frame rate. |
| `narration` | Audio cues with `asset`, optional source trim/gain, and either absolute `at` or `segment` plus `offset`. Cue duration must fit the class. Accidental overlaps fail; `allow_overlap: true` explicitly acknowledges a planned overlap. |
| `music` | One existing bed: `asset`, optional `source_in`, `gain_db`, `fade_seconds`, `duck`. Must cover the whole class. No implicit infinite music loop. |
| `expected_duration` | Optional exact timeline assertion; catches transitions or trims changing class length. |
| `expected_holds` | Absolute output `start`, `end`, `reason` annotations for intentional stillness. They annotate findings without suppressing detections. Source findings remain in source time. |
| `output` | `resolution` auto/480p/720p/1080p, `fps` 24/25/30/50/60, `crf` 10–30, encoding `preset`, `normalize_audio`, `audio_required`. |
| `qa` | Optional overrides for the detector thresholds described below. |

Embedded video audio is omitted deliberately. Add explicit cues for any audio to retain, avoiding doubled narration. Mixing resamples to 48 kHz stereo, aligns cues, applies music ducking and peak limiting. Optional two-pass loudness processing targets -16 LUFS and -1.5 dBTP; the report measures the final AAC output because encoding and dynamics can alter those values. This is a review mix, not an audio mastering certification.

`auto` selects 1920×1080 only when every used video is at least that resolution, otherwise 1280×720 for sources at least 1280×704, otherwise 854×480. Lower-resolution sources are padded rather than enlarged by default. `effective_height` can disclose previously upscaled material and lower the selection. Forced 1080p from weaker material requires `allow_upscale: true`; this creates no detail. HDR and rotated inputs are refused pending a separately reviewed conversion. Preserve full-body framing; no automatic cropping of the exported instructor occurs.

## QA and editorial review

Every source and final output is scanned. SHA-256 hashes before and after rendering confirm that input files remain unchanged. Decode failures, missing required audio, wholly silent required audio, invalid trims, uncontrolled loops and final duration/dimension errors fail the run. Failed runs retain logs and a failure report. Successful status is always `needs_manual_review`.

Default review detectors:

| Finding | Default |
| --- | --- |
| Possible frozen image | Central half-width motion ROI; 2 seconds at -50 dB difference |
| Possible long pause | Central half-width low-motion ROI; 4 seconds at -35 dB difference |
| Black interval | Full frame; ≥0.15 seconds, ≥98% black pixels |
| Audio silence | ≥5 seconds below -50 dB |
| Very quiet audio | Integrated loudness below -32 LUFS |
| Possible peak overload | True peak ≥-0.1 dBTP |
| Stream timing mismatch | Audio/video durations differ by >100 ms |

Threshold keys: `freeze_seconds`, `freeze_noise_db`, `pause_seconds`, `pause_noise_db`, `black_seconds`, `black_ratio`, `silence_seconds`, `silence_db`. Motion ROI avoids many static borders and side panels; its suitability depends on instructor placement. Backgrounds, timers, subtle movement and letterboxing can still cause missed detections or false positives. Decode warnings are surfaced for review. No detected interval is removed automatically.

Watch every frame and listen to the entire review before delivery. Check anatomy, motion continuity, full-body framing, safe technique, narration meaning and alignment, music balance, bow labels, baked timer behavior, graphics and source quality. Software cannot verify beginner suitability, count repetitions reliably, transcribe/approve narration, certify an approved revision or remove baked text. No speech recognition, replacement footage, replacement speech, captions, title rendering or website integration is included in V1.

## Classes and future templates

The same renderer assembles multiple movements, bows, previews, loops, transitions and cue tracks into one timed class. An integration test actually renders a miniature complete class with a loop, dissolve and delayed narration, and verifies audio onset and source integrity.

`examples/taichi-foundations-10min.draft.json` records the proposed 600-second timeline: 7-second opening + five 105-second practices + four 15-second next-movement previews + 8-second closing. Its approval flags deliberately remain false. It lacks approved class-specific narration, transition titles and class-neutral bow labels, and is **not a completed or delivery-approved class**. Do not enable approval flags simply to make validation pass. Current preview entries repeat the next movement's first 15 seconds, then restart its full practice; this requires editorial acceptance. Cue selection should omit standalone welcomes/farewells between movements.

`strength.template.json` and `stretching.template.json` deliberately require replacement paths and approval. The common pipeline supports their timing, cues, rests and holds; exercise selection and safety remain instructor decisions. Strength-specific repetition counting and Stretching-specific posture analysis are outside V1.

See [AUDIT_AND_DESIGN.md](AUDIT_AND_DESIGN.md) for the asset audit, provenance, design choices and POC findings.
