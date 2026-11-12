# Owner-confirmed bilateral press prescriptions

> Current disposition: the owner attests personal creation of the performance-driving video and a wholly synthetic instructor with no real-person reference. The scoped STR-112 rights gate is satisfied and all ten runtime replacements are applied. Active exercise-demo coverage is now 12/12/12 (36/36); STR-053 stays excluded. See [final disposition and mapping report](STR_112_FINAL_RIGHTS_DISPOSITION_AND_MAPPINGS_2026-11-11.md). Earlier blocked/practice-only findings below are historical, not current status. No push or deployment.

## Applied correction

The owner confirms both arms together were intended. Only these two original Incline Dumbbell Press repetition labels were corrected:

| Workout | Prior label | Corrected label |
|---|---|---|
| Beginner · Chest & Arms (`beginner-chest-and-arms`) | 8 each side | **8 total bilateral repetitions** |
| Advanced · Core & Press Strength (`advanced-core-and-press`) | 10 each side | **10 total bilateral repetitions** |

Both are still STR-053 steps until the separate STR-112 substitution condition is satisfied. Sets, rest, instructions, exercise order, workout IDs, titles, levels and all other fields remain unchanged. Other movements' “each side” labels were not changed. The corresponding exercise/step representations in the parallel program catalog carry the same two corrections.

The library remains **36 original workouts: 12 Beginner, 12 Intermediate, 12 Advanced**. The historical source SHA remains pinned in the original approval receipt. The new source SHA is `9f97600ea8792b2d1034a735caea4a24504aded1ee2af0367ba2cc6fecde6a44`. Tests restore just the two corrected labels in memory and prove that the original hash/content is otherwise unchanged; the historical pin was not overwritten.

## Ten proposed STR-112 mappings reconciled

The two prescription ambiguities are now resolved by owner confirmation. All ten affected steps are bilateral-compatible with the existing verified STR-112 / Review #09 demonstration. Their exact proposed IDs/positions and unchanged prescriptions are in [STR_112_PRESS_COMPATIBILITY_DRAFT_2026-11-11.json](STR_112_PRESS_COMPATIBILITY_DRAFT_2026-11-11.json).

**The ten mappings are not applied.** The owner explicitly made substitution subject to confirmed commercial source-image and instructor-likeness rights. That confirmation/evidence has not been supplied. Runway's general output permission, the master approval label and a matching file hash do not establish those rights. No right, release or approval was invented. No further prescription clarification is required for these two steps.

STR-053 / Review #10 remains blocked with its exact identity, file and frame evidence preserved. STR-112's approved file and existing mappings remain unchanged. Applying an approved future substitution would change the specified step reference, not relabel STR-053 or duplicate/modify video files.

## Coverage audit

| Level | Original workouts | Currently fully mapped | After all ten rights-confirmed replacements (conditional only) |
|---|---:|---:|---:|
| Beginner | 12 | 10 | 12 |
| Intermediate | 12 | 8 | 12 |
| Advanced | 12 | 8 | 12 |
| Total | **36** | **26** | **36** |

**All 36 do not yet have verified active demonstration coverage.** Ten still retain the blocked STR-053 reference. The 36/36 figure is the result of an in-memory draft audit only, contingent on the rights condition and actual application of the ten mappings. It is not an activated result, exercise-completion claim, full-program release approval or proof of prescribed repetition performance.

Rights confirmation is the remaining blocker for this specific substitution. Broader release gates, including warm-up/cool-down, completion behavior, progress sync and Production acceptance, remain separate. FoodScore stays disabled.

## Preservation and release status

No push, deployment, environment-variable/credential change, Production change, other-session edit or database write occurred. Existing history/progress behavior remains untouched. The original program source, historical approval evidence and all 17 video files remain preserved, except for the two expressly authorized label corrections in the current source catalogs.

## Fresh validation completed

- **224/224** full sequential regression/security/unit/browser checks PASS; zero failures/skips.
- Includes both corrected workout details at desktop, 390px and 320px; only the authorized labels changed, with no horizontal overflow.
- **17/17** packaged videos pass real Chrome decode/play/pause/seek/resume checks; **17/17** source hashes match the approved manifest.
- Local production-mode build PASS; **17/17** output media hashes match. No Production deployment or staging occurred.
- **68/68** JavaScript syntax checks PASS.
- Original workout preservation is verified by reversing only the two authorized repetition fields and matching the historical source hash/content. All other program and approval data remain unchanged.
- No new live member writes; prior real acceptance evidence remains byte-identical.
