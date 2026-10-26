# Manual QR Payment & Refund Architecture Plan (Non-Destructive PayMongo Coexistence)

## 1. Executive Summary & Objectives

This document establishes the end-to-end technical specification for introducing a **Manual QR Payment and Two-Way Manual Refund Workflow** in the Thrail application. 

### Core Architectural Principle: Non-Destructive Coexistence
- **Zero Regression on PayMongo:** All existing PayMongo code, webhooks, checkout sessions, auto-redirect proxy handlers, and cloud functions remain intact.
- **Provider Abstraction:** The active payment pipeline is decoupled via a centralized configuration flag (`PAYMENT_PROVIDER = 'manual_qr' | 'paymongo'`), enabling seamless toggling between automated PayMongo processing and manual QR/receipt verification without structural debt.

---

## 2. Current Codebase Mapping & Findings

### A. Component & Screen Architecture
1. **User Payment Screens:**
   - [`PaymentScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/PaymentScreen.tsx): Controls the multi-step checkout stepper (`MethodScreen` -> `StatusScreen`), manages web popup lifecycle (`window.open`), handles cross-window postMessage handshake (`PAYMONGO_PAYMENT_SUCCESS`), mobile native browser sessions (`WebBrowser.openAuthSessionAsync`), signature checks, and transaction polling.
   - [`MethodScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/MethodScreen.tsx): Renders the amount card, full payment vs. 50% downpayment radio toggle, digital wallet channel radio buttons (GCash / Maya), and the digital terms signature agreement ([`TermsSignature.tsx`](file:///d:/thrail_app/src/features/Book/components/TermsSignature.tsx)).
   - [`StatusScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/StatusScreen.tsx): Success confirmation showing transaction reference, amount paid, and return navigation.
2. **Document & Image Upload Pattern:**
   - [`DetailsScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Booking/DetailsScreen.tsx): Implements document collection using [`DocumentUploadCard.tsx`](file:///d:/thrail_app/src/components/DocumentUploadCard.tsx).
   - [`DocumentUploadCard.tsx`](file:///d:/thrail_app/src/components/DocumentUploadCard.tsx): Universal picker supporting camera and gallery uploads via `expo-image-picker`, client-side format & size limits (5MB maximum, allowed extensions: JPG, PNG, WEBP, HEIC), status indicators (pending, uploading, complete, rejected), and full-screen preview via [`ImagePreviewModal.tsx`](file:///d:/thrail_app/src/components/ImagePreviewModal.tsx).
3. **Admin Review & Verification Dashboards:**
   - [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx): Core controller for admin reviews, supporting split layout for desktop and vertical tabs for mobile. Contains Documents Tab, Payment Tab, [`AdminCancellationCard.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminCancellationCard.tsx), [`AdminRefundModal.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminRefundModal.tsx), and dynamic sticky footer actions.
   - [`PaymentTab.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/tabs/PaymentTab.tsx): Renders total hike price, gross collected, net collected, remaining balance progress bar, and list of transaction entries from `booking.payment[]`.
4. **Hiker MyBookings & Cancellation Tracking:**
   - [`BookingDetailsScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/MyBookings/BookingDetailsScreen.tsx): Renders active booking progress, contact info, emergency contacts, documents, and cancellation/refund actions.
   - [`CancellationCard.tsx`](file:///d:/thrail_app/src/features/Book/screens/MyBookings/components/CancellationCard.tsx): Displays cancellation reasons, organizer notices, decline notes, and handles hiker actions (`onWithdraw`, `onAppeal`, `onAcceptAdminCancellation`).
5. **Admin Hub:**
   - [`DashboardScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/DashboardScreen.tsx): Business organization overview, personnel management, trails, and offers.

### B. Current Data Models & Schema State
- **`Booking` ([`Booking.types.ts`](file:///d:/thrail_app/src/core/models/Booking/interfaces/Booking.types.ts)):**
  - Statuses: `'for-reservation'`, `'approved-docs'`, `'for-payment'`, `'paid'`, `'downpayment'`, `'completed'`, `'cancelled'`, `'refund'`, `'refunded'`, `'for-cancellation'`, `'cancellation-rejected'`, `'for-reschedule'`, `'reschedule-rejected'`, `'rescheduled'`, `'expired'`.
  - Nested collections: `offer`, `user`, `business`, `trail`, `payment: IPayment<Date>[]`, `documents: Requirements[]`, `cancellationReason?`, `cancelledBy?`.
- **`IPayment`:** Records gateway (`'paymongo'`), `gatewayId`, `method`, `sessionId`, `referenceCode`, `status`, `amount`, `refundedAmount`, `createdAt`, `capturedAt`, `refundedAt`.
- **`Cancellation` ([`Cancellation.types.ts`](file:///d:/thrail_app/src/core/models/Cancellation/interfaces/Cancellation.types.ts)):**
  - Fields: `id`, `userId`, `cancelledBy ('user' | 'admin')`, `bookingId`, `offerId`, `businessId`, `reason`, `status ('pending' | 'approved' | 'rejected')`, `adminNote?`, `refundAmount?`, `refundedAt?`.
- **`User` & Roles ([`User.types.ts`](file:///d:/thrail_app/src/core/models/User/interfaces/User.types.ts)):**
  - Roles: `'superadmin' | 'admin' | 'user'`.
  - Business creators hold Firebase Auth custom claim `{ role: 'admin', owner: businessId }`.

---

## 3. Detailed Architectural Specifications

```mermaid
flowchart TD
    subgraph Part_1 [Part 1: Reservation Creation & Immediate Group Chat Entry]
        A[Hiker selects Offer & fills Form] --> B[Hiker reserves booking: status for-reservation]
        B --> C[IMMEDIATELY added to Group Chat groups/offerId]
        C --> D[Hiker can chat directly with organizer & hikers for inquiries]
        B --> E[Admin reviews uploaded documents in ReviewScreen]
        E -->|Docs Approved| F[Status: for-payment, reservedPax incremented]
        E -->|Docs Rejected| G[Status: reservation-rejected -> Prompt hiker re-upload]
    end

    subgraph Part_2 [Part 2: Payment, Verification & Completing Booking]
        F --> H[Hiker opens PaymentScreen with Organizer Master QR]
        H --> I[Hiker uploads payment receipt screenshot]
        I --> J[Admin reviews receipt in PaymentTab of ReviewScreen]
        J --> K{Admin Payment Verification}
        K -->|Classify Full Payment| L[Status: paid, Remaining Balance: 0]
        K -->|Classify Downpayment| M[Status: downpayment<br/>Remaining Balance calculated]
        K -->|Reject Receipt| N[Status: for-payment with note -> Hiker re-uploads]
        M --> O{Balance Settlement}
        O -->|Remaining balance settled| L
        L --> P[Admin executes 'Complete Booking']
        M -.->|BLOCKED: Remaining Balance > 0| P
        P --> Q[Booking Reservation Completed: status completed<br/>Reservation is 100% finalized & locked in]
    end

    subgraph Part_3 [Part 3: 2-Way Refund & Cancellation Handshake with Dispute Limits & Chat Retention]
        R[Cancellation Initiated with Upfront Wallet Entry<br/>Zero Auto-Fill Rule] --> S{Initiator?}
        S -->|User Initiated| T[Admin Approves Request in ReviewScreen]
        S -->|Admin Initiated| U[Awaiting User Acceptance in CancellationCard]
        U --> V[User Accepts Cancellation]
        V --> W{Admin Refund Decision}
        W -->|No Refund| X[Close Booking as Cancelled]
        W -->|Issue Refund| Y[Admin inputs Refund Amount]
        T --> Y
        Y --> Z[Admin views hiker wallet with Copy button]
        Z --> AC[Admin pays outside app & uploads Refund Receipt Proof via completeManualRefund]
        AC --> AD[Status: refund_submitted<br/>HandshakeStep: awaiting_user_confirmation<br/>Hiker RETAINED in group chat]
        AD -->|Action 1: Confirm Received| AE[Callable: confirmRefundReceived<br/>Status: refunded, handshake completed<br/>Slot released & removed from group chat]
        AD -->|Action 2: Not Received / Appeal| AF[Callable: disputeRefundPayout<br/>Status: refund_disputed<br/>Dispute count incremented max 3<br/>Hiker RETAINED in group chat]
        AF -->|Admin re-transfers & re-uploads proof| AC
        AF -.->|If disputeCount >= 3| AG[Automated dispute locked<br/>Coordinate directly in tour group chat]
    end
```

---

## 4. Database & State Schema Additions

### A. Provider Configuration Flag
**File:** `src/core/config/paymentConfig.ts`
```typescript
export type PaymentProvider = 'manual_qr' | 'paymongo';

export const PAYMENT_CONFIG = {
    /**
     * Determines whether checkout and refund workflows operate in manual QR mode
     * or automated PayMongo gateway mode.
     */
    PROVIDER: 'manual_qr' as PaymentProvider,
};
```

### B. Role Definition & Owner Verification
**File:** `src/core/models/User/interfaces/User.types.ts`
```typescript
export type Role = 'superadmin' | 'admin' | 'owner' | 'user';
```

**File:** `src/core/models/User/hooks/useAuthHook.ts`
```typescript
const isOwner = role === 'owner' || (Boolean(businessId) && (profile?.id === businessId || user?.uid === businessId));
```

### C. Business Master QR Storage Schema
**File:** `src/core/models/Business/interfaces/Business.types.ts`
```typescript
export interface IBusinessPaymentConfig<T = Date> {
    qrCodeUrl: string;                  // Firebase Storage download URL
    accountName?: string;               // Account name shown on QR (e.g. Organizer Name)
    accountNumber?: string;            // GCash / Maya account number
    providerName?: 'GCash' | 'Maya' | string;
    updatedAt: T;
    updatedBy: string;                  // Owner user ID
}

export interface IBusinessBase<T> extends Omit<IApplicationBase<T>, 'status' | 'message'> {
    active: boolean;
    paymentConfig?: IBusinessPaymentConfig<T>;
}
```

### D. Manual Payment & Balance Tracking Schema
**File:** `src/core/models/Booking/interfaces/Booking.types.ts`
```typescript
export interface IPayment<T> {
    gateway: string;                    // 'manual_qr' | 'paymongo'
    gatewayId?: string;
    method?: string;
    sessionId: string;
    referenceCode?: string | null;
    status: "pending" | "captured" | "failed" | "refunded" | "abandoned" | "processing_refund" | "rejected";
    refundableUntil?: T;
    amount: number;
    refundedAmount?: number;
    createdAt: T;
    capturedAt?: T;
    refundedAt?: T;
    refundReason?: string;

    // Manual QR fields:
    receiptUrl?: string;                // User-uploaded receipt screenshot
    classification?: 'full' | 'downpayment';
    adminNote?: string;
    verifiedBy?: string;
    verifiedAt?: T;
}

export interface IOverpaymentDetails<T = Date> {
    excessAmount: number;               // Overpaid amount to be refunded (e.g. ₱9,000)
    originalVerifiedAmount: number;     // Total amount sent by user (e.g. ₱10,000)
    hikeAmountCaptured: number;         // Amount applied to settle hike (e.g. ₱1,000)
    status: 'awaiting_hiker_wallet' | 'awaiting_admin_payout' | 'awaiting_user_confirmation' | 'refund_disputed' | 'completed';
    userWallet?: IUserWalletDetails<T>;
    adminRefundReceiptUrl?: string;     // Proof of refund payout uploaded by Admin
    adminRefundReceiptUploadedAt?: T;
    disputeCount?: number;              // Capped at 3 dispute attempts
    disputeReason?: string;
    disputedAt?: T;
    userConfirmedReceivedAt?: T;
    createdAt: T;
    updatedAt: T;
}

export interface IBookingBase<T> {
    // ... existing properties
    remainingBalance?: number;          // Exact remaining balance due (₱)
    paymentVerificationStatus?: 'pending_verification' | 'downpayment' | 'fully_paid' | 'rejected' | 'refund_submitted';
    paymentRejectionReason?: string;
    overpayment?: IOverpaymentDetails<T>; // Overpayment tracking without cancelling booking
}
```

### E. Two-Way Refund & Cancellation Handshake Schema
**File:** `src/core/models/Cancellation/interfaces/Cancellation.types.ts`
```typescript
export type HandshakeStep = 
    | 'awaiting_admin_approval'         // User requested refund/cancel -> Admin reviews
    | 'awaiting_user_acceptance'        // Admin initiated -> User must accept first
    | 'awaiting_admin_refund_decision'  // User accepted admin cancel -> Admin decides Refund vs No Refund
    | 'awaiting_user_wallet'            // Admin decided refund -> User enters GCash/Maya number
    | 'awaiting_admin_payout'           // User submitted wallet -> Admin sends payout & uploads receipt
    | 'awaiting_user_confirmation'     // Admin uploaded receipt -> Hiker confirms or disputes payout
    | 'refund_disputed'                 // Hiker disputed payout (max 3) -> Admin reviews & re-transfers
    | 'completed';                      // Loop closed with hiker confirmed receipt

export interface IUserWalletDetails<T = Date> {
    walletType: 'GCash' | 'Maya';
    accountNumber: string;              // Validated 11-digit mobile number (09XXXXXXXXX) - ZERO AUTO-FILL
    accountName?: string;
    submittedAt: T;
}

export interface ICancellationBase<T> {
    id: string;
    userId: string;
    cancelledBy: 'user' | 'admin';
    bookingId: string;
    offerId: string;
    businessId: string;
    reason: string;
    status: "pending" | "approved" | "rejected" | "user_accepted" | "refund_pending" | "refund_submitted" | "refund_completed" | "refund_disputed";
    adminNote?: string;
    refundAmount?: number;
    refundedAt?: T | null;
    createdAt: T;
    updatedAt: T;

    // Handshake extensions:
    handshakeStep?: HandshakeStep;
    refundDecision?: 'issue_refund' | 'no_refund';
    userWallet?: IUserWalletDetails<T>;
    adminRefundReceiptUrl?: string;     // Proof of payout uploaded by Admin
    adminRefundReceiptUploadedAt?: T;

    // Two-way handshake & dispute limit tracking:
    disputeCount?: number;              // Maximum limit of 3 disputes allowed
    disputeReason?: string;
    disputedAt?: T | null;
    userConfirmedReceivedAt?: T | null;
}
```

---

## 5. UI Architecture: Dedicated Subcomponents Reusing Shared Primitives

To guarantee that the existing PayMongo screens remain 100% unaltered, free of conditional clutter, and fully regression-safe, the UI is architected into **cleanly separated dedicated provider screens** that reuse Thrail's established design primitives:

```
src/features/Book/screens/Payment/
  ├── PaymentScreen.tsx                 <-- Orchestrator: branches on PAYMENT_CONFIG.PROVIDER
  ├── ManualQRMethodScreen.tsx          <-- NEW: Dedicated Manual QR layout & actions
  └── MethodScreen.tsx                  <-- PRESERVED: PayMongo method selection 100% intact

src/features/Admin/screens/Booking/components/
  ├── ManualQRVerificationCard.tsx      <-- NEW: Admin receipt inspection & classification
  └── AdminRefundModal.tsx              <-- PRESERVED: PayMongo refund modal

src/features/Book/screens/Refund/
  └── UserRefundScreen.tsx              <-- NEW: 11-digit GCash/Maya mobile wallet submission
```

### Part 1: Owner QR Management & User `PaymentScreen.tsx`
1. **Owner-Only Master QR Upload:**
   - Add `OwnerQRCard` inside [`DashboardScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/DashboardScreen.tsx).
   - Render upload/edit controls **strictly** if `isOwner === true`. Staff admins see a read-only preview or no edit button.
   - Saves file to Firebase Storage at `businesses/{businessId}/payment/master_qr_{timestamp}.png`.
   - Updates `businesses/{businessId}.paymentConfig`.
2. **Dedicated `ManualQRMethodScreen.tsx` (Manual QR Mode):**
   - Keeps [`MethodScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/MethodScreen.tsx) completely untouched for PayMongo.
   - Inside [`ManualQRMethodScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/ManualQRMethodScreen.tsx):
     - Displays the Organizer's Master QR Code prominently in a dedicated card.
     - Adds a **"Save QR to Gallery"** button:
       - On Mobile: Invokes `expo-file-system` to download and `expo-media-library` to save to photos album, with permission handling and success toast.
       - On Web: Programmatically triggers image download.
     - Embeds receipt screenshot upload reusing [`DocumentUploadCard.tsx`](file:///d:/thrail_app/src/components/DocumentUploadCard.tsx) directly underneath with title: `"Upload the screenshot of your receipt"` and subtitle: `"JPG, PNG, or WEBP up to 5MB"`.
     - Reuses [`TermsSignature.tsx`](file:///d:/thrail_app/src/features/Book/components/TermsSignature.tsx) at the bottom.
   - Submission: Saves receipt into `booking.payment[]` as a `pending` record with `gateway: 'manual_qr'` and sets booking `paymentVerificationStatus = 'pending_verification'`. Transitions user to `StatusScreen.tsx` informing them that receipt verification is in progress.

### Part 2: Admin Verification on `ReviewScreen.tsx` (Payment Tab)
1. **Receipt Screenshot Display via `ManualQRVerificationCard.tsx`:**
   - In [`PaymentTab.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/tabs/PaymentTab.tsx), render [`ManualQRVerificationCard.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/ManualQRVerificationCard.tsx) when manual QR payment exists.
   - Displays the hiker's uploaded receipt thumbnail with tap-to-expand using [`ImagePreviewModal.tsx`](file:///d:/thrail_app/src/components/ImagePreviewModal.tsx).
   - **Removal of "Reported Amount":** Hikers do not manually input their paid amount when uploading receipts; they only upload the receipt image. The misleading "Reported Amount" row has been removed so admin verification is grounded exclusively on bank/wallet statement cross-checks.
2. **Admin Verification Actions:**
   - **Classify as Full Payment:**
     - Sets verified amount = total hike price.
     - Sets `booking.remainingBalance = 0`.
     - Sets `booking.status = 'paid'` and `paymentVerificationStatus = 'fully_paid'`.
   - **Classify as Downpayment:**
     - Opens numeric input modal for admin to enter verified amount (e.g. ₱500.00).
     - Automatically computes `remainingBalance = Math.max(0, offer.price - verifiedAmount)`.
     - Sets `booking.status = 'downpayment'` and `paymentVerificationStatus = 'downpayment'`.
     - Notifies user with exact remaining balance due.
   - **Overpayment Handling (Case A: Without Cancelling Booking):**
     - When `parsedAmount > remainingBal`, the system detects an overpayment.
     - Displays an amber warning banner:
       *"⚠️ Overpayment Detected: Hiker sent ₱{parsedAmount} for a ₱{remainingBal} balance. ₱{remainingBal} will be captured to fully pay the hike, and an excess refund of ₱{excessAmount} will be initiated."*
     - The verification button dynamically transforms to:
       `"Verify Full Payment (₱{remainingBal}) & Refund Excess (₱{excessAmount})"`.
     - See **Part 4** for complete architectural flow.
   - **Reject / Request Re-upload:**
     - Prompts admin for explanation (e.g. "Receipt illegible / transaction amount mismatch").
     - Sets `paymentVerificationStatus = 'rejected'` and records note in `paymentRejectionReason`.
     - Hiker is alerted on `BookingDetailsScreen.tsx` with a "Re-upload Receipt" button.
3. **Downpayment & Balance Settling:**
   - Provide an admin action button: **"Mark Remaining Balance as Paid"** (for cash received at trailhead or secondary transfer).
   - Alternatively, hikers can upload an additional receipt to settle the remaining balance.
4. **Guarding "Complete Booking":**
   - In [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx#L422), enforce that `"Complete Booking"` is strictly **DISABLED** while `remainingBalance > 0` or status is `'downpayment'`.
   - Only enable `"Complete Booking"` once the remaining balance is ₱0.00 and payment is 100% verified.

### Part 3: User & Admin Refund / Cancellation Workflows (2-Way Handshake with Dispute Limits & Chat Retention)

1. **Upfront Wallet Collection with Zero Auto-Fill Rule:**
   - In [`CancelBookingModal.tsx`](file:///d:/thrail_app/src/features/Book/screens/MyBookings/components/CancelBookingModal.tsx), when a paid booking is being cancelled, the modal prompts the hiker for their e-wallet details upfront.
   - **Zero Pre-fill Rule:** The wallet phone number and account name fields initialize strictly empty (`''`). Even if the user has a registered phone number or profile name, it is NEVER pre-filled. This prevents funds from being sent to registered SIMs that are not active GCash/Maya accounts.
   - Inputs validate for 11 digits starting with `09` and non-empty account name.
2. **Admin Review & Payout Execution (`completeManualRefund`):**
   - In [`AdminCancellationCard.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminCancellationCard.tsx):
     - Displays hiker's wallet details with a 1-tap **Copy Phone Number** clipboard button (`Clipboard.setStringAsync`).
     - Admin initiates payout via external GCash/Maya app and uploads receipt proof.
     - Executes `completeManualRefund` callable function.
     - Sets cancellation `status = 'refund_submitted'`, `handshakeStep = 'awaiting_user_confirmation'`.
     - Sets booking `paymentVerificationStatus = 'refund_submitted'`.
     - **Tour Group Chat Retention:** The hiker is NOT removed from `groups/{offerId}` at this stage. They remain in the tour chat so they can easily communicate with the organizer throughout the refund lifecycle.
3. **Two-Way Verification Handshake on Hiker Side:**
   - In [`CancellationCard.tsx`](file:///d:/thrail_app/src/features/Book/screens/MyBookings/components/CancellationCard.tsx) and [`UserRefundScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Refund/UserRefundScreen.tsx):
     - Displays the organizer's refund payout proof receipt with tap-to-expand modal.
     - Presents two primary actions:
       - **Action 1: "Confirm Received" (Green Button):**
         - Calls `confirmRefundReceived` callable function.
         - Marks cancellation as `refund_completed`, `handshakeStep = 'completed'`, `userConfirmedReceivedAt = serverTimestamp()`.
         - Marks booking as `refunded`.
         - Atomically decrements `reservedPax` by 1 via `FieldValue.increment(-1)` in `offers/{offerId}` to release the inventory slot.
         - Atomically removes hiker from `groups/{offerId}` (`participantsIds` and `members[]`).
       - **Action 2: "Not Received / Appeal" (Outline Red Button):**
         - Opens dispute modal prompting hiker for custom reason (e.g., "Reference number did not match my GCash account").
         - Enforces **3-Attempt Dispute Limit** (`disputeCount <= 3`).
         - Calls `disputeRefundPayout` callable function.
         - Sets cancellation `status = 'refund_disputed'`, `handshakeStep = 'refund_disputed'`, increments `disputeCount`, and saves `disputeReason` and `disputedAt`.
         - Keeps hiker in the tour group chat for direct communication.
         - In `AdminCancellationCard.tsx`, admin sees a high-visibility dispute alert banner showing attempt count (`Attempt 1 of 3`) and hiker's reason, with an `"Upload Corrected Refund Proof"` button to re-transfer and upload a new receipt.
4. **Dispute Limit Enforcement:**
   - If `disputeCount >= 3`, the dispute button is disabled, and an informative banner states:
     *"Maximum appeal attempts reached (3/3). Please coordinate directly with the organizer in the tour group chat."*

### Part 4: Case A - Overpayment Refund WITHOUT Cancelling Booking

In real-world transactions, a hiker may send an excess amount (for example, sending ₱10,000 for a ₱1,000 tour balance). In this scenario, **the booking MUST NOT be cancelled or moved to the History tab**. Instead:
1. **Full Hike Payment Settlement:**
   - The hike price (₱1,000) is captured in full.
   - `booking.remainingBalance = 0`.
   - `booking.status = 'paid'`, `paymentVerificationStatus = 'fully_paid'`.
   - Booking remains **active and confirmed in the Upcoming tab**.
   - Hiker is added / retained in the tour group chat (`groups/{offerId}`).
2. **Initiation of Overpayment Refund Record:**
   - System calculates `excessAmount = parsedAmount - remainingBal` (₱9,000).
   - Attaches `booking.overpayment`:
     ```typescript
     overpayment: {
         excessAmount: 9000,
         originalVerifiedAmount: 10000,
         hikeAmountCaptured: 1000,
         status: 'awaiting_hiker_wallet',
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
     }
     ```
3. **Hiker Wallet Submission:**
   - In `BookingDetailsScreen.tsx`, hiker sees an Overpayment Banner:
     *"You overpaid by ₱9,000.00. Your hike is 100% confirmed, and the organizer will refund your excess amount."*
   - Hiker enters GCash/Maya wallet details (with zero auto-fill rule).
   - Sets `overpayment.status = 'awaiting_admin_payout'`.
4. **Admin Payout & Handshake Resolution:**
   - Admin sends ₱9,000 via external GCash/Maya, uploads receipt proof in `PaymentTab.tsx` / `AdminCancellationCard.tsx`.
   - Sets `overpayment.status = 'awaiting_user_confirmation'`.
   - Hiker confirms receipt via "Confirm Received" (or appeals up to 3 times).
   - Upon confirmation, `overpayment.status = 'completed'`, and the booking stays 100% active and confirmed for the hike.

---

## 6. Security Rules Specification

### A. Firestore Rules ([`firestore.rules`](file:///d:/thrail_app/firestore.rules))
```javascript
// Restrict updates to business paymentConfig strictly to the Owner account
match /businesses/{businessId} {
    allow update: if request.auth != null && (
        // Staff admin can update general fields, but NOT paymentConfig
        (
            request.auth.token.role == 'admin' && 
            request.auth.token.businessId == businessId &&
            !request.resource.data.diff(resource.data).affectedKeys().hasAny(['paymentConfig'])
        ) ||
        // Master Owner can update everything including paymentConfig
        (
            (request.auth.token.role == 'owner' || request.auth.token.owner == businessId) &&
            (request.auth.token.businessId == businessId || request.auth.token.owner == businessId)
        ) ||
        request.auth.token.role == 'superadmin'
    );
}

// Allow user to write wallet details and admin to write payout receipt in cancellations
match /{path=**}/cancellations/{cancellationId} {
    allow update: if request.auth != null && (
        request.auth.token.role in ['admin', 'owner', 'superadmin'] ||
        (
            request.auth.uid == resource.data.userId &&
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['userWallet', 'handshakeStep', 'status', 'updatedAt'])
        )
    );
}
```

### B. Storage Rules ([`storage.rules`](file:///d:/thrail_app/storage.rules))
```javascript
service firebase.storage {
    match /b/{bucket}/o {
        // Existing user uploads (retained intact)
        match /users/{userId}/{allPaths=**} {
            allow read: if request.auth != null;
            allow write: if request.auth != null && request.auth.uid == userId &&
                request.resource.size <= 5 * 1024 * 1024 &&
                request.resource.contentType.matches('image/.*');
        }

        // Owner Master QR Code uploads (Strictly Owner-Only)
        match /businesses/{businessId}/payment/{fileName} {
            allow read: if request.auth != null;
            allow write: if request.auth != null && (
                request.auth.token.role == 'owner' ||
                request.auth.token.owner == businessId
            ) &&
            request.resource.size <= 5 * 1024 * 1024 &&
            request.resource.contentType.matches('image/.*');
        }

        // Admin Refund Receipts proof of payout uploads
        match /businesses/{businessId}/refunds/{fileName} {
            allow read: if request.auth != null;
            allow write: if request.auth != null && (
                request.auth.token.role in ['admin', 'owner'] &&
                (request.auth.token.businessId == businessId || request.auth.token.owner == businessId)
            ) &&
            request.resource.size <= 5 * 1024 * 1024 &&
            request.resource.contentType.matches('image/.*');
        }
    }
}
```

---

## 7. Step-by-Step File Modification Plan

### Phase 1: Foundation, Types & Config (Completed ✅)
1. Created `src/core/config/paymentConfig.ts` with `PAYMENT_CONFIG = { PROVIDER: 'manual_qr' }`.
2. Updated `src/core/models/User/interfaces/User.types.ts` to include `'owner'` role.
3. Updated `src/core/models/User/hooks/useAuthHook.ts` to expose `isOwner`.
4. Updated `src/core/models/Business/interfaces/Business.types.ts` and `BusinessFactory.ts` with `paymentConfig`.
5. Updated `src/core/models/Booking/interfaces/Booking.types.ts` and `BookingFactory.ts` with `remainingBalance`, `paymentVerificationStatus`, and manual `IPayment` properties.
6. Updated `src/core/models/Cancellation/interfaces/Cancellation.types.ts` and `CancellationFactory.ts` with handshake states and wallet structures.

### Phase 2: Owner Master QR Management (Owner-Only) (Completed ✅)
1. Created `src/features/Admin/screens/components/OwnerQRModal.tsx` for QR uploading and editing with hardened 11-digit mobile validation and text sanitization.
2. Mounted the QR Management trigger inside [`DashboardScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/DashboardScreen.tsx) gated strictly behind `isOwner`.
3. Updated `storage.rules` and `firestore.rules` for business QR storage security.

### Phase 3: User `PaymentScreen.tsx` (Manual QR Mode) (Completed ✅)
1. Updated [`PaymentScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/PaymentScreen.tsx) to check `PAYMENT_CONFIG.PROVIDER === 'manual_qr'`.
2. Created dedicated [`ManualQRMethodScreen.tsx`](file:///d:/thrail_app/src/features/Book/screens/Payment/ManualQRMethodScreen.tsx):
   - Displays Organizer's Master QR code with "Save QR to Gallery" button.
   - Embeds receipt upload using [`DocumentUploadCard.tsx`](file:///d:/thrail_app/src/components/DocumentUploadCard.tsx) with immediate green success styling on upload.
   - Preserves [`TermsSignature.tsx`](file:///d:/thrail_app/src/features/Book/components/TermsSignature.tsx).
3. Connects submission handler to save `receiptUrl` and transition state to `pending_verification`.

### Phase 4: Admin Verification on `ReviewScreen.tsx` (Payment Tab) (Completed ✅)
1. Created [`ManualQRVerificationCard.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/ManualQRVerificationCard.tsx) inside [`PaymentTab.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/tabs/PaymentTab.tsx):
   - Displays user receipt with full-screen [`ImagePreviewModal.tsx`](file:///d:/thrail_app/src/components/ImagePreviewModal.tsx).
   - Verification actions: Full Payment, Downpayment (with input for verified amount & downpayment calculation), Reject/Request Re-upload (with reason).
   - "Mark Remaining Balance as Paid" button via `settleManualBalance`.
   - Overpayment banner and dynamic action button for excess payouts.
2. Enforced `"Complete Booking"` is disabled in [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx) while `remainingBalance > 0` or status is `'downpayment'`.

### Phase 5: User-Initiated Refund Screen (`UserRefundScreen`) (Completed ✅)
1. Created `src/features/Book/screens/Refund/UserRefundScreen.tsx`:
   - Radio selector (`GCash` | `Maya`).
   - Validated 11-digit mobile wallet number input (`09XXXXXXXXX`) with zero pre-fill rule.
   - Dispute modal with `KeyboardAvoidingView` + `ScrollView` to prevent keyboard overlap.
   - Submit button updating `cancellation.userWallet` and transitioning `handshakeStep` to `'awaiting_admin_payout'`.
2. Created navigation route at `src/app/(app)/(main)/book/refund.tsx`.
3. Linked navigation from `BookingDetailsScreen.tsx` / `CancellationCard.tsx` when `handshakeStep === 'awaiting_user_wallet'`.

### Phase 6: Admin-Initiated Cancellation & 2-Way Handshake (Completed ✅)
1. Updated `cancelUserBooking` in [`useCancellationAdmin.ts`](file:///d:/thrail_app/src/core/models/Cancellation/hooks/useCancellationAdmin.ts) to set `handshakeStep = 'awaiting_user_acceptance'`.
2. Updated [`CancellationCard.tsx`](file:///d:/thrail_app/src/features/Book/screens/MyBookings/components/CancellationCard.tsx) to render `"Accept Cancellation & Request Refund"`.
3. Updated [`ReviewScreen.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/ReviewScreen.tsx) and [`AdminCancellationCard.tsx`](file:///d:/thrail_app/src/features/Admin/screens/Booking/components/AdminCancellationCard.tsx):
   - When user accepts, presents admin with `"Issue Refund"` (prompts for amount) vs `"No Refund"`.
   - Displays submitted wallet details with 1-tap copy button.
   - Payout proof receipt upload with `completeManualRefund`.

### Phase 7: PayMongo Coexistence & Non-Regression Verification (Completed ✅)
1. Verified that switching `PAYMENT_CONFIG.PROVIDER = 'paymongo'` restores the PayMongo popup, webhook listener, and cloud functions without broken references.
2. Verified TypeScript types and end-to-end user and admin workflows.

### Phase 8: Finalize Without Refund (`refundType === 'none'`) (Completed ✅)
1. Updated `processCancellationApproval` in `functions/index.js` to explicitly record `refundDecision: 'no_refund'` and `handshakeStep: 'completed'` when ₱0 refund is finalized.
2. Updated booking document to set `status: 'cancelled'`, `paymentVerificationStatus: 'cancelled_no_refund'`.
3. Guaranteed bookings immediately move to the **History** tab and display `"Cancelled (No Refund)"` badge without getting stuck in `REFUNDING` or `Awaiting Decision`.

### Phase 9: Input Sanitization, Anti-Corruption & DOM Sync Hardening (Completed ✅)
1. Hardened Master QR Setup (`OwnerQRModal.tsx`): 11-digit numeric phone sanitization, account name regex sanitization, inline error validation.
2. Hardened Verification (`ManualQRVerificationCard.tsx`): strict numerical input parsing, max bounds check against `remainingBalance`, sanitized admin notes.
3. Hardened Refund Modal (`AdminRefundModal.tsx`): resolved direct React ref access during render by deferring ref synchronization to `useEffect([visible])`.

### Phase 10: Admin Real-Time Reactivity & Shared Listener Reference Counting (Completed ✅)
1. Added reference counting (`listenerCounts`) in `bookingStoreCreator.ts` to prevent premature cancellation of active Firestore snapshot listeners during screen transitions.
2. Derived stable sorted `activeOfferIdsKey` in `useBookingListenerAdminList.ts` to eliminate unnecessary listener re-creations on offer pax updates and included past hike dates for admin management.
3. Implemented store helper `refreshBookingItem(bookingId, offerId)` and integrated it across all admin Cloud Function completions in `useBookingAdmin.ts` and `useCancellationAdmin.ts`.
4. Expanded `currentSyncKey` in `useReviewLogic.ts` to monitor payment, remaining balance, overpayment, and cancellation handshake steps/timestamps for immediate tab and card synchronization.

### Phase 11: UI/UX Modal Hardening, Keyboard Avoidance & Accordion Lifecycle (Completed ✅)
1. Updated `CustomTextInput.tsx` multiline container (`minHeight: 96, paddingVertical: 10`) and inner input (`minHeight: 72, textAlignVertical: 'top'`) to prevent shrinking into a 1-line pill.
2. Wrapped Dispute Modals in `CancellationCard.tsx`, `UserRefundScreen.tsx`, and `OverpaymentRefundCard.tsx` in `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"` so action buttons are never obscured by the mobile keyboard.
3. Set `CancellationCard.tsx` to expand by default (`isExpanded: true`) so hikers immediately see active cancellation actions.
4. Updated `OverpaymentRefundCard.tsx` with uniform text styling, green completed theme (`#86EFAC` border, `check-circle`, `₱{excessAmount} REFUNDED`), receipt proof button, and collapsible accordion with in-render state adjustment.

---

## 8. Atomic Cloud Functions Architecture (Server-Side Batch Execution)

To eliminate the vulnerability where a mobile client connection drop or timeout mid-process leaves Firestore in an inconsistent, half-updated state, all multi-document operations across bookings, group chats, offer slot inventories, and cancellations are executed atomically in Firebase Cloud Functions via `admin.firestore().batch()`.

### Why Atomic `db.batch()` is Mandatory
In client-side execution, chaining sequential updates (`updateDoc(booking)` then `updateDoc(group)` then `updateDoc(cancellation)`) means that if the network drops on step 2 or 3, earlier steps stay committed with no rollback. In a Cloud Function batch:
- **ACID Atomicity:** Either **ALL** document updates succeed simultaneously, or **NONE** do.
- **Server-Side Resilience:** Once the HTTPS callable request reaches the server, the batch commits reliably regardless of the client device's internet stability.

### The Atomic Cloud Functions:

#### A. `verifyManualPayment` (Callable)
- **File:** `functions/index.js`
- **Caller Guard:** Admin or superadmin for the target `businessId`.
- **Parameters:**
  ```javascript
  {
      bookingId: string,
      userId: string,
      businessId: string,
      offerId: string,
      classification: 'full' | 'downpayment',
      verifiedAmount?: number,
      note?: string,
      isRejection?: boolean,
      rejectionReason?: string
  }
  ```
- **Atomic Operations (`db.batch()`):**
  1. `bookingRef`:
     - **Standard Verification:**
       - If full payment or downpayment within balance: updates `status` (`'paid'` or `'downpayment'`), `remainingBalance`, `paymentVerificationStatus` (`'fully_paid'` or `'downpayment'`), appends/updates verified payment record with `status: 'captured'`, and sets `updatedAt = serverTimestamp()`.
     - **Case A: Overpayment Detected (`verifiedAmount > remainingBalance`):**
       - Calculates `excessAmount = verifiedAmount - remainingBalance`.
       - Captures `remainingBalance` with `classification = 'full'`.
       - Sets `booking.remainingBalance = 0`, `booking.status = 'paid'`, `paymentVerificationStatus = 'fully_paid'`.
       - Attaches `booking.overpayment`:
         ```javascript
         overpayment: {
             excessAmount: excessAmount,
             originalVerifiedAmount: verifiedAmount,
             hikeAmountCaptured: remainingBalance,
             status: 'awaiting_hiker_wallet',
             createdAt: admin.firestore.FieldValue.serverTimestamp(),
             updatedAt: admin.firestore.FieldValue.serverTimestamp(),
         }
         ```
     - **Rejection:**
       - Updates `status: 'for-payment'`, `paymentVerificationStatus: 'rejected'`, `paymentRejectionReason: rejectionReason`, updates payment status to `'rejected'`, and sets `updatedAt = serverTimestamp()`.
  2. `groupRef` (`groups/{offerId}`):
     - If verified (standard or overpayment): atomically adds user to `participantsIds` via `FieldValue.arrayUnion(userId)` and appends hiker info to `members[]`.
  3. Commits `batch.commit()`.

#### B. `completeManualRefund` (Callable)
- **File:** `functions/index.js`
- **Caller Guard:** Admin or superadmin for the target `businessId`.
- **Parameters:**
  ```javascript
  {
      bookingId: string,
      userId: string,
      businessId: string,
      offerId: string,
      cancellationId: string,
      receiptUrl: string,
      refundAmount: number
  }
  ```
- **Atomic Operations (`db.batch()`):**
  1. `cancellationRef` (`businesses/{businessId}/cancellations/{cancellationId}`):
     - Sets `status = 'refund_submitted'`, `adminRefundReceiptUrl = receiptUrl`, `adminRefundReceiptUploadedAt = serverTimestamp()`, `handshakeStep = 'awaiting_user_confirmation'`, and `updatedAt = serverTimestamp()`.
  2. `bookingRef` (`users/{userId}/bookings/{bookingId}`):
     - Sets `paymentVerificationStatus = 'refund_submitted'`, `refundedAmount = refundAmount`, distributes `resolvedRefundAmount` across captured payment records without overwriting original paid amounts, and sets `updatedAt = serverTimestamp()`.
  3. **Tour Group Chat & Slot Retention:**
     - The hiker is **NOT** removed from `groups/{offerId}` and `reservedPax` is **NOT** decremented yet. The user remains in the group chat and inventory slot is held until the hiker acknowledges and confirms receiving payout.
  4. Commits `batch.commit()`.

#### C. `confirmRefundReceived` (Callable)
- **File:** `functions/index.js`
- **Caller Guard:** Authenticated hiker owning the booking (`caller.uid === userId`).
- **Parameters:**
  ```javascript
  {
      bookingId: string,
      businessId: string,
      offerId: string,
      cancellationId: string
  }
  ```
- **Atomic Operations (`db.batch()`):**
  1. `cancellationRef` (`businesses/{businessId}/cancellations/{cancellationId}`):
     - Sets `status = 'refund_completed'`, `handshakeStep = 'completed'`, `userConfirmedReceivedAt = serverTimestamp()`, and `updatedAt = serverTimestamp()`.
  2. `bookingRef` (`users/{userId}/bookings/{bookingId}`):
     - Sets `status = 'refunded'`, `paymentVerificationStatus = 'refunded'`, and `updatedAt = serverTimestamp()`.
  3. `offerRef` (`businesses/{businessId}/offers/{offerId}`):
     - Decrements `reservedPax` by 1 via `FieldValue.increment(-1)` to release the inventory slot.
  4. `groupRef` (`groups/{offerId}`):
     - Atomically removes user from `participantsIds` via `FieldValue.arrayRemove(userId)` and filters out hiker from `members[]`.
  5. Commits `batch.commit()`.

#### D. `disputeRefundPayout` (Callable)
- **File:** `functions/index.js`
- **Caller Guard:** Authenticated hiker owning the booking (`caller.uid === userId`).
- **Validation Guard:** Enforces `disputeCount < 3`. If hiker has already disputed 3 times, throws `failed-precondition: Maximum of 3 dispute attempts reached`.
- **Parameters:**
  ```javascript
  {
      bookingId: string,
      businessId: string,
      cancellationId: string,
      reason: string
  }
  ```
- **Atomic Operations (`db.batch()`):**
  1. `cancellationRef` (`businesses/{businessId}/cancellations/{cancellationId}`):
     - Increments `disputeCount` by 1 via `FieldValue.increment(1)`.
     - Sets `status = 'refund_disputed'`, `handshakeStep = 'refund_disputed'`, `disputeReason = reason`, `disputedAt = serverTimestamp()`, and `updatedAt = serverTimestamp()`.
  2. `bookingRef` (`users/{userId}/bookings/{bookingId}`):
     - Sets `paymentVerificationStatus = 'refund_disputed'`, and `updatedAt = serverTimestamp()`.
  3. **Tour Group Chat Retention:**
     - Hiker is retained in `groups/{offerId}` so they can message the organizer directly.
  4. Commits `batch.commit()`.

#### E. `acceptAdminCancellation` (Callable)
- **File:** `functions/index.js`
- **Caller Guard:** Authenticated hiker owning the booking (`caller.uid === userId`).
- **Parameters:**
  ```javascript
  {
      bookingId: string,
      userId: string,
      businessId: string,
      cancellationId: string
  }
  ```
- **Atomic Operations (`db.batch()`):**
  1. `cancellationRef` (`businesses/{businessId}/cancellations/{cancellationId}`):
     - Sets `status = 'approved'`, `handshakeStep = 'awaiting_admin_refund_decision'`, and `updatedAt = serverTimestamp()`.
  2. `bookingRef` (`users/{userId}/bookings/{bookingId}`):
     - Sets `cancellationReason = 'Cancellation accepted by hiker'`, `updatedAt = serverTimestamp()`.
  3. Commits `batch.commit()`.

#### F. `settleManualBalance` (Callable)
- **File:** `functions/index.js`
- **Caller Guard:** Admin or superadmin for the target `businessId`.
- **Parameters:**
  ```javascript
  {
      bookingId: string,
      userId: string,
      businessId: string,
      offerId: string
  }
  ```
- **Atomic Operations (`db.batch()`):**
  1. `bookingRef` (`users/{userId}/bookings/{bookingId}`):
     - Sets `status = 'paid'`, `remainingBalance = 0`, `paymentVerificationStatus = 'fully_paid'`, appends full balance settlement payment record with `status = 'captured'`, and sets `updatedAt = serverTimestamp()`.
  2. Commits `batch.commit()`.

#### G. Overpayment Payout & Handshake Callables
- **File:** `functions/index.js`
- **`completeOverpaymentRefund`:** Admin transfers excess funds (e.g. ₱9,000) and uploads receipt proof. Sets `booking.overpayment.status = 'awaiting_user_confirmation'`, `booking.overpayment.adminRefundReceiptUrl = receiptUrl`.
- **`confirmOverpaymentReceived`:** Hiker confirms receiving excess money. Sets `booking.overpayment.status = 'completed'`, `booking.overpayment.userConfirmedReceivedAt = serverTimestamp()`. Booking remains active and `'paid'`.
- **`disputeOverpaymentRefund`:** Hiker reports excess refund not received. Validates `disputeCount < 3`, sets `booking.overpayment.status = 'refund_disputed'`, `booking.overpayment.disputeReason = reason`. Booking remains active and confirmed for the hike.

---

## 9. Implementation Summary & Verified Refinements

### A. Flexible Manual Payment & Downpayment Verification
1. **Removed Rigid Percentages:** Hiker side no longer forces 50% vs. 100% full payment presets. The user uploads their receipt and reference code.
2. **Admin-Side Classification:** The organizer verifies the receipt against bank/wallet records, enters the actual amount paid, and classifies the payment as either `full` (marking booking `paid` with ₱0 balance) or `downpayment` (calculating remaining balance and setting status `downpayment`).
3. **Removed "Reported Amount":** Removed the misleading "Reported Amount" row from `ManualQRVerificationCard.tsx` because hikers do not report an amount when submitting screenshots; organizers determine the exact amount by checking bank/e-wallet transaction statements.
4. **Balance Settlement:** Admin can either verify additional installment receipts or click **"Settle Balance"** when paid in cash or offline on hike day via `settleManualBalance`.

### B. Upfront Wallet Collection & Zero Pre-Fill Rule
1. **Upfront Collection:** In `CancelBookingModal.tsx`, when a hiker initiates a cancellation for a paid booking, the GCash/Maya number and Account Holder Name are collected immediately.
2. **Strict Zero Pre-Fill:** Even if the hiker has a registered phone number in their user profile, the inputs start completely blank (`''`). This prevents funds from being sent to registered SIM cards that are not active e-wallets.

### C. Two-Way Verification Handshake & Dispute Limits
1. **Two-Way Handshake:** After the organizer uploads the payout proof receipt, the status transitions to `refund_submitted`, `handshakeStep: 'awaiting_user_confirmation'`. The hiker must verify receipt of the money.
2. **Action 1: "Confirm Received":** Hiker confirms funds arrived in their account. Sets status `refund_completed`, booking `refunded`, releases the inventory slot, and removes the hiker from the tour group chat.
3. **Action 2: "Not Received / Appeal":** Hiker reports funds did not arrive or reference details do not match. Prompts admin with an attempt counter (e.g. `1/3`) and dispute reason, allowing admin to re-send or upload corrected proof.
4. **Dispute Limit of 3 Attempts:** Automated disputes are strictly capped at 3 attempts (`disputeCount <= 3`). Once the 3rd attempt is reached, the dispute button is disabled, and the UI instructs the hiker to coordinate directly with the organizer in the tour group chat.
5. **Tour Group Chat Retention Rule:** The hiker is **NOT** removed from `groups/{offerId}` while a refund is ongoing or disputed. They remain active in the tour group chat throughout the process so they have an open communication channel with the organizer. Removal happens only upon confirmed completion.

### D. Case A: Overpayment Refund WITHOUT Cancelling Booking
1. **Separation of Hike Settlement & Excess Refund:** If a hiker mistakenly sends ₱10,000 for a ₱1,000 tour, the booking is **NOT** cancelled.
2. **Hike Status Confirmed:** ₱1,000 is captured, setting `remainingBalance = 0`, booking `status = 'paid'`, `paymentVerificationStatus = 'fully_paid'`. The booking stays active in the **Upcoming** tab, and the hiker is added to the tour group chat.
3. **Dedicated Overpayment Flow:** An excess refund record of ₱9,000 is tracked via `booking.overpayment`. The hiker inputs their e-wallet details (zero pre-fill), admin uploads the ₱9,000 transfer receipt, and hiker confirms receipt via the two-way handshake.

### E. Tab Placement & Status Badge Rules
1. **Pending Tab:**
   - Active cancellations and refunds in progress stay in the **Pending** tab with an amber **`REFUNDING`** badge.
   - If the hiker needs to submit wallet details, an action-needed border highlight appears. Once submitted, it displays **"Awaiting Payout"**. Once admin uploads proof, it displays **"Action Required: Confirm Receipt"**.
2. **History Tab:**
   - Only moves to **History** once the refund is finalized and confirmed (`status === 'refunded'`), displaying a green/check **`REFUNDED`** tag.
3. **Upcoming Tab (Overpayments):**
   - Bookings with overpayments remain in the **Upcoming** tab because the tour reservation is 100% paid and confirmed. An overpayment card provides tracking for the excess refund without disrupting the tour.

### F. Finalize Without Refund (`refundType === 'none'`)
1. **Direct Terminal Transition:** When an admin approves or finalizes a cancellation with zero refund (`refundType === 'none'` or `shouldRefund === false`), the atomic Cloud Function `processCancellationApproval`:
   - Explicitly records `refundDecision = 'no_refund'` and `handshakeStep = 'completed'`.
   - Transitions booking `status = 'cancelled'` and `paymentVerificationStatus = 'cancelled_no_refund'`.
   - Records `refundAmount = 0` and `adminNote`.
2. **Immediate History Tab Migration:**
   - Because `handshakeStep` is `'completed'` rather than remaining stuck in `'awaiting_admin_refund_decision'` or `'awaiting_admin_payout'`, the booking immediately moves to the **History** tab.
   - Renders a clean `"Cancelled (No Refund)"` badge without showing amber `REFUNDING` or prompting the hiker for e-wallet info.

### G. Admin Real-Time Reactivity, Listener Reference Counting & Store Synchronization
1. **Firestore Listener Reference Counting:**
   - In `bookingStoreCreator.ts`, `subscribeToBusinessBookings(offerId, businessId)` and `unsubscribeFromBusinessBookings(offerId)` use reference counting (`listenerCounts: Record<string, number>`).
   - Prevents unmounting list screens (e.g. `AdminOfferList`) from prematurely killing the active snapshot listener required by detail views (`ViewOffer`, `ReviewScreen`).
   - The underlying Firestore listener is only unsubscribed when all consumer screens have unmounted (`listenerCounts[offerId] <= 0`).
2. **Stable Listener Dependency Keys:**
   - In `useBookingListenerAdminList.ts`, `activeOfferIdsKey` derives a stable sorted string (`offerIds.sort().join(',')`) via `useMemo`.
   - The effect only re-executes when offer IDs actually change, eliminating listener churn when `reservedPax` or other offer properties mutate.
   - Includes past hike dates so organizers can manage active/historical refunds and post-hike records seamlessly.
3. **Immediate Store Updates & `refreshBookingItem`:**
   - `create()` immediately upserts admin writes into `state.bookingByOffer[offerId]`.
   - Store helper `refreshBookingItem(bookingId, offerId)` fetches latest document state via `BookingRepo.fetchById` and upserts it across `bookingByOffer`, `businessBookings`, and `offerBookings`.
   - Invoked across all Cloud Function resolutions (`verifyManualPayment`, `settleManualBalance`, `completeOverpaymentRefund`, `processCancellationApproval`, `completeManualRefund`, etc.), giving 0ms UI reactivity on Web and Mobile without requiring a browser reload.
4. **Comprehensive `currentSyncKey`:**
   - `useReviewLogic.ts` monitors payment verification status, remaining balance, overpayment status/receipt URL/dispute count, cancellation handshake step/decision/amount/proof, and updated timestamps.
   - Document review states, tabs, and action cards synchronize instantly upon state mutation.

### H. Form Hardening, Input Sanitization & Web DOM Synchronization
1. **Strict 11-Digit Mobile Number Validation:**
   - In `OwnerQRModal.tsx`, `CancelBookingModal.tsx`, `UserRefundScreen.tsx`, and `OverpaymentRefundCard.tsx`, mobile inputs enforce 11 digits, strictly starting with `09`, with digit-only sanitization (`replace(/\D/g, '').slice(0, 11)`).
2. **Anti-Corruption & Boundary Guards:**
   - In `ManualQRVerificationCard.tsx`, downpayment input strictly bounds verified amounts between ₱0.01 and `remainingBalance`, preventing negative balances or accidental overpayments.
   - Admin notes and account names sanitize illegal characters and enforce maximum string lengths.
3. **React Ref Mutation Deferral:**
   - In `AdminRefundModal.tsx`, direct mutation of input ref values during render has been moved into `useEffect([visible])` to comply with React 19 / React Compiler rules.

### I. Dispute Modals Keyboard Handling & Multiline Input Architecture
1. **Shrink-Proof Multiline Inputs:**
   - In `CustomTextInput.tsx`, multiline containers specify `minHeight: 96, paddingVertical: 10`, while inner text inputs specify `minHeight: 72, textAlignVertical: 'top'`.
   - Passes `numberOfLines={multiline ? (props.numberOfLines || 3) : 1}` to prevent shrinking into a 1-line pill when empty or multiline.
2. **Double-Border Elimination:**
   - Stripped outer box borders from `styles.disputeTextInput`, passing `containerStyle={{ minHeight: 96 }}` directly to `CustomTextInput`.
3. **Keyboard Avoidance in Modal Dialogs:**
   - Wrapped Dispute Modals in `CancellationCard.tsx`, `UserRefundScreen.tsx`, and `OverpaymentRefundCard.tsx` with `KeyboardAvoidingView` (`behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`) and an inner `ScrollView` (`keyboardShouldPersistTaps="handled"`).
   - Guarantees form inputs and action buttons (`Cancel` / `Submit Appeal`) remain visible and accessible above virtual keyboards on Android and iOS devices.

### J. Overpayment Refund Card Lifecycle, Collapsible Accordion & Completed Green Theme
1. **Uniform Typography:**
   - Removed nested bold wrappers so `"Your tour reservation is 100% paid and confirmed!"` renders uniformly with standard banner text styling.
2. **Completed Green Visual Theme:**
   - When `overpayment.status === 'completed'`:
     - Container border: `Colors.STATUS_APPROVED_BORDER` (`#86EFAC`).
     - Divider line: `#BBF7D0`.
     - Header icon: Feather `check-circle` in `Colors.SUCCESS`.
     - Header title: `"Overpayment Refund Resolved"` in `#166534`.
     - Excess badge: `#F0FDF4` background, `#86EFAC` border, and `#166534` text displaying `₱{excessAmount} REFUNDED`.
3. **Receipt Proof Access in Completed State:**
   - When completed, if `adminRefundReceiptUrl` is present, renders a `"View Refund Receipt Proof"` button that triggers `ImagePreviewModal`.
4. **Collapsible Accordion with In-Render State Sync:**
   - Header is a `TouchableOpacity` with a `chevron-up` / `chevron-down` indicator.
   - Defaults to open when action is needed (`status !== 'completed'`) and auto-collapses upon completion.
   - Uses in-render state adjustment (`prevStatus !== status`) to synchronize state on status changes without triggering ESLint / React Compiler cascading render warnings.

### K. Admin Offer View Reactivity, Status Overwrite Guard & Cancellation Mapping
1. **Guarded Cancellation Status Overwrite:**
   - In `src/app/(app)/(main)/admin/offer/view.tsx`, `displayBookings` ensures an approved cancellation (`cancellation.status === 'approved'`) does **not** inadvertently downgrade or overwrite bookings already in terminal/refund statuses (`'refund'`, `'refunded'`, `'for-cancellation'`, or `'cancelled'`).
   - Ignores deleted cancellations by filtering `!c.isDeleted` when locating a booking's associated cancellation record.
   - Forwards `cancellations={businessCancellations}` to `OfferViewScreen`.
2. **Cancellation-Aware Booking Filters:**
   - In `src/features/Admin/screens/Offer/OfferViewScreen.tsx`, added `cancellations?: Cancellation[]` to `OfferViewScreenProps` and passed `cancellations` into `useBookingFilters(bookings, cancellations)` so status tab filters (`All`, `Pending`, `Confirmed`, `Cancelled`, `Refund`) evaluate accurately based on cancellation states.
3. **Card-Level Cancellation Mapping:**
   - In `OfferViewScreen.tsx`'s booking list mapping, resolves each booking's active cancellation (`const cancellation = cancellations.find(c => c.bookingId === b.id && !c.isDeleted);`) and passes `cancellation={cancellation}` to `<AdminBookingCard />`, ensuring booking cards immediately render accurate refund progress and cancellation badges.

### L. Mobile Store Persistence Hygiene (Zustand Partialize)
1. **Stale Listener Rehydration Prevention:**
   - In `src/core/models/Booking/stores/bookingStore.native.ts`, Zustand's `persist` middleware was previously serializing the entire store state into React Native `AsyncStorage`.
   - On mobile app restarts, stale listener reference counts (`listenerCounts`) were rehydrated without the corresponding in-memory Firestore snapshot subscriptions (`activeListeners: Record<string, () => void>`), preventing new listeners from binding.
2. **Partialize Filter Configuration:**
   - Added `partialize: (state) => { const { activeListeners, listenerCounts, ...rest } = state; return rest; }` to `persist` options, ensuring listener management state is purely in-memory while persisting only serializable booking cache data.

### M. Business Owner Role Isolation for Payment Configuration
1. **Strict Owner Distinction:**
   - In `src/app/(app)/(main)/admin/index.tsx`, `isBusinessOwner` previously included `role === 'admin'`, which mistakenly classified all regular staff administrators as owners.
   - Updated `isBusinessOwner` calculation to strictly evaluate:
     ```ts
     const isBusinessOwner = Boolean(
         isOwner ||
         role === 'owner' ||
         (businessAccount?.owner?.id && profile?.id && businessAccount.owner.id === profile.id)
     );
     ```
2. **Payment QR Access Control:**
   - In `DashboardScreen.tsx`, the **"Manual Payment QR"** configuration section and management modal triggers (`OwnerQRModal`) are guarded by `isOwner`. Non-owner admin staff no longer see or have access to edit the business's payment QR code or payout details.

### N. Receipt Screen UI Streamlining & Cloud Function Notification Context
1. **Disabled "Close Receipt" Sticky Footer:**
   - In `src/features/Book/screens/Payment/ReceiptScreen.tsx`, disabled the `<CustomStickyFooter>` rendering the `"Close Receipt"` button without removing its underlying implementation code.
   - Screen dismissal is handled cleanly via the top `CustomHeader` (`onBackPress={onFinish}`).
2. **Cloud Function Notification Payload Enrichment:**
   - In `functions/index.js` (`completeManualRefund`), added `offerId` to `metadata` and `data` in the `notifyUser` call.
   - Resolved the unused variable warning while enabling deep-linking directly into offer details and group chats from refund push notifications.



