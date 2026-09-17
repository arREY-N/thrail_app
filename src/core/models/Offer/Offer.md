# Offer Feature Documentation

This document describes the components inside `src/core/models/Offer` and how they work together.

## Folder Structure

- `Offer.ts`
- `Offer.md`
- `interfaces/`
  - `Offer.types.ts`
- `repositories/`
  - `OfferRepository.ts`
- `stores/`
  - `offerStoreCreator.ts`
  - `offerStore.native.ts`
  - `offerStore.web.ts`
  - `offerStore.ts`
- `utils/`
  - `OfferFactory.ts`
  - `getOffer.ts`
  - `OfferUtilities.ts`
- `hooks/`
  - `useOfferItem.ts`
  - `useOfferList.ts`
  - `useOfferSimilarList.ts`

---

## 1) Domain Model

### `Offer.ts` (Facade)
Primary entry point for the Offer feature, re-exporting:
- **Types**: all domain contracts from `interfaces/Offer.types.ts`.
- **Factory & Converter**: `newOffer` and `offerConverter` from `utils/OfferFactory.ts`.
- **Utilities**: `updateOfferOnCancellation` from `utils/OfferUtilities.ts` and `getBusinessOfferItem` / `getOffer` from `utils/getOffer.ts`.
- **Stores**: `useOfferStore` from `stores/offerStore.ts`.
- **Hooks**: `useOfferItem`, `useOfferList`, `useOfferSimilarList` from `hooks/`.
- **Repositories**: `OfferRepo` and `OfferRepository` from `repositories/OfferRepository.ts`.

### `utils/OfferFactory.ts`
- **`newOffer(init?)`**: factory function returning a default initialized `Offer` object merged with optional overrides.
- **`offerConverter`**: Firestore data converter for typed reads/writes using internal mappers (`offerFromFirestore` and `offerToFirestore`).

### `interfaces/Offer.types.ts`
Type contracts for offer data:

- **`IOfferInfo<T>`**: offer content fields (pricing, pax, docs, reminders, etc.).
- **`IActivity<T>` / `ISchedule<T>`**: itinerary schedule types.
- **`IOfferBase<T>`**: full offer record shape (id, timestamps, business/trail refs, schedule).
- **`IOfferDB`**: Firestore shape (`Timestamp | FieldValue`).
- **`IOffer` / `Offer`**: app/runtime shape (`Date`).
- **`IOfferSummary<T>`**: lightweight summary type.
- **`OfferParams`**: `{ id, businessId }`, used by repository/store methods.

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

### `utils/OfferUtilities.ts`
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