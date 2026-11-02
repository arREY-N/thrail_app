/**
 * @file paymentTour.ts
 * @description Step configuration for the User Payment Wizard walkthroughs:
 * - First-Time Manual QR Method (5 steps)
 * - Resubmission Flow for Rejected Receipts (6 steps)
 * - Payment Status & Receipt Verification (4 steps)
 */

import { TutorialStep } from '@/src/components/Tutorial/interfaces/Tutorial.types';

export const paymentTourSteps: TutorialStep[] = [
    {
        id: 'pay-step-1-qr',
        category: 'Method • Step 1',
        targetSpotlight: 'payment_qr_card',
        title: "Step 1: Scan Organizer's QR Code",
        description:
            'Scan the master QR code using your e-wallet (GCash, Maya) or banking app to transfer the exact booking fee, or tap "Save QR to Gallery" to pay later.',
        actionTip: 'Tap the QR code to enlarge it, or tap "Save QR to Gallery" to open it in your payment app.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-step-2-instructions',
        category: 'Method • Step 2',
        targetSpotlight: 'payment_instructions',
        title: 'Step 2: Follow Payment Instructions',
        description:
            'Follow the 4 numbered steps: save/scan QR, transfer the exact amount, take a screenshot of your transfer receipt, and upload it below.',
        actionTip: 'Ensure your receipt screenshot clearly displays the Reference Number and transferred amount.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-step-3-receipt',
        category: 'Method • Step 3',
        targetSpotlight: 'payment_receipt_upload',
        title: 'Step 3: Upload Proof of Payment',
        description:
            'Tap the upload button below to attach your payment receipt screenshot so the tour coordinator can verify your transaction and confirm your slot.',
        actionTip: 'Tap "Upload" to pick your payment receipt screenshot from your photo library or files.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-step-4-terms',
        category: 'Method • Step 4',
        targetSpotlight: 'payment_terms',
        title: 'Step 4: Review Terms & Sign',
        description:
            'Review the Thrail Terms of Service, Privacy Policy, and Booking & Cancellation Policies, then type your full name to provide your digital signature.',
        actionTip: 'Type your name exactly as registered to unlock the submit button.',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
    {
        id: 'pay-step-5-submit',
        category: 'Method • Step 5',
        targetSpotlight: 'booking_footer',
        title: 'Step 5: Submit for Verification',
        description:
            'Once your receipt is attached and your signature matches, tap "Submit Payment" to send it to the organizer for verification.',
        actionTip: 'Tap the green button below to submit your payment proof.',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
];

export const paymentResubmitTourSteps: TutorialStep[] = [
    {
        id: 'pay-resubmit-step-1-banner',
        category: 'Resubmission • Step 1',
        targetSpotlight: 'payment_rejection_banner',
        title: 'Step 1: Review Organizer Feedback',
        description:
            'Your previous payment receipt was not accepted. Carefully review the organizer feedback reason above to understand what needs correction.',
        actionTip: 'Ensure your replacement receipt directly resolves the feedback issue before resubmitting.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-resubmit-step-2-qr',
        category: 'Resubmission • Step 2',
        targetSpotlight: 'payment_qr_card',
        title: "Step 2: Verify Organizer's QR Code",
        description:
            'Double-check the organizer QR code, recipient account details, and amount due to ensure your transfer is sent to the correct designated account.',
        actionTip: 'Tap the QR code to enlarge it, or tap "Save QR to Gallery" to open it in your payment app.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-resubmit-step-3-instructions',
        category: 'Resubmission • Step 3',
        targetSpotlight: 'payment_instructions',
        title: 'Step 3: Review Payment Instructions',
        description:
            'Follow the 4 numbered steps: save or scan the QR code, transfer the exact booking fee, and capture a clear screenshot with the Reference Number visible.',
        actionTip: 'Receipts must clearly display the transfer amount, date/time, and transaction reference number.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-resubmit-step-4-receipt',
        category: 'Resubmission • Step 4',
        targetSpotlight: 'payment_receipt_upload',
        title: 'Step 4: Re-upload Valid Receipt',
        description:
            'Tap the red "Re-upload" button below to attach your new, clear payment receipt screenshot for organizer verification.',
        actionTip: 'Tap the highlighted "Re-upload" button to pick your replacement receipt screenshot.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-resubmit-step-5-terms',
        category: 'Resubmission • Step 5',
        targetSpotlight: 'payment_terms',
        title: 'Step 5: Confirm Digital Signature',
        description:
            'Review the Thrail policies and re-verify your full name in the signature field before submitting your corrected payment.',
        actionTip: 'Type your name exactly as registered to authorize your resubmission.',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
    {
        id: 'pay-resubmit-step-6-submit',
        category: 'Resubmission • Step 6',
        targetSpotlight: 'booking_footer',
        title: 'Step 6: Resubmit Payment',
        description:
            'Once your replacement receipt is uploaded and your signature matches, tap "Resubmit Payment" to send it to the organizer for re-verification.',
        actionTip: 'Tap the button below to resubmit your payment.',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
];

export const paymentStatusTourSteps: TutorialStep[] = [
    {
        id: 'pay-status-step-1-banner',
        category: 'Status • Step 1',
        targetSpotlight: 'payment_status_banner',
        title: 'Step 1: Receipt Submitted Successfully',
        description:
            'Your payment receipt has been securely delivered to the tour organizer. Your booking is now in "Pending Verification" status.',
        actionTip: 'The organizer has been notified to cross-check your submitted receipt.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-status-step-2-timeline',
        category: 'Status • Step 2',
        targetSpotlight: 'payment_status_timeline',
        title: 'Step 2: What Happens Next?',
        description:
            'Track your verification progress along the 3 milestones: Receipt Uploaded, Organizer Verification, and Booking Confirmed.',
        actionTip: 'Once verified, you will receive an in-app notification and be invited to the hike group chat.',
        spotlightShape: 'rect',
        tooltipPlacement: 'bottom',
    },
    {
        id: 'pay-status-step-3-summary',
        category: 'Status • Step 3',
        targetSpotlight: 'payment_receipt_card',
        title: 'Step 3: Transaction Summary',
        description:
            'Review your payment method, amount submitted, booking reference, and the timestamp of your submission for audit records.',
        actionTip: 'You can revisit these details anytime from My Bookings.',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
    {
        id: 'pay-status-step-4-actions',
        category: 'Status • Step 4',
        targetSpotlight: 'booking_footer',
        title: 'Step 4: Return to Bookings',
        description:
            'Tap "Return to Bookings" below to return to your booking list and track the status of your reservation.',
        actionTip: 'Tap the green button below to continue.',
        spotlightShape: 'rect',
        tooltipPlacement: 'top',
    },
];
