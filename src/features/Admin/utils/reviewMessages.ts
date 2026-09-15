/**
 * @file reviewMessages.ts
 * @description Centralized messages, copy, toast notifications, confirmation modal strings,
 * rejection reason taxonomies, and verification warning helpers for the Admin Review flow.
 */

import { Colors } from '@/src/constants/colors';
import { VerificationStatus } from '@/src/core/flows/PhoneVerificationFlow';

/**
 * Visual configuration and tokens for rendering verification badges and buttons.
 */
export interface VerificationBadgeConfig {
    label: string;
    subtext: string | null;
    iconName: 'check-circle' | 'alert-octagon' | 'circle';
    iconColor: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
}

/**
 * Priority rejection reasons relating to uploaded hiker documents.
 */
export const DOCUMENT_REJECTION_REASONS: readonly string[] = [
    "Blurry / Unreadable Image",
    "Document Expired",
    "Wrong File Uploaded",
] as const;

/**
 * Priority rejection reasons relating to phone and contact verification issues.
 */
export const PHONE_REJECTION_REASONS: readonly string[] = [
    "Unreachable Phone Number",
    "Invalid Phone Number",
    "Unreachable Emergency Contact",
    "Emergency Contact Unverified",
] as const;

/**
 * Secondary rejection reasons relating to capacity and operational scheduling.
 */
export const OPERATIONAL_REASONS: readonly string[] = [
    "Trail Slot Capacity Filled",
    "Schedule Conflict",
] as const;

/**
 * Formulates dynamic rejection reason suggestions based on review context (Table 2).
 *
 * @param docCount - Number of documents configured for the booking.
 * @param hasRejections - Whether any document has been marked as rejected.
 * @returns Array of prioritized rejection reason suggestions.
 */
export function getDynamicRejectionSuggestions(
    docCount: number,
    hasRejections: boolean
): string[] {
    if (docCount === 0) {
        // Context C: Zero documents required -> phone & operational reasons
        return [...PHONE_REJECTION_REASONS, ...OPERATIONAL_REASONS];
    }

    if (hasRejections) {
        // Context A: Document issue identified -> document reasons prioritized
        return [...DOCUMENT_REJECTION_REASONS, ...PHONE_REJECTION_REASONS];
    }

    // Context B & D: Phone issue or manual booking rejection -> phone reasons prioritized
    return [...PHONE_REJECTION_REASONS, ...DOCUMENT_REJECTION_REASONS];
}

/**
 * Standard toast notification messages for the Admin Review workflow.
 */
export const REVIEW_TOASTS = {
    REASON_REQUIRED: "Please select or enter a rejection reason.",
    DOCS_INCOMPLETE: (pendingCount: number): string => 
        `Please approve or reject all required documents (${pendingCount} remaining).`,
    ATTACHMENT_REQUIRED: "Please open the attachment before recording a decision.",
} as const;

/**
 * Standard confirmation modal strings for the Admin Review workflow.
 */
export const REVIEW_MODALS = {
    APPROVE: {
        title: "Approve Reservation",
        message: "Documents and phone verifications are cleared. Approve this booking to proceed to payment?",
        confirmText: "Approve",
        cancelText: "Cancel",
    },
    SAFETY_OVERRIDE: {
        title: "Safety Override Warning",
        confirmText: "Approve Anyway",
        cancelText: "Back to Review",
    },
    REJECT: {
        title: "Reject Reservation",
        message: "Reject this booking and request corrections from the hiker? They will be notified with your rejection reason.",
        confirmText: "Reject",
        cancelText: "Cancel",
    },
    CONFIRM_PAYMENT: {
        title: "Complete Booking",
        message: "Are you sure you want to mark this transaction as verified and complete?",
        confirmText: "Confirm",
        cancelText: "Cancel",
    },
    CANCEL_UNPAID: {
        title: "Cancel Booking?",
        message: "Are you sure you want to cancel this unpaid booking? This will clear the slot.",
        confirmText: "Yes, Cancel",
        cancelText: "Keep Booking",
    },
} as const;

/**
 * Generates dynamic safety override messages for ConfirmationModal in Admin review.
 * Adapts to all combinations of personal and emergency contact verification states.
 *
 * @param personalStatus - Status of the hiker's personal phone number.
 * @param emergencyStatus - Status of the emergency contact's phone number.
 * @returns Human-readable safety override message for the confirmation dialog.
 */
export function getVerificationWarningMessage(
    personalStatus: VerificationStatus,
    emergencyStatus: VerificationStatus
): string {
    const isPersonalUnverified = personalStatus === 'unverified';
    const isEmergencyUnverified = emergencyStatus === 'unverified';
    const isPersonalExpired = personalStatus === 'expired';
    const isEmergencyExpired = emergencyStatus === 'expired';

    if (isPersonalUnverified && isEmergencyUnverified) {
        return "Both the hiker's phone number and the emergency contact remain unverified. Do you wish to approve and proceed to payment anyway? You may re-attempt verification before hike departure.";
    }

    if (isPersonalExpired && isEmergencyExpired) {
        return "Both the hiker's phone number and emergency contact verifications have expired (> 6 months). Do you wish to approve and proceed to payment anyway?";
    }

    if (isPersonalUnverified && isEmergencyExpired) {
        return "The hiker's phone number is unverified and the emergency contact verification has expired. Do you wish to approve and proceed to payment anyway?";
    }

    if (isPersonalExpired && isEmergencyUnverified) {
        return "The hiker's phone number verification has expired and the emergency contact is unverified. Do you wish to approve and proceed to payment anyway?";
    }

    if (isPersonalUnverified) {
        return "The hiker's phone number is unverified, but the emergency contact is verified. Do you wish to approve and proceed to payment anyway?";
    }

    if (isEmergencyUnverified) {
        return "The emergency contact is unverified, but the hiker's personal phone number is verified. Do you wish to approve and proceed to payment anyway?";
    }

    if (isPersonalExpired) {
        return "The hiker's phone number verification has expired (> 6 months), but the emergency contact is verified. Do you wish to approve and proceed to payment anyway?";
    }

    if (isEmergencyExpired) {
        return "The emergency contact verification has expired (> 6 months), but the hiker's phone number is verified. Do you wish to approve and proceed to payment anyway?";
    }

    return "One or more contact numbers require verification. Do you wish to approve and proceed anyway?";
}

/**
 * Resolves badge label, subtext, icons, and styling tokens for a given verification status.
 *
 * @param status - The verification status ('verified' | 'expired' | 'unverified').
 * @param remainingMonths - Number of validity months remaining for verified numbers.
 * @param expiryText - Optional pre-formatted expiry date string.
 * @returns Complete visual configuration object for the badge and subtext.
 */
export function getVerificationBadgeConfig(
    status: VerificationStatus,
    remainingMonths: number = 0,
    expiryText?: string | null
): VerificationBadgeConfig {
    if (status === 'verified') {
        const durationText = expiryText || (remainingMonths > 0
            ? `Valid for ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`
            : 'Verified');

        return {
            label: 'Verified',
            subtext: durationText,
            iconName: 'check-circle',
            iconColor: Colors.PRIMARY,
            backgroundColor: Colors.STATUS_APPROVED_BG,
            borderColor: Colors.PRIMARY,
            textColor: Colors.PRIMARY,
        };
    }

    if (status === 'expired') {
        return {
            label: 'Expired',
            subtext: 'Expired (> 6 mos)',
            iconName: 'alert-octagon',
            iconColor: Colors.VERIFICATION_EXPIRED_TEXT,
            backgroundColor: Colors.VERIFICATION_EXPIRED_BG,
            borderColor: Colors.VERIFICATION_EXPIRED_BORDER,
            textColor: Colors.VERIFICATION_EXPIRED_TEXT,
        };
    }

    // Default: 'unverified'
    return {
        label: 'Verify',
        subtext: null,
        iconName: 'circle',
        iconColor: Colors.TEXT_SECONDARY,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
        textColor: Colors.TEXT_SECONDARY,
    };
}
