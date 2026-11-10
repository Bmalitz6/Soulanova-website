# Final staging preparation — 2026-11-09

Technical preparation GO; real lookups remain BLOCKED until the owner decisions below. Release SHA is the commit containing this document, recorded in delivery; do not use its parent 1543b5f for new activation.

## Corrected provenance and preserved behavior

Local/GitHub branch heads matched 1543b5f3721f92199b197468fd79d5666d0d5161 before editing. No newer scanner or tracker design existed on the branch. Only source provenance/labels, regression assertions and handoff documentation change. Source and newly saved diary links now use https://world.openfoodfacts.net/product/{barcode}. Results visibly say staging/test data, not suitable for nutrition decisions. New diary source labels retain that warning. Existing entries remain unchanged, including historical provenance; no storage migration or rescoring occurs. Footer uses the same staging source.

Formula remains provisional 60 nutrition / 25 ingredients / 15 processing. Missing-data, category/basis/portion safeguards, duplicate prevention, readback persistence, isolation, manual diary/goals, scanner and all 75 recipes remain unchanged. Mock browser regression verifies staging links and diary provenance in addition to product -> 90/100 score -> 75 g portion -> 112.5 kcal/6 g protein -> confirmation -> one saved entry -> reload. No external product lookup is required to run tests.

## Privacy and cache audit

Browser sends only a barcode JSON POST to the same-origin proxy. Server constructs a fixed staging v3.6 GET from validated numeric barcode and selected fields, with app/version/contact User-Agent and public staging Basic identification. It forwards no member IDs, diary, goals, cookies or camera frames. Product images are not requested or loaded.

Redis commands operate only on product response cache and shared limiter keys. Cache data is OFF response JSON, not member records; known responses expire after 3600s, unknown after 300s; limiter after 60s. Ten upstream misses per fixed minute across instances; no retries, timeout 10s OFF/3s Redis. Existing mock tests verify these paths and fail-closed behavior. Bounds are TTL/rate/time and selected requested fields, not a hard serialized-response byte cap or total key-count quota. Provider capacity/eviction/backups/log retention require owner review; expiry is not backup deletion. No token value or Redis contents were accessed. Actual credentials/connectivity remain acceptance checks after separate authorization.

## Attribution, licensing, retention and test disclosures

Results retain nearby OFF source, ODbL and DbCL links; scoring factors, completeness and provisional limitations remain available. OFF images stay omitted. Product identity/nutrition are community-reported, not independently verified. Staging records may differ from production/package and may not support a numeric score. No medical/allergen/personal suitability claims. Member-scoped diary persists in this browser until deletion/clearing; it is not encrypted/cloud synchronized and shared browser-profile access remains a limitation.

Official references: [OFF license guidance](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/), [API usage/staging instructions](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md), [ODbL](https://opendatacommons.org/licenses/odbl/1-0/), [DbCL](https://opendatacommons.org/licenses/dbcl/1-0/). Commercial use is permitted subject to terms; ODbL notices, public derivative share-alike and database/alterations access can apply. Classify caches/derived scores/persisted OFF-derived data, repeated extractions and who counts as an internal controlled tester. Authentication alone settles none of these questions. Private diaries must not be published as a sharing workaround. No universal retention interval is established by these licenses; current TTLs are application choices, not exemptions.

Registration is owner-reported submitted November 9, not externally approved. Actual receipt/scope remains owner evidence. OFF terms and attribution wiki were inaccessible to automated review; owner/legal reviewer must read [terms](https://world.openfoodfacts.org/terms-of-use) and [wiki](https://wiki.openfoodfacts.org/ODBL_License) directly. Unresolved legal questions remain unresolved; no external/legal approval is asserted.

## Only remaining owner decisions

1. Approve limited owner-controlled staging use after direct terms/wiki review, attribution/database-license classification, retention and logging/backups controls; confirm registration scope and monitored support@soulanova.com contact.
2. Accept provisional score/partial coverage and browser-local test diary limitations; confirm deployment access is limited to authorized owners, including team/share/bypass access.
3. Authorize exact final release SHA below for branch-specific activation and a separate Preview redeployment/limited live test; select test end time/operator and authorize retirement of enabled test deployments for rollback. No live activation is authorized by preparation/deployment alone.

## Future activation instructions — NOT executed

Project soulanova-website, pinned project ID prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I. Every variable must target Preview ONLY and Git branch feature/soulfuel-clean-preview-2026-11-09 ONLY. Existing Redis secrets remain unchanged. Set only after decisions/authorization:

```text
FOODSCORE_PREVIEW_APPROVED_BRANCH=feature/soulfuel-clean-preview-2026-11-09
FOODSCORE_PREVIEW_APPROVED_COMMIT=<full 40-character final release SHA from delivery>
FOODSCORE_PREVIEW_APPROVED=true
FOODSCORE_PREVIEW_PROTECTION_CONFIRMED=true
FOODSCORE_PREVIEW_ENABLED=true
```

Redeploy exact final SHA to Preview using saved configuration. Never manually spoof native VERCEL identity variables. Verify READY, native project/branch/SHA and Preview target, signed-out Vercel Authentication for page and both APIs, signed-in availability enabled:true, unchanged Production/domains. Use the native generated deployment hostname; aliases/custom domains are denied. Missing identity leaves lookup off. Production remains hard-denied even with all switches true.

First test: one manual owner-held barcode known to staging; OFF documentation example 3274080005003 is an unverified candidate, not a guarantee of data or score. Check test label/product/basis/nutrients against package where available; accept not-found/Insufficient data honestly. Select portion, explicitly confirm Add once, verify totals/one entry/readback/reload. Repeat lookup once without adding for cache verification using sanitized provider metrics if available. Then physical camera permission/denial/stop/manual-fallback acceptance; no burst or deliberate outage test. No personal records/screenshots or tokens in test reports. Delete test diary rows afterward.

Rollback must retire/deny access to older enabled generated deployment URLs under authorization; changing flags and redeploying only affects the new build. Keep SSO protection throughout. No Production promotion/activation is included.

Public launch remains a separate project: full legal/share-alike release mechanism, public privacy/retention controls, scoring/category validation, physical device acceptance, abuse/egress monitoring, image rights if added and separately approved Production architecture. Internal success is not launch clearance.
