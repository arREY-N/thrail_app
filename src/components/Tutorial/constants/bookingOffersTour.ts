/**
 * @file bookingOffersTour.ts
 * @description Step configuration for the OffersScreen walkthrough (Select Date -> Compare Packages -> Continue Action).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const bookingOffersTourSteps: TutorialStep[] = [
    {
        id: 'book-offers-step-1-calendar',
        category: 'Offers • Select Date',
        targetSpotlight: 'booking_offers_calendar',
        title: 'Step 1: Pick a Hike Date',
        description:
            'Tap "Show Calendar" to view dates with available hike slots marked with green indicator dots. Use the left and right arrows to browse upcoming months.',
        actionTip: 'Tap an available date on the calendar to update the available packages below.',
    },
    {
        id: 'book-offers-step-2-offers',
        category: 'Offers • Guide Packages',
        targetSpotlight: 'booking_offers_card',
        title: 'Step 2: Choose Guide Offer',
        description:
            'Compare available packages for your selected date. Review the organizer name, rating, price per hiker, remaining slot capacity, and hike duration.',
        actionTip: 'Tap an Offer Card to highlight and select it for your booking.',
    },
    {
        id: 'book-offers-step-3-continue',
        category: 'Offers • Continue',
        targetSpotlight: 'booking_offers_footer',
        title: 'Step 3: Continue to Requirements',
        description:
            'Once you choose an offer, tap the "Select an Offer" / "Continue" button at the bottom of the screen to advance to Step 2 for contact info and document uploads.',
        actionTip: 'Tap the green action button at the bottom to continue to hiker requirements.',
    },
];
