# Getting Started with EZCAT

This guide provides step-by-step instructions to set up, run, and configure the EZCAT development environment on your local machine.

---

## 📋 Prerequisites

Before installing EZCAT, ensure your development machine meets the following requirements:

| Tool | Recommended Version | Minimum Required | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.x LTS` or `v22.x` | `v18.0.0` | Download from [nodejs.org](https://nodejs.org/) |
| **Package Manager** | `npm v10+` | `npm v8+` | `yarn` or `pnpm` also supported |
| **Git** | `v2.40+` | `v2.20+` | Version control system |
| **Python** *(Optional)* | `v3.10+` | `v3.8+` | Only needed if re-compiling the SQLite database |
| **Expo Go** *(Optional)* | Latest App Store release | - | Install on your physical Android or iOS device |

---

## 📥 Installation

### Step 1: Clone the Repository

Clone the EZCAT repository from GitHub and navigate into the project directory:

```bash
git clone https://github.com/amateuristrying/EZCAT.git
cd EZCAT
```

### Step 2: Install Node Dependencies

Install all project dependencies using `npm`:

```bash
npm install
```

> [!NOTE]
> EZCAT utilizes **React 19** and **Expo SDK 57**. If you encounter peer dependency warnings, `npm` will automatically apply the pre-configured package overrides specified in `package.json` (`uuid: ^11.1.1`).

---

## ⚙️ Environment Configuration

EZCAT is 100% functional out of the box in offline mode. If you wish to enable live AI mentoring features via external Large Language Models (LLMs), create a local `.env` file.

### Step 1: Create `.env` from Template

Copy the provided `.env.example` file:

```bash
# On Windows PowerShell
Copy-Item .env.example .env

# On macOS / Linux
cp .env.example .env
```

### Step 2: Populate Variables

Edit `.env` in your text editor:

```ini
# EZCAT Application Environment Variables
# Note: Variables prefixed with EXPO_PUBLIC_ are bundled into client-side code by Expo Metro.

# AI Coaching & Question Recommendation API Key
EXPO_PUBLIC_AI_API_KEY=your_openai_or_openrouter_api_key_here

# API Base URL (Default: https://api.openai.com/v1)
# Use https://openrouter.ai/api/v1 for OpenRouter
EXPO_PUBLIC_AI_BASE_URL=https://api.openai.com/v1

# AI Model Identifier (e.g. gpt-4o-mini, deepseek-chat, claude-3-haiku)
EXPO_PUBLIC_AI_MODEL=gpt-4o-mini
```

> [!TIP]
> Even if you do not specify an API key in `.env`, users can still configure and test their own personal API key dynamically within the app under the **AI Coach** tab using the **BYOK (Bring Your Own Key)** settings modal.

---

## 🚀 Running the Local Development Server

Start the interactive Expo CLI bundler:

```bash
npx expo start
```

This launches the Metro bundler and displays an interactive terminal menu with a QR code:

```text
  Starting Metro Bundler
  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  █ ▄▄▄▄▄ █  █ █▄▄ █ ▄▄▄▄▄ █
  █ █   █ █ ▄█▄▀██ █ █   █ █
  █ █▄▄▄█ █▄▄▄█▄▄▄ █ █▄▄▄█ █
  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
  › Metro waiting on exp://192.168.1.10:8081
  › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

  › Using Expo Go
  › Press a │ open Android
  › Press i │ open iOS simulator
  › Press w │ open web
  › Press r │ reload app
  › Press c │ show project tools
```

---

## 📱 Platform-Specific Execution

### Running on Web Browser (Fastest Setup)

To test the application immediately on your desktop browser:

```bash
npm run web
# or
npx expo start --web
```

The app will open automatically at `http://localhost:8081`.  
On Web, the application displays inside the **MobileFrame** emulator, presenting a centered 390px mobile viewport with high fidelity.

### Running on Android Emulator / Physical Device

1. **Physical Device (via Expo Go)**:
   - Install **Expo Go** from the Google Play Store.
   - Connect your phone to the same Wi-Fi network as your computer.
   - Scan the terminal QR code using Expo Go.

2. **Android Emulator (via Android Studio)**:
   - Launch your Android Virtual Device (AVD) from Android Studio.
   - Press <kbd>a</kbd> in the Expo terminal or run:
     ```bash
     npm run android
     ```

### Running on iOS Simulator / Physical iPhone

> [!IMPORTANT]
> Compiling or simulating iOS applications locally requires **macOS** with **Xcode** installed.

1. **Physical iPhone (via Expo Go)**:
   - Install **Expo Go** from the Apple App Store.
   - Open the default iOS **Camera** app and scan the terminal QR code.
   - Tap the banner to open EZCAT inside Expo Go.

2. **iOS Simulator (macOS only)**:
   - Open Simulator via Xcode (`open -a Simulator`).
   - Press <kbd>i</kbd> in the Expo terminal or run:
     ```bash
     npm run ios
     ```

---

## 📂 Project Directory Walkthrough

```text
EZCAT/
├── app/                          # Expo Router navigation routes
│   ├── _layout.tsx               # Root layout, theme, and font hydration
│   ├── index.tsx                 # Welcome & landing screen
│   ├── home.tsx                  # Post-onboarding main screen
│   └── onboarding/               # Onboarding funnel steps
│       ├── profile.tsx           # Aspirant bio (name, age, grad year)
│       ├── goals.tsx             # Target year & goal percentile
│       ├── colleges.tsx          # Target B-school selection
│       ├── level.tsx             # Sectional baseline assessment
│       └── ready.tsx             # Setup confirmation
├── assets/                       # Bundled static assets
│   ├── cat_questions.db          # Embedded native SQLite database (~6,963 questions)
│   ├── cat_questions.json        # Compiled web dataset bundle
│   └── images/                   # App logos and icons
├── backend/                      # Dataset compilation & maintenance
│   ├── database/
│   │   ├── schema.sql            # SQLite 3 DDL schema specification
│   │   └── build_db.py           # Pipeline compiler from raw JSON to SQLite/JSON
│   └── dataset/                  # Canonical raw question sources
├── src/                          # Application source code
│   ├── components/               # Reusable UI cards, modals, charts, buttons
│   ├── constants/                # Colors, design tokens, typography, CAT data
│   ├── data/                     # Repository layer (native vs web) & adapters
│   ├── screens/                  # Tab screens (Home, Questions, Mocks, Coach)
│   ├── services/                 # AI service layer & OpenAI client
│   ├── storage/                  # AsyncStorage & rebuild-safety helpers
│   ├── store/                    # React Context stores (AppStore & BYOKContext)
│   └── utils/                    # Analytics engine & score projection
├── app.json                      # Expo application manifest
├── metro.config.js               # Metro bundler config (assetExts: db, wasm)
├── package.json                  # Dependencies & npm scripts
└── tsconfig.json                 # TypeScript compiler options
```

---

## 🛠️ Common Troubleshooting

### 1. Metro Bundler Port 8081 Conflict
If port `8081` is already in use by another service:
```bash
npx expo start --port 8082
```

### 2. Clearing Metro Cache
If you recently modified `cat_questions.db` or package configurations and changes are not reflecting:
```bash
npx expo start -c
```

### 3. Missing SQLite Database on Native First Run
If running on an Android emulator or device and questions fail to load, ensure Metro is bundling `.db` extensions by verifying [metro.config.js](file:///c:/Users/Lenovo/Downloads/Documents/workspace/EZCAT/metro.config.js):
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}
module.exports = config;
```
