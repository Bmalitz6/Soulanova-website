# SoulFuel program and manual metrics — protected Preview review

Baseline: fa715dbcb7ad239fab3193fd23ee9e869d0f11df on feature/soulfuel-clean-preview-2026-11-09. No new backend infrastructure, member profile, wearable connector, credential or Production change.

## Existing-feature reuse

The dashboard program cards reuse the existing `member-path` / `member-paths` markup and styling used by the existing program/workout cards. SoulFuel and My Health have program cards, with a compact My Health / Add Metric shortcut visible on mobile. Existing Tai Chi, Yoga, Pilates, Strength, Meditation and other workout content, handlers and layout definitions are preserved. No SoulWalk file or shared workout/authentication script is edited. An exact reconstruction test checks that the only dashboard changes are the authorized program entry section, SoulFuel navigation link and dedicated stylesheet.

SoulFuel retains its approved hero/food photography and now exposes three program choices: Metrics Tracker (My Health), FoodScore & Food Diary (existing four dials and food entry), and Recipes (all 75 searchable/printable originals). The metrics page links back to the program and Dashboard. Daily nutrition summary reads the existing member-scoped Food Diary core; it does not copy or migrate diary records. All links retain the same origin.

The existing public Supabase configuration/client is reused with the same session persistence options. No new member identity or profile is created. There is no synthetic-member fallback in application code. Test-only mocked identities exist solely inside isolated automated tests and never create actual accounts or write health records to a live user.

## Bounded manual metrics

Supported inputs: weight kg; optional height cm to calculate BMI; systolic/diastolic blood pressure mmHg; waist/hip/chest cm; resting pulse bpm; daily steps/activity minutes; manual energy rating 1–5. All records are explicitly manual; no wearable data is connected or imported. Activity is one replaceable snapshot per date, not an import of workout history. Weight, waist and energy comparisons show recorded change only, not a medical interpretation or a claim about health outcomes.

BMI = kg / (cm/100)^2, following the [CDC calculation](https://www.cdc.gov/bmi/about/). No arbitrary BMI field or classification. Weight without height has no calculated BMI. Technical validation checks finite values, dates, units, numeric input limits and systolic > diastolic. These input limits are not clinical normal ranges, recommendations or validation of a device reading. No estimated values replace missing measurements.

Metrics are stored only in this browser at `soulanova-health-metrics-v1:<verified Supabase member id>`, with per-record owner checks, manual source and derived BMI consistency. Authenticated `getUser()` verification precedes reading records and is repeated before every save/delete. Anonymous, signed-out, unverified and account-changed states cannot save. Account transitions clear visible values before verification. An outstanding save is invalidated when the verified member/revision changes. Local readback is required before a persistence-success message. Invalid storage is not overwritten. No health information is sent to Redis, OFF or any wearable provider.

Every save/edit requires explicit consent to browser-local storage. Individual deletion is supported. This is **not encrypted storage, cloud sync or server-enforced RLS**. Member namespacing and authenticated UI checks do not protect against malicious same-origin scripts, a compromised browser profile or someone with direct storage access. The UI discloses this and advises against shared browser profiles. No actual-account health persistence was tested or claimed; automated tests use disposable mock authentication and isolated storage.

## Nutella serving investigation

The current staging record 3017620422003 has per-100 g nutrition and provisional score 23/100, but no reported serving nutrition/serving size. The previous default of 1 serving therefore scaled unavailable per-serving fields, correctly leaving nutrition unavailable; saving could not proceed with an all-null portion. This blocks the default serving path, not the measured-grams path. No 100 g amount is silently chosen and no source serving is fabricated.

The UI now disables the unsupported serving-count input, explicitly asks for a measured g/ml portion and keeps Add disabled until a supported portion has available nutrition. Entering 15 g on the captured Nutella record yields 80.85 kcal, .945 g protein, 8.625 g carbs and 4.635 g fat; explicit confirmation and exact readback are still required. A dedicated regression tests this flow. Scoring, source data, cache/proxy and 60/25/15 weights are unchanged.

## Preview access versus member authentication

Vercel Authentication authorizes access to the deployment. Supabase authenticates the existing Soulanova member whose local diary/metrics may be read or saved. One does not substitute for the other. A new generated Preview hostname is also a new browser origin: a session stored on Production or an older generated hostname is not automatically present there. Sign in once with the existing member account on the new origin. Relative Dashboard / SoulFuel / Metrics links then reuse that session; no extra sign-in is introduced within that origin. A stable alias is not a workaround here: the FoodScore server gate intentionally denies aliases, and is not weakened.

No anonymous writes, auto-created members, admin/service-role key or auth bypass is added. Actual owner account sign-in and email-link/recovery allowlist behavior require owner verification; this implementation does not modify Supabase Auth settings. Automated navigation tests exercise existing login code with a mocked provider, and are not evidence of a real-account authentication acceptance test.

## Validation and remaining approval tasks

Automated coverage includes metric/BMI validation, blank-vs-zero handling, invalid dates/records, member isolation, verified-user failure, anonymous denial, account-switch races, readback failure, daily-snapshot upsert, edit/delete, local reload persistence, navigation/program links, measured Nutella portions, all existing FoodScore/security/cache/recipe regressions, and axe/responsive tests at desktop, 390px and 320px. Final counts and screenshots are recorded in delivery/evidence. No live health data or real member diary is written during validation.

Separate approval/work before cloud or public health storage: define a health-record schema using the existing member identity; review server authorization/RLS, encryption/access controls, explicit consent, retention/export/deletion, backups and cross-device synchronization; perform real-account/multiple-user acceptance and security review. Existing member-data cloud write gates stay untouched/closed. Wearable integration requires implemented provider APIs plus explicit user permission and tested provenance; none is claimed. Production release remains separately authorized work.

Only protected feature-branch Preview publication is authorized here. Keep Redis credentials and scopes untouched; update only the branch-specific approved SHA for the reviewed commit, preserving all other FoodScore approvals and Production hard-deny. Verify SSO on dashboard/program/metrics/APIs and unchanged Production deployment/aliases after publishing. An authorized disable must retire old enabled deployment URLs as well as changing flags/redeploying; no rollback or disable is performed automatically.
