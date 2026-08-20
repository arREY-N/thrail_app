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
| **H-01** | 🟠 HIGH | `useHikerGPS` AppState/NetInfo listener accumulation | Convert to singleton / lifecycle guard |
| **H-04** | 🟠 HIGH | Background GPS `addCoordinate` fire-and-forget loss | Ensure durable background writing & error catching |
| **H-08** | 🟠 HIGH | `TrailMap.native.tsx` untyped `any` props | Add strict types for map props & camera ref |
| **H-09** | 🟠 HIGH | Dev weather override block in `weatherRepository.ts` | Clean up override logic before client builds |
| **L-03** | 🟢 LOW | `pmtiles.exe` (58 MB) committed binary | Remove executable from repo & track in `.gitignore` |
| **L-06** | 🟢 LOW | Release build using debug keystore | Configure production signing configs in Gradle |
| **L-07** | 🟢 LOW | ProGuard / R8 minification disabled in release | Enable `enableMinifyInReleaseBuilds` & test build |

---

### 👤 Emman (UI / Components & App Shell) — 5 Items
| ID | Severity | Item Description | Status / Note |
|---|---|---|---|
| **C-04** | 🔴 CRITICAL | `SplashScreen.preventAutoHideAsync()` on every render | Move outside component body or to single `useEffect` |
| **H-02** | 🟠 HIGH | `PostCard.tsx` subscribes to full trail list | Optimize selector / pass trail data as props |
| **H-05** | 🟠 HIGH | `rememberMe` UI controls | ✅ **Resolved** (UI control omitted from login view) |
| **M-11** | 🟡 MEDIUM | `PostCard.tsx` `review` prop typed as `any` | Replace with canonical `Review` prop interface |
| **L-10** | 🟢 LOW | All six icon font families loaded synchronously at boot | Audit icon usage & lazy-load or consolidate families |

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
- **File(s):** `src/app/_layout.tsx` (line 31)
- **Description:** Re-executes on every root layout render.

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
- **File(s):** `src/core/hook/trail/useHikerGPS.ts`

#### H-02 — `PostCard.tsx` Subscribes to Full Trail List
- **Assigned To:** Emman
- **File(s):** `src/components/PostCard.tsx`

#### H-03 — Auth Store Teardown Race Condition
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/authStores/authStoreCreator.ts`

#### H-04 — Background Task `addCoordinate` Fire-and-Forget Loss
- **Assigned To:** Raven
- **File(s):** `src/core/stores/hikeStores/hikeStoreCreator.ts`, `src/core/hook/trail/useHikerGPS.ts`

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

#### H-09 — Dev Weather Override Block
- **Assigned To:** Raven
- **File(s):** `src/core/repositories/weatherRepository.ts`

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

---

*Checklist updated per developer feedback and role assignments.*
