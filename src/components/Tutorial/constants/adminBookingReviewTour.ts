/**
 * @file adminBookingReviewTour.ts
 * @description Step configuration for the Admin ReviewScreen walkthrough.
 * Provides tab-aware tour step configurations for both the Documents and Payment tabs.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * 4-step walkthrough for reviewing submitted hiker documents and verification.
 */
export const adminBookingReviewDocSteps: TutorialStep[] = [
    {
        id: 'review-step-1-profile',
        category: 'Booking Review • Step 1',
        targetSpotlight: 'admin_review_profile',
        title: 'Step 1: Verify Hiker & Emergency Numbers',
        description:
            'At the top, inspect the Hiker Profile Card, medical condition declarations, and emergency contact details. You can call the numbers directly and mark both phone numbers as Verified.',
        actionTip: 'Tap the call or verify buttons on the Hiker Profile Card to confirm active contact numbers.',
    },
    {
        id: 'review-step-2-tabs',
        category: 'Booking Review • Step 2',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 2: Switch Between Documents & Payment',
        description:
            'Use these tabs to switch between reviewing Required Documents and inspecting the Payment Ledger (PayMongo references, paid amounts, and refund requests).',
        actionTip: 'Toggle between Required Documents and Payment Ledger as needed.',
    },
    {
        id: 'review-step-3-content',
        category: 'Booking Review • Step 3',
        targetSpotlight: 'admin_review_content',
        title: 'Step 3: Inspect & Approve Submitted Files',
        description:
            'Tap any uploaded document (Valid ID, Medical Certificate) to preview it full-screen, then mark each document as "Approve" or "Reject" with feedback.',
        actionTip: 'Every required document must be reviewed before approving the reservation.',
    },
    {
        id: 'review-step-4-decision',
        category: 'Booking Review • Step 4',
        targetSpotlight: 'booking_footer',
        title: 'Step 4: Approve, Reject, or Manage',
        description:
            'Once all documents and phone verifications are checked, use the action buttons below the documents list to "Approve" the reservation (unlocking payment for the hiker) or "Reject" with a reason.',
        actionTip: 'Tap "Approve Booking" once all requirements pass.',
    },
];

/**
 * 4-step walkthrough for inspecting the payment ledger and completing the booking.
 */
export const adminBookingReviewPaymentSteps: TutorialStep[] = [
    {
        id: 'review-step-1-profile',
        category: 'Booking Review • Step 1',
        targetSpotlight: 'admin_review_profile',
        title: 'Step 1: Inspect Hiker Details & Status',
        description:
            'Inspect the Hiker Profile Card, contact information, and current booking workflow status at a glance.',
        actionTip: 'Check the hiker information and current status badge.',
    },
    {
        id: 'review-step-2-tabs',
        category: 'Booking Review • Step 2',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 2: Switch Between Documents & Payment',
        description:
            'Use these tabs to switch between reviewing Required Documents and inspecting the Payment Ledger (PayMongo references, paid amounts, and refund requests).',
        actionTip: 'Toggle between Required Documents and Payment Ledger as needed.',
    },
    {
        id: 'review-step-3-content',
        category: 'Booking Review • Step 3',
        targetSpotlight: 'admin_review_content',
        title: 'Step 3: Inspect Payment Ledger & Transactions',
        description:
            'Review the hike price breakdown, percentage collected, PayMongo reference codes, payment channels, and settlement policies.',
        actionTip: 'Verify captured amounts and transaction references.',
    },
    {
        id: 'review-step-4-decision',
        category: 'Booking Review • Step 4',
        targetSpotlight: 'booking_footer',
        title: 'Step 4: Finalize & Complete Booking',
        description:
            'Once payments are verified, use the bottom sticky footer to click "Complete Booking" to finalize the reservation lifecycle.',
        actionTip: 'Tap "Complete Booking" in the bottom bar to finalize.',
    },
];

export const adminBookingReviewSteps: TutorialStep[] = adminBookingReviewDocSteps;
