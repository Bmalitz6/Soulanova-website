# Tracker dials and Add Food visual review

Baseline: 1080da1f66b825b9d422d42d23e4061436afd0ba, matched local and remote before editing. Branch: feature/soulfuel-clean-preview-2026-11-09. Owner requests visual review before activation. **FoodScore and external barcode lookup remain OFF. Production is hard-denied.** No activation authorization is implied by this release.

## Changes

Four large SVG tracker dials, teal calories, blue protein, amber carbohydrates and purple fat. Desktop four-across; mobile two-by-two at 390px and 320px. Consumed amount, units, saved optional goal and uncapped percentage are explicit. Percentage = consumed / positive user goal × 100. Ring fill is bounded to one revolution; only the visual arc is bounded, never the displayed percentage. At exactly the goal the badge says Goal Reached with a check and thicker ring. Over-goal values use red ring/percentage, dashed outer overflow circle and Over Goal label, including 101%, 125%, 200% and higher. Text and shape supplement color.

Unset/zero/invalid goals show Not Set and Set Goal, no invented percentage. A Set Goal link opens goal setup and focuses the matching field. Empty diary means zero consumed; an existing confirmed entry with missing nutrient data shows Unavailable instead of inventing zero. When some entries lack a nutrient, totals still reflect available reported values only, as disclosed in tracking details. Dials update through the existing member-scoped diary render on add/edit/delete/date/goal changes; no duplicate counting or data migration.

Compact photographic hero gives the tracker more prominence. One Add Food panel below offers Scan Barcode and Enter Manually tabs with arrow/Home/End keyboard support. Scan tab has an original inline SVG scanner graphic, camera action, UPC/EAN entry and loading/error statuses. While paused, a disabled presentation of the controls is visible, with no submit handler/network/camera access. Manual tab has spacious food, portion, meal and macro inputs; edit actions select this tab. Secondary metrics/goals/methodology remain expandable. Review/portion/explicit confirmation before adding a scanned product is preserved, tested using mocks only. Switching to Manual stops an active/pending camera attempt.

## Preserved security, data and assets

Formula core, diary storage core, camera scanner module, availability defaults, server proxy and Preview gate remain byte-identical to the prior reviewed implementations, checked by preservation tests. The 60/25/15 formula, missing-data safeguards, storage readback, member isolation, 75 original recipes and meal content remain unchanged. No new photography/services/dependencies. Existing approved local Pexels images and provenance retained. Scanner SVG is authored UI artwork, not generated or purchased media.

No Redis secrets read/changed; branch-only sensitive Preview metadata verified. No live product or Redis request. No Production, shared navigation or other-session edits. Preview publishing requires clean dedicated branch, reviewed diff, no activation variables, enabled Vercel Authentication, exact Git commit and unchanged Production deployment/domains before/after.

## Validation and evidence

Full available suite: **77 passed, 0 failed, 0 skipped** (66 non-browser, 11 browser). Includes 0/100/101/125/200/375%, invalid/missing goals/data, fractional/very large percentages, goal changes, add/edit/delete, account isolation, duplicate prevention, mocked scan/portion/confirm/persistence, loading/error/retry and default-off no-network paths. Existing Production denial/spoofing, Redis/proxy failures, formula and recipe regressions pass. Automated axe WCAG 2 A/AA and 2.1 AA passes in default, product, overflow and manual states. Touch/keyboard/no-horizontal-overflow checks at desktop, 390px and 320px. Browser emulation does not certify physical iPhone camera operation or complete human accessibility review.

Run with externally installed Playwright/axe paths using node --test --test-concurrency=1. No new test dependencies committed. Evidence is local under .git/soulfuel-dial-evidence: before-{1280,390,320}.png, after-empty-{width}.png (same empty-diary comparison), after-{width}.png (fictional entries/goals demonstrating all four colors), after-overflow-{width}.png (fictional 125/200% examples), manual-390.png and tests-77.log. Mock data is clearly test-fixture data, not real member records. Screenshots are not committed as site content.

Next action: owner visually reviews the disabled protected Preview. Do not apply previous activation variables/SHA. Any later activation needs separate approval for this new release SHA plus the unresolved owner-only testing/licensing/access/retention decisions in the existing handoff. Public launch and physical camera/live Redis/OFF acceptance remain separate.
