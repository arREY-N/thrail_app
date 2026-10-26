/**
 * @file adminOfferWriteTour.ts
 * @description Step configuration for the Admin OfferWriteScreen walkthrough.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const adminOfferWriteSteps: TutorialStep[] = [
    {
        id: 'offer-write-trail-dates',
        category: 'Create Offer • Step 1',
        targetSpotlight: 'admin_write_trail_dates',
        title: 'Step 1: Select Trail & Overview',
        description:
            'Start by selecting which mountain trail this offer is for and enter a clear package description for hikers.',
        actionTip: 'Tap the "Select a trail..." dropdown first, then describe the hike package.',
    },
    {
        id: 'offer-write-pricing-pax',
        category: 'Create Offer • Step 2',
        targetSpotlight: 'admin_write_pricing_pax',
        title: 'Step 2: Price, Pax Capacity & Dates',
        description:
            'Enter the package price per hiker (₱), minimum and maximum pax capacity, and pick the Start Date and End Date.',
        actionTip: 'Fill in Price, Min/Max Pax, and select your Start and End dates.',
    },
    {
        id: 'offer-write-schedule',
        category: 'Create Offer • Step 3',
        targetSpotlight: 'admin_write_schedule',
        title: 'Step 3: Build the Day-by-Day Itinerary',
        description:
            'Tap the Itinerary & Schedule card to open the Schedule Builder and add timed activities for each day of the hike.',
        actionTip: 'Tap the Schedule card to add or edit day-by-day timeline activities.',
    },
    {
        id: 'offer-write-checklists',
        category: 'Create Offer • Step 4',
        targetSpotlight: 'admin_write_checklists',
        title: 'Step 4: Documents, Inclusions & Gear',
        description:
            'Tap preset chips (like "Valid ID", "Medical Certificate", "Guide Fee") or add custom items to define what documents hikers must upload and what gear to bring.',
        actionTip: 'Select required documents, inclusions, and things to bring.',
    },
    {
        id: 'offer-write-save',
        category: 'Create Offer • Step 5',
        targetSpotlight: 'booking_footer',
        title: 'Step 5: Save & Publish Offer',
        description:
            'Once all required fields are complete, tap "Save Offer" at the bottom to publish your hike package.',
        actionTip: 'Tap "Save Offer" to publish this schedule for hikers.',
    },
];

export const adminOfferWriteStep2Steps: TutorialStep[] = adminOfferWriteSteps;
