# Existing program catalog integration — November 10, 2026

Base: `4bfef5f30f0bb1bba668dbe6f5be67983abc9f00`, branch `feature/soulfuel-clean-preview-2026-11-09`.

## Read-only cross-project inventory

Inspected website, mobile catalogs, Desktop production tracking and Downloads archives without modifying other worktrees or copying large media. Sources:

- `Soulanova-SoulFuel-nutrition-foundation-2026-11-09/app/strength/strengthWorkouts.json`: 36 existing workouts, 12 per Beginner/Intermediate/Advanced level; 17 exercise demonstrations. The corresponding mobile `strengthLibraryCatalog.ts` and `strength-workouts/strengthWorkouts.json` retain the same substantial program work.
- `Desktop/Soulanova/10 Strength/05 Production Tracking/Strength_Approved_Masters.csv`: 31 reconciliation rows, only five designated `APPROVED MASTER — pinned SHA-256 verified`; historical gallery approval is distinct from current final-master designation. The 17-exercise program selection includes those five masters and twelve historical review assets. Other raw/generated/review inventories contain hundreds of rows and were not promoted into this runtime catalog.
- Existing website Strength player/pages under `Soulanova-website/app/strength/` and the nutrition-foundation candidate include phase, set/rest and completion/sync code. They depend on about 162 MB of media and environment/data-write behavior outside this bounded integration. That runtime was reviewed for reuse but not transplanted wholesale.
- `Soulanova-SoulFuel-nutrition-foundation-2026-11-09/app/stretching/stretchingCatalog.js`: six existing routines, two per level; 22 movement names, sequences and instructions.
- `Desktop/Soulanova/09 Stretching/06 Production Tracking/SoulStretch_Production_Approval_2026-11-08.json`, recorded 21:28:01 -05:00, plus its README: explicit owner approval of 22 exact file/movement/SHA-256 mappings. This later receipt supersedes the older not-approved Development inventory **only for those hashes**. A filename beginning IMG, the generated folder location or an instructor still alone provides no approval.
- Existing SoulStretch website player/catalog/guidance/progress files and the mobile manifests were inspected read-only. Older player code includes guest history writes and completion state, so this release reuses catalog content without importing those persistence paths or Session 2's playback changes.

No archive, raw video, Runway/Magic Hour export or production master was moved, renamed, deleted, transcoded, regenerated or duplicated. Runtime additions are small HTML/CSS/JS and sanitized catalog metadata; no absolute source paths or credentials are in the public catalog.

## Verified media and what is enabled

All 17 local Strength catalog files were SHA-256 checked. Five are pinned masters:

| ID | Existing exercise | Hosted source |
| --- | --- | --- |
| STR-114 | Dumbbell Squeeze Press | www.soulanova.com/app/strength/media/exercises/Soulanova_Strength_IMG_4061_Dumbbell_Squeeze_Press_APPROVED.mp4 |
| STR-053 | Incline Dumbbell Press | Same directory / Soulanova_Strength_IMG_4059_Incline_Dumbbell_Press_APPROVED.mp4 |
| STR-112 | Incline Dumbbell Press | Same directory / Soulanova_Strength_IMG_4058_Incline_Dumbbell_Press_APPROVED.mp4 |
| STR-061 | Reverse Shoulder Press | Same directory / Soulanova_Strength_IMG_4048_Reverse_Shoulder_Press_APPROVED.mp4 |
| STR-115 | Shoulder Press | Same directory / Soulanova_Strength_IMG_4044_Shoulder_Press_APPROVED.mp4 |

All five already-hosted files returned HTTP 200/video MIME. Their full streamed bytes matched the approved hashes (26,044,842 bytes read, not saved). This was read-only access to existing public media, not a Production deployment or configuration change.

All 22 Stretching Desktop sources matched the exact approval receipt. Their existing content-addressed URLs under `https://dscbavbnlubfmfhudqwy.supabase.co/storage/v1/object/public/soulanova-soulstretch-public/soulstretch/<sha256>/<filename>` returned HTTP 200 and the expected media length/MIME through bounded HEAD checks. No bucket, credentials or object was changed. Remote byte hashing of all 22 was not repeated; the runtime uses the existing approved, hash-addressed paths.

Chrome actual playback spot-checks passed for STR-114 (1280×704, 22.771 seconds) and Shoulder Stretch / overhead-reset (1104×816, 28.433 seconds), with time advancing beyond 0.5 seconds and no media error. The bundled test Chromium reported unsupported media for these codecs; system Google Chrome passed. Physical iPhone/Safari playback and every hosted clip have not been individually accepted in this task.

## Website behavior

Overview Strength now opens `/app/strength/` → SoulStrength. All 36 original workout titles/levels, exercise order, sets/reps/rest and instructions are available as catalog details. The five pinned masters have explicit View approved demonstration controls. The twelve historical review clips are labeled not enabled pending final-master confirmation; they are not silently substituted. Full guided Strength sessions, warm-up/cooldown playback, automatic set/rest playback and completion sync are **not enabled** by this catalog integration. Do not present all 36 workouts as end-to-end playable classes.

Overview Stretching now opens `/app/stretching/` → SoulStretch. All six original routines and 22 approved demonstrations are exposed. Demonstrations use native play/pause/seek/volume controls and manual Previous/Next within a selected routine. There is no automatic routine sequencing, new narration or completion tracking. Existing member workout/health/diary history is neither read nor written by these pages. The original exercise names, instructor videos and routines are unchanged.

Existing authentication is reused; a verified non-anonymous member is required before rendering or selecting media. Sign-out/account changes clear pending selection and pause/remove the video source. No new profile, backend, migration, anonymous write or credential is introduced. Catalog metadata and previously public video URLs remain public assets; member sign-in gates the website UI, not the public media host.

## Shared navigation requirement

The new program pages have a visible Back to Overview link and Soulanova logo pointing to `/app/#home`, plus Back to program library inside details. The requested **global** rule across all existing member screens remains a separate follow-up: the dashboard logo and Tai Chi class wordmark currently lead to the public site, while embedded libraries/player/account views have different back controls. This release intentionally does not partly patch unrelated headers or alter working Meditation/Yoga/Tai Chi/SoulFuel flows. A separate shared-shell navigation pass must cover all those screens and nested/back/session behavior consistently.

## Remaining decisions and dependencies

- Owner must designate the final masters for the twelve historical review exercises, with exact hashes. Do not infer final approval from the review gallery or folder names.
- Confirm warm-up/cooldown master and narration approvals and supported hosting before reusing the full Strength phase player. Current catalog playback does not depend on those unverified segments.
- No new media hosting is required for the 27 enabled demonstrations: existing public endpoints are reachable. A future private-media policy would require a separate authorized signed-delivery design; this task does not privatize already public media.
- Full guided progression, automatic sequencing and local/cloud completion history require a separately reviewed integration of the existing players, not replacement lessons. Session 2's mobile implementation is untouched.
- Complete the global shared navigation follow-up above and physical iPhone acceptance. Browser errors remain clearly labeled; no successful playback/completion is claimed on a failed load.

Validation evidence is retained locally under `.git/soulfuel-real-program-evidence/`; it includes inventory checks, hosting results, actual Chrome media spot checks and regression output. Release only to the existing SSO-protected feature Preview, updating only its branch-scoped approved commit pointer. Redis credentials, Production deployment/domains and other sessions remain unchanged.
