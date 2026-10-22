/**
 * @file adminOfferListTour.ts
 * @description Step configuration for the Admin OfferListScreen walkthrough.
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const adminOfferListSteps: TutorialStep[] = [
    {
        id: 'offer-list-create',
        category: 'Manage Offers • Step 1',
        targetSpotlight: 'admin_offer_add_btn',
        title: 'Step 1: Create a New Offer ("+ New")',
        description:
            'Tap the "+ New" button in the top-right header to publish a new guided hike package with custom dates, pricing, slot limits, and required documents.',
        actionTip: 'Tap "+ New" in the top-right corner to create your first offer.',
    },
    {
        id: 'offer-list-filters',
        category: 'Manage Offers • Step 2',
        targetSpotlight: 'admin_offer_filters',
        title: 'Step 2: Search, Filter & Sort Offers',
        description:
            'Use the search bar, filter button, and Upcoming/History tabs to quickly locate specific hike packages and monitor slot capacity.',
        actionTip: 'Type a trail name or switch between Upcoming and History tabs.',
    },
    {
        id: 'offer-list-actions',
        category: 'Manage Offers • Step 3',
        targetSpotlight: 'admin_offer_card',
        title: 'Step 3: Manage Offer & View Bookings',
        description:
            'Each Offer Card displays reserved slots and pending booking alerts. Tap "Edit" to update package details, or tap the card to inspect hikers who booked that schedule.',
        actionTip: 'Tap an Offer Card to open its list of hiker reservations.',
    },
];
