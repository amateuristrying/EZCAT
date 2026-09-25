# Contributing to EZCAT

Thank you for your interest in contributing to **EZCAT**! Whether you are fixing a UI bug, proposing a new feature, optimizing test analytics, or refining question data, your help empowers thousands of CAT aspirants.

This guide outlines our development standards, code conventions, testing procedures, and pull request process.

---

## 🤝 Code of Conduct & Values

All contributors and maintainers are expected to adhere to our [Code of Conduct](../CODE_OF_CONDUCT.md). We maintain a welcoming, respectful, and encouraging environment. When reviewing code or discussing features, focus on what delivers the highest quality, most authentic exam experience for students.

---

## 🛠️ Development Setup & Workflow

### 1. Fork & Branch Protocol

1. **Fork the Repository**: Create a personal fork on GitHub.
2. **Clone Locally**:
   ```bash
   git clone https://github.com/<your-username>/EZCAT.git
   cd EZCAT
   ```
3. **Create a Topic Branch**: Branch off `main` using standard prefixes:
   - `feat/interactive-timer` (New capabilities or UI additions)
   - `fix/varc-scroll-jump` (Bug fixes or UI corrections)
   - `data/cat-2023-answer-key` (Question corrections or solutions)
   - `docs/setup-guide-update` (Documentation improvements)
   - `refactor/clean-storage` (Internal code restructuring)

```bash
git checkout -b feat/interactive-timer
```

---

## 📐 Code Conventions & Standards

EZCAT maintains high code quality standards to ensure cross-platform stability.

### 1. TypeScript Strictness
- Do not use `any` unless strictly unavoidable for legacy library interfaces. Always define explicit interfaces or type aliases in `src/data/types.ts` or corresponding component files.
- Enable TypeScript validation before committing:
  ```bash
  npx tsc --noEmit
  ```

### 2. React Native & Component Guidelines
- **Functional Components**: Use functional React components with standard hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- **StyleSheet Abstraction**: Place styles inside a dedicated `StyleSheet.create({})` block at the bottom of the component file. Avoid inline style objects inside JSX props to prevent unnecessary re-renders.
- **Design Tokens**: Never hardcode hex values directly into components. Always import design tokens from [src/constants/colors.ts](file:///c:/Users/Lenovo/Downloads/Documents/workspace/EZCAT/src/constants/colors.ts) and [src/constants/typography.ts](file:///c:/Users/Lenovo/Downloads/Documents/workspace/EZCAT/src/constants/typography.ts):
  ```typescript
  import { Colors } from '../constants/colors';
  import { FontFamily } from '../constants/typography';
  ```

### 3. File Naming Rules
| Artifact Type | Convention | Examples |
| :--- | :--- | :--- |
| **React Components** | `PascalCase.tsx` | `MockSessionModal.tsx`, `AppTabBar.tsx` |
| **Expo Router Pages** | `kebab-case.tsx` or `lowercase.tsx` | `index.tsx`, `home.tsx`, `colleges.tsx` |
| **Services & Repositories** | `camelCase.ts` | `aiService.ts`, `questionRepository.ts` |
| **Utilities & Helpers** | `camelCase.ts` | `analyticsEngine.ts`, `progressStorage.ts` |
| **Documentation** | `kebab-case.md` | `getting-started.md`, `database-and-data.md` |

---

## 📝 Commit Message Conventions

We follow Conventional Commits formatting:

```text
<type>(<scope>): <short imperative description>
```

### Allowed Types
- `feat`: A new user-facing feature or screen.
- `fix`: A bug fix in client code or UI.
- `data`: Corrections to question text, options, or answer keys.
- `refactor`: Code reorganization without functional changes.
- `docs`: Documentation updates or additions.
- `chore`: Dependency updates, build configurations, or script maintenance.

### Examples
- `feat(mocks): add section-wise time warnings for CAT mocks`
- `fix(solver): prevent TITA auto-capitalization on Android keyboards`
- `data(pyq): correct answer key for CAT 2022 Slot 1 QA Q14`
- `docs(build): add EAS cloud build instructions for iOS`

---

## 📋 Reporting Issues

EZCAT provides structured GitHub issue templates:

1. 🐛 **Bug Report**: Issues related to UI glitches, crashes, or navigation loops.
2. 📚 **Content & Data Issue**: Flawed questions, missing diagrams, incorrect answer keys, or duplicate questions.
3. ✨ **Feature Request**: Proposals for new practice modes, study analytics, or UI enhancements.

---

## ⚠️ Important Guidelines for Backend & Dataset Contributions

> [!IMPORTANT]
> If you plan to modify [backend/database/schema.sql](file:///c:/Users/Lenovo/Downloads/Documents/workspace/EZCAT/backend/database/schema.sql), [backend/database/build_db.py](file:///c:/Users/Lenovo/Downloads/Documents/workspace/EZCAT/backend/database/build_db.py), or raw dataset sources in `backend/dataset/`:
>
> 1. **Open an Issue First**: Discuss the proposed schema or dataset change with maintainers before opening a PR.
> 2. **Never Commit Flagged Records**: Files inside `backend/dataset/_flagged/` require manual academic audit and must not be compiled into `cat_questions.db`.
> 3. **Run Full Rebuild & Sanity Checks**: Whenever you modify dataset compilation, run:
>    ```bash
>    python backend/database/build_db.py
>    ```
>    Confirm that `assets/cat_questions.db` and `assets/cat_questions.json` are generated cleanly without integrity constraint errors.

---

## ✅ Pre-PR Checklist

Before submitting a Pull Request, verify that your changes pass all local validation checks:

- [ ] **TypeScript Check**: `npx tsc --noEmit` runs with 0 errors.
- [ ] **Web Build Check**: `npx expo export --platform web` completes successfully.
- [ ] **Cross-Platform Verification**: Verified functionality on Web and at least one mobile target (Android or iOS).
- [ ] **No Stale Progress**: Verified that attempt history persists cleanly without console warnings.
- [ ] **Screenshots / Video**: Attached screenshots or GIFs for any UI or visual component modifications.
