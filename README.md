# Flavor Dispenser App

React + Vite + Tailwind + Zustand. Runs as: Android APK (native Bluetooth), installable PWA, or hosted by the ESP32.

## Get the APK (no Android Studio needed)
1. Create a free GitHub repo and push this folder to it (branch `main`).
2. GitHub -> **Actions** -> **Build APK** -> wait ~5 min.
3. Open the finished run -> **Artifacts** -> download **dispenser-apk** (zip) -> unzip -> `app-debug.apk`.
4. Send `app-debug.apk` to your phone, tap it, allow "install unknown apps".

## Build locally instead (needs Android Studio + JDK 17)
```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android      # Build > Build APK(s)
```

## Use
1. Flash `firmware/dispenser.ino` (Bluetooth version) to the ESP32-S3.
2. Open the app, allow Nearby devices, go to Maintain, paste your Gemini key.
3. Tap Connect, pick DRINK-DISPENSER.

Other modes: PWA (host `dist/` on any https site), ESP-hosted Wi-Fi (`firmware/dispenser_wifi`, `npm run build:esp`).
