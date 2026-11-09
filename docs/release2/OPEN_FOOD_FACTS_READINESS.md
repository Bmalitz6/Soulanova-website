# FoodScore / Open Food Facts readiness

**Release state: FoodScore barcode lookup remains default-off.** No API-use form, license approval, managed cache/limiter provisioning, or Vercel environment configuration is represented as complete.

## Implemented in the isolated Release 2 candidate

- The direct FoodScore page retains its Coming soon state and diary while the explicit availability module is `enabled: false`.
- `/api/foodfacts` checks that same default-off gate before accessing Redis or Open Food Facts. When manually enabled for tests, it fails closed unless shared Redis credentials are available.
- Enabled lookups use the fixed Open Food Facts Production API host and current documented `v3.6` product route. There is no user-supplied upstream URL and no staging hostname or staging credential.
- The upstream request uses `Soulanova-FoodScore/1.0 (support@soulanova.com)`, matching the documented app/version/contact-email User-Agent form.
- A Redis Lua script applies an atomic shared fixed-window limit of 10 cache-miss reads per minute across Vercel function instances. Open Food Facts currently documents a 15 product-read requests/minute/IP limit; ten leaves headroom.
- Redis stores barcode response cache entries for one hour (known products) or five minutes (not found). Successful responses also use Vercel shared-CDN caching for five minutes, with up to ten minutes of stale-while-revalidate.
- Errors from missing Redis config, unavailable Redis, local limit exhaustion, upstream rate limits, HTTP failures, timeouts and malformed payloads do not become cached product data. Public client messages are generic and retry timing is returned only for rate-limit responses.
- Product display provides product-specific Open Food Facts source links and links for the ODbL database, DbCL contents and CC BY-SA 3.0 product images. The page footer repeats these attributions. Product package artwork may include separate third-party rights.
- Existing SoulFuel diary/local nutrition tracking remain unchanged and browser-local; they are not presented as cross-device synchronized.

## Production blockers and owner decisions

1. **API-use registration:** submit the Open Food Facts API-use form for Soulanova and retain the submitted scope/date/evidence. Official API guidance asks users to identify their application and fill in the API-use form.
2. **Licensing/business review:** decide the intended public/commercial use and accept/document obligations for ODbL database data, DbCL individual contents, CC BY-SA product images, transient Redis caching, and CDN caching. Review image/package third-party rights. This engineering preparation is not a legal determination or license approval.
3. **Provision shared Redis:** choose and provision a managed Redis service for FoodScore only. The current Vercel project has no configured environment variables or existing shared limiter/cache credentials. The implementation expects server-only `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; use a dedicated database or least-privilege identity that can perform only the needed GET/SET/EVAL operations. Never expose these variables to browser code. This preparation does not provision a service, change billing, or add Vercel env vars.
4. **Environment and cost review:** after provisioning is explicitly approved, add the server secrets to Preview first, validate shared rate limiting/cache and OFF 429/503 behavior, then approve a separate Production configuration change. Keep the FoodScore feature gate false until the owner has approved the API registration, license review, and actual Preview behavior.
5. **Diary disclosure:** approve the local-only storage and retention wording, and confirm the browser-scoped diary remains acceptable.

Because Redis is not configured and the public feature flag is off, the new code has not contacted Open Food Facts or stored product responses. No live API traffic, product fixture, or account write was used for validation.

## Official references reviewed 2026-11-09

- [Open Food Facts API introduction and API-use requirements](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md): identifies v3.6 as current, asks for a custom User-Agent in `AppName/Version (ContactEmail)` form and API-use form submission; documents 15 product-read requests/minute/IP and global 503 throttling.
- [Open Food Facts licensing tutorial](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md): database is ODbL, individual contents DbCL, and product images CC BY-SA; directs integrators to reuse terms and attribution guidance.
- [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi): documents authenticated REST commands, EVAL/Lua support, and states that pipelining is not atomic; the implementation uses one atomic EVAL command for shared limiting.

## Attribution and activation checklist

- [ ] Submit the OFF API-use form and save confirmation.
- [ ] Complete business/license approval for data, content, images, caching and attribution scope.
- [ ] Review package image third-party rights and the provisional FoodScore methodology/disclaimers.
- [ ] Approve one-hour Redis response retention and the five-minute Vercel cache plus stale window.
- [ ] Provision and secure the shared limiter/cache service; add Preview-only secrets after separate authorization.
- [ ] Validate one successful lookup, unknown barcode, incomplete product, shared 429, Redis outage, upstream 429/503, timeout and malformed JSON in Preview.
- [ ] Confirm the diary privacy/retention copy; do not imply mobile/cross-browser sync.
- [ ] Obtain explicit owner approval for the reviewed configuration change that activates barcode lookup.
