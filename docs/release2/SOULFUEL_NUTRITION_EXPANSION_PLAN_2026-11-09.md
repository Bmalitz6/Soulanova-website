# SoulFuel nutrition expansion plan

Date: 2026-11-09
Scope: SoulFuel recipes, meal planning, browser-local diary, FoodScore gate, and member entry points in the Release 2 website candidate. This plan does not authorize Production schema changes, member-data writes, billing, or deployment.

## Current inventory

- **Member entry:** the authenticated member home has a direct SoulFuel program card and direct navigation link to `/app/soulfuel/`. It continues to feature three of the original six simple recipes as dashboard previews.
- **Direct SoulFuel page:** the isolated candidate presents five feature cards and now links to the recovered 75-recipe library by category. The member-home six-recipe preview remains intact.
- **Recovered recipes:** the owner-supplied library contains 75 records: Breakfast 23, Lunch 22, Dinner 21, Snacks 9. The JSON has unique IDs and titles, and every record has ingredients and directions. The direct catalog has no exact-title duplicates against the six existing website recipes; similar concepts remain separate recipes and were not merged. The three member-home cards are previews, not additional library entries.
- **Nutrition provenance:** 74 recipes have nutrition panels in the structured JSON; Really Green Smoothie (`breakfast-20`) has no panel in that JSON, the review CSV, or the print-ready ZIP. The newer loose Breakfast HTML copy contains a 343-calorie correction for one 2⅓-cup serving. This panel is included exactly as supplied in the recovered Breakfast page with a visible verification warning; it was not recalculated. The source review CSV also flags the Veggie Sandwich panel as provisionally associated and needing verification. No missing or flagged nutrition was silently normalized.
- **Meal planning:** one seven-day sample inspiration plan, with three meal ideas per day (21 slots). The plan is descriptive text; meal ideas are not linked to recipe records. There is no 14-day plan, portion control, or dietary filter.
- **Grocery checklist:** one 16-item generic checklist, saved locally in the browser under `soulanova-preview-v1`. It does not derive or scale items from the selected day's meals.
- **Food diary:** entries remain browser-local in the existing `soulanova-foodscore-diary-v1:<signed-in-member-id>` key. The page now supports manual breakfast, lunch, dinner, and snack entries; date navigation; optional user-entered nutrition values; editing and deleting manual records; and per-day nutrition totals. Existing FoodScore records remain intact and are excluded from totals unless a value is explicitly marked verified or user-supplied. Account switches clear any in-progress form and reload only the new member's diary. There is no cloud sync or export yet.
- **Nutrition Goals:** members can optionally enter daily calories, protein, carbohydrates, fat, fiber, and water reference values. Goals use the separate browser-local key `soulanova-food-diary-goals-v1:<signed-in-member-id>` and are not recommendations or clinical targets.
- **FoodScore:** included in the Release 2 launch plan; manual barcode entry and progressive camera scanning are implemented in the isolated candidate, alongside product-source nutrition, a provisional heuristic explanation, and diary portion controls. `foodscore-availability.js` remains `enabled: false`, the lookup UI stays hidden, and the API returns unavailable while gated. API-use registration, data licensing/retention approval, shared Redis provisioning, protected Preview verification, remote Vercel configuration inspection, and Production activation remain open in `OPEN_FOOD_FACTS_READINESS.md`.
- **Supabase diary sync:** no food-diary table, sync path, or RLS policy was found in the inspected Release 2 worktree. The current diary is not cloud synchronized.

## Landing-page and library implementation in this branch

The direct page starts with five complete clickable cards: Recipes, Meal Plans, Food Diary, Nutrition Goals, and FoodScore (Coming Soon). Recipes jump to four linked categories in the SoulFuel page; Meal Plans route to the existing member-home plan; Food Diary and the two availability cards jump to their matching sections. The existing diary storage key and records are preserved. Manual diary and goal values remain browser-local and member-scoped; no sync or Production schema changes were made. FoodScore barcode lookup remains gated off.

The existing owner-supplied category pages were recovered into `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/`. They retain their category-specific search, recipe cards, single-recipe Print buttons, print stylesheet, ingredients, directions, and nutrition panels. The Breakfast page uses the later loose copy because it contains the Recipe 20 correction missing from the ZIP. The original JSON, CSV, and ZIP are otherwise kept as provided. See `SOULFUEL_75_RECIPE_RECOVERY_2026-11-09.md` for source hashes and the Recipe 20 discrepancy.

## Phased implementation

### Phase 1 — Reconcile and review the recovered library

The 75-recipe count is already present; do not create replacement recipes or grow the catalog to reach 75. Review the supplied ingredient amounts, yields, directions, nutrition panels, and source/permission status. Retain all source values. The Recipe 20 correction and provisionally associated Veggie Sandwich panel remain clearly flagged until their source files agree or the owner confirms the correction. Do not calculate missing values or label source content independently validated.

For future app-native data, retain the stable source ID, title, category, intro, metadata/servings, ordered ingredients, ordered directions, original/raw nutrition panel, source filename, and review/verification status. Any normalized tags or nutrition source links must be added without replacing source content.

### Phase 2 — Maintain the 75-recipe library

Keep the recovered 75 recipes as one catalog with the four approved counts. Do not duplicate records to populate the website's existing six-recipe home preview. If the owner later requests expansion beyond 75, add only reviewed owner-approved batches with source, nutrition provenance, licensing and acceptance review.

### Phase 3 — Practical meal plans

Build the 7-day plan from reviewed recipe IDs and then prepare a separate 14-day plan. Support serving multipliers based on each recipe's reviewed yield. Derive grocery lists from the chosen plan and portions, combine compatible units, retain a manual add/check-off flow, and keep the existing local checklist until a member explicitly chooses any future account-sync option.

Add filters only when the recipe metadata supports them: vegetarian, vegan, pescatarian, dairy-free, gluten-free, ingredient-based nut avoidance, preparation time, and meal category. Clearly state that ingredient filters do not guarantee allergy or cross-contact safety. Avoid medical diets and clinical claims.

### Phase 4 — Diary history and safe account sync

The local experience now supports date browsing, manual entry, edit, delete, and optional user-entered nutrition values. A downloadable export/backup remains future work. Keep the current per-member browser key readable throughout any future sync migration. Before sync, show the member the local entry count and account destination, obtain explicit consent, and offer a downloadable backup. Upload idempotently, read rows back through the same authenticated member session, compare IDs/counts, and retain the local copy until the member confirms successful sync. Failed or interrupted migration must resume without duplicate rows or deleting local data.

For a separately approved Supabase design, preflight a new `food_diary_entries` table with generated row IDs, `user_id`, a client-generated idempotency UUID, date/meal fields, food and portion description, a nutrition snapshot with source/provenance, and timestamps. Use authenticated publishable-key sessions only. Set the owner from `auth.uid()` and enforce owner-scoped SELECT/INSERT/UPDATE/DELETE RLS; add a unique constraint on `(user_id, client_entry_id)`. Never use a service-role key in the browser. Prepare read-only schema review and preflight scripts first. No Production DDL, RLS, grants, or writes occur without separate explicit approval.

### Phase 5 — FoodScore activation review

Keep `enabled: false`. Before any activation, complete and retain the Open Food Facts API-use registration, licensing and attribution review for database/content/images and caching, package-image rights review, approved FoodScore methodology and disclaimers, shared server-side cache/rate limiter provisioning, and Preview checks for upstream errors and rate limits. Require a separate owner approval for Preview configuration and another for Production activation. See `OPEN_FOOD_FACTS_READINESS.md` for the detailed checklist.

## Acceptance tests

1. The member home still opens `/app/soulfuel/`; all five SoulFuel cards are single, keyboard-focusable links with valid destinations and visible focus states at mobile and desktop widths.
2. The recovered category pages contain exactly 23, 22, 21, and 9 cards; their search inputs match by title/ingredient and each Print button prints only its selected recipe.
3. The six existing website preview recipes remain intact and are not imported as duplicate catalog cards. The 75 recovered IDs/titles remain unique.
4. Existing nutrition strings and values are preserved. Really Green Smoothie retains the exact owner-supplied correction with a visible source-mismatch warning; the Veggie Sandwich panel keeps its supplied verification flag. No unprovided values are generated.
5. The 7-day plan contains seven valid days; the 14-day plan contains fourteen. Every meal links to a reviewed recipe or is clearly marked as inspiration. Portion changes scale ingredient amounts consistently, and the grocery list recomputes without losing manual check state.
6. Manual diary add/edit/delete, date and meal categorization, same-ID retry, member-scoped diary/goals, invalid-storage preservation, and nutrition-total provenance are covered by focused local tests. Physical browser acceptance must still verify sign-out/account switching and reload persistence. Member A must not see or overwrite member B's local diary. Export/backup remains unimplemented.
7. Diary sync tests use two disposable authenticated accounts: owner-only read/write, spoofed-owner rejection, anonymous denial, same-ID retry idempotency, delayed response/account-switch isolation, interrupted upload recovery, readback verification, and preservation of the local backup. These are required before any Production write gate.
8. FoodScore remains default-off, lookup remains hidden, and the API fails closed without reaching Open Food Facts unless the complete approval and configuration gate is enabled in a separately approved Preview.

## Production decision gates

- **Current full SoulFuel experience: NO-GO.** The 75 recipes are recovered, but content/rights review remains incomplete; meal plans remain inspiration-only; diary and goals are local to this browser and are not synchronized or backed up; physical browser acceptance remains outstanding.
- **Landing page and recovered catalog: candidate-only.** Run recipe-page, print, responsive, accessibility, and source-preservation checks in Preview before release.
- **Recipes/plans: NO-GO** for claims that all 75 recipes are independently nutrition-validated until every supplied panel, the Recipe 20 correction, the flagged sandwich panel, and recipe rights are reconciled and approved. The 75-recipe target itself has been met.
- **Diary cloud sync: NO-GO** until schema/RLS preflight, explicit member migration consent, two-account isolation tests, backup/recovery, and a separately approved Production migration/write gate are complete.
- **FoodScore: NO-GO** for activation until every item in `OPEN_FOOD_FACTS_READINESS.md` is approved and Preview validation passes. Keep the feature flag false by default.
- **Public release: NO-GO** until all changed candidate code and content are reviewed in an isolated Preview, member data preservation is confirmed, and the owner approves the specific release. No Production data, schema, permissions, billing, or deployment changes are part of this branch.
