> Current clean candidate and dependency/test results: [integration audit](SOULFUEL_CLEAN_INTEGRATION_AUDIT_2026-11-09.md). Owner-created Upstash database exists; secure branch-restricted variable setup and activation approval remain pending. Earlier remote inventory is historical.

> Session 3 supersedes the gate/activation status below: see [current owner handoff](SOULFUEL_SESSION3_OWNER_HANDOFF.md). A server-controlled Preview-only path is now implemented in the isolated candidate; registration is owner-reported submitted on 2026-11-09; external approval is unknown and activation remains off. Earlier implementation notes below describe the pre-Session-3 baseline.

# FoodScore / Open Food Facts readiness

**Release state: FoodScore barcode lookup remains default-off.** API-use registration was submitted by the owner on 2026-11-09; external approval is unknown. License approval, shared Redis and activation configuration remain incomplete. See the current handoff and linked read-only assessment.

## Implemented in the isolated Release 2 candidate

- The direct FoodScore page retains its Coming soon state and diary while the explicit availability module is `enabled: false`. The current server-controlled Preview path requires native project/branch/full-SHA approval and all three explicit switches; the browser default remains false.
- `/api/foodfacts` checks the server-only deployment policy before accessing Redis or Open Food Facts. Approved mocked Preview tests also require shared Redis configuration; missing credentials fail closed.
- Enabled lookups accept JSON `POST` only, so a barcode is not placed in the browser URL, navigation history, referrer, CDN cache key, or query-string logs. Responses are `Cache-Control: no-store`; the product response is cached in the shared server-side Redis cache only. This reduces browser/CDN exposure, but the owner must still review host logging and retention settings before public activation.
- Enabled lookups use the fixed Open Food Facts Production API host and current documented `v3.6` product route. There is no user-supplied upstream URL. Preview uses mocked tests only today and has no separate Open Food Facts Staging selector/configuration.
- The upstream request uses `Soulanova-FoodScore/1.0 (support@soulanova.com)`, matching the documented app/version/contact-email User-Agent form.
- A Redis Lua script applies an atomic shared fixed-window limit of 10 cache-miss reads per minute across Vercel function instances. Open Food Facts currently documents a 15 product-read requests/minute/IP limit; ten leaves headroom.
- Redis stores barcode response cache entries for one hour (known products) or five minutes (not found). This retention and its ODbL/DbCL implications still need owner/license review. No product result is stored in browser or CDN caches.
- Errors from missing Redis config, unavailable Redis, local limit exhaustion, upstream rate limits, HTTP failures, timeouts and malformed payloads do not become cached product data. Public client messages are generic and retry timing is returned only for rate-limit responses.
- Product display provides product-specific Open Food Facts links, direct ODbL and DbCL links, explicit missing-value labels, and a provisional score explanation. Product imagery is not fetched, avoiding an automatic third-party image request and deferring package-image rights; the footer retains the license references.
- Manual barcode entry remains available. A progressive camera scanner asks for camera access only after a member taps Scan, detects EAN/UPC formats only where the secure browser exposes `BarcodeDetector`, sends only the decoded barcode, and stops tracks on scan, stop, or page hide. Manual entry is the fallback where browser camera scanning is unavailable. This is browser camera support, not a native Expo scanner validation.
- Product results can be added after the member reviews serving count, optional grams, and meal. Reported per-serving values multiply by servings; explicit gram portions use product-reported per-100 g values. Missing values stay null. The diary records Open Food Facts provenance and does not count community product values in verified/user-entered nutrition totals. Save uses the signed-in member's existing local diary key; no member identifier is sent to the lookup API.
- Existing SoulFuel diary/local nutrition tracking remain browser-local; they are not presented as cross-device synchronized. Barcode lookup sends no member ID and keeps product results out of browser/CDN caches; runtime host-log retention remains an owner review item.

## Production blockers and owner decisions

1. **API-use registration:** owner reports successful submission on 2026-11-09. Retain the receipt and actual submitted scope; no external approval is claimed. Do not resubmit merely because the receipt is not stored here.
2. **Licensing/business review:** not approved. Decide the intended public/commercial use and document obligations for ODbL database data, DbCL individual contents, server-side Redis caching and retention. Product images are not loaded; if later enabled, review CC BY-SA attribution/share-alike and package-art third-party rights first. This engineering preparation is not a legal determination or license approval.
3. **Provision shared Redis:** not configured in this worktree. The implementation expects server-only `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; use a dedicated database or least-privilege identity that can perform only the needed GET/SET/EVAL operations. Never expose these variables to browser code. This preparation did not provision a service or change billing.
4. **Environment and cost review:** connected Vercel inspection on 2026-11-09 found the existing Soulanova project, no project environment variables and no visible installed integrations/connectors. No reusable Redis was identified; an unconnected external account is not ruled out. The exact-hostname activation issue is now resolved through native server project/branch/full-SHA authorization, with request hostname restricted to the current generated deployment URL. No activation was performed. See the current handoff for the assessment; Production remains hard-disabled.
5. **Diary disclosure:** review local-only storage and retention wording. Product results are saved only after a signed-in member explicitly adds them; manual grams/servings are member-reviewed. Confirm the browser-scoped diary remains acceptable.
6. **Mobile browser acceptance:** camera support relies on limited-availability `BarcodeDetector`; manual entry must remain the reliable fallback. Test current iOS Safari and Android Chrome on physical devices before advertising camera scanning across mobile platforms.

Because Redis is not configured and the public feature flag is off, the new code has not contacted Open Food Facts or stored product responses. No live API traffic, product fixture, or account write was used for validation.

## Official references reviewed 2026-11-09

- [Open Food Facts API introduction and API-use requirements](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md): identifies v3.6 as current, asks for a custom User-Agent in `AppName/Version (ContactEmail)` form and API-use form submission; documents 15 product-read requests/minute/IP and global 503 throttling.
- [Open Food Facts licensing tutorial](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md): database is ODbL, individual contents DbCL, and product images CC BY-SA; directs integrators to reuse terms and attribution guidance.
- [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi): documents authenticated REST commands, EVAL/Lua support, and states that pipelining is not atomic; the implementation uses one atomic EVAL command for shared limiting.

## Attribution and activation checklist

- [x] OFF API-use form submitted by owner on 2026-11-09; receipt/actual scope still to be retained, external approval unknown.
- [ ] Complete business/license approval for ODbL data, DbCL contents, server caching/retention and attribution.
- [ ] Approve the provisional FoodScore methodology and disclaimers. Product images are currently omitted; separately review CC BY-SA and package-art rights before loading any image.
- [ ] Approve one-hour Redis retention for known products and five-minute retention for unknown barcodes.
- [ ] Verify project/environment names and scopes in Vercel, then provision the shared limiter/cache service and add Preview-only secrets after separate authorization.
- [x] Implement server-controlled Preview project/branch/full-SHA gate; Production hard-off. Owner configuration/activation approval remains pending.
- [ ] Run integration checks against Open Food Facts Staging where applicable, plus cache/rate-limit, unknown barcode, incomplete product, Redis outage, upstream 429/503, timeout and malformed-JSON scenarios. Existing automated tests are mocked and do not count as external integration tests.
- [ ] Test manual and camera scanning on physical iPhone/iOS Safari and Android Chrome; confirm camera permission denial and stop behavior, manual fallback, barcode request privacy and member-scoped diary save.
- [ ] Confirm diary privacy/retention wording and obtain explicit owner approval for a specific Preview configuration before turning on the Preview gate.
