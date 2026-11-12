# Corrective website candidate — November 11, 2026

> Current disposition: the owner attests personal creation of the performance-driving video and a wholly synthetic instructor with no real-person reference. The scoped STR-112 rights gate is satisfied and all ten runtime replacements are applied. Active exercise-demo coverage is now 12/12/12 (36/36); STR-053 stays excluded. See [final disposition and mapping report](STR_112_FINAL_RIGHTS_DISPOSITION_AND_MAPPINGS_2026-11-11.md). Earlier blocked/practice-only findings below are historical, not current status. No push or deployment.

> Strength reconciliation update: the full 36-workout library is restored locally, with original sequences. The reduced practice-only scope below is superseded by [SOULSTRENGTH_36_WORKOUT_RECONCILIATION_2026-11-11.md](SOULSTRENGTH_36_WORKOUT_RECONCILIATION_2026-11-11.md). This correction has not been pushed or deployed.

**Production remains BLOCKED; protected Preview only.** This report supersedes the pre-remediation candidate-hosting failure in the earlier audits. Starting runtime: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`; branch: `feature/soulfuel-clean-preview-2026-11-09`. The immutable delivery SHA and Preview deployment receipt are provided with the final delivery. Stable protected branch URL: https://soulanova-website-git-feature-soulfuel-clean-p-b4fcce-soulanova.vercel.app/app .

## Strength hosting correction and exact scope

The old Production artifact contained the five approved masters; the candidate did not. Absolute Production-domain mappings masked that packaging gap. All five exact masters are now in Git and in the local production-mode static artifact, under SHA-addressed same-deployment paths. Runtime playback has no dependency on the Production alias. Exact legacy-path redirects preserve continuity without duplicate video files. Original approval and filenames are preserved; no archive is moved, renamed or deleted.

| Approved ID | Exact approved clip | Packaged/hash verified |
|---|---|---|
| STR-114 | IMG_4061 — Dumbbell Squeeze Press | Yes |
| STR-053 | IMG_4059 — Incline Dumbbell Press | Yes |
| STR-112 | IMG_4058 — Incline Dumbbell Press | Yes |
| STR-061 | IMG_4048 — Reverse Shoulder Press | Yes |
| STR-115 | IMG_4044 — Shoulder Press | Yes |

Full hashes/sizes: `app/strength/approved-media.json`. Total media: 26,044,842 bytes. Exact ID/hash/path authorization rejects unapproved, external, token-bearing or altered mappings. Immutable caching applies only to these public approved media files.

Member-facing scope is **approved-movement practice**, derived from the unchanged original plans: 10 Beginner, 12 Intermediate, 12 Advanced selections. These are subsets, not 34 complete newly approved workouts. The two plans with no approved movement are hidden. Only the five approved movements appear in exercise references/playback. Original 36-plan/17-movement source data, icons, titles and prescriptions remain preserved. Twelve pending final masters, full-plan release, warm-up/cool-down and progress recording remain unavailable. The owner must accept this limited release scope or complete approvals before Production.

## SoulFuel candidate storage and privacy

The existing `nutrition_entries`/`nutrition_goals` schema, constraints, authenticated CRUD grants and ownership RLS were inspected read-only. See `SOULFUEL_MEMBER_STORAGE_REVIEW_2026-11-11.md` for exact findings and limitations. No schema/policy, auth setting or member record was changed.

`app/soulfuel/member-storage.mjs` implements the candidate adapter but is deliberately not connected to live diary writes. Default write denial occurs before a database request. The configured Supabase project is shared with Production; real cloud integration requires an isolated backend or explicit authorization for shared-backend tests and the privacy release decisions. The existing member-local diary/goals, 75 recipes and four nutrition dials remain intact. FoodScore stays disabled.

Fixture-tested safeguards: verified non-anonymous member before/after requests, ownership validation, stable IDs, concurrent-save rejection, exact readback, bounded requests, account invalidation, CRUD and goal behavior, missing values, explicit timestamps/units, partial-failure reconciliation and exact-plan/versioned consent. Migration retains all local copies and refuses conflicting existing cloud goals rather than overwriting them. Staging products are excluded. Existing server goals not present locally are preserved.

A visible diary disclosure explains unencrypted browser-only retention and shared-device risk. Logout hides local records; it does not erase them. Different browser profiles, devices and Preview origins do not share local records. A new Preview address displaying an empty diary does not prove deletion or account isolation. No cloud-sync, encryption or legal-compliance claim is made.

## Validation and evidence boundaries

**181/181 tests passed, zero failures/skips; 66/66 repository JS syntax checks passed.** Screenshots: [desktop](artifacts/remediation-2026-11-11/strength-1280.png), [390px](artifacts/remediation-2026-11-11/strength-390.png), [320px](artifacts/remediation-2026-11-11/strength-320.png). The suite covers all existing programs, exact media/scoring pins, storage faults, privacy, navigation, accessibility and desktop/390px/320px layouts. All five packaged clips decode/play/pause/seek/resume in real desktop Chrome. Guided controls and completion use isolated mocked media/auth fixtures; these are not live account-security proofs or physical iPhone playback acceptance.

`vercel build --prod` completed **locally**, using deliberately empty local environment configuration and no retrieved secrets. All five output media hashes match. This validates static/functions packaging; it is not a staged Production deployment or acceptance with live Production configuration. No npm lint/TypeScript scripts exist in this static repository; JS syntax checks and regression/build checks are applicable.

The original nine live automated passes and three owner-observed manual passes are preserved separately. Original live evidence SHA-256: `d2202fe5c5a525ae5e89c5b5cd22ce387dcd69a8a8da87982545a0997244428e`; its preserved backup matches byte-for-byte. No additional real QA walks or diary/goal writes were created. Fifteen new signed-out route checks use mocked authentication and are labeled accordingly.

## Only remaining owner acceptance, without repeating saves

1. On the existing authenticated Preview/profile, sign out normally. In new tabs, type each same-origin route directly: `/app`, `/app/walking`, `/app/strength`, `/app/stretching`, `/app/soulfuel`. Record each separately: require sign-in or hidden/empty member data and disabled save controls; walking Start must be blocked. Keep Vercel SSO distinct from member login. Public shells/recipes/approved media are not private history.
2. In the original profile/origin with the existing QA records, verify goals are isolated after A → B and return to A restores only A's existing local records. Do not add walks or diary entries and do not copy local data to a new Preview origin. The prior owner-observed walking/diary visibility passes stand.
3. Genuine expiry remains NOT TESTED. Let a disposable session expire naturally if feasible, without inspecting tokens or altering project auth policy; require reauthentication/no unauthorized data or save. Logout/mocks are not expiry evidence.
4. Review the approved-only Strength practice scope and play all five videos on a physical iPhone before release acceptance. No pending media becomes approved by passing a test.

## Remaining Production gates

- Authorize nutrition backend environment/testing and approve purpose, consent recording, retention, backup/log expiry, export/deletion and local-copy handling. Review anonymous Auth eligibility and server-side restrictions. Then connect the adapter and perform new real two-account nutrition CRUD/read/write-denial acceptance. Current mock tests do not prove live RLS.
- Complete the outstanding direct-route, goal-return and genuine-expiry acceptance above.
- Approve limited Strength scope or finish exact final-master coverage, and accept staged Production media continuity/playback.
- FoodScore Production remains hard-disabled pending separate OFF licensing/API/source/retention decisions. Registration submission is not approval. Preserve recipe provenance review and all source disclosures.
- Complete intended subscription/trial access checks, monitoring ownership and immutable Production-target staging/acceptance before any promotion.

Production/rollback remains `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T`. Both existing Production domains, project Production branch `main`, SSO protection and all environment-variable scopes remain unchanged. No Redis secret was read or modified. No Production build was deployed/promoted; no database changes, paid resources, mobile worktree edits or Metro interruption occurred.
