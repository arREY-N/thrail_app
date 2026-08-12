import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { flagCancellationRequest } from "@/src/core/models/Cancellation/utils/Cancellation.utils";
import { catchError } from "@/src/core/utility/errorFormatter";
import { useState } from "react";

import {
    Booking,
    getUserBookingItem,
    updateBookingOnCancellation,
    useBookingsStore
} from "@/src/core/models/Booking/Booking";

import {
    getGroupItem,
    Group,
    updateGroupOnCancellation,
    useGroupStore
} from "@/src/core/models/Group/Group";

import {
    getBusinessOfferItem,
    Offer,
    updateOfferOnCancellation,
    useOfferStore
} from "@/src/core/models/Offer/Offer";


export function useCancellationAdmin() {
    const { profile } = useAuthHook();
    
    const [localError, setLocalError] = useState<string | null>(null);

    const cancellationRequests = useCancellationStore(s => s.businessCancellations);
    const isWriting = useCancellationStore(s => s.isWriting);

    const createCancellation = useCancellationStore(s => s.write);
    const createOffer = useOfferStore(s => s.createOffer);
    const createBooking = useBookingsStore(s => s.create);
    const createGroup = useGroupStore(s => s.createGroup);
    
    const processCancellationRequest = async (request: Cancellation, approved: boolean, adminNote?: string) => {
        try {
            setLocalError(null);

            if(!profile || profile.role !== "admin") {
                throw new Error("Only admins can process cancellation requests.");
            }

            if(approved) {
                const { bookingId, offerId } = request;
         
                const offer: Offer | null = await getBusinessOfferItem(offerId);

                if(!offer) 
                    throw new Error("Offer not found for the provided offer ID.");

                const booking: Booking | null = await getUserBookingItem(bookingId);

                if(!booking) 
                    throw new Error("Booking not found for the provided booking ID.");

                const group: Group | null = await getGroupItem(booking.offer.id);

                if(!group)
                    throw new Error("Group chat not found for the provided offer ID.");
                
                const updatedOffer: Offer = updateOfferOnCancellation(offer, booking);

                const updatedBooking: Booking = updateBookingOnCancellation(booking, request, approved);

                const updatedGroup: Group = updateGroupOnCancellation(group, booking.user.id);
                
                // check if payments were recorded
                // handle on cloud; ask Raven
                // if(booking.payment && booking.payment.length > 0) {
                //     // if payments were recorded, refund user
                // }
                                
                await createBooking(updatedBooking);
                await createOffer(updatedOffer);
                await createGroup(updatedGroup);
            } else {
                if(!adminNote || adminNote.trim() === "") {
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
        } catch (error) {
            catchError(error as Error, 'localError', 'useCancellationAdmin()');
            setLocalError((error as Error).message || "An unexpected error occurred.");
        }
    }
    
    return {
        isWriting,
        localError,
        cancellationRequests,
        processCancellationRequest,
    }
}