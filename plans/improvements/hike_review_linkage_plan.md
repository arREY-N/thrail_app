# Implementation Plan: Attaching Reviews to Hike Sessions

## Overview
Currently, reviews in Firestore are bound strictly to a `trail` and a `user`, but lack a direct link (`hikeId`) pointing to the specific hike session (`users/{userId}/hikes/{hikeId}`). 

This plan details how to introduce an optional `hikeId` reference into review documents for all upcoming reviews while maintaining full backward compatibility with legacy review documents that do not contain a `hikeId`.

---

## 1. Compatibility & Design Strategy

### Backward Compatibility Requirements
- **No Migration Required for Existing Data**: Legacy reviews in Firestore will be retained untouched without `hikeId`.
- **Optional Field**: In all TypeScript models, schemas, and converters, `hikeId` is marked as optional (`hikeId?: string`).
- **Safe Deserialization**: When reading a review from Firestore, if `data.hikeId` is missing (`undefined` or not present), the application defaults gracefully to `undefined`.
- **UI Degradation**: Any future UI that links a review back to its route or hike stats will gracefully check `if (review.hikeId)` before showing hike-specific links or "Verified Hike" badges.

---

## 2. Architecture & File Changes

```mermaid
flowchart TD
    subgraph Navigation
        A[CreateHikeFlow.ts] -->|pass hikeId & trailId| B[WriteReview screen /write.tsx]
    end

    subgraph Core Flow
        B --> C[CreateReviewFlow.ts]
        C -->|embed hikeId in review draft| D[Review Document State]
    end

    subgraph Data Layer
        D -->|Save| E[ReviewFactory.ts: toFirestore]
        E -->|Writes doc with hikeId?| F[(Firestore: reviews/{reviewId})]
        F -->|Reads doc| G[ReviewFactory.ts: fromFirestore]
        G -->|Safe parse: hikeId ?? undefined| H[Review Object]
    end
```

---

## 3. Step-by-Step Implementation Steps

### Phase 1: Model & Types Updates
**Target File**: [`src/core/models/Review/interfaces/Review.types.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Review/interfaces/Review.types.ts)

- Update `ReviewInformation<T, TRating>` (or `IHikeSurvey<T, TRating>`) to include an optional `hikeId?: string;`.
- Ensure type definitions propagate correctly to both `IReviewDB` and `Review`.

```typescript
export interface ReviewInformation<T, TRating> extends IHikeBase<T> {
    hikeId?: string; // Optional link to specific hike record
    overallRating: number;
    trailMaintenance: TRating;
    difficultyFactors: DifficultyFactors[];
    favoredFactors: FavoredFactors[];
    review: string;
    image: string[];

    predictedDifficulty: TRating;
    perceivedDifficulty: TRating;
}
```

---

### Phase 2: Factory & Firestore Converter Updates
**Target File**: [`src/core/models/Review/utils/ReviewFactory.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Review/utils/ReviewFactory.ts)

1. **`newReview` Factory**:
   - Add `hikeId: undefined` or support `hikeId?: string` via `...init`.
2. **`reviewFromFirestore`**:
   - Safely read `hikeId`:
     ```typescript
     hikeId: data.hikeId || undefined,
     ```
   - Legacy reviews will cleanly evaluate to `undefined` without errors.
3. **`reviewToFirestore`**:
   - Conditionally serialize `hikeId` only if present, or write it directly:
     ```typescript
     ...(review.hikeId ? { hikeId: review.hikeId } : {}),
     ```
   *(Omitting `undefined` prevents writing unintended `null` or `undefined` properties to Firestore).*

---

### Phase 3: Update `CreateReviewFlow`
**Target File**: [`src/core/flows/CreateReviewFlow.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/CreateReviewFlow.ts)

1. **Initial State**:
   - In `useState<Review>(() => ...)`, if `hikeId` is provided in `params`, initialize `newReviewItem.hikeId = hikeId;`.
2. **Persistence in `onSaveReview`**:
   - When constructing `finalReviewToSave`, ensure `draft.hikeId` is retained:
     ```typescript
     const finalReviewToSave = produce(review, draft => {
         draft.user = UserLogic.toSummary(profile);
         draft.trail = location;
         if (hikeId && !draft.hikeId) {
             draft.hikeId = hikeId;
         }
     });
     ```

---

### Phase 4: Route & Navigation Linkage
**Target File**: [`src/core/flows/CreateHikeFlow.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/flows/CreateHikeFlow.ts)

1. **Update Review Navigation**:
   - When a hike is finished and the user taps to write a review (around line 292):
     ```typescript
     router.push({
         pathname: '/(app)/(main)/review/write',
         params: {
             trailId: currentHike.trail.id,
             hikeId: currentHike.id, // <-- Pass the completed hike's ID
         }
     });
     ```
2. **Verify Route Params Handling**:
   - [`src/app/(app)/(main)/review/write.tsx`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/app/(app)/(main)/review/write.tsx) already extracts `hikeId` and passes it to `CreateReviewFlow`. Verify it continues to bind seamlessly.

---

### Phase 5: Optional Secondary Linkage (Hike Document)
*(Optional, based on future requirements)*
- If a 2-way relationship is ever needed (e.g., inspecting a hike record and seeing `hike.reviewId`), add `reviewId?: string;` to `IHikeBase` in [`Hike.types.ts`](file:///c:/Users/LENOVO/Documents/dev/thrail_app/src/core/models/Hike/interfaces/Hike.types.ts) and update `HikeFactory.ts`.

---

## 4. Verification & Testing Checklist

- [ ] **Legacy Review Read**: Open existing review cards or feed containing older reviews. Ensure all render without errors or undefined-property crashes.
- [ ] **Direct Trail Review (No Hike)**: Submit a review directly from a trail page (outside of an active hike session). Ensure `hikeId` is omitted cleanly in Firestore and everything saves as normal.
- [ ] **Post-Hike Review**: Complete a hike session, navigate to review, submit, and inspect the created document in Firestore. Confirm `hikeId` is present and matches `users/{userId}/hikes/{hikeId}`.
- [ ] **Edit Existing Review**: Load and edit an existing review (both with and without `hikeId`), verifying `onSaveReview` does not drop existing fields.
