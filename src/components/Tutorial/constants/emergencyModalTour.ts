/**
 * @file emergencyModalTour.ts
 * @description Dynamic step configurations for EmergencyModal walkthrough.
 * Adapts between unified mode (user phone + emergency contact) and emergency-only mode.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const emergencyModalUnifiedSteps: TutorialStep[] = [
    {
        id: 'emergency-step-1-phone',
        category: 'Emergency • Step 1',
        targetSpotlight: 'emergency_user_phone',
        title: 'Step 1: Your Contact Number',
        description:
            'Confirm or update your primary mobile number. Tour organizers will use this number for safety verification calls and real-time coordination.',
        actionTip: 'Enter your valid 10-digit mobile number starting with 9.',
    },
    {
        id: 'emergency-step-2-search',
        category: 'Emergency • Step 2',
        targetSpotlight: 'emergency_search_account',
        title: 'Step 2: Connect Existing Account (Optional)',
        description:
            'First, search for a registered hiker by their email to automatically connect their verified account and enable automated SOS emergency chats.',
        actionTip: 'Enter a registered hiker email to link their account, or skip to manual entry.',
    },
    {
        id: 'emergency-step-3-manual',
        category: 'Emergency • Step 3',
        targetSpotlight: 'emergency_manual_contact',
        title: 'Step 3: Manual Emergency Contact',
        description:
            'If your contact person has no Thrail account or you cannot find them, manually enter their full name and 10-digit mobile number here for SMS notifications.',
        actionTip: 'Enter their full name and 10-digit mobile number for direct SMS alerts.',
    },
    {
        id: 'emergency-step-4-save',
        category: 'Emergency • Step 4',
        targetSpotlight: 'emergency_save_btn',
        title: 'Step 4: Save & Apply',
        description:
            'Tap Save & Apply below to attach these contact numbers to your booking reservation.',
        actionTip: 'Tap the green Save button at the bottom once all numbers are ready.',
    },
];

export const emergencyModalOnlySteps: TutorialStep[] = [
    {
        id: 'emergency-step-1-search',
        category: 'Emergency • Step 1',
        targetSpotlight: 'emergency_search_account',
        title: 'Step 1: Connect Existing Account (Optional)',
        description:
            'First, search for a registered hiker by their email to link their verified account and enable automated SOS emergency chats.',
        actionTip: 'Enter a registered hiker email to link their account, or skip to manual entry.',
    },
    {
        id: 'emergency-step-2-manual',
        category: 'Emergency • Step 2',
        targetSpotlight: 'emergency_manual_contact',
        title: 'Step 2: Manual Emergency Contact',
        description:
            'If your contact person does not have a Thrail account, enter their full name and mobile phone number manually for emergency SMS alerts.',
        actionTip: 'Enter their full name and 10-digit mobile number for direct SMS alerts.',
    },
    {
        id: 'emergency-step-3-save',
        category: 'Emergency • Step 3',
        targetSpotlight: 'emergency_save_btn',
        title: 'Step 3: Save Contact',
        description:
            'Tap Save below to save your emergency contact details.',
        actionTip: 'Tap the green Save button at the bottom to finalize.',
    },
];
