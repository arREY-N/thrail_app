/**
 * @file cancellationTestData.ts
 * @description In-memory mock data models, preset scenarios, and the comprehensive 18-status
 * Backend vs. UI Coverage Matrix for the developer Cancellation Lifecycle Simulator.
 * Strictly 0 database impact (100% in-memory React state).
 */

import { Booking, BookingStatus } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { Colors } from '@/src/constants/colors';

export interface CoverageItem {
    status: BookingStatus;
    category: 'Phase 1: Verification' | 'Phase 2: Payment' | 'Phase 3: Operations' | 'Sub-Approval: Cancellation' | 'Sub-Approval: Reschedule';
    existingOnBackend: string;
    displayedByUI: string;
    verdict: 'FULL_UI' | 'PARTIAL_BACKEND' | 'DEFECT_BACKEND' | 'GAP_BACKEND';
    verdictLabel: string;
    catchRef: 'Catch 23' | 'Catch 24' | 'Catch 25' | 'Catch 26' | 'Catch 27' | 'Catch 28' | 'Catch 29' | 'None';
    backendActionRequired: string;
}

export interface ScenarioDefinition {
    id: string;
    title: string;
    subtitle: string;
    initialStatus: BookingStatus;
    simulatedBookingStatus: BookingStatus;
    simulatedCancellationStatus?: 'pending' | 'approved' | 'rejected' | null;
    cancelledBy?: 'user' | 'admin';
    userReason?: string;
    adminNote?: string;
    currentPipelineStep: 1 | 2 | 3 | 4;
    hikerTab: 'pending' | 'upcoming' | 'history';
    hikerBadgeText: string;
    hikerBadgeColor: string;
    hikerBadgeBg: string;
    adminTab: 'Needs Review' | 'For Payment' | 'Fully Paid' | 'Rejected / Cancelled';
    adminActions: string[];
    uiCoverage: {
        status: 'FULL' | 'PARTIAL';
        description: string;
        screens: string[];
    };
    backendCoverage: {
        status: 'SUPPORTED' | 'STUBBED' | 'DEFECT' | 'GAP';
        hookOrStore: string;
        catchRef?: 'Catch 23' | 'Catch 24' | 'Catch 25' | 'Catch 26' | 'Catch 27' | 'Catch 28' | 'Catch 29';
        detail: string;
    };
    parityBreakdown: string;
    expectedFirestorePayload: string;
}

/**
 * Creates an in-memory mock Booking object with zero database side-effects.
 */
export const createMockBooking = (
    status: BookingStatus,
    options?: {
        cancellationReason?: string;
        cancelledBy?: 'user' | 'admin';
        isPaid?: boolean;
        isDownpayment?: boolean;
    }
): Booking => {
    const hikeDate = new Date();
    hikeDate.setDate(hikeDate.getDate() + 14); // 2 weeks in future

    return {
        id: 'mock-booking-sim-101',
        createdAt: new Date(),
        updatedAt: new Date(),
        status,
        cancellationReason: options?.cancellationReason,
        cancelledBy: options?.cancelledBy,
        offer: {
            id: 'offer-sim-404',
            date: hikeDate,
            price: 2500,
        },
        user: {
            id: 'user-hiker-sim-99',
            username: 'echo_hiker',
            firstname: 'Echo',
            lastname: 'Hiker',
            email: 'hiker@example.com',
            phoneNumber: '+639171234567',
            birthday: new Date(1995, 5, 15),
            phoneVerifiedAt: new Date(),
        },
        business: {
            id: 'biz-organizer-sim-01',
            name: 'Sierra Madre Expeditions',
        },
        trail: {
            id: 'trail-sim-88',
            name: 'Mt. Daraitan & Tinipak River Trail',
            location: 'Tanay, Rizal',
        },
        emergencyContact: {
            name: 'Maria Santos',
            contactNumber: '+639189876543',
            phoneVerifiedAt: new Date(),
        },
        payment: options?.isPaid || options?.isDownpayment
            ? [
                {
                    gateway: 'PayMongo (GCash)',
                    sessionId: 'pay_sess_sim_001',
                    referenceCode: 'REF-2026-9871',
                    status: 'captured',
                    refundableUntil: hikeDate,
                    amount: options.isPaid ? 2500 : 1250,
                    createdAt: new Date(),
                },
            ]
            : [],
        documents: [
            {
                name: 'Valid Government ID (Passport)',
                file: 'https://example.com/passport.jpg',
                valid: 'approved',
            },
            {
                name: 'Medical Certificate (Fit to Hike)',
                file: 'https://example.com/medcert.jpg',
                valid: 'approved',
            },
        ],
    };
};

/**
 * Creates an in-memory mock Cancellation object with zero database side-effects.
 */
export const createMockCancellation = (
    status: 'pending' | 'approved' | 'rejected',
    options?: {
        reason?: string;
        adminNote?: string;
        cancelledBy?: 'user' | 'admin';
    }
): Cancellation => {
    return {
        id: 'mock-cancel-sim-202',
        bookingId: 'mock-booking-sim-101',
        offerId: 'offer-sim-404',
        businessId: 'biz-organizer-sim-01',
        userId: 'user-hiker-sim-99',
        status,
        cancelledBy: options?.cancelledBy ?? 'user',
        reason: options?.reason ?? 'Schedule conflict with work commitment.',
        adminNote: options?.adminNote,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

/**
 * 10 Preset Scenarios modeling all combinations from cancellation_lifecycle_scenarios.md.
 */
export const PRESET_SCENARIOS: ScenarioDefinition[] = [
    {
        id: 'scenario-1',
        title: '1. Phase 1 Reservation Cancel',
        subtitle: 'Audit Catch 26: deleteDoc vs. Sub-Approval',
        initialStatus: 'for-reservation',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'Schedule conflict arose shortly after reservation.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION PENDING',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Approve Cancellation', 'Decline Cancellation'],
        uiCoverage: {
            status: 'FULL',
            description: 'MyBookingsScreen (Pending tab), BookingDetailsScreen (CancellationCard with Withdraw action).',
            screens: ['MyBookingsScreen', 'BookingDetailsScreen', 'CancellationCard', 'CancelBookingModal'],
        },
        backendCoverage: {
            status: 'GAP',
            hookOrStore: 'useCancellationUser.ts (line 67)',
            catchRef: 'Catch 26',
            detail: 'Hook runs cancelPendingBooking which calls BookingRepo.delete -> deleteDoc. Destroys document instead of entering sub-approval.',
        },
        parityBreakdown: 'Frontend expects booking to remain in Pending tab as "for-cancellation" with CancellationCard. Backend wipes document from Firestore completely.',
        expectedFirestorePayload: 'updateDoc(users/{userId}/bookings/{bookingId}, { status: "for-cancellation" }) + setDoc(businesses/{bizId}/cancellations/{id})',
    },
    {
        id: 'scenario-2',
        title: '2. Document Review Cancel',
        subtitle: 'Audit Catch 23: Pending Docs Sub-Approval',
        initialStatus: 'pending-docs',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'Unable to secure medical clearance in time.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION PENDING',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Approve Cancellation', 'Decline Cancellation'],
        uiCoverage: {
            status: 'FULL',
            description: 'CancellationCard displays submitted reason and withdraw button. Status badge reflects pending review.',
            screens: ['MyBookingsScreen (Pending)', 'CancellationCard', 'BookingDetailsScreen'],
        },
        backendCoverage: {
            status: 'GAP',
            hookOrStore: 'useCancellationUser.ts (lines 67-80)',
            catchRef: 'Catch 23',
            detail: 'Writes cancellation document to businesses/*/cancellations, but omits status update on user booking document.',
        },
        parityBreakdown: 'Frontend controller synthesizes displayBookings to show for-cancellation until backend updates the booking doc directly.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "for-cancellation", cancellationReason: reason })',
    },
    {
        id: 'scenario-3',
        title: '3. Approved Docs Cancel',
        subtitle: 'Phase 1 Complete, Prior to Checkout',
        initialStatus: 'approved-docs',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'Family emergency prevents participation.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION PENDING',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Approve Cancellation', 'Decline Cancellation'],
        uiCoverage: {
            status: 'FULL',
            description: 'Pending tab retains card with action-needed badge replaced by waiting badge.',
            screens: ['MyBookingsScreen', 'CancellationCard'],
        },
        backendCoverage: {
            status: 'GAP',
            hookOrStore: 'useCancellationUser.ts',
            catchRef: 'Catch 23',
            detail: 'Booking document status not updated in Firestore; relies on controller synthesis.',
        },
        parityBreakdown: 'Clean frontend flow ready; awaiting backend single-write transaction.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "for-cancellation" })',
    },
    {
        id: 'scenario-4',
        title: '4. Checkout Window Cancel',
        subtitle: 'Phase 2: Payment Window Open (No Charges)',
        initialStatus: 'for-payment',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'Decided not to proceed before payment deadline.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION PENDING',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Approve Cancellation', 'Decline Cancellation'],
        uiCoverage: {
            status: 'FULL',
            description: 'Checkout CTA is suppressed while cancellation sub-approval is pending.',
            screens: ['BookingDetailsScreen', 'CancellationCard'],
        },
        backendCoverage: {
            status: 'GAP',
            hookOrStore: 'useCancellationAdmin.ts (lines 80-84) / useCancellationUser.ts',
            catchRef: 'Catch 27',
            detail: 'Catch 27: processCancellationRequest unconditionally runs onRefund, which throws Error("No payment found") because totalAmountPaid === 0 on unpaid checkout, halting slot release.',
        },
        parityBreakdown: 'Frontend locks payment button while for-cancellation is active; backend fails to release slot due to unconditional refund trigger on unpaid booking.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "for-cancellation", sessionId: null })',
    },
    {
        id: 'scenario-5',
        title: '5. Downpayment Cancel',
        subtitle: 'Audit Catch 29: Partial Refund Sub-Approval',
        initialStatus: 'downpayment',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'Injury during training session.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION PENDING',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Approve with Refund', 'Decline Cancellation'],
        uiCoverage: {
            status: 'FULL',
            description: 'CancellationCard displays partial deposit notice and estimated refund calculation.',
            screens: ['MyBookingsScreen (Pending)', 'CancellationCard', 'BookingDetailsScreen'],
        },
        backendCoverage: {
            status: 'STUBBED',
            hookOrStore: 'useCancellationUser.ts (lines 207-246)',
            catchRef: 'Catch 29',
            detail: 'Catch 29: proceedToRefund throws stub Error("Refund processing is not yet implemented"). PayMongo webhook listener unattached.',
        },
        parityBreakdown: 'Frontend displays refund timeline; backend throws runtime exception if refund dispatch is triggered.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "refund", refundedAmount: 1250 })',
    },
    {
        id: 'scenario-6',
        title: '6. Confirmed Paid Hike Cancel',
        subtitle: 'Audit Catch 23 & 29: 100% Paid Refund Sub-Approval',
        initialStatus: 'paid',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'Unexpected urgent business trip abroad.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION PENDING',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Approve Full Refund', 'Decline Cancellation'],
        uiCoverage: {
            status: 'FULL',
            description: 'CancellationCard displays 24-48h organizer review notice and PayMongo refund policy.',
            screens: ['CancellationCard', 'BookingDetailsScreen', 'MyBookingsScreen'],
        },
        backendCoverage: {
            status: 'STUBBED',
            hookOrStore: 'useCancellationUser.ts / usePaymentAdmin',
            catchRef: 'Catch 29',
            detail: 'Catch 23 prevents status persistence; Catch 29 proceedToRefund throws stub Error("Refund processing is not yet implemented").',
        },
        parityBreakdown: 'Full UI ready with character counter, suggestion chips, and responsive modal; backend refund pipeline missing.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "refund" }) + trigger refundBooking Cloud Function',
    },
    {
        id: 'scenario-7',
        title: '7. Admin Declines with Reason',
        subtitle: 'Audit Catch 24: cancellation-rejected Status',
        initialStatus: 'paid',
        simulatedBookingStatus: 'cancellation-rejected',
        simulatedCancellationStatus: 'rejected',
        cancelledBy: 'user',
        userReason: 'Schedule conflict with work.',
        adminNote: 'Request submitted within 24 hours of hike departure. Policy requires 72 hours.',
        currentPipelineStep: 3,
        hikerTab: 'pending',
        hikerBadgeText: 'CANCELLATION DECLINED',
        hikerBadgeColor: Colors.ERROR,
        hikerBadgeBg: Colors.STATUS_CANCELLED_BG,
        adminTab: 'Needs Review',
        adminActions: ['Awaiting Hiker Appeal or Withdrawal'],
        uiCoverage: {
            status: 'FULL',
            description: 'Displays red alert banner with organizer explanation, Appeal button, and Withdraw button.',
            screens: ['CancellationCard', 'BookingDetailsScreen', 'useBookingFilters (action-needed)'],
        },
        backendCoverage: {
            status: 'DEFECT',
            hookOrStore: 'Booking.utils.ts (lines 9-15)',
            catchRef: 'Catch 24',
            detail: 'updateBookingOnCancellation returns unmutated booking.status when approved === false, leaving it stuck in for-cancellation.',
        },
        parityBreakdown: 'Frontend handles cancellation-rejected as actionable pending item; backend utility fails to write cancellation-rejected status.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "cancellation-rejected", adminNote: note })',
    },
    {
        id: 'scenario-8',
        title: '8. Hiker Appeals Decline',
        subtitle: 'Re-enters Sub-Approval with Updated Justification',
        initialStatus: 'cancellation-rejected',
        simulatedBookingStatus: 'for-cancellation',
        simulatedCancellationStatus: 'pending',
        cancelledBy: 'user',
        userReason: 'APPEAL: Attached certified hospital emergency documentation.',
        adminNote: 'Previous decline: Request within 24h of hike.',
        currentPipelineStep: 2,
        hikerTab: 'pending',
        hikerBadgeText: 'APPEAL PENDING REVIEW',
        hikerBadgeColor: '#B45309',
        hikerBadgeBg: '#FEF3C7',
        adminTab: 'Needs Review',
        adminActions: ['Re-evaluate Appeal', 'Approve Cancellation', 'Final Decline'],
        uiCoverage: {
            status: 'FULL',
            description: 'CancelBookingModal in update mode pre-fills text. CancellationCard shows appeal status.',
            screens: ['CancelBookingModal (update mode)', 'CancellationCard'],
        },
        backendCoverage: {
            status: 'SUPPORTED',
            hookOrStore: 'useCancellationUser.ts (updateCancellationReason)',
            detail: 'updateCancellationReason updates cancellation doc reason and resets status to pending.',
        },
        parityBreakdown: 'Fully functional on frontend; updates cancellation request in Firestore.',
        expectedFirestorePayload: 'updateDoc(cancellationRef, { reason: updatedReason, status: "pending", updatedAt: serverTimestamp() })',
    },
    {
        id: 'scenario-9',
        title: '9. Hiker Withdraws Request',
        subtitle: 'Restores Booking to Original Active Status',
        initialStatus: 'for-cancellation',
        simulatedBookingStatus: 'paid',
        simulatedCancellationStatus: null,
        cancelledBy: 'user',
        currentPipelineStep: 4,
        hikerTab: 'upcoming',
        hikerBadgeText: 'CONFIRMED HIKE',
        hikerBadgeColor: Colors.PRIMARY,
        hikerBadgeBg: Colors.STATUS_APPROVED_BG,
        adminTab: 'Fully Paid',
        adminActions: ['Prepare Gear', 'Print Manifest'],
        uiCoverage: {
            status: 'FULL',
            description: 'Inline confirmation dialog with Yes, Withdraw. Removes CancellationCard and restores hike tracker.',
            screens: ['CancellationCard', 'BookingDetailsScreen', 'MyBookingsScreen (Upcoming)'],
        },
        backendCoverage: {
            status: 'SUPPORTED',
            hookOrStore: 'useCancellationUser.ts (cancelUserRequest)',
            detail: 'cancelUserRequest deletes cancellation request doc from businesses/*/cancellations.',
        },
        parityBreakdown: 'Frontend cleans up local synthetic state and refreshes booking cache cleanly.',
        expectedFirestorePayload: 'deleteDoc(cancellationRef) + booking remains status: "paid"',
    },
    {
        id: 'scenario-10',
        title: '10. Organizer Force-Cancels Hike',
        subtitle: 'Weather / Force Majeure Event Cancellation',
        initialStatus: 'paid',
        simulatedBookingStatus: 'cancelled',
        simulatedCancellationStatus: 'approved',
        cancelledBy: 'admin',
        adminNote: 'Trail closed by DENR due to Typhoon Signal #2 warning. Safety priority.',
        currentPipelineStep: 4,
        hikerTab: 'pending',
        hikerBadgeText: 'ORGANIZER CANCELLED',
        hikerBadgeColor: Colors.ERROR,
        hikerBadgeBg: Colors.STATUS_CANCELLED_BG,
        adminTab: 'Rejected / Cancelled',
        adminActions: ['Batch Refund Processed'],
        uiCoverage: {
            status: 'FULL',
            description: 'CancellationCard renders organizer notice with Dual Actions: [Accept & Refund] and [Reschedule].',
            screens: ['CancellationCard (isAdminCancelled)', 'RescheduleModal', 'BookingDetailsScreen'],
        },
        backendCoverage: {
            status: 'DEFECT',
            hookOrStore: 'useBookingAdmin.ts (onCancelUnpaid)',
            catchRef: 'Catch 28',
            detail: 'Catch 28: onCancelUnpaid in useBookingAdmin is an empty placeholder using setTimeout(1500) and Alert.alert instead of writing to Firestore.',
        },
        parityBreakdown: 'Frontend provides polished dual-action UI; backend endpoints are stubs or alert-only mocks.',
        expectedFirestorePayload: 'updateDoc(bookingRef, { status: "cancelled", cancelledBy: "admin" })',
    },
];

/**
 * Complete 18-Status Backend vs. UI Coverage Matrix Catalog.
 */
export const STATUS_COVERAGE_MATRIX: CoverageItem[] = [
    {
        status: 'for-reservation',
        category: 'Phase 1: Verification',
        existingOnBackend: 'useBookingsStore.create, BookingRepo.create (writes initial booking doc)',
        displayedByUI: 'MyBookingsScreen (Pending tab), BookingDetailsScreen (Waiting for organizer profile review)',
        verdict: 'GAP_BACKEND',
        verdictLabel: '❌ Backend Gap (Catch 26)',
        catchRef: 'Catch 26',
        backendActionRequired: 'Remove deleteDoc call in cancelPendingBooking. Route to for-cancellation sub-approval.',
    },
    {
        status: 'pending-docs',
        category: 'Phase 1: Verification',
        existingOnBackend: 'useBookingUserItem, BookingRepo.update (document upload array)',
        displayedByUI: 'MyBookingsScreen (Pending tab), DocumentUploadModal, RequirementChecklist',
        verdict: 'PARTIAL_BACKEND',
        verdictLabel: '⚠️ Backend Partial (Catch 23)',
        catchRef: 'Catch 23',
        backendActionRequired: 'Add updateDoc(bookingRef, { status: "for-cancellation" }) in cancelBooking.',
    },
    {
        status: 'approved-docs',
        category: 'Phase 1: Verification',
        existingOnBackend: 'useBookingAdmin (approveDocs method in BookingRepo)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Action Needed badge), CTA: Proceed to Checkout',
        verdict: 'PARTIAL_BACKEND',
        verdictLabel: '⚠️ Backend Partial (Catch 23)',
        catchRef: 'Catch 23',
        backendActionRequired: 'Persist status: "for-cancellation" on booking doc when cancel requested.',
    },
    {
        status: 'reservation-rejected',
        category: 'Phase 1: Verification',
        existingOnBackend: 'useBookingAdmin (rejectDocs method in BookingRepo)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Action Needed badge), Re-submit Docs CTA, isDead: false',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None. Cleanly filtered and displayed.',
    },
    {
        status: 'for-payment',
        category: 'Phase 2: Payment',
        existingOnBackend: 'usePaymentAdmin (createCheckoutSession in PayMongo service)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Action Needed), Pay Now button, Checkout countdown',
        verdict: 'GAP_BACKEND',
        verdictLabel: '❌ Backend Crash (Catch 27)',
        catchRef: 'Catch 27',
        backendActionRequired: 'Guard onRefund in processCancellationRequest so unpaid bookings release slots without throwing Error("No payment found").',
    },
    {
        status: 'downpayment',
        category: 'Phase 2: Payment',
        existingOnBackend: 'usePaymentAdmin (PayMongo webhook captures 50% deposit)',
        displayedByUI: 'MyBookingsScreen (Upcoming tab, Partial filter), Remaining Balance notice, Cancel button',
        verdict: 'PARTIAL_BACKEND',
        verdictLabel: '⚠️ Backend Stubbed (Catch 29)',
        catchRef: 'Catch 29',
        backendActionRequired: 'Connect onRefund Cloud Function to replace stub Error("Refund processing is not yet implemented").',
    },
    {
        status: 'paid',
        category: 'Phase 2: Payment',
        existingOnBackend: 'usePaymentAdmin (PayMongo webhook captures 100% full payment)',
        displayedByUI: 'MyBookingsScreen (Upcoming tab), Hike pass ticket, Preparation checklist, Cancel button',
        verdict: 'PARTIAL_BACKEND',
        verdictLabel: '⚠️ Backend Stubbed (Catch 29)',
        catchRef: 'Catch 29',
        backendActionRequired: 'Fix Catch 23 status persistence and implement Catch 29 refund processing webhook.',
    },
    {
        status: 'completed',
        category: 'Phase 3: Operations',
        existingOnBackend: 'useBookingAdmin (checkInAttendee in BookingRepo)',
        displayedByUI: 'MyBookingsScreen (Upcoming tab, In-Progress badge), Cancellation strictly disabled in UI',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None. Correctly protected from cancellation.',
    },
    {
        status: 'finished',
        category: 'Phase 3: Operations',
        existingOnBackend: 'useBookingAdmin (markHikeFinished)',
        displayedByUI: 'MyBookingsScreen (History tab), Write Review CTA, Certification badge',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None. Handled in History tab.',
    },
    {
        status: 'expired',
        category: 'Phase 3: Operations',
        existingOnBackend: 'PayMongo webhook / cron for unpaid booking expiry',
        displayedByUI: 'MyBookingsScreen (History tab, Expired badge), Slot forfeited notice',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None. Handled in History tab.',
    },
    {
        status: 'for-cancellation',
        category: 'Sub-Approval: Cancellation',
        existingOnBackend: 'useCancellationUser.ts (writes to businesses/*/cancellations only)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Waiting filter), CancellationCard with Withdraw CTA',
        verdict: 'PARTIAL_BACKEND',
        verdictLabel: '⚠️ Backend Partial (Catch 23)',
        catchRef: 'Catch 23',
        backendActionRequired: 'Persist status: "for-cancellation" on user booking doc in Firestore.',
    },
    {
        status: 'cancellation-rejected',
        category: 'Sub-Approval: Cancellation',
        existingOnBackend: 'useCancellationUser.ts (cancellation doc updated to rejected)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Action Needed), CancellationCard with Reason + Appeal CTA',
        verdict: 'DEFECT_BACKEND',
        verdictLabel: '❌ Backend Defect (Catch 24)',
        catchRef: 'Catch 24',
        backendActionRequired: 'Fix updateBookingOnCancellation in Booking.utils.ts to return "cancellation-rejected".',
    },
    {
        status: 'refund',
        category: 'Sub-Approval: Cancellation',
        existingOnBackend: 'useCancellationStore (local filter), PayMongo queue placeholder',
        displayedByUI: 'MyBookingsScreen (History tab), CancellationCard PayMongo 3-5 day SLA banner',
        verdict: 'PARTIAL_BACKEND',
        verdictLabel: '⚠️ Backend Stubbed (Catch 25)',
        catchRef: 'Catch 25',
        backendActionRequired: 'Implement refund webhook listener to transition booking from refund to refunded.',
    },
    {
        status: 'refunded',
        category: 'Sub-Approval: Cancellation',
        existingOnBackend: 'Booking.types.ts (status defined in union)',
        displayedByUI: 'MyBookingsScreen (History tab), Green Refunded pill, Credit confirmation notice',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'Dispatch status update upon PayMongo credit confirmation webhook.',
    },
    {
        status: 'cancelled',
        category: 'Sub-Approval: Cancellation',
        existingOnBackend: 'useBookingAdmin (updateBookingOnCancellation sets status: "cancelled")',
        displayedByUI: 'MyBookingsScreen (History tab), Red Cancelled badge, Organizer cancellation notice if applicable',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None. Transitions cleanly to History.',
    },
    {
        status: 'for-reschedule',
        category: 'Sub-Approval: Reschedule',
        existingOnBackend: 'useRescheduleUser (reschedule requests collection)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Waiting filter), Reschedule banner',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None.',
    },
    {
        status: 'reschedule-rejected',
        category: 'Sub-Approval: Reschedule',
        existingOnBackend: 'useRescheduleUser (admin decline handler)',
        displayedByUI: 'MyBookingsScreen (Pending tab, Action Needed), Reschedule declined notice + Appeal CTA',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None.',
    },
    {
        status: 'rescheduled',
        category: 'Sub-Approval: Reschedule',
        existingOnBackend: 'useRescheduleUser (date update in offer)',
        displayedByUI: 'MyBookingsScreen (Upcoming tab), Updated date pill, Re-confirmed hike badge',
        verdict: 'FULL_UI',
        verdictLabel: '✅ Fully Covered in UI',
        catchRef: 'None',
        backendActionRequired: 'None.',
    },
];
