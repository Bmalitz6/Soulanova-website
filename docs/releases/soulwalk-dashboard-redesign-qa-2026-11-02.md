# SoulWalk dashboard redesign preview QA — 2026-11-02

## Reference and assets

The approved reference was located at `~/Downloads/SoulWalk 12-Week Wellness Dashboard.png` (1672 × 941; SHA-256 `1844fffc6840b5d7dc662b0f0d2d6f7a9740599466b1f79cb7ff406a4dfdc3c9`). It was inspected and used as a visual guide for the scenic hero, premium cream/teal/sage palette, rounded workout control center, compact week navigation, countdown, progress visualization, and history cards. It is not embedded in the page. A clean text-free scenic hero asset, `assets/images/soulwalk-scenic-hero.png`, supplies the landscape artwork; live HTML, CSS, and JavaScript render all controls and member data. Mockup/example statistics are not used as member data.

## Implementation

- Reworked `app/walking/index.html` into a branded scenic hero, cream/teal/sage palette, rounded setup and timer panels, compact 12-week selector, treadmill level chips, phase guidance, live timer milestone path, and member history/progress cards.
- Reused existing week selection, outdoor/treadmill logic, optional speed/incline recommendations, manual readings, GPS gating, timer, narration toggle/assets, and authenticated account history.
- Desktop uses a setup/timer two-column layout. Mobile stacks setup and the timer ahead of history without horizontal overflow; the 12 week choices fit in a compact grid.
- History totals, week progress, and walk cards continue to be built only from the signed-in member's queried rows. Empty/loading/error states remain explicit; no illustrative progress was inserted.
- Start, pause, and resume labels reflect the actual timer state. The single countdown and milestone visualization use existing phase/cue boundaries.
- Supabase save gate remains `false`; no writes, schema or policy changes were made. Existing audio files were preserved. The installed UI identifies the recorded coach as Serene; no Benjamin-specific files were added or relabeled.

## Validation

- Desktop and 390px mobile Chrome visual and interaction checks passed. The final mobile run reports a 390px viewport and document width, with no overflowing elements; setup and timer appear before history, and the 12-week selection remains compact. This caught and fixed a hidden mode-radio input that had extended the document width.
- All 12 week durations were verified: 15, 17, 19, 21, 23, 25, 28, 30, 33, 36, 38, and 40 minutes.
- Beginner, Intermediate, and Advanced current/next guidance matched all requested ranges.
- Outdoor mode exposed GPS and invoked its watch when enabled. Treadmill mode hid/cleared GPS and made no geolocation call.
- Start, pause, resume, phase progression, milestone progress, voice cue toggle, entered treadmill distance/speed/incline/steps, and summary display passed. Treadmill Save remained disabled.
- No non-GET API calls were observed. Existing account-specific queries remain filtered by the authenticated member ID; account-change reset behavior passes the existing helper check.
- JavaScript syntax checks and `git diff --check` passed.

## Remaining note

The existing recorded coaching voice is identified in the application as Serene; this redesign preserves the approved audio and does not relabel it as Benjamin or generate narration. Account-backed saves remain disabled pending Supabase validation. No Supabase schema, policy, production code, or production deployment was changed.

Preview only. Production and database configuration were not changed.
