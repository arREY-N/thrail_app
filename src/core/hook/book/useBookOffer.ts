import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { Booking } from "@/src/core/models/Booking/Booking";
import { BookingLogic } from "@/src/core/models/Booking/logic/Booking.logic";
import { Offer } from "@/src/core/models/Offer/Offer";
import { PaymentLogic } from "@/src/core/models/Payment/logic/Payment.logic";
import { Payment } from "@/src/core/models/Payment/Payment";
import { TrailLogic } from "@/src/core/models/Trail/logic/Trail.logic";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { router } from "expo-router";
import { produce } from "immer";
import { useState } from "react";

export interface IUseBookOffer {

    booking: Booking,

    bookings: Booking[],

    error: string | null;

    isLoading: boolean;

    onSetOffer: (offer: Offer) => void;

    onPayOffer: () => void;
    
    onUpdatePress: (params: TEdit<Booking>) => void;

    onCompleteBook: () => void;

    onCancelBookingPress: (booking: Booking, reason: string) => void;
}

export type UseBookOfferParams = {
    bookingId?: string;
    trailId?: string;
}

export default function useBookOffer(params: UseBookOfferParams = {}): IUseBookOffer {
    const { bookingId, trailId } = params;

    const { profile } = useAuthHook();

    const bookings = useBookingsStore(s => s.userBookings);
    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);
    const trails = useTrailsStore(s => s.data);
    const createBooking = useBookingsStore(s => s.create);
    
    const [localError, setLocalError] = useState<string | null>(null);

    const [booking, setBooking] = useState<Booking>(() => {
        const existing = bookings.find(booking => booking.id === bookingId);

        if(existing) return new Booking({ ...existing });

        if(!profile) {
            setLocalError('User must be logged in'); 
            return new Booking();
        }
        
        if(!trailId) {
            setLocalError('No trail ID provided');
            return new Booking();
        }

        const trail = trails.find(trail => trail.id === trailId);

        if(!trail) {
            setLocalError(`No trail found with id ${trailId}`);
            return new Booking();
        }

        const trailSummary = TrailLogic.toSummary(trail);
        const user = UserLogic.toSummary(profile)
        const emergencyContact = profile.emergencyContact;

        return new Booking({ 
            user, 
            emergencyContact, 
            trail: trailSummary 
        });
    });

    const onSetOffer = (offer: Offer) => {
        try {
            setBooking(prev => 
                produce(prev, (draft) => {
                    BookingLogic.setOffer(draft, offer);
                })
            );
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting offer')
        }
    }

    const onPayOffer = () => {
        try {
            // TODO connect to gateway and get the receipt
            const payment = new Payment();
            const summary = PaymentLogic.toSummary(payment);
            setBooking(prev => 
                produce(prev, (draft) => {
                    BookingLogic.toPay(draft, summary);
                })
            )
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting payment')
        }
    }

    const onCompleteBook = async () => {
        // TODO add booking information validation 
        console.log(booking);
        await createBooking(booking)
        console.error('UNIMPLEMENTED FUNCTION');
    }

    const onUpdatePress = (params: TEdit<Booking>) => {
        const { section, id, value } = params;

        console.log(params);
        try {
            setBooking(prev => 
                produce(prev, (draft) => {                
                    if(section === 'root'){
                        draft[id] = value;
                    } else {
                        draft[section][id] = value
                    }
                })
            )
        } catch (error) {
            setLocalError(`Failed updating ${String(section)} : ${id}`)
        }
    }

    const onCancelBookingPress = async (booking: Booking, reason: string) => {
        try {
            if(!booking)
                throw new Error('No booking selected');
            
            if(!reason)
                throw new Error('Cancellation reason is required'); 
        
            booking.status = 'for-cancellation';
            booking.cancellationReason = reason;
            booking.cancelledBy = profile?.id || 'unknown';
            
            console.log(booking);
            const created = await createBooking(booking);
            
            if(!created)
                throw new Error('Failed to cancel booking');

            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed cancelling booking')  
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
        onCancelBookingPress
    }
}