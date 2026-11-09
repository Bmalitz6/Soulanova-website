# SoulFuel 75-recipe library recovery

Date: 2026-11-09
Worktree: `feature/soulfuel-nutrition-foundation-2026-11-09`
Source: `owner-provided recipe source archive: Soulanova_Mediterranean_Recipe_Library`

## Recovered inventory

The source `recipes.json` declares and contains 75 records:

| Category | Records |
| --- | ---: |
| Breakfast | 23 |
| Lunch | 22 |
| Dinner | 21 |
| Snacks | 9 |
| **Total** | **75** |

All 75 records have ingredients and directions. IDs and normalized titles are unique. Seventy-four records have a nutrition panel in the structured JSON; one does not. The category HTML pages contain searchable recipe cards and individual Print Recipe controls. The print-ready ZIP provides the category landing page and all four category pages.

The six earlier website recipes remain unchanged. None has an exact title match in the recovered 75-record set, so the SoulFuel catalog contains 81 distinct recipe titles across the original six and recovered library. Similar ideas such as baked versus grilled salmon remain separate recipes; ingredients and instructions were not collapsed or overwritten.

## Source reconciliation

The print-ready archive is `owner-provided recipe source archive: Soulanova_Mediterranean_Recipes_75_Print_Ready.zip`. Its member set contains the four category pages, `index.html`, `recipes.json`, `recipe_content_review.csv`, and `README.txt`. The archive JSON is byte-identical to the source-folder JSON. The source-folder Lunch, Dinner, Snacks, and index pages match the archive. The loose source-folder Breakfast page differs and has a later filesystem modification time than the ZIP.

The integrated library uses the archived index, Lunch, Dinner, Snacks, structured JSON, and review CSV. It uses the later loose Breakfast page so the latest Recipe 20 panel is retained. The original source folder and ZIP were not modified.

SHA-256 source checks:

| Artifact | SHA-256 |
| --- | --- |
| Print-ready ZIP | `3017203ac0928a47eb686baffebb7d7fd08ef819c7ebef200be2c336827adeed` |
| Structured JSON | `5264577f659b24672e9a1e042c9739248c8c6db6427673e065796e30e4a1808e` |
| Review CSV | `3647b8642cc11de3f4eb666073c696f8f7e24eb8557aec2302d94810b7b337b6` |
| Later loose Breakfast HTML | `147d991cacce226bdee2fd088557bbc8ef6266201248da9dbcb3c4a5fbd9057d` |

The integrated JSON and review CSV hashes match the source-folder artifacts exactly.

## Recipe 20 nutrition correction

`breakfast.html` in the loose source folder contains a panel for **Really Green Smoothie** (`breakfast-20`): one serving per recipe; serving size 2⅓ cups. The values below are transcribed exactly from that panel:

- Calories: 343
- Total carbohydrate: 55g (20% DV)
- Dietary fiber: 12g (43% DV)
- Total sugars: 29g
- Protein: 6g (12% DV)
- Total fat: 14g (18% DV)
- Saturated fat: 2g (8% DV)
- Vitamin A: 2265 IU (45% DV)
- Vitamin C: 36mg (40% DV)
- Folate: 96mcg (24% DV)
- Sodium: 199mg (9% DV)
- Calcium: 310mg (24% DV)
- Iron: 2mg (12% DV)
- Magnesium: 112mg (27% DV)
- Potassium: 1051mg (22% DV)

This panel is not present in the archive's Breakfast page, structured JSON, review CSV, or source README; those artifacts say nutrition was not supplied. The latest loose page has the panel but no separate citation or calculation provenance. The integrated Breakfast page displays the supplied figures without alteration and includes a visible warning that the correction is unverified against the other source artifacts. No nutrition values were calculated.

The review CSV also flags the nutrition panel provisionally associated with **The Only High-Protein Veggie Sandwich Formula You Need** because it followed Veggie Wraps in the supplied document. Its values remain intact and the source HTML's verification warning is preserved.

## Integration

The direct SoulFuel page links to Breakfast, Lunch, Dinner, and Snacks with the original counts. The original category HTML is served from `app/soulfuel/recipe-library/Soulanova_Mediterranean_Recipe_Library/`; its search fields search card title/introduction/ingredients, and its print buttons print one selected recipe using the source print stylesheet. The 75 source records and raw nutrition panels are preserved in the copied `recipes.json`; no recipe text or numeric nutrition values were normalized or recalculated.

The source README notes that some instructions were reproduced from other publishers and recommends permission review before public posting. Public release remains gated on that content-rights review, the flagged nutrition confirmations, and mobile/responsive review.

No Production data, schema, policies, credentials, billing, deployment, or unrelated SoulFuel features were changed.
