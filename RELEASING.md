# 🚀 EZCAT Release & Compilation Guide

This document describes how to compile packages for **Web**, **Android (APK)**, and **iOS**, as well as how automated releases work in the EZCAT repository.

---

## 📦 Overview of Platform Builds

| Platform | Local Build Method | Cloud Build Method (EAS / CI) | Apple / Google Developer Account Required? |
|---|---|---|---|
| **Web** | `npm run build:web` (`expo export -p web`) | GitHub Actions (`release.yml`) | ❌ No (deploy to Vercel/Netlify/GitHub Pages/S3) |
| **Android (APK)** | Local Gradle build via Android Studio / CLI | GitHub Actions (`release.yml`) or EAS Build | ❌ No for APK (Debug/Ad-hoc); Yes ($25 one-time) only for Google Play Store (.aab) |
| **iOS (Simulator)** | Requires macOS + Xcode locally | **Expo EAS Build (Free Tier)** | ❌ **No Apple Developer account needed!** |
| **iOS (Physical iPhone)**| Requires macOS + Xcode locally | **Expo EAS Build** | ⚠️ Yes (Free Apple ID allows 7-day personal testing; $99/yr Apple Developer Account needed for Ad-hoc/TestFlight/App Store) |

---

## 🌐 1. Web Compilation

Expo exports static production HTML, JavaScript, and assets into the `dist/` directory.

### Quick Command:
```bash
npm run build:web
# or
npx expo export -p web
```

### Output:
- The compiled web application is in `./dist`.
- Contains `index.html`, bundled JavaScript bundles, static styles, assets, and icons.
- Can be deployed directly to:
  - **Vercel**: `vercel deploy --prod`
  - **Cloudflare Pages**: Point build directory to `dist`
  - **Netlify**: `netlify deploy --dir=dist --prod`
  - **GitHub Pages**: Deploy contents of `dist`

---

## 🤖 2. Android APK Compilation (Local)

Because you have **Android Studio** installed locally, you can compile the APK entirely on your machine without relying on external cloud queues or spending cloud build minutes.

### Step 1: Generate Native Android Directory
```bash
npx expo prebuild --platform android --no-install
```

### Step 2: Compile the Release APK with Gradle
```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

### Step 3: Locate the Compiled APK
Once finished, the standalone installer APK is located at:
```
android/app/build/outputs/apk/release/app-release.apk
```
You can transfer this APK directly to any Android smartphone and install it!

*(Optional: For Google Play Store submission, use `.\gradlew.bat bundleRelease` to generate an `.aab` Android App Bundle).*

---

## 🍏 3. iOS App File Compilation & Expo Free Cloud Tier

### The iOS Dilemma on Windows
On a Windows PC, Apple does not allow running Xcode or the iOS native toolchain locally. However, **Expo solves this via EAS Build (Expo Application Services)**.

### Is EAS Free?
**Yes!** Expo provides a generous **Hobby (Free)** plan:
- **Free Build Credits**: 30 build credits per month across Android and iOS.
- **Hosted Cloud Infrastructure**: EAS spins up managed macOS runners (Apple Silicon M1/M2) in the cloud to compile your native iOS project.
- **Zero Local macOS Requirement**: You can trigger the build directly from your Windows command prompt.

### Two Ways to Build iOS:

#### Option A: iOS Simulator Build (100% Free, NO Apple Developer Account)
If you or anyone on your team has a Mac or wants to run the app in the Xcode iOS Simulator:
```bash
npx eas-cli build -p ios --profile preview-simulator
```
EAS compiles a `.tar.gz` containing `EZCAT.app`. You can drag and drop this directly into any iOS simulator. No Apple ID, no provisioning profiles, and no fees are required!

#### Option B: Physical Device Build (.ipa)
To install on an actual physical iPhone:
1. **Apple Code Signing Rules**: Apple mandates that any `.ipa` file installed on a physical device must be digitally signed with an Apple Certificate and Provisioning Profile.
2. **With a Paid Apple Developer Account ($99/year)**:
   ```bash
   npx eas-cli build -p ios --profile preview
   ```
   EAS will prompt you to log into your Apple account once and will automatically handle certificates, device UDIDs, and provisioning profiles. Once built, EAS gives you a QR code and download link to install the `.ipa` directly onto registered iPhones over the air!
3. **With a Free Apple ID**:
   You can use local ad-hoc resigning tools (such as Sideloadly or AltStore) with the compiled IPA, valid for 7 days.

### Setting up EAS:
1. Create a free account at [expo.dev](https://expo.dev).
2. Login from your terminal:
   ```bash
   npx eas-cli login
   ```
3. Link the project:
   ```bash
   npx eas-cli project:init
   ```
4. Run your build:
   ```bash
   npx eas-cli build -p ios --profile preview-simulator
   ```

---

## 🏷️ 4. The "Release Thingy" (Automated GitHub Releases)

Major open-source and enterprise repositories use **GitHub Releases** to distribute versioned binaries (APKs, Web Zips, IPAs) accompanied by changelogs and release notes.

We have configured an automated GitHub Actions workflow at [`.github/workflows/release.yml`](.github/workflows/release.yml).

### How to Create a Release Like Major Repos:

#### Method 1: The Git Tag Trigger (Recommended)
1. Ensure your changes are committed and pushed to `main`.
2. Update the version in `package.json` and `app.json` (e.g. `1.0.0` → `1.1.0`).
3. Create a Git tag and push it:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically:
   - Build the Web distribution zip (`ezcat-web-v1.0.0.zip`)
   - Build the standalone Android APK (`ezcat-android-v1.0.0.apk`)
   - Generate cryptographic SHA-256 checksums (`SHA256SUMS.txt`)
   - Auto-generate release notes based on recent commits
   - Publish a new Release on your GitHub repository with all artifacts attached for download!

#### Method 2: Manual Trigger via GitHub UI
1. Go to your repository on GitHub.
2. Click **Actions** tab → Select **Release EZCAT**.
3. Click **Run workflow**, specify the tag name (e.g. `v1.0.0`), and run.

---

## 🛠️ Handy Build Scripts

In `package.json`:
```bash
# Build web package
npm run build:web

# Prebuild and compile Android APK locally
npm run build:android:local

# Trigger EAS Android APK cloud build
npm run build:android:cloud

# Trigger EAS iOS Simulator cloud build
npm run build:ios:sim

# Trigger EAS iOS Device cloud build
npm run build:ios:device
```
