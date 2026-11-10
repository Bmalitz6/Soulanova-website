# SoulFuel visual, FoodScore and Daily Tracker upgrade

Base: approved disabled Preview commit `0f588f629eb556faeaa0502d9708bd689a8964d8`. Scope: existing clean FoodScore branch only. No Production/main/domain, Redis-secret, formula activation or paid-resource changes. New source commit and deployment URL are returned in the session delivery after publish, avoiding a self-referencing commit entry here.

## Before / after

- Simple decorative hero → editorial Soulanova header, owned Mediterranean bowl illustration, clear Scan Food / Daily Tracker actions and mobile layout.
- Text collection tiles → illustrated collection cards plus two direct featured-recipe cards using real existing recipe names/anchors. All 75 original recipes, category search/individual Print controls and original source nutrition caveats remain intact. Artwork is illustrative, not a claimed photo of a specific dish.
- Uncontextualized per-product score → owner-approved 60/25/15 components, category profiles, visible coverage/missing-data explanation, selected-portion preview and accessible gauge. No score when essential evidence or units are unknown.
- Product save excluded from every displayed total → explicit package/portion confirmation, exact persistence readback, labeled community estimates in the Daily Tracker, and personal goal progress. Historical curated totals retain their separate contract; unconfirmed old entries stay excluded from reported tracker totals.
- Duplicate-click guard preserved; failed manual saves retain input; account switching clears prior forms/results and rejects delayed responses. No default calorie targets, no syncing claim and no member identity/diary content in barcode requests.

## Test evidence

Command (tools installed outside the repository):

```sh
SOULFUEL_PLAYWRIGHT_PATH=/path/to/playwright \
SOULFUEL_AXE_PATH=/path/to/@axe-core/playwright \
node --test --test-concurrency=1
```

**60 passed, 0 failed, 0 skipped**: all 42 existing checks, nine new formula/scaling tests, four new tracker/persistence tests and five real-browser checks. Browser tests use only mocked local API/auth data and block non-local requests. Coverage includes desktop 1280px, iPhone-like 390px, narrow 320px, no horizontal overflow, member switching, stale responses, confirmed portion totals/goal bars, duplicate prevention, reload persistence, failed writes and automated axe WCAG 2 A/AA + 2.1 AA checks in disabled and mock-product states. This is browser emulation, not physical iPhone camera acceptance. Accessibility automation is not a complete human accessibility audit.

Without the two external tooling paths, Node reports the five browser checks skipped; do not report that as a full browser run. No source package/dependency manifest was introduced or changed.

Screenshots and complete test log are retained locally in `.git/soulfuel-upgrade-evidence/` (not published or deployed). The mocked-score screenshot contains synthetic fixture data only.

The pre-existing integration regression confirms all 77 files inherited from the GitHub main base remain byte-identical. All eight recipe-library files and both default-off/Production gate files were separately hash-compared against the approved Preview baseline: unchanged. Modified/new JavaScript parses; heuristic secret scan found no private keys, recognized provider tokens, JWTs or credential-bearing URLs. `git diff --check` passes for the new delta. These checks are not a guarantee against every secret format.

One command initially used the initial nutrition checkout instead of this clean branch. Its two unintended text edits were reversed immediately; all three files written by that command (including one no-content-change write) were hash-verified against the original capture. No residual content change remains there. Original Session 3 snapshots/bare repository/audit and Sessions 1/2 work were not otherwise modified.

## Scoring, licensing and external-test boundary

See [exact v2 formula, evidence and compliance review](SOULFUEL_SCORE_V2_AND_COMPLIANCE_2026-11-09.md). Owner starting weights are implemented; thresholds, taxonomy, coverage normalization and labels still require validation. No medical, disease, allergen-safety, OFF-endorsement or personalized-health assurance.

Registration remains owner-reported submitted, not externally approved. ODbL/DbCL commercial reuse, attribution, public/derivative-database sharing and cache/local/log retention decisions remain open. Automated access to current OFF terms/wiki was blocked; owner/legal reviewer must inspect those pages directly before external testing. Product images remain omitted; existing approved repository food illustrations are reused without a purchase or generation.

The proxy now uses the fixed OFF staging host as instructed for test applications by the official API documentation. It still uses server-side shared Redis, the same global atomic miss limiter and known/unknown TTLs. New host/schema-specific product cache keys prevent accidental data mixing. This work did not call either OFF host or Redis. All product responses in tests were synthetic.

## Disabled Preview verification and first external test

Before publishing, Vercel metadata confirms the existing project/repository, authentication enabled and only the two branch-restricted Preview Redis Secret names; no activation variables. Owner previously visually confirmed Production tracks main and Preview tracks unassigned branches. No secret value was requested.

Publishing this feature branch may automatically build its protected Preview. Verify the exact resulting branch/SHA/READY state; signed-out page and both APIs must redirect to Vercel Authentication. With existing authenticated access, availability must report false and a barcode-free GET to lookup must return 503 Coming soon. Compare Production deployment/domains/aliases and Redis metadata before/after. Do not enable or run live barcode lookup to validate the UI.

A first external barcode test requires separate owner authorization after manual terms/license/retention/methodology review. Approve the new exact branch/SHA, set only Preview approval switches/config, and redeploy that same source. Use the generated protected hostname. Start with one manually entered barcode available on OFF staging, verify identity/portion and readback, then repeat once to check shared cache reuse. Unknown products must remain not found. Exercise provider throttling/outages with mocks, not live bursts. Test camera denial/Stop/page-hide on physical devices before claiming mobile camera coverage. Full steps and rollback implications are in the linked formula/compliance report.
