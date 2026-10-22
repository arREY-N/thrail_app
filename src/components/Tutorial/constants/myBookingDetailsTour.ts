/**
 * @file myBookingDetailsTour.ts
 * @description Step configuration for the MyBookings BookingDetailsScreen walkthrough (Under Review -> Documents -> Payment Summary).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const myBookingDetailsTourSteps: TutorialStep[] = [
    {
        id: 'my-booking-details-step-1-quick-info',
        category: 'Booking Details • Hike Info',
        targetSpotlight: 'my_booking_quick_info',
        title: 'Step 1: Hike Logistics Overview',
        description:
            'Quickly verify your scheduled hike date, total duration, and assigned tour organizer at the top of your booking pass.',
        actionTip: 'Keep an eye on your scheduled date and tour guide assignment here.',
    },
    {
        id: 'my-booking-details-step-2-status-tracker',
        category: 'Booking Details • Under Review',
        targetSpotlight: 'my_booking_status_tracker',
        title: 'Step 2: Live 4-Step Status Tracker',
        description:
            'Track your reservation from Under Review (1–2 business days for organizer verification) to Payment, Verifying, and Completed.',
        actionTip: 'You will receive a notification as soon as your documents are approved for payment.',
    },
    {
        id: 'my-booking-details-step-3-documents',
        category: 'Booking Details • Requirements',
        targetSpotlight: 'my_booking_documents',
        title: 'Step 3: Submitted Documents & Badges',
        description:
            'Preview your uploaded Medical Certificate and Valid ID, monitor Pending Review or Approved badges, and re-upload files if the organizer requests a replacement.',
        actionTip: 'Tap "View" to inspect any uploaded document or replace rejected items directly.',
    },
    {
        id: 'my-booking-details-step-4-accordions',
        category: 'Booking Details • Preparation',
        targetSpotlight: 'my_booking_accordions',
        title: 'Step 4: Hiker Info & Trail Checklists',
        description:
            'Expand Personal Information, Inclusions, Things to Bring, Itinerary, and Important Reminders to prepare for your upcoming climb.',
        actionTip: 'Tap any section header to expand or collapse its details.',
    },
    {
        id: 'my-booking-details-step-5-payment-summary',
        category: 'Booking Details • Payment & Actions',
        targetSpotlight: 'my_booking_payment_summary',
        title: 'Step 5: Payment Summary & Checkout',
        description:
            'Review your total package amount, deposit paid, and remaining balance. Once cleared by the organizer, a "Proceed to Payment" button unlocks at the bottom—and you can manage or cancel anytime via the top-right (⋮) menu.',
        actionTip: 'Wait for organizer approval to unlock payment, or use the top-right (⋮) menu for booking options.',
    },
];
