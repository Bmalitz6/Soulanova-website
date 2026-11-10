# SoulFuel premium redesign — 2026-11-09

Baseline `36cbbf10a799876e87046f0fa7bb3e58314a6951`; only `feature/soulfuel-clean-preview-2026-11-09`. This is a visual/presentation revision, not a formula, storage, API, gate or configuration change. No live product lookup, paid service, new credentials, Production action or other-session edit.

## Visual changes

- One strong, authentic Mediterranean-table photograph beside a short hero and two equal-priority actions: Scan Food and Daily Tracker. Warm ivory/white, sage/teal, Georgia/system typography and generous spacing; no added font provider or paid asset.
- Removed the five-card feature menu, duplicate shortcuts, duplicate featured-recipe rows, large methodology block and repeated callouts. One four-link navigation row leads to Today, Scan Food, Recipes and Goals.
- Four clear sections: Today's Nutrition, Scan Food, Mediterranean Recipes and Nutrition Goals. The four collection cards have larger consistent crops, short names/counts and a single action.
- Calories, protein, carbs and fat remain visible. Fiber/water and explanatory details are expandable. Manual entry and goal setup use keyboard-accessible native details controls. Entry edit opens its form automatically. Source/methodology disclosures remain accessible without dominating the page.
- A single FoodScore gauge; nutrient facts are folded and secondary nutrient mini-meters are removed. Missing-data coverage, portion review, confirmation, persistence and source attribution remain available. No formula or ingredient/processing inference changes.
- Input sizes, 44px primary navigation/action targets, keyboard focus and responsive layouts are checked at 1280px, 390px and 320px. No horizontal overflow in tested states. External lookup remains paused; the status reflects the server-controlled boolean if it is separately authorized in the future.

## Photo provenance and license

There was no authentic owned food photography in the repository; the existing food art was illustrative SVG. Instead of downloading unlicensed images or inventing dish photos, this revision uses these individually identified free Pexels photographs:

| Placement / local asset | Photographer | Original photo |
| --- | --- | --- |
| Hero / `app/soulfuel/media/mediterranean-table.jpg` | Snappr | [Mediterranean feast, 29850786](https://www.pexels.com/photo/delicious-mediterranean-feast-with-diverse-dishes-29850786/) |
| Breakfast / `app/soulfuel/media/breakfast.jpg` | Polina Tankilevitch | [Oatmeal and fruit, 4725753](https://www.pexels.com/photo/oatmeal-with-sliced-fresh-fruits-in-a-ceramic-bowl-4725753/) |
| Lunch / `app/soulfuel/media/lunch.jpg` | Chan Walrus | [Vegetable salad, 1059905](https://www.pexels.com/photo/vegetable-salad-on-plate-1059905/) |
| Dinner / `app/soulfuel/media/dinner.jpg` | Daniela Elena Tentis | [Salmon and vegetables, 725991](https://www.pexels.com/photo/cooked-meat-with-vegetables-725991/) |
| Snacks / `app/soulfuel/media/snacks.jpg` | Paul Seling | [Hummus and vegetables, 35703971](https://www.pexels.com/photo/healthy-spread-with-hummus-and-vegetables-35703971/) |

Original photo pages identify the assets as Free. The [Pexels License](https://www.pexels.com/license/), reviewed 2026-11-09, permits free website/app use and modification. Its restrictions include no implied endorsement, no unaltered-image resale and no stock-platform redistribution. These are website collection images, not a stock-photo product, brand endorsement or clinical claim. No identifiable people or branding were observed in the five selected images. This is asset provenance documentation, not a representation of new owner-shot imagery or an unlimited release of every possible third-party right.

Local assets are compressed/resized JPEG downloads (hero 1600px, collections 800px). CSS crops them consistently without generating new food imagery. Total media size is about 808 KB. No remote image requests, photographer tracking, image API keys or paid image service. Footer provides credits/source/license links; [PHOTO_CREDITS.json](../../app/soulfuel/media/PHOTO_CREDITS.json) records each source/download URL, photographer, date, bytes and SHA-256. Hash/provenance tests cover all five.

These photographs are **collection inspiration, not representations of exact Soulanova recipes**. That distinction is visible below the cards and in photo credits. The 75 individual recipes retain their recovered original layouts/content, without false new recipe-specific images.

For future authentic individual-recipe photography: owner or commissioned photographer prepares the exact recipe and records its source recipe ID, ingredient substitutions, photographer and written commercial website/subscription rights. Obtain one landscape 2400×1600+ master and a portrait-friendly crop per recipe, with no unapproved people/brands; deliver JPEG/WebP, alt description and license/release evidence. Review the image against the actual recipe before attaching it. Pilot breakfast/lunch/dinner/snack representatives first, then inventory the remaining IDs. Any paid shoot requires separate authorization. No additional photo acquisition is required for this Preview's hero/collection imagery.

## Before / after evidence

Same local authenticated fixture account, empty diary, lookup disabled and identical viewport sizes; not screenshots of real member data. The complete baseline suite was run before editing the page to capture the exact approved baseline. Browser screenshot paths are retained under `.git/soulfuel-premium-evidence/` in the clean candidate (not published or deployed):

| Viewport | Before | After | Full-page height |
| --- | --- | --- | --- |
| Desktop 1280×900 | `before-1280.png` | `after-1280.png` | 4701 → 3051 px |
| iPhone-like 390×844 | `before-390.png` | `after-390.png` | 7185 → 3351 px |
| Narrow 320×740 | `before-320.png` | `after-320.png` | 9057 → 3278 px |

This is a visual comparison at equal viewport width, not physical-device camera certification. Content behind details remains available; the shorter page is not created by deleting diary fields or recipes. Hero and four collection images were visually inspected; no generated recipe photos or placeholders are used.

## Validation and preserved behavior

Full suite with the externally installed Playwright and axe tooling: **64 passed, 0 failed, 0 skipped** (57 non-browser tests and seven browser tests). Run using the environment-path instructions in the prior delivery record. Without those optional tools, browser checks are skipped and must not be claimed as passed.

Tests cover all original formula/scaling/missing-data cases; default-off and Production denial; scanner permission/manual fallback; mocked barcode POST → portion → confirmed persistence → totals; duplicate prevention; delayed lookup/account switch isolation; storage failure; reload; manual edit/delete; local links; 75 recipe recovery and individual Print controls; hierarchy/keyboard detail expansion; 44px primary touch targets; 1280/390/320 no-overflow layouts; automated WCAG A/AA checks in disabled and mocked-product states; and exact asset hashes.

New preservation test checks the formula core, diary storage core, scanner, static availability, API/proxy and both server endpoints/policy against baseline: byte-identical. All eight recipe-library files are byte-identical. The existing GitHub-main preservation check still covers all 77 inherited files. No shared navigation/main/other-session change is required. Photo and test dependencies were not installed into the project or committed.

## Protected Preview and limitations

Before publishing, recheck the existing project/repository, SSO enabled, no FoodScore activation variables and only the unchanged branch-specific Preview Redis secret names. Owner has previously verified Production tracks main and Preview tracks unassigned branches. Push only this feature branch's reviewed update. Verify exact resulting SHA, Preview target, READY state, signed-out page/API authentication, authenticated `enabled:false` and barcode-free lookup GET returning 503. Compare Production deployment/domain/alias IDs and secret metadata before/after. No secret values or live barcode requests are needed.

Remaining limits: collection imagery is stock, not exact-recipe photography; recovered recipe detail-page layouts are unchanged; browser emulation/accessibility automation is not a full human or physical-iPhone acceptance audit. Prior OFF terms/licensing/retention/scoring review and separate live-test authorization remain outstanding. External lookup and Production remain disabled; this redesign does not alter those decisions.
