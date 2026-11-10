# SoulFuel v2 formula, data review and disabled Preview release

Owner starting design: 60 nutritional balance, 25 ingredient quality, 15 processing context. All weights, score mappings, confidence cutoffs and labels are provisional Soulanova design decisions. None is clinically validated. This is not Nutri-Score, NOVA, dietary frequency advice, an allergen checker or personalized nutrition guidance.

## Baseline audit and preserved boundaries

Baseline `0f588f629eb556faeaa0502d9708bd689a8964d8` used 60 nutrition / 25 NOVA-based combined ingredient-processing / 15 fiber-NOVA, required every input and applied identical solid thresholds to all products. It treated reported NOVA as ingredient quality and processing simultaneously. Saved OFF products were excluded from all displayed totals. `setItem` success was not followed by persistence readback. There was no selected-portion nutrition preview, explicit product confirmation or goal progress display.

The v2 change retains the tested normalizer, secure POST proxy, shared Redis cache/atomic limiter, camera/manual fallback, member-local storage keys, manual CRUD and all eight recipe-library source files. Existing 75 recipe text/nutrition warnings are unchanged. Existing six free recipes, meal plans, auth configuration and every file inherited from GitHub main remain untouched. No snapshot, other session, shared navigation, Production configuration or Redis credential was changed.

## Exact formula (`soulanova-provisional-2`)

For a lower-is-better metric: value ≤ low cutoff earns full allocated points; low < value ≤ high earns half; above high earns zero. For a higher-is-better metric: value ≥ high earns full; mid ≤ value < high earns half; below mid earns zero. Inclusive boundaries are tested.

### Nutritional balance — 60

| Profile | Metric and unit | Full-points cutoff | Half-points cutoff | Maximum |
| --- | --- | --- | --- | --- |
| Solid foods, meals, snacks | Reported added sugars, g/100 g, if available | ≤2.5 | ≤10 | 15 |
| Same, if added sugars absent | Total sugars proxy, g/100 g | ≤5 | ≤22.5 | 15 (replaces, never adds to, added-sugar metric) |
| Solids | Saturated fat, g/100 g | ≤1.5 | ≤5 | 15 |
| Solids | Sodium, mg/100 g | ≤120 | ≤600 | 10 |
| Solids | Fiber, g/100 g | ≥6 | ≥3 | 10 |
| Solids | Protein energy share = 400 × protein grams / kcal (%) | ≥20 | ≥12 | 10 |
| Beverages, confirmed liquid basis | Total sugars, g/100 ml | ≤2.5 | ≤11.25 | 30 |
| Beverages | Sodium, mg/100 ml | ≤120 | ≤300 | 10 |
| Beverages | Saturated fat, g/100 ml | ≤0.75 | ≤2.5 | 10 |
| Beverages | Energy context, kcal/100 ml | ≤20 | ≤50 | 10 |
| Oils | (Reported mono + polyunsaturated fat) / total fat | ≥0.8 | ≥0.6 | 40 |
| Oils | Saturated / total fat ratio | ≤0.15 | ≤0.3 | 20 |

Solids require calories, protein, carbohydrates, total fat, sugars, fiber, saturated fat and sodium. Drinks require energy, total sugars, sodium, saturated fat and explicit volume metadata. Oils require energy, total fat, saturated fat, monounsaturated and polyunsaturated fat. Missing values are not zeros. Ingredients text and a supported, unambiguous source category are required. Unsupported baby foods, supplements, alcoholic beverages or conflicting profiles receive no score. Unrecognized but supplied solid-food categories use the general solid profile. This category mapping is intentionally limited and requires broader food-catalog validation before broader release.

Nutrient values exceeding basic composition bounds (e.g. saturated > total fat; sugar > carbohydrates; added > total sugars; grams >100/100 g; protein energy substantially above reported energy) are not repaired or guessed: score suppressed. This is a sanity check, not a full data-quality validator. Per-serving values are displayed only if supplied; per-100 values are never copied into a serving field.

Reasoning: UK front-of-pack concentration bands inform total-sugar/saturated-fat cutoffs and salt equivalents (sodium = salt/2.5, standard grams to mg). The EU claim criteria inform fiber/protein cutoffs; this app does not grant a regulated nutrition claim. These sources do **not** validate this scoring algorithm. Added-sugar cutoffs, beverage energy bands, oil ratios and point allocations are design choices informed by directional evidence, not official category score thresholds. Solid meals/snacks retain the concentration bands with an explicit selected-portion disclosure; energy and carbohydrate values are displayed, not independently rewarded. Oils are compared using measured fatty-acid composition rather than penalized for being energy dense or lacking fiber. Drinks are not penalized for lacking fiber/protein. None of these profiles establishes how much a person should consume.

Primary references checked 2026-11-09:

- [UK front-of-pack guidance](https://assets.publishing.service.gov.uk/media/5a80cd03ed915d74e33fc7c5/FoP_Nutrition_labelling_UK_guidance.pdf), food/drink concentration tables. This implementation does not apply that system's high-per-portion label rules or claim to implement the full traffic-light scheme.
- [EU Regulation 1924/2006](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006R1924), Annex fiber/protein criteria. Local regulatory applicability and marketing claims still need review.
- [WHO healthy diet](https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet), directional preference for unsaturated fats and varied whole foods. Population dietary guidance does not validate numerical product scores or individual advice.

### Ingredient quality — 25

Use only top-level structured `ingredients[].id` and explicitly reported numeric `percent`. No list-order estimate, regex inference, `percent_estimate`, absent data, or nested ingredient double-counting. Every ingredient must be recognized and percentages must sum to 100 ±0.5; otherwise all 25 points are unassessed, not zero. The small explicit taxonomy is in `foodscore-core.js` (`preferred` and `neutral` sets) and is testable.

Preferred entries cover supported whole grains, legumes, vegetables, nuts, whole fruit and specified unsaturated vegetable oils. Score = 25 × preferred reported percentage / sum of all reported percentages. Recognized neutral ingredients remain in the denominator without being declared harmful. Plain reported water is preferred in beverage profiles only. Juice is not treated as whole fruit. Source ingredient identification/percentages remain community-reported and may be incorrect; no independent ingredient verification or allergy assurance is implied.

### Processing context — 15

If a reported NOVA integer 1–4 is available alongside ingredients, points are 15 / 12 / 10 / 7 respectively. Missing or invalid group: all 15 points unassessed. This moderated mapping is a Soulanova choice; it deliberately avoids equating every processed food with poor nutrition. OFF NOVA can be computed/community-contributed and is not independently verified. Label it “reported NOVA context,” not a certified classification. Do not infer NOVA from names or packaging.

### Missing inputs and bands

Only score if all category nutrient inputs/units are known and at least 75 weighted points are assessable. `coverage = 60 + (ingredient evidence ? 25 : 0) + (reported processing ? 15 : 0)`.

`score = round(100 × (nutrition + assessed ingredient points + assessed processing points) / coverage)`, bounded 0–100. Components that are unknown remain null. Coverage 100: “All component weights assessed · source unverified.” Coverage 75–99: “Limited component coverage · source unverified.” Added-sugar absence remains explicitly listed even when a total-sugar proxy makes that component assessable. Below 75 or absent core nutrients/category: “Insufficient data.” Coverage is completeness, not statistical confidence, accuracy or clinical validation. The UI lists missing evidence, the denominator and each metric/value/earned-point factor. Partial scores must not be compared as equivalent to complete scores; normalization can materially change their label. This uncertainty remains a validation limitation requiring owner review.

Bands: 85–100 Excellent; 70–84 Good; 50–69 Moderate; 30–49 Limit frequency; 0–29 Occasional. These are provisional product comparison labels, not validated consumption-frequency recommendations. There are no disease-treatment or personalized-health claims.

## Units, storage and tracker semantics

OFF's legacy `_100g` normalized values can represent 100 g or 100 ml for liquids, per its [nutrition schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/). Use explicit product/serving quantity unit metadata for volume. A beverage with unknown basis cannot be scored or measured in grams/ml interchangeably. No density assumption. Prepared-food fields and serving-only unsuffixed values are not silently substituted.

User chooses reported servings, or a measured amount in the exact supplied basis (g or ml). Selected nutrition is shown before confirmation. Each nutrient scales independently; null stays null. With no nutrition for a chosen basis, save is blocked. Calories/protein/carbs/fat tracker totals update only after explicit product/portion confirmation and exact storage readback. Community entries are labeled as estimates; the older curated `dailyTotals` contract remains separate. Old unconfirmed OFF entries are preserved but not newly included. Optional goal bars show available reported intake; absent values display “Not provided,” not zero. No default calorie target or automatic recommendation is supplied.

Duplicate prevention uses the existing per-lookup record ID and disables repeated confirmation; scanning again can intentionally create another consumption event. All diary/goals keys retain member scoping. Account switching clears visible forms/results and invalidates delayed lookups. Local readback failure pauses saves without claiming success. Browser-local persistence is not synchronization, encryption or an assurance against other scripts/users with access to the same browser profile.

## API, licensing and media review

- Owner reports registration submitted 2026-11-09; receipt/actual submitted scope and external acceptance have not been independently examined. The official API introduction asks for a usage form and identifying User-Agent; read-only product reads do not require an OFF account credential or describe a separate formal approval grant. **Inference:** an acknowledgement records usage notification, not legal review, commercial approval, rate-limit permission or authorization from Soulanova's owner. An authenticated Preview is not automatically exempt from database license duties.
- The current official API introduction explicitly asks applications under test to use OFF **staging**. This candidate changes only the fixed upstream host to `world.openfoodfacts.net`, using OFF's documented public staging Basic identification. No user-provided upstream URL; no member identity/diary/video sent. Production remains denied before any service call. No live OFF/staging request was made during this work. A later public-service switch requires separate review/approval and code/configuration work.
- Retain app/version/contact User-Agent `Soulanova-FoodScore/1.0 (support@soulanova.com)`. OFF documents 15 product reads/min/IP; existing shared 10 misses/60s limiter leaves headroom but fixed-window bursts/shared egress can still hit provider limits. No deliberate live load/rate-limit tests. Errors/timeouts are mocked; 429/503 handled without caching as products. API GETs to OFF are server-side; browser uses only JSON barcode POST with no-store responses. Extra selected fields support source categories/units/declared ingredients; no product image fields are requested.
- ODbL §3.1 permits commercial use, including subscription applications, subject to its terms. §4.3 requires output attribution; §§4.4–4.6 can require share-alike plus machine-readable database or alterations/method access for public use of a derivative database. Repeated extractions and public outputs can matter even without distributing a whole database. Legal reviewer must classify the Redis collection, ingredient mapping/score outputs, confirmed OFF diary records, collective/derivative boundaries and whether outside authenticated testers constitute public use. Never publish private diaries or assume the proprietary app/owned recipes automatically fall under ODbL. DbCL covers individual database contents separately.
- Existing source product links, OFF credit and ODbL/DbCL links are retained. New output attribution should say it contains OFF information made available under ODbL. This is attribution preparation, not license clearance. Product names/brands are reported, not independently verified; the member checks the package. Product images remain omitted: CC BY-SA plus package-art rights/attribution are not resolved. Their absence avoids remote image tracking.
- Hero, collection and featured cards reuse only existing repository food SVG artwork. No images were purchased, generated or downloaded. Illustrations are explicitly not claimed to photograph the linked recipes. Repository provenance is the existing approved baseline; no new external license representation is made.
- Redis retains known product responses 3600 seconds, unknown responses 300 seconds and the shared limiter 60 seconds. A successful string `status:'success'` now receives the same known-product TTL as numeric `status:1`. Product cache keys use `soulanova:foodscore:off:staging:v2:product:<barcode>` to avoid mixing source-host/schema versions; the shared limiter key is unchanged. Barcode cache keys/responses are vendor data; TTL does not erase vendor backups or hosting logs. Owner must approve region/vendor/logging, access/deletion and retention. No token value was read or changed. OFF data stored on-device after confirmation persists until member deletion/browser clearing, separately from transient Redis retention.
- **Access limitation:** the official `world.openfoodfacts.org/terms-of-use` returned a bot/noindex page and the official ODbL wiki denied automated access on this review. We did not bypass either. Reviewed the official API repository licensing guidance and primary ODbL/DbCL license texts, but cannot certify the inaccessible current terms/wiki text. Owner/legal reviewer must inspect those pages directly before any external test. No legal or OFF approval is claimed.

Official review links:

- [OFF API introduction, usage form, staging, User-Agent and rate limits](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md)
- [OFF licensing guidance](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md)
- [OFF terms (owner manual review required)](https://world.openfoodfacts.org/terms-of-use)
- [OFF ODbL wiki (owner manual review required)](https://wiki.openfoodfacts.org/ODBL_License)
- [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), [DbCL 1.0](https://opendatacommons.org/licenses/dbcl/1-0/)

## First owner-authorized external barcode test (not performed)

1. Owner/legal reviewer reads the blocked terms/wiki directly and approves attribution, commercial/database-sharing treatment, retention/logging, provisional formula/labels and use of OFF staging for the limited authenticated test. Registration submission is already recorded; do not resubmit without a scope reason.
2. Owner separately approves the exact new source SHA and branch for activation. Keep current Redis secret values/scopes untouched; never paste credentials into chat. No Production variables or Production activation path.
3. On this Preview branch only, record full approved SHA in `FOODSCORE_PREVIEW_APPROVED_COMMIT` and exact branch in `FOODSCORE_PREVIEW_APPROVED_BRANCH`. Only after protection verification and explicit activation authorization set all three `FOODSCORE_PREVIEW_ENABLED`, `FOODSCORE_PREVIEW_APPROVED`, `FOODSCORE_PREVIEW_PROTECTION_CONFIRMED` switches true. These variables are currently absent/default-off and were not changed here.
4. Authorize a Preview-only redeployment of that same SHA to pick up approvals. Verify native project/branch/SHA/Preview metadata, READY status and signed-out authentication on the generated URL's page and both APIs. Production deployment/domains must be unchanged. A generated hostname change does not require prebinding; use the generated URL, not an alias for API authorization.
5. In an authenticated browser, first test one manual barcode present in OFF staging, check the package identity, source basis/portion, missing-data explanation and explicit confirmation. Production database coverage is not promised on staging; an unknown product must show “not found,” not fabricate one. Repeat once to confirm server cache reuse. Check request URL/body contains only barcode and no member identity. Do not intentionally exhaust provider rate limits; use mocks for those cases.
6. Confirm local persistence/readback, duplicate prevention, tracker/goal update and account isolation. Then test physical iOS Safari/Android Chrome camera permission denial/Stop/page hide and manual fallback. Browser emulation and mocked camera unit tests do not certify a physical camera.
7. Keep Production denied. Record results without tokens/member data. Disabling environment flags requires redeployment and does not revoke old enabled builds; maintain platform protection and retire authorized test deployments under an explicit rollback plan.

## Verification evidence

Results and screenshot paths are recorded in the upgrade delivery record. Browser automation is installed outside the repository; set `SOULFUEL_PLAYWRIGHT_PATH` to the local Playwright package to run the four optional real-browser tests. No runtime/test dependency or shared package configuration was changed. Without that variable Node reports those tests as skipped; do not represent a skipped browser run as physical/browser acceptance. All browser product/auth/API traffic is mocked and non-local network requests are blocked.
