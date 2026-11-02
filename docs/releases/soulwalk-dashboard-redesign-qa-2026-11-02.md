# SoulWalk dashboard redesign preview QA — 2026-11-02

## Reference and assets

The requested `soulwalk_12_week_wellness_dashboard.png` was not present in `~/Downloads` or the project when checked. The user was asked to add it to the project; the preview was built from the written design brief while waiting. Existing approved Soulanova logo and cardio image assets provide the branded hero. No new image generation or paid asset use occurred.

## Implementation

- Reworked `app/walking/index.html` into a branded scenic hero, cream/teal/sage palette, rounded setup and timer panels, compact 12-week selector, treadmill level chips, phase guidance, live timer milestone path, and member history/progress cards.
- Reused existing week selection, outdoor/treadmill logic, optional speed/incline recommendations, manual readings, GPS gating, timer, narration toggle/assets, and authenticated account history.
- Desktop uses a setup/timer two-column layout. Mobile stacks setup and the timer ahead of history without horizontal overflow; the 12 week choices fit in a compact grid.
- History totals, week progress, and walk cards continue to be built only from the signed-in member's queried rows. Empty/loading/error states remain explicit; no illustrative progress was inserted.
- Start, pause, and resume labels reflect the actual timer state. The single countdown and milestone visualization use existing phase/cue boundaries.
- Supabase save gate remains `false`; no writes, schema or policy changes were made. Existing audio files were preserved. The installed UI identifies the recorded coach as Serene; no Benjamin-specific files were added or relabeled.

## Validation

- Desktop and 390px mobile Chrome smoke passed. Mobile document width stayed at 390px, and setup/timer appear before history.
- All 12 week durations were verified: 15, 17, 19, 21, 23, 25, 28, 30, 33, 36, 38, and 40 minutes.
- Beginner, Intermediate, and Advanced current/next guidance matched all requested ranges.
- Outdoor mode exposed GPS and invoked its watch when enabled. Treadmill mode hid/cleared GPS and made no geolocation call.
- Start, pause, resume, phase progression, milestone progress, voice cue toggle, entered treadmill distance/speed/incline/steps, and summary display passed. Treadmill Save remained disabled.
- No non-GET API calls were observed. Existing account-specific queries remain filtered by the authenticated member ID; account-change reset behavior passes the existing helper check.
- JavaScript syntax checks and `git diff --check` passed.

## Remaining note

The supplied visual reference is still needed for exact image-by-image matching. Also, the existing recorded coaching voice is labeled Serene in the application; this redesign preserved those approved recordings and did not generate or relabel a Benjamin narration track.

Preview only. Production and database configuration were not changed.
