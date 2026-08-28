import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Booking, Requirements } from "@/src/core/models/Booking/interfaces/Booking.types";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { BookingLogic } from "@/src/core/models/Booking/utils/Booking.logic";
import { newBooking } from "@/src/core/models/Booking/utils/BookingFactory";
import { Offer } from "@/src/core/models/Offer/Offer";
import { useAuthHook } from "@/src/core/models/User/User";
import { catchError, logger, refactorCatcher } from "@/src/core/utility/errorFormatter";
import { useState } from "react";
import { Alert } from "react-native";

export function useBookingAdmin() {
    const [localError, setLocalError] = useState<string>();
    const { profile, role } = useAuthHook();
    const create = useBookingsStore(s => s.create);
    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);

    const { onBackPress } = useAppNavigation();

    const onApproveBooking = async (
        validatedDocuments: Requirements[],
        personalVerifiedAt?: Date | null,
        emergencyVerifiedAt?: Date | null,
        booking?: Booking,
    ) => {
        try {
            if (!booking) {

                refactorCatcher(`Refactored function signature. \n\nInclude booking as the parameter to onApproveBooking(). This function will not throw an error but it will not let the approval process continue until this change is handled.`);
                return;

                // TODO clean up (by REYN) once UI is refactored
                // throw new Error('Missing booking information');
            }

            const approvedBook = newBooking({
                ...booking,
                user: {
                    ...booking.user,
                    phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : booking.user.phoneVerifiedAt,
                },
                emergencyContact: booking.emergencyContact ? {
                    ...booking.emergencyContact,
                    phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : booking.emergencyContact.phoneVerifiedAt,
                } : {
                    name: "",
                    contactNumber: "",
                },
                documents: validatedDocuments,
                status: 'for-payment',
            });

            if (!BookingLogic.checkDocuments(approvedBook)) {
                throw new Error('Cannot approve booking with pending documents. Please validate all documents first.');
            }

            const success = await create(approvedBook, true);

            if (!success) {
                throw new Error('Failed to approve booking');
            }

            // Sync the hiker's profile and emergency contact profile if they exist
            // WRONG USE CASE
            // 
            // Sync upon submission of reservation not in approval
            // Admins do not have permissions to edit users' profiles.

            onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onApproveBooking()');
            setLocalError((error as Error).message || 'Failed to approve booking');
        }
    }

    const onConfirmPayment = async (booking?: Booking,) => {
        try {
            if (!booking) {

                refactorCatcher(`Refactored function signature. \n\nInclude booking as the parameter to onApproveBooking(). This function will not throw an error but it will not let the approval process continue until this change is handled.`);
                return;

                // TODO clean up (by REYN) once UI is refactored
                // throw new Error('Missing booking information');
            }

            if (booking.status !== 'paid' && booking.status !== 'downpayment') {
                throw new Error('Booking is not ready to be confirmed');
            }

            const completedBook = newBooking({
                ...booking,
                status: 'completed'
            });

            const success = await create(completedBook, true);
            if (!success) {
                throw new Error('Failed to finalize booking to completed status.');
            }

            onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onConfirmPayment()');
            setLocalError((error as Error).message || 'Failed to confirm payment');
        }
    }

    const onRejectBooking = async (
        reason: string,
        validatedDocuments: Requirements[],
        personalVerifiedAt?: Date | null,
        emergencyVerifiedAt?: Date | null,
        booking?: Booking,
    ) => {
        try {
            if (!booking) {

                refactorCatcher(`Refactored function signature. \n\nInclude booking as the parameter to onApproveBooking(). This function will not throw an error but it will not let the approval process continue until this change is handled.`);
                return;

                // TODO clean up (by REYN) once UI is refactored
                // throw new Error('Missing booking information');
            }

            if (!reason) throw new Error('Rejection reason is required');
            if (!profile) throw new Error('Admin must be logged in to reject a booking');

            const rejectedBook = newBooking({
                ...booking,
                user: {
                    ...booking.user,
                    phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : booking.user.phoneVerifiedAt,
                },
                emergencyContact: booking.emergencyContact ? {
                    ...booking.emergencyContact,
                    phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : booking.emergencyContact.phoneVerifiedAt,
                } : {
                    name: "",
                    contactNumber: "",
                },
                documents: validatedDocuments,
                status: 'reservation-rejected',
                cancellationReason: reason,
                cancelledBy: `${profile?.firstname} ${profile?.lastname}`
            });

            if (!BookingLogic.checkDocuments(rejectedBook))
                throw new Error('Cannot reject booking with pending documents. Please validate all documents first.');

            const success = await create(rejectedBook, true);

            if (!success) throw new Error('Failed to reject booking');

            // Sync the hiker's profile and emergency contact profile if they exist
            // WRONG USE CASE
            // 
            // Sync upon submission of reservation not in approval
            // Admins do not have permissions to edit users' profiles.

            onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRejectBooking()');
            setLocalError((error as Error).message || 'Failed to reject booking');
        }
    }

    const onRescheduleBooking = (newOffer: Offer, booking?: Booking,) => {
        try {
            if (!booking) {

                refactorCatcher(`Refactored function signature. \n\nInclude booking as the parameter to onApproveBooking(). This function will not throw an error but it will not let the approval process continue until this change is handled.`);
                return;

                // TODO clean up (by REYN) once UI is refactored
                // throw new Error('Missing booking information');
            }

            if (!newOffer) throw new Error('A new offer must be provided to reschedule');

            if (newOffer.price !== booking.offer.price) {
                Alert.alert(`The new offer costs ${newOffer.price} while the old one is ${booking.offer.price}`)
            }

            const rescheduledBook = newBooking({
                ...booking,
                offer: {
                    date: newOffer.date,
                    price: newOffer.price,
                    id: newOffer.id,
                }
            });

            logger('useBookingAdmin', 'New rescheduled offer', rescheduledBook.offer);
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRescheduleBooking()');
            setLocalError((error as Error).message || 'Failed to reschedule booking');
        }
    }

    const onCancelUnpaid = async (booking?: Booking) => {
        try {
            if (!booking) {

                refactorCatcher(`Refactored function signature. \n\nInclude booking as the parameter to onApproveBooking(). This function will not throw an error but it will not let the approval process continue until this change is handled.`);
                return;

                // TODO clean up (by REYN) once UI is refactored
                // throw new Error('Missing booking information');
            }

            if (role !== 'admin') throw new Error('Only admins can cancel bookings');

            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                "Placeholder Active",
                "BACKEND: Insert `cancelBooking` Cloud Function call here."
            );

            onBackPress();

        } catch (error) {
            catchError(error as Error, 'writingError', 'onCancelUnpaid()');
            setLocalError((error as Error).message || 'Failed to cancel booking');
        }
    }

    return {
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onCancelUnpaid,
        error: localError || error,
        isLoading
    }
}