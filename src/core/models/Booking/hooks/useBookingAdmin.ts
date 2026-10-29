import { functions } from "@/src/core/config/Firebase";
import { HandleGroupMemberFlow } from "@/src/core/flows/HandleGroupMemberFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Booking, Requirements } from "@/src/core/models/Booking/interfaces/Booking.types";
import { BookingRepo } from "@/src/core/models/Booking/repositories/BookingRepository";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { BookingLogic } from "@/src/core/models/Booking/utils/Booking.logic";
import { newBooking } from "@/src/core/models/Booking/utils/BookingFactory";
import { IGroupMember } from "@/src/core/models/Group/Group";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { useRescheduleStore } from "@/src/core/models/Reschedule/Reschedule";
import { useAuthHook } from "@/src/core/models/User/User";
import { FileRepository, SelectedFile } from "@/src/core/repositories/fileRepository";
import { toDateOrNull } from "@/src/core/utility/date";
import { catchError, refactorCatcher } from "@/src/core/utility/errorFormatter";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";

export function useBookingAdmin() {
    const [localError, setLocalError] = useState<string>();
    const { profile, businessId } = useAuthHook();
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

            // onBackPress();
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

    const onEditManualPayment = async (
        booking: Booking,
        options: {
            paymentIndex?: number;
            newAmount: number;
            newReferenceCode?: string;
            newClassification?: 'full' | 'downpayment';
            newAdminNote?: string;
        }
    ) => {
        try {
            if (!booking) throw new Error('Missing booking information');
            if (typeof options.newAmount !== 'number' || options.newAmount <= 0) {
                throw new Error('A valid positive payment amount is required');
            }

            try {
                const verifyManualPaymentFn = httpsCallable(functions, 'verifyManualPayment');
                await verifyManualPaymentFn({
                    bookingId: booking.id,
                    userId: booking.user?.id,
                    businessId: booking.business?.id,
                    offerId: booking.offer?.id,
                    isEdit: true,
                    paymentIndex: options.paymentIndex,
                    newAmount: options.newAmount,
                    newReferenceCode: options.newReferenceCode,
                    newClassification: options.newClassification,
                    newAdminNote: options.newAdminNote,
                });
            } catch (fnErr) {
                console.warn('[onEditManualPayment] Cloud function call failed, applying client fallback:', fnErr);
                const payments = [...(booking.payment || [])];
                let targetIdx = typeof options.paymentIndex === 'number' ? options.paymentIndex : -1;
                if (targetIdx < 0 || targetIdx >= payments.length) {
                    for (let i = payments.length - 1; i >= 0; i--) {
                        if (payments[i].status === 'captured') {
                            targetIdx = i;
                            break;
                        }
                    }
                }
                if (targetIdx === -1) throw new Error('No captured payment found to edit.');

                const totalPrice = booking.offer?.price || 0;
                const otherCaptured = payments.reduce((sum, p, idx) => (idx !== targetIdx && p.status === 'captured') ? sum + (p.amount || 0) : sum, 0);
                const balanceNeeded = Math.max(0, totalPrice - otherCaptured);
                const isOverpaid = options.newAmount > balanceNeeded;
                const excessAmount = isOverpaid ? (options.newAmount - balanceNeeded) : 0;
                const approvedAmount = isOverpaid ? balanceNeeded : options.newAmount;
                const totalCaptured = otherCaptured + approvedAmount;
                const newRemainingBalance = Math.max(0, totalPrice - totalCaptured);
                const isFull = isOverpaid || newRemainingBalance === 0 || (options.newClassification === 'full' && approvedAmount >= balanceNeeded);
                const effectiveClassification = isFull ? 'full' : (options.newClassification || 'downpayment');

                const targetPayment = payments[targetIdx];
                payments[targetIdx] = {
                    ...targetPayment,
                    amount: approvedAmount,
                    classification: effectiveClassification,
                    referenceCode: options.newReferenceCode !== undefined ? (options.newReferenceCode ? options.newReferenceCode.trim() : targetPayment.referenceCode) : targetPayment.referenceCode,
                    adminNote: options.newAdminNote !== undefined ? (options.newAdminNote ? options.newAdminNote.trim() : undefined) : targetPayment.adminNote,
                    editedAt: new Date(),
                };

                const updatedBooking: Booking = {
                    ...booking,
                    status: isFull ? 'completed' : 'downpayment',
                    remainingBalance: newRemainingBalance,
                    paymentVerificationStatus: isFull ? 'fully_paid' : 'downpayment',
                    payment: payments,
                    overpayment: isOverpaid ? {
                        excessAmount,
                        originalVerifiedAmount: options.newAmount,
                        hikeAmountCaptured: approvedAmount,
                        status: 'awaiting_hiker_wallet',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } : undefined,
                    updatedAt: new Date(),
                };

                await BookingRepo.write(updatedBooking);
            }

            await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer?.id);
            return true;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onEditManualPayment()');
            setLocalError((error as Error).message || 'Failed to edit payment details');
            throw error;
        }
    };

    const onRevertManualPayment = async (
        booking: Booking,
        options?: {
            paymentIndex?: number;
            revertRejection?: boolean;
            reason?: string;
        }
    ) => {
        try {
            if (!booking) throw new Error('Missing booking information');

            try {
                const verifyManualPaymentFn = httpsCallable(functions, 'verifyManualPayment');
                await verifyManualPaymentFn({
                    bookingId: booking.id,
                    userId: booking.user?.id,
                    businessId: booking.business?.id,
                    offerId: booking.offer?.id,
                    isRevert: true,
                    paymentIndex: options?.paymentIndex,
                    revertRejection: options?.revertRejection,
                });
            } catch (fnErr) {
                console.warn('[onRevertManualPayment] Cloud function call failed, applying client fallback:', fnErr);
                const payments = [...(booking.payment || [])];
                if (options?.revertRejection || booking.paymentVerificationStatus === 'rejected') {
                    const updatedPayments = payments.map(p => {
                        if (p.status === 'rejected') {
                            return { ...p, status: 'pending' as const, adminNote: undefined };
                        }
                        return p;
                    });
                    const updatedBooking: Booking = {
                        ...booking,
                        status: 'for-payment',
                        paymentVerificationStatus: 'pending_verification',
                        paymentRejectionReason: undefined,
                        payment: updatedPayments,
                        updatedAt: new Date(),
                    };
                    await BookingRepo.write(updatedBooking);
                } else {
                    let targetIdx = typeof options?.paymentIndex === 'number' ? options.paymentIndex : -1;
                    if (targetIdx < 0 || targetIdx >= payments.length) {
                        for (let i = payments.length - 1; i >= 0; i--) {
                            if (payments[i].status === 'captured') {
                                targetIdx = i;
                                break;
                            }
                        }
                    }
                    if (targetIdx === -1) throw new Error('No captured payment found to revert.');

                    const targetPayment = payments[targetIdx];
                    if (targetPayment.receiptUrl) {
                        payments[targetIdx] = {
                            ...targetPayment,
                            status: 'pending',
                            amount: 0,
                            classification: undefined,
                            paidAt: undefined,
                            verifiedAt: undefined,
                            verifiedBy: undefined,
                            revertedAt: new Date(),
                        };
                    } else {
                        payments[targetIdx] = {
                            ...targetPayment,
                            status: 'abandoned',
                            revertedAt: new Date(),
                        };
                    }

                    const totalPrice = booking.offer?.price || 0;
                    const remainingCaptured = payments.reduce((sum, p) => p.status === 'captured' ? sum + (p.amount || 0) : sum, 0);
                    const newRemainingBalance = Math.max(0, totalPrice - remainingCaptured);

                    let newStatus: Booking['status'] = 'for-payment';
                    let newVerificationStatus: Booking['paymentVerificationStatus'] = 'pending_verification';
                    if (remainingCaptured > 0) {
                        if (newRemainingBalance === 0) {
                            newStatus = 'completed';
                            newVerificationStatus = 'fully_paid';
                        } else {
                            newStatus = 'downpayment';
                            newVerificationStatus = 'downpayment';
                        }
                    }

                    const updatedBooking: Booking = {
                        ...booking,
                        status: newStatus,
                        paymentVerificationStatus: newVerificationStatus,
                        remainingBalance: newRemainingBalance,
                        payment: payments,
                        overpayment: undefined,
                        updatedAt: new Date(),
                    };
                    await BookingRepo.write(updatedBooking);
                }
            }

            await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer?.id);
            return true;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRevertManualPayment()');
            setLocalError((error as Error).message || 'Failed to revert payment verification');
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

            // if (!BookingLogic.checkDocuments(rejectedBook))
            //     throw new Error('Cannot reject booking with pending documents. Please validate all documents first.');

            const success = await create(rejectedBook, true);

            if (!success) throw new Error('Failed to reject booking');

            // onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRejectBooking()');
            setLocalError((error as Error).message || 'Failed to reject booking');
        }
    }

    const onRescheduleBooking = async (newOffer: Offer, booking?: Booking, adminNote?: string) => {
        try {
            if (!booking) {
                refactorCatcher(`Refactored function signature. \n\nInclude booking as the parameter to onRescheduleBooking().`);
                return;
            }

            if (!newOffer) throw new Error('A new offer must be provided to reschedule');

            const approveRescheduleFn = httpsCallable(functions, 'approveReschedule');
            const result = await approveRescheduleFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                newOfferId: newOffer.id,
                businessId: booking.business?.id || businessId || undefined,
                adminNote,
            });

            const resolvedBusinessId = booking.business?.id || businessId;
            if (resolvedBusinessId) {
                await Promise.all([
                    useOfferStore.getState().fetchOfferByBusiness(resolvedBusinessId),
                    useRescheduleStore.getState().fetchAllByBusinessId(resolvedBusinessId),
                ]).catch(console.warn);
            }

            if (booking.offer?.id) {
                await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer.id).catch(console.warn);
            }

            onBackPress();
            return result.data;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRescheduleBooking()');
            setLocalError((error as Error).message || 'Failed to reschedule booking');
            throw error;
        }
    };

    return {
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onVerifyManualPayment,
        onRejectManualPayment,
        onEditManualPayment,
        onRevertManualPayment,
        onSettleRemainingBalance,
        onUploadOverpaymentProof,
        error: localError || error,
        isLoading
    }
}