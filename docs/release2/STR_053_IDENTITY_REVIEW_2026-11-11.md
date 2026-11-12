# STR-053 / Review #10 — movement identity evidence

**Finding: owner review required; STR-053 remains blocked. No runtime mapping, approval, workout definition or progress data was changed. No push/deployment.** Baseline: `b75c5f8d085995fe8f91f025892a449d2ece67da`.

## Exact file and required movement

The original 36-workout library requires **Incline Dumbbell Press** for STR-053. Ten workouts reference this ID; their sequences remain intact.

- Review #10 / IMG_4059: `Soulanova_Strength_IMG_4059_Incline_Dumbbell_Press_APPROVED.mp4`
- SHA-256: `560de86d0dfd8b4db9d6a24512114048ee6ac91309739e146bc65667c8f503a7`
- Original Downloads source, archived approved-package master, Desktop approved master and website candidate all exist and match those exact bytes. This is an identity/label problem, not a different file accidentally carrying the same name.

## What the frames actually show

[Review #10 contact sheet](artifacts/str-053-identity/STR-053-contact.jpg): four columns, row-major requested seek times **0, 4, 8, 12, 16, 20, 24 seconds**; final cell blank.

[Review #10 later-motion sheet](artifacts/str-053-identity/STR-053-late-contact.jpg): **10, 12, 14, 16, 18, 20, 22, 24 seconds**.

Visual assessment: an incline-bench dumbbell sequence. Early frames have bent elbows near the torso and raised weights, consistent with press-like positions. Later frames show one arm high while the other opens outward/lower, with changing elbow positions. The outward opening can appear fly-like, but these mixed/asymmetric positions do **not** establish a consistent clean press or a consistent flyes demonstration. This is a frame-based assessment, not a certified exercise-technique review. No footage was synthesized, mirrored or relabeled. Contact sheets only extract/resize/tile the original frames; requested seek times are recorded separately in `artifacts/str-053-identity/frames.json`.

## Original approval versus later correction

The original `Downloads/Soulanova_Strength_Review/Approved_Strength_Package/production-manifest.json` has:

- Review #10 approved by user review number; exact source/master hash verified.
- `exercise_name_user_confirmed: null`.
- Suggested movement: `Incline Dumbbell Press`.
- Identity status: `gallery_visual_suggestion; full technique review remains required`.
- Visual-review note: `Filename and incline bench pose align; full motion review required.`

The Desktop/mobile 17-mapping integration manifest later labels the exact same hash a pinned Incline Dumbbell Press master. However, the newer mobile four-routine JSON explicitly records a **user-confirmed Incline Dumbbell Flyes correction**, preserves Review #10 and the identical hash, and flags that conflict with the production manifest. Neither a filename nor checksum can settle the conflicting movement labels. The 36-workout website definitions are not replaced with that different four-routine catalog.

Original approval entries, hash comparisons and source fingerprints are recorded in [STR_053_IDENTITY_EVIDENCE_2026-11-11.json](STR_053_IDENTITY_EVIDENCE_2026-11-11.json). The prior reconciliation JSON preserves the exact later correction/source hash.

## Existing approved press alternative — not substituted

**STR-112 / Review #09 / IMG_4058** is already an approved Incline Dumbbell Press file:

- SHA-256: `ef0433a6e4f1b889b5bf183715c139d0bb96a797728f126651907fb65fbc9705`.
- Original source, archived master, Desktop master and candidate hashes match.
- [Review #09 comparison sheet](artifacts/str-053-identity/STR-112-contact.jpg): **0, 3, 6, 9, 12, 15, 18 seconds**, row-major, final cell blank.
- The sampled sequence more consistently alternates bent-elbow and raised-arm press-like positions. It is a distinct approved take already used under STR-112. It has not been copied into STR-053 or used to mark the ten incomplete plans complete. Substitution would require an explicit mapping decision, preserving provenance and the original workout sequences.

Owner review should decide whether Review #10 is a suitable named demonstration at all, or authorize an existing approved press take for the STR-053 press step. A technique reviewer may instead reject the mixed motion and request a different approved master. No new approval is inferred here.

## Historical 22-file receipt

Still unresolved. The recovered Release 2 snapshot manifest lists **19 Strength MP4 paths**: 17 exercise files plus warm-up and cool-down. The recovered exercise approval catalog has 17 mappings; the underlying gallery manifest has 31 review-approved entries, including unresolved/non-program entries. Those are different inventories, not proof of a 22-file set. The exact historical 22-file/hash receipt remains needed before declaring that discrepancy reconciled. No extra exports were promoted to fill a numerical gap.

## Validation and release status

- **40/40 focused checks passed**, covering all 36 original workout sequences, coverage totals and playable-file restrictions.
- The previous **218/218 full regression** result is retained; it was not rerun or claimed as a new run for evidence-only changes.
- Coverage remains **26 workouts with full exercise-demo coverage; ten with STR-053 blocked**. All 36 stay visible.
- Existing progress helpers/history and all other programs remain unchanged. FoodScore remains disabled.
- No code, environment, credentials, Production, other worktree, database or deployment was changed. This evidence report and frame artifacts are local candidate documentation only.
