# Implementation Plan: Custom Admin Refund & Financial Protection System

## 1. Executive Summary

This document outlines the architectural plan for implementing **Admin-Controlled Custom Refunds** in the payment system. It resolves identified system discrepancies, answers all architectural safety questions, and introduces robust financial guardrails (idempotency, distributed locking, double-click protection, and gateway error handling) to protect both the admin and the customer.

---

## 2. Answers to Double-Checking Questions

### Q1: Is the custom refund the exact amount or a percentage?
* **Primary Value**: **Exact Amount in Philippine Pesos (PHP)**.
* **Why**: PayMongo's Gateway API ([`PayMongoProvider.js`](file:///d:/thrail_app/functions/services/providers/PayMongoProvider.js#L164)) processes refunds in exact centavos (`Math.round(amount * 100)`). Admins frequently need to refund specific sums (e.g., deducting an environmental fee of ₱150, retaining a non-refundable deposit, or reimbursing a specific charge).
* **UI Convenience**: While the transaction is executed as an **exact amount**, the UI will provide:
  * An exact currency text input (with `₱` prefix).
  * Real-time calculation showing the equivalent percentage of the total paid (e.g., `₱750.00 = 50.0%`).
  * Quick percentage preset buttons (`25%`, `50%`, `75%`) that immediately calculate and populate the exact PHP amount.

### Q2: Does the user see that option? (It shouldn't)
* **Frontend Isolation**: **No, regular users never see this option.**
  * The refund modal ([`AdminRefundModal.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminRefundModal.tsx)) is exclusively imported and rendered inside [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx#L614), which is mounted only on the admin route ([`src/app/(app)/(main)/admin/booking/view.tsx`](file:///d:/thrail_app/src/app/(app)/(main)/admin/booking/view.tsx)).
  * Customer cancellation in [`BookingDetailsScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/MyBookings/BookingDetailsScreen.tsx#L682) uses `ReasonModal`, which only prompts for a text reason.
* **Backend Security Guard**:
  * Even if a malicious user inspects network traffic and calls [`refundBooking`](file:///d:/thrail_app/functions/index.js#L1014) directly with a `customAmount` payload, the Cloud Function strictly validates caller claims:
    ```javascript
    const adminBusinessId = caller.token.businessId || caller.token.owner;
    const isAdmin = caller.token.role === 'admin' && adminBusinessId === data.business.id;
    const isSuperAdmin = caller.token.role === 'superadmin';
    if (!isAdmin && !isSuperAdmin) {
        // Disallow customAmount completely. Force regular policy (10% max) or reject.
    }
    ```
  * Any `customAmount` submitted by a non-admin is strictly ignored or rejected with `permission-denied`.

### Q3: Does it have proper rate limiting and double-click protection? What happens if internet is slow and the button is clicked twice?
* **Current Vulnerability (Critical Finding)**:
  * **Frontend**: There is currently no double-click debounce or loading lock on [`AdminRefundModal`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminRefundModal.tsx).
  * **Backend**: There is currently **no database lock or idempotency check** in [`refundBooking`](file:///d:/thrail_app/functions/index.js#L1014-L1093). If two requests arrive concurrently during a slow network burst, both read `status === 'captured'`, both invoke `issueRefund` with PayMongo, and PayMongo **issues two refunds**, deducting funds twice from the organizer's merchant account.
* **Target Protection Architecture**:
  * **Frontend Guard (Double-Click Prevention)**:
    1. Immediate UI state lock: On press, set `isSubmitting = true`, show spinner, and disable all buttons.
    2. Synchronous ref guard (`isSubmittingRef.current = true`) to prevent rapid consecutive touch events before the React re-render cycle completes.
  * **Backend Distributed Mutex Lock (Firestore Atomic Transaction)**:
    1. Before dispatching the HTTP request to PayMongo, perform an atomic Firestore transaction to check if payment is already in `processing_refund` or `refunded`.
    2. Set `capturedPayment.status = 'processing_refund'` and record `capturedPayment.refundLockUntil = serverTimestamp() + 60s`.
    3. If a second duplicate request arrives while the first is calling PayMongo, it immediately aborts with `failed-precondition: A refund is already being processed for this booking`.
    4. Call PayMongo API.
    5. If PayMongo succeeds: Mark status as `refunded` and record `refundedAmount`.
    6. If PayMongo fails: Revert status back to `captured` so the admin can safely retry.

---

## 3. Comprehensive Edge Cases & Safeguards

| # | Edge Case | Potential Danger | Guard / Solution |
|---|---|---|---|
| 1 | **Double-Click / Slow Network** | Duplicate gateway refund & double payout from merchant account. | Frontend ref lock + Backend two-phase Firestore status lock (`processing_refund`). |
| 2 | **Same-Day Partial Refund (PayMongo restriction)** | PayMongo throws `same_day_partial_refund_not_allowed` error. | 1. Detect if `capturedPayment.createdAt` is same calendar day.<br>2. Modal shows warning advice.<br>3. Cloud function catches specific error code and returns actionable message advising admin to issue 100% full refund or wait until tomorrow. |
| 3 | **Amount Exceeding Original Payment** | Financial loss exceeding booking value. | 1. Client-side input validation (`customAmount <= amountPaid`).<br>2. Server-side validation rejecting any `amount > capturedPayment.amount`. |
| 4 | **Zero, Negative, or NaN Amounts** | Invalid PayMongo payload / crash. | Validate `customAmount >= 1.00` (PayMongo minimum refund threshold) and enforce numeric sanitization. |
| 5 | **Floating Point Centavo Inaccuracies** | Rounding bugs (e.g. `0.1 + 0.2 = 0.30000000000000004`). | Explicit rounding before centavo conversion: `Math.round(Number(customAmount) * 100) / 100` and `Math.round(amount * 100)` for centavos. |
| 6 | **Partial Refund vs. Cancellation Status** | Booking status prematurely marked `cancelled` for partial refund adjustments. | Document and verify whether partial refunds should mark booking as `cancelled` (current policy) or retain active status if agreed upon. Default to current system policy: marks booking as `cancelled`. |
| 7 | **Discrepancy in Existing Hook** | Hook sends `50` for partial; backend checks for `10` or `'partial'`, falling back to 10%. | Harmonize `usePaymentAdmin.ts` and `functions/index.js` to ensure the exact desired percentage or custom amount is passed and applied. |
| 8 | **Insufficient Gateway Merchant Balance** | PayMongo API returns error if merchant account has insufficient balance to refund. | Catch error gracefully, revert Firestore lock, and display descriptive message to admin without corrupting booking state. |

---

## 4. Technical Specification

### A. Backend: [`functions/index.js`](file:///d:/thrail_app/functions/index.js)

```javascript
// Data Payload Contract
{
    bookingId: string,
    userId: string,
    reason?: string,
    refundPercentage?: 'full' | 'partial' | number,
    customAmount?: number // Admin-only: exact PHP amount
}
```

#### Detailed Execution Steps:
1. **Authentication & Authorization**:
   - Check `caller.token.role === 'admin'` and verify business ID match.
   - If `customAmount` is supplied and caller is not admin/superadmin, throw `HttpsError('permission-denied')`.
2. **Atomic Pre-Locking via Firestore Transaction**:
   - Query `capturedPayment`. Verify `status === 'captured'` and not locked.
   - Atomically update `status = 'processing_refund'` and `refundStartedAt = FieldValue.serverTimestamp()`.
3. **Amount Determination**:
   - If `isAdmin && customAmount > 0`:
     - Enforce `customAmount <= capturedPayment.amount`.
     - `refundAmount = Math.round(customAmount * 100) / 100`.
   - Else determine by `refundPercentage` (100% full or 10% partial standard).
4. **Call PayMongo**:
   - Call `PaymentManager.getProvider('paymongo').issueRefund(gatewayId, refundAmount, sanitizedReason)`.
5. **Success Commit**:
   - Set `capturedPayment.status = 'refunded'`.
   - Set `capturedPayment.refundedAmount = refundAmount`.
   - Set `booking.status = 'cancelled'`.
   - Add activity log record.
6. **Error Recovery**:
   - In `catch`, rollback `capturedPayment.status = 'captured'` and remove lock.
   - Translate `same_day_partial_refund_not_allowed` into clear guidance.

---

### B. Core Types & Hook: [`usePaymentAdmin.ts`](file:///d:/thrail_app/src/core/models/Payment/hooks/usePaymentAdmin.ts)

1. **Updated Types**:
   ```typescript
   export type RefundType = 'full' | 'partial' | 'custom';

   export interface RefundOptions {
       type: RefundType;
       customAmount?: number;
       reason?: string;
   }
   ```
2. **Updated `onRefund` Function**:
   - Accept `(booking: Booking, refundType: RefundType, customAmount?: number)`.
   - Implement local `isRefunding` loading state.
   - Maintain backward compatibility with [`useCancellationAdmin.ts`](file:///d:/thrail_app/src/core/models/Cancellation/hooks/useCancellationAdmin.ts#L88) where `onRefund(updatedBooking, 'full')` is called.

---

### C. UI Component: [`AdminRefundModal.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminRefundModal.tsx)

1. **Visual Hierarchy**:
   - Header with title "Select Refund Amount" and close button.
   - 3 Cards:
     1. **Full Refund (100%)** — `₱{amountPaid.toFixed(2)}`
     2. **Standard Partial Refund (10%)** — `₱{(amountPaid * 0.10).toFixed(2)}`
     3. **Custom Amount** — Interactive selection.
2. **Custom Amount Panel (when Custom is active)**:
   - Currency text field with `₱` prefix and clear decimal keypad.
   - 3 Quick preset chips: `[25%]`, `[50%]`, `[75%]`.
   - Dynamic breakdown text: `"₱X.XX will be refunded (Y% of ₱Z.ZZ)"`.
   - PayMongo Same-Day Notice box (subtle info alert): *"Partial refunds on payments made today may be restricted by the payment gateway."*
   - Inline error message if amount is invalid, 0, or exceeds total paid.
3. **Submit Button**:
   - Prominent button: `"Confirm Refund of ₱{amount.toFixed(2)}"`.
   - Disabled while invalid or while `isSubmitting === true`.
   - Shows `ActivityIndicator` during API call.

---

### D. Controller Component: [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx)

1. Update `ReviewScreenProps.onRefund`:
   ```typescript
   onRefund: (booking: Booking, refundType: RefundType, customAmount?: number) => Promise<Booking | undefined | void> | void;
   ```
2. Wire `onSelect={(refundType, customAmount) => ...}` to invoke `onRefund(booking, refundType, customAmount)`.

---

## 5. Verification Matrix

| Test Scenario | Input / Action | Expected Result |
|---|---|---|
| **Full Refund** | Select Full (100%) | Issues 100% refund, marks status as `refunded`, booking `cancelled`. |
| **Standard Partial** | Select Partial (10%) | Issues 10% refund, correctly records `refundedAmount = amount * 0.10`. |
| **Custom Amount (Valid)** | Enter `₱500.00` on a ₱1,500 booking | Issues ₱500 refund, displays `(33%)` in payment tab, updates Firestore. |
| **Custom Amount (Presets)** | Tap `50%` chip | Auto-fills half of total paid, updates dynamic label. |
| **Custom Amount (Exceeds Max)** | Enter `₱2,000` on ₱1,500 booking | Disables Confirm button, shows error `"Amount cannot exceed ₱1,500.00"`. |
| **Custom Amount (Zero/Negative)** | Enter `₱0.00` or `-50` | Disables Confirm button, shows error `"Minimum refund is ₱1.00"`. |
| **Double Click Simulation** | Rapidly tap "Confirm Refund" twice | First tap sets `isSubmitting = true`, second tap ignored by ref guard. Backend lock rejects duplicates. |
| **Same-Day Partial Rejection** | Attempt partial refund on same-day payment | Graceful catch of PayMongo error; clear prompt to try 100% or wait until tomorrow; database lock reverts to `captured`. |
| **Regular User Privilege Escalation** | Call `refundBooking` with `customAmount` as non-admin | Cloud Function throws `permission-denied`. |
| **Web Popup Redirect** | Complete GCash/Maya payment in Web popup | Popup window automatically closes; original browser tab navigates to `/book/list` with verified status. |
| **Mobile Native Auth Session** | Complete payment in Mobile in-app browser | In-app browser dismisses via `thrailapp://` deep link; app resumes seamlessly. |
| **Manual Popup Close** | User manually closes popup before paying | Main window detects closure and displays helpful retry message without getting stuck. |

---

## 6. Payment Popup Browser Redirect Fix (Web Opener Handshake)

### A. Root Cause Analysis
* **Mechanism in Web Browser**:
  * In [`PaymentScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/PaymentScreen.tsx#L139), payments on Web open a dedicated popup window via `window.open('', 'PayMongoCheckout', 'width=450,height=750...')`.
  * The return URL sent to PayMongo points to [`paymongoRedirect`](file:///d:/thrail_app/functions/index.js#L776) with `?url=${encodeURIComponent(appUrl)}`.
  * When payment completes, PayMongo redirects the **popup window** to the Cloud Function proxy.
* **The Glitch**:
  * [`paymongoRedirect`](file:///d:/thrail_app/functions/index.js#L787-L803) currently outputs an HTML script that executes:
    ```javascript
    window.location.href = "${targetUrl}";
    ```
  * Because this executes **inside the popup window**, the popup window redirects itself to the app URL (`http://localhost:8081/book/list...`).
  * As a result, the entire application mounts inside the small 450x750 popup window, while the original browser tab remains stuck waiting or polling `popup.closed` (which is never true since the popup is still open running the newly navigated app).

### B. Solution: Window Opener Handshake & Auto-Close
To ensure the popup closes automatically and redirects the original browser window:

1. **Update [`paymongoRedirect`](file:///d:/thrail_app/functions/index.js#L776)**:
   * Enhance the proxy HTML script to detect whether it is executing inside a child popup window (`window.opener && !window.opener.closed`).
   * **If `window.opener` exists (Web popup flow)**:
     1. Post a cross-window message: `window.opener.postMessage({ type: 'PAYMONGO_PAYMENT_SUCCESS', url: target }, '*')`.
     2. Instruct the parent window to navigate directly: `window.opener.location.href = target`.
     3. Close the popup window automatically via `window.close()`.
   * **If `window.opener` is null/undefined (Mobile native flow using `WebBrowser.openAuthSessionAsync`)**:
     * Retain standard behavior: navigate `window.location.href = target` to invoke the `thrailapp://` OS deep-link scheme, allowing Expo's auth session to dismiss cleanly.

2. **Update [`PaymentScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/PaymentScreen.tsx)**:
   * Add a `postMessage` listener on Web:
     ```typescript
     useEffect(() => {
         if (Platform.OS !== 'web') return;
         const handleMessage = (event: MessageEvent) => {
             if (event.data?.type === 'PAYMONGO_PAYMENT_SUCCESS') {
                 if (popupRef.current && !popupRef.current.closed) {
                     popupRef.current.close();
                 }
                 setIsWaitingForVerification(false);
                 router.replace('/book/list?bookingId=' + bookingData?.id + '&view=overview');
             }
         };
         window.addEventListener('message', handleMessage);
         return () => window.removeEventListener('message', handleMessage);
     }, [bookingData?.id]);
     ```
   * Store `popup` in a ref (`popupRef`) so cleanup and message handling can reliably close the window without relying solely on timer polling.

---

## 7. Implementation Checklist & Progress

- [x] **Backend: Custom Refund Support & Authorization Guard**
  - Updated [`refundBooking`](file:///d:/thrail_app/functions/index.js#L1035) in [`functions/index.js`](file:///d:/thrail_app/functions/index.js) to accept `customAmount`.
  - Added role verification ensuring only `admin` / `superadmin` can specify `customAmount`.
- [x] **Backend: Idempotency & Concurrency Mutex Lock**
  - Implemented in-flight status check (`processing_refund`).
  - Added pre-call state transition to prevent double-refund race conditions.
  - Implemented automated rollback to `captured` in `catch` blocks if gateway fails.
- [x] **Backend: Bounds & Precision Sanitization**
  - Added bounds enforcement: `1.00 <= customAmount <= capturedPayment.amount`.
  - Rounded amounts to 2 decimal places and exact centavos for PayMongo.
  - Added friendly guidance for PayMongo's `same_day_partial_refund_not_allowed`.
- [x] **Backend: Payment Popup Redirect Proxy Fix**
  - Updated [`paymongoRedirect`](file:///d:/thrail_app/functions/index.js#L776) in [`functions/index.js`](file:///d:/thrail_app/functions/index.js) to detect `window.opener`.
  - Added `postMessage` notification, parent redirect, and `window.close()` for Web popup flow.
  - Preserved deep-link scheme execution (`thrailapp://`) for native mobile in-app browser.
- [x] **Frontend Hook: `usePaymentAdmin`**
  - Updated [`usePaymentAdmin.ts`](file:///d:/thrail_app/src/core/models/Payment/hooks/usePaymentAdmin.ts) signature to `onRefund(booking, refundType, customAmount)`.
  - Fixed partial percentage discrepancy to pass `10` instead of `50`.
  - Added `isRefunding` loading state.
- [x] **Frontend UI: `AdminRefundModal`**
  - Redesigned [`AdminRefundModal.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminRefundModal.tsx) with 3 choices: Full (100%), Partial (10%), and Custom Amount.
  - Added quick preset percentage chips (`25%`, `50%`, `75%`).
  - Added currency input with real-time percentage and amount feedback.
  - Added client-side bounds validation and PayMongo same-day warning notice.
  - Added ref guard (`isSubmittingRef`) to eliminate client double-click race conditions.
- [x] **Frontend Controller: `ReviewScreen`**
  - Updated [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx) props and wired custom refund callback.
- [x] **Frontend Client: Payment Return Listener**
  - Added `postMessage` listener and `popupRef` in [`PaymentScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/PaymentScreen.tsx) to close the popup tab and navigate the main tab.
- [x] **Automated Test Suite: Cloud Functions ([`paymentFunctions.test.js`](file:///d:/thrail_app/functions/__tests__/paymentFunctions.test.js))**
  - Full suite testing `paymongoRedirect` (web popup handshake, mobile fallback, 400 validation).
  - Full suite testing `refundBooking` (unauthenticated, not-found, in-flight mutex lock, unauthorized users, privilege escalation, bounds checks, custom amount execution, full refund, 10% partial refund, error rollback, and same-day error mapping).
- [x] **Automated Test Suite: Frontend Hook ([`usePaymentAdmin.test.ts`](file:///d:/thrail_app/src/core/models/Payment/hooks/__tests__/usePaymentAdmin.test.ts))**
  - Full suite testing `usePaymentAdmin` (custom amount payload, 100% full, 10% partial, admin-only role enforcement, and error state handling).

---

## 8. Manual Cloud Deployment Instructions

> [!NOTE]
> Per user instruction, backend Cloud Functions have **not** been deployed automatically. Please deploy them manually to Firebase when ready.

To deploy the updated backend functions (`refundBooking` and `paymongoRedirect`), run the following command from the `functions/` directory or root workspace:

```bash
cd functions
firebase deploy --only functions:refundBooking,functions:paymongoRedirect
```
*(Or `firebase deploy --only functions` to deploy all functions).*
