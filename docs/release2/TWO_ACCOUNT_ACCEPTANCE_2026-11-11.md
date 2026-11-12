# Two existing-account Production acceptance — prepared November 11, 2026

**Release status: BLOCKED. Real member acceptance has started. Current performed results are in [TWO_ACCOUNT_LIVE_RESULTS_2026-11-11.md](TWO_ACCOUNT_LIVE_RESULTS_2026-11-11.md).**

- Runtime commit: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`
- Branch: `feature/soulfuel-clean-preview-2026-11-09`
- Protected Preview: https://soulanova-website-puw35yp2n-soulanova.vercel.app/app
- Deployment: `dpl_FSqMb2dYsxB7dS4DkMS2xm8RafKj`
- Existing Account A: `test1@soulanova.com`
- Existing Account B: `test2@soulanova.com`
- Unchanged Production/rollback: `dpl_A3N468HfccoSDiZvJhDgPJHmwB9T`

These are existing Soulanova accounts. Do not create replacements, reset passwords, modify authentication settings, or use the owner's personal member account. Enter credentials only in the normal browser sign-in/password-manager flow. Never send credentials or authentication codes to Codex. Do not export browser storage, cookies, session state, HAR files or request headers; do not photograph authentication screens.

## Recorded status

| Requested check | Status | Evidence / what is missing |
|---|---|---|
| 1. Account A signs in in an isolated browser session | PASS | Real normal-browser sign-in and verified SDK member identity. |
| 2. A SoulWalk Start → Finish → Save → persisted history | PASS | One real A-owned QA walk saved and survived reload; duplicate tap produced no extra row. |
| 3. A SoulFuel diary/goals and browser-local persistence | PASS | Real manual QA entry and goals survived reload in A profile. |
| 4. Logout removes private data from app access | NOT TESTED for direct URLs | Owner observed normal Overview navigation stayed on login after logout (PASS). Typed private routes remain untested; local erasure is not implemented. |
| 5. B signs in in a separate profile/context | PASS | Real B normal-browser sign-in and verified SDK member identity. |
| 6. B cannot view A's sessions, diary or goals | NOT TESTED for full scope | Prior direct server read probe passed; owner observed no A walking history/diary under B in the same window. Goals visibility and raw storage confidentiality were not reported. |
| 7. B creates its own test records | PASS | One real B-owned walking row and one B-profile local QA diary entry/goals saved. |
| 8. A cannot view B's data after switching back | NOT TESTED | Direct server read probe passed. Return-to-original-profile local checks remain pending. |
| 9a. Real page reload persistence | PASS | Both accounts' real server walks and profile-local nutrition survived reload. |
| 9b. Real logout / direct-route access | NOT TESTED | Requires the authenticated sessions. |
| 9c. Double-save / failed-save retry | PASS | Duplicate taps blocked. Real post-insert readback interruption recovered with one row after retry. |
| 9d. Genuine expired session | NOT TESTED | Logout, offline mode and mocked expiry are not equivalent to a genuinely expired session. |
| 10. Server versus browser storage documented | PASS — source inspection | SoulWalk uses member-owned Supabase rows; SoulFuel diary/goals use unencrypted per-member localStorage keys. This does not certify live privacy or cross-device sync. |

Read-only preconditions: latest deployment READY; unauthenticated access redirects to Vercel SSO; availability endpoint reports live FoodScore disabled; both Production domains remain on the rollback deployment. Historical 151/151 automated checks remain separate evidence, not live acceptance results.

## Setup and evidence rules

1. Use two **different browser profiles** (QA-A and QA-B) with independent storage. Two ordinary tabs, or two windows sharing one Incognito/Guest session, do not provide this isolation. New browser profiles are not new Soulanova member accounts.
2. Open the exact Preview origin above in each profile and complete Vercel Authentication directly. Then use **Soulanova member sign-in**; Vercel SSO does not sign into the member account.
3. In QA-A, sign into Account A; in QA-B, sign into Account B. Confirm the expected email in the Overview header. Stop if a different account is shown.
4. Choose a local run label such as `QA-1111-1530`. Only record the run label, PASS/FAIL/NOT TESTED, sanitized UI error text, counts and timing. Keep any previous goal values locally so they can be restored. No passwords, tokens, raw user objects or authentication screenshots belong in the report.
5. Use only the exact Preview origin throughout: localStorage belongs to an origin/profile. A different Preview hostname will not contain the same local diary.
6. Do not run a barcode lookup. FoodScore must remain paused. No Production promotion, environment change, password reset or database cleanup is part of this checklist.

## A — Account A walking and nutrition

1. QA-A → Overview → **SoulWalk**. Confirm GPS and optional browser voice are off. Choose Treadmill; this test does not require location permission, a watch or a physical treadmill.
2. Press **Start Walk**. Let approximately 65 seconds elapse. Press **Pause Walk** and verify the countdown holds for several seconds; press **Resume Walk** and verify it continues.
3. Press **Finish Walk** and confirm. The review must show actual elapsed duration and an early-finish state, not a completed 15-minute plan.
4. Enter test readings **111 steps** and **0.01 mi**. These are manual QA inputs, not imported health measurements. Press **Save completed walk** once. Wait for **Walk saved** / confirmed history. Record the visible history count before and after: exactly one new walk, actual short duration, correct manual readings.
5. Click Save again if possible; it should be disabled or have no additional effect. Reload. The same single walk must remain; a short walk must not count toward a full scheduled program session.
6. Back to Overview → **SoulFuel** → **Food Diary** / **Enter Manually**. Add `QA-<run>-A`, portion `QA serving`, meal Snack: **100 kcal, protein 5 g, carbs 10 g, fat 4 g**. These are explicitly manual test values. Press **Add to Daily Tracker** and require the readback-confirmed success message and one new entry.
7. Note prior Nutrition Goals locally, then set **2000 kcal, protein 100 g, carbs 250 g, fat 70 g** as QA reference values. Save. Reload the exact same Preview URL. The A entry and goals must remain and all four dials must reflect the actual saved values plus any pre-existing entries. Never assume an empty diary or overwrite existing entries.
8. Use Edit on only `QA-<run>-A`, change calories to **120**, save and reload. Require one edited entry, not two. Existing unrelated records must remain unchanged.

## B — Logout and independent Account B

1. QA-A → Back/Overview → **Sign out**. Confirm Not signed in / the sign-in form. Reopen `/app/walking` directly: member sign-in must be required before private history or save access. Reopen `/app/soulfuel`: A's diary/goals must not be displayed and saving must be disabled.
2. This is an **app-access** test. Local nutrition records intentionally remain on disk. Do not report storage erasure, encryption or secure shared-device privacy as PASS.
3. In QA-B, confirm Account B in the Overview header. Open SoulWalk: the new A walk must be absent. Existing B walks, if any, are not a failure and must be preserved.
4. Repeat the short walking flow as B with **222 steps, 0.02 mi**. Save once and reload: exactly one new B-owned history entry, no A test walk.
5. Open SoulFuel in QA-B. A's local entry/goals must be absent. Add `QA-<run>-B`, **200 kcal, protein 10 g, carbs 20 g, fat 8 g**, meal Snack. Set QA goals **2200 kcal, 110 g protein, 275 g carbs, 75 g fat**, after noting previous B values. Reload and confirm B's local entry/goals persist.

## C — Same-profile account switching (required)

Independent profiles alone cannot establish nutrition member namespacing.

1. Return to QA-A, currently signed out, and sign into **B** in that same profile. A's entry/goals must remain hidden. B's **server-side walking history from QA-B must load**.
2. B's **local diary/goals created in QA-B are not expected to sync into QA-A**. This is the current browser-only design, not a cloud-sync failure. The UI must not claim otherwise.
3. Add a distinct local B marker in QA-A: `QA-<run>-B-in-A-profile`, using the B nutrition values above; note/assign B QA goals in this profile.
4. Sign out B, then sign in **A in QA-A**. A's original edited 120 kcal marker and A goals must return; both B markers/goals must be absent. B's server walk must not appear in A history.
5. Sign out A and back into B in QA-A: only B-in-A-profile local marker/goals return. Repeat logout with a second tab open to a member page: private app views in that profile must clear and Save must become unavailable.

## D — Direct server read isolation (no token handling)

A filtered UI is not proof of row-level security. An owner/developer may run these console snippets on the Preview **Overview** using the already signed-in SDK. They never read or print session tokens. Do not inspect/print the SDK client, auth response, browser storage or network headers.

In QA-A **Overview**, install this temporary helper. It retains only one non-secret test-row ID in page memory; it never reads/prints session tokens, passwords or raw user objects:

```js
void (() => {
  let probeId = null;
  window.SoulanovaQA = Object.freeze({
    capture: async (expectedEmail, steps) => {
      const db = window.SoulanovaMemberAuth?.getClient();
      if (!db) { console.info('NOT TESTED: member client unavailable'); return; }
      const {data: auth, error: authError} = await db.auth.getUser();
      if (authError || auth.user?.email !== expectedEmail) {
        console.info('NOT TESTED: expected capture account is not verified'); return;
      }
      const {data, error} = await db.from('soulwalk_sessions')
        .select('id').eq('user_id', auth.user.id).eq('steps', steps)
        .order('created_at', {ascending: false}).limit(1);
      if (error || data?.length !== 1) {
        console.info('NOT TESTED: owned test walk could not be identified'); return;
      }
      probeId = data[0].id;
      console.info('READY: owned test-row probe captured without displaying identifiers');
    },
    check: async expectedEmail => {
      const db = window.SoulanovaMemberAuth?.getClient();
      if (!db || !probeId) { console.info('NOT TESTED: probe unavailable'); return; }
      const {data: auth, error: authError} = await db.auth.getUser();
      if (authError || auth.user?.email !== expectedEmail) {
        console.info('NOT TESTED: expected checking account is not verified'); return;
      }
      const {data, error} = await db.from('soulwalk_sessions')
        .select('id').eq('id', probeId).limit(1); // No user_id filter.
      console.info(error ? 'NOT TESTED: server read request failed'
        : data?.length === 0 ? 'PASS: other member cannot read the captured test walk'
        : 'FAIL: other member can read the captured test walk');
    },
    clear: () => { probeId = null; delete window.SoulanovaQA; }
  });
})();
```

1. While A is signed in, capture the new A row:

```js
void window.SoulanovaQA.capture('test1@soulanova.com', 111);
```

2. **Keep this Overview page loaded.** Click Sign out, then use the same page's member form to sign into B. Do not reload or navigate away. Run:

```js
void window.SoulanovaQA.check('test2@soulanova.com');
```

3. Still signed in as B, capture B's new server row:

```js
void window.SoulanovaQA.capture('test2@soulanova.com', 222);
```

4. Sign out B and sign into A in that same loaded Overview page. Run:

```js
void window.SoulanovaQA.check('test1@soulanova.com');
```

5. Require successful empty results in both directions. A failed network/auth request is **NOT TESTED**, not a privacy pass. If the page reloads, reinstall the helper and recapture under the correct owner; do not infer a result. Remove the transient helper when done:

```js
void window.SoulanovaQA.clear();
```

These are SELECT-only probes. They do not attempt cross-member inserts, policy changes or token access. If console pasting is disabled by the browser, do not change browser security settings to bypass it; leave direct-read probes NOT TESTED and use an owner-controlled developer test session instead.

## E — Retry and genuine expiry

### Save retries

1. In a verified test account, start/finish one additional short walk with a distinct reading (e.g. A: **113 steps**). Stay on that page to preserve its stable walk ID.
2. Temporarily choose **Offline** in browser DevTools Network, then Save. Require a failure/unconfirmed message; no false Walk saved message. Readings must remain while the same account session is still active. Never open/export request details, headers, payloads or a HAR.
3. Restore Online; retry **on the same page**, without Start New Walk or reload. Require one confirmed history row. Reload only after confirmation; still one new row.
4. Optional advanced interruption: interrupt the connection after the walk POST starts, then retry the same ID after reconnecting. Commit outcome may be unknown. Require exactly one row after confirmation; do not infer that the first attempt did or did not reach the server. If timing cannot be established safely, mark this subcase NOT TESTED. Its mocked counterpart is not a live pass.

### Genuine expired session

Do not edit/copy JWTs, change system time, reset passwords, revoke other sessions or alter project token lifetime.

1. Use only a test profile. Identify the project's existing token lifetime in its settings without changing it. If that cannot be determined securely, mark genuine expiry NOT TESTED.
2. In that profile only, use DevTools request blocking for `*dscbavbnlubfmfhudqwy.supabase.co/auth/v1/token*` to prevent automatic refresh. Do not open request headers/payloads. Keep the profile open past the configured lifetime since its last successful sign-in/refresh.
3. Attempt a manual diary save and a walking save. Require failed verification or reauthentication, no false success and no cross-account write. A timeout alone does not prove genuine expiry: the expiry interval must actually have elapsed.
4. Remove the blocking rule and restore Online. Reauthenticate directly if needed. Confirm no duplicate records and no unexpected saved entry. If the client signed out, private state may be cleared for privacy; do not claim draft recovery across a full logout.
5. Record genuine expiry as NOT TESTED unless the timing and authentication failure were actually observed. Logout/offline/mock tests cannot substitute for it.

## Storage/privacy and release blockers

| Area | Actual storage and limitation |
|---|---|
| SoulWalk | Existing Supabase `soulwalk_sessions`, owned by authenticated user ID. Read-only inspection confirmed RLS/ownership policies; live two-account acceptance above is still needed. No watch/HealthKit or automatic wearable steps are implemented on the website. |
| SoulFuel diary and goals | Unencrypted localStorage keys scoped by verified member ID **within one origin/profile**. Survives reload/logout; does not sync to another device/profile/Preview hostname. |
| Logout | Clears member app views/access; does not erase retained local nutrition records. Anyone with access to that browser profile can inspect localStorage outside the app. Per-member key names are not encryption or an OS/browser security boundary. |
| Health metrics | Also browser-local/unsynced; no new secure health cloud backend has been approved/deployed. |

Even if app-level isolation passes, **secure logout erasure/shared-device confidentiality is not established for browser-local nutrition/health storage**. Owner must explicitly accept the limited scope or authorize a reviewed secure storage design before claiming production-grade health-data privacy.

Strength retains five pinned playable masters, but no preserved 36-plan workout has approved video for every movement. Twelve historical clips still need exact-file final-master approval. Warm-up/cool-down and progress sync are unavailable. Current master URLs depend on the existing Production media paths; replacement Production needs verified hosting continuity. No unavailable clip may be substituted or counted complete.

Do not promote until live acceptance and the existing media/hosting/privacy/monitoring gates pass. FoodScore remains disabled. After testing, restore only goal values changed for QA and delete only clearly identified new local diary markers if desired. Do not delete pre-existing records, issue SQL cleanup, alter backend policies or remove server walk history. Leave a sanitized result matrix with exact Preview SHA, browser/viewport and PASS/FAIL/NOT TESTED; owner-performed results must be labeled owner-performed.
