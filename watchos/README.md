# SoulWalk Apple Watch

The working native watch app is preserved in `mobile-app/ios/mobileapp.xcodeproj`.
Open that project and select the shared **SoulwalkWatch** scheme and a watch simulator.
The watch target is **SoulwalkWatch Watch App**; its opening screen and workout model
are in `watchos/SoulWalkWatchView.swift`, referenced by the watch target only.
`mobile-app/ios/SoulWalkWatchView.swift` is an unused local prototype copy, not the
active target source, and is intentionally outside the preserved file list.

## Build the existing watch target

From `mobile-app/` with Xcode 27.2 and its watchOS simulator runtime installed:

```sh
xcodebuild -project ios/mobileapp.xcodeproj \
  -scheme SoulwalkWatch -configuration Debug \
  -destination 'generic/platform=watchOS Simulator' \
  -derivedDataPath /tmp/soulwalk-derived build
```

The current minimum deployment version is watchOS 27.2. Physical devices require
appropriate developer account access and provisioning. The shared development team
identifier and bundle identifiers are project configuration, not signing credentials.
No certificates or provisioning profiles are stored in Git.

## Native project preservation

Do not regenerate or replace the native project, including with `expo prebuild --clean`.
The existing watch target, companion embedding, HealthKit entitlement, Health read/write
usage descriptions, motion permission, and signing settings live in the committed project.
The existing iPhone native sources and assets are preserved unchanged because the shared
Xcode project references them; this is not a change to the iPhone app's behavior.

`mobile-app/.gitignore` uses explicit native file exceptions. Add new source files or
shared settings to that allowlist deliberately. Pods, build outputs, DerivedData,
environment files, credentials, `xcuserdata`, and local Xcode state remain excluded.
The CocoaPods dependency specifications and lockfile are preserved, but dependencies
must be installed locally for companion iPhone development. Local Node environment
configuration also remains local. The watch target itself has no CocoaPods dependencies.

## Workout behavior and validation

The SwiftUI app records outdoor walks using `HKWorkoutSession` and `HKLiveWorkoutBuilder`.
It waits for session activation and successful data collection before enabling workout
controls, handles Pause/Resume, and finalizes collection once after activity stops.
The completion summary retains elapsed time and available metrics and offers Start New
Walk. A separate Music button presents Apple's Now Playing interface.

Grant Health access on the watch when starting a walk. Simulator workout samples can be
synthetic; heart rate, steps, distance, real sensor accuracy, background behavior and
music integration should also be validated on a paired physical watch. This preservation
commit does not certify distribution readiness or add workout recovery, GPS route maps,
iPhone synchronization, or account/history upload.
