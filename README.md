# Smart Navigation

Smart Navigation is an Expo React Native app that records travel routes and helps users navigate back to saved destinations. It uses Firebase Authentication and Firestore, device location, sensors, and Google Maps.

## Requirements

- Node.js 22.13.x or newer (Expo SDK 57 requirement)
- npm 10 or newer
- Android Studio and an Android emulator, or a physical Android device
- Expo Go for quick development on a physical device
- A Firebase project with Authentication and Cloud Firestore enabled
- A Google Cloud Maps API key with Maps SDK for Android enabled

For iOS development, use macOS with Xcode 26.4 or newer. iOS builds cannot be compiled locally on Windows, but the web target and Android development work on Windows.

## Install

From the project directory:

```powershell
npm ci
```

If no lockfile is available, use `npm install` instead.

Check that the installed Expo dependencies match SDK 57:

```powershell
npx expo install --check
```

To automatically align Expo package versions when needed:

```powershell
npx expo install --fix
```

## Firebase Configuration

1. Create or open a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and activate the sign-in providers used by the app.
3. Create a **Cloud Firestore** database.
4. Register an Android app using the package name `com.smartnavigation.app`.
5. Copy the Firebase web configuration values into a local `.env` file in the project root:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

The app reads these variables in `src/config/firebase.js`. Do not commit `.env` or private credentials. The current code has development fallback values, but environment variables are recommended for local and production configuration.

## Google Maps Configuration

The Android Maps key is configured in `app.json` under `expo.android.config.googleMaps.apiKey`.

1. Create an API key in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Maps SDK for Android** and any other APIs required by your map features.
3. Replace the development key in `app.json` with your own key.
4. Restrict the key to the Android app package `com.smartnavigation.app` and the appropriate SHA-1 certificate fingerprints.

Never publish an unrestricted API key.

## Run the App

Start the Expo development server:

```powershell
npm start
```

Then choose a target from the Expo terminal menu, or use one of these commands:

```powershell
npm run android
npm run web
```

For Android, make sure an emulator is running or connect a device with USB debugging enabled. For a physical device, install Expo Go, connect the computer and phone to the same network, then scan the QR code shown by Expo.

## Location Permissions

The app requests foreground and background location access. On Android, allow location access in the system settings when prompted. Background tracking may require selecting **Allow all the time**. Test route recording on a physical device because emulator location and sensor data may be limited.

## Useful Commands

```powershell
# Clear the Metro/Expo cache
npx expo start -c

# Inspect the project configuration
npx expo config --type public

# Check the project for common issues
npx expo-doctor
```

## Project Structure

- `App.js` - application navigation and authentication gate
- `src/screens/` - authentication, navigation, and trip history screens
- `src/components/` - map and destination UI components
- `src/context/AuthContext.js` - Firebase authentication state
- `src/services/tripService.js` - trip persistence
- `src/engine/` - route recording and GPS collection
- `src/config/firebase.js` - Firebase initialization
- `app.json` - Expo app, permission, and Maps configuration

## Troubleshooting

- If dependencies are out of sync, run `npx expo install --fix`, then restart with `npx expo start -c`.
- If Firebase does not initialize, verify every `EXPO_PUBLIC_FIREBASE_*` value and restart the Expo server after changing `.env`.
- If the map is blank on Android, verify the Maps API is enabled, the key is valid, and the package/certificate restrictions match this app.
- If location recording fails, check device permissions and test on a physical device.
