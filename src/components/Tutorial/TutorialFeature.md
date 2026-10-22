# In-App Tutorial Architecture (`src/components/Tutorial/`)

> **Architectural Pattern:** Canonical Thrail Facade & Modular Walkthrough Architecture  
> **Facade Entrypoint:** `@/src/components/Tutorial/Tutorial`  
> **Presentation Component:** `@/src/components/CustomTutorialModal`  
> **Scope:** User 5-Tabs Tour, Booking & Payment Tours, Admin Dashboard & Offer/Review Tours, and Header `?` Replay Spotlight  

---

## 1. Directory & Component Layout

```text
src/
└── components/
    ├── CustomTutorialModal.tsx                   <- Standalone presentation component (in src/components/)
    │
    └── Tutorial/                                 <- 100% Self-Contained Domain Package
        ├── Tutorial.ts                           <- Public domain facade (single import entrypoint)
        ├── TutorialFeature.md                    <- Feature & architectural documentation
        │
        ├── interfaces/                           <- Type contracts
        │   └── Tutorial.types.ts                 <- TutorialTourId, TutorialStep, TutorialTourConfig
        │
        ├── hooks/                                <- State management & persistence
        │   └── useTutorialGuide.ts               <- Hook managing AsyncStorage per uid + step state
        │
        └── constants/                            <- Modular per-flow step configurations
            ├── index.ts                          <- Combines all 10 tours + appends shared Final '?' Replay Step
            ├── tabsTour.ts                       <- User: 5 Main Tabs (Mobile) / 7–10 Sidebar Items (Web)
            ├── bookingTour.ts                    <- User: OffersScreen (Date Calendar -> Guide Packages -> Continue)
            ├── bookingDetailsTour.ts             <- User: DetailsScreen (Contact -> Document Uploads -> Waiver)
            ├── bookingStatusTour.ts              <- User: StatusScreen (Pending Review -> Payment Unlock)
            ├── paymentTour.ts                    <- User: Payment wizard (Method -> PayMongo -> Receipt)
            ├── adminDashboardTour.ts             <- Admin: Dashboard 3 Quick Action buttons
            ├── adminOfferListTour.ts             <- Admin: Offer management list
            ├── adminOfferWriteTour.ts            <- Admin: Offer create/edit form
            ├── adminOfferViewTour.ts             <- Admin: Offer bookings view
            └── adminBookingReviewTour.ts         <- Admin: Hiker booking & document review
```

---

## 2. Public Facade Contract (`@/src/components/Tutorial/Tutorial`)

All screens MUST import tutorial components, hooks, and types exclusively via the facade:

```tsx
import {
    CustomTutorialModal,
    TutorialHelpButton,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';
```

---

## 3. Final `?` Replay Spotlight Step

Every tour automatically ends with a **Replay (`?`) Spotlight Step** (`highlightHeaderHelp: true`):

1. The dim overlay stays active and highlights the top-right `?` (`TutorialHelpButton`) in `CustomHeader` with a pulsing circle and an upward pointer pill (`"Tap '?' Here Anytime to Replay Guide"`).
2. Even if a user taps **"Skip Guide"** on Step 1, `useTutorialGuide` jumps to this final `?` spotlight step first before closing so the user always knows where to find the replay button later.

---

## 4. Zero Backend Touch (`src/core/` is Read-Only)

- Reads `user?.uid`, `profile?.onBoardingComplete`, and `role` from `@/src/core/models/User/User`.
- Automatically checks `@thrail_tutorials_v1_${uid}` in `AsyncStorage`.
- User tours wait until `profile.onBoardingComplete === true`.

---

## 5. Visual UX: SVG Cutout Spotlight & Adaptive Speech Bubble

1. **Native GPU Mask Cutout:**
   - Uses `react-native-svg` `<Mask>` with `fill="#fff"` (opaque dim `rgba(0, 0, 0, 0.58)`) and a punch-out `<Rect fill="#000" />` over the exact target coordinates.
   - The focused element on the real underlying screen remains 100% visible and un-dimmed.
2. **Pulsing Halo Frame:**
   - A pulsing green highlight ring (`Colors.PRIMARY`) with `useNativeDriver: true` pulses smoothly around the target area without triggering JavaScript re-renders or frame drops.
3. **Adaptive Speech-Bubble Tooltip:**
   - Floats above or below the target element depending on available screen space.
   - Includes an SVG pointer beak pointing directly toward the cut-out spotlight.
   - Compact content layout: Category pill, close/skip button, title, description, tip badge, and Next/Back controls.
