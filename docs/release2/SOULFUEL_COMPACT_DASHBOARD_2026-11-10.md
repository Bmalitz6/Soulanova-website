# Compact member dashboard review

Base: `e5ec4f58efd4f27aa89f706d38302e6f588eafd5`, feature/soulfuel-clean-preview-2026-11-09.

Hierarchy: compact approved studio hero → compact My Wellness Dashboard → seven matching Explore & Thrive program cards → expandable existing workout history. Desktop metrics use six columns; phones use two. Values, metric icons and small goal rings remain visible. Sources, recorded dates and goal editors are available through keyboard-operable Details disclosures. Show/hide/reorder/defaults and member-local preferences remain unchanged.

Pilates is removed only from this dashboard program grid. The Pilates category, workout content, image, original navigation and other program panels remain intact. No native SoulWalk or Watch files are touched. No approved walking/outdoor image exists in this checkout, so SoulWalk uses the existing Soulanova brand mark on a sage background instead of an arrow. It still says Mobile app and has no invented destination. An approved outdoor asset and destination remain owner content decisions.

The large overview recipe showcase is removed. Existing starter recipe content remains in Free library; all 75 Mediterranean recipes, search/print controls and photographs remain in SoulFuel unchanged. SoulFuel now presents four explicit choices: Food Diary, FoodScore, My Health Metrics and Recipes. Existing anchors and pages are reused.

No backend, authentication, health/diary/workout data model, storage migration, source mapping, scoring formula, scanner logic, API/cache/rate limiter or Redis credential is changed. Measurements and preferences remain browser-local, unencrypted and unsynced; no cloud-health security claim is made. Production remains hard-denied by the unchanged server gate.

Validation: sequential full regression/security/browser suite; keyboard customization and disclosures; program route/fragment resolution; responsive/no-overflow and axe checks at 1280, 390 and 320 pixels; an explicit upper bound on program-grid placement; preservation checks against GitHub main for non-home program panels including Pilates. Disposable mocked sessions only; no live barcode request or actual member diary/health/workout write.

Publish only to the existing protected feature Preview; update only its branch-scoped approved commit SHA. Verify SSO, runtime availability, Production aliases/deployment and Redis environment metadata before/after. Existing older protected Previews remain preserved.
