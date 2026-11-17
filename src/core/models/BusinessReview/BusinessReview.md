# BusinessReview Feature Documentation

This document describes the components inside `src/core/models/BusinessReview` and how they work together.

## Folder Structure

- `BusinessReview.ts`
- `BusinessReview.md`
- `interfaces/`
  - `BusinessReview.ts`
- `factory/`
  - `BusinessReviewFactory.ts`
- `repositories/`
  - `BusinessReviewRepository.ts`
- `stores/`
  - `businessReviewStoreCreator.ts`
  - `businessReviewStore.native.ts`
  - `businessReviewStore.web.ts`
  - `businessReviewStore.ts`
- `hooks/`
  - `useBusinessReview.ts`
  - `useBusinessReviewItem.ts`
  - `useBusinessReviewList.ts`
  - `useBusinessReviewState.ts`

---

## 1) Domain Model

### `BusinessReview.ts` (Facade)

Primary entry point for the BusinessReview feature, re-exporting:

- **Types**: all domain contracts from `interfaces/BusinessReview.ts`.
- **Factory & Converter**: `newBusinessReview`, `businessReviewToFirestore`, and `businessReviewConverter` from `factory/BusinessReviewFactory.ts`.
- **Stores**: `useBusinessReviewsStore` from `stores/businessReviewStore.ts`.
- **Hooks**: `useBusinessReview`, `useBusinessReviewItem`, `useBusinessReviewList`, and `useBusinessReviewState` from `hooks/`.
- **Repositories**: `BusinessReviewRepo` and `BusinessReviewRepository` from `repositories/BusinessReviewRepository.ts`.

### `factory/BusinessReviewFactory.ts`

- **`newBusinessReview(init)`**: factory function returning a default initialized `BusinessReview` merged with optional overrides (`image: []`, `likes: []`).
- **`businessReviewConverter`**: Firestore data converter for typed reads/writes using `businessReviesFromFirestore` (with `toDate()` conversion and array normalization) and `businessReviewToFirestore`.

### `interfaces/BusinessReview.ts`

Type contracts for business review data:

- **`IBusinessReview<T>`**: review record shape (`id`, `business`, `user`, `review`, `image`, `trail`, `offerId`, `hikeDate`, `hikeReview`, `rating`, `likes`, `createdAt`, `updatedAt`).
- **`BusinessReviewDB`**: Firestore shape (`Timestamp | FieldValue`).
- **`BusinessReview`**: app/runtime shape (`Date`).

---

## 2) Repository Layer

### `repositories/BusinessReviewRepository.ts`

Firestore access layer (factory pattern: `BusinessReviewRepository(db)`):

- **Collection scopes**
  - Business-scoped reviews: `businesses/{businessId}/reviews`
  - Cross-business lookup: `collectionGroup('reviews')` (filtered to `businesses` parent)
- **Read & Real-Time methods**
  - `fetchAll()`
  - `fetchById(businessId, reviewId)`
  - `fetchAllBusinessReviews(businessId)`
  - `listenToBusinessReviews(businessId, onUpdate, onError?, limitCount = 30)`: attaches a scoped Firestore `onSnapshot` listener (`orderBy('createdAt', 'desc'), limit(limitCount)`) on `businesses/{businessId}/reviews`.
- **Write methods**
  - `write(data)`: creates or merges a business review document (linking `id` to `hikeReview.id` when available) and returns the saved `BusinessReview`.
  - `updateLikes(businessId, reviewId, likes)`: updates only `{ likes, updatedAt }` via `updateDoc`.
- **Delete method**
  - `delete(businessId, id)`

---

## 3) State Management (Zustand)

### `stores/businessReviewStoreCreator.ts`

Core BusinessReview store logic and state shape:

- **State fields**
  - `data`, `reviewsByBusiness`
  - `isLoading`, `isFetching`, `isWriting`, `error`, `subscriptionError`
- **Fetch/Subscription actions**
  - `subscribeToBusinessReviews(businessId)`: reference-counted real-time listener per `businessId` (`activeBusinessReviewListeners` / `businessReviewListenerCounts`), syncing `reviewsByBusiness[businessId]` and `data` without flashing `isFetching` when cached data exists.
  - `fetchAll`
  - `fetchByBusiness`
  - `fetchByReviewId`
  - `refresh`
  - `refreshBusiness`
  - `reset()`: unsubscribes all active listeners and resets store state (called by `dataStore.resetData()` on sign-out).
- **Mutation actions**
  - `write` (writes review and syncs rating delta via `useBusinessesStore.getState().applyRatingDelta`)
  - `likeBusinessReview` (optimistically updates `data` and `reviewsByBusiness[bId]` immediately before awaiting `BusinessReviewRepo.updateLikes`, rolling back safely on failure)
  - `delete` (deletes review and reverts rating delta on the business)

### `stores/businessReviewStore.native.ts`

Native store entry point:

- Creates `useBusinessReviewsStore` with `persist(immer(businessReviewStoreCreator), { name: 'business-review-store', storage: AsyncStorage })`.

### `stores/businessReviewStore.web.ts`

Web store entry point:

- Creates `useBusinessReviewsStore` with `immer(businessReviewStoreCreator)` (no native persistence middleware).

### `stores/businessReviewStore.ts`

Fallback/export file re-exporting `useBusinessReviewsStore` from `businessReviewStore.native`.

---

## 4) Hook Layer

- **`useBusinessReview`**: exposes `useCallback`-stabilized `likeBusinessReview`, `isLiked`, and `isOwned`, along with `isLoading` and `error` using authenticated user profile and `useBusinessReviewsStore`.
- **`useBusinessReviewList(businessId?)`**: subscribes to real-time updates for `businessId` via `subscribeToBusinessReviews` (unsubscribing on unmount) and selects `reviewsByBusiness[businessId] ?? EMPTY_REVIEWS`, or fetches all reviews when `businessId` is omitted; exposes `data`, `isFetching`, and `refresh`.
- **`useBusinessReviewItem(reviewId)`**: loads a single review by ID and returns `reviewInData` and `isWriting`.
- **`useBusinessReviewState()`**: exposes `isWriting`, `isLoading`, `isFetching`, and `error`.

---

## High-Level Flow

1. UI screens/controllers compose `useBusinessReview` and `useBusinessReviewList` via `BusinessReview.ts` facade.
2. Store actions in `businessReviewStoreCreator` orchestrate cache, loading flags, rating deltas, and call `BusinessReviewRepo`.
3. `BusinessReviewRepository` reads/writes Firestore subcollections (`businesses/{businessId}/reviews/{reviewId}`).
4. `businessReviewConverter` normalizes timestamps and array fields (`image`, `likes`) between Firestore and the app model.
