import { functions } from "@/src/core/config/Firebase";
import { payBooking } from "@/src/core/hook/book/usePayBooking";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { TEdit } from "@/src/core/interface/domainHookInterface";

import { BookingLogic } from "@/src/core/models/Booking/logic/Booking.logic";
import { Booking, createBooking as createNewBooking } from "@/src/core/models/Booking/Ref_Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { formatDateToStandard } from "@/src/utils/dateFormatter";
import { router } from "expo-router";
import { httpsCallable } from "firebase/functions";
import { produce } from "immer";
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
    const fetchOffer = useOffersStore(s => s.fetchOfferById);
    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);
    const createBooking = useBookingsStore(s => s.create);
    const joinGroup = useGroupStore(s => s.joinGroup);
    const checkGroupExists = useGroupStore(s => s.checkGroupExists);


    const [localError, setLocalError] = useState<string | null>(null);

    const [booking, setBooking] = useState<Booking>(createNewBooking());

    const getBookOffer = async (offerId: string): Promise<Offer | null> => {
        try {
            if(!offerId) 
                throw new Error('No offer ID found for booking');
            
            const offer = await fetchOffer(offerId);
            
            if(!offer)
                throw new Error ('Failed to fetch offer for booking');
            
            return offer
        } catch (error) {
            setLocalError((error as Error).message || 'Failed to fetch offer for booking');
        }
        return null;
    }

    const onSetOffer = (offer: Offer) => {
        try {
            setBooking(prev => 
                produce(prev, (draft) => {
                    if(!draft) return;
                    BookingLogic.setOffer(draft, offer);
                })
            );
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting offer')
        }
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

    const onCompleteBook = async (payload?: { hikerDetails?: { phone?: string } | null }): Promise<boolean> => {
        try {
            
            if(!profile)
                throw new Error('No user found');
    
            if(!booking)
                throw new Error('No booking found');

            const offer = await fetchOffer(booking.offer.id);
    
            if(!offer) 
                throw new Error('Offer not found for booking');

            const editedPhone = payload?.hikerDetails?.phone;
            const bookingPhone = editedPhone || profile.phoneNumber;
    
            const finalBooking = createNewBooking({
                ...booking,
                trail: offer.trail,
                user: {
                    ...UserLogic.toBookingSummary(profile),
                    phoneNumber: bookingPhone,
                },
            })
            
            const group = await checkGroupExists(offer.id);

            if(!group) 
                throw new Error('Cannot continue with booking as group has not been set yet.');

            const created = await createBooking(finalBooking)

            const member = {
                ...UserLogic.toSummary(profile),
                bookingId: created.id,
            }

            await joinGroup(group, member);
            
            return true;
        } catch (error) {
            console.error('Error completing booking: ', error);
            setLocalError((error as Error).message || 'Failed completing booking')      
            return false;
        }
    }

    const onUpdatePress = (params: TEdit<Booking>) => {
        const { section, id, value } = params;

        console.log(params);
        try {
            setBooking(prev => 
                produce(prev, (draft) => { 
                    if(!draft) return;

                    if(section === 'root'){
                        (draft as Record<string, any>)[id] = value;
                    } else {
                        const nestedSection = section as keyof Booking;
                        if(draft[nestedSection] && typeof draft[nestedSection] === 'object') {
                            (draft[nestedSection] as Record<string, any>)[id] = value;
                        }
                    }
                })
            )
        } catch (error) {
            setLocalError(`Failed updating ${String(section)} : ${id}`)
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
        onSetOffer,
        onPayOffer,
        onUpdatePress,
        onCompleteBook,
        onCancelBookingPress,
        onRefundBookingPress,
        onRescheduleBooking,
        getBookOffer,
    }
}