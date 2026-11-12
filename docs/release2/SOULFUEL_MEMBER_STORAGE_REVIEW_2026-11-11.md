# SoulFuel member-linked persistence review — November 11

**Baseline read-only review, followed below by an implemented but inactive candidate adapter. No backend/table/policy changes, imports or member-data writes were performed.** Baseline website commit: `4d7a0f49e72c826aefb27a95ccebf2228f975e57`.

## Current browser behavior

The website diary and goals use `soulanova-foodscore-diary-v1:<member-id>` and `soulanova-food-diary-goals-v1:<member-id>`. Reads/writes use a verified member and account-switch guards, and local writes require readback. The owner observed no A diary in B's app view after switching accounts in the same regular Chrome window.

That is visible app isolation, not confidential storage. The original records remain unencrypted in the browser profile after logout. Someone controlling that profile, or script executing on the same origin, can read the retained nutrition keys independently of the app's selected account. Different profiles/devices/Preview origins do not share these records. Logging out is not erasure; hiding records is not encryption. A live raw-storage probe has not been performed and is not recorded as an automated failure/pass.

## Existing backend — verified read-only

Schema and policy metadata were inspected without reading personal rows:

| Existing table | Relevant contract |
|---|---|
| `nutrition_entries` | UUID `id`, `user_id` → existing Auth user, `consumed_at`, `meal_type`, `food_name`, positive `quantity`, `serving_description`, JSONB `nutrients`, `source`, nullable `barcode`, `created_at` |
| `nutrition_goals` | UUID `id`, `user_id`, `nutrient_key`, `display_name`, `unit`, `goal_type`, `target_value`, `enabled`, `updated_at`; unique `(user_id, nutrient_key)` |
| `member_health_profiles` | Existing member `user_id`, optional `birth_date` and `height_cm`; no reason to create a duplicate member profile or start collecting birth dates for this website |
| `member_health_measurements` | UUID `id`, `user_id`, `measured_at`, `metric_key`, numeric `value`, `created_at`; does not by itself establish a safe mapping for paired blood pressure or every browser metric |

All four tables have RLS enabled. Authenticated SELECT/INSERT/UPDATE/DELETE grants exist, with ownership predicates based on `auth.uid() = user_id`; UPDATE has both existing-row and resulting-row checks. The unauthenticated database role has no SELECT/INSERT privilege on these tables. These are **static metadata findings**, not new live CRUD/isolation test results. No backend nutrition save was exercised.

Use these existing tables as the first integration candidate. Do not provision a duplicate database or assume that the web's paused generic write flag has already integrated them.

Supabase's guidance distinguishes row visibility from resulting-row validation and requires operation-specific authorization. [Official RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

One authorization decision remains: the `anon` database role is different from an anonymous Supabase Auth user, which can use the `authenticated` role. The inspected policies enforce ownership but do not explicitly test `is_anonymous`; current website code rejects anonymous Auth users. Verify whether anonymous sign-in is enabled and, if needed, add a reviewed permanent-member restriction server-side before health/nutrition activation. No Auth setting or policy was changed. [Official anonymous Auth guidance](https://supabase.com/docs/guides/auth/auth-anonymous).

## Mapping decisions before implementation

- **Stable IDs:** Browser entry IDs are strings such as `manual:...` and `foodscore:...`; the existing database requires UUIDs. Assign a stable client UUID once and preserve an explicit legacy-ID/import mapping. Never generate a new UUID on every retry. If a server-side import-id uniqueness field is needed, prepare its migration separately for approval.
- **Dates and portions:** Map the local diary day and actual consumed timestamp deliberately. Preserve the member's date/time zone. Keep the portion description and already-scaled nutrient totals; do not silently assume grams or multiply the totals a second time. Backend quantity must be positive; its meaning must be documented.
- **Meals/source:** Whitelist the existing lowercase meal types (`breakfast`, `lunch`, `dinner`, `snack`) and source values (`manual`, `barcode`, `custom`). Current UI labels need explicit mapping. A member-confirmed value is not automatically independently verified nutrition.
- **Nutrients:** Preserve units and null/unknown values; never fill missing fields with zero. The existing JSONB constraint checks only that nutrients form an object, so the approved adapter/server contract needs key, numeric, unit and range validation matching the existing product rules.
- **Goals:** Reuse `(user_id, nutrient_key)` uniqueness and the existing supported units. Read only enabled goals. An unset goal must remain unset, not a made-up zero target. Decide whether clearing a goal deletes the owned row or disables it; include that operation in authorization/readback tests.
- **Provenance:** The table lacks dedicated fields for all current score/version/source URL/confirmation disclosures. Keep staging barcode entries labeled as test data. Do not silently import them as Production nutrition. Decide approved minimal provenance storage rather than placing whole upstream product records in the nutrients object. FoodScore stays off.
- **Health:** Reconcile multi-value measurements, consent and units before connecting health tables. BMI remains derived from validated height/weight. Do not automatically split paired readings or import browser health records without an approved model and consent.

## Proposed member-scoped integration

1. Reuse the existing verified Supabase member identity and authentication flow. No duplicate profile, fabricated ID, anonymous write or service-role key in browser code.
2. Use the existing RLS-protected member tables through an approved adapter. Verify the expected member before each mutation and discard stale responses when the account changes. Server ownership enforcement must remain effective even if a client filter is omitted or altered.
3. Use stable UUIDs, bounded requests, duplicate-conflict recovery and authoritative member-scoped readback. Announce Saved only when persisted values match the reviewed entry. Preserve a recoverable draft on an unconfirmed save; prevent a result from one account applying to the next account.
4. Keep sensitive working data in memory while signed in. Clear it on logout/account change; exclude personal responses from shared HTTP/service-worker caches. Do not persist a plaintext health cache by default. Do not remove or inspect authentication storage as part of nutrition cleanup.
5. Present any local-to-account import as an explicit member action with a count/preview and versioned consent. Import only the verified current member's known nutrition keys. Preserve existing cloud records, local records, missing values and recipe content. Confirm server readback and reconciliation before offering removal of old local copies; never silently migrate all browser members.
6. Verify provider encryption/access controls and backups rather than claiming RLS alone supplies encryption or regulatory approval. Decide consent version, retention period, member export/deletion behavior, privileged-access logging and backup/log retention. No dedicated consent/retention public table was found by the bounded name-based metadata query; this does not prove there is no consent mechanism elsewhere. Marketing consent is not a substitute for a reviewed health-data purpose.

## Required approval and validation

Owner approval is needed for the member-storage scope, consent/retention decisions, legacy mapping/provenance contract and any schema changes. Reusing existing tables still does not authorize Production activation or automatic migration.

After an approved Preview-only adapter is implemented, test the **new nutrition backend contract** with the two existing accounts: owned create/read/update/delete, cross-member reads and mutations denied, anonymous/expired sessions denied, UUID retries producing one record, null nutrients, goal clearing, offline/unconfirmed saves, logout/cache cleanup and same-account cross-profile server persistence. These are new integration checks; the already-passed walking/visible UI checks do not need repetition.

No claim of secure cloud nutrition/health synchronization should appear until that implementation and acceptance pass. Until then keep the current explicit browser-local/unsynced disclosure and leave Production staging blocked on the agreed privacy scope.

## Candidate adapter implemented — live integration remains closed

`app/soulfuel/member-storage.mjs` targets the inspected existing tables without any migration or policy change. It is deliberately **not connected to the live diary UI** and defaults to refusing every write before issuing a database request. Existing local diary/goals behavior is unchanged. The existing Supabase project is shared with Production; no real nutrition CRUD, health-data collection or migration was performed. A future activation requires an isolated backend or explicit authorization for the shared project and the remaining privacy decisions.

The adapter supports authenticated member-owned list/create/edit/delete and six existing goal keys. Every query re-verifies a non-anonymous member before and after the operation, includes member filters, validates returned ownership, and aborts/invalidates pending work on explicit account invalidation. Server RLS remains essential: client filters are not a substitute for policy enforcement. Stable IDs plus readback make retries idempotent; errors never report success without matching persisted values. Offline/unconfirmed requests retain the original caller's local data. Concurrent mutations are rejected. Goal clearing disables a known goal while preserving its target and unrelated goal records.

Mapping: only reviewed manual, user-supplied entries; nutrition quantities represent one already-reviewed portion, with missing fields retained as null. Staging barcode products are rejected. Existing date-only records require an explicitly confirmed consumption timestamp and time zone matching their saved day; no meal time is fabricated. Legacy IDs receive deterministic member-linked UUIDs. Existing UUIDs are retained. Existing incompatible server rows cause a review error rather than guessed values.

Explicit migration path: (1) separately approve data purpose/retention/deletion/export, backend environment and release; (2) authenticate the current member; (3) review eligible manual entries, portion/unit contract and each missing meal time; (4) create an immutable, member-bound import preview; (5) explicitly accept the versioned consent and exact plan fingerprint; (6) insert with stable IDs and confirm owned readback, then reconcile goals without overwriting conflicting cloud targets; (7) report any partial failure and retry the same plan; (8) retain all original local records. Removal of local copies is a separate future consented action, not implemented here. No automatic upload/deletion occurs.

Fixture tests cover CRUD/readback, duplicate retry, ownership/account switch, anonymous/expired authentication, offline and denied saves, missing nutrients, units, goal clearing, exact-plan consent, partial import retry and default-off behavior. They are **mock tests, not real Supabase nutrition RLS proofs**. New real two-account nutrition CRUD/mutation-denial acceptance is still required once live integration is authorized. The existing nine live passes and three manual observations remain unchanged.

Retention: current browser records persist until explicitly deleted/website storage cleared; logout hides but does not erase or encrypt them. The new visible diary disclosure states this limitation and shared-device risk. Adapter execution does not write a new browser cache, analytics, log record or consent database. Cloud retention, backup expiry, export, deletion verification, privileged access and consent recording remain owner decisions. No assertion of regulatory compliance or secure cross-device storage is made.
