# SoulWalk treadmill training preview QA — 2026-11-02

## Scope

Added a treadmill mode to the existing 12-week SoulWalk experience on `preview/integrated-web-readiness-v2`. Outdoor Walk remains available with GPS only when the user enables it. Treadmill mode does not request or calculate GPS distance. Optional Beginner, Intermediate, and Advanced recommendations display current and next phase speed/incline ranges. They are guidance only; the page never controls treadmill hardware. User-entered actual treadmill distance, average speed, average incline, and steps are distinguished from outdoor GPS estimates.

The existing week durations, milestones, narration files, history display, dashboard, Meditation, Tai Chi, and SoulFuel content are unchanged. No audio was generated or replaced. Existing approved walk cues remain as-is; the recorded voice option is Serene, while the device voice is a browser fallback. There are no new Benjamin treadmill-specific recordings in this change.

## Validation

- Pure-module checks passed for all 12 durations, all 12 level/phase recommendation pairs, phase boundaries across all weeks, and account-change state reset.
- Browser smoke passed on desktop and a 390px mobile viewport.
- Browser smoke verified Beginner, Intermediate, and Advanced current/next values; all 12 existing weeks; warm-up → steady → brisk → cool-down → completed transitions; actual treadmill readings in the summary; and mode lock while a walk is active.
- Treadmill start kept GPS hidden and unchecked and made zero geolocation `watchPosition` calls. No non-GET API requests occurred.
- The completed-walk save control remained disabled. No Supabase writes, schema/policy changes, or test records were made.
- Account-switch reset behavior passed the pure state-helper test. A live authenticated browser account-switch test was not repeated as part of this local UI smoke.
- JavaScript syntax checks and `git diff --check` passed.

## Release constraints

Account-backed walk saves remain disabled pending the previously requested Supabase validation. Treadmill fields are held on the current page/session only and are not persisted to an account. This change does not add database columns or alter existing permissions. Current spoken cues are preserved, but treadmill speed/incline ranges are visual and do not have new Benjamin voice recordings.

This is a preview-only change. It has not been deployed to production.
