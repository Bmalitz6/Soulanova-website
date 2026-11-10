# Member wellness dashboard — protected Preview review

## Scope and reuse

Base: `26f2c486b36b6536653092408d71187c94914184`, branch `feature/soulfuel-clean-preview-2026-11-09`. This change reuses the existing Supabase member session, authenticated workout-history read, member-local SoulFuel diary/goals, health-metric validation and tracker progress component. No profile, database, migration, credential, wearable integration or native app is created or changed.

The existing owned studio hero remains, with the owner-provided “Feel better. Live brighter.” heading. My Wellness Dashboard follows the hero; the eight-card Explore & Thrive grid follows the dashboard. SoulFuel appears once alongside the other programs and opens the existing Metrics / FoodScore & Food Diary / 75 Recipes landing page. Existing program routes and workout filtering are reused. No SoulWalk website/deep-link destination exists in this branch: its matching card honestly says Mobile app until the owner supplies an approved destination. Build 7 is untouched.

## Customization and truthful data

Default cards: Steps, Heart Rate, Calories Eaten, Protein, Carbs, Exercise Minutes. All twelve requested cards can be shown, hidden and reordered with labeled keyboard-operable controls. Restore defaults restores visibility/order without discarding personal goals. Preferences require member verification and exact storage readback, are isolated by member ID, and are browser-local and unsynced.

Nutrition totals reuse confirmed same-day diary entries and existing goals. Missing nutrients remain unknown; partial totals disclose missing entries. Calories are dietary calories eaten, never calories burned. Manual health records supply actual weight, calculated BMI, pulse, pressure and daily activity snapshots. A manual activity snapshot takes precedence over completed workout minutes to avoid overlap. Otherwise existing member-filtered saved workout history supplies exercise minutes. No wearable values are inferred. Distance and sleep remain unavailable because this checkout has no implemented source for them.

Existing manual/diary records have a date but no reliable update timestamp. Cards disclose the recorded date and “time not recorded”; workout timestamps are shown when present. No fake last-update time is generated. Cards clear on account changes, verification failures and sign-out. Read failures do not overwrite existing records. Existing workout write gates stay paused.

## Units and health storage

The visible U.S. / Metric selector is member-local and read back after saving. Canonical health records remain kg/cm. Exact conversions: 1 lb = 0.45359237 kg; 1 in = 2.54 cm. U.S. height uses feet plus inches; inches must be below 12, and both height components are required if height is supplied. BMI is derived only from validated weight and height as kg / m². Body circumference displays follow the selected units. Unit toggles preserve the canonical draft rather than repeatedly converting rounded display values. Existing records are neither migrated nor overwritten by changing units.

The existing consent step and verified non-anonymous member check remain required before every health write. Browser-local storage is unencrypted, unsynced and unsuitable as production-ready secure health storage. Member key separation protects normal application access, not an attacker with device/origin access. The demonstration remains explicitly labeled accordingly.

## Backend review and approval boundary

Repository inspection found the existing member authentication and member-filtered `workout_sessions` reader, but no authoritative health-table migration/RLS definitions. A read-only public REST schema request returned HTTP 401 and did not expose table/policy definitions. Live schema, RLS, encryption configuration and deletion behavior therefore remain unverified. No sensitive records were queried and no backend was changed.

Before cloud health storage, obtain separate owner approval and an authorized schema/policy review. Proposed requirements:

- A member-owned health-record model using the existing authenticated user ID, canonical units, source, measured date/time, consent version and audit timestamps. No duplicate member profile or anonymous writes.
- Enable RLS; restrict every SELECT/INSERT/UPDATE/DELETE to the authenticated owner, with both USING and WITH CHECK policies. Test cross-member denial and service-role isolation. Never put privileged keys in browser code.
- Verify transport and database/backup encryption, access controls, least privilege, logging/redaction and whether additional field encryption/key management is required for the intended jurisdiction and service.
- Explicit informed consent, collection purpose, retention period, member export/deletion, account-deletion handling, backup expiry and incident-response procedures. Decide what data is necessary before collecting it.
- No automatic upload of existing local measurements. Any future opt-in migration needs independent review, preview, deduplication, rollback and consent. Define shared-device sign-out/deletion behavior.

These are proposed requirements, not a claim of legal or security approval. No migration or new health backend is included in this release.

## FoodScore and validation

The API proxy, staging source, API compatibility correction, cache/rate-limit rules, 60/25/15 provisional formula, 75 recipes, photographs, tracker dials and existing diary persistence are unchanged. Measured portions remain necessary when OFF does not provide a serving; missing nutrition is not replaced with zero. Saving foods requires a real member session in addition to Vercel SSO; those protect different boundaries and anonymous saves remain forbidden.

Validation includes the full sequential Node/browser/security regression suite, mocked login → dashboard → SoulFuel → dashboard, member switching, customization/readback failures, actual fixture diary mapping, missing data, canonical conversions/BMI, repeated unit toggles, and keyboard/axe checks at desktop, 390px and 320px. Browser fixtures are disposable mocked identities; no owner's diary or live health records are written. Dashboard screenshots show honest no-data states. No live barcode lookup is necessary for these changes.

Release only this feature branch to an authenticated Preview, updating only its approved-commit gate. Recheck Production deployment/domains and Redis metadata before and after. Rollback by restoring the previous approved commit and Preview from the preceding release; never promote to Production.
