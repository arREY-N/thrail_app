/**
 * @file bookingDetailsTour.ts
 * @description Step configuration for the DetailsScreen walkthrough (Contact Info -> Single Document Upload Card).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const bookingDetailsTourSteps: TutorialStep[] = [
    {
        id: 'details-step-1-contact',
        category: 'Details • Contact & Emergency',
        targetSpotlight: 'booking_details_contact',
        title: 'Step 1: Set Up Contact Details',
        description:
            'Tap the button below to configure or edit your mobile phone number and emergency contact person so organizers can coordinate with you.',
        actionTip: 'Tap the highlighted "Set Up Contact Details" button to open the contact setup form.',
    },
    {
        id: 'details-step-2-docs',
        category: 'Details • Requirements',
        targetSpotlight: 'booking_details_docs',
        title: 'Step 2: Upload Required Documents',
        description:
            'Tap the upload button on each requirement to attach your credentials (such as your government-issued ID or medical certificate).',
        actionTip: 'Tap the highlighted upload button to pick and submit your document file.',
    },
    {
        id: 'details-step-3-terms',
        category: 'Details • Legal Agreement',
        targetSpotlight: 'booking_details_terms',
        title: 'Step 3: Review Policies & Sign',
        description:
            'Review our 3 legal agreements (Terms of Service, Privacy Policy, and Booking & Cancellation Policies). Scroll through all 3 to unlock your digital signature.',
        actionTip: 'Tap the blue policy links or the reminder card below to open and review terms.',
    },
];
