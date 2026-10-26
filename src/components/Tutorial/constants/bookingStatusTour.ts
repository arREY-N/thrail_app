/**
 * @file bookingStatusTour.ts
 * @description Step configuration for the StatusScreen walkthrough (Pending Review -> Action Buttons).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const bookingStatusTourSteps: TutorialStep[] = [
    {
        id: 'status-step-1-timeline',
        category: 'Status • Next Steps',
        targetSpotlight: 'booking_status_timeline',
        title: 'Step 1: What Happens Next?',
        description:
            'Your booking is currently in "For Reservation" status. The tour coordinator will review your submitted details and verify your requirements.',
        actionTip: 'You will receive an in-app notification when the organizer confirms your reservation.',
    },
    {
        id: 'status-step-2-summary',
        category: 'Status • Reservation Details',
        targetSpotlight: 'booking_status_summary',
        title: 'Step 2: Review Reservation Summary',
        description:
            'Review your booked mountain destination, organizer contact, scheduled hike date, start time, and registered hiker count.',
        actionTip: 'Your booking pass and payment options unlock as soon as the organizer approves.',
    },
    {
        id: 'status-step-3-actions',
        category: 'Status • Action Buttons',
        targetSpotlight: 'booking_status_primary',
        title: 'Step 3: View Booking & Manage Reservation',
        description:
            'Use the buttons below to view full booking details or return to the trail to explore other mountain adventures.',
        actionTip: 'Tap "View Booking Details" to check status or upload additional requirements anytime.',
    },
];
