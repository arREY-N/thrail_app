import { functions } from "@/src/core/config/Firebase";
import { httpsCallable } from "firebase/functions";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { catchError, logger } from "@/src/core/utility/errorFormatter";
import { useState } from "react";

import { Booking } from "@/src/core/models/Booking/Booking";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useCancellationAdminList } from "@/src/core/models/Cancellation/hooks/useCancellationAdminList";
import { createCancellationRequest } from "@/src/core/models/Cancellation/utils/CancellationFactory";
import { FileRepository, SelectedFile } from "@/src/core/repositories/fileRepository";
import { PAYMENT_CONFIG } from "@/src/core/config/paymentConfig";

export function useCancellationAdmin(bookingId: string) {
    const { profile, role, businessId } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const [writingError, setWritingError] = useState<string | null>(null);
    const storeError = useCancellationStore(s => s.error);
    const isWriting = useCancellationStore(s => s.isWriting);

    const createCancellation = useCancellationStore(s => s.write);
    const revertAdminCancellation = useCancellationStore(s => s.delete);

    const { businessCancellations } = useCancellationAdminList();

    const cancellationRequest = businessCancellations.find(
        c => c.bookingId === bookingId
    );

    /**
     * Approves or rejects a cancellation request atomically via Cloud Function.
     * Updates associated booking, offer slots, group chat members, cancellation document, and payments in a single all-or-nothing batch.
     * 
     * @param {Cancellation} request - The cancellation request to be processed. 
     * @param approved - A boolean indicating whether the cancellation request is approved (true) or rejected (false).
     * @param adminNote - An optional note from the admin explaining the decision. This is required if the request is rejected.
     */
    const processCancellationRequest = async ({
        request,
        booking,
        approved,
        refund,
        refundType = 'full',
        customAmount,
        adminNote,
    }: {
        request?: Cancellation | null;
        booking?: Booking;
        approved: boolean;
        refund?: number;
        refundType?: 'full' | 'partial' | 'custom' | 'none';
        customAmount?: number;
        adminNote?: string;
    }) => {
        try {
            setWritingError(null);

            if (!profile || profile.role !== "admin") {
                throw new Error("Only admins can process cancellation requests.");
            }

            const bookingId = request?.bookingId || booking?.id;
            const userId = request?.userId || booking?.user?.id;
            const businessId = request?.businessId || booking?.business?.id;
            const offerId = request?.offerId || booking?.offer?.id;

            if (!bookingId || !userId) {
                throw new Error('Cancellation request or booking not provided');
            }

            if (!approved && (!adminNote || adminNote.trim() === "")) {
                throw new Error("Admin note is required when rejecting a cancellation request.");
            }

            const processCancellationApprovalFn = httpsCallable(functions, 'processCancellationApproval');

            const payload = {
                cancellationId: request?.id,
                bookingId,
                userId,
                businessId,
                offerId,
                approved,
                shouldRefund: refundType !== 'none',
                refundType,
                customAmount: refundType === 'custom' ? (customAmount ?? refund) : undefined,
                adminNote: adminNote?.trim(),
            };

            const result = await processCancellationApprovalFn(payload);
            const responseData = result.data as { success: boolean; message: string; isRefundIssued?: boolean; refundAmount?: number };

            const notificationMessage = responseData.message || (approved
                ? "Your cancellation request has been approved."
                : "Your cancellation request has been rejected. As noted by the admin: " + (adminNote || "No additional information provided."));

            logger('useCancellationAdmin', notificationMessage);
            return responseData;
        } catch (error) {
            catchError(error as Error, 'writingError', 'useCancellationAdmin()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
            throw error;
        }
    }

    /**
     * Creates a cancellation request on behalf of a user booking. This function is intended for admin use only.
     * @param {Booking} booking - The booking for which to create a cancellation request.
     * @param {string} reason - The reason for the cancellation.
     */
    const cancelUserBooking = async (booking: Booking, reason: string) => {
        try {
            setWritingError(null);

            if (!profile || !profile.id)
                throw new Error("User profile is not available.");

            if (role !== "admin")
                throw new Error("Only admins can cancel bookings through this path.");

            const cancellationNotice = createCancellationRequest(
                {
                    bookingId: booking.id,
                    reason: reason,
                    userId: booking.user.id,
                    cancelledBy: "admin",
                    offerId: booking.offer.id,
                    businessId: booking.business.id,
                },
                PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                    ? { handshakeStep: "awaiting_user_acceptance" }
                    : {}
            );

            await createCancellation({
                cancellation: cancellationNotice,
                isAdmin: true
            });

        } catch (error) {
            catchError(error as Error, 'writingError', 'cancelUserBooking()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
        }
    }

    /**
     * Approves a cancellation request under the Manual QR workflow and requests the hiker's wallet details.
     * @param amount - The refund amount to be sent.
     * @param request - Optional cancellation document target.
     */
    const approveWithManualRefund = async (
        amount: number,
        request?: Cancellation | null,
        targetBooking?: Booking | null
    ) => {
        try {
            setWritingError(null);
            const target = request || cancellationRequest;
            if (!target) throw new Error("No cancellation request found.");
            const resolvedBusinessId = target.businessId || businessId || targetBooking?.business?.id;
            if (!resolvedBusinessId) throw new Error("Business ID is required.");

            const updatedCancellation: Cancellation = {
                ...target,
                businessId: resolvedBusinessId,
                status: "approved",
                refundAmount: amount,
                refundDecision: "issue_refund",
                handshakeStep: "awaiting_user_wallet",
                updatedAt: new Date(),
            };

            await createCancellation({
                cancellation: updatedCancellation,
                isAdmin: true,
            });

            return updatedCancellation;
        } catch (error) {
            catchError(error as Error, 'writingError', 'approveWithManualRefund()');
            setWritingError((error as Error).message || "Failed to approve refund.");
            throw error;
        }
    };

    /**
     * Uploads the admin's manual refund payout receipt screenshot to Firebase Storage and closes the handshake.
     * @param file - The picked receipt screenshot file.
     * @param request - Optional cancellation document.
     * @param targetBooking - Optional target booking to transition status to 'refunded'.
     */
    const uploadRefundProof = async (
        file: SelectedFile,
        request?: Cancellation | null,
        targetBooking?: Booking | null
    ) => {
        try {
            setWritingError(null);
            const target = request || cancellationRequest;
            if (!target) throw new Error("No cancellation request found.");
            if (!businessId) throw new Error("Business ID is required.");

            // 1. Upload proof screenshot to storage
            const downloadUrl = await FileRepository.uploadBusinessFile(businessId, 'refunds', file);

            // 2. Atomically commit cancellation, booking, offer slot, and group chat updates via Cloud Function
            const completeManualRefundFn = httpsCallable(functions, 'completeManualRefund');
            await completeManualRefundFn({
                bookingId: target.bookingId || targetBooking?.id,
                userId: target.userId || targetBooking?.user?.id,
                businessId: target.businessId || businessId,
                offerId: target.offerId || targetBooking?.offer?.id,
                cancellationId: target.id,
                receiptUrl: downloadUrl,
                refundAmount: target.refundAmount || targetBooking?.offer?.price,
            });

            return downloadUrl;
        } catch (error) {
            catchError(error as Error, 'writingError', 'uploadRefundProof()');
            setWritingError((error as Error).message || "Failed to upload refund proof.");
            throw error;
        }
    };

    /**
     * Reverts a cancellation request made by an admin.
     * @param {Cancellation} request - The cancellation request to be reverted.
     */
    const revertCancellationRequest = async () => {
        try {
            setWritingError(null);

            if (!businessId) {
                throw new Error("Cannot delete requests without the business ID.");
            }

            if (!cancellationRequest) {
                throw new Error("Cancelaltion request not loaded");
            }

            if (!profile || profile.role !== "admin") {
                throw new Error("Only admins can revert cancellation by admin requests.");
            }

            if (cancellationRequest.cancelledBy !== "admin") {
                throw new Error("Only cancellations made by admins can be reverted by an admin.");
            }

            if (cancellationRequest.status !== "pending") {
                throw new Error("Only pending cancellations can be reverted.");
            }

            await revertAdminCancellation(businessId, cancellationRequest);

        } catch (error) {
            catchError(error as Error, 'writingError', 'revertCancellationRequest()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
        }
    }

    /**
     * Processes a refund for an approved cancellation request.
     * Delegates to the atomic processCancellationApproval Cloud Function.
     * @param {Cancellation} request - The cancellation request for which to process a refund.
     * @param refundType - 'full', 'partial', or 'custom'.
     * @param customAmount - Optional custom refund amount in PHP.
     */
    const proceedToRefund = async (
        request: Cancellation,
        refundType: 'full' | 'partial' | 'custom' = 'full',
        customAmount?: number
    ) => {
        try {
            setWritingError(null);

            if (!businessId) {
                throw new Error("Cannot process refunds without the business ID.");
            }

            if (!profile || profile.role !== "admin") {
                throw new Error("Only admins can process refunds.");
            }

            if (request.status !== "approved") {
                throw new Error("Only approved cancellations can be processed for a refund.");
            }

            logger('proceedToRefund', `Processing refund for cancellation request:`, request);

            return await processCancellationRequest({
                request,
                approved: true,
                refundType,
                customAmount,
                adminNote: 'Refund issued by organizer',
            });
        } catch (error) {
            catchError(error as Error, 'writingError', 'proceedToRefund()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
            throw error;
        }
    };

    const onCancelUnpaid = async (booking?: Booking) => {
        try {
            if (!booking) {
                throw new Error('No booking data provided.');
            }

            if (role !== 'admin') throw new Error('Only admins can cancel bookings');

            const cancelBookingFn = httpsCallable(functions, 'cancelBooking');
            await cancelBookingFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                reason: 'Unpaid booking cancelled by admin'
            });

            onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onCancelUnpaid()');
            setWritingError((error as Error).message || 'Failed to cancel booking');
            throw error;
        }
    };

    return {
        onCancelUnpaid,
        isWriting,
        writingError,
        storeError,
        cancellationRequest,
        processCancellationRequest,
        cancelUserBooking,
        revertCancellationRequest,
        proceedToRefund,
        approveWithManualRefund,
        uploadRefundProof,
    };
}