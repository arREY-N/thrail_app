/**
 * @file bookingResubmitMessages.ts
 * @description Centralized message definitions, button labels, and confirmation modal
 * copy for booking resubmission workflows within MyBookings.
 */

import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Generates concise, single-line button titles for the sticky footer
 * during booking rejection and resubmission workflows.
 *
 * @param isSubmitting - Whether resubmission network request is in progress
 * @param canResubmit - Whether all required corrections are ready for submission
 * @param stagedDocs - Count of documents successfully replaced
 * @param totalDocs - Total count of rejected documents
 * @param needsContact - Whether contact details still need to be updated
 * @returns Concise single-line button title
 */
export const getResubmitButtonTitle = (
    isSubmitting: boolean,
    canResubmit: boolean,
    stagedDocs: number,
    totalDocs: number,
    needsContact: boolean
): string => {
    if (isSubmitting) {
        return "Submitting...";
    }

    if (canResubmit) {
        return "Submit for Verification";
    }

    if (needsContact && totalDocs === 0) {
        return "Update Contacts";
    }

    if (needsContact && stagedDocs === totalDocs) {
        return "Update Contacts";
    }

    if (!needsContact && totalDocs > 0) {
        return stagedDocs > 0
            ? `Replace Docs (${stagedDocs}/${totalDocs})`
            : `Replace Docs (0/${totalDocs})`;
    }

    return "Update Details";
};

export interface ResubmitModalContent {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    iconName: string;
    iconLibrary: IconLibrary;
    iconColor: string;
}

/**
 * Returns dynamic title and message for the resubmission ConfirmationModal
 * based on whether documents, contact details, or both are being resubmitted.
 *
 * @param totalRejectedDocs - Total count of rejected documents
 * @param hasContactChanges - Whether contact details were updated
 * @returns Modal title and description
 */
export const getResubmitModalContent = (
    totalRejectedDocs: number,
    hasContactChanges: boolean
): ResubmitModalContent => {
    if (hasContactChanges && totalRejectedDocs > 0) {
        return {
            title: "Resubmit for Verification",
            message: `You are about to resubmit your updated documents (${totalRejectedDocs}) and contact details together for administrative review. Please ensure all details are accurate and valid.`,
            confirmText: "Confirm",
            cancelText: "Cancel",
            iconName: "check-circle",
            iconLibrary: "Feather",
            iconColor: Colors.PRIMARY,
        };
    }

    if (hasContactChanges) {
        return {
            title: "Resubmit for Verification",
            message: "You are about to resubmit your updated contact details for administrative review. Please ensure your phone number and emergency contact are accurate and reachable.",
            confirmText: "Confirm",
            cancelText: "Cancel",
            iconName: "user-check",
            iconLibrary: "Feather",
            iconColor: Colors.PRIMARY,
        };
    }

    return {
        title: "Resubmit Documents",
        message: `You are about to resubmit all ${totalRejectedDocs} updated documents together for administrative review. Please ensure all uploaded documents are clear and valid.`,
        confirmText: "Confirm",
        cancelText: "Cancel",
        iconName: "upload-cloud",
        iconLibrary: "Feather",
        iconColor: Colors.PRIMARY,
    };
};

/**
 * Standard toast messages used during booking resubmission validation and feedback.
 */
export const RESUBMIT_TOASTS = {
    DOC_REPLACE_REQUIRED: "Please replace the rejected document to proceed.",
    DOCS_REPLACE_REQUIRED: (count: number) => `Please update all rejected documents (${count} remaining).`,
    CONTACT_UPDATE_REQUIRED: "Please edit and update your contact details to proceed.",
    BOTH_UPDATE_REQUIRED: "Please update both your rejected documents and contact details to proceed.",
    STAGED_CONTACTS_SUCCESS: "Contact details updated. Tap 'Submit for Verification' to finalize.",
    RESUBMIT_SUCCESS: "All updated details have been resubmitted for verification.",
    RESUBMIT_ERROR: "Failed to resubmit for verification. Please try again.",
} as const;
