# Soulanova Phase 2: private TestFlight preparation

The maintained native project is `ios/mobileapp.xcodeproj`; do not regenerate it.
The production EAS profile selects the existing `mobileapp` scheme, Release
configuration, store distribution, and the production EAS environment. That scheme
includes the embedded SoulwalkWatch Watch App target.

The iPhone display name is Soulanova. Keep its Expo name and native Info.plist
names in sync; internal target/scheme names and EAS project identity stay unchanged.
Both native targets use marketing version 1.0.0 and local build number 1 in Debug
and Release. Production uses EAS remote build-number auto-increment. Inspect the
actual signed artifact to verify both the iPhone and generated watch Info.plists
receive the same increment before uploading; remote version state was not changed
or certified by this preparation.

The app icon is derived from the existing approved Soulanova website artwork.
See `assets/soulanova-app-icon.README.md` for provenance and reproduction. The Expo
image and both native AppIcon catalogs use opaque 1024 × 1024 PNGs. Check the brand
wordmark at small watch sizes before inviting testers; no new symbol-only identity
has been invented.

Expo Doctor's appConfigFieldsNotSyncedCheck is deliberately disabled using Expo's
documented package.json setting. This project explicitly maintains native iOS and
watchOS settings, and EAS must not run Prebuild to sync app.json. The name, icon,
versions, HealthKit entitlements, source membership, and watch embedding must be
reviewed and validated directly in the native project. All other Doctor checks,
including direct native peer dependencies and SDK compatibility, remain enabled.
The newly declared expo-font and expo-asset modules use SDK-compatible versions;
CocoaPods was reconciled with `pod install --deployment --no-repo-update`.

## Gates before uploading

- Run EAS archive inspection locally and verify every preserved native file and
  the parent `watchos/SoulWalkWatchView.swift`, plus the new icon, is present.
  Keep Pods, build output, environment files, credentials and xcuserdata excluded.
- Run TypeScript and Expo Doctor; make an unsigned Release archive with the
  existing workspace and `mobileapp` scheme. Confirm the embedded watch app,
  actual names/versions/build numbers, compiled icons, and bundled JavaScript.
- Confirm paid Apple Developer access and distribution profiles with HealthKit
  for both bundle IDs. The preparation archive is unsigned and does not certify
  Apple distribution signing or App Store validation.
- Confirm a supported EAS build image for the existing watchOS 27.2 deployment
  target before starting a cloud build. This change does not invent or pin an
  unavailable image or lower deployment targets. A compatible local EAS build
  remains an option if the cloud toolchain is unsuitable.
- Verify production EAS public Supabase variables and dedicated tester accounts
  without embedding secrets or changing production records.
- Finish the privacy, SoulSafe revocation, and real-device checks from the release
  review. This preparation does not change SoulWalk, SoulSafe, or nutrition logic.
- Build without auto-submit. Uploading or inviting external testers requires a
  separate deliberate step; external testers need Beta App Review.

Expo Doctor configuration reference:
https://docs.expo.dev/versions/v58.0.0/config/package-json/#appconfigfieldsnotsyncedcheck
