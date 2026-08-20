# Feature Folder Structure

This document describes the recommended structure for a model feature folder under `src/core/models`.

> Note: Some folders are still in transition. Not every feature currently contains all sections below.

## Standard Feature Folder Structure

```text
XFeature/
├─ interfaces/
├─ repositories/
├─ stores/
│  ├─ XStoreCreator.ts
│  ├─ XStore.native.ts
│  ├─ XStore.web.ts
│  └─ XStore.ts
├─ hooks/
├─ utils/
│  └─ XFactory.ts
├─ __tests__/
└─ X.ts
```

---

## Component Responsibilities

### `X.ts` (Facade)
- **The ONLY file allowed at the root level of the feature directory.**
- Serves as the single public entry point through which **other features** consume this feature. No external module should reach into internal subdirectories (`hooks/`, `stores/`, `repositories/`, `utils/`, etc.) directly — always import from `X.ts`.
- Placing all other files into subdirectories guarantees that ESLint's `no-restricted-imports` rule can target root level files cleanly without accidentally misidentifying internal utilities (like factories) as facades.
- **Exports:**
  - **Hooks** — Primary path for cross-feature UI consumption (`useX`, `useXItem`, `useXList`).
  - **Repositories** (selectively) — For cross-feature **non-UI** access (e.g., background services or external stores reading/writing data outside component lifecycles).
  - **Types/Interfaces & Factory Constructors** — Re-exported from `interfaces/` and `utils/XFactory.ts` for safe, shareable usage across features.
  - **Stores** - Re-exported from `stores/` for cross-feature UI consumption, uses store selectors only to limit access to certain store functions only, not the entire store.

### `interfaces/`
- Defines model type contracts, domain models, and shared interfaces.
- May include separate DB-facing types (e.g., Firestore schema mappings).

### `repositories/`
- Contains data-access implementations.
- Encapsulates database queries/writes and keeps DB details out of UI/store logic.

### `stores/`
- Zustand store layer for feature state and actions.
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
| **Repositories** | `repositories/` | ✅ Yes (Selectively) | External non-UI services/stores needing direct data access. |
| **Interfaces & Factory** | `interfaces/`, `utils/XFactory.ts` | ✅ Yes (Re-exported) | Shared type contracts and model constructors. |
| **Stores** | `stores/` | ❌ Limited | Selectors only. |

---

## Refactor Status by Model

| Model | Refactored Already | Underway | Not Yet |
|---|:---:|:---:|:---:|
| Admin | [ ] | [ ] | [x] |
| Application | [ ] | [ ] | [x] |
| Booking | [ ] | [x] | [ ] |
| Business | [ ] | [ ] | [x] |
| Cancellation | [ ] | [x] | [ ] |
| Group | [ ] | [ ] | [x] |
| Hike | [ ] | [ ] | [x] |
| Leaderboard | [ ] | [x] | [ ] |
| Location | [ ] | [ ] | [x] |
| Message | [ ] | [ ] | [x] |
| Mountain | [ ] | [ ] | [x] |
| Notification | [ ] | [ ] | [x] |
| Offer | [ ] | [x] | [ ] |
| Payment | [ ] | [ ] | [x] |
| Recommendation | [ ] | [ ] | [x] |
| Review | [ ] | [ ] | [x] |
| Trail | [ ] | [ ] | [x] |
| User | [ ] | [ ] | [x] |

*> Note: `Booking`, `Cancellation`, and `Offer` have been moved to **Underway** so their factory files can be relocated to `utils/XFactory.ts` to align with the new single-root facade rule.*