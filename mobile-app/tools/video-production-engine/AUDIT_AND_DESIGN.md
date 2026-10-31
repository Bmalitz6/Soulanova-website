# Production audit and V1 design

## Existing local material

Read-only audit of `~/Documents/Soulanova/Soulanova-website`, the sibling production checkout, plus existing Downloads assembly kits. No file in that checkout or the mobile application was edited. Several production assets are untracked in their original checkout; preserving this engine in Git does not back up those masters. Approval must be established per revision, not inferred from a filename alone.

The local-only `audit/media-inventory.json` records 163 local media files with relative paths, durations, dimensions and audio streams: 29 production-master directory files (26 distinct approximately 105-second movement candidates plus backups/derivatives), 40 review exports, 66 bow assets and 28 top-level narration/music files. The inventory remains excluded from Git and EAS; it is not distributed with the reusable engine or treated as an approval register.

Movement candidates in the production-master directory cover IDs 005, 009, 010, 011, 012, 014, 015, 016, 017, 018, 019, 020, 021, 022, 023, 026, 027, 028, 030, 031, 033, 034, 035, 036, 037 and 038. Some older reviews explicitly remain review-only. The website checkout and mobile feature worktree expose different subsets; V1 does not alter either player or their content mappings.

Existing `tools/soulanova_video_builder.py`, `_v2.py` and `_v3.py` provide useful standalone assembly patterns. V3 uses 7-second opening / 105-second movement / 8-second closing, separate narration/music, PNG timer overlays, and optional ending chimes. Its class-ready mode exports a single movement rather than assembling a full class. Its `tpad` cloned-frame tail can conceal a source shortage; V1 refuses insufficient frames instead. Automatic 005 bow reuse cannot establish appropriate labels for other lessons. Some historical production/download scripts contain temporary signed remote URLs; they were not copied into the engine or executed. V1 contains no download or generation step.

Several raw narration packages and timed 120-second tracks already exist. Some timed tracks have cues around 0, 15, 38, 62, 87 and 111 seconds. These are standalone schedules, not validated ten-minute class narration. Reusing the full track between movements would repeat introductions/farewells. Human listening and selection of movement-only cues are required; no speech was regenerated.

## Proof of concept provenance

| Role | Existing source | Selection |
| --- | --- | --- |
| Approved movement | `~/Downloads/Soulanova_005_Brush_Knee_Bow_Assembly_Kit/Brush_Knee_105sec_APPROVED.mp4` | First 105 seconds; 864×480, silent, existing baked timer |
| Opening | `~/Documents/Soulanova/Soulanova-website/app/videos/bows/Soulanova_005_Opening_Bow_FINAL_REVIEW.mp4` | Complete 7 seconds, real moving instructor, existing 005 title |
| Closing | Same bow directory, `Soulanova_005_Closing_Bow_FINAL_REVIEW.mp4` | Complete 8 seconds, existing 005 title |
| Narration | `app/tai-chi-audio/Brush_Knee_005_Benjamin.mp3` in the website checkout | Complete existing 115.900952-second recording starting at zero |
| Music | `app/tai-chi-audio/Soulanova_Soft_Piano.mp3` in that checkout | First 120 seconds of existing 600-second bed |

The kit explicitly identifies the movement as approved, and the existing V3 workflow uses the matching 005 final-review bows. This provenance is recorded as an attestation in the example; it does not replace final editorial approval of the new assembly. The differently encoded `Soulanova_005_Brush_Knee_CLASS_MASTER.mp4` exists but was not substituted for the explicitly approved kit clip in the POC.

Output: `runs/taichi-005-v1-review/review.mp4`, exactly 120 seconds, H.264 854×480 at 30 fps, AAC stereo 48 kHz. There is no added timer, no generated footage, no chime replacement and no cloned-frame padding. The final two excess source frames are trimmed. Native 480-line movement detail does not justify a claimed 1080p review; V1 selects a consistent 480p canvas here. Native 1080p exports use the same pipeline when source quality supports them.

Source hashes were unchanged. No black, freeze or long-pause events were detected in the three video sources or final output. Narration has four long gaps, retained for breathing/practice rather than automatically removed. Piano is approximately -42 LUFS before mixing, so a derived +8 dB gain was used with narration ducking. The final AAC measures approximately -16.43 LUFS integrated and -1.33 dBTP, with no detected silence or overload warning. These measurements do not replace listening. Individual frames and the contact sheet were inspected; full uninterrupted audiovisual approval remains manual.

## Architecture and safety boundaries

1. Validate explicit local assets and approval attestations; probe streams and hash every input.
2. Compile an exact frame-aligned timeline, bound loop repetitions, resolve transition overlaps and cue positions. Reject ambiguous audio overlap and overflowing cues.
3. Scan original source video/audio; preserve findings separately in source time.
4. Render normalized intermediate clips to a new output tree. Join deliberate cuts/dissolves and controlled loops; compose explicitly scheduled audio.
5. Export review H.264/AAC, verify final streams/duration/dimensions, run output QA, hash inputs again, generate thumbnails and JSON/HTML reports.
6. Require human approval. There is no publishing, source replacement, cloud generation or website update step.

Python's standard library orchestrates subprocess argument lists, avoiding shell interpolation and new mobile dependencies. FFmpeg uses no-overwrite mode. Each run exclusively creates a directory; no existing run is replaced or cleaned automatically. Logs preserve exact commands for reproducibility. Final exports are promoted from an incomplete filename only after stream validation. Detection failures and silent required audio stop the run; heuristic visual findings are review flags rather than destructive edits.

Compared with the old single-lesson builders, V1 adds reusable manifests, source hashes, source-aware resolution, bounded loops, multi-movement assembly, cue scheduling, source/final QA, loudness measurement, thumbnails, reports and tested overwrite protection. Existing source timers/labels are retained; V1 intentionally avoids trying to rebuild approved instructor graphics.

## Ten-minute class plan and remaining editorial work

| Timeline | Movement/transition | Existing master selection |
| --- | --- | --- |
| 00:00–00:07 | Opening bow | Full 005 opening; class-neutral graphics pending |
| 00:07–01:52 | 018 Shoulder Rolls | `Soulanova_018_Shoulder_Rolls_MOVEMENT_105s.mp4`, 0–105 |
| 01:52–02:07 | Opening Wings preview | Next master, 0–15 |
| 02:07–03:52 | 021 Opening Wings | `Soulanova_021_Opening_Wings_MOVEMENT_105s.mp4`, 0–105 |
| 03:52–04:07 | Playing with Waves preview | Next master, 0–15 |
| 04:07–05:52 | 027 Playing with Waves | `Soulanova_027_Playing_with_Waves_MOVEMENT_105s.mp4`, 0–105 |
| 05:52–06:07 | Brush Knee preview | Next master, 0–15 |
| 06:07–07:52 | 005 Brush Knee | `Soulanova_005_Brush_Knee_CLASS_MASTER.mp4`, 0–105 |
| 07:52–08:07 | Playing the Lute preview | Next master, 0–15 |
| 08:07–09:52 | 014 Playing the Lute | `Soulanova_014_Playing_the_Lute_MOVEMENT_105s.mp4`, 0–105 |
| 09:52–10:00 | Closing bow | Full 005 closing; class-neutral graphics pending |

Master paths above are relative to `app/videos/production_masters` in the production checkout. The draft manifest pins the five inventoried master hashes and deliberately blocks rendering until approvals are supplied. All five selections previously passed full decode checks. Their final class placement, natural restart after previews, technique order and narration are not automatically approved by that fact. No new instructor footage is required for a first editorial assembly; class-neutral bow labels, approved transition graphics and selected/retimed narration are still needed for a polished deliverable. Preserve approved originals and make any graphics changes in separate reviewed derivatives.

## Validation and manual sign-off

Tests use only synthetic local FFmpeg fixtures: approval/hash checks, source and output path safety, trim/loop limits, bow-label checks, narration spill/overlap, EOF freeze/black/pause detection, silent/overloaded audio, all template profiles, and a rendered miniature class with waveform-verified delayed narration. A separate native-1080p fixture exercises actual 1920×1080 delivery. No tests call remote services or paid tools.

Before delivery, watch the full POC and listen on headphones and speakers. Confirm bow alignment, safe complete movement, baked timer progression, source softness/letterboxing, voice/music balance and every narration cue. For later classes, review each loop and transition at normal speed, confirm intentional holds, approve class-specific labels and bridge narration, and obtain instructor/content-owner sign-off. Detector thresholds can miss subtle freezes, repeated but moving footage, anatomy artifacts or off-center problems. Captions, accessibility review and final delivery approval remain separate work.
