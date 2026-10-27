import { HandleGroupMemberFlow } from "@/src/core/flows/HandleGroupMemberFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Booking, Requirements } from "@/src/core/models/Booking/interfaces/Booking.types";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { BookingLogic } from "@/src/core/models/Booking/utils/Booking.logic";
import { newBooking } from "@/src/core/models/Booking/utils/BookingFactory";
import { IGroupMember } from "@/src/core/models/Group/Group";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { useAuthHook } from "@/src/core/models/User/User";
import { toDateOrNull } from "@/src/core/utility/date";
import { catchError, logger, refactorCatcher } from "@/src/core/utility/errorFormatter";
import { FileRepository, SelectedFile } from "@/src/core/repositories/fileRepository";
import { functions } from "@/src/core/config/Firebase";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Alert } from "react-native";

export function useBookingAdmin() {
    const [localError, setLocalError] = useState<string>();
    const { profile } = useAuthHook();
    const create = useBookingsStore(s => s.create);
    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);
    const updateReservedPaxInOffer = useOfferStore(s => s.updateReservedPaxInOffer);
    const { onAddMemberToGroup } = HandleGroupMemberFlow();
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
            }

            const resolvedPersonalVerified = personalVerifiedAt !== undefined
                ? toDateOrNull(personalVerifiedAt)
                : toDateOrNull(booking.user.phoneVerifiedAt);

            const resolvedEmergencyVerified = emergencyVerifiedAt !== undefined
                ? toDateOrNull(emergencyVerifiedAt)
                : toDateOrNull(booking.emergencyContact?.phoneVerifiedAt);

            const approvedBook = newBooking({
                ...booking,
                user: {
                    ...booking.user,
                    phoneVerifiedAt: resolvedPersonalVerified,
                },
                emergencyContact: booking.emergencyContact ? {
                    ...booking.emergencyContact,
                    phoneVerifiedAt: resolvedEmergencyVerified,
                } : {
                    name: "",
                    contactNumber: "",
                    phoneVerifiedAt: null,
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

            await updateReservedPaxInOffer(booking.offer.id, 'add');

            const user = booking.user;

            const groupMember: IGroupMember = {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                bookingId: approvedBook.id,
            }

            await onAddMemberToGroup(groupMember, booking.offer.id,);

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

            if (booking.status !== 'paid' || ((booking.remainingBalance ?? 0) > 0)) {
                throw new Error('Booking is not fully paid. Balance must be 0 before completing.');
            }

            const completedBook = newBooking({
                ...booking,
                status: 'completed',
                remainingBalance: 0,
                paymentVerificationStatus: 'fully_paid',
            });

            const success = await create(completedBook, true);
            if (!success) {
                throw new Error('Failed to finalize booking to completed status.');
            }

            const user = booking.user;
            const groupMember: IGroupMember = {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                bookingId: completedBook.id,
            };
            await onAddMemberToGroup(groupMember, booking.offer.id);

            onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onConfirmPayment()');
            setLocalError((error as Error).message || 'Failed to confirm payment');
        }
    }

    const onVerifyManualPayment = async (
        booking: Booking,
        classification: 'full' | 'downpayment',
        note?: string,
        verifiedAmount?: number
    ) => {
        try {
            if (!booking) throw new Error('Missing booking information');

            const verifyManualPaymentFn = httpsCallable(functions, 'verifyManualPayment');
            await verifyManualPaymentFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                businessId: booking.business?.id,
                offerId: booking.offer?.id,
                classification,
                note,
                verifiedAmount,
            });

            await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer?.id);

            return true;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onVerifyManualPayment()');
            setLocalError((error as Error).message || 'Failed to verify payment');
            throw error;
        }
    };

    const onRejectManualPayment = async (booking: Booking, reason: string) => {
        try {
            if (!booking) throw new Error('Missing booking information');
            if (!reason.trim()) throw new Error('Rejection reason is required');

            const verifyManualPaymentFn = httpsCallable(functions, 'verifyManualPayment');
            await verifyManualPaymentFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                businessId: booking.business?.id,
                offerId: booking.offer?.id,
                isRejection: true,
                rejectionReason: reason.trim(),
            });

            await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer?.id);

            return true;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRejectManualPayment()');
            setLocalError((error as Error).message || 'Failed to reject payment');
            throw error;
        }
    };

    const onSettleRemainingBalance = async (
        booking: Booking,
        options?: { method?: 'cash' | 'manual_qr'; referenceCode?: string; adminNote?: string }
    ) => {
        try {
            if (!booking) throw new Error('Missing booking information');

            const settleManualBalanceFn = httpsCallable(functions, 'settleManualBalance');
            await settleManualBalanceFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                businessId: booking.business?.id,
                offerId: booking.offer?.id,
                method: options?.method || 'cash',
                referenceCode: options?.referenceCode || '',
                adminNote: options?.adminNote || '',
            });

            await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer?.id);

            return true;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onSettleRemainingBalance()');
            setLocalError((error as Error).message || 'Failed to settle remaining balance');
            throw error;
        }
    };

    const onUploadOverpaymentProof = async (booking: Booking, file: SelectedFile) => {
        try {
            if (!booking) throw new Error('Missing booking information');
            const businessId = booking.business?.id;
            if (!businessId) throw new Error('Business ID is required');

            const downloadUrl = await FileRepository.uploadBusinessFile(businessId, 'refunds', file);

            const completeOverpaymentRefundFn = httpsCallable(functions, 'completeOverpaymentRefund');
            await completeOverpaymentRefundFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                businessId: businessId,
                receiptUrl: downloadUrl,
            });

            await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer?.id);

            return downloadUrl;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onUploadOverpaymentProof()');
            setLocalError((error as Error).message || 'Failed to upload excess refund proof');
            throw error;
        }
    };

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
            }

            if (!reason) throw new Error('Rejection reason is required');
            if (!profile) throw new Error('Admin must be logged in to reject a booking');

            const resolvedPersonalVerified = personalVerifiedAt !== undefined
                ? toDateOrNull(personalVerifiedAt)
                : toDateOrNull(booking.user.phoneVerifiedAt);

            const resolvedEmergencyVerified = emergencyVerifiedAt !== undefined
                ? toDateOrNull(emergencyVerifiedAt)
                : toDateOrNull(booking.emergencyContact?.phoneVerifiedAt);

            const rejectedBook = newBooking({
                ...booking,
                user: {
                    ...booking.user,
                    phoneVerifiedAt: resolvedPersonalVerified,
                },
                emergencyContact: booking.emergencyContact ? {
                    ...booking.emergencyContact,
                    phoneVerifiedAt: resolvedEmergencyVerified,
                } : {
                    name: "",
                    contactNumber: "",
                    phoneVerifiedAt: null,
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

    return {
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onVerifyManualPayment,
        onRejectManualPayment,
        onSettleRemainingBalance,
        onUploadOverpaymentProof,
        error: localError || error,
        isLoading
    }
}