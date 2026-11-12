# Real two-account acceptance — November 11, 2026

Runtime: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`
Preview: https://soulanova-website-puw35yp2n-soulanova.vercel.app/app

These results were performed against the real protected Preview and existing Account A/Account B. They are not mocked browser replays. No passwords, codes, cookies or tokens were inspected, exported or logged.

| Actual check | Outcome | Evidence |
|---|---|---|
| A verified login | **PASS** | Expected existing member verified through normal browser authentication. |
| B verified login | **PASS** | Expected existing member verified through normal browser authentication. |
| A walking controls/save/reload | **PASS** | One real member-owned QA walk saved, duplicate tap blocked and persisted after reload. |
| B walking controls/save/reload | **PASS** | One real member-owned QA walk saved, duplicate tap blocked and persisted after reload. |
| A real committed insert/readback failure/retry | **PASS** | Readback intentionally interrupted after insert; same-page retry confirmed exactly one new server row. No auth requests/headers were intercepted. |
| A direct server read of B QA walk | **PASS** | Authenticated request without a user_id filter returned zero rows. |
| B direct server read of A QA walk | **PASS** | Authenticated request without a user_id filter returned zero rows. |
| A local diary/goals/reload | **PASS** | Manual QA entry and goals survived reload in this profile; no cloud nutrition sync claimed. |
| B local diary/goals/reload | **PASS** | Manual QA entry and goals survived reload in this profile; no cloud nutrition sync claimed. |
| A logout/direct-route access | **NOT TESTED** | The bounded browser check did not complete or its assertion failed; no credentials or private error payload were recorded. |

## Owner-conducted manual acceptance (latest report)

These observations are **owner-observed**, not automated tests or new direct server-security proofs. The nine previously recorded automated live passes above remain unchanged.

| Owner observation | Outcome | Scope |
|---|---|---|
| After Account A logout, clicking Overview remained on the login page | **PASS — owner-observed** | Normal navigation protection |
| Account B in the same regular Chrome window showed no A walking history | **PASS — owner-observed** | Visible SoulWalk account isolation |
| Account B in the same regular Chrome window showed no A food diary | **PASS — owner-observed** | Visible SoulFuel diary isolation |

Logging out A and signing into B is the setup for these observations. No extra automated pass is claimed for that setup. The owner did not report a typed direct-route test, goals-switch check, raw browser-storage confidentiality test, or genuine expiry test; those remain NOT TESTED.

## Incomplete acceptance

- The combined Account A logout/direct-route check timed out and remains NOT TESTED. No privacy pass or confirmed privacy failure is inferred from that timeout.
- Same-window A → B visible walking/diary isolation now has the owner-observed PASS results above. Direct typed routes after logout, B logout, goals-switch visibility, B → A return, raw local-storage confidentiality and genuine expiry remain NOT TESTED.
- The owner now confirms both windows authenticated. The previous controller is no longer reachable; safe reconnection to the actual Preview windows was unavailable. No new live test, save or logout was performed in this continuation. Use `TWO_ACCOUNT_REMAINING_CHECKS_2026-11-11.md` in the existing windows; do not repeat the nine passed checks.

## Test-data footprint

- Three real QA walking rows were created: two under A (including the readback-failure/retry case) and one under B. Exactly one new row was confirmed per attempt; no server rows were deleted.
- One manual QA diary entry and QA nutrition goals were saved in each isolated browser profile. Goal baselines were held in the former test process. That process is no longer available; do not guess or overwrite baselines during continuation. No pre-existing diary entries were deleted.
- These writes used the existing member backend/local storage for the two explicitly authorized test accounts. No Production deployment, domain, environment, backend policy or unrelated member record was changed.

## Storage and release limits

SoulWalk rows are server-side and member-owned; real cross-account SELECT probes returned zero rows in both directions without applying a client user_id filter. SoulFuel diary/goals remain unencrypted browser-local data, scoped by member ID within each origin/profile. Reload persistence passed, but logout is not secure erasure and cross-device sync is not implemented.

Release remains blocked by the unfinished live cases, Strength media coverage/hosting continuity, browser-local privacy acceptance and other documented release gates. FoodScore was not activated or looked up.
