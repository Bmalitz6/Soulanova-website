# SoulWalk and SoulFuel tracking readiness follow-up

Date: 2026-11-02

This follow-up records the authenticated test evidence available after the approved
Meditation/dashboard production release. It supersedes the earlier note that
live authenticated browser sessions were unavailable. It does not approve tracking
writes for production.

## Two disposable SoulWalk rows

The authorized two-account test left exactly two test SoulWalk rows: one in each
account. The latest read-only history check observed one extra row per account
compared with its pre-test baseline. No production member data was otherwise
changed. The owner delete request for each row returned HTTP 403; both rows remain.

`SOULWALK_DISPOSABLE_CLEANUP_REVIEW_ONLY.sql` was inspected and not executed. It
lists exactly two row IDs and creation timestamps, and requires each row to match
the disposable test values (week 1, 0.1 minutes, zero distance, one step, web
source). Before deletion it aborts unless exactly two rows match. It checks that
the database role is superuser or has BYPASSRLS, deletes only those matched rows,
requires a delete count of exactly two, and aborts if either target remains. The
DO block is transactional. This is a privileged delete: confirm the intended
execution role and obtain separate explicit approval before running it.

## Authenticated evidence (two distinct existing test accounts)

No identifiers are included here.

- Each account read its own SoulWalk and workout history with HTTP 200; cross-account
  reads returned zero rows for `soulwalk_sessions`, `nutrition_entries`,
  `nutrition_goals`, and `workout_sessions`.
- Authenticated reads matched the two accounts' own history. The SoulWalk totals
  were 4 rows for one account and 1 for the other, including the two disposable
  test rows. SoulFuel showed 3 entries and 1 goal for one account, and 0 entries
  and 0 goals for the other. The displayed totals matched readable account data.
- Disposable inserts succeeded with HTTP 201. Nutrition entry and goal updates
  succeeded for their owners. Owner updates for SoulWalk and workout sessions
  returned HTTP 403. Owner deletes for nutrition entries/goals and the disposable
  workout rows succeeded; the two SoulWalk deletes returned HTTP 403.
- Cross-account update/delete attempts either returned HTTP 403 or HTTP 200 with
  zero affected rows. No cross-account data was returned or changed.
- Repeated nutrition-entry submissions returned HTTP 409 / `23505` in both
  accounts, with one row retained per idempotency key. The preview UI also passed
  its duplicate-submit and retry-identity checks.
- Account switching clears visible history immediately and ignores stale history
  responses. Existing read paths stay account-filtered.

## Release decision and next checks

- The production release keeps SoulWalk, SoulFuel, and progress database write
  gates closed. The published dashboard exposes no new walk or food-tracking
  routes. Meditation completion and workout completion do not issue database
  writes while those gates are closed.
- SoulWalk history reads and the 12-week timer/narration passed preview checks.
  Live insert/read persistence was demonstrated with the authorized disposable
  records, but the product Save flow remains disabled. Repeat-save idempotency
  should be verified end-to-end on the product flow before opening its gate.
- SoulFuel account reads and totals, owner diary/goal mutations on disposable rows,
  cross-account isolation, and duplicate rejection passed. Barcode success and
  error handling were tested without writing diary data. The production diary
  write gate remains closed until separate release approval.
- Do not add update/delete grants or RLS policies solely to make cleanup succeed.
  Current product read/write requirements do not need those operations. Keep
  both rows until the separate privileged-cleanup approval is granted.
- No schema, grants, RLS policies, member data, mobile app, or production tracking
  code were changed during this follow-up.
