# Mobile App (Guard, React Native + Expo)

React Native Android application for security guards on duty.

## Features

- Guard sign-in with JWT session tokens stored in SecureStore
- Mandatory first-login consent screen before duty access
- In-app viewing of Terms and Conditions and Privacy Policy
- Background GPS foreground service configured for Android 8+
- Design system complying with strict UI rules (solid colors, Lucide icons, 6 px button radius)

## Prerequisites

- Node.js 18+
- Android Studio with Android SDK / Android emulator or physical device with USB debugging
- Backend running at accessible host (for emulator, `10.0.2.2:8000`)

## Setup

```bash
cd mobile
npm install
npm run start
```

For Android development builds:

```bash
npx expo run:android
```

## Environment Variables

- `EXPO_PUBLIC_API_URL`: Backend API URL (default: `http://10.0.2.2:8000/api` for emulator)
- `EXPO_PUBLIC_DEMO_MODE`: Set to `true` on demo environments
