/**
 * @file index.ts
 * @description Central registry combining all modular User and Admin tutorial tours
 * and appending the shared Final '?' Header Replay Spotlight step to relevant tours.
 */

import {
    TutorialStep,
    TutorialTourConfig,
    TutorialTourId,
} from '@/src/components/Tutorial/interfaces/Tutorial.types';
import {
    adminBookingReviewDocSteps,
    adminBookingReviewPaymentSteps,
    adminBookingReviewSteps,
} from '@/src/components/Tutorial/constants/adminBookingReviewTour';
import { adminDashboardSteps } from '@/src/components/Tutorial/constants/adminDashboardTour';
import { adminOfferListSteps } from '@/src/components/Tutorial/constants/adminOfferListTour';
import { adminOfferViewSteps } from '@/src/components/Tutorial/constants/adminOfferViewTour';
import {
    adminOfferWriteStep2Steps,
    adminOfferWriteSteps,
} from '@/src/components/Tutorial/constants/adminOfferWriteTour';
import { bookingDetailsTourSteps } from '@/src/components/Tutorial/constants/bookingDetailsTour';
import { bookingOffersTourSteps } from '@/src/components/Tutorial/constants/bookingOffersTour';
import { bookingStatusTourSteps } from '@/src/components/Tutorial/constants/bookingStatusTour';
import {
    emergencyModalOnlySteps,
    emergencyModalUnifiedSteps,
} from '@/src/components/Tutorial/constants/emergencyModalTour';
import { legalTermsTourSteps } from '@/src/components/Tutorial/constants/legalTermsTour';
import { myBookingDetailsTourSteps } from '@/src/components/Tutorial/constants/myBookingDetailsTour';
import {
    paymentStatusTourSteps,
    paymentTourSteps,
} from '@/src/components/Tutorial/constants/paymentTour';
import { tabsTourSteps } from '@/src/components/Tutorial/constants/tabsTour';

export {
    adminBookingReviewDocSteps,
    adminBookingReviewPaymentSteps,
    emergencyModalOnlySteps,
    emergencyModalUnifiedSteps,
};

/**
 * Builds the final step of every tutorial that spotlights the top-right '?' Replay button in CustomHeader.
 *
 * @param screenLabel - Human-readable name of the current screen or workflow
 * @returns {TutorialStep} Configured final spotlight step pointing to the '?' button
 */
export const createReplayHelpStep = (screenLabel: string): TutorialStep => ({
    id: 'final-replay-help-spotlight',
    title: 'Need a Refresher Later? Tap "?" Anytime!',
    description: `We have placed a "?" (Help) button in the top-right corner of the ${screenLabel} header. Whenever you want to replay this step-by-step guide again, just tap that "?" icon!`,
    actionTip: 'Look at the highlighted "?" icon in the top-right corner — tap "Got It, Finish!" below to start using the screen.',
    category: 'Replay Guide',
    targetSpotlight: 'header_help',
    spotlightShape: 'circle',
    tooltipPlacement: 'top',
    highlightHeaderHelp: true,
    callout: {
        badgeText: 'Top-Right Header • Replay Guide Button',
        targetLabel: '?  Replay Screen Guide Anytime',
        targetIcon: 'help-circle',
        targetIconLibrary: 'Feather',
        targetVariant: 'replay_help_badge',
        helperChips: ['Top-Right Header Icon', 'On-Demand Refresher', 'Always Accessible'],
    },
});

export const TUTORIAL_TOURS: Record<TutorialTourId, TutorialTourConfig> = {
    tabs: {
        tourId: 'tabs',
        tourTitle: 'Welcome to Thrail — App Tour',
        roleScope: 'user',
        steps: [...tabsTourSteps],
    },
    booking_offers: {
        tourId: 'booking_offers',
        tourTitle: 'Booking • Choose Hike Offer',
        roleScope: 'user',
        steps: [...bookingOffersTourSteps],
    },
    booking: {
        tourId: 'booking',
        tourTitle: 'Booking • Choose Hike Offer',
        roleScope: 'user',
        steps: [...bookingOffersTourSteps],
    },
    booking_details: {
        tourId: 'booking_details',
        tourTitle: 'Booking Requirements & Details',
        roleScope: 'user',
        steps: [...bookingDetailsTourSteps],
    },
    booking_status: {
        tourId: 'booking_status',
        tourTitle: 'Booking Status & Confirmation',
        roleScope: 'user',
        steps: [...bookingStatusTourSteps],
    },
    my_booking_details: {
        tourId: 'my_booking_details',
        tourTitle: 'Tracking Your Booking & Review Status',
        roleScope: 'user',
        steps: [...myBookingDetailsTourSteps],
    },
    legal_terms: {
        tourId: 'legal_terms',
        tourTitle: 'Legal Policies & Acknowledgment',
        roleScope: 'user',
        steps: [...legalTermsTourSteps],
    },
    emergency_modal: {
        tourId: 'emergency_modal',
        tourTitle: 'Emergency Contact Setup',
        roleScope: 'user',
        steps: [...emergencyModalUnifiedSteps],
    },
    payment: {
        tourId: 'payment',
        tourTitle: 'Completing Your Hike Payment',
        roleScope: 'user',
        steps: [...paymentTourSteps],
    },
    payment_status: {
        tourId: 'payment_status',
        tourTitle: 'Payment Verification & Receipt',
        roleScope: 'user',
        steps: [...paymentStatusTourSteps],
    },
    admin_dashboard: {
        tourId: 'admin_dashboard',
        tourTitle: 'Admin Dashboard — Quick Guide',
        roleScope: 'admin',
        steps: [...adminDashboardSteps],
    },
    admin_offer_list: {
        tourId: 'admin_offer_list',
        tourTitle: 'Managing Your Hike Offers',
        roleScope: 'admin',
        steps: [...adminOfferListSteps],
    },
    admin_offer_write: {
        tourId: 'admin_offer_write',
        tourTitle: 'How to Create or Edit an Offer',
        roleScope: 'admin',
        steps: [...adminOfferWriteSteps],
    },
    admin_offer_write_step2: {
        tourId: 'admin_offer_write_step2',
        tourTitle: 'Offer Pricing & Hiker Requirements',
        roleScope: 'admin',
        steps: [...adminOfferWriteStep2Steps],
    },
    admin_offer_view: {
        tourId: 'admin_offer_view',
        tourTitle: 'Viewing Offer Bookings',
        roleScope: 'admin',
        steps: [...adminOfferViewSteps],
    },
    admin_booking_review: {
        tourId: 'admin_booking_review',
        tourTitle: 'How to Review & Approve a Booking',
        roleScope: 'admin',
        steps: [...adminBookingReviewSteps],
    },
};
