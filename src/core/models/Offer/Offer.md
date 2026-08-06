# Offer Feature Documentation

This document describes the components inside `src/core/models/Offer` and how they work together.

## Folder Structure

- `Offer.ts`
- `interfaces/Offer.types.ts`
- `XOffer.ts`
- `repositories/OfferRepository.ts`
- `stores/offerStoreCreator.ts`
- `stores/offerStore.native.ts`
- `stores/offerStore.web.ts`
- `stores/offerStore.ts`
- `utils/Offer.utils.ts`

---

## 1) Domain Model

### `Offer.ts`
Primary offer model utilities:

- **`Offer` interface**: concrete app-facing offer type (`Date`-based fields).
- **`createOffer(init?)`**: factory that creates a default offer object and merges overrides.
- **`offerFromFirestore(id, data)`**: maps Firestore data to app model:
  - converts timestamp fields to `Date`,
  - normalizes optional fields (`endDate`, `duration`, `thingsToBring`, `reminders`),
  - maps nested schedule activity times to `Date`.
- **`offerToFirestore(offer)`**: maps app model to Firestore shape:
  - uses server timestamp semantics for `createdAt/updatedAt`,
  - converts `Date` fields to Firestore `Timestamp`,
  - serializes nested schedule activity times.
- **`offerConverter`**: Firestore data converter for typed reads/writes.

### `interfaces/Offer.types.ts`
Type contracts for offer data:

- **`IOfferInfo<T>`**: offer content fields (pricing, pax, docs, reminders, etc.).
- **`IActivity<T>` / `ISchedule<T>`**: itinerary schedule types.
- **`IOfferBase<T>`**: full offer record shape (id, timestamps, business/trail refs, schedule).
- **`IOfferDB`**: Firestore shape (`Timestamp | FieldValue`).
- **`IOffer`**: app/runtime shape (`Date`).
- **`IOfferSummary<T>`**: lightweight summary type.
- **`OfferParams`**: `{ id, businessId }`, used by repository/store methods.

### `XOffer.ts`
Legacy/experimental class-based model implementation (currently commented out).  
It mirrors the function-based implementation in `Offer.ts` but is not active.

---

## 2) Repository Layer

### `repositories/OfferRepository.ts`
Firestore access layer (factory pattern: `OfferRepository(db)`):

- **Collection scopes**
  - Business-scoped offers: `businesses/{businessId}/offers`
  - Global offer queries: `collectionGroup('offers')`
- **Read methods**
  - `fetchAll()`
  - `fetchAllBusinessOffers(businessId)`
  - `fetchAllTrailOffers(trailId)`
  - `fetchById({ id, businessId })`
  - `fetch(offerId)` (cross-business lookup by offer id)
- **Write method**
  - `write(data)`:
    - creates new doc when `id === ''`,
    - updates existing doc otherwise,
    - returns final saved offer model.
- **Delete method**
  - `delete({ id, businessId })`

This is the persistence boundary used by the Offer store.

---

## 3) State Management (Zustand)

### `stores/offerStoreCreator.ts`
Core Offer store logic and state shape:

- **State fields**
  - `data`, `trailOffers`, `businessOffers`, `current`
  - `isLoading`, `error`
- **Fetch/load actions**
  - `fetchAll`
  - `fetchOfferByBusiness`
  - `fetchOfferByTrail`
  - `fetchOfferById`
  - `loadOffer`
  - `load`
  - `refresh`
- **Mutation actions**
  - `createOffer`
  - `create` (alternate write path returning boolean)
  - `delete`
  - `reset`
- Uses local cache-first checks before hitting repository in several methods.

### `stores/offerStore.native.ts`
Native store entry point:

- creates `useOfferStore` with:
  - `immer(offerStoreCreator)`
  - `persist(...)` with storage key `offer-storage`

### `stores/offerStore.web.ts`
Web store entry point:

- creates `useOfferStore` with:
  - `immer(offerStoreCreator)`
- no persistence middleware applied here.

### `stores/offerStore.ts`
Fallback/export file:

- re-exports from native store (`offerStore.native`) as the default store access path.

---

## 4) Feature Utility Logic

### `utils/Offer.utils.ts`
Offer-specific business rule utility:

- **`updateOfferOnCancellation(offer)`**
  - validates `reservedPax > 0`,
  - decrements `reservedPax` by 1,
  - updates `updatedAt`,
  - throws on illegal cancellation state.

This is used during booking cancellation processing to keep offer seat counts consistent.

---

## High-Level Flow

1. UI/hooks call `useOfferStore` actions.
2. Store actions in `offerStoreCreator` orchestrate state updates and call repository methods.
3. `OfferRepository` reads/writes Firestore.
4. `offerConverter` and mapping helpers in `Offer.ts` normalize data between Firestore and app model.
5. `Offer.utils.ts` applies targeted business rules (e.g., cancellation seat updates).