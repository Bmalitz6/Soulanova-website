# SoulStrength approved media and hosting release audit

Runtime: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`.

**Historical pre-remediation audit; full Production readiness remains BLOCKED. See the corrective candidate implementation below, which supersedes the old candidate 404 finding.** No approval status, catalog, source asset, hosting configuration or deployed file was changed.

The original 36 plans (12 per level) and 17 movement IDs remain. Exactly five mappings are pinned approved masters. Twelve historical review clips remain unavailable; historical review approval was not treated as final-master designation. None of the 36 plans has approved video for every movement. Unavailable/skipped sets are not counted as completed; warm-up/cool-down media and progress sync remain unavailable.

## Fresh read-only hosting/integrity evidence

Five approved public Production files were streamed directly into hashes; no media archives were copied. The corresponding candidate paths were checked with SSO-authorized HEAD requests. Full hashes/statuses and the twelve pending IDs are in `SOULSTRENGTH_HOSTING_READINESS_2026-11-11.json`.

| Approved ID | Movement | Current Production | Approved SHA matches | Candidate path |
|---|---|---|---|---|
| STR-114 | Dumbbell Squeeze Press (IMG_4061) | 200 | PASS | 404 |
| STR-053 | Incline Dumbbell Press (IMG_4059) | 200 | PASS | 404 |
| STR-112 | Incline Dumbbell Press (IMG_4058) | 200 | PASS | 404 |
| STR-061 | Reverse Shoulder Press (IMG_4048) | 200 | PASS | 404 |
| STR-115 | Shoulder Press (IMG_4044) | 200 | PASS | 404 |

All five local candidate video files are absent. The current Preview can play them because its approved mappings use absolute `https://www.soulanova.com/app/strength/media/exercises/...` URLs served by the existing Production deployment. **Inference from the checked URLs and candidate 404s:** replacing that deployment with the candidate without preserving these paths or updating to stable hosting would break the five video URLs.

The exact approved UI/catalog source remains recorded at `6b412af05ed662f8550599887877b80c7cc841d5`; original source pins are preserved. Pending movements: STR-091, STR-104, STR-020, STR-001, STR-058, STR-056, STR-045, STR-092, STR-087, STR-117, STR-036 and STR-057. No candidate export or raw render was promoted.

## Required release actions

1. Resolve exact-file final-master approval for the missing movements, or explicitly approve a limited catalog/approved-exercise-practice release. Do not advertise all 36 plans as complete guided-video workouts while coverage is incomplete. Do not invent replacement classes or swap in unapproved media.
2. Approve hosting continuity for the five pinned masters: preserve their verified paths in the immutable staged artifact, or use an approved stable HTTPS asset location independent of the Production alias. Keep exact reviewed hashes and filenames. Do not move/delete archives or provision paid resources implicitly.
3. If hosting changes, update the candidate mappings and the strict `app/programs/program-core.js` allowlist together, restricted to the verified approved assets. The present allowlist intentionally permits the current Production host; changing only URLs will not enable playback safely. Never use credential-bearing/query-token media URLs or broaden the allowlist arbitrarily.
4. Before promotion, verify each approved file's hash, MIME/range behavior and actual desktop/mobile playback from the **staged Production-configured build**. Verify rollback preserves media availability. Existing Preview playback and old-domain availability do not establish this continuity.

No hosting resource, upload, deployment, branch merge or Production change was performed in this audit. Original artwork, workout names/levels/instructions and pending-media restrictions remain intact.

## Corrective candidate implementation (supersedes the hosting failure above)

Confirmed cause: the five old relative paths were absent from the candidate, while its mappings pointed to the current Production alias. The files were not corrupt or unapproved; the new artifact simply did not contain them.

The exact five masters are now packaged under `app/strength/media/exercises/<approved-sha256>/<original-filename>`. All five packaged bytes match their previously approved hashes. Total: 26,044,842 bytes. `app/strength/approved-media.json` records IDs, hashes, sizes and original provenance. Provenance URLs are audit metadata only; **runtime mappings are same-deployment, content-addressed paths**, and the media allowlist requires the exact ID/hash/path. No media archive was moved, renamed or deleted. Static immutable cache headers apply only to these public approved videos, never private member data.

The member-facing library now derives approved-only practice selections from the unchanged original plans: 10 Beginner, 12 Intermediate, 12 Advanced. Two plans with no approved movement are hidden. These 34 selections reuse only five approved IDs, not 34 newly approved complete workouts. Original titles, sets, repetitions and instructions are preserved; practice/subset labels disclose the original movement count. Exercise Reference shows only the five available approved movements. The twelve pending IDs remain unavailable in the preserved source catalog. No complete original plan is advertised as fully released. Warm-up/cool-down and progress recording remain unavailable.

Before Production, the owner must accept this explicitly limited practice scope or finish final-master coverage for the original plans. Production staging, actual iPhone playback and staged-build acceptance remain separate gates. Protected Preview HTTP/hash/range receipts are recorded in the remediation delivery report once deployment verification finishes.
