# Build My Daily Growth for Android

The Android project is generated from Expo and can be opened in Android Studio.
Replit currently supports Android preview through Expo Go, but does not provide
a downloadable APK build. APK creation must be done on a computer with Android
Studio and the Android SDK installed.

## Build an installable debug APK

1. Download or clone the project and install the workspace dependencies from
   the repository root:

   ```sh
   pnpm install
   ```

2. Open `artifacts/mobile/android` in Android Studio and allow Gradle to sync.
   Android Studio will prompt you to install any required SDK components.
3. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Install the generated debug APK on an Android phone or tablet. The file is
   normally written to:

   ```text
   artifacts/mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```

You can also build from a terminal after installing Java and the Android SDK:

```sh
cd artifacts/mobile/android
./gradlew assembleDebug
```

The debug APK is signed with the local debug key and is suitable for personal
testing and sideloading. For distribution, use Android Studio's **Generate
Signed Bundle / APK** flow and keep the release keystore private and backed up.

## Regenerate the native project

If the Expo native configuration changes, regenerate the Android project from
the repository root:

```sh
pnpm --filter @workspace/mobile exec expo prebuild --platform android --no-install
```

Prebuild regenerates native files, so keep any custom Android changes in config
plugins or reapply them after regeneration.

Android APKs install on Android phones and tablets. For desktop use, open the
web version in a browser; an APK is not a Windows or macOS desktop installer.
