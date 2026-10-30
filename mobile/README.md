# Soulanova mobile foundation (iPhone + Android)

## Status
Native-app integration has started, but an installable iOS or Android app does **not** exist in this repository yet. The existing Soulanova website remains unchanged. This directory begins the reusable native data layer for SoulWalk.

## Stack and next implementation
- Proposed cross-platform app: Expo + React Native + TypeScript, using development builds for native HealthKit and Health Connect integrations.
- Existing Supabase project remains the single source of truth for authentication, user history, and 12-week progress. Never commit service-role keys or credentials.
- `soulwalk/sessions.ts` implements authenticated inserts, recent-history reads, input checks and five-full-length-walk goals for the existing `public.soulwalk_sessions` table.
- Source values for native sessions are `ios` and `android`; existing web rows and RLS policies are preserved.

## Create the actual mobile application on the Mac (future step)
From the repository root, the native project can be bootstrapped separately with the *current* Expo CLI, then this shared service can be integrated:
```sh
npx create-expo-app@latest mobile-app --template blank-typescript
cd mobile-app
npx expo install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
```
Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` locally. Do not commit `.env` or credentials. Use persisted native auth storage and foreground token refresh according to Supabase's React Native quickstart.

## Native phase gates
1. **Account:** Native sign-in and sign-out, preserving member isolation through Supabase RLS.
2. **SoulWalk:** 12-week timer, recorded Serene audio, background playback behavior, and save/retrieve integration.
3. **iOS:** Request HealthKit read permission for steps/heart rate/distance and, only if offered, explicit workout write access. Apple Watch data availability depends on pairing, authorization and supported samples.
4. **Android:** Request Health Connect permissions (steps, exercise, distance, heart rate only where available and authorized); implement required Android background/foreground-service behavior.
5. **Outdoor walks:** GPS permission, route and distance with user control; never assume indoor distance from GPS.
6. **Reliability:** Test lock screen, app suspension, offline queue and replay/duplicate prevention, timezone/calendar boundaries, and users declining health/location permissions.
7. **Release:** Separate privacy disclosures, App Store and Google Play review compliance, and signed test builds before production.

## Important constraints
No automatic Apple Watch sync exists in the current browser. No health/location access has been implemented yet in the native app; permissions must be explained and explicitly requested. Do not equate a 10-second test with a full-length Week 1 workout. The current Supabase schema stores durations and totals but not detailed GPS route tracks or source-health identifiers: those need a privacy and schema review before implementation.

## References
- https://docs.expo.dev/
- https://supabase.com/docs/guides/auth/quickstarts/react-native
