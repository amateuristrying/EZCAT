<div align="center">

# 🎯 EZCAT

### Your Complete CAT Exam Preparation Companion

**Authentic previous papers · Structured daily practice · Exam-condition mocks · Real analytics**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-3178C6?style=flat-square)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/amateuristrying/EZCAT/pulls)
[![GitHub last commit](https://img.shields.io/github/last-commit/amateuristrying/EZCAT?style=flat-square)](https://github.com/amateuristrying/EZCAT/commits)
[![GitHub stars](https://img.shields.io/github/stars/amateuristrying/EZCAT?style=flat-square)](https://github.com/amateuristrying/EZCAT/stargazers)

</div>

---

## 📖 About

EZCAT is a modern, cross-platform app for aspirants preparing for the **Common
Admission Test (CAT)** — one codebase, running on iOS, Android, and web. It pairs
authentic previous-year papers with structured daily practice and full
exam-condition mocks, so prep feels like the real thing from day one.

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎯 Daily Practice
Tailored daily sets across all three CAT sections — **VARC** (Verbal Ability &
Reading Comprehension), **DILR** (Data Interpretation & Logical Reasoning), and
**QA** (Quantitative Aptitude).

### ⏱️ Exam-Condition Mock Suite
| Mode | Length | Scope |
|---|---|---|
| **Full CAT Mock** | 120 min | Complete authentic previous-year sitting |
| **Sectional Mock** | 40 min | Single-section focused practice |
| **Mini Mock** | 15 min | 10-question speed drill |

Hints and instant feedback are disabled mid-mock — genuine exam simulation, not a
practice-mode shortcut wearing a timer.

### ⌨️ Full MCQ & TITA Support
Interactive solver for both standard 4-option MCQs and Type-In-The-Answer (TITA)
questions, with CAT-compliant marking: **+3** correct, **−1** incorrect MCQ, **0**
incorrect TITA.

### 📊 Real Performance Analytics
Score reports built from numbers the app can actually compute — raw score,
accuracy %, time taken, and a per-section breakdown. No invented percentiles.

### 🛡️ Offline & Persistent Progress
Local progress storage with automatic rebuild-safety, so streaks, solved counts,
and attempt history survive database content updates.

### 🤖 AI Exam Coach
Interactive study assistant for weakness identification and structured prep
planning.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (Expo Router, file-based routing) |
| Language | TypeScript |
| Database | SQLite (`cat_questions.db`), compiled from a canonical dataset |
| Local Storage | `@react-native-async-storage/async-storage` |
| State | React Context (`AppStore`) |

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- `npm`, `yarn`, or `pnpm`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/amateuristrying/EZCAT.git
cd EZCAT

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start

# ...or go straight to web
npx expo start --web
```

## 📁 Project Structure

```text
EZCAT/
├── app/                      # Expo Router navigation routes
│   ├── index.tsx             # App entry point
│   ├── _layout.tsx           # Root navigation layout & provider
│   └── (app)/                # Main app screens (Home, Questions, Mocks, Coach)
├── src/
│   ├── components/           # Reusable UI components & modals
│   ├── constants/            # Design system, colors, typography
│   ├── data/                 # SQLite data access repository & UI adapter
│   ├── storage/              # Local progress storage & rebuild-safety module
│   └── store/                # React Context application state provider
├── backend/
│   └── database/              # schema.sql + build_db.py dataset builder
├── LICENSE
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) to learn about our development setup, issue templates, git workflow, and pull request process.

## 📄 License

Licensed under the MIT License — see [LICENSE](LICENSE) for details.

<div align="center">

**Copyright © 2026 [wantedchip](https://github.com/wantedchip) & [amateuristrying](https://github.com/amateuristrying)**

Made with ❤️ for every CAT aspirant

[⬆ Back to top](#-ezcat)

</div>