# Chair Yoga final release gates — 2026-11-13

## Scope and disposition

This report covers the isolated website Chair Yoga candidate, its three level-opening flows and three level-closing flows, plus readiness for Production. It does not authorize or perform Production deployment, alias changes, payments, Supabase schema/RLS changes, storage provisioning, or member-data writes.

The implementation starts from `c21a971` on the existing isolated `preview/chair-yoga-website-2026-11-12` branch. Session narration integration is commit `eb5e7ab62e8a0ef045352d2807cd33d80c2f0320` on that branch. The reviewed code keeps the owner-approved 36-workout matrix, 36 videos, and 142 generated Miriam tracks and adds the six session narration flows. The runtime selects a level opening once when a workout is selected, starts movement 1 when that opening ends (or the member disables/skips the opening), and starts a once-only level closing only when the controller enters complete. Openings and closings are not connected to movement loop or Up Next transitions. Each loaded audio asset is fetched and SHA-256 checked before playback. The Beginner opening is the previously owner-approved, reused recording; the other five session tracks are members of the batch-approved 142.

## Gate register

| Gate | Status | Evidence / remaining action |
|---|---|---|
| Approved matrix and movement order preserved | PASS | Candidate retains 36 owner-approved workouts, 12 movements each, and approved 2/3/4 loop configuration. No sequence files changed in this work. |
| 142 generated recordings preserved | PASS | Batch approval manifest lists 137 movement loops, 2 level openings, and 3 level closings. Per-track `audioStatus`, script, task ID, and individual-review flags are not rewritten as separately listened-to approvals. |
| Reused Beginner opening preserved | PASS | Reuse record and review manifest identify its approved task/hash. Runtime requires exact reuse key/type/URL/hash before enabling it. |
| Openings and closings integrated once | PASS — automated code/test evidence | Opening starts only from selected-workout start; ended event begins movement 1. Closing has a generation token guard and starts only on controller completion. No opening/closing hook is wired to movement transitions. Actual Safari/iPhone session-level acceptance remains BLOCKED pending authenticated owner/test-account review. |
| Audio pause/resume, mute/volume, Next and transition sync | PASS — code/automated evidence only | The session recordings use the same HTML audio element and existing volume/mute controls. Movement-specific narration remains aligned to its video. Real browser acceptance of all six session tracks is BLOCKED pending authenticated browser access. |
| Authentication, logout, expired session, account switching with two real accounts | BLOCKED | Route uses Supabase `auth.getUser()`, listens for sign-in/sign-out, and clears player/media state on sign-out and member-ID change. Automated tests are fixtures, not two real accounts. Owner action: provide/identify two non-production test accounts and perform interactive login, logout, real expiry, B→A switching, direct-route-after-logout and return checks on the candidate Preview. Do not send passwords in chat. |
| Current access model | PASS — existing policy only | Release acceptance documents registered free-member access; no Stripe, store billing, subscription, trial, or paid entitlement enforcement is implemented. Planned prices $9.99/month and $99/year are not live access rules. |
| Paid-content authorization / static media privacy | BLOCKED for paid-only access | Video and MP3 URLs are ordinary public static Vercel assets. Supabase sign-in gates the page UI; it does not prevent unauthenticated direct downloads or enforce subscription entitlement. Do not call these private/paid-protected assets. Owner must decide whether Chair Yoga is free to registered members for the initial release or whether paid entitlement is mandatory. |
| Secure paid-media delivery preparation | BLOCKED pending owner/platform decision | Recommended design: keep source masters intact; create a separately approved private media bucket/provider and upload verified copies with content-addressed keys; serve only short-lived signed URLs from a trusted server endpoint that verifies the Supabase JWT and server-side entitlement; never put payment secrets/service keys in browser code. Before implementation, verify provider plan, capacity, bandwidth, CORS/range support and cost; approve storage provisioning/policies and a reviewed entitlement schema/API/webhook contract. No bucket, policy, table or billing changes were made. |
| Production configuration and program compatibility | BLOCKED | No production-target artifact was built/staged or tested. The candidate is isolated from live aliases. Owner/operator action: complete the production configuration review and validate a production-configured artifact with Chair Yoga alongside all existing programs, without alias assignment. |
| Monitoring and alerting | BLOCKED | No new drain/alert destination or owner-tested alert was configured. Assign an operator, verify existing Vercel/Supabase log access, test alert delivery, and define the rollback trigger. No monitoring configuration changed. |
| Staged acceptance and rollback | BLOCKED | Existing known rollback target must be reverified at release time; the dated report identified `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T` as carrying the live domains, with `dpl_9CnrFg5KXYbtb7wCb7JZvgMmg4dW` as a production-target deployment without those aliases. Re-query before release, stage the exact production artifact without domain assignment, run owner acceptance, and record the rollback target/steps. |
| Final Production authorization | BLOCKED | Requires a separate explicit owner authorization naming the exact reviewed production-target deployment/commit. |

## Recommended entitlement design (not implemented)

If Chair Yoga requires paid membership, enforce access server-side. A same-origin endpoint should validate the Supabase user token, read an authoritative entitlement state (provider-backed webhook-synchronized record or provider API), and return short-lived signed object URLs for only the authorized Chair Yoga media. Apply member/resource scope, rate limits, private caching rules, webhook idempotency, expiration/cancellation/grace semantics, and deny-by-default behavior. Static site links and client-side checks are not enforcement. Store provider keys only in managed server environment secrets. Define subscription lifecycle and refund/revocation behavior before schema/API work. The proposed prices alone do not establish an entitlement contract.

## Changed files in this readiness pass

- `app/chair-yoga/chair-yoga.js`
- `app/chair-yoga/chair-yoga-playback.js`
- `app/chair-yoga/index.html`
- `app/chair-yoga/chair-yoga.css`
- `app/chair-yoga/narration-drafts.json`
- `app/chair-yoga/narration/member-playback-approval-manifest.json`
- `app/chair-yoga/narration/production-batch-manifest.json`
- `tests/chair-yoga-phase2.test.cjs`
- This gate report and updated narration status documentation.

Audio/video binaries and workout catalog/program assignments are not changed. Production has not been deployed or altered.

## Automated evidence at this candidate

- Focused Chair Yoga tests: **32 passed, 0 failed** (matrix, synchronization/controller behavior, six opening/closing hashes and authorization resolution, session flow boundaries).
- Full sequential Node regression suite: **273 tests; 197 passed, 0 failed, 76 skipped**. Skipped cases are browser/device/auth scenarios and are not counted as acceptance passes.
- `node --check` passed for `chair-yoga.js` and `chair-yoga-playback.js`.
- `git diff --check` passed.
- A fresh local SHA-256/byte-count sweep passed for all **142** batch-approved generated MP3s; the catalog includes all **36** approved Chair Yoga videos. Automated source tests also cover exact video hashes.
- Release preflight: `content.ok: true`, `readyForStaging: false`, `ready: false`. Outstanding preflight gates: current-origin member acceptance, direct routes after logout, genuine session expiry, member switching/return, Production configuration, monitoring/alert test, staged Production acceptance, and final Production authorization. Nutrition privacy and the existing registered-free-member access model passed the documented release-scope check.

Vercel read-only inspection confirms project `soulanova-website` (`prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I`) has SSO protection enabled for non-custom domains. The currently aliased Production deployment remains `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T` (`soulanova.com`, `www.soulanova.com`). The new Chair Yoga candidate Preview `https://soulanova-website-1dxt747ot-soulanova.vercel.app` is deployment `dpl_6wbZfHCD3e39gocLrdxoNW3RDrGe`, READY, `target:null`, branch-scoped, and built from commit `eb5e7ab62e8a0ef045352d2807cd33d80c2f0320`; no Production aliases were assigned. On the deployed Preview, the Chair Yoga page, narration drafts, and playback approval manifest returned HTTP 200. All six opening/closing audio URLs returned HTTP 200 as `audio/mpeg`, exposed MP3 ID3 signatures and `Accept-Ranges: bytes`, with content lengths matching the local manifest/source files. The deployment’s source is the exact commit whose local test suite verifies the source file hashes. These checks prove deployment and asset delivery, not interactive Safari playback or member authentication. These current facts do not substitute for a future staged-Production check or an exact-deployment owner acceptance.


### Candidate-specific Preview receipt

- Preview URL: `https://soulanova-website-1dxt747ot-soulanova.vercel.app`
- Deployment: `dpl_6wbZfHCD3e39gocLrdxoNW3RDrGe` · READY · `target:null`
- Branch/commit: `preview/chair-yoga-website-2026-11-12` / `eb5e7ab62e8a0ef045352d2807cd33d80c2f0320`
- Protected Vercel fetch: Chair Yoga route and both manifests HTTP 200; the Beginner reused opening, Intermediate/Advanced openings, and all three closings HTTP 200 with `audio/mpeg`, ID3, byte-range support, and manifest-matching content lengths.
- Interactive two-account/member playback test: not performed. No authenticated test account context was available; the owner must complete it before Production staging.
