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
| **C-01** | 🔴 CRITICAL | Admin SDK JSON file check & local cleanup | Verified in Git ignore; remove local residual file |
| **C-02** | 🔴 CRITICAL | Production secrets in `.env` | Architecture check for `EXPO_PUBLIC_STREAM_API_SECRET` |
| **C-05** | 🔴 CRITICAL | `applicationsStore.ts` `load()` dead cache check | Ready for quick fix |
| **C-06** | 🔴 CRITICAL | `businessesStore.ts` `create()`/`delete()` wrong state key | Ready for quick fix |
| **C-07** | 🔴 CRITICAL | `reviewStore.ts` Immer listener memory leak | Ready for quick fix |
| **C-08** | 🔴 CRITICAL | `tempHike.tsx` empty route | **Approved to delete now** |
| **C-09** | 🔴 CRITICAL | `onGmailLogIn` async navigation timing | **Ready for fix now** |
| **H-05** | 🟠 HIGH | `rememberMe` stub & logic removal | Remove feature logic in core (UI part under Emman) |
| **H-06** | 🟠 HIGH | `leaderboards` Firestore security rule | Update `firestore.rules` |
| **H-07** | 🟠 HIGH | `paymentsStore.ts` empty method stubs | Scan codebase for existing payment helpers first |
| **H-10** | 🟠 HIGH | Inconsistent Immer vs Zustand state patterns | Deferred — to be handled during feature folder refactor |
| **M-01** | 🟡 MEDIUM | Zombie store files (`x_authStore`, `x_trailsStore`) | Clean up archived files |
| **M-02** | 🟡 MEDIUM | 110 TypeScript compile errors | Fix store & data model type errors |
| **M-03** | 🟡 MEDIUM | Dummy data files in bundle | Move `src/core/stores/dummy` to mocks/fixtures |
| **M-04** | 🟡 MEDIUM | `applicationsStore.ts` `.map()` throw usage | Application feature on hold (set as pending feature) |
| **M-05** | 🟡 MEDIUM | `useAppSubscriptions.ts` reviewStore selector | Optimize Zustand selector |
| **M-06** | 🟡 MEDIUM | `notificationsStore.ts` optimistic mutation | Implement rollback on error |
| **M-07** | 🟡 MEDIUM | `fileStore.ts` `window.alert()` crash on Android | Remove `window.alert` call |
| **M-08** | 🟡 MEDIUM | `useMaintenance.ts` default YouTube fallback URL | Clean up fallback state |
| **M-09** | 🟡 MEDIUM | `businessesStore.ts` refactoring deprecation | Complete migration to `bookingStoreCreator` |
| **M-10** | 🟡 MEDIUM | Unit & integration testing suite | Rebuild test suite alongside feature refactoring |
| **L-01** | 🟢 LOW | 80+ `console.log` statements | Standardize logger & cleanup debug logs |
| **L-02** | 🟢 LOW | Admin SDK JSON Git status check | Verify `git ls-files` |
| **L-04** | 🟢 LOW | Dev root artifacts (`tmp_script.js`, `replacements.txt`) | **Approved to delete** |
| **L-05** | 🟢 LOW | `setSuperAdmin.js` Gitignore duplication | Clean up `.gitignore` duplicates & file |
| **L-08** | 🟢 LOW | Firestore `reviews` update rule vulnerability | Restrict `update` rule in `firestore.rules` |
| **L-09** | 🟢 LOW | Firebase config duplication in `.env` | Consolidate single source of truth |

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
| **H-05** | 🟠 HIGH | `rememberMe` UI controls | Remove or hide UI element (core logic handled by Reyn) |
| **M-11** | 🟡 MEDIUM | `PostCard.tsx` `review` prop typed as `any` | Replace with canonical `Review` prop interface |
| **L-10** | 🟢 LOW | All six icon font families loaded synchronously at boot | Audit icon usage & lazy-load or consolidate families |

---

## 📋 Comprehensive Item Details & Audit Findings

---

### 🔴 CRITICAL

#### C-01 — Firebase Admin SDK Private Key Committed to Repository
- **Assigned To:** Reyn
- **File(s):** `thrail-firebase-adminsdk-fbsvc-33f49603dc.json`
- **Description:** A service account key file exists on disk.
- **Verification Note:** Keys were rotated and not on remote GitHub. Remove residual file locally.

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
- **File(s):** `src/core/stores/applicationsStore.ts` (lines 71–75)
- **Description:** Unconditionally fetches from Firestore after checking in-memory cache.

#### C-06 — `businessesStore.ts` `create()` and `delete()` Write to Non-Existent `businesses` Key
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/businessesStore.ts` (lines 151–155, 179–182)
- **Description:** Writes to `state.businesses` instead of `state.data`, leaving UI out of sync.

#### C-07 — `reviewStore` Leaking Real-Time Firestore Listener
- **Assigned To:** Reyn
- **File(s):** `src/core/stores/reviewStore.ts`, `src/core/hook/useAppSubscriptions.ts`
- **Description:** Unsubscribe callback stored inside Immer-frozen state.

#### C-08 — `tempHike.tsx` Empty Screen Registered as a Route
- **Assigned To:** Reyn
- **File(s):** `src/app/(auth)/tempHike.tsx`
- **Status:** **Approved for deletion.**

#### C-09 — `onGmailLogIn` Navigates Before Async Auth Completes
- **Assigned To:** Reyn
- **File(s):** `src/core/hook/user/useAuthHook.ts` (lines 52–60)
- **Status:** **Approved for fix.**

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
- **Plan:** Remove feature logic in core store; Emman to adjust/remove UI components.

#### H-06 — `leaderboards` Firestore Unauthenticated Access
- **Assigned To:** Reyn
- **File(s):** `firestore.rules`

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

#### M-02 — 110 TypeScript Compile Errors
- **Assigned To:** Reyn

#### M-03 — Dummy Data Files in Production Bundle
- **Assigned To:** Reyn

#### M-04 — `applicationsStore.ts` `.map()` Throw Usage
- **Assigned To:** Reyn
- **Status:** Feature on hold (single client directive); mark as pending feature.

#### M-05 — `useAppSubscriptions.ts` Subscribes to Full Review Store
- **Assigned To:** Reyn

#### M-06 — `notificationsStore` Optimistic Mutation Without Rollback
- **Assigned To:** Reyn

#### M-07 — `fileStore.ts` Calls `window.alert()`
- **Assigned To:** Reyn

#### M-08 — `useMaintenance.ts` Default YouTube Fallback URL
- **Assigned To:** Reyn

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

#### L-03 — `pmtiles.exe` (58 MB) Committed Binary
- **Assigned To:** Raven

#### L-04 — Root Development Artifacts (`tmp_script.js`, `replacements.txt`)
- **Assigned To:** Reyn
- **Status:** **Approved for immediate deletion.**

#### L-05 — `setSuperAdmin.js` Gitignore Duplication
- **Assigned To:** Reyn

#### L-06 — Release APK Signed with Debug Keystore
- **Assigned To:** Raven

#### L-07 — ProGuard / R8 Minification Disabled in Release
- **Assigned To:** Raven

#### L-08 — Firestore `reviews` Collection Update Rule Vulnerability
- **Assigned To:** Reyn

#### L-09 — Firebase Config Duplicated Across `google-services.json` and `.env`
- **Assigned To:** Reyn

#### L-10 — Icon Font Families Synchronous Boot Loading
- **Assigned To:** Emman

---

*Checklist updated per developer feedback and role assignments.*
