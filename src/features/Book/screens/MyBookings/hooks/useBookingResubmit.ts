import { useMemo, useState } from 'react';
import { useToast } from '@/src/components/Toast/Toast';
import { Booking, BookingStatus, Requirements } from '@/src/core/models/Booking/Booking';
import { IEmergencyContact } from '@/src/core/models/User/User';
import { logger } from '@/src/core/utility/errorFormatter';
import { RESUBMIT_TOASTS } from '@/src/features/Book/screens/MyBookings/utils/bookingResubmitMessages';

/**
 * Props for configuring the useBookingResubmit hook.
 */
export interface UseBookingResubmitProps {
    /** The booking instance. */
    booking: Booking;
    /** Local state of the booking documents. */
    localDocs: Requirements[];
    /** Local state of the user's phone number. */
    localUserPhone: string;
    /** Local state of the user's emergency contact. */
    localEmergencyContact?: IEmergencyContact;
    /** Callback to execute the document resubmission request to the backend. */
    onResubmitDocuments?: (
        booking: Booking,
        updatedDocs: Requirements[],
        updatedPhone?: string,
        updatedEmergency?: IEmergencyContact
    ) => Promise<boolean>;
    /** State setter for updating the local documents list on success. */
    setLocalDocs: React.Dispatch<React.SetStateAction<Requirements[]>>;
    /** State setter for updating the local booking status on success. */
    setLocalStatus: React.Dispatch<React.SetStateAction<BookingStatus | undefined>>;
    /** State setter to clear contact changes flag on success. */
    setHasStagedContactChanges: React.Dispatch<React.SetStateAction<boolean>>;
    /** Current visual display status of the booking. */
    displayStatus: BookingStatus | undefined;
    /** Indicates if the booking is cancelled. */
    isCancelled: boolean;
    /** Indicates if the user modified their contact info locally. */
    hasStagedContactChanges: boolean;
}

/**
 * Custom hook to handle the complex state and validation of resubmitting rejected booking requirements.
 * Orchestrates document staging, submission requests, validation toasts, and contact update readiness.
 *
 * @param {UseBookingResubmitProps} props - The dependencies and state setters required for resubmission.
 * @returns An object containing staged state, validation flags, modal states, and execution handlers.
 */
export function useBookingResubmit({
    booking,
    localDocs,
    localUserPhone,
    localEmergencyContact,
    onResubmitDocuments,
    setLocalDocs,
    setLocalStatus,
    setHasStagedContactChanges,
    displayStatus,
    isCancelled,
    hasStagedContactChanges,
}: UseBookingResubmitProps) {
    const { showToast } = useToast();

    const [stagedReplacements, setStagedReplacements] = useState<Record<number, string>>({});
    const [isSubmittingDocs, setIsSubmittingDocs] = useState<boolean>(false);
    const [confirmResubmitModalVisible, setConfirmResubmitModalVisible] = useState<boolean>(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

    const [prevBooking, setPrevBooking] = useState(booking);
    if (booking !== prevBooking) {
        setPrevBooking(booking);
        setStagedReplacements({});
        setHasAttemptedSubmit(false);
    }

    const cancellationReason = booking?.cancellationReason;
    const isPhoneRejection = Boolean(cancellationReason && /phone|contact|unreachable/i.test(cancellationReason));
    const isRejectedReservation = !isCancelled && displayStatus === 'reservation-rejected';

    const originalRejectedIndices = useMemo(() => {
        return (booking?.documents || [])
            .map((doc, index) => (doc.valid === 'rejected' ? index : -1))
            .filter((index): index is number => index !== -1);
    }, [booking?.documents]);

    const totalRejectedCount = originalRejectedIndices.length;
    const stagedCount = originalRejectedIndices.filter((idx) => Boolean(stagedReplacements[idx])).length;
    const remainingRejectedCount = totalRejectedCount - stagedCount;

    const docsReady = totalRejectedCount === 0 || remainingRejectedCount === 0;
    const contactReady = !isPhoneRejection || hasStagedContactChanges || localUserPhone !== booking?.user?.phoneNumber;
    const canResubmitAll = isRejectedReservation && (totalRejectedCount > 0 || isPhoneRejection || hasStagedContactChanges) && docsReady && contactReady;

    const handleExecuteResubmit = async () => {
        setConfirmResubmitModalVisible(false);
        setIsSubmittingDocs(true);

        try {
            const updatedDocs: Requirements[] = localDocs.map((doc, idx) => {
                const stagedUrl = stagedReplacements[idx];
                if (stagedUrl) {
                    return {
                        name: doc.name || 'Document',
                        file: stagedUrl,
                        valid: 'pending' as const
                    };
                }
                return doc;
            });

            let success = false;

            if (onResubmitDocuments) {
                success = await onResubmitDocuments(
                    booking,
                    updatedDocs,
                    localUserPhone,
                    localEmergencyContact
                );
            }

            if (success) {
                setLocalDocs(updatedDocs);
                setLocalStatus('for-reservation');
                setStagedReplacements({});
                setHasStagedContactChanges(false);
                showToast.success(RESUBMIT_TOASTS.RESUBMIT_SUCCESS);
            } else {
                showToast.error(RESUBMIT_TOASTS.RESUBMIT_ERROR);
            }
        } catch (err: unknown) {
            logger('BookingDetailsScreen', 'Error in handleExecuteResubmit', err);
            showToast.error(err instanceof Error ? err.message : RESUBMIT_TOASTS.RESUBMIT_ERROR);
        } finally {
            setIsSubmittingDocs(false);
        }
    };

    const handleResubmitPress = () => {
        if (!canResubmitAll) {
            setHasAttemptedSubmit(true);
            let msg: string = RESUBMIT_TOASTS.DOCS_REPLACE_REQUIRED(remainingRejectedCount);
            if (isPhoneRejection && !contactReady && totalRejectedCount > 0 && remainingRejectedCount > 0) {
                msg = RESUBMIT_TOASTS.BOTH_UPDATE_REQUIRED;
            } else if (isPhoneRejection && !contactReady) {
                msg = RESUBMIT_TOASTS.CONTACT_UPDATE_REQUIRED;
            } else if (remainingRejectedCount === 1) {
                msg = RESUBMIT_TOASTS.DOC_REPLACE_REQUIRED;
            }
            showToast.error(msg, {
                onHide: () => setHasAttemptedSubmit(false),
            });
            return;
        }

        setConfirmResubmitModalVisible(true);
    };

    const resetResubmitState = () => {
        setStagedReplacements({});
        setHasAttemptedSubmit(false);
    };

    return {
        stagedReplacements, setStagedReplacements,
        isSubmittingDocs,
        confirmResubmitModalVisible, setConfirmResubmitModalVisible,
        hasAttemptedSubmit, setHasAttemptedSubmit,
        showToast,
        originalRejectedIndices,
        totalRejectedCount,
        stagedCount,
        remainingRejectedCount,
        isPhoneRejection,
        isRejectedReservation,
        contactReady,
        canResubmitAll,
        handleExecuteResubmit,
        handleResubmitPress,
        resetResubmitState,
    };
}
