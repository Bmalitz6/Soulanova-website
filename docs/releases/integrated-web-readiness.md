# Integrated website release readiness

Base: production main `0a0e24a12694763c4a7742cea0c7c35bed021144`.
Preview branch: `preview/integrated-web-readiness`.
This branch is not authorized for wholesale production deployment.

## Component decisions

| Component | Evidence / changes | Release decision |
| --- | --- | --- |
| Landing page and account navigation | Nine-file selective release from approved `6c0a8d2`; production commit `0a0e24a`; Log In `/app/?mode=signin`, Join Free `/app/?mode=signup`; no demo routes copied | Approved and published separately |
| SoulWalk | Reused existing 12-week program, five recorded pace cues and history UI from feature commit `56ff06a`. Fixed renderer querying history `.week` cards without buttons; saving guard, timeout/finally, stable retry UUID, account-change clearing and stale-response protection | Preview only. Authenticated database persistence and two-account RLS not certified |
| Guided meditation | Existing 17 voice files and three ocean tracks, exact 600/1200-second metadata; preserved audio bytes. Fixed ocean-gain reset, pending playback cancellation, error cleanup, signout stop and independent-control descriptions | Browser QA passed; changes await user approval. Existing production library retained |
| SoulFuel | Reused feature's real authenticated diary, optional goals, macros, history, frequent foods and barcode lookup. Kept six existing member recipes and homepage previews. Added manual/barcode in-flight guards, stable retry UUIDs, bounded requests, account-change clearing and stale-response guards | Preview only. Live tracking/write gates remain closed |
| Tai Chi and other lessons | All original media, class/player files and published links unchanged | Existing publication preserved |

## Preview entry points

- `/app/release-preview/`: entry to the polished authenticated member dashboard.
- `/app/?mode=signin` and `/app/?mode=signup`: existing Supabase auth/session handling.
- `/app/walking/`: existing 12-week walking journey and personal history.
- `/app/?mode=signin#meditation`: existing guided library.
- `/app/soulfuel/` and `/app/soulfuel/scan/`: existing nutrition implementation.
- `/app/?mode=signin#free-library`: existing recipes and lessons.
- `/app/classes/beginner-tai-chi-foundations`: preserved published class.

No sample adapter, sample diary, fake nutrition results, accounts or runtime test
fixtures are shipped. The existing Supabase public configuration and sign-in/signup/recovery handlers
are unchanged. `app/member-data.mjs` closes all new walking/nutrition mutation
paths by default. Gates cannot be enabled with URL parameters or local storage.
Browser tests temporarily intercept the helper only in an isolated fixture page;
this is not evidence of live database authorization.

## Verification evidence and limits

- 52 focused desktop/mobile checks: walking timer/pause/completion, duplicate Save,
  persistent history across page reload with a fixture backend, immediate account
  clearing, delayed stale responses, signout, hung auth timeout, ambiguous-save
  retries with the same UUID, nutrition and barcode duplicates and closed gates.
- 62 desktop/mobile meditation checks: all 17 voice/ocean pairs load with correct
  durations; real audio plays, pause/resume, independent mute/volume, stop during
  pending playback, session-switch gain consistency, completion once and signout.
- Existing landing/auth regression checks and published Tai Chi playback retained.
  Account operations use fixtures; no accounts or database rows were created.
- Read-only live anonymous checks on `soulwalk_sessions`, `nutrition_goals` and
  `nutrition_entries` return HTTP401 / PostgreSQL42501. This proves anonymous
  access is denied, not that authenticated grants or all RLS policies are correct.
- Existing SQL files on the feature branch describe owner SELECT/INSERT/UPDATE/
  DELETE policies and authenticated grants. They have NOT been executed or assumed
  to match the live schema. No database administration connector is available.
- Source preservation compares all existing files to production; member
  HTML/navigation, scoped progress rendering/requests and meditation lifecycle change in preview.
  All auth/config, homepage styling, videos, audio and other pages remain unchanged.
- Browser fixtures persist only test rows under a dedicated local test key; they
  are not included in this branch. Real HealthKit/GPS/background mobile reliability
  is outside this static website scope. The existing browser GPS limitations remain.

## Required before opening writes

1. Owner signs in with existing test accounts (no passwords/tokens in chat).
2. Authorized read-only database inspection confirms live columns, constraints,
   grants, RLS enabled and all owner policies, including INSERT/UPDATE checks.
3. Verify own-account history, second-account isolation, signout, refresh and
   cross-device persistence. An empty result alone is not proof of isolation.
4. Any write-based acceptance test requires explicit authorization for disposable
   test records and cleanup; none has been performed under this no-data-change task.
5. Review and approve each component individually. Only then open its gate in a
   separately reviewed release commit. No schema migration or full-branch merge
   is authorized here.

No mobile/native/TestFlight changes, schema mutations or additional production
components are deployed by this integrated preview.

## Member dashboard and expanded QA update

The technical link index now leads to the real authenticated member home. The
home reuses the approved studio/branding assets, presents Tai Chi, SoulWalk and
meditation as clear activity choices, and contains three expandable previews of
the existing recipes with links to all six originals and the real account diary.
No demo adapter, synthetic statistics or fake diary is included. Loading/read
failures show unavailable values rather than zero totals.

Additional preview fixes:

- Clear member progress immediately on account changes and reject stale history
  responses; bound history requests. Existing sign-in/signup/recovery handlers,
  public Supabase configuration and production landing-page bytes are retained.
- Gate unverified `workout_sessions` progress writes as well as walking/nutrition
  writes. Completing a meditation cannot automatically write unverified progress.
- Stop an active walking cue immediately when narration is turned off, paused or
  a different week is selected; cancel device speech fallback as well.
- Treat missing nutrient values as unknown, with a known-value subtotal notice.
  Clear the previous day's foods while loading another date and on request/date
  errors, so a failed request cannot label old foods as a different day's history.
- Bound the complete barcode request/body read, abort superseded lookups, ignore
  stale responses and hide old results for invalid/new codes. Pending-save retry
  identity, serving conversions and duplicate guards remain intact.

The expanded QA includes all 12 weekly schedules and five walking cue files;
completion/save/history and two-account fixtures; all 17 actual voice/ocean pairs
playing on desktop and mobile; unknown nutrition, historical-day selection,
barcode serving/macro conversions, not-found/HTTP/timeout/stale-response states,
manual fallback, and dashboard widths 320/390/768/1024/1440. All 25 MP3 assets
(17 voices, 3 ocean tracks, 5 walking cues) decode completely and contain signal.
Tai Chi's 600-second playback, audio, countdown and playlist are preserved.

A read-only call to the real Open Food Facts product API returned a product and
nutrient data; fixture barcode cases exercise failure paths without external
writes. Camera scanning and outdoor GPS/locked-phone behavior require physical
mobile-device review; synthetic GPS tests do not certify sensor accuracy.

Live account verification remains BLOCKED: the available preview browser had no
stored Supabase session, and no database administration connector is available.
An authenticated session plus positive-control reads from two existing test
accounts are needed to prove live read isolation. Anonymous denial and fixture
isolation are explicitly not treated as proof of authenticated RLS. Live write
policies/persistence need authorized schema-policy inspection and, if required,
separate permission for disposable test records. No users, production rows,
policies or schema were changed. All write gates remain closed.

The dashboard/meditation/recipe presentation can be considered for an individually
approved release after owner review. Walking/nutrition/progress writes are not
publish-ready. No production push or promotion is authorized by this preview.
