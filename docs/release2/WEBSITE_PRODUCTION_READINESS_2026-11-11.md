# Website Production readiness — current assessment, November 11

> Current disposition: the owner attests personal creation of the performance-driving video and a wholly synthetic instructor with no real-person reference. The scoped STR-112 rights gate is satisfied and all ten runtime replacements are applied. Active exercise-demo coverage is now 12/12/12 (36/36); STR-053 stays excluded. See [final disposition and mapping report](STR_112_FINAL_RIGHTS_DISPOSITION_AND_MAPPINGS_2026-11-11.md). Earlier blocked/practice-only findings below are historical, not current status. No push or deployment.

> Strength reconciliation update: the full 36-workout library is restored locally, with original sequences. The reduced practice-only scope below is superseded by [SOULSTRENGTH_36_WORKOUT_RECONCILIATION_2026-11-11.md](SOULSTRENGTH_36_WORKOUT_RECONCILIATION_2026-11-11.md). This correction has not been pushed or deployed.

**BLOCKED — no Production staging or promotion performed.**

**Corrective development update:** see [WEBSITE_REMEDIATION_2026-11-11.md](WEBSITE_REMEDIATION_2026-11-11.md) for the new packaged Strength media, restricted practice scope, inactive nutrition adapter and fresh validation. The audit below is retained as evidence of the pre-remediation baseline; its candidate-hosting failure is superseded by that report.

- Reviewed application/runtime SHA: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`
- Feature branch: `feature/soulfuel-clean-preview-2026-11-09`
- Protected READY Preview: https://soulanova-website-puw35yp2n-soulanova.vercel.app/app
- Preview deployment: `dpl_FSqMb2dYsxB7dS4DkMS2xm8RafKj`
- Production/rollback: `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T`; both `soulanova.com` and `www.soulanova.com` still resolve to that deployment.
- FoodScore lookup remains disabled; Production hard-deny and all credentials/settings remain untouched.

## Acceptance evidence and provenance

The original live-results JSON is preserved byte-for-byte. Its nine PASS checks were not repeated, downgraded or overwritten. The owner's new manual observations are stored separately from automated results. No additional QA walks, diary entries or goal changes were made in this audit.

| Check | Status | Provenance / limit |
|---|---|---|
| A and B verified sign-ins | PASS | Prior automated real member authentication |
| A and B walking save, duplicate tap, history and reload | PASS | Prior automated real member-owned rows; one new row per test |
| Real post-insert readback interruption and same-ID retry | PASS | Prior automated real server test; exactly one new row |
| A cannot directly read B's QA walk and inverse | PASS | Prior automated authenticated server SELECT, no user_id filter, successful empty results both ways |
| A and B local diary/goals reload | PASS | Prior automated real profile-local writes/readback; no cloud nutrition sync claimed |
| Overview stayed on login after A logout | PASS | **Owner-observed manual normal-navigation protection** |
| B showed no A walking history in same regular Chrome window | PASS | **Owner-observed manual visible account isolation** |
| B showed no A diary in same regular Chrome window | PASS | **Owner-observed manual visible account isolation** |
| Typed private URLs after member logout | NOT TESTED | Owner's normal-navigation pass does not test direct URL access; live browser control unavailable |
| Same-profile goal visibility and B → A local-data return | NOT TESTED | Not part of the new owner report |
| Raw retained local data unreadable to another user of the browser profile | NOT TESTED live | Source shows unencrypted retention, so secure storage/erasure must not be claimed |
| Genuine expired-session behavior | NOT TESTED | No token inspection, forced configuration change or simulated logout counted as expiry |
| Current five approved Strength files available and intact | PASS | Fresh read-only Production HTTP 200 and exact SHA-256 checks for all five |
| Corresponding media paths in the candidate artifact | FAIL — hosting gate | Authenticated HEAD returned 404 for all five; candidate files absent |
| Complete approved video coverage for 36 Strength plans | BLOCKED — scope gate | Zero plans have approved video for every movement; twelve historical clips are still pending |

The pre-existing **151/151 automated regression/security/browser checks** and **62 syntax checks** remain recorded evidence for this unchanged application SHA. They were not rerun just to inflate acceptance. Prior native-media decode evidence is retained; this audit added only the necessary five-master integrity/hosting checks and read-only schema review.

## Direct-route review and exact outstanding check

Static inspection confirms signed-out data/control gates in the current source, but this is not a live after-logout pass:

- Overview hides the member app when no verified user is available.
- SoulWalk verifies the member before history reads/saves. The unauthenticated case can show a blocked page and a missing-session message instead of redirecting; an exact redirect is not the acceptance criterion. History must remain empty and controls unavailable.
- SoulFuel clears the active member view and disables saves when verification fails or sign-out occurs. Retained local records remain on disk.
- Metrics, Strength and Stretching have their existing verification/hide/stop paths. Public static shells, recipe text or approved public media are not member history.

The old automation controller is not reachable. The currently available debug browser has no Preview tabs, and Apple Events JavaScript control is disabled. No browser security settings or credentials were changed to bypass this.

**Owner-only remaining direct-route check, with no new data writes:** while signed out in the same regular Chrome profile, paste these full URLs individually:

1. https://soulanova-website-puw35yp2n-soulanova.vercel.app/app/walking
2. https://soulanova-website-puw35yp2n-soulanova.vercel.app/app/soulfuel
3. https://soulanova-website-puw35yp2n-soulanova.vercel.app/app/soulfuel/metrics
4. https://soulanova-website-puw35yp2n-soulanova.vercel.app/app/strength
5. https://soulanova-website-puw35yp2n-soulanova.vercel.app/app/stretching

Require member sign-in or hidden/empty member data and disabled save controls. For SoulWalk, Start must also be unavailable; Strength/Stretching member-player panels must be hidden or inaccessible. Do not require a particular HTTP status or redirect if the public shell correctly blocks data/controls. Record each path separately as owner-observed PASS/FAIL/NOT TESTED. Do not repeat Overview navigation or any successful save test; do not enter passwords or inspect browser storage/network headers for this check.

## Four-program assessment

- **SoulWalk:** Real saves, retry recovery, history persistence and direct server read isolation passed; same-window visible isolation now has owner confirmation. Direct routes and genuine expiry remain open acceptance items. Native/watch capabilities remain excluded.
- **SoulFuel:** 75 recipes, diary, goals, nutrition summaries and dials are preserved. Real local persistence passed and same-window diary visibility passed manually. Server nutrition persistence is not integrated. Unencrypted local retention is a privacy release decision, not resolved by the owner-visible isolation pass. Existing member tables are available for a reviewed integration; see the storage proposal below.
- **SoulStrength:** Approved-only guided controls and honest incomplete-set reporting remain. Five masters are intact on current Production; candidate hosting continuity fails. Coverage and final-master approval remain unresolved. Audit is complete; the program is not certified as 36 complete guided-video workouts.
- **SoulStretch:** The verified 24-program/22-video progression, November 11 labels, twelve schedule corrections and five approved Miriam recordings remain unchanged. Existing hash/timing/round regression evidence is preserved; no mobile worktree or native build was changed.

## Secure member-linked persistence recommendation

Reuse the **existing** `nutrition_entries` and `nutrition_goals` tables and existing member identity rather than provisioning a duplicate database/profile. Read-only review found RLS and ownership checks for authenticated CRUD, a member/nutrient uniqueness constraint for goals, and existing health tables. No personal rows were read, no table/policy was altered, and no nutrition write was enabled.

Integration still requires an approved UUID/import mapping, portion/date/nutrient contract, minimal source provenance, consent/retention/deletion decisions, appropriate anonymous-Auth restrictions, verified storage controls and real nutrition CRUD/isolation acceptance. Do not silently migrate existing local data or import staging barcode data as Production nutrition.

Full proposal and exact observed schema: [SOULFUEL_MEMBER_STORAGE_REVIEW_2026-11-11.md](SOULFUEL_MEMBER_STORAGE_REVIEW_2026-11-11.md). It is a recommendation, not an implemented or approved secure-health backend.

## Strength hosting and media actions

Fresh evidence: [SOULSTRENGTH_RELEASE_AUDIT_2026-11-11.md](SOULSTRENGTH_RELEASE_AUDIT_2026-11-11.md) and [JSON receipts](SOULSTRENGTH_HOSTING_READINESS_2026-11-11.json).

Before promotion, preserve/package the exact five approved files in the staged artifact or move their mappings to an approved stable asset host. Update the strict media allowlist with verified mappings if the host changes. Check hashes and actual playback from the staged Production-configured artifact. Resolve remaining final-master approvals or explicitly approve a limited release scope. No media was uploaded, moved, renamed, deleted or newly approved in this audit.

## Remaining Production decisions/gates

1. Finish the narrowly outstanding direct-route, goals-switch/return and genuine-expiry acceptance. Keep the nine completed automated live passes and three owner-visible passes separate by provenance.
2. Approve the nutrition/health privacy scope and the proposed use of existing member tables, or explicitly accept a clearly limited browser-local release without claiming secure shared-device confidentiality or cloud sync. Consent/mapping/schema changes require separate approval before implementation.
3. Resolve Strength coverage/release scope and the proven five-file hosting continuity failure.
4. Keep FoodScore off until its independent licensing/API release requirements are satisfied. Registration submission alone is not recorded as licensing approval. Existing recipe-source/permission and flagged nutrition provenance review is also still unverified in the handoff; preserve disclosures and obtain owner confirmation rather than claiming rights approval.
5. Complete intended subscription/trial access-model checks if enabled and assign/verify release monitoring and rollback responsibility. No paid entitlement enforcement or alerting acceptance is claimed here.

Only after critical gates pass and the owner authorizes the release step should an immutable Production-target build be staged without domains, accepted with Production configuration, and then considered for promotion. **There is no new staged Production URL in this audit.** Production domains, deployment, settings, credentials and all unrelated member data remain untouched.
