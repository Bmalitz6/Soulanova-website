# Soulanova app icon

`soulanova-app-icon.png` is a deterministic 1024 × 1024 resize of the existing
approved website artwork at `assets/soulanova-logo.png` in the repository root.
The original square composition, colors, symbol and wordmark are retained.
The PNG is opaque; corners are left square for the operating system's icon mask.

The same image is copied into the existing iPhone and Apple Watch AppIcon asset
catalogs. The Expo app config references the mobile asset directly. No generated
or generic Expo artwork is used for these iOS/watchOS app icons.

To reproduce from `mobile-app/`:

```sh
sips -z 1024 1024 ../assets/soulanova-logo.png --out assets/soulanova-app-icon.png
```

Keep the Expo image and both native copies in sync. The watch icon file has an
explicit exception in `mobile-app/.gitignore` so EAS includes it.
