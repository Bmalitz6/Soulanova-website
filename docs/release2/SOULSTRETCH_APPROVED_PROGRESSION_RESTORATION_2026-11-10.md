# Approved SoulStretch progression restoration

## Source comparison

Website base: `1bef1f620d55e9948d32835b817121f95f5b3a1a`, protected feature branch `feature/soulfuel-clean-preview-2026-11-09`. Its normalized generic catalog contained only six routines and manual demonstration playback. That obsolete Stretching entry is removed; Strength's existing 36-workout catalog remains identical as data.

Authoritative source: GitHub branch `codex/soulstretch-progression-2026-11-09`, exact commit `126ace55dad4e40ea54331f0f999818b74aadfac`. GitHub's branch tip and the immutable object in the Release_2_Website_Review repository matched. All files were read with `git show <commit>:<path>`, not copied from its possibly dirty working tree. No other worktree was edited, checked out, reset or stashed.

The owner-provided `SOULSTRETCH_24_PROGRAM_INVENTORY.md` exists but describes an earlier progression (e.g. Beginner 3–9 movements and short Advanced routines). The pinned commit is used as instructed; neither that older Markdown nor the six-routine snapshot was treated as the source of routine definitions. No routines, instructions, sequences, rounds or media were regenerated.

## Exact progression preserved

| Collection | Programs | Unique movements per program | Rounds | Playback segments | Calculated duration range |
| --- | --- | --- | --- | --- | --- |
| Beginner | 6 | 5–6 | 2 | 10–12 | 327.132–403.134 seconds (within 5–7 minutes) |
| Intermediate | 6 | 10 | 2 | 20 | 667.132–687.084 seconds (within 11–12 minutes) |
| Advanced | 6 | 17 | 2 | 34 | 1142.414–1154.948 seconds (about 19 minutes) |
| Body Area | 6 | 3–4 | 1 | 3–4 | 94.333–130.141 seconds |

All 24 IDs and ordered sequences are unique. All 22 approved movements are covered. The exact source computes duration from approved clip seconds multiplied by rounds, plus five seconds between segments. Its UI shows precise clocks (Advanced 19:03–19:15); its separate `minutes` field uses ceiling and therefore returns 20 for Advanced. This rounding discrepancy is preserved and disclosed rather than changing approved timing or forcing a 19:00 duration. Body-area sequences remain exactly as the pinned commit defines them.

## Migrated files

Exact source catalog, playback state machine, guidance, CSS and media manifest:

- `app/stretching/stretchingCatalog.js`
- `app/stretching/stretchingPlayback.js`
- `app/stretching/stretchingGuidance.js`
- `app/stretching/stretching.css`
- `app/stretching/stretchingMediaManifest.json`

Exact approved binary assets: all 22 `app/stretching/narration/miriam/*.mp3`, all 22 `app/stretching/thumbnails/*.jpg`, and the source's approved instructor still. No movement video or large video archive was copied. The supplied small audio/still assets total about 8.5 MB and are necessary existing dependencies, not generated replacements.

Source `index.html` and `stretching.js` are ported with narrow integration changes: existing verified non-anonymous member access, Back/logo to Overview, immediate media cancellation on account change, and no history reads/writes. The source catalog/player, level/body-area selection, sequence list, automatic five-second transitions, round tracking, pause/resume, Previous/Next, restart/retry and matching Miriam narration are retained. Completion screens report playback state but do not claim a saved history entry. Existing member records are not touched.

`stretching-integration.css` only fixes low-contrast secondary labels/footer and accessible header touch targets. Source layout/style remains otherwise intact. `SOULSTRETCH_126ACE55_SOURCE_HASHES.json` inventories every source blob and binary asset; tests enforce exact hashes for the unchanged imported files, including catalog, engine and all narration recordings.

The Overview Stretching link stays `/app/stretching/`; all approved dashboard artwork and other program destinations remain unchanged. The obsolete Stretching object is removed from `app/programs/catalogs/programs.json` so the generic page cannot silently reintroduce six routines. Strength retains its prior catalog and player unchanged.

## Media and validation

- All 22 video endpoints returned HTTP 200 with expected byte lengths at the existing approved hash-addressed public Supabase paths. No bucket/object/credentials were changed.
- All 22 Miriam recordings exactly match the source commit and guidance SHA-256 values; ffprobe validated each MP3 (17.415–23.684 seconds). No new voice generation occurred.
- Actual Google Chrome smoke test, using an isolated mocked member session and real media, played video plus matching Miriam audio, paused/resumed both, then automatically transitioned after an end-of-clip seek and the normal five-second transition to the second movement and its own Miriam track. No whole-program physical practice or real-member save is claimed. No history keys were written.
- Regression coverage pins the source against the obsolete catalog; validates counts, unique IDs/sequences, coverage, movement counts, exact timings, repeated rounds, all 34 Advanced segments, once-only completion, skips, retry/pause/leave and failed-start resume behavior.
- Browser checks cover Beginner/Intermediate/Advanced and body-area selection, 34-segment Advanced display, correct narration mapping, existing seven-program navigation, account-switch cancellation, no history writes, axe contrast/keyboard checks and no overflow at 1280, 390 and 320 pixels.

Release only on the SSO-protected feature Preview. Update only the exact branch-scoped approved commit pointer; preserve Redis values/scopes, Production hard-deny, Production deployment/domains, all recipes/diary/goals and both mobile sessions. Physical iPhone/Safari acceptance remains a separate owner check.
