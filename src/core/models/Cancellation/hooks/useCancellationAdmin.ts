import { Cancellation } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { flagCancellationRequest } from "@/src/core/models/Cancellation/utils/Cancellation.utils";
import { useAuthHook } from "@/src/core/models/User/User";
import { catchError, logger } from "@/src/core/utility/errorFormatter";
import { useState } from "react";

import {
    Booking,
    getUserBookingItem,
    updateBookingOnCancellation,
    useBookingsStore
} from "@/src/core/models/Booking/Booking";

import {
    getGroup,
    Group,
    updateGroupOnCancellation,
    useGroupStore
} from "@/src/core/models/Group/Group";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useCancellationAdminList } from "@/src/core/models/Cancellation/hooks/useCancellationAdminList";
import { createCancellationRequest } from "@/src/core/models/Cancellation/utils/CancellationFactory";
import {
    getBusinessOfferItem,
    Offer,
    subtractReservedPaxOnOffer,
    useOfferStore
} from "@/src/core/models/Offer/Offer";
import { usePaymentAdmin } from "@/src/core/models/Payment/Payment";


export function useCancellationAdmin(bookingId: string) {
    const { profile, role, businessId } = useAuthHook();
    const { onBackPress } = useAppNavigation();
    const { onRefund } = usePaymentAdmin();

    const [writingError, setWritingError] = useState<string | null>(null);
    const storeError = useCancellationStore(s => s.error);
    const isWriting = useCancellationStore(s => s.isWriting);

    const createCancellation = useCancellationStore(s => s.write);
    const createOffer = useOfferStore(s => s.newOffer);
    const createBooking = useBookingsStore(s => s.create);
    const createGroup = useGroupStore(s => s.createGroup);

    const { businessCancellations } = useCancellationAdminList();

    const cancellationRequest = businessCancellations.find(
        c => c.bookingId === bookingId
    )

    const revertAdminCancellation = useCancellationStore(s => s.delete);

    /**
     * Approves of rejects a cancellation request and updates the associated booking, offer, and group chat accordingly.
     * If approved, it will also initiate a refund process for the booking.
     * 
     * @param {Cancellation} request - The cancellation request to be processed. 
     * @param approved - A boolean indicating whether the cancellation request is approved (true) or rejected (false).
     * @param adminNote - An optional note from the admin explaining the decision. This is required if the request is rejected.
     */
    const processCancellationRequest = async ({
        request,
        approved,
        refund,
        adminNote,
    }: {
        request?: Cancellation | null, approved: boolean, refund?: number, adminNote?: string
    }) => {
        try {
            setWritingError(null);

            if (!profile || profile.role !== "admin") {
                throw new Error("Only admins can process cancellation requests.");
            }

            if (!request) {
                throw new Error('Cancellation request not provided');
            }

            if (approved) {
                const { bookingId, offerId } = request;

                const offer: Offer | null = await getBusinessOfferItem(offerId);

                if (!offer)
                    throw new Error("Offer not found for the provided offer ID.");

                const booking: Booking | null = await getUserBookingItem(bookingId);

                if (!booking)
                    throw new Error("Booking not found for the provided booking ID.");

                const group: Group | void = await getGroup(booking.offer.id);

                if (!group)
                    throw new Error("Group chat not found for the provided offer ID.");

                const updatedOffer: Offer = subtractReservedPaxOnOffer(offer, booking);

                const updatedBooking: Booking = updateBookingOnCancellation(booking, request, approved);

                const updatedGroup: Group = updateGroupOnCancellation(group, booking.user.id);

                const totalPaid = booking.payment.reduce(
                    (sum: number, p) => p.status === 'captured' ? sum + p.amount : sum,
                    0
                ) || 0;

                if (totalPaid > 0) {
                    logger('UseCancellationAdmin', 'Implement variable refund amount')

                    if (!refund) {
                        logger('UseCancellation', 'If error is thrown, update call to processCancellationRequest to include refund percentage (in decimal format).')
                        throw new Error('Refund percentage not provided');
                    }

                    await onRefund(updatedBooking, 'full');
                }

                await createBooking(updatedBooking, true, true);
                await createOffer(updatedOffer);
                await createGroup(updatedGroup);
            } else {
                if (!adminNote || adminNote.trim() === "") {
                    throw new Error("Admin note is required when rejecting a cancellation request.");
                }
            }

            const updated: Cancellation = flagCancellationRequest(request, approved, adminNote);

            await createCancellation({
                cancellation: updated,
                oldCancellation: request,
                isAdmin: true
            });

            // notify user
            const notificationMessage = approved
                ? "Your cancellation request has been approved."
                : "Your cancellation request has been rejected. As noted by the admin: " + (adminNote || "No additional information provided.");

            logger('useCancellationAdmin', notificationMessage);
        } catch (error) {
            catchError(error as Error, 'writingError', 'useCancellationAdmin()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
        }
    }

    const handleApproveCancellation = async (
        request?: Cancellation | null,
        currentBooking?: Booking
    ) => {
        const activeBooking = currentBooking;
        if (!activeBooking || !request) return;

        const totalPaid = activeBooking.payment?.reduce(
            (sum: number, p) => p.status === 'captured' ? sum + p.amount : sum,
            0
        ) || 0;

        if (totalPaid > 0) {
            // Paid booking: triggers refund and inventory updates via backend
            await processCancellationRequest({
                request,
                approved: true
            })
        };
    };

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

            const cancellationNotice = createCancellationRequest({
                bookingId: booking.id,
                reason: reason,
                userId: booking.user.id,
                cancelledBy: "admin",
                offerId: booking.offer.id,
                businessId: booking.business.id,
            });

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
     * !! NOT YET IMPLEMENTED !!
     * 
     * Processes a refund for an approved cancellation request.
     * @param {Cancellation} request - The cancellation request for which to process a refund.
     */
    const proceedToRefund = async (request: Cancellation) => {
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

            // await processAdminRefund(businessId, request);
            throw new Error("Refund processing is not yet implemented. This function is a placeholder for future development.");
        } catch (error) {
            catchError(error as Error, 'writingError', 'proceedToRefund()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
        }
    }

    const onCancelUnpaid = async (booking?: Booking) => {
        try {
            if (!booking) {
                throw new Error('No booking data provided.');
            }

            if (role !== 'admin') throw new Error('Only admins can cancel bookings');

            await cancelUserBooking(booking, 'Unpaid booking');

            onBackPress();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onCancelUnpaid()');
            setWritingError((error as Error).message || 'Failed to cancel booking');
        }
    }

    return {
        onCancelUnpaid,
        isWriting,
        writingError,
        storeError,
        cancellationRequest,
        processCancellationRequest,
        cancelUserBooking,
        revertCancellationRequest,
        proceedToRefund
    }
}