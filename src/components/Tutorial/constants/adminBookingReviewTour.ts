/**
 * @file adminBookingReviewTour.ts
 * @description Unified step configuration for the Admin ReviewScreen walkthrough.
 * Provides a crisp 5-step universal walkthrough covering Hiker Profile, Contact Verification,
 * Workflow Tabs, Active Review Workspace, and Activity Log.
 * Adapts step flow order responsively between Web (2-column) and Mobile (1-column stacked) layouts.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

/**
 * 5-step universal walkthrough for mobile single-column layout:
 * Follows natural vertical reading order from top to bottom:
 * Profile -> Contacts -> Tabs -> Content -> Activity Log
 */
export const adminBookingReviewMobileSteps: TutorialStep[] = [
    {
        id: 'review-step-1-hiker-card',
        category: 'Booking Review • Step 1 of 5',
        targetSpotlight: 'admin_review_hiker_card',
        title: 'Step 1: Hiker Profile & Status',
        description:
            'Inspect the hiker’s profile details, member history, booking status badge, age badge, and medical flags.',
        actionTip: 'Tap "View Full Profile" to inspect medical condition notes and preferences.',
    },
    {
        id: 'review-step-2-contacts-card',
        category: 'Booking Review • Step 2 of 5',
        targetSpotlight: 'admin_review_contacts_card',
        title: 'Step 2: Verification Contacts',
        description:
            'Review personal and emergency contact phone numbers. You can call contacts directly and toggle their 6-month validity status.',
        actionTip: 'Verify contact numbers before taking action on the reservation.',
    },
    {
        id: 'review-step-3-tabs',
        category: 'Booking Review • Step 3 of 5',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 3: Review Workflow Tabs',
        description:
            'Use the segmented tabs bar to switch between Required Documents, Payment Ledger, and dynamic tabs (Cancellation & Reschedule when requested).',
        actionTip: 'Switch tabs to inspect different aspects of this booking.',
    },
    {
        id: 'review-step-4-content',
        category: 'Booking Review • Step 4 of 5',
        targetSpotlight: 'admin_review_tab_content',
        title: 'Step 4: Review Workspace & Actions',
        description:
            'Review submitted files, inspect payment receipts and balances, or handle cancellation and reschedule requests.',
        actionTip: 'Inspect uploaded files or transaction details before taking action.',
    },
    {
        id: 'review-step-5-activity-log',
        category: 'Booking Review • Step 5 of 5',
        targetSpotlight: 'admin_review_activity_log',
        title: 'Step 5: Activity Log & Audit Trail',
        description:
            'Inspect the chronological audit trail showing all booking lifecycle timestamps, submissions, and status transitions.',
        actionTip: 'Check activity history to track previous changes and organizer actions.',
    },
];

/**
 * 5-step walkthrough for web split-column layout:
 * Follows column-aware flow:
 * Left Column (Profile -> Contacts -> Activity Log) -> Right Column (Tabs -> Content Workspace)
 */
export const adminBookingReviewWebSteps: TutorialStep[] = [
    {
        id: 'review-step-1-hiker-card',
        category: 'Booking Review • Step 1 of 5',
        targetSpotlight: 'admin_review_hiker_card',
        title: 'Step 1: Hiker Profile & Status',
        description:
            'Inspect the hiker’s profile details, member history, booking status badge, age badge, and medical flags.',
        actionTip: 'Tap "View Full Profile" to inspect medical condition notes and preferences.',
    },
    {
        id: 'review-step-2-contacts-card',
        category: 'Booking Review • Step 2 of 5',
        targetSpotlight: 'admin_review_contacts_card',
        title: 'Step 2: Verification Contacts',
        description:
            'Review personal and emergency contact phone numbers. You can call contacts directly and toggle their 6-month validity status.',
        actionTip: 'Verify contact numbers before taking action on the reservation.',
    },
    {
        id: 'review-step-3-activity-log',
        category: 'Booking Review • Step 3 of 5',
        targetSpotlight: 'admin_review_activity_log',
        title: 'Step 3: Activity Log & Audit Trail',
        description:
            'Inspect the chronological audit trail showing all booking lifecycle timestamps, submissions, and status transitions.',
        actionTip: 'Check activity history to track previous changes and organizer actions.',
    },
    {
        id: 'review-step-4-tabs',
        category: 'Booking Review • Step 4 of 5',
        targetSpotlight: 'admin_review_tabs',
        title: 'Step 4: Review Workflow Tabs',
        description:
            'Use the segmented tabs bar to switch between Required Documents, Payment Ledger, and dynamic tabs (Cancellation & Reschedule when requested).',
        actionTip: 'Switch tabs to inspect different aspects of this booking.',
    },
    {
        id: 'review-step-5-content',
        category: 'Booking Review • Step 5 of 5',
        targetSpotlight: 'admin_review_tab_content',
        title: 'Step 5: Review Workspace & Actions',
        description:
            'Review submitted files, inspect payment receipts and balances, or handle cancellation and reschedule requests.',
        actionTip: 'Inspect uploaded files or transaction details before taking action.',
    },
];

/**
 * Dynamically resolves the tour steps for the Admin ReviewScreen.
 * Selects responsive step flow order for Web (column-aware) vs. Mobile (vertical stack).
 *
 * @param _activeTab - (Retained for signature compatibility) Current review tab id.
 * @param _hasActiveActions - (Retained for signature compatibility) Whether actionable decision buttons exist.
 * @param isWide - Whether the screen is rendered in the wide (2-column) split layout.
 * @returns Array of 5 TutorialStep objects.
 */
export const getAdminBookingReviewSteps = (
    _activeTab?: string,
    _hasActiveActions?: boolean,
    isWide: boolean = true
): TutorialStep[] => {
    return isWide ? adminBookingReviewWebSteps : adminBookingReviewMobileSteps;
};

export const adminBookingReviewSteps: TutorialStep[] = adminBookingReviewMobileSteps;
export const adminBookingReviewDocSteps: TutorialStep[] = adminBookingReviewMobileSteps;
export const adminBookingReviewPaymentSteps: TutorialStep[] = adminBookingReviewMobileSteps;
