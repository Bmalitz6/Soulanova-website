# Chair Yoga Production readiness — 2026-11-13

## Owner authorization recorded

The owner explicitly approved all **142 generated Miriam recordings** for member playback as a batch on 2026-11-13. Approval was based on the tested Beginner, Intermediate, and Advanced experiences and documented technical checks. It is not a claim that every individual recording was separately listened to.

Approval record: `app/chair-yoga/narration/member-playback-approval-manifest.json` (`chair-yoga-miriam-batch-member-playback-2026-11-13`). This authorizes the 137 movement-loop files, two level openings, and three workout closings listed by exact request key, URL, Runway task ID, script SHA-256, audio SHA-256, byte count, and duration. The approved voice remains Runway Miriam `VhxAIIZM8IRmnl5fyeyk`, `eleven_multilingual_v2`, speed `0.75`.

Per-track `audioStatus`, `ownerApproved`, script, task ID, and generated-file records remain unchanged; generated individual tracks retain `generated_pending_owner_review` / `ownerApproved:false`. The member eligibility decision is batch-level. Previously individually approved reused assets retain their separate records. No recordings were regenerated and no Runway credits were spent.

## Candidate and preserved content

- Isolated worktree: `/private/tmp/soulanova-chair-yoga-preview-2026-11-12`
- Branch: `preview/chair-yoga-website-2026-11-12`
- Starting HEAD for this work: `c8ae31b0469c21cdcd1adea792f39c182a17df55`
- Candidate commit: `561ce1506c683dcb2a7b8f9b7a576f40e8e6f000`.
- Protected Preview deployment: `dpl_Gs3J4anK7S7xhNnEYqc8gKA2Uc98`, `https://soulanova-website-ftf1tgte4-soulanova.vercel.app`, READY, `target:null`, branch alias only.
- Authenticated Vercel fetch returned HTTP 200 for the Chair Yoga page, approval manifest, and a representative Miriam MP3 (response starts with an ID3 MP3 header). This verifies deployed HTTP availability, not interactive browser playback or member authentication.
- The branch descends from the website Release 2 source lineage (`feature/soulfuel-clean-preview-2026-11-09`, including the `37754c9` release candidate); it preserves the prior live Pilates removal.
- The 36 Chair Yoga videos, 142 generated narration files, approved sample/demo tracks, scripts, hashes, and workout sequences are preserved. Batch verification compares all 142 local audio files to the generated manifest.
- Chair Yoga still uses the existing Supabase `auth.getUser()` member gate. Member playback of pending individual tracks requires both the batch authorization and a client-side SHA-256 match of fetched bytes. Missing or mismatched approval data fails closed for narration.
- The approved 36-workout matrix remains unchanged. Narration stays separate from video media, and the existing controls remain in place.

## Access and subscription findings

The release plan documents registered free-member access. The candidate has no implemented Stripe or other paid subscription/entitlement enforcement. Thus authentication can be checked, but a paid subscription gate cannot be claimed as validated. If Chair Yoga is intended to be paid-member-only at launch, that is a release blocker requiring a separately scoped entitlement design and test.

The MP3s and videos are ordinary static website assets. The member UI requires a signed-in Supabase user before it exposes the library and checks narration authorization before playback, but static file URLs themselves are publicly fetchable. Do not describe static media as private or subscription-secured. If access to the files must be restricted independently of the UI, protected media delivery is a separate blocker.

The Vercel project is `soulanova-website` (`prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`). Read-only Vercel inspection on 2026-11-13 confirmed SSO protection enabled for non-custom domains (`all_except_custom_domains`) and project domains `soulanova.com` and `www.soulanova.com`. Deployment `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T` is READY and currently carries aliases `www.soulanova.com`, `soulanova.com`, and the project Vercel aliases. The more recent `dpl_9CnrFg5KXYbtb7wCb7JZvgMmg4dW` is READY with target `production` but has no aliases; it is not the verified domain rollback target.

## Release validation and gates

On this candidate, the complete sequential Node regression suite reports **271 tests: 195 passed, 0 failed, 76 skipped**. The skipped cases include real-browser/member-auth checks; those are not reported as passed. The Chair Yoga tests verify all 142 batch files against size/SHA-256 metadata, exact request-to-approval-manifest entries, the fixed voice configuration, preserved per-track review metadata, all 36 matrix workouts/videos, and fail-closed playback lookup. `node --check` passed for both Chair Yoga runtime scripts; `git diff --check` passed. The release preflight reports `content.ok: true` but `readyForStaging:false` / `ready:false`; common release acceptance gates remain blocked. The owner-approved Preview experience was previously accepted by the owner; that acceptance is preserved as experience-level approval, not per-track listening evidence.

Still required before Production promotion:

1. Run the complete sequential website suite and media-integrity checks on the final release commit.
2. Create/review an SSO-protected Preview of that exact commit and perform actual authenticated browser playback of representative Beginner, Intermediate, and Advanced sessions, including narration controls, automatic transitions, and completion. Automated checks do not substitute for this browser evidence.
3. Confirm whether Chair Yoga is for free registered members or requires a paid entitlement. The site currently has no paid subscription enforcement.
4. Decide whether public static MP3/video URLs are acceptable for the member content. The current UI gate is not file-level access control.
5. Close the common Production acceptance gates in `docs/release2/PRODUCTION_RELEASE_ACCEPTANCE_2026-11-12.json`, including real new-origin member authentication/session checks, staged Production configuration and operational monitoring. Do not convert untested items to PASS.
6. Obtain a separate explicit Production authorization naming the exact final commit and tested deployment.

No Production deployment, alias change, database mutation, subscription change, media replacement, or Runway request is authorized by this readiness preparation.

## Rollback procedure

Before any later promotion, recheck that `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T` is still READY and has the `soulanova.com` and `www.soulanova.com` aliases. If a separately authorized release causes a critical regression, the Vercel operator should roll back that exact deployment in the `soulanova` team/project, then verify both aliases and authenticated read-only program access. No database rollback is expected for this website-only change; do not run SQL or alter member data. Verify current alias state again at release time rather than relying on this dated receipt.
