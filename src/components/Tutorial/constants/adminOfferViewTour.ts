/**
 * @file adminOfferViewTour.ts
 * @description Step configuration for the Admin OfferViewScreen walkthrough.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const adminOfferViewSteps: TutorialStep[] = [
    {
        id: 'offer-view-summary',
        category: 'Offer Bookings • Step 1',
        targetSpotlight: 'admin_view_summary',
        title: 'Step 1: Offer Summary & Live Slot Counter',
        description:
            'The top summary card shows the trail name, scheduled date, package price, and how many slots are currently filled out of your maximum capacity.',
        actionTip: 'Check the slot counter or use Edit, Reschedule, or Cancel actions on this card.',
    },
    {
        id: 'offer-view-filters',
        category: 'Offer Bookings • Step 2',
        targetSpotlight: 'admin_view_filters',
        title: 'Step 2: Filter & Sort Bookings',
        description:
            'Use the horizontal filter tabs and sort button to switch between "All", "For Reservation" (needs your document review), "For Payment", "Paid", or "Cancelled" bookings.',
        actionTip: 'Tap "For Reservation" to prioritize new hikers waiting for your approval.',
    },
    {
        id: 'offer-view-card-click',
        category: 'Offer Bookings • Step 3',
        targetSpotlight: 'admin_view_booking_card',
        title: 'Step 3: Open a Hiker Booking to Review',
        description:
            'Each booking card shows the hiker’s name, submission date, document review status, and payment badge. Tap any hiker card to open the full Review Screen.',
        actionTip: 'Tap a Hiker Booking Card to inspect their uploaded documents and approve or reject.',
    },
];
