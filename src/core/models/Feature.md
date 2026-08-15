# Feature Folder Structure

This document describes the recommended structure for a model feature folder under `src/core/models`.

> Note: some folders are still in transition. Not every feature currently contains all sections below.

## Recommended Structure

```text
XFeature/
├─ XFactory.ts
├─ interfaces/
│  └─ X.types.ts
├─ repositories/
├─ stores/
│  ├─ XStoreCreator.ts
│  ├─ XStore.native.ts
│  ├─ XStore.web.ts
│  └─ XStore.ts
├─ hooks/
├─ utils/
├─ __tests__/
└─ X.ts
```

## Component Responsibilities

### `X.ts` (facade)
- The single entry point through which **other features** consume this feature. No feature should reach into another feature's internal folders (`hooks/`, `stores/`, `repositories/`, etc.) directly — always import from the facade.
- Exports:
  - **Hooks** — the primary path for cross-feature UI consumption. Another feature's hook or component should call this feature's hooks (`useX`, `useXItem`, `useXList`) rather than touching its store directly.
  - **Repositories** (selectively, if needed) — for cross-feature **non-UI** access (e.g. one feature's store or a service needs to read/write this feature's data outside of a component/hook context, where hooks can't be invoked). Components should still prefer the hook over calling a repository directly, since hooks carry loading/guard guarantees a repository alone doesn't.
  - **Types/interfaces and factory helpers** — freely shareable, no state or coupling risk.
- Does **not** export the store (`useXStore`). The store stays feature-private — see `stores/` below.

### `XFactory.ts`
- Defines the runtime model.
- Exposes factory/helper constructors (for example, `createX`).
- Handles conversion to/from database representation when needed (for example, Date ↔ Timestamp).
- Internal to the feature — consumed by `stores/`, `hooks/`, etc., and re-exported through `X.ts` where relevant, but other features should still go through the facade rather than importing `XFactory.ts` directly.

### `interfaces/`
- Defines model type contracts and shared interfaces.
- May include separate DB-facing types (for Firestore-compatible fields).

> Legacy folders may still use `X.types.ts` at feature root instead of `interfaces/`.

### `repositories/`
- Contains persistence/data-access functions.
- Should encapsulate database queries/writes and keep DB details out of UI/store logic.
- May be exposed via `X.ts` for cross-feature non-UI access (see facade section above).

### `stores/` (for refactored features)
- Zustand store layer for feature state and actions.
- **Feature-private, always.** No other feature imports a store directly — not through `X.ts`, not through any other path. Other features access this feature's state only by calling its exposed hooks, which read the store internally.
- Within the feature, `stores/` may call `repositories/` freely. Store-to-store access **across features is never allowed** — it creates hidden coupling where one feature's internal state shape silently breaks another feature's behavior.
- Expected files:
  - `XStoreCreator.ts`: base store logic/actions
  - `XStore.native.ts`: native store wiring (often with persistence)
  - `XStore.web.ts`: web store wiring
  - `XStore.ts`: fallback export file
- Any store using `persist` should explicitly decide how staleness is handled (trust cached data at face value vs. show-then-refetch-in-background), rather than leaving it implicit.
- Fetch/write actions should own their own dedup guards (e.g. "already loaded," "already in-flight") — this is the single source of truth for whether a fetch is actually needed, shared across every hook and component that triggers it.

### `hooks/`
- Feature-specific hooks that compose store/repository/model logic for UI consumption.
- Split hooks by intent, not just by domain object. A hook's side effects
  (especially network fetches) should be obvious from its name and scope.
- Within read hooks, split further by cardinality: fetching **one** resource
  and fetching **all/a list** are different shapes with different
  dependency arrays and often different store slices — don't merge them
  into a single fetch hook "for convenience."
- Hook-to-hook composition is allowed, both within the feature and across
  features (calling another feature's exposed hook from `X.ts`) — this is
  the standard way to consume another feature's data from UI code. Never
  substitute this by importing another feature's store directly.
- Composing another feature's hook also composes its side effects. Before
  wiring one hook into another, confirm every consumer of the composing
  hook actually needs the composed data — if only some do, let the
  component call both hooks separately instead of baking the composition in.
- Naming convention:
  - `useX.ts` → write/actions
  - `useXItem.ts` → fetch one
  - `useXList.ts` → fetch all

  #### useX.ts (write/actions)
  - Owns mutation functions (create/update/delete) and their
    action-scoped loading/error state.
  - No fetch-on-mount side effects of any kind.

  #### useXItem.ts (fetch one)
  - Owns the `useEffect` that fetches a single resource, keyed by an id
    (or other identifying param) passed to the hook.
  - Re-fetches when the id param changes — id belongs in the effect's
    dependency array.
  - Exposes read-only state scoped to that one resource: data, isLoading, error.
  - Guard against redundant fetches (e.g. "already have this id loaded")
    lives in the store, not the hook.

  #### useXList.ts (fetch all)
  - Owns the `useEffect` that fetches the full collection (or a filtered
    subset, e.g. "all belonging to the current user").
  - No id param — runs once per relevant condition (e.g. once per userId),
    not once per item.
  - Exposes read-only state for the collection: data (array), isLoading, error.
  - Guard against redundant fetches (e.g. "already loaded," "already
    in-flight") lives in the store, not the hook — the hook may safely
    re-mount across multiple components without triggering duplicate
    network calls, because the store is the single source of truth for
    whether a fetch is actually needed.

  #### usePurposeX.ts
  - Purpose-specific hooks (e.g. filtering, admin-only actions)
    that don't fit the write / fetch-one / fetch-all split above.
    Name for what they actually do, not the generic pattern.

### `utils/`
- Pure utility or business-rule functions.
- Should not contain direct repository calls.

### `__tests__/` (optional)
- Feature-level tests (unit/integration/e2e as applicable).

## Cross-Feature Access Summary

| Layer | Exposed via `X.ts`? | Who calls it, and how |
|---|---|---|
| `X.ts` (facade) | — | Single entry point for all cross-feature access |
| `hooks/` | ✅ Yes | Other features' hooks/components — primary path for cross-feature UI data access |
| `stores/` | ❌ Never | Feature-private. Never imported by another feature, directly or via the facade |
| `repositories/` | ✅ Yes (selectively) | Other features' stores/services for non-UI access, when a hook can't be used |
| `interfaces/`, `XFactory.ts` | ✅ Yes | Freely shareable — no state, no coupling risk |

## Refactor Status by Model

Criteria used for this checklist:
- **Refactored already**: has the full store pattern (`*StoreCreator.ts`, `.native.ts`, `.web.ts`, fallback `.ts`) and aligned feature folders.
- **Underway**: partially aligned (for example, has `interfaces/` and `repositories/`, but not yet full store pattern).
- **Not yet**: still in legacy/non-refactored structure.

| Model | Refactored already | Underway | Not yet |
|---|---|---|---|
| Admin | [ ] | [ ] | [x] |
| Application | [ ] | [ ] | [x] |
| Booking | [x] | [ ] | [ ] |
| Business | [ ] | [ ] | [x] |
| Cancellation | [x] | [ ] | [ ] |
| Group | [ ] | [ ] | [x] |
| Hike | [ ] | [ ] | [x] |
| Leaderboard | [ ] | [x] | [ ] |
| Location | [ ] | [ ] | [x] |
| Message | [ ] | [ ] | [x] |
| Mountain | [ ] | [ ] | [x] |
| Notification | [ ] | [ ] | [x] |
| Offer | [x] | [ ] | [ ] |
| Payment | [ ] | [ ] | [x] |
| Recommendation | [ ] | [ ] | [x] |
| Review | [ ] | [ ] | [x] |
| Trail | [ ] | [ ] | [x] |
| User | [ ] | [ ] | [x] |

---

**Note:** `Booking`, `Cancellation`, and `Offer` are marked "Refactored already" under the pre-facade criteria. Once the `XFactory.ts` rename and `X.ts`-as-facade pattern are applied, these three should be revisited first to confirm they match the updated structure before newer features adopt it.