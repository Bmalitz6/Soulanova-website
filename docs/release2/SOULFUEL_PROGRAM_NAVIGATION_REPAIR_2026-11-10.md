# Program navigation repair

Base: fd4595e2e93dcd40a9eb1560eb6e12bd1e0e2b22; feature/soulfuel-clean-preview-2026-11-09.

## Confirmed cause and minimal correction

A browser regression reproduced Meditation → Overview → Stretching showing Meditation. The Stretching card's category is already correctly `Stretch & Mobility`; filtering re-renders its existing `Move with Ease` session. However, the Meditation subview retains its visible state across dashboard tabs and keeps the normal workout list/heading hidden. The category-card handler now closes retained subviews through the existing pause/restore controls before applying the filter. The same handler restores the existing Tai Chi library/player if retained. No route, class, exercise, authentication or data-writing feature is invented.

## Existing destinations and limitations

| Card | Existing destination / heading | Scope |
| --- | --- | --- |
| SoulWalk | Dashboard stays visible; Mobile app label | No approved website destination; remains intentionally inactive. |
| Strength | Workout Library, Strength → Everyday Strength | One 30-minute self-guided suggested outline, not a complete instructor-led Strength catalog. |
| Yoga | Workout Library, Yoga → Gentle Yoga Reset | Existing 25-minute self-guided preview. |
| Tai Chi | /app/classes/beginner-tai-chi-foundations/ → Beginner Tai Chi Foundations | Dashboard opens the 10-minute introductory class, not the complete existing Tai Chi library. |
| Meditation | /app/#meditation → A quieter moment, just for you. | Existing meditation library, seven 10-minute and ten 20-minute sessions. |
| Stretching | Workout Library, Stretch & Mobility → Move with Ease | Existing 20-minute self-guided outline, explicitly no video yet; not the separate mobile Stretching catalog. |
| SoulFuel | /app/soulfuel/ → Good food. A little more balance. | Existing Food Diary, FoodScore, My Health Metrics and all 75 Recipes. |

Additional existing website Tai Chi content remains accessible through Workouts → Tai Chi → View Classes: Foundations (10 minutes), Marching Step video (2 minutes), and Flow & Balance (30-minute guided timer, 15 movements). The timer has incomplete movement video coverage, explicitly disclosed in the existing UI. Cloud Hands Flow and Balance & Control are marked Coming Soon. Free library also retains Foundations and Marching Step. This repair does not turn the dashboard Foundations card into a complete catalog or import other sessions' unpublished/native content.

## Validation and release boundary

Automated browser regressions at desktop 1280px, 390px and 320px click all seven cards independently, checking heading, category and dashboard return. SoulWalk's click is verified to remain on the dashboard; it cannot open a program without an approved link. The exact Meditation → dashboard → Stretching failure sequence is covered, including selecting the existing stretching outline. Full security/regression/browser coverage remains required before publication. Tests use disposable mocked sessions and no live barcode requests or actual member writes.

Approved imagery, compact layout, Pilates hiding, authentication, recipes, FoodScore formula/API, data models and local diary/health persistence stay unchanged. Only the existing protected feature Preview may be published; update only the branch-scoped approved commit SHA. Preserve Redis secrets, Production and mobile worktrees.
