# Additive SoulFuel integration plan

Preview/audit branch: **preview/soulfuel-additive-audit**, based on production `0479dc67b1f3b348d9421b133b581f8a6e253cd8`. Existing completed implementation source: feature/soulfuel-foundation `56ff06a3c4eb4f6d1aa3596637986693fe3a8040`. **This branch contains audit documentation/evidence only. It does not claim a functional SoulFuel preview or authorize a production release.**

## Protected baseline

Keep current published member authentication, app/config.js, SoulSafe, existing lessons, meditation, recipes and the entire10-minute Foundations class. Pin current class HTML/player/timeline/media object IDs before implementation. Keep the six published recipe cards and all mobile recipes; never replace a recipe merely because another variant has a similar title. No native iOS/watch project changes or Expo regeneration in this work.

Do not merge or copy the whole feature tree onto main: it predates the published Foundations class and later production work. Leave existing dirty/staged mobile/watch/engine files and untracked assets untouched. Work only on an isolated main-based branch.

## Phase1 — backend verification before changes

1. Obtain read-only schema/policy/grant metadata for nutrition_goals,nutrition_entries and optional member_health_* tables through an authorized administrator path. Current anonymous limit0 requests already recognize all four tables and deny access. Do not infer missing schema from missing Git files.
2. Compare deployed columns/indexes/constraints/policies with the two existing SQL files. Record drift and applied migration history without querying member rows. Do not blindly rerun CREATE POLICY scripts or create parallel replacement tables.
3. Use a separate staging backend and two dedicated test accounts. Test anonymous denial, ownerCRUD, A-not-B reads/writes/deletes, session expiration, account change, boundary dates/timezones and invalid JSON. No write tests against production member data.
4. Prepare only necessary versioned additive migrations after comparison: nutrient JSON numeric/type/range validation, submission identity/idempotency, and timestamp consistency. Preserve existing rows and IDs. Do not drop/recreate tables or reset the project.

**Gate:** installed schema and row isolation verified, test backend identified, no new secret/service-role key in web/mobile source. RLS must enforce authorization regardless of frontend filtering.

## Phase2 — reuse the completed web module in a functional preview

Allowlisted reuse roots from the pinned feature commit:

- app/soulfuel/index.html
- app/soulfuel/soulfuel.css
- app/soulfuel/soulfuel.js
- app/soulfuel/scan/index.html
- app/soulfuel/scan/scan.js

Copy these exact existing files into the isolated branch, then apply small reviewable fixes only where this audit identified gaps. Do not rebuild forms, recipe cards, portion conversion, macro math, frequent-foods logic or date history.

-Add an in-flight submit guard plus stable submission ID/retry semantics; reuse current database IDs where possible. Test delayed failures and rapid taps. Preserve the existing sequential barcode-save guard and visible macro review.
-Subscribe to auth lifecycle changes and clear cached food/goal data on sign-out or account changes. Reuse the existing member sign-in entry point/client configuration. Do not replace the published auth form, reset-password flow, redirect URLs or credentials as part of this audit.
-Validate restored/form data consistently. Keep consumed-portion nutrient semantics, compatible-unit conversion and unknown-value omission; do not multiply already consumed totals by quantity again.
-Display a read-only daily macro summary independently of whether goals exist, then keep optional goal progress separately. Distinguish unknown values from0 and minimum/maximum/target goal meaning.
-Keep existing daily history and frequent-food reuse. Add entry editing/pagination/trends only when explicitly included in the next scope; do not hide that these are currently absent.
-Use fixture mode or the verified staging configuration in preview. Do not test saves on the production Supabase project. Real barcode/camera/API failure paths need dedicated device testing.

**Gate:** functional preview route works with a test account; backend, date/history, duplicate prevention and unknown/units behavior pass. No published code overwritten.

## Phase3 — additive website navigation and recipe reuse

Add a narrow SoulFuel link/card to the current main version of app/index.html after the module passes its gates. Preserve all existing class cards, the Foundations route/media and member authentication. Do not restore app/index.html from the feature branch.

Initially link/reuse the existing six recipe cards as recipe inspiration. Preserve three mobile recipe variants as separate content/provenance. A future shared recipe catalog may extract approved data without rewriting existing display behavior; stable IDs, verified ingredient quantities and serving yields are required before computing nutrition or adding “log recipe.” No invented calorie estimates.

My Health is optional and separate. Only add app/health/* plus its reviewed schema if that feature is explicitly included and independently passes privacy/ownership validation. Do not expand initial SoulFuel release to unfinished HealthKit/device synchronization.

## Phase4 — mobile integration, preserving the local diary

Reuse SoulFuelScreen.tsx and its existing lookup/recipes/meal UI. Add a small typed data adapter to the existing nutrition_entries/nutrition_goals contract rather than another backend. Keep native app behavior, signing/watch targets, SoulWalk and SoulSafe intact.

-Do not delete the legacy soulanova-soulfuel-diary-v1 key. Validate and safely back up/read it before any write; handle read/JSON errors without replacing it with an empty array.
-Account association must be explicit for existing device entries. Offer a one-time user-confirmed import and record provenance/old ID→new UUID mapping to prevent duplicate imports. Retain raw legacy content until reconciliation is verified.
-Map mobile capitalized meal labels to schema enums; preserve day/timezone semantics. Do not invent a precise consumed_at for day-only legacy records without an explicit import convention/provenance.
-Reconcile mobile portion strings/implicit1portion and0-vs-unknown macros with web fields. Never silently discard portions or turn unknown values into measured zeros.
-Add prior-day browsing additively, then validate same-account web/mobile totals and separate-account isolation on staging. Offline/retry conflict behavior requires an explicit policy.

**Gate:** no legacy data loss, account isolation/import idempotency and cross-device totals verified. No Expo/native regeneration or production nutrition migration is authorized by this plan.

## Phase5 — review and release gates

1. Review a narrow diff: reused SoulFuel files, targeted fixes, minimal new navigation, and only justified migrations. Existing auth/class/video assets must match baseline hashes except explicitly reviewed additive navigation.
2. Verify live600s Foundations page/media/audio, all existing lessons, sign-in/sign-out/reset flow, nutritionCRUD, prior days, unit math, retry/duplicate behavior, offline errors, mobile layout and camera fallback in the preview/staging environment. Use synthetic test data, not member records.
3. Run TypeScript and appropriate syntax/behavior checks; document unavailable lint rather than installing tooling or changing completed app work merely for the audit.
4. Present the verified functional preview, schema diff and validation receipts for review. **No production merge/deployment or database changes as part of this audit.** A separate release decision follows verification and approval.

## Current preview branch contents

Only docs/soulfuel audit/plan/evidence files. Production application files are byte-identical to the pinned main tree. Pushing this branch may create an ordinary Vercel preview of the unchanged website, not a new SoulFuel implementation. No Vercel production deployment is requested.
