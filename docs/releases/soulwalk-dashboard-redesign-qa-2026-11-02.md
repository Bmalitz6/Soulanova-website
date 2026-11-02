# SoulWalk dashboard redesign preview QA — 2026-11-02

## Reference and assets

The approved reference was located at `~/Downloads/SoulWalk 12-Week Wellness Dashboard.png` (1672 × 941; SHA-256 `1844fffc6840b5d7dc662b0f0d2d6f7a9740599466b1f79cb7ff406a4dfdc3c9`). It was inspected and used as a visual guide for the scenic hero, premium cream/teal/sage palette, rounded workout control center, compact week navigation, countdown, progress visualization, and history cards. It is not embedded in the page. A clean text-free scenic hero asset, `assets/images/soulwalk-scenic-hero.png`, supplies the landscape artwork; live HTML, CSS, and JavaScript render all controls and member data. Mockup/example statistics are not used as member data.

## Implementation

- Reworked `app/walking/index.html` into a branded scenic hero, cream/teal/sage palette, rounded workout panels, compact 12-week selector, prominent Beginner/Intermediate/Advanced segmented treadmill selector, phase guidance, live timer milestone path, and member history/progress cards.
- Reused existing week selection, outdoor/treadmill logic, optional speed/incline recommendations, manual readings, GPS gating, timer, narration toggle/assets, and authenticated account history.
- Before a walk, the page focuses on mode, treadmill-only level, week, duration, Voice Guide, and Start Walk. During and after the walk, it focuses on the countdown, phase, current/next treadmill guidance, progress and Pause/Resume or Start New Walk controls. Optional readings and member history remain below the workout controls.
- A single Voice Guide toggle is the only audio control. The existing recorded cue files are used by default; device speech is an internal fallback. No voice list/dropdown is exposed.
- Desktop and 390px mobile layouts keep essential controls accessible; both the mobile pre-walk Start button and active-walk countdown/Pause button fit within the initial viewport without horizontal overflow.
- History totals, week progress, and walk cards continue to be built only from the signed-in member's queried rows. Empty/loading/error states remain explicit; no illustrative progress was inserted.
- Start, pause, and resume labels reflect the actual timer state. The single countdown and milestone visualization use existing phase/cue boundaries.
- Supabase save gate remains `false`; no writes, schema or policy changes were made. Existing approved recorded cue files and the internal device-speech fallback are preserved.

## Validation

- Desktop and 390px mobile Chrome visual and interaction checks passed. The final mobile run reports a 390px viewport and document width, with no overflowing elements; the pre-walk Start button, active countdown, Pause/Resume and compact 12-week selection were verified. This caught and fixed a hidden mode-radio input that had extended the document width.
- All 12 week durations were verified: 15, 17, 19, 21, 23, 25, 28, 30, 33, 36, 38, and 40 minutes.
- Beginner, Intermediate, and Advanced current/next guidance matched all requested ranges.
- Outdoor mode exposed GPS and invoked its watch when enabled. Treadmill mode hid/cleared GPS and made no geolocation call.
- Pre-walk setup and active-walk state transitions, start/pause/resume, current/next phase display, phase progression, milestone progress, single Voice Guide toggle, entered treadmill distance/speed/incline/steps, and completion summary passed. The voice dropdown is absent; treadmill Save remains disabled.
- No non-GET API calls were observed. Existing account-specific queries remain filtered by the authenticated member ID; account-change reset behavior passes the existing helper check.
- JavaScript syntax checks and `git diff --check` passed.

## Remaining note

The existing approved cue recordings and internal device-voice fallback are preserved; no voice choice is presented to members. Account-backed saves remain disabled pending Supabase validation. No Supabase schema, policy, production code, or production deployment was changed.

Preview only. Production and database configuration were not changed.
