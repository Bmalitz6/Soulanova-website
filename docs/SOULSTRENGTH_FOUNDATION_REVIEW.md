# SoulStrength foundation — design and inventory review

**Preview branch:** `preview/soulstrength-foundation`
**Base:** production `main` at `1b09f3e`
**Scope:** local design and exercise-inventory review only. No production page, media, Supabase table, policy, member record, or release has been changed.

## Inventory finding

The current preview preserves its 38-entry dumbbell movement inventory across eight categories. Each canonical movement has a stable ID; shared-tag entries remain a single unique movement.

Repeated movements use one canonical exercise identity with multiple category tags:

- Dumbbell Pullover: Chest + Back
- Reverse Fly: Back + Shoulders
- Renegade Row: Back + Core + Full Body

These are not duplicate cards in the unique movement count. The preview contains 38 unique IDs.

## Routine definitions

All templates are suggestions and editable. Default prescription is 3 sets × 10 controlled reps. Use lighter weights, fewer repetitions, or a comfortable range as needed. The preview does not auto-adjust load.

| Template | Suggested weekly pattern | Example sequence |
| --- | --- | --- |
| Full body | 2–3 nonconsecutive days | A: Goblet Squat, Floor Press, One-Arm Row, Romanian Deadlift, Seated Overhead Press, Dead Bug. B: Step-Up, Incline Press, Chest-Supported Row, Glute Bridge, Lateral Raise, Suitcase March. C: Split Squat, Chest Fly, Bent-Over Row, Calf Raise, Hammer Curl, Weighted Dead Bug. |
| Upper / Lower | 4 days with recovery between repeated regions | Upper A: Bench Press, Chest-Supported Row, Overhead Press, Alternating Curl, Triceps Extension. Lower A: Goblet Squat, RDL, Split Squat, Calf Raise, Dead Bug. Upper B: Incline Press, One-Arm Row, Lateral Raise, Hammer Curl, Kickback. Lower B: Step-Up, Glute Bridge, Reverse Lunge, Sumo Squat, Suitcase March. |
| Body-part split | 3–5 days, with recovery days | Day 1 Chest/Triceps; Day 2 Back/Biceps; Day 3 Legs/Core; optional Day 4 Shoulders/Full Body. Select exercises from those tags; compound shared-tag movements appear once in a routine. |
| Custom | User chooses days, categories, exercises and work/rest | The user can reorder, remove, or add movements and edit sets/reps/rest. |

### Level adaptations

- **Beginner:** stable positions, supported rows where possible, lighter load, deliberate tempo and longer rest; show chair/wall-supported alternatives.
- **Intermediate:** standard controlled range and user-selected load; keep rest adjustable.
- **Advanced:** optional unilateral or compound variations; challenging movements stay at 3 × 6–8 or 3 × 5 per side when a 10-rep set would compromise control.

No level prescribes a weight. The app can offer a modest next-smallest increment only after the user reports two technically sound, comfortable sessions. The user must accept the suggestion manually.

## Workout runner and data safeguards

The preview runner has a one-movement-at-a-time sequence, visible rest timer, per-set reps or hold duration, load in pounds, RPE, user form confirmation, and recap. A completed-session summary is shown only for sets entered by the user. No sample history or fabricated progress is included.

For this preview, workout drafts and recaps stay in local preview storage and are not sent to Supabase. The mobile storage namespace is scoped per sign-in. The release implementation must verify deployed storage, constraints, grants and row policies before any account writes are enabled. Authentication remains the existing Soulanova sign-in flow.

## Media and narration plan (no generation started)

1. Reuse only approved Soulanova instructors, wardrobe, studio and framing references once the Strength reference set is identified. No Tai Chi video is to be repurposed as Strength footage.
2. Inventory approved footage by the 38 canonical IDs; capture complete safe range, both sides for unilateral work, stable dumbbell grip, full-body view where form needs it, and clean start/end holds.
3. Record one concise Benjamin setup cue and one form/breathing cue per movement where suitable existing narration is unavailable. Add a light-effort alternative for demanding moves. Avoid repeated introductions in circuits.
4. Audio recording brief template: “Set your feet [stance]. Keep the weight comfortable. Breathe out as you [effort], and return slowly as you breathe in. Keep your joints soft and stay within a comfortable range. If this feels demanding, [alternative].” Customize biomechanics per movement and have a qualified reviewer approve technique copy.
5. No paid video/audio generation, synthesis, or production replacement is authorized by this review.

## QA plan before any production release

- Verify exactly 38 unique exercise IDs; verify the three shared-tag movements appear once in search/results.
- Exercise alternatives, one- and two-sided entry, carry duration, per-set rest, load units, RPE and user-controlled progression confirmation.
- Test full-body, upper/lower, body-part split and custom plans at all three levels, plus restart, pause, skip and session completion.
- Confirm mobile 390 px and tablet/desktop layouts, keyboard/screen-reader labels, no horizontal overflow, and essential controls reachable without scrolling in the active workout.
- Verify recovery/rest reminders, breathing and comfortable-range cues; no rigid weight prescription or automated load update.
- Verify existing auth, logout/account switching and member isolation before account persistence is enabled. Use isolated test accounts only; do not modify production data or schema without authorization.
- Audit media identity, instructor/studio consistency, full-body framing, technique, loops, narration timing, audio levels, captions and error/loading/offline states.
- Regression-check SoulWalk, SoulFuel, SoulSafe, Meditation, Tai Chi Foundations, corrected 014, published lessons, watch target and sign-in flows.

## Review files

- `strength-preview/index.html` is a responsive, local-only workout preview with the 38-movement inventory, editable custom plan, per-set tracking and a local recap. It contains no account data and makes no Supabase writes.
- `docs/SOULSTRENGTH_NARRATION_DRAFTS.md` contains human-recording cue drafts; no voice generation or new recording was started.
- `docs/SOULSTRENGTH_TRACKING_READINESS.md` records the schema/RLS gap, local storage behavior, QA, and release blockers.
- No Vercel or production deployment has been made.
