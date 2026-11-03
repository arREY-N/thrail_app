/**
 * @file adminBookingReviewTour.ts
 * @description Step configuration for the Admin ReviewScreen walkthrough.
 * Provides tab-accurate 5-step or 6-step walkthroughs for Documents, Payment, Cancellation, and Reschedule modes.
 * Dynamically adjusts step count based on whether actionable decision buttons exist.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * 6-step walkthrough for reviewing submitted hiker documents and verification.
 */
export const adminBookingReviewDocSteps: TutorialStep[] = [
    {
        id: 'review-step-1-hiker-card',
        category: 'Booking Review • Step 1 of 6',
        targetSpotlight: 'admin_review_hiker_card',
        title: 'Step 1: Hiker Profile & Status',
        description:
            'Inspect the hiker’s full name, member since date, booking status badge, age badge, and medical condition declaration flags.',
        actionTip: 'Tap "View Full Profile" on this card to inspect detailed preferences.',
    },
    {
        id: 'review-step-2-contacts-card',
        category: 'Booking Review • Step 2 of 6',
        targetSpotlight: 'admin_review_contacts_card',
        title: 'Step 2: Verification Contacts',
        description:
            'Review personal and emergency contact phone numbers. You can call contacts directly and toggle their 6-month validity verification status.',
        actionTip: 'Verify both contact numbers before approving the reservation.',
    },
    {
        id: 'review-step-3-activity-log',
        category: 'Booking Review • Step 3 of 6',
        targetSpotlight: 'admin_review_activity_log',
        title: 'Step 3: Activity Log & Audit Trail',
        description:
            'Inspect the chronological activity trail showing all booking lifecycle timestamps, reservation submissions, and payment updates.',
        actionTip: 'Review past activity entries to understand booking history.',
    },
    {
        id: 'review-step-4-tabs',
        category: 'Booking Review • Step 4 of 6',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 4: Review Workflow Tabs',
        description:
            'Use the segmented tabs bar to navigate between Required Documents, Payment Ledger, and dynamic tabs (Cancellation & Reschedule when requested).',
        actionTip: 'Switch between tabs to inspect specific aspects of the reservation.',
    },
    {
        id: 'review-step-5-content',
        category: 'Booking Review • Step 5 of 6',
        targetSpotlight: 'admin_review_tab_content',
        title: 'Step 5: Submitted Document Files',
        description:
            'Tap uploaded documents (Valid ID, Medical Certificate) to open full-screen previews, then mark each file as Approved or Rejected.',
        actionTip: 'All required documents must be reviewed before final approval.',
    },
    {
        id: 'review-step-6-decision',
        category: 'Booking Review • Step 6 of 6',
        targetSpotlight: 'admin_review_decision',
        title: 'Step 6: Booking Decision Actions',
        description:
            'Use the action buttons below to Approve the booking (unlocking payment for the hiker) or Reject with required feedback.',
        actionTip: 'Tap "Approve Booking" once contact and document requirements pass.',
    },
];

/**
 * 6-step walkthrough for inspecting the payment ledger and completing the booking.
 */
export const adminBookingReviewPaymentSteps: TutorialStep[] = [
    {
        id: 'review-step-1-hiker-card',
        category: 'Payment Review • Step 1 of 6',
        targetSpotlight: 'admin_review_hiker_card',
        title: 'Step 1: Hiker Profile & Status',
        description:
            'Inspect the hiker’s full name, member since date, booking status badge, age badge, and medical condition declaration flags.',
        actionTip: 'Check the hiker information and current status badge.',
    },
    {
        id: 'review-step-2-contacts-card',
        category: 'Payment Review • Step 2 of 6',
        targetSpotlight: 'admin_review_contacts_card',
        title: 'Step 2: Verification Contacts',
        description:
            'Review personal and emergency contact phone numbers. You can call contacts directly and toggle their 6-month validity verification status.',
        actionTip: 'Verify both contact numbers before approving the reservation.',
    },
    {
        id: 'review-step-3-activity-log',
        category: 'Payment Review • Step 3 of 6',
        targetSpotlight: 'admin_review_activity_log',
        title: 'Step 3: Activity Log & Audit Trail',
        description:
            'Inspect the chronological activity trail showing all booking lifecycle timestamps, reservation submissions, and payment updates.',
        actionTip: 'Review past activity entries to understand booking history.',
    },
    {
        id: 'review-step-4-tabs',
        category: 'Payment Review • Step 4 of 6',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 4: Review Workflow Tabs',
        description:
            'Use the segmented tabs bar to navigate between Required Documents, Payment Ledger, and dynamic tabs (Cancellation & Reschedule when requested).',
        actionTip: 'Switch between tabs to inspect specific aspects of the reservation.',
    },
    {
        id: 'review-step-5-content',
        category: 'Payment Review • Step 5 of 6',
        targetSpotlight: 'admin_review_tab_content',
        title: 'Step 5: Manual QR Verification & Ledger',
        description:
            'Inspect uploaded payment receipts, verify reference codes, and approve as Downpayment or Full Payment (or Edit/Revert).',
        actionTip: 'Inspect the receipt image carefully before confirming payment.',
    },
    {
        id: 'review-step-6-decision',
        category: 'Payment Review • Step 6 of 6',
        targetSpotlight: 'admin_review_decision',
        title: 'Step 6: Payment Actions & Settlement',
        description:
            'Use the Paid Cash button to mark onsite remaining balance settlements, or review the payment transaction records.',
        actionTip: 'Settle remaining balances before completing the hike.',
    },
];

/**
 * Walkthrough for inspecting cancellation requests, refund calculations, and dispute records.
 */
export const adminBookingReviewCancellationSteps: TutorialStep[] = [
    {
        id: 'review-step-1-hiker-card',
        category: 'Cancellation Review • Step 1 of 6',
        targetSpotlight: 'admin_review_hiker_card',
        title: 'Step 1: Hiker Profile & Status',
        description:
            'Inspect the hiker’s full name, member since date, booking status badge, age badge, and medical condition declaration flags.',
        actionTip: 'Review hiker identity and verification state.',
    },
    {
        id: 'review-step-2-contacts-card',
        category: 'Cancellation Review • Step 2 of 6',
        targetSpotlight: 'admin_review_contacts_card',
        title: 'Step 2: Verification Contacts',
        description:
            'Review personal and emergency contact phone numbers. You can call contacts directly and toggle their 6-month validity verification status.',
        actionTip: 'Contact the hiker directly if cancellation clarification is needed.',
    },
    {
        id: 'review-step-3-activity-log',
        category: 'Cancellation Review • Step 3 of 6',
        targetSpotlight: 'admin_review_activity_log',
        title: 'Step 3: Activity Log & Audit Trail',
        description:
            'Inspect the chronological activity trail showing cancellation request timestamps, dispute logs, and refund status updates.',
        actionTip: 'Review audit history for prior cancellation actions.',
    },
    {
        id: 'review-step-4-tabs',
        category: 'Cancellation Review • Step 4 of 6',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 4: Review Workflow Tabs',
        description:
            'Use the segmented tabs bar to switch between Cancellation review, Payment ledger, and original Document records.',
        actionTip: 'Navigate between workflow tabs anytime.',
    },
    {
        id: 'review-step-5-content',
        category: 'Cancellation Review • Step 5 of 6',
        targetSpotlight: 'admin_review_tab_content',
        title: 'Step 5: Cancellation Reason & Refund Ledger',
        description:
            'Inspect the hiker’s submitted cancellation reason, slot release status, and calculated refund ledger amount.',
        actionTip: 'Review the reason and refund calculation before taking action.',
    },
    {
        id: 'review-step-6-decision',
        category: 'Cancellation Review • Step 6 of 6',
        targetSpotlight: 'admin_review_decision',
        title: 'Step 6: Cancellation Actions & Payout Proof',
        description:
            'Use the action buttons to Approve or Decline the cancellation request, and upload payout proof receipts when issuing refunds.',
        actionTip: 'Ensure refund proof is attached if a monetary refund is issued.',
    },
];

/**
 * Walkthrough for inspecting reschedule requests and date comparisons.
 */
export const adminBookingReviewRescheduleSteps: TutorialStep[] = [
    {
        id: 'review-step-1-hiker-card',
        category: 'Reschedule Review • Step 1 of 6',
        targetSpotlight: 'admin_review_hiker_card',
        title: 'Step 1: Hiker Profile & Status',
        description:
            'Inspect the hiker’s full name, member since date, booking status badge, age badge, and medical condition declaration flags.',
        actionTip: 'Review hiker details and booking info.',
    },
    {
        id: 'review-step-2-contacts-card',
        category: 'Reschedule Review • Step 2 of 6',
        targetSpotlight: 'admin_review_contacts_card',
        title: 'Step 2: Verification Contacts',
        description:
            'Review personal and emergency contact phone numbers. You can call contacts directly and toggle their 6-month validity verification status.',
        actionTip: 'Verify contact information before approving a date change.',
    },
    {
        id: 'review-step-3-activity-log',
        category: 'Reschedule Review • Step 3 of 6',
        targetSpotlight: 'admin_review_activity_log',
        title: 'Step 3: Activity Log & Audit Trail',
        description:
            'Inspect the chronological activity trail showing reschedule request submission and lifecycle timestamps.',
        actionTip: 'Inspect prior changes and notes.',
    },
    {
        id: 'review-step-4-tabs',
        category: 'Reschedule Review • Step 4 of 6',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 4: Review Workflow Tabs',
        description:
            'Use the segmented tabs bar to switch between Reschedule request details, Payment records, and Documents.',
        actionTip: 'Switch tabs to review full reservation history.',
    },
    {
        id: 'review-step-5-content',
        category: 'Reschedule Review • Step 5 of 6',
        targetSpotlight: 'admin_review_tab_content',
        title: 'Step 5: Hike Comparison & Schedule Details',
        description:
            'Compare the original hike reservation with the requested target hike date, slot availability, and price differences.',
        actionTip: 'Confirm slot availability on the requested hike date before making a decision.',
    },
    {
        id: 'review-step-6-decision',
        category: 'Reschedule Review • Step 6 of 6',
        targetSpotlight: 'admin_review_decision',
        title: 'Step 6: Reschedule Actions',
        description:
            'Use the action buttons below to Approve the date change (transferring the reservation) or Decline with a custom note.',
        actionTip: 'Approve to automatically update the booking date and notify the hiker.',
    },
];

/**
 * Dynamically resolves the tour steps for the Admin ReviewScreen.
 * Selects tab-accurate step definitions, adapts step flow order for Web vs. Mobile layouts,
 * and suppresses Step 6 if no action buttons exist.
 *
 * @param activeTab - Current review tab id ('documents' | 'payment' | 'cancellation' | 'reschedule').
 * @param hasActiveActions - Whether actionable decision buttons currently exist on the screen.
 * @param isWide - Whether the screen is rendered in the wide (2-column) split layout.
 * @returns Array of 5 or 6 TutorialStep objects with dynamically numbered category strings.
 */
export const getAdminBookingReviewSteps = (
    activeTab: string,
    hasActiveActions: boolean,
    isWide: boolean = true
): TutorialStep[] => {
    let baseSteps: TutorialStep[];
    let tabName = 'Booking Review';

    if (activeTab === 'payment') {
        baseSteps = adminBookingReviewPaymentSteps;
        tabName = 'Payment Review';
    } else if (activeTab === 'cancellation') {
        baseSteps = adminBookingReviewCancellationSteps;
        tabName = 'Cancellation Review';
    } else if (activeTab === 'reschedule') {
        baseSteps = adminBookingReviewRescheduleSteps;
        tabName = 'Reschedule Review';
    } else {
        baseSteps = adminBookingReviewDocSteps;
        tabName = 'Booking Review';
    }

    // On mobile single-column layout, ActivityLog renders at the bottom below Tab Content.
    // Reorder steps to follow natural vertical scroll flow: Profile -> Contacts -> Tabs -> Content -> ActivityLog -> Decisions.
    let orderedSteps = baseSteps;
    if (!isWide) {
        const activityStep = baseSteps.find((s) => s.targetSpotlight === 'admin_review_activity_log');
        const decisionStep = baseSteps.find((s) => s.targetSpotlight === 'admin_review_decision');
        const otherSteps = baseSteps.filter(
            (s) => s.targetSpotlight !== 'admin_review_activity_log' && s.targetSpotlight !== 'admin_review_decision'
        );
        orderedSteps = [
            ...otherSteps,
            ...(activityStep ? [activityStep] : []),
            ...(decisionStep ? [decisionStep] : []),
        ];
    }

    // Suppress decision action step if no decision buttons are present on this tab/status
    const filteredSteps = hasActiveActions
        ? orderedSteps
        : orderedSteps.filter((s) => s.targetSpotlight !== 'admin_review_decision');
    const total = filteredSteps.length;

    return filteredSteps.map((step, idx) => ({
        ...step,
        category: `${tabName} • Step ${idx + 1} of ${total}`,
        title: step.title.replace(/^Step \d+:/, `Step ${idx + 1}:`),
    }));
};

export const adminBookingReviewSteps: TutorialStep[] = adminBookingReviewDocSteps;
