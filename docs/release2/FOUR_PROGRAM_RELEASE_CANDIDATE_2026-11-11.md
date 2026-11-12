# Four-program website candidate — November 11, 2026

> **Current release preparation:** [November 12 controlled release plan](PRODUCTION_RELEASE_PLAN_2026-11-12.md) and [remaining acceptance ledger](PRODUCTION_RELEASE_ACCEPTANCE_2026-11-12.json) supersede obsolete coverage/hosting findings below. The protected Preview at `a30111d5e8c6b510208bd91adbc5d810779862f1` now has 36/36 Strength coverage and 17/17 independently packaged, deployed hash-verified videos. Original historical evidence remains intact. Production is unchanged.

> Current readiness assessment: [WEBSITE_PRODUCTION_READINESS_2026-11-11.md](WEBSITE_PRODUCTION_READINESS_2026-11-11.md). This file retains the original integration inventory; later acceptance evidence supersedes its initial test/setup assumptions.

**Production staging: BLOCKED. No Production deployment or promotion is authorized by a passing gate yet.** Existing rollback deployment and both public domains remain `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T`.

## Implementation

- **SoulStretch:** Ported the current read-only Session 2 catalog, including exactly 12 changed schedules, corrected movement identities and explicit round-specific A/B ordering. All 24 programs, 22 stable movement IDs, video URLs and video hashes remain. Five November 11 Miriam recordings match their explicit owner-approved review manifest and active-source SHA-256. Historical November 9 source pins remain unchanged; November 11 receipts are separate. Timings derive from the actual scheduled clips plus five-second transitions. Some alternate-side schedules contain more distinct IDs overall than the number of movements per round. No opposite-side footage or mirrored movement was invented. No Chair Yoga or unapproved recordings were transferred.
- **SoulStrength:** Restored guided exercise playback within the original 36 plans and three levels. Only the five existing pinned final-master mappings can play. Start, Pause, Resume, Next, Previous, rests and set counting are implemented. Browser playback failure pauses without claiming completion. Previous/replay cannot count a set twice. Skipped or unavailable sets never count; completion explicitly distinguishes a finished session from a fully completed workout. Standalone demonstration buttons remain absent. Warm-up/cool-down recordings, history writes and pending master clips remain unavailable.
- **SoulWalk:** Recovered the existing website 12-week walking plan and interface, independently of native worktrees. Added verified-member Start/Pause/Resume/Finish, explicit actual-reading review and Save. Early Finish records actual elapsed time, not planned duration, and does not qualify as a full scheduled walk. Optional fields remain null. Browser GPS is opt-in; coordinates are not persisted. Optional browser speech is labeled honestly. Five recovered coaching recordings were inventoried but excluded because no exact approval receipt was established. No native Watch/HealthKit capability is claimed.
- **SoulFuel:** Original 75 recipes, recipe text, approved photography, diary/scoring/scanner cores, portion calculations, four dials and goals remain. Only shared navigation and successful-save notifications for draft protection were integrated. Diary and manual health metrics remain member-namespaced **unencrypted browser-local data, unsynced**, not secure cloud account storage. No migration or new health backend was introduced. FoodScore remains hard-disabled in Production; the existing Preview gate is preserved.
- **Navigation:** Shared visible Back to Overview and logo-to-Overview behavior across member HTML screens, including recipe reference pages. Active workouts or unsaved form values remain on the current page; navigation offers Stay or an explicit new Overview tab. Reload/close prompts protect active drafts where the browser supports beforeunload. This is in-memory page preservation, not recovery after a browser crash or guaranteed mobile process survival. Account changes clear workout state and displayed member data. Verified same-account token refreshes preserve active Strength and SoulStretch sessions.

## Walking storage security evidence

Read-only metadata queries against the existing configured Supabase project confirmed:

- Existing `public.soulwalk_sessions` has RLS enabled.
- Authenticated INSERT checks `auth.uid() = user_id`; authenticated SELECT uses the same ownership predicate.
- Authenticated role has INSERT/SELECT privileges. Anonymous role has neither privilege.
- Existing schema supports the actual duration (numeric), member UUID, week, mode, level, optional readings and sources. No schema/policy changes were made.

The table-specific save adapter verifies `auth.getUser()` before inserting and before readback, rejects anonymous or switched identities, uses stable UUIDs, confirms submitted fields and safely checks duplicate conflicts against the same member. Real A/B walking saves, reload, failed-readback retry and cross-account SELECT isolation subsequently passed. Direct routes and genuine expiry remain pending; see the current assessment for exact provenance and limits.

## Validation evidence

See `FOUR_PROGRAM_MEDIA_VERIFICATION_2026-11-11.json`: **27/27 streamed hashes match**, and **32/32 native Chrome playback checks pass** (27 videos and five replacement narration files). Large archives were not copied or modified.

**Initial integration result: 142/142 passed. Later unchanged-runtime evidence at `4d7a0f4`: 151/151 passed, zero failures/skips; 62/62 syntax checks. Nine real automated checks and three owner-observed visible checks are recorded separately in the current assessment.**

Automated coverage includes exact A/B schedules and completion, guided controls and incomplete reporting, walking validation/idempotence/readback, account switching, FoodScore Production denial, mocked nutrition/diary flows, navigation, storage failures, accessibility and desktop/390px/320px responsive layouts. Auth providers and backend writes in browser tests are explicitly mocked; no fabricated identity was used against Supabase. No external barcode lookup occurred.

No npm package, lint script, TypeScript project or local application build command exists in this static website repository. Syntax, static references, regression tests and the Vercel Preview build are the applicable checks. A Production-configured build is deliberately not staged before the critical gates below pass.

## Remaining release gates

1. **Remaining member acceptance:** Do not repeat the nine completed automated live checks. Owner-observed normal navigation after logout and same-window walking/diary visibility also passed. Finish only the unresolved direct-route, goals-switch/return and genuine-expiry checks; keep provenance explicit. No owner's personal diary may be used.
2. **Strength scope/media:** None of the 36 original plans has approved media for every movement. Five masters are usable; twelve historical clips still require explicit exact-file approval. Warm-up/cool-down remains unavailable. Do not advertise this as a fully playable 36-workout release. Owner must resolve these media requirements or approve an explicitly limited scope before Production acceptance.
3. **Strength hosting continuity:** Current master URLs use `www.soulanova.com/app/strength/media/exercises/`. The candidate intentionally does not duplicate the old Production media archive. All five URLs currently pass hash/playback tests, but replacement Production must preserve their availability or provide approved stable hosting before promotion. Do not assume old-domain assets survive replacement.
4. **FoodScore:** Production remains disabled. OFF registration submission is not licensing approval. API/source attribution, ODbL/DbCL/share-alike, retention/privacy and application-specific score disclosures remain separate launch decisions. Preview-only Redis credentials must not be copied to Production.
5. **Storage/privacy acceptance:** Browser-local diary/health data is not encrypted or synced. Owner must accept this explicit scope or separately authorize a reviewed secure backend. No sensitive backend migration was performed.
6. **Subscription/monitoring:** No newly enabled billing or trial enforcement was introduced. Verify actual intended access model with the two test accounts; do not claim tested paid entitlement enforcement. Assign a release monitor and verify Vercel/Supabase error visibility before Production staging.

## Physical protected Preview acceptance

- Sign in as disposable account A after Vercel Authentication; these are separate protections.
- Overview → SoulWalk. Select treadmill or outdoor; GPS stays off until explicitly opted in. Start, pause, resume, then Finish early. Review actual time and optional readings. Save once; wait for confirmed readback. Reload and verify the same single member-owned history row. A short walk must not qualify as a full scheduled week session.
- Sign out; sign in as B. A's walk/history must be absent. Save a separate B walk. Attempt cross-account reads/writes using only those disposable account sessions, expecting RLS denial. Return to A and confirm its original history is intact.
- Strength: select a plan, review unavailable movements, start and use Next to reach an approved press. Exercise Pause/Resume/Previous/Next; unavailable/skipped sets must remain incomplete. Do not expect a complete-video workout until media scope is resolved.
- SoulStretch: choose a corrected A/B routine. Verify the second-round side, corrected wrist/ankle/triceps naming, Miriam audio, five-second transitions, pause/resume and final summary. Skipping a segment must not claim full completion.
- SoulFuel: use disposable manual entries, edit/delete, reload and verify four dials. Switch accounts; entries must not appear under the other account. No live FoodScore lookup is necessary for this release acceptance.
- Test Back and logo on desktop, 390px and 320px. A live workout or draft must stay intact when Stay/new-tab Overview is used.

## Staging, monitoring and rollback

Only after all critical gates and owner physical acceptance pass: create an immutable **Production-target** build with domains unassigned (`vercel deploy --prod --skip-domain`), record its exact Git SHA and deployment ID, and smoke-test it with Production configuration. Confirm `/api/foodscore-availability` is disabled and both real test accounts remain isolated. Do not promote an untested Preview artifact.

Capture the current alias/deployment mapping immediately before any eventual promotion. Monitor authenticated program loads, video requests, failed saves and authentication errors without logging member fields or credentials. Keep `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T` as the verified rollback target. If an approved release fails acceptance, use the existing Vercel rollback workflow to restore that deployment and verify both domains, authentication and save behavior. No destructive database changes are part of this candidate, so there is no schema rollback.

For this work: **no Production staging, promotion, domain change, Redis secret access/change, native rebuild, mobile worktree edits, or Metro interruption.**

## Reviewed file inventory

- `app/classes/beginner-tai-chi-foundations/index.html`
- `app/index.html`
- `app/member-data.mjs`
- `app/member-navigation.js`
- `app/programs/catalogs/programs.json`
- `app/soulfuel/foodscore.js`
- `app/soulfuel/index.html`
- `app/soulfuel/metrics/index.html`
- `app/soulfuel/metrics/metrics.js`
- `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/breakfast.html`
- `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/dinner.html`
- `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/index.html`
- `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/lunch.html`
- `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/snacks.html`
- `app/strength/index.html`
- `app/strength/strength-integration.css`
- `app/strength/strength.js`
- `app/strength/strengthGuided.js`
- `app/stretching/index.html`
- `app/stretching/narration/miriam/calf-a.mp3`
- `app/stretching/narration/miriam/calf-b.mp3`
- `app/stretching/narration/miriam/overhead-reach.mp3`
- `app/stretching/narration/miriam/shoulder-a.mp3`
- `app/stretching/narration/miriam/shoulder-b.mp3`
- `app/stretching/stretching.js`
- `app/stretching/stretchingCatalog.js`
- `app/stretching/stretchingGuidance.js`
- `app/stretching/stretchingPlayback.js`
- `app/walking/index.html`
- `app/walking/persistence.mjs`
- `app/walking/release.css`
- `app/walking/save.mjs`
- `app/walking/training.mjs`
- `app/walking/walking.css`
- `app/walking/walking.js`
- `docs/release2/FOUR_PROGRAM_MEDIA_VERIFICATION_2026-11-11.json`
- `docs/release2/FOUR_PROGRAM_RELEASE_CANDIDATE_2026-11-11.md`
- `docs/release2/SOULSTRETCH_NOV11_SOURCE_HASHES.json`
- `docs/release2/SOULWALK_WEB_RECOVERY_HASHES.json`
- `tests/four-program-browser.test.cjs`
- `tests/four-program-release.test.cjs`
- `tests/soulfuel-clean-integration.test.cjs`
- `tests/soulfuel-navigation-browser.test.cjs`
- `tests/soulfuel-premium-design.test.cjs`
- `tests/soulstrength-restored-ui.test.cjs`
- `tests/soulstretch-approved-progression.test.cjs`

## Corrective development continuation

The latest remediation is recorded in [WEBSITE_REMEDIATION_2026-11-11.md](WEBSITE_REMEDIATION_2026-11-11.md). It supersedes the old candidate hosting failure and incomplete-plan UI: five exact approved masters are now packaged, with legacy redirects, and member-facing Strength selections contain approved movements only. The original full catalogs and SoulStretch remain unchanged. The nutrition adapter is fixture-tested and inactive; no live nutrition writes or migration are enabled. Previous live acceptance receipts remain byte-identical.
