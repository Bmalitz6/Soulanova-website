# Remaining two-account acceptance — existing signed-in windows

> Update: the owner has now reported PASS for normal Overview navigation after logout and same-window walking/diary visible isolation. Preserve those observations separately. Use the current [Production readiness report](WEBSITE_PRODUCTION_READINESS_2026-11-11.md) for only the outstanding typed-route checks; do not repeat completed successful steps.

Runtime: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`
Preview: https://soulanova-website-puw35yp2n-soulanova.vercel.app/app

**The nine previously performed PASS results are preserved. No additional walks or repeated save tests are required.**

## Current continuation status

The owner confirms A and B are authenticated. The previous local controller is no longer running. The available loopback Chrome debug connection contains no tabs for this Preview, and Apple Events JavaScript execution is disabled in the existing windows. Neither browser security settings nor credential storage was changed/read to work around this.

| Remaining check | Current outcome |
|---|---|
| Independently reverify identities in the current windows | NOT TESTED — owner-confirmed only; control unavailable |
| Complete A logout verification | NOT TESTED |
| Signed-out private pages and controls | NOT TESTED |
| A → B switching in the same profile | PASS — owner-observed operation; visible isolation observations are separate |
| A walking/diary app data hidden after switching to B | PASS — owner-observed visible behavior; goals/raw storage not certified |
| Readability of retained A local nutrition data under B | NOT TESTED live; unencrypted retention is established in source |
| Genuine session expiry | NOT TESTED |

The prior combined logout timeout remains NOT TESTED, not a privacy pass or a confirmed product failure. Existing results: [TWO_ACCOUNT_LIVE_RESULTS_2026-11-11.md](TWO_ACCOUNT_LIVE_RESULTS_2026-11-11.md).

## Exact remaining manual sequence

Use the existing A window/profile. Leave the separate B window available. Do not create replacement accounts or reset passwords. Enter sign-in details only through the normal browser form/password manager. Do not share credentials, screenshots of authentication/storage, cookies, tokens, request headers or HAR files.

1. On **Overview**, confirm the header displays `test1@soulanova.com`. Confirm the separate B window displays `test2@soulanova.com`. Record this as owner-performed, not agent-verified.
2. In A's profile, open SoulFuel in another tab on the **same exact Preview origin**. Locate the existing `QA-mwcq4jt9-A` diary entry and the previously saved A goals. Do not save another entry or change goals. If the marker is absent, mark original-profile continuity NOT TESTED; do not infer data loss when a different profile/temporary context may be in use.
3. In the original A **Overview** tab, optionally install the privacy-only helper below and call `captureA()`. It reads only the two known nutrition keys, never authentication storage, and prints no entry contents or identifiers. Keep this Overview tab loaded; the helper is page-local.
4. Click **Sign out** in that Overview tab. Require `Not signed in`, the member sign-in form, and no member dashboard. If using the helper, call `signedOut()` and record its outcome.
5. In **new tabs in the same profile**, open `/app/walking` and `/app/soulfuel` on the Preview origin. Require no private history/diary/goals and disabled walking start/save and nutrition save controls, or a member sign-in page. A redirect is not required if the page correctly blocks access. A visible private record or usable unauthorized save is FAIL. Close only these diagnostic tabs when finished.
6. Return to the original Overview tab and sign in directly as **B**. Require `test2@soulanova.com` in the header. If using the helper, call `retainedUnderB()`.
7. Open SoulFuel in another tab in that same profile. The A marker and A goals must not appear in B's app view. Record app-level isolation PASS only if actually observed. Do not expect B's local diary from the other browser profile to sync here.
8. Sign out B in the original Overview tab and sign back into A directly. Reopen SoulFuel in another tab. Require the original A entry/goals to return, with no B data exposed. No new entries, goals or walks need to be created.
9. Clear the temporary helper with `clear()` if installed. Leave the existing data intact. Do not guess or overwrite prior goal values; restoration requires the actual baseline, which was held in the former controller's memory and is not available to the current continuation.

### Optional token-free privacy helper

Run only in the Preview's **Overview** tab as described above. If console pasting is blocked, do not disable browser security settings; leave these helper checks NOT TESTED. Browser UI checks can still be performed.

```js
void (() => {
  let diaryKey = null;
  let goalsKey = null;
  const marker = 'QA-mwcq4jt9-A';
  const client = () => window.SoulanovaMemberAuth?.getClient();
  window.SoulanovaRemainingQA = Object.freeze({
    captureA: async () => {
      const db = client();
      if (!db) { console.info('NOT TESTED: member client unavailable'); return; }
      const {data, error} = await db.auth.getUser();
      if (error || data.user?.email !== 'test1@soulanova.com' || data.user?.is_anonymous) {
        console.info('NOT TESTED: Account A is not verified'); return;
      }
      const key = 'soulanova-foodscore-diary-v1:' + data.user.id;
      try {
        const rows = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(rows) || !rows.some(row => row.name === marker)) {
          console.info('NOT TESTED: original A QA entry is absent in this profile'); return;
        }
        diaryKey = key;
        goalsKey = 'soulanova-food-diary-goals-v1:' + data.user.id;
        console.info('READY: original A nutrition keys captured privately in page memory');
      } catch { console.info('NOT TESTED: nutrition storage could not be checked'); }
    },
    signedOut: async () => {
      const db = client();
      if (!db) { console.info('NOT TESTED: member client unavailable'); return; }
      const {data, error} = await db.auth.getUser();
      if (error && error.name !== 'AuthSessionMissingError') {
        console.info('NOT TESTED: authentication check failed'); return;
      }
      console.info(!data?.user
        ? 'PASS: no authenticated member after logout'
        : 'FAIL: authenticated member remains after logout');
    },
    retainedUnderB: async () => {
      const db = client();
      if (!db || !diaryKey) { console.info('NOT TESTED: original A probe unavailable'); return; }
      const {data, error} = await db.auth.getUser();
      if (error || data.user?.email !== 'test2@soulanova.com' || data.user?.is_anonymous) {
        console.info('NOT TESTED: Account B is not verified'); return;
      }
      try {
        const rows = JSON.parse(localStorage.getItem(diaryKey) || '[]');
        const readable = Array.isArray(rows) && rows.some(row => row.name === marker);
        const goalsRetained = goalsKey && localStorage.getItem(goalsKey) !== null;
        console.info(readable
          ? 'FAIL: shared-profile storage confidentiality — A QA entry is readable while B is signed in'
          : 'NOT TESTED: captured A record is no longer present; continuity needs checking');
        console.info(goalsRetained
          ? 'LIMITATION CONFIRMED: A goals remain in browser storage'
          : 'A goals key not present at this check');
      } catch { console.info('NOT TESTED: retained nutrition storage could not be checked'); }
    },
    clear: () => { diaryKey = null; goalsKey = null; delete window.SoulanovaRemainingQA; }
  });
})();
```

Invoke only the applicable method at each stage:

```js
void window.SoulanovaRemainingQA.captureA(); // A signed in, before logout
```

```js
void window.SoulanovaRemainingQA.signedOut(); // After A signs out
```

```js
void window.SoulanovaRemainingQA.retainedUnderB(); // B signed in, same loaded tab
```

```js
void window.SoulanovaRemainingQA.clear(); // Finished
```

An app-view isolation PASS and a storage-confidentiality FAIL can both be correct. Per-member localStorage keys prevent ordinary cross-account app display; they do not encrypt records or prevent someone controlling the shared browser profile from reading them. None of these snippets access cookie/token/session keys or display nutrition contents.

## Genuine expiry

Leave NOT TESTED unless actual expiration is observed safely. Do not edit/copy JWTs, change the computer clock, shorten Production token lifetimes, reset passwords or revoke other users' sessions. Offline mode, normal logout and the already-passed readback failure are not expiry tests. An owner-controlled test may prevent refresh only in the QA browser and wait past the existing configured lifetime, then confirm authenticated saves fail closed; see the prior manual plan. Do not create another walk merely to simulate expiry. If this cannot be completed safely now, keep it NOT TESTED.

## Production blockers and fixes

- Complete the remaining actual logout/switching/expiry checks, clearly labeling owner-performed versus agent-performed outcomes.
- For secure shared-device nutrition/health privacy, use a separately approved member-owned storage design with server authorization and reviewed consent, retention and deletion behavior. The existing unencrypted browser-only scope cannot be described as secure cross-device storage or logout erasure. Do not introduce a backend migration without owner approval.
- Strength still has only five pinned playable masters; the 36 plans do not have full approved video coverage. Resolve exact-file media approval or approve an explicitly limited scope. No pending video may be substituted.
- Verify durable Strength media hosting before replacing Production; current master URLs depend on existing Production paths.
- Keep FoodScore disabled, preserve Production/rollback and finish the existing monitoring/access-model release gates. No promotion is authorized by incomplete acceptance.
