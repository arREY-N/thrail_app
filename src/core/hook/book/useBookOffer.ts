import { functions } from "@/src/core/config/Firebase";
import { payBooking } from "@/src/core/hook/book/usePayBooking";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";

import { Booking, createBooking as createNewBooking } from "@/src/core/models/Booking/Booking";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { Offer } from "@/src/core/models/Offer/Offer";
import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore.web";
import { formatDateToStandard } from "@/src/utils/dateFormatter";
import { router } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Alert, Platform } from "react-native";

export type UseBookOfferParams = {
    bookingId?: string;
    trailId?: string;
    offerId?: string;
}

export default function useBookOffer(params: UseBookOfferParams = {}) {
    const { profile } = useAuthHook();
    const bookings = useBookingsStore(s => s.userBookings);
    const fetchOffer = useOfferStore(s => s.fetchOfferById);
    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);
    

    const [localError, setLocalError] = useState<string | null>(null);

    const [booking, setBooking] = useState<Booking>(createNewBooking());

    const getBookOffer = async (offerId: string): Promise<Offer | null> => {
        try {
            if(!offerId) 
                throw new Error('No offer ID found for booking');
            
            await fetchOffer(offerId);
            
            const offer = useOfferStore.getState().businessOffers.find(o => o.id === offerId) || null;

            if(!offer)
                throw new Error ('Failed to fetch offer for booking');
            
            return offer
        } catch (error) {
            setLocalError((error as Error).message || 'Failed to fetch offer for booking');
        }
        return null;
    }

    const onPayOffer = async (amount: number, bookingId: string, type: string, returnUrl: string) => {
        try {
            if(!profile) 
                throw new Error('No user found');
            
            const response = await payBooking({
                amount,
                bookingId,
                userId: profile.id,
                type,
                returnUrl,
            });

            // The backend handles appending the pending IPayment structure to the Firestore array.
            // We just return the response to the UI so it can redirect to the checkout URL.
            return response;
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting payment');
            throw error;
        }
    }

    /**
     * Cancels a booking securely via Firebase Cloud Functions.
     * Only works before payment is captured.
     * 
     * @param {Booking} booking - The booking object to cancel.
     * @param {string} reason - The user's reason for cancellation.
     * @returns {Promise<void>}
     */
    const onCancelBookingPress = async (booking: Booking, reason: string) => {
        try {
            if(!booking)
                throw new Error('No booking selected');
            
            if(!reason)
                throw new Error('Cancellation reason is required'); 
        
            const cancelBookingFn = httpsCallable(functions, 'cancelBooking');
            await cancelBookingFn({
                bookingId: booking.id,
                userId: profile?.id || profile?.uid,
                reason: reason
            });

            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed cancelling booking')  
        }
    }

    /**
     * Requests a refund securely via Firebase Cloud Functions.
     * Invokes PayMongo refund API and updates the booking status.
     * 
     * @param {Booking} booking - The booking object to refund.
     * @param {string} reason - The user's reason for requesting a refund.
     * @returns {Promise<void>}
     */
    const onRefundBookingPress = async (booking: Booking, reason: string) => {
        try {
            if(!booking) throw new Error('No booking selected');
            
            const refundBookingFn = httpsCallable(functions, 'refundBooking');
            await refundBookingFn({
                bookingId: booking.id,
                userId: profile?.id || profile?.uid,
                reason: reason || 'User requested refund'
            });

            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed processing refund')  
        }
    }

    const onRescheduleBooking = async (bookingToReschedule: Booking, newOffer: Offer) => {
        try {
            if(!bookingToReschedule) throw new Error('No booking found');
            if(!newOffer) throw new Error('A new offer must be provided to reschedule');

            console.log("TODO: Backend Reschedule Integration", {
                oldBooking: bookingToReschedule,
                newOffer: newOffer
            });

            const msg = `Successfully requested to reschedule to ${newOffer.trail?.name || 'a new date'} on ${formatDateToStandard(newOffer.date)}. (Placeholder)`;

            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert("Reschedule Requested", msg);
            }

            router.back();

        } catch (error) {
            setLocalError((error as Error).message || 'Failed to reschedule booking');
        }
    }

    return {
        booking,
        bookings,
        error: localError || error,
        isLoading,
        onPayOffer,
        onCancelBookingPress,
        onRefundBookingPress,
        onRescheduleBooking,
        getBookOffer,
    }
}