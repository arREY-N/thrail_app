# Toast Management Architecture (`src/components/Toast/`)

> **Architectural Pattern:** Canonical Thrail Facade & Decoupled Notification Architecture  
> **Facade Entrypoint:** `@/src/components/Toast/Toast`  
> **Scope:** Universal Application Toasts, Dynamic Sticky Footer Docking, In-Modal Local Toasts, and Animated Feedback  

---

## 1. Architecture Motivation & Philosophy

In early iterations of Thrail, screens and modals individually managed their own local `useState` for toast messages, visibility, and timeouts, frequently mounting isolated `<CustomToast />` JSX tags at the bottom of each view. This led to several recurring issues:

1. **Repetitive Boilerplate:** Controllers and screens repeatedly duplicated 25+ lines of `toastMessage`, `toastVisible`, and `handleHideToast` callbacks.
2. **Visual Clashes with Sticky Footers:** Modals and screens with sticky action bars (`CustomStickyFooter`) suffered from toasts rendering behind action buttons or obscuring primary CTAs.
3. **Screen Unmount Truncation:** Toasts triggered immediately before a screen transition or route navigation (`router.back()`, `router.replace()`) were unmounted instantly with their parent view, depriving users of critical success feedback.
4. **Modal z-Index Traps:** Native React Native `<Modal>` instances mount in their own native window hierarchy above the root view. A universal toast mounted outside a modal is hidden behind that modal, while a toast inside the modal must navigate keyboard avoidance and centered dialog positioning.

To resolve these architectural limitations, Thrail standardizes on a **unified, dual-surface Toast architecture** centered on the canonical facade `@/src/components/Toast/Toast`.

---

## 2. Directory & Component Layout

```text
src/components/
├── CustomToast.tsx                   <- Standalone presentation component (maintained in src/components/)
└── Toast/
    ├── Toast.ts                      <- Public domain facade (single import entrypoint)
    ├── ToastFeature.md               <- Feature & architectural documentation
    ├── Toast.types.ts                <- Types: ToastType, ToastVariant, ToastOptions, ToastConfig
    ├── ToastContext.tsx              <- Context & Provider with dynamic footer docking engine
    └── useToast.ts                   <- Ergonomic feature hook with bound shorthand helpers
```

---

## 3. The Public Facade Contract (`@/src/components/Toast/Toast`)

All external consumers, screens, controllers, and modals MUST import types, hooks, providers, and presentation components through the single public facade:

```typescript
// ✅ Correct: import exclusively via the facade
import {
    CustomToast,
    ToastContext,
    ToastProvider,
    useToast,
    type ToastOptions,
    type ToastType,
} from '@/src/components/Toast/Toast';
```

---

## 4. Dual-Surface Presentation Model

### A. Universal Global Toast (Standard Screens & Flows)

Mounted once at the root layout (`src/app/_layout.tsx`):

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
    <ToastProvider>
        <RootNavigationStack />
    </ToastProvider>
</GestureHandlerRootView>
```

Controllers and screens trigger notifications anywhere with zero JSX mounting:

```typescript
const { showToast } = useToast();

// Shorthand helpers
showToast.success("Reservation confirmed!");
showToast.error("Failed to load trail coordinates.");
showToast.warning("Please fill in all required fields.");
showToast.info("Offline map downloaded.");

// Advanced options
showToast({
    message: "Action completed",
    type: "success",
    mode: "dismissible",
    variant: "card",
});
```

### B. In-Modal Local Toast (Deep Modals & Dialogs)

For complex dialog sheets and forms (`EditPointModal`, `CancelBookingModal`, `LegalTermsModal`, `EmergencyModal`, `AdminCancelBookingModal`), `CustomToast` is imported from the facade and mounted directly inside the `<Modal>` container:

```tsx
<Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalContent}>
        {/* Modal form fields */}

        {/* In-Modal Docked Toast */}
        <CustomToast
            visible={toastState.visible}
            message={toastState.message}
            type={toastState.type}
            mode="dismissible"
            position="sticky_footer"
            bottomOffset={isWideScreen ? 96 : Math.max(insets.bottom + 96, 96)}
            onHide={() => setToastState((prev) => ({ ...prev, visible: false }))}
        />
    </View>
</Modal>
```

---

## 5. Dynamic Sticky Footer Docking Engine

When a screen features a persistent action bar (`CustomStickyFooter`), toasts must float precisely **12px above the action bar**, adjusting automatically across mobile safe-areas and desktop viewport heights.

### How It Works

1. When `enableToastDock={true}` is set on `<CustomStickyFooter />`, the footer measures its rendered layout height via `onLayout`.
2. It calls `registerFooterHeight(measuredHeight)` on `ToastContext`.
3. When the screen unmounts, it invokes `unregisterFooterHeight()`.
4. `ToastProvider` computes the effective bottom offset:
   - If docked: `dockedFooterHeight + 12px` (plus safe-area inset if needed).
   - If tab bar: `insets.bottom + 64px`.
   - If floating: `insets.bottom + 24px`.

---

## 6. Dual Modes: Simple vs. Dismissible

| Property | Simple Mode (`mode="simple"`) | Dismissible Mode (`mode="dismissible"`) |
| :--- | :--- | :--- |
| **Duration** | 2200ms fixed | 4000ms configurable |
| **Visuals** | Compact status pill / badge | Full-width status card with icon |
| **Countdown Bar** | None | Smooth horizontal animated progress bar |
| **Dismiss Action** | Automatic timer only | Tactile close 'X' button with immediate `stopAnimation()` |
| **Use Case** | Quick feedback (copied link, toggled favorite) | Form validation errors, warnings, action requirements |

---

## 7. Default Toast Message & Smart Auto-Defaults (`ToastContext.tsx` & `CustomToast.tsx`)

When calling `showToast` via `useToast()` or mounting `<CustomToast />`, the system applies intelligent defaults so callers only need to pass the message string and semantic type:

| Option / Prop | Default Value | Smart Resolution Behavior |
| :--- | :--- | :--- |
| **`type`** | `'info'` | Supports `'success' \| 'warning' \| 'info' \| 'error'`. Shorthands (`showToast.error(...)`, `showToast.success(...)`, etc.) bind this automatically. |
| **`variant`** | `'card'` | Renders a clean light card (`Colors.TOAST_BG_LIGHT`) with a circular semantic icon badge. Also supports `'accent-left'` and `'dark'`. |
| **`mode`** | Auto (`'dismissible'` for `'error'`, `'simple'` otherwise) | In `ToastContext.tsx`: `options.mode ?? (type === 'error' ? 'dismissible' : 'simple')`. Error toasts automatically get a `4000ms` timer, animated bottom progress bar, and manual `'X'` close button; `'info'`, `'success'`, and `'warning'` default to a clean `2200ms` pill. |
| **`position`** | Auto (`'sticky_footer'` if docked, `'tabbar'` otherwise) | In `ToastContext.tsx`: `options.position ?? (dockedFooterHeight !== null ? 'sticky_footer' : 'tabbar')`. Automatically floats `12px` above `<CustomStickyFooter enableToastDock={true} />` when present. |
| **`triggerKey`** | `Date.now()` | Assigned automatically on every `showToast` call. If a user repeatedly taps an invalid/blocked button while the same toast message is already visible, `CustomToast` detects the new `triggerKey`, performs a prominent horizontal **shake micro-animation** (`-10px` to `+10px`), and restarts the countdown timer. |
| **`onHide`** | `undefined` | Invoked immediately when the timer expires or the user taps `'X'` (before the `200ms` fade-out finishes) so button validation states reset without delay. |

---

## 8. Core Trio Integration: `useToast.ts` + `CustomButton.tsx` + `CustomStickyFooter.tsx`

Across Thrail's interactive booking and form workflows (pioneered in `OffersScreen.tsx` and `DetailsScreen.tsx`), **toast feedback is tightly coupled with sticky footer and button validation states** through three files:

### A. `useToast.ts` — Triggering Toasts & Resetting Validation via `onHide`

`useToast()` returns `{ showToast, hideToast, registerFooterHeight, unregisterFooterHeight, dockedFooterHeight }`.

When validating a form or selection on button press:
1. Set a local boolean flag (e.g., `setHasAttemptedSubmit(true)`) so the button turns red (`validationState="error"`).
2. Call `showToast.error(message, { onHide: () => setHasAttemptedSubmit(false) })`.
3. While the error toast is visible on screen, the button stays in its red `'error'` state. As soon as the toast auto-dismisses or the user taps `'X'`, `onHide` resets `hasAttemptedSubmit` back to `false`, returning the button to its calm `'idle'` state.

```tsx
import { useToast } from '@/src/components/Toast/Toast';

const { showToast } = useToast();
const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

const handleActionPress = () => {
    if (!isSelectionValid) {
        setHasAttemptedSubmit(true);
        showToast.error('Please select an offer to continue.', {
            onHide: () => setHasAttemptedSubmit(false),
        });
        return;
    }
    onContinue();
};
```

---

### B. `CustomButton.tsx` — Tri-State `validationState` & Default `disabledToastMessage`

[`CustomButton.tsx`](file:///c:/Projects/thrail_app/src/components/CustomButton.tsx) connects directly to `ToastContext` and supports **two complementary mechanisms** for surfacing toast feedback on incomplete or disabled actions:

#### 1. Semantic Tri-State Validation (`validationState?: 'valid' | 'idle' | 'error'`)

Instead of disabling a primary CTA with `disabled={true}` (which makes the button unresponsive and leaves the user guessing why they cannot proceed), Thrail uses `ButtonValidationState`:

| State | Shorthand Prop | Visual Styling | Interaction Behavior |
| :--- | :--- | :--- | :--- |
| **`'idle'`** | `isIdleDisabled={true}` | Neutral gray surface (`Colors.GRAY_ULTRALIGHT`), subtle border (`Colors.GRAY_LIGHT`), secondary text (`Colors.TEXT_SECONDARY`), no drop shadow | **Remains tappable!** Tapping calls `onPress`, which validates which field/step is missing and triggers `showToast.error(...)`. |
| **`'error'`** | `hasError={true}` | Soft red surface (`Colors.STATUS_CANCELLED_BG`), red border & text (`Colors.STATUS_CANCELLED_TEXT`), no drop shadow | Active while the error toast is displayed on screen; resets to `'idle'` via the toast's `onHide` callback. |
| **`'valid'`** | *(default)* | Primary brand green (`Colors.PRIMARY`), white text (`Colors.WHITE`), elevated drop shadow | All requirements met; tapping executes the primary submission or navigation action. |

#### 2. Built-In Default Disabled Toast (`disabledToastMessage` & `disabledToastType`)

For simpler buttons where `disabled={true}` is used directly without a custom `onPress` validation chain, `CustomButton` accepts `disabledToastMessage` and `disabledToastType` (defaults to `'error'`):

```tsx
<CustomButton
    title="Submit Review"
    disabled={!canSubmit}
    isIdleDisabled={!canSubmit}
    disabledToastMessage="Please complete your hike before submitting a trail review."
    disabledToastType="error"
    onPress={handleSubmitReview}
/>
```

When `disabled={true}` and `disabledToastMessage` is provided, `CustomButton` keeps the `Pressable` active (`isInteractive = !isLoading && (Boolean(onPress) || Boolean(disabledToastMessage))`) and automatically calls:

```tsx
if (disabled && disabledToastMessage && toastContext) {
    toastContext.showToast(disabledToastMessage, disabledToastType);
    return;
}
```

---

### C. `CustomStickyFooter.tsx` — Automatic Toast Docking & Button Forwarding

[`CustomStickyFooter.tsx`](file:///c:/Projects/thrail_app/src/components/CustomStickyFooter.tsx) acts as the bridge between screen layouts, `CustomButton`, and `ToastContext`:

1. **Automatic Height Registration (`enableToastDock={true}`):**
   - Measures the rendered footer container height via `onLayout` and calls `toastContext.registerFooterHeight(height)`.
   - Automatically cleans up via `toastContext.unregisterFooterHeight()` when the screen unmounts.
2. **Full `FooterButtonConfig` Forwarding:**
   - Both `primaryButton` and `secondaryButton` accept `validationState`, `hasError`, `isIdleDisabled`, `disabledToastMessage`, and `disabledToastType` and pass them directly to the underlying `<CustomButton />`.

---

## 9. Canonical Screen Implementations (`OffersScreen.tsx` & `DetailsScreen.tsx`)

The tri-state button + docked toast pattern was first established and is most comprehensively used in the Booking flow screens:

### Pattern 1: Selection, Cutoff & Conflict Validation in [`OffersScreen.tsx`](file:///c:/Projects/thrail_app/src/features/Book/screens/Booking/OffersScreen.tsx)

In `OffersScreen.tsx`, the sticky footer button dynamically updates both its **title** and its **`validationState`** based on the selected offer's status (`isExactBooked`, `isDateConflict`, `isWithinAdvanceCutoff`, `isClosed`, `isFull`):

```tsx
const { showToast } = useToast();
const [hasAttemptedBlockedSubmit, setHasAttemptedBlockedSubmit] = useState(false);

const handleContinue = () => {
    if (!localSelectedId) {
        setHasAttemptedBlockedSubmit(true);
        showToast.error("Please select an offer to continue.", {
            onHide: () => setHasAttemptedBlockedSubmit(false),
        });
        return;
    }

    if (selectedOfferStatus?.isDateConflict) {
        setHasAttemptedBlockedSubmit(true);
        const overlapSpan = selectedOfferStatus.overlappingBooking?.formattedSpan || "this date";
        showToast.error(`You already have an active reservation overlapping this date (${overlapSpan}).`, {
            onHide: () => setHasAttemptedBlockedSubmit(false),
        });
        return;
    }

    if (selectedOfferStatus?.isWithinAdvanceCutoff) {
        setHasAttemptedBlockedSubmit(true);
        showToast.error(
            selectedOfferStatus.isToday
                ? "Reservations for today are closed. Please choose an upcoming date at least 1 week ahead."
                : "Reservations require at least 1 week advance notice. Please select an offer at least 7 days ahead.",
            { onHide: () => setHasAttemptedBlockedSubmit(false) }
        );
        return;
    }

    onContinue(localSelectedId);
};

const getFooterButtonValidationState = (): 'valid' | 'idle' | 'error' => {
    if (hasAttemptedBlockedSubmit) return 'error';
    if (!localSelectedId) return 'idle';
    if (isSelectedOfferBlocked && !(selectedOfferStatus?.isExactBooked && onViewBookingDetails)) {
        return 'idle';
    }
    return 'valid';
};

// Mounted at bottom of OffersScreen:
<CustomStickyFooter
    enableToastDock={true}
    primaryButton={{
        title: getFooterButtonTitle(),
        onPress: handleContinue,
        validationState: getFooterButtonValidationState(),
    }}
/>
```

---

### Pattern 2: Sequential Multi-Section Form Validation in [`DetailsScreen.tsx`](file:///c:/Projects/thrail_app/src/features/Book/screens/Booking/DetailsScreen.tsx)

In `DetailsScreen.tsx`, the hiker must complete multiple sections (Birthdate eligibility → Hiker Phone → Emergency/Guardian Contact → Required Document Uploads → Digital Waiver Signature). Tapping **Reserve** while any section is incomplete highlights the button in `'error'` state and displays the exact next requirement in a docked error toast:

```tsx
const { showToast } = useToast();
const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

const isFormValid = isContactComplete && areAllDocsUploaded && isSignatureValid;

const handleReservePress = () => {
    if (isSubmitting || isConfirmingRef.current) return;

    if (isInvalidOrUnsetBirthday) {
        setHasAttemptedSubmit(true);
        showToast.error("Please set your valid birthdate in Profile to complete reservation.", {
            onHide: () => setHasAttemptedSubmit(false),
        });
        return;
    }

    if (!isPhoneSet) {
        setHasAttemptedSubmit(true);
        showToast.error("Please enter your contact phone number to proceed.", {
            onHide: () => setHasAttemptedSubmit(false),
        });
        return;
    }

    if (!isEmergencySet) {
        setHasAttemptedSubmit(true);
        showToast.error(
            isMinor
                ? "Parent / Guardian emergency contact is required to proceed."
                : "Emergency contact (name & phone number) is required to proceed.",
            { onHide: () => setHasAttemptedSubmit(false) }
        );
        return;
    }

    if (!areAllDocsUploaded) {
        setHasAttemptedSubmit(true);
        const remaining = activeDocuments.length - uploadedCount;
        showToast.error(`Please upload all required documents (${remaining} remaining).`, {
            onHide: () => setHasAttemptedSubmit(false),
        });
        return;
    }

    if (!isSignatureValid) {
        setHasAttemptedSubmit(true);
        showToast.error(
            isMinor
                ? "Parent / Guardian signature and policy review are required to proceed."
                : "Please review all policies and type your full name in the signature field to reserve.",
            { onHide: () => setHasAttemptedSubmit(false) }
        );
        return;
    }

    setShowConfirmModal(true);
};

// Mounted at bottom of DetailsScreen:
<CustomStickyFooter
    enableToastDock={true}
    primaryButton={{
        title: isSubmitting ? "Reserving..." : "Reserve",
        disabled: isSubmitting,
        isLoading: isSubmitting,
        validationState: isFormValid ? 'valid' : (hasAttemptedSubmit ? 'error' : 'idle'),
        onPress: handleReservePress,
    }}
/>
```

---

## 10. Responsive Design Standards

- **Mobile Viewports (`isMobile === true`):** Toasts render at `width: '90%'` centered horizontally, respecting safe-area bottom insets and physical software keyboards.
- **Web Desktop (`isMobile === false`):** Toasts are constrained to `width: 420px` and dynamically centered (`alignSelf: 'center'`) to avoid full-width layout stretching.
- **Design Tokens:** Strictly uses `Colors.*` semantic tokens (`Colors.TOAST_BG_LIGHT`, `Colors.TOAST_ERROR_ICON_BG`, `Colors.TOAST_ERROR_ICON_FG`, `Colors.TOAST_SUCCESS_ICON_FG`), `GlobalStyles.dropShadow(8)` with `elevation: 8`, and `borderRadius: 14`.
