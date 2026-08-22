# Model Features Refactoring Status Assessment

This document provides a comprehensive evaluation of all 20 feature folders and shared utilities under `src/core/models` against the architectural standards specified in [Feature.md](./Feature.md).

---

## 1. Refactoring Status Summary Table

| Feature Model | Status in `Feature.md` | Actual Code Status | Notes |
|---|:---:|:---:|---|
| **[Application](./Application)** | Refactored Already | ✅ **Fully Refactored** | Pristine reference implementation conforming to all guidelines. |
| **[Business](./Business)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, repository factory, and facade. |
| **[Group](./Group)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with 4-file store, factory, hooks, and repository. |
| **[Booking](./Booking)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, repository factory, and facade. |
| **[Cancellation](./Cancellation)** | Underway | ⚠️ **Underway / Deviations** | Structure implemented, but has split interfaces (`ICancellation.ts` and `Cancellation.types.ts`) and `.md` docs in subdirectories. |
| **[Leaderboard](./Leaderboard)** | Underway | ⚠️ **Underway / Deviations** | Facade contains inline DB conversion logic; missing standard store layer and factory file; typo in `repositories.ts` (`LeadberboardRepo`). |
| **[Offer](./Offer)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, utility factory, and clean facade. |
| **[Recommendation](./Recommendation)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, repository factory, central initialization, and clean facade. |
| **[Reschedule](./Reschedule)** | Refactored Already | ✅ **Fully Refactored** | Standardized `Reschedule.types.ts`, 4-file store layer, repository factory, and clean facade. |
| **[Trail](./Trail)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, utils directory, 4-file store, factory, hooks, repository, and facade. |
| **[Hike](./Hike)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, factory, hooks, repository, and clean facade. |
| **[Admin](./Admin)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, factory, hooks, repository, and clean facade. |
| **[Location](./Location)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model in facade; root-level types; empty subdirectories. |
| **[Message](./Message)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model in facade; root-level types; empty subdirectories. |
| **[Mountain](./Mountain)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard layers, 4-file store, factory, hooks, repository, and clean facade. |
| **[Notification](./Notification)** | Refactored Already | ✅ **Fully Refactored** | Fully aligned with standard `Notification.types.ts` in `interfaces/`, plain factory, 4-file store, repository, and facade. |
| **[Payment](./Payment)** | Not Yet | ❌ **Not Yet Refactored** | Legacy class model in facade; non-standard `logic/` directory; empty stores/repositories/interfaces. |
| **[Permission](./Permission)** | *(Not in table)* | ❌ **Not Yet Refactored** | Legacy class model; root-level types; empty subdirectories. |
| **[Review](./Review)** | Refactored Already | ✅ **Fully Refactored** | Plain factory, utils directory migration, repository factory, 4-file store, hooks, and clean facade. |
| **[User](./User)** | Not Yet | ❌ **Not Yet Refactored** | Multiple root files (`SignUp.ts`, `Preference.ts`); class model inside `UserFactory.ts`; non-standard `logic/` directory. |

---

## 2. Status Groupings

1. **Fully Refactored (13)**:
   - `Admin`, `Application`, `Business`, `Booking`, `Group`, `Hike`, `Mountain`, `Notification`, `Offer`, `Recommendation`, `Reschedule`, `Review`, `Trail`
2. **Underway / Partially Refactored with Deviations (2)**:
   - `Cancellation`, `Leaderboard`
3. **Not Yet Refactored (5)**:
   - `Location`, `Message`, `Payment`, `Permission`, `User`

---

## 3. Detailed Inconsistencies and Structural Deviations

### A. Root-Level Files Violations
The specification states: **`X.ts` (Facade) must be the ONLY code file at the root level of the feature directory.** (Markdown documentation files like `X.md` / `XFeature.md` at the root are permitted to help developers understand the feature).
- **`Admin/Admin.types.ts`**: Marked for deletion (types moved to `Admin/interfaces/Admin.types.ts`).
- **`Offer/OfferFactory.ts`**: Marked for deletion (factory moved to `Offer/utils/OfferFactory.ts`).
- **`Notification/Notification.types.ts`**: Marked for deletion (types moved to `Notification/interfaces/Notification.types.ts`).
- **`Reschedule/interfaces/IReschedule.ts`**: Marked for deletion (standardized to `Reschedule/interfaces/Reschedule.types.ts`).
- **`User/SignUp.ts` & `User/Preference.ts`**: Multiple model and type files located at the feature root.
- **Root `.types.ts` files**: `Location.types.ts`, `Message.types.ts`, `Payment.types.ts`, `Permission.types.ts` are located in the root instead of their respective `interfaces/` subdirectories.
- **`Mountain/Mountain.types.ts`**: Marked for deletion (types moved to `Mountain/interfaces/Mountain.types.ts`).

### B. Non-Standard Directories (`logic/` and `Logic/`)
The specification requires domain helpers, validators, and logic to reside in `utils/`.
- **`Payment/logic/`**: Contains `Payment.logic.ts` outside `utils/`.
- **`Review/Logic/`**: Marked for deletion (migrated to `Review/utils/Review.converter.ts` and `Review/utils/Review.logic.ts`).
- **`Trail/logic/`**: Contains `GeoJSONProcessor.ts`, `Trail.logic.ts`, and `TrailComputation.ts` outside `utils/`.
- **`User/logic/`**: Contains `User.logic.ts` outside `utils/`.

### C. Interface File Naming Discrepancies
The standard prescribes `interfaces/X.types.ts`.
- **`Booking`**: Uses `IBooking.ts`.
- **`Cancellation`**: Has two interface files: `ICancellation.ts` and `Cancellation.types.ts`.
- **`Leaderboard`**: Uses `ILeaderboard.ts`.
- **`Trail`**: Has `ITrail.ts` and `Trail.types.ts` (where `Trail.types.ts` is just a redundant re-export of `ITrail.ts`).

### D. Repository Initialization & Export Deviations
- **`Booking`**: `Booking.ts` re-exports `BookingRepository` from `repositories/` instead of `BookingRepo` from `@/src/core/init/repositories`.
- **`Trail`**: `Trail.ts` re-exports uninitialized `TrailRepository` instead of `TrailRepo`. Furthermore, `repositories.ts` imports `TrailRepository` from the facade `Trail/Trail` instead of `Trail/repositories/TrailRepository`.
- **Typo in `src/core/init/repositories.ts`**: Line 18 defines `export const LeadberboardRepo = LeaderboardRepository(db);` (misspelled `LeadberboardRepo`).

### E. Facade Impurities (Inline Logic & Class Declarations)
The facade `X.ts` should only contain clean re-exports.
- **`Booking.ts`**: Defines an inline async helper function `getUserBookingItem`.
- **`Leaderboard.ts`**: Defines `generateLeaderboard`, `leaderboardToDB`, `leaderboardFromDB`, and `LeaderboardConverter` directly in the facade.
- **Unrefactored Facades (`Location`, `Message`, `Payment`, `Permission`)**: Entire model classes (`class X implements IX`), conversion functions, and Firestore converters are defined directly inside `X.ts`.

### F. Store File Naming & Structure Inconsistencies
- **Plural vs. Singular Mismatches**:
   - `Trail`: `trailsStore.native.ts`, `trailsStore.web.ts`, `trailsStore.ts` (plural) vs. `trailStoreCreator.ts` (singular).
- **Missing Stores Layer**: `Leaderboard`, `Payment`, `User` have no store layer implemented yet.

### G. Factory Implementation Discrepancies
- **`UserFactory.ts`**: Defines `export class User implements IUser` with `fromFirestore`/`toFirestore` methods instead of plain object factory `newUser()`.

### H. Cross-Feature Import Violations (Anti-Pattern 1)
- **`Booking/interfaces/IBooking.ts`**: Imports directly from subdirectories of other features (`@/src/core/models/Trail/interfaces/Trail.types` and `@/src/core/models/User/interfaces/User.types`) instead of root facades (`@/src/core/models/Trail/Trail` and `@/src/core/models/User/User`).
- **`Payment/Payment.ts`**: Imports from `../Offer/interfaces/Offer.types` and `../User/interfaces/User.types`.

---

## 4. Suggested Alignment Checklist for Next Refactoring Steps

1. **Relocate Root Files**:
   - Move root `.types.ts` into respective `interfaces/` folders (`Location`, `Message`, `Payment`, `Permission`).
   - Clean up root `User` auxiliary files (`SignUp.ts`, `Preference.ts`).
2. **Standardize Directories**:
   - Merge `Payment/logic/`, `Trail/logic/`, and `User/logic/` into their respective `utils/` folders.
3. **Normalize Interface Naming**:
   - Standardize `IBooking.ts`, `ICancellation.ts`, and `ITrail.ts` into `X.types.ts`.
4. **Standardize Repository Layer**:
   - Re-export `XRepo` across facades (`Booking.ts`, `Trail.ts`).
   - Fix `LeadberboardRepo` typo in `repositories.ts`.
5. **Clean Facades**:
   - Move helper functions (`getUserBookingItem`, `generateLeaderboard`) out of `X.ts` into `utils/` or `hooks/`.
