import { Colors } from '@/src/constants/colors';
import { Booking, BookingStatus } from '@/src/core/models/Booking/Booking';
import { getResubmitButtonTitle } from '@/src/features/Book/screens/MyBookings/utils/bookingResubmitMessages';

/**
 * Props for configuring the sticky footer buttons on the booking details screen.
 */
export interface GetBookingFooterConfigProps {
    /** The booking instance being viewed. */
    booking: Booking;
    /** The unified status display for the booking. */
    displayStatus: BookingStatus | undefined;
    /** Indicates if the current booking reservation was rejected by the admin. */
    isRejectedReservation: boolean;
    /** The total number of required documents that were rejected. */
    totalRejectedCount: number;
    /** Indicates if the rejection explicitly flagged phone/contact issues. */
    isPhoneRejection: boolean;
    /** Indicates if the user has locally changed their contact information in response to a rejection. */
    hasStagedContactChanges: boolean;
    /** Tracks if the document resubmission process is actively loading/submitting. */
    isSubmittingDocs: boolean;
    /** Indicates if the user has met all criteria to allow a full resubmission (all rejected docs replaced and contacts fixed). */
    canResubmitAll: boolean;
    /** The number of rejected documents the user has currently queued up for replacement. */
    stagedCount: number;
    /** Indicates if contact information is resolved (either not rejected, or updated by the user). */
    contactReady: boolean;
    /** Tracks if the user has tried pressing resubmit without satisfying all requirements. */
    hasAttemptedSubmit: boolean;
    /** Indicates if the booking is fully confirmed (paid, completed, or downpayment). */
    isConfirmed: boolean;
    /** Indicates if the booking has been cancelled by the user or admin. */
    isCancelled: boolean;
    /** Indicates if the booking has historical payment records. */
    hasHistoricalPayments: boolean;
    /** Callback triggered when the user presses the resubmit button. */
    handleResubmitPress: () => void;
    /** Callback triggered to navigate the user to the payment gateway. */
    onProceedToPayment: (booking: Booking) => void;
    /** Callback triggered to view the payment receipt. */
    onViewReceipt: (booking: Booking) => void;
}

/**
 * Derives the configuration for the bottom sticky footer in the BookingDetailsScreen.
 * Handles the logic for rendering the correct buttons based on booking status (e.g., resubmit, pay, view receipt).
 *
 * @param {GetBookingFooterConfigProps} props - The state values and callbacks necessary to resolve the footer buttons.
 * @returns {object | null} The configuration object for the primary and secondary buttons, or null if no footer is needed.
 */
export const getBookingFooterConfig = ({
    booking,
    displayStatus,
    isRejectedReservation,
    totalRejectedCount,
    isPhoneRejection,
    hasStagedContactChanges,
    isSubmittingDocs,
    canResubmitAll,
    stagedCount,
    contactReady,
    hasAttemptedSubmit,
    isConfirmed,
    isCancelled,
    hasHistoricalPayments,
    handleResubmitPress,
    onProceedToPayment,
    onViewReceipt,
}: GetBookingFooterConfigProps) => {
    if (isRejectedReservation && (totalRejectedCount > 0 || isPhoneRejection || hasStagedContactChanges)) {
        const buttonTitle = getResubmitButtonTitle(
            isSubmittingDocs,
            canResubmitAll,
            stagedCount,
            totalRejectedCount,
            isPhoneRejection && !contactReady
        );

        return {
            primaryButton: {
                title: buttonTitle,
                variant: "primary" as const,
                disabled: isSubmittingDocs,
                style: {
                    borderRadius: 12,
                    backgroundColor: canResubmitAll
                        ? Colors.PRIMARY
                        : (hasAttemptedSubmit ? Colors.STATUS_CANCELLED_BG : Colors.GRAY_ULTRALIGHT),
                    borderColor: canResubmitAll
                        ? Colors.PRIMARY
                        : (hasAttemptedSubmit ? Colors.STATUS_CANCELLED_TEXT : Colors.GRAY_LIGHT),
                    borderWidth: 1.5,
                },
                textStyle: {
                    color: canResubmitAll
                        ? Colors.WHITE
                        : (hasAttemptedSubmit ? Colors.STATUS_CANCELLED_TEXT : Colors.TEXT_SECONDARY),
                    fontWeight: 'bold' as const,
                },
                onPress: handleResubmitPress,
            }
        };
    }

    if (displayStatus === 'for-payment' || displayStatus === 'approved-docs') {
        return {
            primaryButton: {
                title: "Complete Payment",
                variant: "primary" as const,
                style: { borderRadius: 12, backgroundColor: Colors.PRIMARY },
                onPress: () => onProceedToPayment(booking)
            }
        };
    }

    if (displayStatus === 'downpayment') {
        return {
            secondaryButton: {
                title: "View Receipt",
                variant: "outline" as const,
                style: { borderColor: Colors.PRIMARY, borderRadius: 12 },
                textStyle: { color: Colors.PRIMARY },
                onPress: () => onViewReceipt(booking)
            },
            primaryButton: {
                title: "Pay Balance",
                variant: "primary" as const,
                style: { borderRadius: 12, backgroundColor: Colors.PRIMARY },
                onPress: () => onProceedToPayment(booking)
            }
        };
    }

    if (isConfirmed || (isCancelled && hasHistoricalPayments)) {
        return {
            primaryButton: {
                title: "View Receipt",
                variant: "primary" as const,
                style: { borderRadius: 12 },
                onPress: () => onViewReceipt(booking)
            }
        };
    }

    return null;
};
