# SoulFuel Session 3 — isolated candidate, 2026-11-09

Owner reports successful Open Food Facts API-use registration submission on **2026-11-09**. External approval is **not established**; no confirmation receipt or exact submitted answers have been inspected. The prior registration draft below remains historical proposed content, not evidence of the submitted answers. No deployment, service provisioning, remote variable change, merge, or purchase was performed by this session. This clean candidate is on `feature/soulfuel-clean-preview-2026-11-09`, descended from GitHub main `1b09f3e897948b16a8a7c4aa4930f9fe8fb8b7ef`. SoulFuel content was selectively ported from preserved source commit `ba552c660c343a8242fc84069871965875e1d747`; that independent archival history is not part of this candidate. The original worktree, bare repository and prepublication audit remain in the local archive and were not modified. Workstation capture manifests are not included for publication. See [clean integration audit](SOULFUEL_CLEAN_INTEGRATION_AUDIT_2026-11-09.md) for exact file inventory, dependency adaptations, current tests and publication conditions.


## Implementation

Static availability remains false. A same-origin, no-store JavaScript endpoint exposes only the server gate's boolean before the existing client initializes. Failure to load that endpoint leaves the static default off. Both endpoints evaluate the same server-only policy on each request. Production, Development, unknown environments, missing approvals, unapproved deployment hosts, and foreign Origins fail closed before Redis or Open Food Facts. Production cannot be enabled through flags. No browser flag grants API access.

Required platform protection is an operational prerequisite: the confirmation variable records an owner verification, not an authentication mechanism. Enable Vercel Authentication/SSO protection for the full deployment, including both API endpoints. Do not expose bypass tokens in client code. Only the runtime-generated deployment hostname is accepted after exact project/branch/full-SHA server authorization; custom domains and branch aliases are deliberately not enabled. `VERCEL`, both environment targets, project ID, Git branch/SHA and `VERCEL_URL` are native platform values, never browser input. All are required; source branch and full SHA must match explicit owner approval. Request Host/Origin only restrict access. Retain default-off flags for all deployments until approval.

Existing 75 recovered recipes, search/cards/Print controls, meal plans, manual diary, local member history, Nutrition Goals, scoring, portions, camera stop behavior and manual fallback are preserved. No cloud diary migration is included.

## Registration submission — owner-reported complete; historical draft follows

Official [API usage form](https://docs.google.com/forms/d/e/1FAIpQLSdIE3D8qvjC_zRJw1W8OmuHhsWJ_NSckiiniAHlfaVwUZCziQ/viewform), linked from [OFF API documentation](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md). This is proposed content, not a claim that form fields or acceptance have been verified.

- Application: Soulanova FoodScore, version 1.0; website https://www.soulanova.com.
- Organization/legal entity and authorized representative: OWNER TO SUPPLY.
- Technical contact: support@soulanova.com — OWNER TO CONFIRM monitored mailbox and permission to publish.
- Use: commercial wellness/member nutrition application; initially a small protected Preview. Read-only barcode product lookup, nutrition/ingredients, provisional app-derived score, and explicit member-reviewed local diary additions. No OFF uploads, edits, search-as-you-type or product images.
- Integration: server proxy GET v3.6 product endpoint with selected fields; browser uses POST to Soulanova. User-Agent `Soulanova-FoodScore/1.0 (support@soulanova.com)`.
- Expected volume: OWNER TO ESTIMATE testers/daily requests. Current shared fixed-window ceiling is 10 cache misses/minute across instances using the same Redis. Known responses cache 1 hour; unknown responses 5 minutes. No automatic upstream retries. OFF documents 15 product reads/minute/IP; fixed-window boundary bursts and shared egress from other applications can still encounter provider throttling, which is handled safely.
- Attribution: source product link plus ODbL/DbCL links; images disabled. No personal member identifiers sent to OFF.
- Ask OFF to confirm commercial reuse/caching expectations and appropriate test service if needed. Record submission date, submitter, exact scope, confirmation and correspondence. Submission is an owner action, not an API credential or automatic license clearance.

## License and retention decision record — approval outstanding

[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) permits commercial use (§3.1), subject to conditions. Preserve source/license notices; display attribution beside outputs with an OFF link and ODbL link (§4.3). OFF separately licenses individual contents under DbCL and images under CC BY-SA 3.0; package artwork can have additional rights. See [OFF licensing guidance](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md).

Owner/legal reviewer must classify the Redis collection, derived scores and any persisted OFF-derived diary data. Public use of a derivative database can trigger ODbL share-alike (§4.4) and an offer of a machine-readable database or alterations/method (§4.6). Repeated small extractions may be substantial. A collective database has different treatment (§4.5); short cache retention is not an exemption. Review whether private Preview testers are outside the organization. Keep OFF-derived data/provenance separable from proprietary recipes and private member records; do not publish personal diaries to satisfy a database-sharing obligation. Determine a compliant release method before broader use. This preparation does not assert that the full proprietary app or recipes must be open-sourced, or that no sharing is required.

Retention proposal requiring owner approval:

| Data | Location / retention | Required owner decision |
| --- | --- | --- |
| Product response and barcode key | Redis, known 3600 seconds / unknown 300 seconds | Approve region, vendor, TTL, backups and deletion behavior |
| Global limiter counter | Redis, 60 seconds | Shared budget for all app instances; dedicated non-evicting capacity |
| Manual diary, goals, reviewed product entries | Member-scoped browser local storage; persists until deletion/browser clearing | Approve disclosure, shared-device use, account switching and deletion instructions; no server sync |
| Camera video | Browser live stream; tracks stopped after scan/stop/page hide | No image upload; physical-device acceptance pending |
| Host/provider logs, traces and backups | Vendor-controlled | Disable body/barcode/token logging; set documented retention/access/deletion controls; TTL does not delete backups |

## Redis setup preparation — do not provision without authorization

After owner budget/region/vendor approval, create or select a dedicated Preview Redis with authenticated HTTPS REST access. Store URL and token as server-only Preview secrets. Do not use public-prefixed variables, a read-only token, or Production Redis. [Upstash REST documentation](https://upstash.com/docs/redis/features/restapi) supports command arrays in POST bodies and Lua EVAL. Required commands are GET, SET with EX, EVAL, and the script's INCR/PEXPIRE/PTTL on `soulanova:foodscore:off:*`. Validate any ACL against EVAL subcommands; use a dedicated database if restrictive ACLs are unavailable. Use one shared database/budget across participating instances; never split limiters across instances sharing provider egress. Avoid eviction resetting limiter keys. No per-member/IP history is stored in Redis.

Missing credentials, Redis outage or invalid limiter result block upstream traffic. Cache writes failing after a successful upstream lookup do not fail that response. Cache reads bypass upstream limiter; request-level abuse/cost protection is supplied by the protected deployment, not this upstream budget. Do not advertise public scalability from these tests.

## Exact owner actions for protected Preview

1. Registration was submitted by the owner on 2026-11-09. Retain the receipt and actual legal entity/contact/volume answers; reconcile them with the historical draft. External approval is unknown. Approve licensing, attribution, score wording, local diary disclosure and retention decisions above.
2. Authorize Redis provisioning/cost, select region and configure dedicated Preview credentials. Review logs/backups and access controls.
3. Authorize a future Preview deployment from the reviewed candidate. Verify full-deployment authentication protects the page AND `/api/foodfacts` AND `/api/foodscore-availability`: signed-out visitors must encounter protection. Do not use a public exception for APIs. Record exact immutable generated hostname.
4. Scope these server variables to the approved Preview branch/deployment only (never Production):

| Variable | Value |
| --- | --- |
| `FOODSCORE_PREVIEW_ENABLED` | `true`, only after all approvals |
| `FOODSCORE_PREVIEW_APPROVED` | `true`, records registration/license/retention approval |
| `FOODSCORE_PREVIEW_PROTECTION_CONFIRMED` | `true`, only after protection verification |
| `FOODSCORE_PREVIEW_APPROVED_BRANCH` | `feature/soulfuel-clean-preview-2026-11-09` |
| `FOODSCORE_PREVIEW_APPROVED_COMMIT` | full 40-character lowercase SHA of the final reviewed source commit |
| `UPSTASH_REDIS_REST_URL` | dedicated HTTPS REST origin |
| `UPSTASH_REDIS_REST_TOKEN` | secret with required command access |

Platform `VERCEL` must be `1`, `VERCEL_ENV` and `VERCEL_TARGET_ENV` must both be `preview`, and `VERCEL_PROJECT_ID` must be the existing Soulanova project ID pinned in the server policy. Native Git branch/SHA must match the approved branch/full SHA. Never manually spoof platform values. **Generated-hostname activation is resolved:** authorization follows the approved source identity; requests must use the deployment's current native `VERCEL_URL`. A new generated hostname needs no prebinding; a different source SHA/branch needs new approval. The old `FOODSCORE_PREVIEW_HOST` is unused. Owner approval covers redeployments of the exact project/branch/SHA. No activation was performed.

5. With separate deployment/test authorization, validate signed-in availability and secure POST; known/unknown/incomplete products; cache reuse across instances; ten misses and next-request limiting; Redis outage; provider 429/503 and timeout; no secrets/barcodes in URLs or logs; account switching and diary persistence. Confirm API is disabled when any approval is absent. Confirm a Production-environment local test remains blocked without touching live Production.
6. Perform physical iPhone Safari and Android Chrome camera permission/denial/stop tests and manual fallback. Automated mocked tests are not live integration or mobile acceptance.
7. Rollback: set Preview enabled false and redeploy under owner authorization; verify both endpoints are off. Rotate credentials if exposed and expire/delete Preview product cache according to approved retention. No Production enablement path is included.

Pending: registration evidence reconciliation (not resubmission), license/methodology/retention approval, Redis reuse/provisioning decision, review/approval of the completed branch/commit gate, signed-out Preview protection verification, authorized Preview deployment and external/device acceptance. Nothing has been enabled remotely.

## Verification results

- Focused: `node --test --test-concurrency=1 tests/foodfacts-production.test.cjs tests/soulfuel-*.test.cjs` — 33 passed, 0 failed.
- Sequential SoulFuel/member regression: same command plus `tests/member-experience-regression.test.cjs` — 37 passed, 0 failed.
- Full repository: `node --test --test-concurrency=1 tests/*.test.cjs tests/*.test.mjs` — 80 passed, 2 failed (82 reported tests). Failures are existing missing SoulStretch evidence: `docs/release2/soulstretch-review.json` and `docs/release2/SOULSTRETCH_OWNER_APPROVAL_2026-11-08.json`, also absent from the source capture. The SoulStretch production test file fails at load; its individual tests therefore were not executed. No files were fabricated or unrelated features changed to make that suite pass.
- Imported source Git history into this independent repository read-only so baseline hash tests can resolve `9612d41`; those baseline preservation tests pass.
- `git diff --check` passes. New tests cover gate prerequisites, Production/Development rejection, host/origin mismatch and server availability without secret exposure. Existing tests cover 75 recipes, diary isolation, portions, scanner fallback, POST privacy, Redis fail-closed behavior and upstream failures.
- No live Redis/OFF request or browser/device acceptance was performed. Registration and legal references were read from official sources only.


## Registration follow-up and read-only platform assessment

See [Preview Redis and first-test plan](SOULFUEL_PREVIEW_REDIS_AND_FIRST_TEST_2026-11-09.md) for the 2026-11-09 Vercel inspection, reuse search, cost estimate, exact variable list, resolved hostname workflow, Free integration checklist and first-test procedure. This supersedes older statements that the remote project/variables could not be inspected. Registration submission does not authorize deployment or establish legal/API approval.

## Preview readiness gate fix

The generated-hostname blocker is fixed by server-enforced native project/branch/full-commit matching and mandatory Preview targets. Request headers/query/body cannot grant authorization. All flags remain unconfigured/off remotely; Production is denied regardless of activation flags. See the current linked runbook for seven exact Preview variables and owner approvals. Historical test counts above describe the earlier preservation snapshot; updated results follow below.

- Gate-fix focused suite: **39 passed, 0 failed** (`node --test --test-concurrency=1 tests/foodfacts-production.test.cjs tests/soulfuel-*.test.cjs`).
- Complete available SoulFuel/member regression: **43 passed, 0 failed** (focused command plus `tests/member-experience-regression.test.cjs`).
- Broader repository regression: **86 passed, 2 failed**, 88 reported tests. Same pre-existing missing SoulStretch evidence files as the preservation snapshot; SoulStretch production suite cannot load its approval file. No unrelated file was fabricated or changed.
- Gate-specific tests: nine cases, including regenerated-host authorization and no-I/O Production, wrong identity and spoofed API/availability denial. No physical-device or live Redis/OFF acceptance was run.
- Application content and API caching/rate-limiting code were compared against the preserved commit and remain byte-identical. `git diff --check` passed. No provisioning, credentials, external configuration, deployment, merge or other-session changes.

## Clean candidate validation supersedes historical counts

On the GitHub-ancestry candidate, 39 dedicated legacy SoulFuel tests plus three clean-integration tests pass: **42/42**. No member-experience, Strength, SoulStretch or SoulWalk tests were transplanted. GitHub main contains no pre-existing automated test files or package test runner, so 42/42 is also the complete available repository suite here. The earlier 43/88 counts above refer only to the preserved snapshot and are not this checkout's results.

The owner has created `soulanova-foodscore-preview` (Upstash Free, AWS us-east-1). Database identity/plan is owner-provided; no provider-console validation or credential access occurred. Preview URL/token configuration remains pending; the prior rejected variable request did not create variables. Use only the new clean branch for future branch-scoped configuration after publication approval. Never broaden to all Preview branches to bypass a missing branch.
