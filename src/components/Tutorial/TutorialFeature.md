# In-App Tutorial Architecture (`src/components/Tutorial/`)

> **Architectural Pattern:** Canonical Thrail Facade & Modular Walkthrough Architecture  
> **Facade Entrypoint:** `@/src/components/Tutorial/Tutorial`  
> **Presentation Component:** `@/src/components/CustomTutorialModal`  
> **Scope:** User 5-Tabs & Web Drawer Tour, Booking & Payment Tours, Emergency & Legal Modal Tours, Admin Dashboard & Offer/Review Tours, Demand-Driven Layout Registry, and Header `?` Replay Spotlight  

---

## 1. Directory & Component Layout

```text
src/
└── components/
    ├── CustomTutorialModal.tsx                   <- Standalone presentation component & TutorialHelpButton
    │
    └── Tutorial/                                 <- 100% Self-Contained Domain Package
        ├── Tutorial.ts                           <- Public domain facade (single import entrypoint)
        ├── TutorialFeature.md                    <- Feature, implementation & troubleshooting guide
        │
        ├── interfaces/                           <- Type contracts
        │   └── Tutorial.types.ts                 <- TutorialTourId, TargetSpotlightType, TutorialStep, TutorialTourConfig
        │
        ├── hooks/                                <- State management & 3-tier persistence
        │   └── useTutorialGuide.ts               <- Hook managing Firestore + session cache + AsyncStorage per uid
        │
        ├── utils/                                <- Demand-driven 2D coordinate registries
        │   ├── tutorialLayoutRegistry.ts         <- Window coordinate registry (measureInWindow) for screen targets
        │   └── webDrawerLayoutRegistry.ts        <- Web sidebar navigation item coordinate registry
        │
        └── constants/                            <- Modular per-flow step configurations
            ├── index.ts                          <- Combines all 16 tours + createReplayHelpStep() helper
            ├── tabsTour.ts                       <- User/Admin: 5 Main Tabs (Mobile) / Sidebar Drawer Items (Web)
            ├── bookingOffersTour.ts              <- User: OffersScreen (Replay '?' -> Date Calendar -> Offer Cards -> Footer)
            ├── bookingDetailsTour.ts             <- User: DetailsScreen (Contact Setup -> Required Docs -> Waiver & Terms)
            ├── bookingStatusTour.ts              <- User: StatusScreen (Reservation Status -> Timeline -> Summary -> Actions)
            ├── myBookingDetailsTour.ts           <- User: MyBookingDetailsScreen (Quick Info -> Tracker -> Docs -> Payment)
            ├── legalTermsTour.ts                 <- User: LegalTermsModal (Policy Tabs -> Scroll-to-Bottom Acknowledgment)
            ├── emergencyModalTour.ts             <- User: EmergencyModal (Unified & Emergency-Only Contact Setup)
            ├── paymentTour.ts                    <- User: PaymentScreen & PaymentStatusScreen (Options -> Wallet -> Receipt)
            ├── adminDashboardTour.ts             <- Admin: Dashboard Overview & 3 Quick Action Cards
            ├── adminOfferListTour.ts             <- Admin: Offer Management List (Create Button -> Filters -> Offer Card)
            ├── adminOfferWriteTour.ts            <- Admin: Offer Create/Edit Form (Step 1 Trail/Schedule & Step 2 Pricing/Docs)
            ├── adminOfferViewTour.ts             <- Admin: Offer Bookings View (Summary -> Status Filters -> Booking Card)
            └── adminBookingReviewTour.ts         <- Admin: Hiker Booking, Document & Payment Review
```

---

## 2. Public Facade Contract (`@/src/components/Tutorial/Tutorial`)

All screens, controllers, and components MUST import tutorial components, hooks, layout registries, and types exclusively via the public facade:

```tsx
import {
    CustomTutorialModal,
    TutorialHelpButton,
    useTutorialGuide,
    isTutorialMeasurementActive,
    registerTutorialLayout,
    registerMeasureCallback,
    requestTargetMeasurement,
    type TutorialStep,
    type TutorialTourId,
    type TargetSpotlightType,
} from '@/src/components/Tutorial/Tutorial';
```

---

## 3. 3-Tier Persistence & Zero-Lag Engine (`useTutorialGuide.ts`)

`useTutorialGuide(tourId, enabled, overrideSteps)` manages per-user, per-tour completion state without blocking screen transitions:

1. **Tier 1 — Firestore User Profile (`profile.onTutorialComplete`):**
   - Reads `useAuthStore((s) => s.profile?.onTutorialComplete)` via `normalizeTutorialComplete()` and writes completion via `UserRepo.updateTutorialProgress(uid, tourId, true)`.
   - Optimistically updates `useAuthStore` in memory so subsequent screens see completion immediately.
2. **Tier 2 — In-Memory Session Cache (`sessionCompletionCache`):**
   - Caches completion status in a `Map<string, TutorialCompletionMap>` keyed by `@thrail_tutorials_v1_${uid}` for `0ms` synchronous lookups during multi-step flows (such as transitioning from `OffersScreen` → `DetailsScreen` → `StatusScreen`).
3. **Tier 3 — Local `AsyncStorage` Backup (`@thrail_tutorials_v1_${uid}`):**
   - Persists completion locally on the device as an offline-resilient fallback.

### Hook Signature & Parameters

```tsx
const tutorial = useTutorialGuide(
    'booking_offers', // 1. tourId: TutorialTourId
    !isLoading,       // 2. enabled?: boolean (defaults to true; pass false while screen data is loading)
    customSteps       // 3. overrideSteps?: TutorialStep[] (optional dynamic steps for conditional tabs/modes)
);
```

---

## 4. Replay (`?`) Guidance & Conditional Help Button Pattern

To prevent modal fatigue and respect user autonomy, the guide system adheres to non-intrusive discovery principles:

1. **Natural Tour Completion & Immediate Skip:**
   - Every tour ends naturally on its true functional final step (e.g., Save Offer, Submit Booking, Got It).
   - Tapping **"Skip"** immediately completes and dismisses the walkthrough cleanly without intercepting or jumping to an extra step.
2. **Conditional '?' Help Button Visibility:**
   - The top-right `?` (`TutorialHelpButton`) only appears if a guide is actively placed/configured with steps for that screen (`hasGuide={tutorial.hasGuide}`).
   - If a screen has no guide registered or `tutorial.hasGuide === false`, the button returns `null` and is not rendered.
3. **On-Demand Discoverability:**
   - On web, hovering over the `?` button reveals a native tooltip: `"Replay Screen Guide"`.
   - On mobile, `accessibilityLabel="Replay screen tutorial guide"` provides full screen-reader support. Users can tap `?` anytime to replay the walkthrough on demand.

---

## 5. Visual UX: SVG Cutout Spotlight & Adaptive Speech Bubble

1. **SVG Path Cutout + Locked SVG Border Stroke:**
   - Uses `react-native-svg` `<Path fillRule="evenodd" />` to punch a transparent spotlight window out of the dimmed backdrop (`Colors.TUTORIAL_OVERLAY_BG`) at the target's exact `{ x, y, width, height }` window coordinates.
   - Renders the glowing green spotlight border (`Colors.PRIMARY`) as a locked SVG `<Rect>` stroke inside the same SVG coordinate space, avoiding Android `elevation` blur or `Animated.View` layout jitter.
2. **Option A Interactive Backdrop Tap:**
   - Tapping the dimmed backdrop outside the tooltip card advances to the next step (`onNext`), preventing users from feeling trapped by large tooltips.
3. **Adaptive Speech-Bubble Tooltip:**
   - Automatically positions itself above (`top`), below (`bottom`), to the side (`right` for web navigation drawer), or centered (`center`) based on available viewport space, complete with an SVG pointer arrow aimed at the target center.

---

## 6. Step-by-Step Guide: Implementing a Tutorial on a New Screen, Component, or Modal

Follow these **5 steps** whenever adding a tutorial to a new screen, component, or modal.

### Step 1: Register `TutorialTourId` and `TargetSpotlightType`

Open [`src/components/Tutorial/interfaces/Tutorial.types.ts`](file:///c:/Projects/thrail_app/src/components/Tutorial/interfaces/Tutorial.types.ts) and add:

1. Your new tour identifier to `TutorialTourId` (e.g., `'my_new_screen'`).
2. Each spotlight target key to `TargetSpotlightType` (e.g., `'my_feature_header_card' | 'my_feature_action_btn'`).

---

### Step 2: Create the Tour Step Config & Register in `constants/index.ts`

1. Create `src/components/Tutorial/constants/myNewScreenTour.ts`:

```tsx
import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const myNewScreenTourSteps: TutorialStep[] = [
    {
        id: 'my-screen-step-1',
        category: 'Step 1 • Overview',
        title: 'Review Your Trail Summary',
        description: 'This card displays the key elevation, distance, and difficulty metrics.',
        actionTip: 'Check the difficulty badge before selecting a package.',
        targetSpotlight: 'my_feature_header_card',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'my-screen-step-2',
        category: 'Step 2 • Primary Action',
        title: 'Confirm & Continue',
        description: 'Tap the bottom action button once all required selections are complete.',
        targetSpotlight: 'booking_footer',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
];
```

1. Register the tour in [`src/components/Tutorial/constants/index.ts`](file:///c:/Projects/thrail_app/src/components/Tutorial/constants/index.ts):

```tsx
my_new_screen: {
    tourId: 'my_new_screen',
    tourTitle: 'Trail Summary — Quick Guide',
    roleScope: 'user',
    steps: [...myNewScreenTourSteps, createReplayHelpStep('Trail Summary')],
},
```

---

### Step 3: Measure Target Elements in the Screen or Component

To spotlight a real UI element, measure its window coordinates using `measureInWindow` and register them with `tutorialLayoutRegistry`.

> **Critical Rules for Target Measurement:**
>
> 1. Always add `collapsable={false}` to the `<View ref={targetRef}>` wrapper so Android does not optimize away the view node and return `(0, 0, 0, 0)`.
> 2. Guard `onLayout` with `if (!isTutorialMeasurementActive()) return;` so `measureInWindow` is never called during normal non-tutorial app usage.
> 3. Register a callback via `registerMeasureCallback('target_id', measureTargetNow)` inside a `useEffect` so `CustomTutorialModal` can request fresh coordinates on demand when stepping onto that target.

```tsx
import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from '@/src/components/Tutorial/Tutorial';

const targetCardRef = useRef<View>(null);

const measureTargetCardNow = useCallback(() => {
    targetCardRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
            registerTutorialLayout('my_feature_header_card', { x, y, width, height });
        }
    });
}, []);

const handleTargetCardLayout = useCallback(() => {
    if (!isTutorialMeasurementActive()) return;
    measureTargetCardNow();
}, [measureTargetCardNow]);

useEffect(() => {
    return registerMeasureCallback('my_feature_header_card', measureTargetCardNow);
}, [measureTargetCardNow]);

// In JSX:
<View
    ref={targetCardRef}
    collapsable={false}
    onLayout={handleTargetCardLayout}
>
    {/* Target UI content */}
</View>
```

> **Note on `CustomStickyFooter`:** `CustomStickyFooter` already automatically measures and registers itself under the `'booking_footer'` key (and aliases `'booking_offers_footer'` / `'booking_status_primary'`). You do not need to wrap `CustomStickyFooter` in an extra ref!

---

### Step 4: Wire Bidirectional Auto-Scroll (For Scrollable Screens)

When a screen uses a `ScrollView` (such as [`OffersScreen.tsx`](file:///c:/Projects/thrail_app/src/features/Book/screens/Booking/OffersScreen.tsx) or [`DetailsScreen.tsx`](file:///c:/Projects/thrail_app/src/features/Book/screens/Booking/DetailsScreen.tsx)), targets further down the page may be off-screen. You MUST implement **bidirectional auto-scroll** so both **Next** and **Back** navigation scroll smoothly to the active target and re-measure after the scroll settles (`250ms`), and reset scroll to `y: 0` when the tutorial closes:

```tsx
const scrollViewRef = useRef<ScrollView>(null);
const secondSectionOffsetY = useRef<number>(0);

// 1. Bidirectional step auto-scroll + post-scroll re-measurement (250ms settle delay)
useEffect(() => {
    if (!isTutorialVisible) return;

    if (activeTutorialStep === 'my_feature_header_card') {
        scrollViewRef.current?.scrollTo({
            y: 0,
            animated: true,
        });
        const timer = setTimeout(measureTargetCardNow, 250);
        return () => clearTimeout(timer);
    } else if (activeTutorialStep === 'my_second_section_card') {
        scrollViewRef.current?.scrollTo({
            y: Math.max(0, secondSectionOffsetY.current - 16),
            animated: true,
        });
        const timer = setTimeout(measureSecondSectionNow, 250);
        return () => clearTimeout(timer);
    }
}, [isTutorialVisible, activeTutorialStep, measureTargetCardNow, measureSecondSectionNow]);

// 2. Always reset scroll position to top (y: 0) when tutorial closes or completes
const prevTutorialVisible = useRef(isTutorialVisible);
useEffect(() => {
    if (prevTutorialVisible.current && !isTutorialVisible) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
    prevTutorialVisible.current = isTutorialVisible;
}, [isTutorialVisible]);
```

Capture `secondSectionOffsetY.current` on the section container's `onLayout`:

```tsx
<View
    onLayout={(e) => {
        secondSectionOffsetY.current = e.nativeEvent.layout.y;
    }}
>
    {/* Section 2 content */}
</View>
```

---

### Step 5: Mount `TutorialHelpButton` & `CustomTutorialModal`

#### Case A — Standard Screen / Controller

In your screen or controller:

1. Pass `<TutorialHelpButton onPress={tutorial.onReplayTour} hasGuide={tutorial.hasGuide} />` to `CustomHeader`'s `rightElement` or `rightActions`.
2. Pass `activeTutorialStep={tutorial.isVisible ? tutorial.currentStep?.targetSpotlight : undefined}` and `isTutorialVisible={tutorial.isVisible}` down to the screen view if it needs auto-scroll.
3. Render `<CustomTutorialModal />` at the root of the view:

```tsx
const tutorial = useTutorialGuide('my_new_screen', !isLoading);

return (
    <ScreenWrapper>
        <CustomHeader
            title="Trail Summary"
            showBackButton={true}
            rightActions={<TutorialHelpButton onPress={tutorial.onReplayTour} hasGuide={tutorial.hasGuide} />}
        />

        <MyNewScreen
            activeTutorialStep={tutorial.isVisible ? tutorial.currentStep?.targetSpotlight : undefined}
            isTutorialVisible={tutorial.isVisible}
        />

        <CustomTutorialModal
            visible={tutorial.isVisible}
            tourConfig={tutorial.tourConfig}
            currentStep={tutorial.currentStep}
            currentStepIndex={tutorial.currentStepIndex}
            totalSteps={tutorial.totalSteps}
            onNext={tutorial.onNextStep}
            onPrev={tutorial.onPrevStep}
            onSkip={tutorial.onSkipTour}
        />
    </ScreenWrapper>
);
```

#### Case B — Inside a `<Modal>` Dialog (e.g., `EmergencyModal.tsx`, `LegalTermsModal.tsx`)

When mounting `CustomTutorialModal` inside an existing React Native `<Modal>`, follow the **Cross-Platform Modal Tutorial Overlay** rule:

- Set `useModal={Platform.OS === 'web'}` on `<CustomTutorialModal />`.
  - On **Web**, `useModal={true}` portals the overlay to the top-level document body so it isn't clipped by the modal card's `overflow: 'hidden'`.
  - On **Android / iOS**, `useModal={false}` renders an inline `StyleSheet.absoluteFillObject` overlay inside the `<Modal>` window hierarchy so it never gets trapped behind a stacked native modal or freezes touch events.
- Ensure the parent modal backdrop/wrapper has `position: 'relative'`.

```tsx
<CustomTutorialModal
    visible={tutorial.isVisible}
    tourConfig={tutorial.tourConfig}
    currentStep={tutorial.currentStep}
    currentStepIndex={tutorial.currentStepIndex}
    totalSteps={tutorial.totalSteps}
    useModal={Platform.OS === 'web'}
    onNext={tutorial.onNextStep}
    onPrev={tutorial.onPrevStep}
    onSkip={tutorial.onSkipTour}
/>
```

---

## 7. Troubleshooting & Bug-Fixing Playbook

Use this diagnostic table whenever fixing or auditing a tutorial on any screen or component:

| Symptom / Bug | Root Cause | Exact Fix |
| :--- | :--- | :--- |
| **Spotlight cutout does not appear on Android** (falls back to centered modal or `(0,0)`) | Android view flattening optimized away the wrapper `<View>`, causing `measureInWindow` to return `width: 0, height: 0`. | Add `collapsable={false}` to the `<View ref={...}>` that wraps the spotlight target. |
| **Spotlight cutout is vertically offset / misaligned on a scrollable screen** | `measureInWindow` fired before the `ScrollView` finished its animated scroll transition. | Inside the `activeTutorialStep` `useEffect`, call `scrollViewRef.current?.scrollTo(...)` and trigger `setTimeout(measureTargetNow, 250)` (or `requestTargetMeasurement(id)`). |
| **Pressing "Back" in the tutorial leaves the spotlight off-screen** | Auto-scroll `useEffect` only handled forward steps or omitted the earlier step's scroll target (`y: 0`). | Add explicit `if / else if` branches for **every** scrollable step (including scrolling back to `y: 0` for the first step). |
| **Screen remains stranded at the bottom after finishing or skipping the tutorial** | No cleanup effect restores the `ScrollView` position when `isTutorialVisible` becomes `false`. | Track `prevTutorialVisible` with a `useRef` and call `scrollViewRef.current?.scrollTo({ y: 0, animated: true })` when transitioning from `true` → `false`. |
| **Tutorial inside a `<Modal>` is invisible on Android/iOS or clipped inside the modal box on Web** | Hardcoded `useModal={true}` (stacks a 2nd native `<Modal>` that fails on mobile) or hardcoded `useModal={false}` (clipped by modal card on Web). | Always pass `useModal={Platform.OS === 'web'}` to `<CustomTutorialModal />` when rendered inside a `<Modal>`, and keep the modal root container `position: 'relative'`. |
| **Target coordinates don't update when dynamic data loads after mount** | Target rendered after initial mount or changed size without re-registering its layout. | Keep `onLayout={handleTargetLayout}` (guarded by `isTutorialMeasurementActive()`) on the target `<View>` AND register `registerMeasureCallback(id, measureNow)` in `useEffect`. |
| **Spotlight key mismatch between tour step and component** | Tour step uses an alias or different key than `registerTutorialLayout`. | Verify `targetSpotlight` in `constants/*Tour.ts` matches the exact key passed to `registerTutorialLayout` and `registerMeasureCallback` (or check `CANONICAL_KEY_ALIASES` in `tutorialLayoutRegistry.ts`). |
| **Conditional UI tabs or modal modes show wrong tutorial steps** | Static tour config in `TUTORIAL_TOURS` doesn't reflect active tab or modal mode (`unified` vs `emergencyOnly`, `documents` vs `payment`). | Pass the appropriate step array as the 3rd argument (`overrideSteps`) to `useTutorialGuide(tourId, enabled, activeSteps)`. |
