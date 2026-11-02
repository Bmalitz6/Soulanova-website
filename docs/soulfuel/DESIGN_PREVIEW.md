# Homepage, account navigation and SoulFuel preview

Preview branch: `preview/soulfuel-home-auth-design`. Based on website main
`0479dc67b1f3b348d9421b133b581f8a6e253cd8` (published Foundations class).
No production deployment or Supabase configuration/data change is authorized by this preview.

## Reused completed work

- Reused the earlier separate login/signup destination and styling commits
  `95adc228` and `d59ff92d` from `feature/soulfuel-foundation`.
- Audited earlier workout design work (`65f875a`, `9cf3353`, `8b2c8ef`):
  its seven category photos are already present on main. They remain unchanged.
- Reused the existing approved studio instructor branding image as a resized,
  uncropped WebP derivative. Asset provenance is in `DESIGN_ASSETS.json`.
- Retained all existing homepage sections. Added coherent typography, spacing,
  full-frame instructor presentation, category cards, and ingredient illustrations.
  No replacement instructor, external stock image or AI-generated image is used.
- Three expandable recipe previews reproduce existing member recipe content.
  The six member recipes and nutrition values are unchanged. No approved food
  photography was found, so the preview uses original SVG ingredient illustrations.
- Also found the existing 75-recipe Mediterranean library outside the repositories.
  It is preserved. Its editorial/source-permission flags and inconsistent/missing
  nutrition panels must be reviewed before a separate additive import.

## Account behavior

Log In and Join Free remain visible next to each other on desktop and mobile,
including the 320px layout. They route to `/app/?mode=signin` and
`/app/?mode=signup`. The existing Supabase auth implementation and configuration
are byte-identical to main. A small independent navigation helper opens the
requested existing member tab only after the existing auth gate opens.

Fixture tests exercise the existing registration, validation, email-confirmation
state, invalid/successful login, persisted session, signout and recovery code.
They do not create users, send emails or write production data. Real-account
login and email-confirmation delivery still require the owner's preview review;
preview callback allowlisting must be checked before that test. Passwords must
not be sent in chat or committed.

## SoulFuel boundary

`/previews/soulfuel/` reuses the completed diary/goals UI from pinned feature commit
`56ff06a3c4eb4f6d1aa3596637986693fe3a8040`. It is visibly labeled sample data.
Its local in-memory adapter has no Supabase client, credentials, network calls or
persistent member data. Refresh resets it. Manual submit has an in-flight guard
against duplicate entries. Barcode lookup uses the existing public food lookup
only when requested. This is an integration/design preview, not a live account
nutrition service. Authenticated schema/RLS tests and the staged rollout in
`INTEGRATION_PLAN.md` remain prerequisites for live nutrition integration.

## Validation

112 browser checks passed locally: 23 desktop and 25 mobile design/auth/sample
checks; three additional viewport checks (320, 768, 1024px); 32 desktop and
29 mobile Foundations playback checks. These include navigation, recipe expansion,
no horizontal overflow, real 600-second media playback through completion,
nonzero audio at sampled narration positions, desktop/mobile playlist behavior,
countdown/completion/replay, media range responses, and preserved lesson links.
Screenshots were visually reviewed. Browser QA used auth fixtures only.

Byte preservation verified for existing auth/config, recipes, class/player files,
lesson media, other published pages and Vercel routing. The member HTML differs
only by the navigation-helper script include. No source masters, video content,
Supabase settings or mobile/native app files are changed by this branch.

Mobile TypeScript check passes. The mobile package has no `lint` script, so
`npm run lint` cannot run; no dependency changes were introduced to add one.
The static website has no package/build/lint script. JavaScript syntax checks
and `git diff --check` pass.

## Review before promotion

1. Review homepage and sample SoulFuel at desktop/mobile widths.
2. Use an existing test account to verify real login, persisted session, signout
   and confirmation/recovery redirects, without changing production settings.
3. Review Foundations playback/audio and the preserved lesson library.
4. Approve imagery and the sample-only SoulFuel scope. Live SoulFuel integration
   follows the separate schema/auth/RLS plan.
5. Only after explicit approval, merge/deploy production through the existing
   workflow. This preview branch does not authorize that action.
