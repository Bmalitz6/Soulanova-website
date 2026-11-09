# Clean SoulFuel integration audit — 2026-11-09

GitHub main base: `1b09f3e897948b16a8a7c4aa4930f9fe8fb8b7ef`. Source snapshot: `ba552c660c343a8242fc84069871965875e1d747`. Local branch: `feature/soulfuel-clean-preview-2026-11-09`. Remote: `https://github.com/Bmalitz6/Soulanova-website.git` (fetch/push). The independent snapshot commits are not ancestors. Original archive/worktrees/audit untouched. No push, deploy, merge, credential or environment change.

## Exact port inventory

All 28 selected source paths below are additions against GitHub main; no overlap or overwrite of an existing base file occurred. Source/candidate SHA-256 and adaptation flags are in [machine-readable inventory](SOULFUEL_CLEAN_PORT_INVENTORY_2026-11-09.json).

| Path | Treatment |
| --- | --- |
| `api/foodfacts.js` | Byte-identical |
| `api/foodscore-availability.js` | Byte-identical |
| `app/soulfuel/food-diary-core.js` | Byte-identical |
| `app/soulfuel/foodscore-availability.js` | Byte-identical |
| `app/soulfuel/foodscore-core.js` | Byte-identical |
| `app/soulfuel/foodscore-scanner.js` | Byte-identical |
| `app/soulfuel/foodscore.css` | Byte-identical |
| `app/soulfuel/foodscore.js` | Byte-identical |
| `app/soulfuel/index.html` | Adapted as described below |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/README.txt` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/breakfast.html` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/dinner.html` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/index.html` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/lunch.html` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/recipe_content_review.csv` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/recipes.json` | Byte-identical |
| `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/snacks.html` | Byte-identical |
| `docs/release2/OPEN_FOOD_FACTS_READINESS.md` | Adapted as described below |
| `docs/release2/SOULFUEL_75_RECIPE_RECOVERY_2026-11-09.md` | Adapted as described below |
| `docs/release2/SOULFUEL_NUTRITION_EXPANSION_PLAN_2026-11-09.md` | Byte-identical |
| `docs/release2/SOULFUEL_PREVIEW_REDIS_AND_FIRST_TEST_2026-11-09.md` | Adapted as described below |
| `docs/release2/SOULFUEL_SESSION3_OWNER_HANDOFF.md` | Adapted as described below |
| `lib/foodscore-preview.js` | Byte-identical |
| `tests/foodfacts-production.test.cjs` | Adapted as described below |
| `tests/soulfuel-food-diary.test.cjs` | Byte-identical |
| `tests/soulfuel-foodscore-scanner.test.cjs` | Byte-identical |
| `tests/soulfuel-preview-gate.test.cjs` | Byte-identical |
| `tests/soulfuel-recipe-library.test.cjs` | Byte-identical |

Additional new dedicated files:

- `tests/soulfuel-clean-integration.test.cjs` — preserves all base file hashes and validates dependencies/links.
- `docs/release2/SOULFUEL_CLEAN_INTEGRATION_AUDIT_2026-11-09.md` — this audit.
- `docs/release2/SOULFUEL_CLEAN_PORT_INVENTORY_2026-11-09.json` — exact source and candidate hash inventory.

Total proposed diff: **31 added files, zero modified/deleted base files**.

## Dependency reconciliation and exclusions

- No source file overlaps exist: main has no SoulFuel subtree, proxy/policy, dedicated tests or release2 documents selected here. No newer base content was overwritten.
- Existing `app/config.js` supplies public Supabase auth details; existing `app/index.html`, `app/navigation.js` and `app/free-content.js` supply sign-in, meals and free-library destinations. All remain unchanged. Removed only the SoulFuel page’s request for missing `config.development.local.js`; no secret-bearing config was introduced.
- The optional Nutrition Goals form/core were preserved. Its misleading Coming Soon card was changed to describe the existing local optional goals.
- Dedicated API tests no longer assume the unrelated `app/release2/index.html` hub exists. Security/default-off coverage and the scan for direct browser OFF API calls remain.
- Dedicated docs target the new branch, omit workstation-specific source paths, identify archival counts and include current candidate/database status. Registration remains owner-reported submitted, not externally approved. License/attribution, cache retention and score-disclosure approvals remain required.
- Excluded all `app/strength/**`, `app/stretching/**`, `app/walking/**`, `app/notifications/**`, `app/release2/**`, shared home/app/accessories/navigation/config changes, member-progress changes, shared `.vercelignore`, unrelated release tests, `tests/member-experience-regression.test.cjs`, SoulStretch manifests and `SOULFUEL_SESSION3_CAPTURE.json`. No shared change was necessary.
- No dashboard entry for SoulFuel is added. Approved Preview testers must visit `/app/soulfuel/` directly. A future shared navigation entry requires a separate review. Existing meal plans and six free recipes remain intact, in addition to all 75 recovered recipes.
- Tests/docs are public repository material; no credentials or local overrides belong in them. `.vercelignore` from the snapshot was intentionally not transplanted.

## Validation

- Existing 39 dedicated SoulFuel tests: passed. Three new integration tests: passed. Complete available suite: **42 passed, 0 failed**. Command: `node --test --test-concurrency=1 tests/*.test.cjs`.
- GitHub main has no pre-existing automated tests or package runner. Snapshot-only unrelated suites were intentionally not ported, so old snapshot regression counts do not apply.
- All 77 files inherited from main are byte-identical. Local HTML href/src/fragment checks resolve the dedicated page and all recipe category pages against the actual main checkout. No nonexistent Release 2 or local config dependency remains.
- Recipe tests confirm 75 unique recipes (23 breakfast, 22 lunch, 21 dinner, 9 snacks), searchable cards, individual Print controls and retained nutrition-source warnings.
- API, server gate, diary, scanner and scoring core are byte-identical to preserved source. Gate tests deny Production/conflicting/missing platform targets even with switches true; client static flag remains false. Without all exact native project/branch/full-SHA approvals and three explicit switches no Redis/OFF request occurs.
- Shared Redis cache TTLs remain known 3600s/unknown 300s; atomic shared 10 misses/60s limiter unchanged. No credentials acquired or live upstream/device acceptance performed.
- Full-diff secret/content audit and syntax checks are recorded after final validation below.

## Vercel read-only findings and publication condition

- Existing project `soulanova-website`, `prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`, remains linked to `Bmalitz6/Soulanova-website` in Soulanova team. Vercel Authentication is enabled (`all_except_custom_domains`). No custom environments were returned. Production domains have no FoodScore branch mapping.
- The connector omits the actual Production Branch setting. GitHub default `main` is not proof that Vercel tracks main for Production. Signed-out protection/exception checks for the not-yet-published branch also remain future work. No configuration was changed.
- Source preparation is complete for owner review. **Publication is conditional on verification of Vercel Production Branch and explicit owner authorization that includes any automatic protected Preview build.** Do not publish until those conditions are satisfied. Do not enable FoodScore or configure Redis merely because publication is approved.
- Recheck current GitHub main/target branch and Vercel settings immediately before any authorized push. A later change to the approved source SHA requires new gate approval. Only push the exact reviewed feature ref, never main/tags/all refs or mirror.
- If the Production Branch cannot be verified through available tooling, owner should inspect the project’s Production Branch/Branch Tracking setting directly in Vercel without changing it. Then authorize the new clean branch only.

## Final content audit

All 31 proposed files were text-scanned for private-key blocks, recognizable provider secrets, JWTs, credential-bearing URLs and workstation-local paths; zero findings. Manual review confirms the Redis token is read from server environment only; test credentials are fixture-only and the public support contact is intentional. This heuristic scan is not a guarantee against every possible secret format.

All 14 added JavaScript/test files pass `node --check`; four inline recipe scripts parse successfully. Node's complete auto-discovered suite (`node --test --test-concurrency=1`) reports **42 passed, 0 failed**. No pre-existing repository tests are present on this GitHub base. Dedicated tests include scanner fallback, member-scoped diary/goals, recipe recovery/printing, secure POST proxy/Redis failures and Production-denying gate behavior.

Whitespace-only cleanup was limited to dedicated docs and extra blank EOF lines in two dedicated tests. The eight imported recipe-library source files remain byte-identical, including original CSV CRLF and dinner HTML trailing spaces. Raw `git diff --check` reports those source-format warnings; the check passes outside the deliberately preserved recipe archive. No recipe was reformatted to suppress warnings.

The SHA inventory records each of 28 source ports after adaptations. It does not hash itself or this new audit, avoiding self-referential hashes. All source hashes are from preserved commit `ba552c660c343a8242fc84069871965875e1d747`.
