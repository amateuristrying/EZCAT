# Contributing to EZCAT

Thank you for your interest in contributing to **EZCAT**! We welcome contributions from developers, educators, and CAT aspirants of all skill levels. Whether you are fixing a UI bug, proposing a new feature, or refining question data, your help makes EZCAT better for everyone.

---

## 📑 Table of Contents

- [Code of Conduct & Community Expectations](#-code-of-conduct--community-expectations)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [How to Contribute](#-how-to-contribute)
  - [Reporting Issues](#reporting-issues)
  - [Git Workflow](#git-workflow)
  - [Commit Conventions](#commit-conventions)
  - [Submitting a Pull Request](#submitting-a-pull-request)
- [Codebase Architecture](#-codebase-architecture)
  - [App Layer](#app-layer-src-app)
  - [Backend & Database Layer](#backend--database-layer-backenddatabase)
  - [Important Note for Backend & Dataset Contributions](#important-note-for-backend--dataset-contributions)
- [Getting Help](#-getting-help)

---

## 🤝 Code of Conduct & Community Expectations

EZCAT is an open-source project built with respect, collaboration, and learning in mind. We ask all contributors to:
- Be respectful, constructive, and encouraging in all communications, code reviews, and issue discussions.
- Focus on what is best for the community and for students preparing for competitive exams.
- Accept constructive feedback gracefully and work collaboratively toward solutions.

---

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

---

## 💡 How to Contribute

### Reporting Issues

Before opening a new issue, please search existing issues to see if it has already been reported. When creating an issue, choose the appropriate structured issue template:

- 🐛 **[Bug Report](https://github.com/amateuristrying/EZCAT/issues/new?template=bug_report.yml)**: Use this for software bugs, crashes, UI glitches, or unexpected behavior on iOS, Android, or Web.
- 📚 **[Content & Data Issue](https://github.com/amateuristrying/EZCAT/issues/new?template=content_issue.yml)**: Use this specifically for exam content problems — such as an incorrect answer key, a mis-parsed question, missing options, a duplicate question, or a typo in a question stem.
- ✨ **[Feature Request](https://github.com/amateuristrying/EZCAT/issues/new?template=feature_request.yml)**: Use this to propose new features, user interface enhancements, or improvements to the study experience.

---

### Git Workflow

We follow a standard fork-and-pull-request workflow:

1. **Fork the Repository**: Create your own copy of `EZCAT` on GitHub by clicking the **Fork** button.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/EZCAT.git
   cd EZCAT
   ```
3. **Create a Feature Branch**: Branch off from `main` with a short, descriptive name:
   ```bash
   git checkout -b feature/interactive-timer
   # or for bug fixes:
   git checkout -b fix/varc-scroll-issue
   ```
4. **Make Changes & Test**: Ensure your changes run cleanly locally on Web and/or mobile (`npx expo start`).
5. **Commit Your Changes**: Keep commits focused and write clear commit messages (see [Commit Conventions](#commit-conventions)).
6. **Push to Your Fork**:
   ```bash
   git push origin feature/interactive-timer
   ```
7. **Open a Pull Request**: Navigate to `amateuristrying/EZCAT` and submit a Pull Request against the `main` branch. Fill out the PR template completely.

---

### Commit Conventions

Write clear, concise commit messages that describe *what* changed and *why*:
- Use the imperative mood in the subject line (e.g., `Add section filter to quiz solver` instead of `Added section filter`).
- Keep the subject line under 72 characters.
- Useful prefixes:
  - `feat:` for new capabilities or UI additions
  - `fix:` for bug fixes
  - `data:` for content or answer key corrections
  - `refactor:` for code cleanups without functional changes
  - `docs:` for documentation updates

---

### Submitting a Pull Request

When submitting a PR:
- Title your PR clearly and link to any related issue (e.g., `Fixes #42`).
- Complete all sections of the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
- Include screenshots or GIFs for any UI or layout changes.
- Ensure your branch is up to date with `main` before requesting review.

---

## 📁 Codebase Architecture

Here is a high-level map of the codebase to help you orient yourself:

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
```

### App Layer (`src/`, `app/`)
- **`app/`**: File-based routes managed by Expo Router. Layouts, screen wrappers, and route navigation logic live here.
- **`src/components/`**: Reusable visual components (buttons, cards, modals, question solvers).
- **`src/constants/`**: Theme definitions, color tokens, and layout constants.
- **`src/data/`**: Data access repositories that query SQLite (`cat_questions.db`) and expose TypeScript data models.
- **`src/storage/`**: Local user progress, attempt histories, and persistent state management (`AsyncStorage`) featuring rebuild-safety.
- **`src/store/`**: Global application state context (`AppStore`).

### Backend & Database Layer (`backend/database/`)
- **`backend/database/schema.sql`**: Canonical DDL defining tables for questions, options, topics, papers, and exam sittings.
- **`backend/database/build_db.py`**: Python compiler script that parses raw question datasets and populates the SQLite database file (`cat_questions.db`).

### Important Note for Backend & Dataset Contributions

> [!TIP]
> **Check in with maintainers first for backend or dataset work!**  
> If you plan to work on anything touching the backend database schema (`backend/database/schema.sql`), dataset compiler scripts (`build_db.py`), or the underlying exam question dataset, please **open an issue first to discuss your approach**.  
>  
> There is additional project context surrounding question dataset compilation that isn't fully captured in the public repository yet. Checking in up front ensures your work aligns with upcoming updates and prevents any duplicate or wasted effort. We warmly invite your contributions and look forward to collaborating with you!

---

## ❓ Getting Help

If you have questions, need clarification on an issue, or want feedback before starting a task, feel free to:
- Open a discussion or issue on GitHub.
- Reach out in the PR comments when working on an active pull request.

Thank you for contributing to EZCAT! 🚀
