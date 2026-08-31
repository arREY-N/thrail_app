# Thrail App — Technical Debt & Audit Checklist

> **Audit Date:** 2026-08-20  
> **Auditor:** Senior React Native Architect  
> **Platform Focus:** Android (Client-facing assessment in ~1–2 months)  
> **Status:** Assessment Phase — Task Assignments & Clarifications Finalized

---

## 👥 Developer Task Assignment Breakdown

Below is the master allocation table separating tasks by developer responsibility.

### 👤 Reyn (Lead / Core Backend & State) — 27 Items
| ID | Severity | Item Description | Status / Note |
|---|---|---|---|
| **C-01** | 🔴 CRITICAL | Admin SDK JSON file check & local cleanup | ✅ **Resolved** (Residual service account key deleted from disk; verified in `.gitignore` & not tracked in Git) |
| **C-02** | 🔴 CRITICAL | Production secrets in `.env` | Architecture check for `EXPO_PUBLIC_STREAM_API_SECRET` |
| **C-05** | 🔴 CRITICAL | `applicationsStore.ts` `load()` dead cache check | ✅ **Resolved** (Cache lookup condition added before fetching) |
| **C-06** | 🔴 CRITICAL | `businessesStore.ts` `create()`/`delete()` wrong state key | ✅ **Resolved** (Updated state mutations to target `state.data`) |
| **C-07** | 🔴 CRITICAL | `reviewStore.ts` Immer listener memory leak | ✅ **Resolved** (Unsubscribe removed from Immer state; module-level tracking & atomic selectors added) |
| **C-08** | 🔴 CRITICAL | `tempHike.tsx` empty route | ✅ **Resolved** (File deleted & route removed from `_layout.tsx`) |
| **C-09** | 🔴 CRITICAL | `onGmailLogIn` async navigation timing | ✅ **Resolved** (Awaited auth methods before routing; error handling added) |
| **H-05** | 🟠 HIGH | `rememberMe` stub & logic removal | ✅ **Resolved** (Neutralized stub in `authStoreCreator.ts`; UI control omitted) |
| **H-06** | 🟠 HIGH | `leaderboards` Firestore security rule | ✅ **Resolved** (Restricted read to auth users and write/delete to superadmin in `firestore.rules`) |
| **H-07** | 🟠 HIGH | `paymentsStore.ts` empty method stubs | Scan codebase for existing payment helpers first |
| **H-10** | 🟠 HIGH | Inconsistent Immer vs Zustand state patterns | Deferred — to be handled during feature folder refactor |
| **M-01** | 🟡 MEDIUM | Zombie store files (`x_authStore`, `x_trailsStore`) | ✅ **Resolved** (Deleted legacy zombie files) |
| **M-02** | 🟡 MEDIUM | 110 TypeScript compile errors | Fix store & data model type errors |
| **M-03** | 🟡 MEDIUM | Dummy data files in bundle | ✅ **Resolved** (Deleted unused dummy data folder from store bundle) |
| **M-04** | 🟡 MEDIUM | `applicationsStore.ts` `.map()` throw usage | Application feature on hold (set as pending feature) |
| **M-05** | 🟡 MEDIUM | `useAppSubscriptions.ts` reviewStore selector | ✅ **Resolved** (Optimized Zustand selectors to atomic hooks) |
| **M-06** | 🟡 MEDIUM | `notificationsStore.ts` optimistic mutation | ✅ **Resolved** (Optimistic read mutation with rollback on error & clean listener management) |
| **M-07** | 🟡 MEDIUM | `fileStore.ts` `window.alert()` crash on Android | ✅ **Resolved** (Removed `window.alert` call; native `Alert.alert` retained) |
| **M-08** | 🟡 MEDIUM | `useMaintenance.ts` default YouTube fallback URL | ✅ **Resolved** (Removed hardcoded YouTube/Rickroll URLs; safe link handling) |
| **M-09** | 🟡 MEDIUM | `businessesStore.ts` refactoring deprecation | Complete migration to `bookingStoreCreator` |
| **M-10** | 🟡 MEDIUM | Unit & integration testing suite | Rebuild test suite alongside feature refactoring |
| **L-01** | 🟢 LOW | 80+ `console.log` statements | Standardize logger & cleanup debug logs |
| **L-02** | 🟢 LOW | Admin SDK JSON Git status check | ✅ **Resolved** (Verified `git ls-files` does not track key file; untracked locally) |
| **L-04** | 🟢 LOW | Dev root artifacts (`tmp_script.js`, `replacements.txt`) | ✅ **Resolved** (`replacements.txt` deleted; `tmp_script.js` preserved) |
| **L-05** | 🟢 LOW | `setSuperAdmin.js` Gitignore duplication | ✅ **Resolved** (Cleaned duplicate entry in `.gitignore`; removed legacy script) |
| **L-08** | 🟢 LOW | Firestore `reviews` update rule vulnerability | ✅ **Resolved** (Restricted create/update/delete rules to author/likes/superadmin in `firestore.rules`) |
| **L-09** | 🟢 LOW | Firebase Config single source of truth | ✅ **Resolved** (Documented JS SDK vs Native Android config mapping) |

---

### 👤 Raven (Native / GPS & Build Specialist) — 8 Items
| ID | Severity | Item Description | Status / Note |
|---|---|---|---|
| **C-03** | 🔴 CRITICAL | Duplicate `TaskManager.defineTask` registration | Consolidate background GPS task definition |
| **H-01** | 🟠 HIGH | `useHikerGPS` AppState/NetInfo listener accumulation | ✅ **Resolved** — Convert to singleton / lifecycle guard (Implemented global active instance listener guard in `TrackHikerGPSFlow.ts`) |
| **H-04** | 🟠 HIGH | Background GPS `addCoordinate` fire-and-forget loss | ✅ **Resolved** — Ensure durable background writing & error catching (Switched `locationTask.ts` to `getState()`, safe profile checks & background write error handling) |
| **H-08** | 🟠 HIGH | `TrailMap.native.tsx` untyped `any` props | ✅ **Resolved** — Add strict types for map props & camera ref (Added strict `TrailMapProps`, `TrailMapRef`, `HikerLocation` interfaces & component display name) |
| **H-09** | 🟠 HIGH | Dev weather override block in `weatherRepository.ts` | ✅ **Resolved** — Clean up override logic before client builds (Removed hardcoded `applyDevOverrides` mock logic, returning live Open-Meteo & cached data) |
| **L-03** | 🟢 LOW | `pmtiles.exe` (58 MB) committed binary | Remove executable from repo & track in `.gitignore` |
| **L-06** | 🟢 LOW | Release build using debug keystore | Configure production signing configs in Gradle |
| **L-07** | 🟢 LOW | ProGuard / R8 minification disabled in release | Enable `enableMinifyInReleaseBuilds` & test build |

---

### 👤 Emman (UI / Components & App Shell) — 5 Items
> *Note: For the dedicated frontend audit & resolution breakdown across `src/components/` and `src/features/`, see [`FRONTEND_CHECKLIST.md`](./FRONTEND_CHECKLIST.md).*

| ID | Severity | Item Description | Status / Note |
|---|---|---|---|
| **C-04** | 🔴 CRITICAL | `SplashScreen.preventAutoHideAsync()` on every render | ✅ **Resolved** (Hoisted to module level outside `RootLayout` in `src/app/_layout.tsx`) |
| **H-02** | 🟠 HIGH | `PostCard.tsx` subscribes to full trail list | ✅ **Resolved** (Targeted atomic selector with `useCallback` by trail ID/name) |
| **H-05** | 🟠 HIGH | `rememberMe` UI controls | ✅ **Resolved** (UI control omitted from login view) |
| **M-11** | 🟡 MEDIUM | `PostCard.tsx` `review` prop typed as `any` | ✅ **Resolved** (Strictly typed with canonical `Review` / `IReview` interfaces) |
| **L-10** | 🟢 LOW | All six icon font families loaded synchronously at boot | ✅ **Resolved** (Audited icon families across `CustomIcon` and guarded via `fontsLoaded` / `fontError`) |

---

## 📋 Comprehensive Item Details & Audit Findings

---

### 🔴 CRITICAL

#### C-01 — Firebase Admin SDK Private Key Committed to Repository
- **Assigned To:** Reyn
- **File(s):** `thrail-firebase-adminsdk-fbsvc-33f49603dc.json`
- **Status:** ✅ **Resolved**
- **Description:** Verified keys are properly rotated and not tracked by Git (`git ls-files`). Residual local file has been removed from disk.

#### C-02 — Production API Keys & Stream Secret Exposed in `.env`
- **Assigned To:** Reyn
- **File(s):** `.env`
- **Description:** `.env` contains `EXPO_PUBLIC_STREAM_API_SECRET`.
- **Architectural Note:** `EXPO_PUBLIC_` variables are compiled into the JavaScript bundle sent to client devices. Even with `.gitignore`, secrets can be extracted from APKs. Move Stream secret to server-side Cloud Functions.

#### C-03 — Duplicate `TaskManager.defineTask` Registration
- **Assigned To:** Raven
- **File(s):** `src/core/hook/trail/useHikerGPS.ts`, `src/core/utility/locationTask.ts`
- **Description:** `TaskManager.defineTask` called in two files for `"background-location-task"`. `locationTask.ts` uses static `getInitialState()`.

#### C-04 — `SplashScreen.preventAutoHideAsync()` Called Inside Component Body
- **Assigned To:** Emman
- **File(s):** `src/app/_layout.tsx` (line 26)
- **Status:** ✅ **Resolved**
- **Description:** Hoisted `SplashScreen.preventAutoHideAsync()` to the module level outside the `RootLayout` component body so it executes once at module load time rather than on every layout render.

#### C-05 — `applicationsStore.ts` `load()` Cache Check is Dead Code
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/applicationsStore.ts`
- **Status:** ✅ **Resolved**
- **Description:** Added condition to only fetch from repository when application is not found in in-memory state.

#### C-06 — `businessesStore.ts` `create()` and `delete()` Write to Non-Existent `businesses` Key
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/businessesStore.ts`
- **Status:** ✅ **Resolved**
- **Description:** Corrected mutations in `create()` and `delete()` to write directly to `state.data` using `upsertItem` and `filter`.

#### C-07 — `reviewStore` Leaking Real-Time Firestore Listener
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/reviewStore.ts`, `src/core/hook/useAppSubscriptions.ts`
- **Status:** ✅ **Resolved**
- **Description:** Unsubscribe callback stored inside Immer-frozen state has been removed. Active listener is managed via module-level reference with cleanup upon resubscribing/teardown, and `useAppSubscriptions` uses selective Zustand selectors.

#### C-08 — `tempHike.tsx` Empty Screen Registered as a Route
- **Assigned To:** Reyn
- **File(s):** `src/app/(auth)/tempHike.tsx`, `src/app/(auth)/_layout.tsx`
- **Status:** ✅ **Resolved**
- **Description:** Deleted `tempHike.tsx` and removed its entry from the `AuthLayout` stack.

#### C-09 — `onGmailLogIn` Navigates Before Async Auth Completes
- **Assigned To:** Reyn
- **File(s):** `src/core/hook/user/useAuthHook.ts`
- **Status:** ✅ **Resolved**
- **Description:** Added `await` to `gmailSignUp()` and `logIn()` before navigating with `router.push('/(tabs)')`, and added centralized `catchError` and local error state handling.

---

### 🟠 HIGH

#### H-01 — `useHikerGPS.ts` AppState/NetInfo Listener Accumulation
- **Assigned To:** Raven
- **File(s):** `src/core/flows/TrackHikerGPSFlow.ts`
- **Status:** ✅ **Resolved**
- **Description:** Implemented global module-scoped active instance count and shared listener reference for `AppState` and `NetInfo` in `TrackHikerGPSFlow.ts`, ensuring multiple hook callers (`TrailMap.native.tsx`, `useCurrentHike.ts`) share a single set of background/resume event listeners.

#### H-02 — `PostCard.tsx` Subscribes to Full Trail List
- **Assigned To:** Emman
- **File(s):** `src/components/PostCard.tsx`
- **Status:** ✅ **Resolved**
- **Description:** Replaced broad `s.data` array subscription with a targeted atomic selector in `useTrailsStore` that matches exclusively on the card's `legacyTrailId` and `legacyTrailName`, preventing feed-wide re-renders when other trails are updated.

#### H-03 — Auth Store Teardown Race Condition
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/authStores/authStoreCreator.ts`

#### H-04 — Background Task `addCoordinate` Fire-and-Forget Loss
- **Assigned To:** Raven
- **File(s):** `src/core/models/Hike/stores/hikeStoreCreator.ts`, `src/core/utility/locationTask.ts`, `src/core/flows/TrackHikerGPSFlow.ts`
- **Status:** ✅ **Resolved**
- **Description:** Updated `locationTask.ts` to access live `getState()`, safely guarded `addCoordinate` against null profiles/hikes without throwing uncaught errors, and wrapped batch coordinate writes and live location sharing in try/catch blocks.

#### H-05 — `rememberMe` Stub & Feature Removal
- **Assigned To:** Reyn (Core Logic) / Emman (UI Component)
- **File(s):** `src/core/stores/authStores/authStoreCreator.ts`
- **Status:** ✅ **Resolved**
- **Description:** Neutralized the stub in `authStoreCreator.ts` and cleared placeholder error states; UI controls are omitted from the form layout.

#### H-06 — `leaderboards` Firestore Unauthenticated Access
- **Assigned To:** Reyn
- **File(s):** `firestore.rules`
- **Status:** ✅ **Resolved**
- **Description:** Updated rule to allow reads only for authenticated users (`request.auth != null`), and mutations (create/update/delete) only for superadmins (`request.auth.token.role == 'superadmin'`).

#### H-07 — `paymentsStore.ts` Core Payment Methods Are Empty Stubs
- **Assigned To:** Reyn
- **Plan:** Perform codebase scan to locate existing payment helper functions before implementing.

#### H-08 — `TrailMap.native.tsx` Untyped `any` Props
- **Assigned To:** Raven
- **File(s):** `src/features/Map/TrailMap.native.tsx`
- **Status:** ✅ **Resolved**
- **Description:** Added canonical TypeScript `TrailMapProps`, `TrailMapRef`, and `HikerLocation` interfaces, replaced `any` parameters across camera ref and region change handlers, and attached `TrailMap.displayName`.

#### H-09 — Dev Weather Override Block
- **Assigned To:** Raven
- **File(s):** `src/core/repositories/weatherRepository.ts`
- **Status:** ✅ **Resolved**
- **Description:** Removed hardcoded `applyDevOverrides` mock logic from `weatherRepository.ts` so live Open-Meteo API forecasts and cached entries are returned without developer condition overrides.

#### H-10 — Inconsistent Immer vs Zustand Mutation Patterns
- **Assigned To:** Reyn
- **Status:** Deferred — will be resolved during upcoming feature folder refactoring.

---

### 🟡 MEDIUM

#### M-01 — Two Zombie Store Files (`x_authStore`, `x_trailsStore`)
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Deleted unused legacy store files `x_authStore.ts` and `x_trailsStore.ts`.

#### M-02 — 110 TypeScript Compile Errors
- **Assigned To:** Reyn

#### M-03 — Dummy Data Files in Production Bundle
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Removed unused dummy mock fixtures (`src/core/stores/dummy`) from the production state bundle.

#### M-04 — `applicationsStore.ts` `.map()` Throw Usage
- **Assigned To:** Reyn
- **Status:** Feature on hold (single client directive); mark as pending feature.

#### M-05 — `useAppSubscriptions.ts` Subscribes to Full Review Store
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Converted store hooks to fine-grained atomic selectors for `reviewStore`, `notificationsStore`, `bookingsStore`, and `trailsStore`.

#### M-06 — `notificationsStore` Optimistic Mutation Without Rollback
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/notificationsStore.ts`
- **Status:** ✅ **Resolved**
- **Description:** Implemented optimistic update for `readNotification` with automatic rollback on error in the catch block. Removed Immer-frozen unsubscribe callback and added module-level listener tracking.

#### M-07 — `fileStore.ts` Calls `window.alert()`
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/fileStore.ts`
- **Status:** ✅ **Resolved**
- **Description:** Removed un-guarded `window.alert` call on Android/native that caused crashes on storage quota errors; native `Alert.alert` is retained.

#### M-08 — `useMaintenance.ts` Default YouTube Fallback URL
- **Assigned To:** Reyn
- **File(s):** `src/core/hook/useMaintenance.ts`, `src/app/maintenance.tsx`
- **Status:** ✅ **Resolved**
- **Description:** Removed hardcoded YouTube music / Rickroll fallback URLs. Defaulted `url` state to `null` with safe link validation and optional watermark press handler.

#### M-09 — `businessesStore.ts` Refactoring Deprecation Note
- **Assigned To:** Reyn

#### M-10 — Unit & Integration Test Suite
- **Assigned To:** Reyn
- **Plan:** Build out test suite iteratively during feature refactoring.

#### M-11 — `PostCard.tsx` `review` Prop Typed as `any`
- **Assigned To:** Emman
- **File(s):** `src/components/PostCard.tsx`
- **Status:** ✅ **Resolved**
- **Description:** Replaced untyped `review: any;` with canonical typed `Review` and `IReview` interfaces from `@/src/core/models/Review/Review`, restoring compile-time type safety across the component.

---

### 🟢 LOW

#### L-01 — Pervasive `console.log` Debug Statements
- **Assigned To:** Reyn

#### L-02 — Admin SDK JSON Git Status Check
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Verified via `git ls-files` that service account JSON files were never tracked in git history; file removed locally.

#### L-03 — `pmtiles.exe` (58 MB) Committed Binary
- **Assigned To:** Raven

#### L-04 — Root Development Artifacts (`tmp_script.js`, `replacements.txt`)
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Removed `replacements.txt` from repository root. `tmp_script.js` was preserved per developer requirements.

#### L-05 — `setSuperAdmin.js` Gitignore Duplication
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Removed duplicated line in `.gitignore` and removed the legacy root `setSuperAdmin.js` script.

#### L-06 — Release APK Signed with Debug Keystore
- **Assigned To:** Raven

#### L-07 — ProGuard / R8 Minification Disabled in Release
- **Assigned To:** Raven

#### L-08 — Firestore `reviews` Collection Update Rule Vulnerability
- **Assigned To:** Reyn
- **File(s):** `firestore.rules`
- **Status:** ✅ **Resolved**
- **Description:** Restricted review `create` to matching author UID, `update` to review author or `likes`/`updatedAt` field edits only, and `delete` to author or superadmin with valid `resource.data` check.

#### L-09 — Firebase Config Duplicated Across `google-services.json` and `.env`
- **Assigned To:** Reyn
- **Status:** ✅ **Resolved**
- **Description:** Standardized architecture mapping: `.env` environment variables feed the cross-platform JS SDK via `Firebase.js`, while `google-services.json` is preserved for native Android Gradle build integrations.

#### L-10 — Icon Font Families Synchronous Boot Loading
- **Assigned To:** Emman
- **File(s):** `src/app/_layout.tsx`, `src/components/CustomIcon.tsx`
- **Status:** ✅ **Resolved**
- **Description:** Audited vector icon font usage across the application. All 6 icon libraries (`AntDesign`, `Feather`, `FontAwesome5`, `FontAwesome6`, `Ionicons`, `MaterialCommunityIcons`) are actively utilized by `CustomIcon` and UI components. Verified that `useFonts` initialization is properly guarded with `fontsLoaded || fontError` splash screen dismissal so boot is never blocked.

---

### 🎨 Frontend UI & Components (Emman — FE Items)

#### FE-01 — Conditional React Hooks in `PostCard.tsx` & `HikeRecordingScreen.tsx`
- **Assigned To:** Emman
- **File(s):** `src/components/PostCard.tsx`, `src/features/Navigation/screens/HikeRecordingScreen.tsx`
- **Description:** React hooks (`useScrollFades`, `useMemo`, `useTrailsStore`, `useWebDragScroll`) called after early return (`if (!review) return null;`) in `PostCard.tsx` and after `if (Platform.OS === 'web')` in `HikeRecordingScreen.tsx`.
- **Fix:** Move all hook calls to the top of the component body before any conditional branches or early returns.

#### FE-02 — Obsolete `i18next` Rule Disable Comments
- **Assigned To:** Emman
- **File(s):** `src/components/EmergencyNotification.tsx`, `src/components/PostCard.tsx`
- **Description:** `/* eslint-disable i18next/no-literal-string */` causes ESLint error because the `i18next` plugin is not configured.
- **Fix:** Remove the obsolete comment lines.

#### FE-03 — `TrailMap` Missing `displayName` for `forwardRef`
- **Assigned To:** Emman
- **File(s):** `src/features/Map/TrailMap.tsx`, `src/features/Map/TrailMap.native.tsx`
- **Description:** `forwardRef` component missing `displayName`, triggering `react/display-name`.
- **Fix:** Assign `TrailMap.displayName = 'TrailMap';` before export.

#### FE-04 — `children` Passed as JSX Props
- **Assigned To:** Emman
- **File(s):** `src/features/Navigation/screens/HikeRecordingScreen.tsx`, `src/features/Navigation/screens/NavigationScreen.tsx`, `src/features/Profile/screens/ApplyScreen.tsx`
- **Description:** `children={undefined}` explicitly passed as an attribute to `CustomHeader`, `ConfirmationModal`, and `SelectionOption`.
- **Fix:** Remove `children={undefined}` attribute or nest children elements properly inside tags.

#### FE-05 — Unescaped JSX Entities (`'`, `"`)
- **Assigned To:** Emman
- **File(s):** `src/features/Auth/components/MountainSelectChip.tsx`, `src/features/Auth/screens/ForgotPasswordScreen.tsx`, `src/features/Navigation/screens/NavigationScreen.tsx`, `src/features/Navigation/screens/HikeRecordingScreen.tsx`, `src/features/Settings/screens/HelpSupportScreen.tsx`
- **Description:** Unescaped quotes and apostrophes in raw JSX text triggering `react/no-unescaped-entities`.
- **Fix:** Escape with `&apos;`, `&quot;`, or wrap text in string literals (e.g. `{"we'll"}`).

#### FE-06 — TypeScript Import Renames & Reducer Types in `src/features/`
- **Assigned To:** Emman
- **File(s):** Multiple files in `src/features/Admin/`, `src/features/Book/`, `src/features/Community/`, `src/features/Navigation/`, `src/features/Map/`
- **Description:** References to old `IBooking` / `IUser` type names and `createBooking` factory name, along with implicit `any` reducer parameters `(sum, p)`.
- **Fix:** Rename imports to `Booking` / `User` and `newBooking`, type reducers with `(sum: number, p: any)`.

#### FE-07 — ESLint Warnings Cleanup in `src/components/` & `src/features/`
- **Assigned To:** Emman
- **File(s):** `src/components/`, `src/features/`
- **Description:** Unused variables/imports (`@typescript-eslint/no-unused-vars`), `Array<T>` generic notation (`@typescript-eslint/array-type`), and unnecessary dependencies in `useCallback`.
- **Fix:** Remove unused imports/vars, migrate `Array<T>` to `T[]`, and clean hook dependency arrays.

---

*Checklist updated per developer feedback and role assignments.*
