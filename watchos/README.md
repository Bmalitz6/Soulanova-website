# SoulWalk Apple Watch — Phase 1 prototype

This folder contains **native SwiftUI watchOS source**, not a deployable Expo screen. Nothing is installed on the watch yet.

## Create the watchOS target in Xcode
1. In a new Terminal window go to the project:
   `cd ~/Documents/Soulanova/Soulanova-SoulFuel/mobile-app`
2. Generate the native project: `npx expo prebuild --platform ios`. This produces the iOS Xcode project if it has not been generated. Do not overwrite uncommitted local native changes.
3. Open the generated `ios/*.xcworkspace` in Xcode.
4. Select the existing iOS project and use **File > New > Target > watchOS > App**. Choose **Watch App for Existing iOS App**, pointing at Soulanova's existing iOS app target.
5. Name it **SoulWalk Watch**, use SwiftUI and Swift, and set your Apple Developer signing team. The watch bundle identifier should be based on `com.soulanova.wellness`.
6. Add `watchos/SoulWalkWatchView.swift` to the newly created watchOS **target only**. Use `SoulWalkWatchView()` as its app WindowGroup root view.
7. Add **HealthKit** under the watch app's Signing & Capabilities, and set clear Health usage descriptions for heart rate, workouts, steps and distance in the watch target. An Apple Watch paired with the development iPhone and suitable developer provisioning is required for physical testing.
8. Build and run the **watch target** on a paired Apple Watch. Grant the Health access request.

## Phase 1 implementation
- Native `HKWorkoutSession` + `HKLiveWorkoutBuilder` for an outdoor walking workout.
- Native Core Motion pedometer for steps and distance when available.
- Live workout timer, heart-rate display when watch sensors provide it, pause/resume/finish controls.
- Clean dark wrist-sized interface.

**Not implemented yet:** iPhone synchronization, Soulanova account/history upload, remote music player commands, route map, SoulSafe integration, independent workout recovery, final UX and Watch App Store distribution. No live watch metrics have been verified on a real device.

### Important
WatchOS source cannot run through Expo Go or the existing EAS iOS development-client build alone. The watchOS target must be created, signed and built in Xcode, and Expo prebuild regeneration may require a persistent config plugin to preserve the target. This source is a prototype, not production-ready workout software.

Official Apple reference: https://developer.apple.com/documentation/watchOS-Apps/setting-up-a-watchos-project
