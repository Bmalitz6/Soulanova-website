> **Current upgrade revision:** see [v2 formula, source units, staging/API and compliance review](SOULFUEL_SCORE_V2_AND_COMPLIANCE_2026-11-09.md). It supersedes prior score weights, exclusion of confirmed community entries from tracker totals, and the old production OFF host. Live lookup remains OFF; registration is submitted, not externally approved. Earlier counts/provenance below are historical.

> Clean GitHub-ancestry candidate: `feature/soulfuel-clean-preview-2026-11-09`. See [current integration audit](SOULFUEL_CLEAN_INTEGRATION_AUDIT_2026-11-09.md). Owner has already created `soulanova-foodscore-preview` on Upstash Free/us-east-1; creation is no longer pending. Configure its URL and writable token through the approved secure Preview-only workflow after branch publication is authorized. No resource or environment changes were made here.

# SoulFuel Preview Redis and first barcode test — 2026-11-09

## Current decision

Registration: **submitted 2026-11-09, owner-reported**. External approval unknown. No receipt or submitted answers inspected. Do not resubmit; retain evidence. No live OFF/Redis request, new resource, credential change, deployment or merge was performed. The server policy and its tests were updated to resolve hostname activation; app content, scanner, cache and limiter remain unchanged. Production remains fail-closed in `lib/foodscore-preview.js`; every request checks deployment environment before any external I/O.

## Read-only Vercel evidence

Connected tools returned:

| Item | Observed |
| --- | --- |
| Team | Soulanova (`soulanova`), Pro; `team_DYnxDNYoZHChV2l7Z8GzAqTA` |
| Existing project | `soulanova-website`, `prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`, Node 24.x, framework null |
| Git integration | GitHub `Bmalitz6/Soulanova-website` |
| Latest inspected deployment | `dpl_5AyA2XhbnNPM7mrG1BRjeTjy9tYb`, READY, Preview (`target:null`), `iad1` |
| Deployment provenance | `preview/soulstretch-miriam-approved-a6c87b4`, commit `a6c87b429e931621ef6ac09c1babe3fbf7772dc3`; NOT the SoulFuel candidate |
| Reported protection | `ssoProtection.enabled:true`, `deploymentType:all_except_custom_domains`; password and trusted IP protection disabled |
| Project env listing | Empty (`envs:[]`, `hiddenProductionEnvCount:0`), decryption not requested |
| Installed integrations | Account/project views empty, including explicit team scope |
| Project connector connections | Empty |
| Domains | `soulanova.com` redirecting to `www.soulanova.com`, `www.soulanova.com`, `soulanova-website.vercel.app`; no changes made |
| Local link | No `.vercel` link or Vercel CLI found in this candidate; none installed or linked |

These are configuration observations, not signed-out access tests or a guarantee that protection has no exceptions. No SoulStretch deployment was altered. Existing Git integration is verified; this isolated local feature branch has not been published/connected as a Preview source. Do not push it without reviewing automatic deployment triggers and obtaining deployment authorization.

**Reuse result:** no compatible Redis integration is visible in this connected team/project. This does not prove the owner has no external Upstash database or another team. Before creating anything, owner should inspect Upstash Console and Vercel Storage/Marketplace for an existing *non-Production* database. Reuse only if it has spare capacity, compatible REST/Lua access, approved retention/region and eviction disabled; do not change another application's credentials, eviction or billing. A Production database is not suitable. Report database name/region/plan without pasting tokens. No integration was installed to discover resources.

## Recommended Redis configuration (proposal, not provisioned)

- Prefer a compatible existing Preview-only resource. Otherwise request owner authorization for one durable account-owned Upstash Redis database, proposed name `soulanova-foodscore-preview`. Marketplace is preferred if it supports the approved free plan and Preview-only connection. Inspect its connection targets before authorizing auto-injected variables. Do not use the anonymous three-day scratch database.
- **Region:** single primary AWS N. Virginia `us-east-1`, matching the inspected Vercel `iad1` footprint; no added read regions. Confirm the FoodScore function's actual region at authorized deployment time. No region setting changed. [Supported Upstash regions](https://upstash.com/docs/redis/features/globaldatabase).
- **Plan:** start with Free if available to the account and approved for the intended commercial Preview terms/security needs. Public pricing lists $0, 250 MB, 500,000 commands/month and 10 GB bandwidth; validate Marketplace-specific availability. Expected small Preview Redis cost: $0 within limits. No automatic paid upgrade, card entry or Prod Pack. If Free is unavailable, request explicit approval for PAYG at $0.20/100,000 commands with a proposed $5 monthly budget cap, no read replicas. Owner must set/verify the cap; it is not configured here. A paid plan has no Free-tier allowance. [Pricing and budget behavior](https://upstash.com/pricing/redis).
- **Capacity estimate (engineering assumption, not a quote):** 10,000 monthly barcode lookups, all misses, reserve up to seven billed command units per lookup including Lua subcommands: about 70,000 units, $0.14 PAYG command charges. 100,000 lookups at the same reserve: 700,000 units, $1.40. Hits need one GET. Confirm actual Lua billing/metering in a small authorized test; storage, replication, taxes, hosting and other traffic are excluded. Free quota is shared with any reused workload. The OFF upstream limit does not cap Redis cache-hit/abusive request costs.
- **Eviction:** leave disabled, because evicting the 60-second limiter key can reset the global budget. Monitor capacity; on exhaustion prefer blocked writes/fail-closed lookups over dropping limiter state. [Upstash eviction behavior](https://upstash.com/docs/redis/features/eviction).
- **Access:** authenticated HTTPS REST, server-only token; GET, SET EX, EVAL plus INCR/PEXPIRE/PTTL inside Lua. Read-only tokens cannot support this implementation. Verify ACL support on the chosen plan; a dedicated database limits blast radius if command/key ACLs are unavailable. Never put tokens in client code, URLs, logs or documentation. No SDK dependency is required; existing fetch POST command arrays are supported. [REST API](https://upstash.com/docs/redis/features/restapi).
- **Shared state:** every FoodScore function instance uses the same database, prefix `soulanova:foodscore:off:`, product keys `product:<barcode>`, and one `product-read:global` limiter. Known product TTL 3600 seconds; unknown TTL 300 seconds; atomic fixed window 10 cache misses/60 seconds. Reads can bypass the upstream budget only on a cache hit. Keep the budget shared across deployments sharing provider egress, not independent per instance. Fixed-window boundary bursts can still trigger OFF throttling; do not stress-test by sending a burst to OFF. Simulate rate-limit/error cases locally. Other applications sharing the same egress are not covered by this limiter.

## Exact branch/commit gate variables — preparation only

Project: `soulanova-website`. Preview branch scope: `feature/soulfuel-clean-preview-2026-11-09`. No remote variables have been set. Initially leave all three switches false.

| Variable | Initial value | Value required for an approved test |
| --- | --- | --- |
| `FOODSCORE_PREVIEW_ENABLED` | `false` | literal `true` only after explicit activation approval |
| `FOODSCORE_PREVIEW_APPROVED` | `false` | literal `true` after license, score and retention approval |
| `FOODSCORE_PREVIEW_PROTECTION_CONFIRMED` | `false` | literal `true` after page/API protection checks |
| `FOODSCORE_PREVIEW_APPROVED_BRANCH` | exact feature branch | `feature/soulfuel-clean-preview-2026-11-09` |
| `FOODSCORE_PREVIEW_APPROVED_COMMIT` | unset until owner review | full 40-character lowercase SHA of the final reviewed source commit (`git rev-parse HEAD`); never a short SHA or branch name |
| `UPSTASH_REDIS_REST_URL` | unset | approved HTTPS REST origin, no credentials/path/query |
| `UPSTASH_REDIS_REST_TOKEN` | unset | server-only Secret, authorized GET/SET/EVAL access |

The legacy `FOODSCORE_PREVIEW_HOST` grants no access and is no longer required. No variables for Production. Do not change Production settings, domain mappings or shared variables. Inspect any Marketplace auto-injection before accepting; restrict targets to Preview and this branch. Store URL/token as Secrets, approval switches/branch/commit as server configuration. No public prefixes. Environment changes require a new deployment and do not modify old deployments.

### Resolved generated-hostname activation

The server policy requires platform-provided `VERCEL=1`, `VERCEL_ENV=preview`, `VERCEL_TARGET_ENV=preview`, and `VERCEL_PROJECT_ID=prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`. Both target variables are mandatory; unknown, missing or conflicting targets fail closed. Actual `VERCEL_GIT_COMMIT_REF` and `VERCEL_GIT_COMMIT_SHA` must exactly match the owner-approved branch and full SHA. These values come only from the server environment. [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables).

The runtime generated `VERCEL_URL` must be a valid single-label `*.vercel.app` deployment hostname. Request Host must equal that server-provided hostname, and Origin, if present, must be its HTTPS origin. These request fields only restrict an already approved deployment; they cannot supply approval. Forwarded-host/environment headers, query parameters, body fields and browser flags cannot authorize. Custom domains and branch aliases remain rejected; visit the generated deployment URL. No hostname must be guessed before deployment.

Redeploying the same approved project/branch/SHA can generate a new hostname and remains eligible after protection verification. A new source commit or branch is denied until separately reviewed and approved. Owner approval covers redeployments of that exact source identity, not one deployment ID. Do not approve a commit containing unrelated/unreviewed changes. Standard Git-linked deployment metadata must be present; CLI/manual deployments without it remain disabled. Do not manually set/spoof Vercel identity variables. Protection remains platform authentication, not this policy's confirmation switch.

## Upstash Free integration checklist — owner execution only

1. Confirm explicit resource/credential authorization. Check owner Upstash Console for an existing compatible non-Production database first; prior connected Vercel inventory found none. Do not consume or reconfigure another session's resource.
2. If a new resource is approved, use the owner's durable account; name `soulanova-foodscore-preview`. Choose **Free**, AWS **N. Virginia/us-east-1** single primary, no extra read regions, and eviction **disabled**. Public Free allowance: $0, 250 MB, 500K monthly commands, 10 GB bandwidth. Confirm current Free eligibility and security/commercial terms in Console. Do not enter a card, accept a paid fallback/upgrade or add Prod Pack without new approval. [Pricing](https://upstash.com/pricing/redis), [regions](https://upstash.com/docs/redis/features/globaldatabase), [eviction](https://upstash.com/docs/redis/features/eviction).
3. Prefer Marketplace only if its checkout offers the approved Free plan and permits Preview-only project linking; review targets before completing. If it cannot restrict branch scope, keep it unlinked and use owner-authorized manual Preview branch variables. Do not auto-inject Production credentials. A missing Free option means stop before creating, not silently switch to PAYG.
4. Obtain the database HTTPS REST URL and a writable REST token privately. The existing proxy needs GET, SET EX, EVAL and INCR/PEXPIRE/PTTL inside Lua; readonly token is insufficient. Confirm ACL capabilities before narrowing permissions. Never paste values into chat, commits, screenshots or browser variables. No new dependency is needed.
5. After separate configuration approval, add the two Redis Secrets to the exact Preview feature branch, plus the five gate variables above. Keep all approval/enabled switches false while reviewing protection. Enable native system-variable exposure if needed only with owner approval; never fill missing native identity variables yourself.
6. All instances use the same approved database and unchanged `soulanova:foodscore:off:*` namespace. Retain 3600-second known/300-second unknown product TTLs and shared 10-miss/60-second Lua limiter. Do not flush limiter keys or enable eviction. Monitor Free capacity; errors fail closed. Cache-hit traffic still consumes Redis commands and is not capped by the upstream limiter.
7. Owner records database name/region/plan, budget/no-upgrade choice, retention/logging decisions and scoped variable *names*, without secret values. Verify cache/limiter behavior only during separately authorized testing. No provisioning or credential write was performed by this session.

## Protection requirements

Use the existing Vercel Authentication protection if it covers this Preview's page, scripts and both `/api/foodfacts` and `/api/foodscore-availability`. Reuse the existing setting without changing Production protection. Owner must inspect exceptions, shareable links, trusted sources and automation bypass access. Do not add bypasses or generate/copy bypass secrets into browser code. Test a clean signed-out browser on the exact eventual host: all three paths must encounter protection before application content; a logged-in member session alone does not replace Vercel protection. Authorized team tester then signs into that same host. Use relative same-origin scripts/API requests. [Vercel protection documentation](https://vercel.com/docs/deployment-protection).

## License, privacy and score approvals still needed

- Registration records API usage; it does not approve commercial licensing or the Soulanova algorithm. Preserve actual registration receipt/scope and confirm the User-Agent contact remains correct.
- ODbL allows commercial use (§3.1), requires output attribution (§4.3), and can require share-alike and machine-readable database/alteration access for publicly used derivative databases (§§4.4–4.6). Owner/legal reviewer must assess cumulative extraction, Redis collection, derived scores and saved OFF diary data, including whether external Preview testers constitute public use. Do not release private diaries or proprietary recipes as an assumed compliance mechanism. Short TTL does not remove license obligations. [ODbL text](https://opendatacommons.org/licenses/odbl/1-0/).
- DbCL applies separately to contents; retain the existing OFF product/source link and ODbL/DbCL links. Consider explicit “Contains information from Open Food Facts, available under ODbL” wording in any new export/output. Images stay disabled; separate CC BY-SA/package-art review is needed before enabling them. [DbCL](https://opendatacommons.org/licenses/dbcl/1-0/), [OFF licensing guidance](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md).
- Approve one-hour known/five-minute unknown product cache, vendor region, access/deletion and backup retention. TTL removes live keys, not necessarily backups/logs. Disable body/barcode/token logging, review provider-host logs and require documented retention. Local member diary/goals persist until user deletion/browser clearing; no cloud sync or automatic age expiry is promised.
- Existing UI calls FoodScore provisional, Soulanova-derived, separate from official Nutri-Score and not medical advice; shows factors, unavailable missing values and community/unverified provenance. Owner must approve methodology/weights/thresholds and assess any comparative-health claims. Do not imply OFF endorsement, clinical validation, allergen safety or individualized dietary suitability. Package label verification remains necessary. This review does not grant legal or clinical approval.

## First protected Preview barcode test — ready runbook, NOT executed

1. Owner retains registration receipt/actual submitted scope and signs off on license/attribution, score wording, local diary privacy and cache/log retention. No resubmission required.
2. Owner identifies any reusable external Preview Redis; otherwise explicitly approves Free provisioning or the priced fallback. Confirm region, eviction off, capacity, credentials and budget without modifying Production resources.
3. Review the completed branch/commit policy and passing regression tests. Record the final source commit using `git rev-parse HEAD` after all reviewed code/docs are committed. Set `FOODSCORE_PREVIEW_APPROVED_BRANCH` and `FOODSCORE_PREVIEW_APPROVED_COMMIT` to that branch/full SHA only after approval; no code edit is needed to approve a SHA, so there is no self-referencing commit problem.
4. Owner authorizes publishing the reviewed feature branch and a Git-linked Preview deployment; first inspect automatic deploy triggers. Configure the seven variables above under Preview-only branch scope, all three switches initially false. Do not merge, deploy Session 2's branch, or manually spoof native platform variables.
5. Record disabled deployment ID, source branch/SHA, project, environment and generated URL. From a clean signed-out browser verify the page and both API paths require Vercel authentication. With Vercel login, availability must be false and POST lookup 503 without Redis/OFF. Inspect exceptions and bypass access. Keep Production untouched.
6. With explicit activation authorization and all legal/retention/protection approvals, change only the three Preview switches to true and redeploy the **same approved source SHA** through the Git-linked workflow. A new generated URL is expected. Recheck platform source metadata and signed-out protection on the new URL. In an authorized same-origin browser, availability must return only `enabled:true`. If metadata is missing/mismatched, do not spoof it; stop and correct the authorized deployment workflow. Restrict or retire old enabled Preview deployments through an approved process; env updates do not revoke them retroactively.
7. On that same host, enter one real EAN/UPC from a tester-owned package through the manual form. In browser Network confirm `POST /api/foodfacts`, JSON `{"barcode":"<actual package digits>"}`, no barcode in browser URL and `Cache-Control: no-store` response. Barcode lengths: 8/12/13/14 digits. A known product should display community nutrition, provenance/license links and provisional score only if sufficient data. Confirm the package identity/portion before saving; don't invent a barcode fixture as a known live product.
8. Repeat the same lookup once; inspect approved Redis command/TTL metrics to confirm cache reuse and one upstream read total. Test unknown/incomplete/permission-denied cases without a burst; exercise outages/rate limits through mocks rather than deliberately exceeding OFF limits. Use a dedicated member test account if saving; verify diary isolation, portions, local persistence and deletion. Verify recipes, manual diary and Nutrition Goals still function.
9. Test camera only after a deliberate Scan tap; permission denial/unsupported browser must leave manual entry usable. Verify video stops after detection/Stop/page hide on physical iOS Safari and Android Chrome. Do not advertise universal camera support from mocked tests.
10. Capture pass/fail evidence without tokens or member data. Leave Production hard-disabled. If protection/configuration is wrong, stop testing and disable Preview via the approved workflow; a changed environment setting alone does not turn off already-running deployments. Do not expose old enabled Preview deployments; retain access protection and use an authorized retirement/rollback process.

## Local verification

Run the focused and complete available SoulFuel/member suites sequentially; counts are recorded in the owner handoff after execution. No live service tests are represented as complete. The recipe library, manual diary, Nutrition Goals, scanner, client, cache and limiter are unchanged by this gate fix. New tests cover missing/incorrect native metadata, Production and conflicting target denial, approval switches, branch/full-SHA/project matching, regenerated hosts, spoofed requests and no-I/O API denial.
