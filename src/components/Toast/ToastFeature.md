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

## 7. Responsive Design Standards

- **Mobile Viewports (`isMobile === true`):** Toasts anchor horizontally with `paddingHorizontal: 16`, respecting safe-area bottom insets and physical software keyboards.
- **Web Desktop (`isMobile === false`):** Toasts are constrained to `maxWidth: 480px` and dynamically centered (`alignSelf: 'center'`) to avoid full-width layout stretching.
- **Design Tokens:** Strictly uses `Colors.*` semantic tokens (`Colors.STATUS_ERROR_BG`, `Colors.STATUS_SUCCESS_TEXT`, `Colors.MAP_CARD_BACKDROP`), `GlobalStyles.dropShadow(3)` with `elevation: 3`, and standard `borderRadius: 24` or `borderRadius: 16`.
