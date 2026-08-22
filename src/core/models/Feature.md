# Feature Folder Structure

This document describes the recommended structure for a model feature folder under `src/core/models`.

> Note: Some folders are still in transition. Not every feature currently contains all sections below.

## Standard Feature Folder Structure

```text
XFeature/
├─ interfaces/
│  └─ X.types.ts
├─ repositories/
│  └─ XRepository.ts
├─ stores/
│  ├─ XStoreCreator.ts
│  ├─ XStore.native.ts
│  ├─ XStore.web.ts
│  └─ XStore.ts
├─ hooks/
│  ├─ useX.ts
│  ├─ useXItem.ts
│  └─ useXList.ts
├─ utils/
│  └─ XFactory.ts
├─ __tests__/
└─ X.ts
```

---

## Component Responsibilities

### `X.ts` (Facade)
- **The ONLY code file allowed at the root level of the feature directory.** (Markdown documentation files like `X.md` / `XFeature.md` are permitted at the root to help developers understand the feature).
- Serves as the single public entry point through which **other features** consume this feature. No external module should reach into internal subdirectories (`hooks/`, `stores/`, `repositories/`, `utils/`, etc.) directly — always import from `X.ts`.
- Placing all other code files into subdirectories guarantees that ESLint's `no-restricted-imports` rule can target root level files cleanly without accidentally misidentifying internal utilities (like factories) as facades.
- **Exports:**
  - **Hooks** — Primary path for cross-feature UI consumption (`useX`, `useXItem`, `useXList`).
  - **Repositories** — Re-exported initialized repository (`XRepo`) from `@/src/core/init/repositories` for cross-feature **non-UI** access (e.g., background services or external stores).
  - **Types/Interfaces & Factory Constructors** — Re-exported from `interfaces/` and `utils/XFactory.ts` for safe, shareable usage across features.
  - **Stores** — Selectors only (or store hooks) to limit access to certain store functions rather than full arbitrary mutations.

### `interfaces/`
- Defines model type contracts, domain models, and shared interfaces.
- May include separate DB-facing types (e.g., Firestore schema mappings).

### `repositories/`
- Contains data-access implementations structured as factory functions accepting the Firestore instance: `export const XRepository = (db: any) => ({ ... })`.
- Encapsulates database queries/writes and keeps DB details out of UI/store logic.
- Registered and initialized centrally in `src/core/init/repositories.ts` as `export const XRepo = XRepository(db);`.

### `stores/`
- Zustand store layer for feature state and actions.
- Accesses data by importing the initialized repository `XRepo` directly from `@/src/core/init/repositories`.
- **Entire store is never exported through `X.ts`** or imported directly by another feature.
- Expected files:
  - `XStoreCreator.ts`: Base store logic and actions.
  - `XStore.native.ts`: Native store wiring (with persistence).
  - `XStore.web.ts`: Web store wiring.
  - `XStore.ts`: Fallback export file.
- Any store using `persist` must explicitly decide how staleness is handled (e.g., trust cache vs. refetch in background).
- Fetch/write actions own their own dedup guards (e.g., "already loaded," "already in-flight").

### `hooks/`
- Feature-specific hooks that compose store/repository/model logic for UI consumption.
- Asynchronous store calls inside `useEffect` must be wrapped in an inner async function to preserve React cleanup return types:
  ```ts
  useEffect(() => {
      const fetch = async () => {
          await useXStore.getState().load(id);
      };
      fetch();
  }, [id]);
  ```
- Split by intent and cardinality:
  - `useX.ts` -> Write/mutation actions (create, update, delete).
  - `useXItem.ts` -> Fetch single resource (keyed by ID).
  - `useXList.ts` -> Fetch collection/list resource.
  - `usePurposeX.ts` -> Specialized domain workflows (e.g., admin actions).

### `utils/`
- Pure utility functions, domain validation rules, and feature helpers.
- **`XFactory.ts`:**
  - Located strictly inside `utils/` (e.g., `utils/XFactory.ts`) to prevent ESLint path pattern conflicts.
  - Defines runtime model instantiation and data transformation logic (e.g., Date <-> Timestamp conversions).
  - Internal to the feature. Re-exported through `X.ts` where external instantiation is required.

### `__tests__/` (Optional)
- Unit, integration, or e2e tests for the feature module.

---

## Cross-Feature Access Summary

| Layer | Location | Exposed via `X.ts`? | Who calls it, and how |
|---|---|---|---|
| **Facade** | `X.ts` (Root) | — | Public entry point for all cross-feature access. |
| **Hooks** | `hooks/` | ✅ Yes | Other features' UI components & hooks. |
| **Repositories** | `repositories/` -> `src/core/init/repositories.ts` | ✅ Yes (`XRepo`) | External non-UI services/stores needing direct data access. |
| **Interfaces & Factory** | `interfaces/`, `utils/XFactory.ts` | ✅ Yes (Re-exported) | Shared type contracts and model constructors. |
| **Stores** | `stores/` | ❌ Limited | Selectors / specific store hooks only. |

---

## Feature Refactoring Step-by-Step Guide

When refactoring or creating a model feature folder, follow these steps:

### 1. Folder Structure Audit & Cleanup
- Check that all standard subdirectories exist:
  - `interfaces/`
  - `repositories/`
  - `stores/`
  - `hooks/`
  - `utils/`
  - `__tests__/` (optional)
- Remove any non-standard directories or misplaced files.
- Ensure `X.ts` is the **only code file** at the root level of the feature directory (markdown documentation files like `X.md` are permitted).

### 2. Interfaces Layer (`interfaces/`)
- Define clean type contracts:
  - Base interface: `IXBase<T>` parameterized by timestamp/date type `T`.
  - Date-based client model: `export type X = IXBase<Date>;` (and `export type IX = X;` for backward compatibility).
  - Firestore DB model: `export type IXDB = IXBase<Timestamp | FieldValue>;`.

### 3. Factory & Data Converter (`utils/XFactory.ts`)
- **Plain JavaScript Object**: Convert from class-based approaches to plain object factories.
- **Factory Function**: Implement and export `newX(init?: Partial<X>): X` returning the default initialized object.
- **Hidden Firestore Mappers**: Implement `xFromFirestore(id: string, data: IXDB): X` and `xToFirestore(item: X): IXDB` as private (unexported) helpers.
- **Converter**: Implement and export `xConverter: FirestoreDataConverter<X>` utilizing the internal mapper functions.
- **Strict Export Surface**: Only expose `newX` and `xConverter` from `XFactory.ts`.

### 4. Repositories Layer (`repositories/`) & Central Initialization
- Implement repository as a factory function receiving `db`: `export const XRepository = (db: any) => ({ ... })`.
- Register the initialized instance in `src/core/init/repositories.ts`: `export const XRepo = XRepository(db);`.

### 5. Stores Layer (`stores/`)
Follow the standard **4-file store pattern**:
- **`XStoreCreator.ts`**: Implements the base store logic, initial state, and actions using `StateCreator<XState, [["zustand/immer", never]]>`. Imports and calls `XRepo` from `@/src/core/init/repositories`. Uses `newX()` for default model instances instead of class constructors.
- **`XStore.native.ts`**: Mobile/native wiring using `zustand/middleware` `persist` with `AsyncStorage` (`name: "x-storage"`).
- **`XStore.web.ts`**: Web platform wiring without native storage persistence.
- **`XStore.ts`**: Fallback export file re-exporting `* from "./XStore.native"`.

### 6. Hooks Layer (`hooks/`)
- Update store and hook type signatures to import types from `interfaces/` or the facade `X.ts`.
- Split hooks by intent (`useX` for mutations, `useXItem` for single items, `useXList` for collections).
- Wrap async store calls inside `useEffect` with an inner `async` function.

### 7. Facade Organization (`X.ts`)
- Group and re-export public APIs cleanly:
  - **TYPES**: `export * from "@/src/core/models/X/interfaces/X.types";`
  - **FACTORY & CONVERTER**: `export { newX, xConverter } from "@/src/core/models/X/utils/XFactory";`
  - **STORES**: `export { useXStore } from "@/src/core/models/X/stores/XStore";`
  - **HOOKS**: `export { useX, useXItem, useXList } from "@/src/core/models/X/hooks/...";`
  - **REPOSITORIES**: `export { XRepo } from "@/src/core/init/repositories";`

---

## Refactor Status by Model

| Model | Refactored Already | Underway | Not Yet |
|---|:---:|:---:|:---:|
| Admin | [x] | [ ] | [ ] |
| Application | [x] | [ ] | [ ] |
| Booking | [x] | [ ] | [ ] |
| Business | [x] | [ ] | [ ] |
| Cancellation | [ ] | [x] | [ ] |
| Group | [x] | [ ] | [ ] |
| Hike | [x] | [ ] | [ ] |
| Leaderboard | [ ] | [x] | [ ] |
| Location | [ ] | [ ] | [x] |
| Message | [ ] | [ ] | [x] |
| Mountain | [x] | [ ] | [ ] |
| Notification | [x] | [ ] | [ ] |
| Offer | [x] | [ ] | [ ] |
| Payment | [ ] | [ ] | [x] |
| Recommendation | [x] | [ ] | [ ] |
| Reschedule | [x] | [ ] | [ ] |
| Review | [x] | [ ] | [ ] |
| Trail | [x] | [ ] | [ ] |
| User | [ ] | [ ] | [x] |

*> Note: `Cancellation` has been moved to **Underway** so its factory files can be relocated to `utils/XFactory.ts` to align with the new single-root facade rule.*

---

## Lessons Learned & Refactoring Anti-Patterns

This section tracks mistakes identified during model refactoring sessions to prevent repeating them in future refactoring tasks.

### 1. Cross-Feature Imports Must ALWAYS Use the Root Facade (`X.ts`)
- ❌ **Mistake:** Reaching into internal subdirectories of another model feature to import types, logic, utilities, or repositories:
  ```ts
  // ❌ WRONG - Reaching into internal subdirectories of other features
  import { IOfferBase } from "@/src/core/models/Offer/interfaces/Offer.types";
  import { ITrailSummary } from "@/src/core/models/Trail/interfaces/Trail.types";
  import { IUserSummary } from "@/src/core/models/User/interfaces/User.types";
  import { UserLogic } from "@/src/core/models/User/logic/User.logic";
  ```
- ✅ **Correction:** Always import cross-feature symbols directly through the other feature's root facade file (`X.ts`):
  ```ts
  // ✅ CORRECT - Consuming exclusively through root facades
  import { IOfferBase } from "@/src/core/models/Offer/Offer";
  import { ITrailSummary } from "@/src/core/models/Trail/Trail";
  import { IUserSummary, UserLogic } from "@/src/core/models/User/User";
  ```
- **Rule:** Only internal files of feature `X` may reference subdirectories inside `src/core/models/X/`. All external features must import strictly from `@/src/core/models/X/X`.

### 2. Standardize Converter Exports (Avoid Redundant Aliases)
- ❌ **Mistake:** Creating and exporting redundant PascalCase converter aliases alongside camelCase standard exports:
  ```ts
  // ❌ WRONG
  export const groupConverter: FirestoreDataConverter<Group> = { ... };
  export const GroupConverter = groupConverter;
  ```
- ✅ **Correction:** Stick strictly to the standard camelCase naming for converters without duplicate alias exports:
  ```ts
  // ✅ CORRECT
  export const groupConverter: FirestoreDataConverter<Group> = { ... };
  ```
- In the facade `X.ts`, export only `newX` and `xConverter`:
  ```ts
  export { newGroup, groupConverter } from "@/src/core/models/Group/utils/GroupFactory";
  ```

### 3. Maintain Consistent Facade Organization
- Keep facade export sections grouped, clean, and predictably ordered:
  1. `// TYPES`
  2. `// FACTORY & CONVERTER`
  3. `// UTILITIES`
  4. `// STORES`
  5. `// HOOKS`
  6. `// REPOSITORIES`

### 4. Do NOT Modify Files Inside `src/features/`
- **Rule:** Refactoring and maintenance tasks are strictly scoped to the core model features under `src/core/models/` (and shared initialization/utilities under `src/core/`).
- ❌ **Do not touch:** Files inside `src/features/` (UI screens, component layouts, UI-level hooks/tabs) are maintained by the UI developer. If model refactoring introduces consumer breaks or type mismatches in `src/features/`, leave them for the UI team to resolve.