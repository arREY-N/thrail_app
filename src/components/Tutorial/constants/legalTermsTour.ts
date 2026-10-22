/**
 * @file legalTermsTour.ts
 * @description Step configuration for the LegalTermsModal walkthrough (Review 3 Policies -> Scroll to Acknowledge).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const legalTermsTourSteps: TutorialStep[] = [
    {
        id: 'legal-step-1-tabs',
        category: 'Legal • Mandatory Policies',
        targetSpotlight: 'legal_tabs',
        title: 'Step 1: Review 3 Mandatory Policies',
        description:
            'Tap each tab (Terms & Conditions, Privacy Policy, and Booking Policies) to review all guidelines required for your reservation.',
        actionTip: 'You must inspect all 3 policies before you can sign and reserve.',
    },
    {
        id: 'legal-step-2-scroll',
        category: 'Legal • Read to Agree',
        targetSpotlight: 'legal_scroll_bottom',
        title: 'Step 2: Scroll to Bottom to Acknowledge',
        description:
            'Scroll each policy text to the very bottom to mark it as read (indicated by a green checkmark). Once all 3 tabs are read, this button turns green to acknowledge and agree.',
        actionTip: 'Scroll to the bottom of all 3 tabs to unlock the agreement button.',
    },
];
