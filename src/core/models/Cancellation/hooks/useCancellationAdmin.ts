import { useAuthHook } from "@/src/core/hook/user/useAuthHook"
import { Booking } from "@/src/core/models/Booking/Ref_Booking"
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore"
import { updateBookingOnCancellation } from "@/src/core/models/Booking/utils/Booking.utils"
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation"
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore"
import { flagCancellationRequest } from "@/src/core/models/Cancellation/utils/Cancellation.utils"
import { Offer } from "@/src/core/models/Offer/Offer"
import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore"
import { updateOfferOnCancellation } from "@/src/core/models/Offer/utils/Offer.utils"
import { useState } from "react"

type CancellationRequest = Required<Pick<Cancellation, 'reason' | 'offerId' | 'businessId' | 'bookingId'>>

export function useCancellationAdmin() {
    const { profile, businessId } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const [request, setRequest] = useState<CancellationRequest | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const cancellationRequests = useCancellationStore(s => s.businessCancellations);

    const write = useCancellationStore(s => s.write);

    const createBooking = useBookingsStore(s => s.createBooking);
    const createOffer = useOfferStore(s => s.createOffer);
    const createCancellation = useCancellationStore(s => s.write);

    const fetchOffer = useOfferStore(s => s.fetchOfferById);
    const fetchBooking = useBookingsStore(s => s.loadById);

    const processCancellationRequest = async (request: Cancellation, approved: boolean, adminNote?: string) => {
        try {
            setIsLoading(true);
            setLocalError(null);

            if(!profile || profile.role !== "admin") {
                throw new Error("Only admins can process cancellation requests.");
            }

            if(approved) {
                const { bookingId, offerId } = request;
                console.log("Request: ", request);
                const offer: Offer | null = await fetchOffer(offerId);
                
                if(!offer) 
                    throw new Error("Offer not found for the provided offer ID.");

                const booking: Booking | null = await fetchBooking(bookingId);

                if(!booking) 
                    throw new Error("Booking not found for the provided booking ID.");

                // fetch group chat
                // pending; wait for changes in the group chat structure from Emman


                // update offer data
                const updatedOffer: Offer = updateOfferOnCancellation(offer);

                // update booking data
                const updatedBooking: Booking = updateBookingOnCancellation(booking, request, approved);

                // update group chat data
                // pending; wait for changes in the group chat structure from Emman

                
                // check if payments were recorded
                // handled on cloud; ask Raven
                // if(booking.payment && booking.payment.length > 0) {
                //     // if payments were recorded, refund user
                // }
                
                // send updated data to db
                console.log("[Cancellation] Old booking:", booking);
                console.log("[Cancellation] Updated Booking:", updatedBooking);
                console.log("[Cancellation] Old Offer:", offer);
                console.log("[Cancellation] Updated Offer:", updatedOffer);

                // await createBooking(updatedBooking);
                // await createOffer(updatedOffer);
            } else {
                if(!adminNote || adminNote.trim() === "") {
                    throw new Error("Admin note is required when rejecting a cancellation request.");
                }
            }

            // update cancellation request status
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

            console.log("[Cancellation] Old Cancellation Request:", request);
            console.log("[Cancellation] Updated Cancellation Request:", updated);

        } catch (error) {
            setLocalError((error as Error).message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    }
    
    return {
        localError,
        cancellationRequests,
        processCancellationRequest,
    }
}