# Controlled website release — November 12, 2026

**Disposition: program content is reconciled; Production staging/promotion remains blocked on the specific acceptance and privacy decisions below. No movement/video approvals are being reopened.** This document supersedes historical five-video/reduced-library/26-of-36 findings. It does not turn mocked authentication into real acceptance.

## Immutable candidate and target

- Validated application/runtime commit: `a30111d5e8c6b510208bd91adbc5d810779862f1`.
- Branch: `feature/soulfuel-clean-preview-2026-11-09`, repository `Bmalitz6/Soulanova-website`.
- Existing READY protected Preview: https://soulanova-website-ltxi3gsdw-soulanova.vercel.app/app ; deployment `dpl_6wmFz7tJgnd7VUTjpkDzBaEHNrvQ`.
- This preparation adds a read-only release preflight, evidence ledger and this procedure. It changes no application runtime, media, database or configuration. Its exact preparation commit is recorded in the final delivery; the executable reports HEAD when run. No new Preview is needed to test documentation-only changes.
- Eventual Production target: existing `soulanova-website`, project `prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`, team `team_DYnxDNYoZHChV2l7Z8GzAqTA`. Do not link/create a project.
- Existing rollback: `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T`. Both `soulanova.com` and `www.soulanova.com` still alias it. Apex routes redirect to www; www public configuration responds 200.

## Exact program scope

| Program | Approved content ready | Working scope and honest limits |
|---|---|---|
| SoulStrength | 36 original plans: 12 Beginner, 12 Intermediate, 12 Advanced; 36/36 active demonstration coverage | All 17 original packaged files retain exact hashes; STR-053 remains resolver-excluded. Ten STR-112 replacements and the two owner-authorized bilateral repetition corrections remain. Start/Pause/Resume/Next/Previous and honest skipped-set completion remain. Demo coverage does not certify physical repetitions, new warm-ups/cool-downs or cross-device progress recording. |
| SoulStretch | 24 programs, 22 approved movement videos | Approved progression, stable IDs, November 11 labels, 12 A/B schedule corrections, five replacement Miriam recordings, transitions and completion remain. Existing content-addressed public Supabase hosting is independent of a Production website alias. History saving remains gated. |
| Meditation | 17 existing guided sessions | Existing selection, play/pause, voice/background controls and 20 packaged audio assets preserved. Do not enable the globally paused progress writer. |
| Tai Chi | Existing approved Foundations destination and previously released lessons | Overview opens Beginner Tai Chi Foundations; its approved 10-minute video is packaged. Do not advertise other cue-only/coming-soon movements in the broader legacy library as finished video lessons. |
| SoulWalk | Authenticated browser Start/Pause/Resume/Finish/Save/history | Real member-owned saving, retry/readback and cross-account SELECT isolation already passed; no additional QA walk needed. Browser manual readings/GPS are not HealthKit/Watch integrations. Remaining auth acceptance applies. |
| SoulFuel | 75 approved recipes, existing nutrition UI and four dials | FoodScore OFF. Diary/goals and manual health remain browser-local, unencrypted and unsynced; privacy release scope is not yet accepted. Member-storage adapter is inactive and cannot be activated by this release. |

SoulGolf and Chair Yoga are excluded. Preserve existing public pages, approved navigation and other working programs; do not relabel unavailable features as complete. No reduced Strength library or replacement videos are proposed.

**What can be promoted immediately?** No site artifact should be promoted before the common authentication gates pass. The five non-nutrition programs above have content ready for that release; their finished media do not need renewed approval. SoulFuel recipes can be included, but the current full application must not be presented as a recipes-only release: diary/health forms are still present. Choose one of these explicit paths before staging:

1. Owner explicitly accepts a limited browser-local nutrition/health release with visible shared-device retention warnings and no secure/cloud-storage claims; finish the outstanding goal-switch/return acceptance. No cloud upload or migration.
2. Release SoulFuel recipes only: implement and test a release-specific gate that removes diary/goal/manual-health collection and sensitive dashboard reads, preserves existing local records without reading/uploading/deleting them, and labels those features unavailable. **This variant is not yet implemented and must not be inferred from this plan or the preflight.**

The safer recipes-only variant can avoid a new health backend, but it still requires a separate exact tested commit. Neither path authorizes live nutrition cloud writes, RLS changes or migration. Retain the existing explicit consent-based cloud-adapter proposal for later approval.

## Closed and outstanding gates

Preserve the nine real automated passes and three owner-observed passes exactly as recorded in `WEBSITE_PRODUCTION_READINESS_2026-11-11.md`. They include real A/B sign-ins, walking save/reload/readback retry/server SELECT separation, local diary/goals persistence, normal logout navigation and visible same-profile walking/diary isolation. Do not repeat completed save tests or create more QA walks.

Only these owner-controlled browser checks remain; use the same exact Preview origin and existing test accounts, with passwords entered privately by the owner. No credentials, cookie exports, tokens, screenshots of secrets or password resets:

1. Confirm visible signed-in identities. Fresh real sign-in on this new Preview origin has not been tested by the agent; Vercel Authentication and Soulanova membership are separate.
2. Sign out. Paste `/app`, `/app/walking`, `/app/strength`, `/app/stretching`, `/app/soulfuel` and `/app/soulfuel/metrics` individually. Expect a member login or no private data and disabled member controls. Public static shells, recipes and approved media are not private history. Record each result.
3. In the same profile sign in as B, then return to A. Check existing goals and retained diary are only visible for the selected account. No new diary/goal writes are required. App-visible separation is not browser-disk encryption or erasure.
4. Genuine expiry: with the existing test account, leave the session until the configured server expiry/revocation actually makes member verification fail. Verify history/data clear and saves cannot proceed; a valid automatic refresh is expected and is not expired-session denial. Do not change global expiry, inspect tokens, disable browser security or count mocked failure/logout as genuine expiry. If a safe real expiry cannot be produced, retain NOT TESTED; the owner must explicitly resolve the release exception before staging.

No connected interactive browser controller or document session is currently available. New browser regressions use explicit fixtures and cannot close these real-auth gates. No fresh real two-account test is claimed.

## Access, environment and database compatibility

The website currently advertises free membership. Inspection found no implemented Stripe/payment/subscription/trial entitlement enforcement in the active member/API sources. Confirm this release is free-member access; if it is paid or trial-restricted, enforcement is a critical blocker, not an enabled feature. Do not enable billing or change plans.

Read-only Vercel metadata confirms Authentication protection (`all_except_custom_domains`), project identity and seven environment keys: all five FoodScore approvals and both Redis keys are Preview-only, restricted to the feature branch. No Production Redis settings exist in that project response. No secret values were requested, printed or changed. FoodScore's trusted server policy denies Production even if switches are accidentally set.

Public www Production config and the candidate reference the same existing Supabase project. Prior read-only metadata receipts establish existing `soulwalk_sessions` ownership RLS, authenticated SELECT/INSERT, no anonymous grants, and existing nutrition table contracts. Walking code already passed real two-account storage acceptance. This is compatibility evidence, **not a fresh live schema query or staged Production acceptance**. No schema changes or database writes occurred here. Nutrition adapter remains disconnected and defaults to denying writes; no service-role browser key, nutrition migration or new backend is part of this release.

## Executable preflight

Run `node scripts/release/preflight.cjs`. It is read-only: checks 36 plans/coverage, 17 local video hashes/sizes, pinned SoulStretch mappings and prior receipts, recipe count, packaged Meditation/Tai Chi media, FoodScore Production denial and SoulGolf exclusion. It also reports all unresolved acceptance gates. Exit 2 means release blocked; it never deploys. The JSON evidence ledger deliberately records NOT TESTED/BLOCKED instead of invented passes. No mocked-auth receipt can satisfy the gate evaluator. Human-entered evidence still requires independent review; this tool is not proof of an actual test or a backend security boundary.

Update `PRODUCTION_RELEASE_ACCEPTANCE_2026-11-12.json` only after the corresponding real observation/explicit decision, with provenance and a non-sensitive receipt. `readyForStaging` is separate from final staged acceptance and final owner authorization. Do not copy acceptance across different application commits or release scopes without checking the intervening diff.

## Monitoring and controlled staging procedure — not executed

1. Assign an owner/operator for release and rollback. Verify they can see Vercel build/runtime errors and Supabase Auth/database errors. No Vercel drains are currently configured; a drain is not mandatory if existing dashboards and a named operator meet the release plan. Test error visibility with a harmless isolated fixture; log only route, status and diagnostic code, never nutrition/history payloads, tokens or member identifiers. No new paid monitoring service is authorized.
2. Close the pre-staging gates, agree on the exact release SHA and nutrition/access scope, and request explicit authorization to create the unaliased Production-target build. Preserve the existing protected Preview. Do not push main.
3. Recheck team/project link, full SHA, clean worktree, `main` Production branch, environment names/scopes (no values), existing aliases and rollback availability. No env pull or credential retrieval is part of preparation.
4. **Only after staging authorization:** run the reviewed Vercel CLI from this exact linked candidate: `vercel deploy --prod --skip-domain --scope soulanova`. This is a Production-target build with no custom-domain switch, not a promotion of the existing Preview artifact. Record deployment ID, exact source SHA, URL, configuration and artifact verification receipt. Keep it Authentication-protected for acceptance; verify that protection before member tests.
5. Smoke-test the staged artifact with real test accounts: required-member access, reviewed walking history, all six program navigation paths, approved representative playback, all 17 packaged Strength hashes/range requests, SoulStretch hosted media and narration, and the chosen nutrition release scope. FoodScore availability must be false. No live barcode calls or cloud nutrition writes. Verify public marketing routes and actual free/paid access scope. Compare public domains: they must still target the rollback deployment.
6. Record PASS/FAIL/NOT TESTED for each staged check. **STOP on any critical failure.** Do not use a local empty-environment build as proof of Production configuration. Rebuild a corrected immutable artifact if needed.
7. Ask for final explicit authorization naming the tested staged deployment ID and full SHA, domains `soulanova.com` / `www.soulanova.com`, exact included/excluded features and rollback ID. Example: “Authorize promotion of tested deployment <ID>, commit <SHA>, with FoodScore and cloud nutrition writes disabled, using the accepted nutrition/privacy and free-member scope.” A general wish to launch is not this final authorization.
8. **Only after final authorization:** promote that tested Production-target deployment using the reviewed Vercel workflow. Immediately confirm both aliases, authentication, one read-only member history and program/media loads. Do not create extra acceptance records or change subscription settings.

## Rollback and post-release monitoring

Keep `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T` available; no database rollback is required because no schema change is included. On critical authentication, isolation, member-save or media failure, the authorized operator restores that exact deployment with `vercel rollback dpl_A3N468HfccoSDiZvJhDgPJHmwB9T --scope soulanova`, then verifies both domain mappings and read-only member/program checks. Recheck CLI permissions and project first. Rolling back changes future auto-assignment behavior; do not resume promotions implicitly.

For the acceptance window watch authenticated route errors, video/audio 404/5xx, failed or unconfirmed walking saves, duplicate-save reports, login/refresh failures and FoodScore denial. Confirm existing history/recipes remain readable without logging their contents. Assign explicit checks immediately after promotion, after 15 minutes and the following day. If runtime monitoring cannot be observed, do not claim monitoring is working.

No merge, push, deployment, promotion, domain change, subscription activation, credential change, database write, migration or other-session modification is performed by this preparation.

## Fresh preparation validation

- Full sequential unit/regression/security/browser suite: **229/229 PASS**, zero failures/skips. Browser auth/backend fixtures are labeled; no real acceptance is inferred. Native Chrome packaged Strength playback tests use actual video decoding. After tightening final-authorization provenance, the three preflight tests were rerun and passed.
- JavaScript syntax: **70/70 PASS**. No package.json lint/typecheck/TypeScript project exists. The immutable application commit's prior local empty-environment production-mode build remains the build evidence; no Production-configured staged build was run here, and it cannot be claimed from that local build.
- Strength: all 17 packaged SHA-256 values and sizes match; active demonstration coverage 12/12/12; STR-053 excluded and ten STR-112 mappings retained.
- SoulStretch: **22/22 fresh remote HEAD requests HTTP 200 with matching approved sizes**. Full streaming SHA-256 and native playback evidence remains in the existing prior receipt; HEAD is not a new hash verification.
- Production www public config responds 200 and references the same Supabase project as the candidate. Apex redirects to www. Seven Vercel environment names/scopes were read without values; all are branch-restricted Preview only. No configured project drains were returned. Existing Production aliases remain unchanged.
- The preflight's content checks pass, while its release disposition correctly returns **BLOCKED / exit 2** for unresolved real acceptance and decisions. No extra QA walking or nutrition records were created.

Detailed non-sensitive test/hosting/preflight receipts are retained locally under `.git/strength-preview-publication-2026-11-12/`; this tracked plan and acceptance ledger are the durable handoff. The earlier publication CLI misroute and verified removal are recorded in the publication receipt; no such command was reused in this preparation.
