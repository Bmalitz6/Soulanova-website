# SoulStrength approved interface restoration

## Authority and comparison

Baseline: `75bd4d5d4efabf0d8df8c101b878f010fa9d30a8`, Session 3 feature branch `feature/soulfuel-clean-preview-2026-11-09`. The baseline used the small shared catalog renderer: plain text cards, a level dropdown, no approved exercise/level imagery, and only simple plan details.

Authoritative website UI: `6b412af05ed662f8550599887877b80c7cc841d5`, branch `release/soulstrength-production-2026-11-08`. The project master handoff's **SoulStrength website Production release — 2026-11-08** section explicitly records this exact commit as the owner-authorized release, deployed from the isolated website SoulStrength candidate. This is approval evidence, not inference from a branch name, date or filename. That release was inspected read-only; nothing was promoted or modified in Production during this task.

The handoff's November 6 **Approved exercise thumbnails**, **SoulStrength landing focus update**, **Final SoulStrength landing refinements**, and subsequent **approved SoulStrength landing UI** audit document the improved icons and organization. The latest verified website release contains the richer hero, workout-image cards, equipment/rest detail panels and the same icon assets. Later protected-preview initialization fixes do not supply a different visual asset set. The website stylesheet is also identical in the inspected November 9 SoulStretch source branch. No newer owner-authorized Strength UI was established beyond this source.

Read-only sources included the website candidate Git history, Release_2_Website_Review branches, mobile `SoulStrengthScreen.tsx` / `strengthWorkoutThumbnails.ts`, and Desktop Strength Production Tracking manifests. Mobile source was not edited or used to infer a new video approval.

## Restored UI and assets

Restored from the exact source object using `git show`, not its dirty working tree:

- Original website `index.html`, `strength.css`, `strength.js`, `strengthWorkouts.json`, `strengthPlayback.js` and pure `strengthProgress.js` helpers, with the runtime safety adaptations below.
- The approved male-instructor hero; 17 exercise/workout thumbnails; three difficulty icons (Beginner Goblet Squat, Intermediate Incline Dumbbell Press, Advanced Shoulder Press).
- Hashes for all 17 exercise icons and all three level icons match `Desktop/Soulanova/10 Strength/05 Production Tracking/SOULSTRENGTH_WORKOUT_THUMBNAILS.csv` and `SOULSTRENGTH_LEVEL_THUMBNAILS.csv`.
- Original 36 workout plans, 12 at each level, original names, exercise IDs/order, sets, repetitions, rest prescriptions and instructions. Each workout's thumbnail is an exercise actually in that plan. Duplicate display names such as Incline Dumbbell Press remain distinguished by exact ID.
- Image-based workout cards, the established three-level organization, existing equipment/rest detail UI, and the approved compact Exercise Reference pattern. Three existing level icons are exposed in the web tabs; no replacement icon or instructor was generated. Existing thumbnails are also shown beside detail/reference exercises.

`SOULSTRENGTH_6B412AF_SOURCE_HASHES.json` lists all 27 source files and hashes. The original stylesheet, plan catalog, helpers and 21 still assets remain byte-identical. `index.html` and `strength.js` have narrow integration changes. `strength-integration.css` adds approved-icon sizing, responsive/reference styling, touch targets and readable contrast; it does not redesign Overview or other programs.

## Media and history boundaries

The source's historical release authorization is **not** used to relax today's final-master restrictions. Playback is authorized only through the existing Session 3 metadata and `SoulanovaPrograms.media` allowlist. The richer UI catalog does not itself authorize media requests.

Enabled final masters remain exactly:

- STR-114 — Dumbbell Squeeze Press.
- STR-053 and STR-112 — the two existing Incline Dumbbell Press mappings.
- STR-061 — Reverse Shoulder Press.
- STR-115 — Shoulder Press.

All twelve historically reviewed clips remain unavailable pending final-master confirmation. Their previously approved still icons may be shown; showing a still does not promote the corresponding video. Full guided-session Start remains disabled, including after changing rest settings, because it would otherwise enter unapproved media/segment paths. Warm-up/cooldown playback and narration were not enabled. This release restores the verified interface, not permission to play all 36 plans end-to-end.

The old automatic history reads/writes/retries/sync entry points are disabled. No localStorage history access or database `.from`/`.insert` call remains in the runtime adapter. Progress is explicitly labeled paused, with no invented completion counts or recommendations. No member history, subscription, schema, backend grant, auth provider or credential was changed. The existing verified non-anonymous session is reused, with pending selections/media cancelled on account change. Logo/Back return to Overview. Overview's Strength destination remains `/app/strength/`.

No large media file was copied, renamed, moved or deleted. All added binary assets are the original small still images. Existing public video URLs and current pinned hashes are preserved.

## Validation and evidence

- Full regression/security/browser suite; catalog counts, level assignments, source pins, exercise/image mappings, final-master allowlist, disabled guided Start and no-history-write guards.
- Browser navigation, icon presence, keyboard level navigation, equipment/rest details, exact STR-112 icon mapping, accessibility and no-overflow review at desktop 1280px, 390px and 320px.
- Actual Google Chrome playback through the restored interface passed for **all five** enabled masters; each advanced beyond 0.3 seconds with decoded video dimensions and no media error. This used a disposable mocked member session and real hosted media, with no history keys written. No physical-device or full guided-session completion is claimed.
- Screenshot evidence and release logs are retained under `.git/soulstrength-approved-ui-evidence/`.
- The entire approved SoulStretch subtree (24 programs, 22 videos, Miriam files, thumbnails and player) must match the starting commit exactly. Tai Chi, Meditation, Yoga, SoulFuel, Overview artwork, FoodScore gate and Redis configuration are unchanged.

## Outstanding approvals

No further UI-source approval is required for the recovered version identified above. Final-master designation of the twelve historical clips and reconciliation of full warm-up/cooldown media are still required before enabling complete guided workouts. Physical iPhone/Safari/AirPlay acceptance remains outstanding. This task does not change subscriptions, member storage, sync or Production.
