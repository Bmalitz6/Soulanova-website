# SoulStrength local preview and tracking readiness

## Preview scope

This is an isolated, uncommitted preview on `preview/soulstrength-foundation-mobile` based on the existing Soulanova mobile project. The companion website review is on `preview/soulstrength-foundation`.

- Local interactive website preview: [http://127.0.0.1:8788/strength-preview/](http://127.0.0.1:8788/strength-preview/) (available while the local preview server remains running).
- Native preview implementation: `mobile-app/StrengthPreviewScreen.tsx` in the mobile preview worktree. Android export completed successfully; generated bundle output remains outside the repository.

- Strength art comes from the existing website card asset `app/images/workouts/strength.jpg` (alt text: “Strength instructor in the Soulanova studio”). The mobile tile and screen refer to that same approved Strength image. No Tai Chi image or instructor media was copied or modified.
- The catalog remains 38 distinct movement IDs in Chest, Back, Shoulders, Biceps, Triceps, Legs, Core, and Full Body. Pullover, reverse fly, and renegade row are single entries with multiple category tags.
- Beginner, Intermediate, and Advanced are selectable. Full body, Upper / Lower, Body-part split, and editable Custom routines remain available. Most movements default to three sets of ten; catalog exceptions retain their lower rep or timed-hold ranges.
- Each set captures actual reps or hold seconds, dumbbell load in pounds, RPE 1–10, and an explicit member-entered controlled-form confirmation. The prior load is read only from prior local preview sessions.
- Workout date, elapsed duration, progress, a 75-second skippable rest countdown, pause/resume, recap, and start-new flow are included.
- A small optional 2.5 lb increase is suggested only after two prior completed local sessions for that movement have all planned sets at or above the target reps/hold, self-confirmed form, load entered, and RPE 8 (an approximate self-reported two reps in reserve). The app never changes weight automatically.
- Active drafts and preview recaps are stored locally with stable session/set IDs. The mobile storage key is scoped to a hash of the current signed-in profile ID (or the anonymous preview scope), so switching accounts does not surface another account’s local preview. No preview entries are sent to Supabase or shown as saved member history.
- Local storage failures keep the current in-memory workout and expose a retry control. On app backgrounding, an active mobile workout pauses and its draft is persisted; recovered drafts resume paused.

## Supabase audit

Evidence in this repository:

- The existing website member dashboard queries and inserts `public.workout_sessions` using `id`, `user_id`, `workout_name`, `category`, `duration_minutes`, and `completed_at` (`app/app.js`). Its existing remove/clear actions issue deletes.
- The Expo walking features use separate `soulwalk_sessions` and `freestyle_sessions` paths. They are not a per-set strength schema.
- Tracked SQL includes SoulWalk, SoulFuel, health-profile, SoulSafe, and freestyle-walk definitions, but no `workout_sessions` DDL/grants/policies and no strength set table or migration. The deployed `workout_sessions` column layout and grants therefore cannot be proven from this repository.
- Previously run two-account checks in this project history observed owner SELECT and INSERT succeeding on `workout_sessions`, while owner UPDATE and DELETE requests returned HTTP 403. Those results were not re-run as part of this preview. No live schema/policy query or database mutation was made here.

### Minimal additive change to review later

First run a read-only query against the deployed catalog and inspect the exact `workout_sessions` columns, constraints, grants, and policies. If the existing table still lacks an idempotency key and set details, review an additive design with:

1. A nullable-while-backfilling then `NOT NULL` `client_session_id UUID` unique per `user_id`, plus verified session fields for level, start/completion timestamps, and duration seconds. Preserve all existing workout columns and rows.
2. One `workout_session_sets` table keyed to the verified parent session ID, with `user_id`, stable `client_set_id`, exercise ID/name, set order, actual numeric value plus `reps`/`sec` unit, dumbbell load in pounds, RPE constrained to 1–10, explicit form confirmation, and creation time. Add unique constraints for user/session ID and per-session exercise/set order.
3. RLS enabled with authenticated owner-only SELECT and INSERT checks requiring `auth.uid() = user_id`; grant only the privileges required for those operations. Do not add UPDATE or DELETE grants/policies to solve a feature that can save completed immutable sessions once.
4. An authenticated transactional save path (or a reviewed RPC) that inserts the parent and sets atomically and treats a repeated client session ID as the same completed record. A retry must not duplicate a session or its sets.

This is a proposal only. No SQL file was applied, no policy or grant was changed, and the production/account write gates remain off. The exact SQL depends on the read-only deployed schema inspection and explicit approval.

## QA performed

- Browser-based web preview at 390 px and 1280 px: document width matched viewport; Strength instructor image loaded; 38 unique movement cards/eight categories verified.
- Browser interaction pass: all three levels select; custom routine add/remove works; invalid set without form confirmation is rejected; valid reps/load/RPE/form data logs; pause freezes time; resume works; 75-second rest and skip work; all 18 sets in the six-movement full-body routine progress and finish; recap/date/duration appear; duplicate finish does not add a second preview session.
- Offline/local recovery pass: with the page open and network disabled, a set saved to browser-local storage; pausing and reloading recovered the set as a paused draft. Simulated storage quota failure retained current input and exposed Retry; retry persisted it successfully.
- Progression pass: two completed preview-only sessions for the same movement, all sets self-confirmed at RPE 8, produced an optional 2.5 lb suggestion. The next session's load remained blank; no weight changed automatically.
- `npx tsc --noEmit`: passed.
- `npx eslint StrengthPreviewScreen.tsx App.tsx`: passed.
- `npx expo export --platform android`: passed.
- Full `npx expo lint`: currently fails on 31 pre-existing errors in `FreeWalkScreen.tsx`, `SoulWalkScreen.tsx`, `SoulSafe.tsx`, and `SoulFuelScreen.tsx`; it reports no issue in the changed Strength screen/App entry. Its automatic Expo setup edits were removed from this preview.
- Expo web export was not available because the existing package does not include `react-dom` and `react-native-web`; no dependencies were added. The website preview itself was tested in Chrome at desktop and mobile sizes.
- No iOS Simulator or Android device was available: CoreSimulatorService was disconnected and `adb devices` returned no devices. Native visual/device and interruption testing remains outstanding; the Android bundle export and TypeScript checks are build-level validation only.

## Release blockers and safe next steps

1. Keep Strength account saves/history disabled until the deployed schema, RLS/grants, cross-account isolation, and idempotent completed-session save have been verified in a disposable test environment.
2. Review and approve any additive migration/RPC before applying it. Do not enable broad owner UPDATE/DELETE permissions.
3. Test the native screen on a booted iOS simulator and Android device, including process termination and storage recovery. Test account switching with two existing test accounts without using production member writes.
4. After those checks and separate release approval, wire a narrowly scoped save gate to the verified columns/RPC; retain the local preview as a distinct storage namespace.

No production website deployment, Supabase changes, member-data writes, or paid media generation were performed.
