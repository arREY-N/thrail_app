import { Booking, useBookingsStore } from "@/src/core/models/Booking/Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import { useRescheduleStore } from "@/src/core/models/Reschedule/stores/rescheduleStore";
import { newReschedule } from "@/src/core/models/Reschedule/utils/RescheduleFactory";
import { useAuthHook } from "@/src/core/models/User/User";
import { useState } from "react";

export const useRescheduleUser = () => {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const isWriting = useRescheduleStore(s => s.isWriting);

    /**
     * Submits a reschedule request for a user's booking.
     * Updates the booking status to 'for-reschedule' and creates a pending request.
     */
    const onRescheduleBooking = async (
        bookingToReschedule: Booking,
        newOffer: Offer,
        reason?: string
    ): Promise<void> => {
        try {
            setLocalError(null);

            if (!profile?.id) {
                throw new Error("You must be logged in to request a reschedule.");
            }

            if (!bookingToReschedule?.id) {
                throw new Error("Booking information is required.");
            }

            if (!newOffer?.id) {
                throw new Error("A target offer must be selected.");
            }

            if (bookingToReschedule.offer?.id === newOffer.id) {
                throw new Error("Cannot reschedule to the exact same offer date.");
            }

            // Check if user already has an active booking for this new offer
            const existingBookings = useBookingsStore.getState().userBookings || [];
            const hasExistingActiveBooking = existingBookings.some(
                b => b.id !== bookingToReschedule.id && 
                     b.offer?.id === newOffer.id && 
                     !['cancelled', 'refunded', 'expired', 'rescheduled'].includes(b.status)
            );

            if (hasExistingActiveBooking) {
                throw new Error("You already have an active booking for this offer.");
            }

            if (bookingToReschedule.status === 'rescheduled') {
                throw new Error("This booking has already been rescheduled.");
            }

            if (['cancelled', 'finished', 'expired', 'refunded'].includes(bookingToReschedule.status)) {
                throw new Error(`Cannot reschedule a booking that is ${bookingToReschedule.status}.`);
            }

            const businessId = bookingToReschedule.business?.id;
            if (!businessId) {
                throw new Error("Organizer information is missing from this booking.");
            }

            // Create new Reschedule request blueprint
            const reschedulePayload = newReschedule({
                businessId,
                userId: profile.id,
                bookingId: bookingToReschedule.id,
                oldOfferId: bookingToReschedule.offer.id,
                newOfferId: newOffer.id,
            }, {
                reason: reason || undefined,
            });

            await useRescheduleStore.getState().submitUserRescheduleRequest(reschedulePayload);

            // Refresh booking store so UI immediately displays 'for-reschedule' status
            if (bookingToReschedule.offer?.id) {
                await useBookingsStore.getState().refreshBookingItem(
                    bookingToReschedule.id,
                    bookingToReschedule.offer.id
                ).catch(console.warn);
            }

        } catch (error: any) {
            const msg = error.message || "Failed to submit reschedule request.";
            setLocalError(msg);
            throw error;
        }
    };

    /**
     * Withdraws / cancels a pending reschedule request.
     */
    const onWithdrawReschedule = async (
        booking: Booking,
        rescheduleId: string,
        revertStatus: Booking['status'] = 'paid'
    ): Promise<boolean> => {
        try {
            setLocalError(null);

            if (!profile?.id) throw new Error("Authentication required.");
            if (!booking?.id || !rescheduleId) throw new Error("Missing booking or request info.");

            await useRescheduleStore.getState().withdrawUserRescheduleRequest(
                booking.business.id,
                rescheduleId,
                profile.id,
                booking.id,
                revertStatus
            );

            if (booking.offer?.id) {
                await useBookingsStore.getState().refreshBookingItem(booking.id, booking.offer.id).catch(console.warn);
            }
            return true;
        } catch (error: any) {
            const msg = error.message || "Failed to withdraw reschedule request.";
            setLocalError(msg);
            return false;
        }
    };

    return {
        localError,
        isWriting,
        onRescheduleBooking,
        onWithdrawReschedule,
    };
};