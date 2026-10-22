/**
 * @file paymentTour.ts
 * @description Step configuration for the User Payment Wizard walkthrough (Method -> PayMongo -> Receipt).
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const paymentTourSteps: TutorialStep[] = [
    {
        id: 'pay-step-1-options',
        category: 'Payment • Step 1',
        targetSpotlight: 'payment_options',
        title: 'Step 1: Select Payment Option',
        description:
            'Choose whether to pay the Full Amount or a 50% Downpayment (when eligible for your hike date) and review the total amount due.',
        actionTip: 'Tap Full Payment or 50% Downpayment to select how much to settle today.',
    },
    {
        id: 'pay-step-2-wallet',
        category: 'Payment • Step 2',
        targetSpotlight: 'payment_wallet',
        title: 'Step 2: Choose E-Wallet Channel',
        description:
            'Select your preferred digital wallet (GCash or Maya) to process your secure online payment.',
        actionTip: 'Tap GCash or Maya to highlight your preferred payment method.',
    },
    {
        id: 'pay-step-3-terms',
        category: 'Payment • Step 3',
        targetSpotlight: 'payment_terms',
        title: 'Step 3: Review Policies & Sign',
        description:
            'Review the payment and cancellation policies and attach your digital signature to authorize the transaction.',
        actionTip: 'Tap the policy link or signature card to review and sign before paying.',
    },
    {
        id: 'pay-step-4-checkout',
        category: 'Payment • Step 4',
        targetSpotlight: 'booking_footer',
        title: 'Step 4: Proceed to Checkout',
        description:
            'Once your payment option, e-wallet, and signature are ready, tap the Pay button at the bottom to complete authorization in PayMongo.',
        actionTip: 'Tap the green Pay button at the bottom to launch secure checkout.',
    },
];

export const paymentStatusTourSteps: TutorialStep[] = [
    {
        id: 'pay-status-step-1-banner',
        category: 'Receipt • Step 1',
        targetSpotlight: 'payment_status_banner',
        title: 'Step 1: Payment Verification Status',
        description:
            'Check your live payment status here — whether your reservation is Fully Paid, Downpayment Confirmed, or Pending Verification.',
        actionTip: 'Once confirmed, you are automatically added to the hike Group Chat.',
    },
    {
        id: 'pay-status-step-2-receipt',
        category: 'Receipt • Step 2',
        targetSpotlight: 'payment_receipt_card',
        title: 'Step 2: Official Digital Receipt',
        description:
            'Review your transaction reference number, amount paid, payment channel, and any remaining balance due before the hike.',
        actionTip: 'You can revisit this receipt anytime from My Bookings.',
    },
    {
        id: 'pay-status-step-3-actions',
        category: 'Receipt • Step 3',
        targetSpotlight: 'booking_footer',
        title: 'Step 3: Manage or Return to Booking',
        description:
            'Use the bottom action bar to settle a remaining downpayment balance or return to your booking details.',
        actionTip: 'Tap the action button below to continue.',
    },
];
