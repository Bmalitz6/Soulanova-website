# First owner-only FoodScore staging test — readiness audit

> Historical audit of 1543b5f. The source-link discrepancy is corrected by the subsequent final preparation release; see SOULFUEL_FINAL_STAGING_PREPARATION_2026-11-09.md. Use the final release SHA, not this historical SHA, for future activation.

Audit date: 2026-11-09. **Technical checks PASS; activation BLOCKED pending explicit decisions and authorization below.** No activation, deployment, external product lookup, credential read/change or Production change occurred. This local report is uncommitted so the reviewed application SHA remains exact.

## Reviewed identity and configuration

- Worktree: `Soulanova-SoulFuel-clean-preview-candidate-2026-11-09`.
- Branch: `feature/soulfuel-clean-preview-2026-11-09`.
- Local and GitHub branch SHA: `1543b5f3721f92199b197468fd79d5666d0d5161`; worktree was clean at audit start. No later tracker-dial/scanner revision exists on this branch; current premium redesign is included.
- Project: `soulanova-website`, `prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`.
- Deployment: `dpl_8bi48bd6dvjEd7srx7FbbhAd8Cdh`, READY, Git metadata matches branch/SHA, target null (Preview).
- URL: https://soulanova-website-a4g0vsk6o-soulanova.vercel.app/app/soulfuel
- Vercel Authentication enabled: `all_except_custom_domains`. Signed-out requests to page, `/api/foodscore-availability` and `/api/foodfacts` each return 302 to Vercel Authentication. Authentication is a deployment-level dependency, not implemented by the FoodScore approval variables. Verify allowed people/access groups/share links/bypass holders: SSO protection alone does not mean owner-only access.
- Metadata-only inspection: both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are sensitive, Preview-only, exact branch restriction above. No unrestricted Preview/Development/Production Redis entries returned; hiddenProductionEnvCount=0. No activation variables present. No values decrypted, printed, copied or tested.
- Native server identity must match Vercel=1, both environment targets=preview, pinned project, approved branch/full SHA, generated VERCEL_URL and request Host. Origin, when supplied, must match. Headers/query/body cannot grant approval. Production/conflicting targets deny before Redis/OFF even with every flag true. Aliases/custom domains deny. Regenerated hostname for the same approved identity works. Platform identity variables must never be manually spoofed.

## Data flow and regressions

Full available sequential repository suite with external Playwright and axe tooling: **64 passed, 0 failed, 0 skipped** (57 non-browser, 7 browser). Test output: `/private/tmp/soulfuel-staging-readiness-tests.log`. Product/auth/network are mocked; browser tests block external traffic. Includes security gate/spoofing, POST-only barcode privacy, upstream failures, shared Redis fail-closed behavior, nutrient units/scaling/missingness/category scoring, save readback, duplicate IDs, member isolation, manual CRUD/goals, 75-recipe preservation, responsive widths and automated accessibility.

Mock browser: manual barcode -> product -> provisional 90/100 -> measured 75 g -> 112.5 kcal and 6 g protein -> explicit review -> one persisted entry -> updated totals -> reload persistence. Repeated confirmation disabled. A new scan intentionally permits a separate consumption event. Camera capability/permission/stop/manual fallback has mocked coverage; physical iPhone/Android decoding remains a live acceptance item.

Core nutrients/category/units must be available and at least 75 weighted points assessable for a score; otherwise Insufficient data. Unknown nutrients stay null. Coverage is completeness, not clinical confidence. Provisional 60/25/15 formula, factors, missing inputs, unverified community source and separate Nutri-Score/NOVA labels are disclosed. Partial normalized scores and frequency-like band labels need owner acceptance for this small test and further validation before public use.

Only barcode is posted to same-origin proxy. OFF receives server-side selected-field read-only GET, app User-Agent `Soulanova-FoodScore/1.0 (support@soulanova.com)` and documented public staging Basic identification. No member identity, diary, camera frames, cookies or goals are forwarded. Upstream fixed to `world.openfoodfacts.net/api/v3.6/product`; no user-supplied host, edits, searches or automatic retries. OFF timeout 10s; Redis command timeout 3s. Contact mailbox ownership/monitoring must be confirmed.

Redis: shared product namespace `soulanova:foodscore:off:staging:v2:product:*`; known product TTL 3600s, unknown 300s. Shared atomic INCR/PEXPIRE/PTTL limiter, 10 misses/60s, global key across instances. Cache hits avoid upstream budget. Missing/broken Redis or invalid limiter blocks upstream; cache-write failure does not discard an already successful read. HTTPS REST token stays server-only. Fixed windows/shared Vercel egress can still reach OFF's 15 reads/min/IP cap; no load test. This is an upstream budget, not per-user abuse protection. Live token permissions, capacity/eviction, provider retention/backups/logging and end-to-end connectivity remain unverified without authorized I/O.

## Official license/API review and outstanding decisions

Sources read: [OFF API introduction](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md), [OFF license guidance](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), [DbCL 1.0](https://opendatacommons.org/licenses/dbcl/1-0/). [OFF terms](https://world.openfoodfacts.org/terms-of-use) returned crawler-block text; [ODbL/attribution wiki](https://wiki.openfoodfacts.org/ODBL_License) returned access denied. Owner/legal reviewer must read those directly; this audit cannot claim their complete review.

ODbL §3.1 and DbCL §2 allow commercial use subject to conditions. ODbL §§4.2–4.3 govern notices/attribution; §§4.4–4.6 can require share-alike and machine-readable database/alterations access for publicly used derivatives. Repeated small extractions can become substantial. Decide classification of Redis collection, derived scores and persisted OFF-derived entries; keep proprietary recipes and private diaries separable. Do not publish personal diaries to meet database-sharing duties. Owner-controlled internal testing may differ from outside testers under the license's Publicly definition; authentication alone does not settle this. This is not a legal clearance or an assertion that app source must be published.

No universal cache TTL or mandated deletion interval was established from the accessible license texts. Current TTLs are app choices, not license exemptions; expiry does not prove deletion from logs/backups. Approve retention/vendor controls: cache 1h/5min; limiter 60s; local member diary persists until deletion/browser clearing; vendor logs/backups require a documented policy. Browser-local member scoping is not encryption, cloud sync or protection from other scripts/profile users. Do not log bodies, tokens or member diary data.

Registration is **owner-reported submitted 2026-11-09**, not externally approved; receipt/submitted scope not independently inspected. API docs ask notification and custom User-Agent; no separate read-only approval credential is described. Inference: acknowledgement is neither legal clearance nor permission beyond license/API terms. Staging use is expressly requested for tests. Product images remain omitted, avoiding current OFF image-reuse issues; future use requires CC BY-SA/photographer/package-art review.

Outstanding decisions before first test:

1. Owner/legal reviewer accepts limited owner-controlled staging use after direct terms/wiki review; classifies data reuse/sharing and approves retention/attribution. Reconcile registration receipt/entity/contact/scope; no resubmission assumed.
2. Confirm only authorized owner(s) have deployment access; no public API exceptions/shared bypass. Approve small manual test budget (one initial request and one repeat; additional camera request only if needed), rollback operator and test end time.
3. Accept provisional scoring/partial coverage limitations and local-only diary behavior.
4. Resolve staging provenance: current result/diary source links use `world.openfoodfacts.org` while lookup uses `.net`. For this internal test, explicitly accept the documented mismatch and treat `.net` response/package as evidence, or request a staging label/link correction, retest and approve its NEW SHA before activation. Production link is not evidence of the staging record. Do not silently change the approved SHA.
5. Separately authorize branch-specific activation variables and Preview-only redeployment/test. This task grants none of these actions.

## Exact proposed activation and deployment procedure — NOT executed

Vercel project above, target **Preview**, Git branch restriction **feature/soulfuel-clean-preview-2026-11-09** on EVERY entry. Inspect existing scope before changing anything. Keep existing Redis secrets untouched. No Development, Production or unrestricted Preview entries.

```text
FOODSCORE_PREVIEW_APPROVED_BRANCH=feature/soulfuel-clean-preview-2026-11-09
FOODSCORE_PREVIEW_APPROVED_COMMIT=1543b5f3721f92199b197468fd79d5666d0d5161
FOODSCORE_PREVIEW_APPROVED=true
FOODSCORE_PREVIEW_PROTECTION_CONFIRMED=true
FOODSCORE_PREVIEW_ENABLED=true
```

Only after the approvals above, set these server-only entries (no public prefixes); do not manually define VERCEL platform identity variables. Redeploy the exact reviewed Git deployment to Preview with saved current environment configuration. Do not deploy local report/uncommitted files, push a changed SHA, promote, assign Production domains or change secrets. If source changes are chosen, replace the SHA only after review/tests/owner approval. Confirm runtime native Git/project/Preview variables are exposed by Vercel; missing identity safely keeps OFF.

Record new generated URL/deployment ID; verify READY, branch/SHA, Preview target, signed-out protection on page AND both APIs, unchanged Production/aliases. Signed-in availability must return enabled:true without any product lookup; false means STOP and inspect metadata, not bypass the gate. Existing disabled deployment does not acquire new environment values retroactively.

Rollback must address immutable builds: disabling flags and redeploying does not revoke older enabled deployment URLs. Retire/delete or otherwise deny access to enabled test deployments under explicit owner authorization, retain protection, and verify retired URLs cannot perform lookups. Do not assume a branch alias move revokes a generated URL.

## First barcode procedure after separate authorization

1. Owner authenticates to Vercel and the app at the new generated URL. Inspect browser network for same-origin POST only. Start with manual entry to isolate service connectivity from camera behavior.
2. Official staging documentation example is `3274080005003`. It was NOT looked up here; presence, completeness and score eligibility are unknown. Prefer an owner-held package with a matching staging record. Unknown/Insufficient data are valid outcomes, never substitute production or fabricate a score. A numeric-score acceptance test requires a genuinely eligible staging record.
3. Perform one lookup. Compare name/brand/units/nutrients to package where available; record mismatches without personal data. Inspect provisional factors/coverage and missing fields. Expand nutrition details. Select reported servings or measured g/ml matching the exact basis; verify independent scaling, with absent values unavailable.
4. Check explicit confirmation, Add once, verify readback success, exactly one diary entry, calories/protein/carbs/fat totals, reload persistence. Repeated Add for the same lookup must not duplicate. A second lookup may intentionally create another consumption event; do not Add it during cache verification.
5. Repeat the same lookup once for cache behavior using non-sensitive provider metrics if available; browser response alone does not prove cache reuse. No cache deletion, burst/load test or deliberate outage. Stop on Redis/provider errors and inspect sanitized metadata only.
6. Test camera after explicit Scan action, permission denial/manual fallback, stop/page hide and supported physical device decoding. Use same package if available; no photo upload. Verify account switch hides prior member data. Delete test diary entries, then close/retire the test window using authorized rollback.

## Separate public-launch requirements

Public launch is not authorized: resolve full terms/wiki and derivative/collective database/share-alike mechanism; accessible attribution/data notices; privacy/deletion/log/backups policy and vendor controls; validate score taxonomy/cutoffs/bands/partial coverage with qualified review; broader category/quality and physical-device testing; request/egress abuse budgets and observability; confirm registration scope/contact; review image rights if added. Production OFF host switch and a Production enablement design would require separate code/security/legal approval—the present gate intentionally cannot enable Production. No public compliance approval is implied by a successful internal scan.
