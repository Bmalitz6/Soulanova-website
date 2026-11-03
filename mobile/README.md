# Soulanova mobile foundation

One Expo/React Native app for iPhone and Android, built separately from the production site.

## Local setup
Use Node.js compatible with Expo SDK 57. From `mobile/`:

```sh
npm install
npx expo install expo-location expo-audio
npx expo start
```

The app starts in a preview-only state. Expo SDK 57 is chosen as a conservative starting point; review SDK 58 compatibility and update dependencies before store releases.

## Currently functional
- Home navigation between Walking, Meditation, and Tai Chi previews
- A walking library of 37 named activities (7 x 15 minutes, 15 x 30 minutes, 15 x 45 minutes)
- Start / pause / resume / finish with timer
- Foreground GPS with permission, distance estimates from position fixes, and current pace
- Music-first mode by default (no automatic voice prompts interrupt other apps)
- Information screens for meditation and Tai Chi

## Not yet built
- Supabase authentication and synchronized history
- Hosted 17 meditation audio masters or Tai Chi streaming media
- Background/locked-phone location tracking and route maps
- Native narration ducking and music restoration (requires recorded cue assets and device tests)
- Store entitlements, payment flow, Android/iOS beta builds

Do not treat this proof of concept as production-ready or request background location permissions until that feature is implemented and privacy-reviewed. Add keys only through environment configuration, never commit credentials.
