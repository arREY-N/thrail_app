# Model Features Refactoring Status Assessment

This document provides a comprehensive evaluation of all 20 feature folders and shared utilities under `src/core/models` against the architectural standards specified in [Feature.md](./Feature.md).

---

## 1. Refactoring Status Summary Table

| Feature Model | Status in `Feature.md` | Actual Code Status | Notes |
|---|:---:|:---:|---|
| **[Admin](./Admin)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, factory, hooks, self-contained repository (`AdminRepo`), and clean facade. |
| **[Application](./Application)** | Refactored Already | ✅ **Fully Refactored** | Pristine reference implementation conforming to all guidelines with self-contained `ApplicationRepo`. |
| **[Booking](./Booking)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, self-contained `BookingRepo`, helper extracted to `utils/getUserBookingItem.ts`, and clean facade. |
| **[Business](./Business)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, self-contained `BusinessRepo`, and facade. |
| **[Cancellation](./Cancellation)** | Underway | ⚠️ **Underway / Deviations** | Structure implemented, but has split interfaces (`ICancellation.ts` and `Cancellation.types.ts`) and `.md` docs in subdirectories. |
| **[Group](./Group)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with 4-file store, factory, hooks, and self-contained `GroupRepo`. |
| **[Hike](./Hike)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, factory, hooks, self-contained `HikeRepo`, and clean facade. |
| **[Leaderboard](./Leaderboard)** | Refactored Already | ✅ **Fully Refactored** | Standardized `Leaderboard.types.ts`, plain factory, self-contained `LeaderboardRepo`, 4-file store, hooks, and clean facade. |
| **[Location](./Location)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model in facade; root-level types; empty subdirectories. |
| **[Message](./Message)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model in facade; root-level types; empty subdirectories. |
| **[Mountain](./Mountain)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, factory, hooks, self-contained `MountainRepo`, and clean facade. |
| **[Notification](./Notification)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard `Notification.types.ts` in `interfaces/`, plain factory, 4-file store, self-contained `NotificationRepo`, and facade. |
| **[Offer](./Offer)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, utility factory, self-contained `OfferRepo`, and clean facade. |
| **[Payment](./Payment)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model in facade; non-standard `logic/` directory; empty stores/repositories/interfaces. |
| **[Permission](./Permission)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model; root-level types; empty subdirectories. |
| **[Recommendation](./Recommendation)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, self-contained `RecommendationRepo`, and clean facade. |
| **[Reschedule](./Reschedule)** | Refactored Already | ✅ **Fully Refactored** | Standardized `Reschedule.types.ts`, 4-file store layer, self-contained `RescheduleRepo`, and clean facade. |
| **[Review](./Review)** | Refactored Already | ✅ **Fully Refactored** | Plain factory, utils directory migration, self-contained `ReviewRepo`, 4-file store, hooks, and clean facade. |
| **[Trail](./Trail)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, utils directory, 4-file store, factory, hooks, self-contained `TrailRepo`, and facade. |
| **[User](./User)** | Not Yet | ❌ **Not Yet Refactored** | Multiple root files (`SignUp.ts`, `Preference.ts`); class model inside `UserFactory.ts`; non-standard `logic/` directory. |

---

## 2. Status Groupings

1. **Fully Refactored (14)**:
   - `Admin`, `Application`, `Booking`, `Business`, `Group`, `Hike`, `Leaderboard`, `Mountain`, `Notification`, `Offer`, `Recommendation`, `Reschedule`, `Review`, `Trail`
2. **Underway / Partially Refactored with Deviations (1)**:
   - `Cancellation`
3. **Not Yet Refactored (5)**:
   - `Location`, `Message`, `Payment`, `Permission`, `User`

---

## 3. Detailed Inconsistencies and Structural Deviations

### A. Root-Level Files Violations
The specification states: **`X.ts` (Facade) must be the ONLY code file at the root level of the feature directory.** (Markdown documentation files like `X.md` / `XFeature.md` at the root are permitted to help developers understand the feature).
- **`User/SignUp.ts` & `User/Preference.ts`**: Multiple model and type files located at the feature root.
- **Root `.types.ts` files**: `Location.types.ts`, `Message.types.ts`, `Payment.types.ts`, `Permission.types.ts` are located in the root instead of their respective `interfaces/` subdirectories.

### B. Non-Standard Directories (`logic/` and `Logic/`)
The specification requires domain helpers, validators, and logic to reside in `utils/`.
- **`Payment/logic/`**: Contains `Payment.logic.ts` outside `utils/`.
- **`User/logic/`**: Contains `User.logic.ts` outside `utils/`.

### C. Interface File Naming Discrepancies
The standard prescribes `interfaces/X.types.ts`.
- **`Booking`**: Standardized `Booking.types.ts` exists; deprecated duplicate `IBooking.ts` is queued for removal.
- **`Cancellation`**: Has two interface files: `ICancellation.ts` and `Cancellation.types.ts`.
- **`Leaderboard`**: Uses `ILeaderboard.ts`.
- **`Trail`**: Has `ITrail.ts` and `Trail.types.ts` (where `Trail.types.ts` re-exports `ITrail.ts`).

### D. Decentralized Repository Architecture (Avoiding Circular Cycles)
Instead of a monolithic central `src/core/init/repositories.ts` (which caused circular dependency cycles between models and the init module), repositories are now self-contained:
- Each feature initializes its own instance inside `repositories/XRepository.ts`:
  ```ts
  import { db } from "@/src/core/config/Firebase";
  export const XRepo = XRepository(db);
  ```
- Stores import `XRepo` directly from `@/src/core/models/X/repositories/XRepository`.
- The root facade `X.ts` re-exports `{ XRepo }` from `repositories/XRepository` for external access.
- Refactored features (`Admin`, `Application`, `Booking`, `Business`, `Group`, `Hike`, `Leaderboard`, `Mountain`, `Notification`, `Offer`, `Recommendation`, `Reschedule`, `Review`, `Trail`) fully conform to this decentralized pattern.

### E. Facade Impurities (Inline Logic & Class Declarations)
The facade `X.ts` should only contain clean re-exports.
- **Unrefactored Facades (`Location`, `Message`, `Payment`, `Permission`)**: Entire model classes (`class X implements IX`), conversion functions, and Firestore converters are defined directly inside `X.ts`.

### F. Store File Naming & Structure Inconsistencies
- **Plural vs. Singular Mismatches**:
   - `Trail`: `trailsStore.native.ts`, `trailsStore.web.ts`, `trailsStore.ts` (plural) vs. `trailStoreCreator.ts` (singular).
- **Missing Stores Layer**: `Payment`, `Permission`, `User` have no standard 4-file store layer implemented yet.

### G. Factory Implementation Discrepancies
- **`UserFactory.ts`**: Defines `export class User implements IUser` with `fromFirestore`/`toFirestore` methods instead of plain object factory `newUser()`.

### H. Cross-Feature Import Violations (Anti-Pattern 1)
- **`Payment/Payment.ts`**: Imports from `../Offer/interfaces/Offer.types` and `../User/interfaces/User.types` instead of root facades.
- **`Booking/interfaces/Booking.types.ts`**: Compliant (imports from `@/src/core/models/Business/Business`, `@/src/core/models/Offer/Offer`, `@/src/core/models/Trail/Trail`, `@/src/core/models/User/User`).

---

## 4. Suggested Alignment Checklist for Next Refactoring Steps

1. **Relocate Root Files**:
   - Move root `.types.ts` into respective `interfaces/` folders (`Location`, `Message`, `Payment`, `Permission`).
   - Clean up root `User` auxiliary files (`SignUp.ts`, `Preference.ts`).
2. **Standardize Directories**:
   - Merge `Payment/logic/` and `User/logic/` into their respective `utils/` folders.
3. **Normalize Interface Naming**:
   - Clean up duplicate/legacy interface files (`Booking/interfaces/IBooking.ts`, `Cancellation/interfaces/ICancellation.ts`, `Trail/interfaces/ITrail.ts`).
4. **Build Standard 4-File Stores**:
   - Implement Zustand store layers for `Payment`, `Permission`, `User`.
5. **Clean Facades**:
   - Replace class implementations in legacy facades (`Location`, `Message`, `Payment`, `Permission`) with standard re-exports.
