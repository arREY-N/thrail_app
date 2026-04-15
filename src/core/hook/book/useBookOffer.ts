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
import { useGroupStore } from "@/src/core/stores/groupStores/groupStoreCreator";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { router } from "expo-router";
import { produce } from "immer";
import { useEffect, useState } from "react";

export type UseBookOfferParams = {
    bookingId?: string;
    trailId?: string;
    offerId?: string;
}

export default function useBookOffer(params: UseBookOfferParams = {}) {
    const { bookingId, trailId, offerId } = params;

    const { profile } = useAuthHook();

    const bookings = useBookingsStore(s => s.userBookings);
    const fetchOffer = useOffersStore(s => s.fetchOfferById);
    const load = useBookingsStore(s => s.load); 

    const error = useBookingsStore(s => s.error);
    const isLoading = useBookingsStore(s => s.isLoading);
    const trails = useTrailsStore(s => s.data);
    const createBooking = useBookingsStore(s => s.create);
    const joinGroup = useGroupStore(s => s.joinGroup);
    const checkGroupExists = useGroupStore(s => s.checkGroupExists);

    const [localError, setLocalError] = useState<string | null>(null);

    const [booking, setBooking] = useState<Booking | null>(null);
    
        // const [booking, setBooking] = useState<Booking>(() => {
    //     const existing = bookings.find(booking => booking.id === bookingId);

    //     if(existing) return new Booking({ ...existing });

    //     if(!profile) {
    //         setLocalError('User must be logged in'); 
    //         return new Booking();
    //     }
        
    //     if(!trailId) {
    //         setLocalError('No trail ID provided');
    //         return new Booking();
    //     }

    //     const trail = trails.find(trail => trail.id === trailId);

    //     if(!trail) {
    //         setLocalError(`No trail found with id ${trailId}`);
    //         return new Booking();
    //     }

    //     const trailSummary = TrailLogic.toSummary(trail);
    //     const user = UserLogic.toSummary(profile)
    //     const emergencyContact = profile.emergencyContact;

    //     return new Booking({ 
    //         user, 
    //         emergencyContact, 
    //         trail: trailSummary 
    //     });
    // });

    useEffect(() => {
        const fetch = async () => {

            try {
                console.log('in here')
                let booking = null;
    
                console.log('Bookings available in store:', bookings);
                
                if(bookings.length === 0 && profile) {
                    load(profile.id);
                }
    
                if(offerId) {
                    console.log('Looking for booking with offerId:', offerId);
                    booking = bookings.find(booking => booking.offer.id === offerId);
                    
                    if(!booking)
                        throw new Error ('Failed to fetch offer for booking');
                } else if (bookingId) {
                    console.log('Looking for booking with bookingId:', bookingId);
                    booking = bookings.find(booking => booking.id === bookingId);   
                    if(!booking)
                        throw new Error ('Failed to fetch booking by ID');
                } else if (trailId) {
                    console.log('Looking for booking with trailId:', trailId);
                    const trail = trails.find(trail => trail.id === trailId);
    
                    if(!trail)
                        throw new Error(`No trail found with id ${trailId}`);
                    
                    if(!profile) {
                        throw new Error('User must be logged in'); 
                    }
    
                    booking = new Booking({ 
                        user: UserLogic.toSummary(profile), 
                        emergencyContact: profile.emergencyContact, 
                        trail: TrailLogic.toSummary(trail) 
                    });
                }
                
                console.log('Setting booking in useBookOffer hook:', booking);
                setBooking(new Booking({ ...booking }));
            } catch (error) {
                setLocalError((error as Error).message || 'Failed to fetch offer for booking');
            }
        }

        fetch();
    }, [offerId, bookingId, trailId])

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

    const onPayOffer = (amount: number) => {
        try {
            // TODO connect to gateway and get the receipt
            if(!booking)
                throw new Error('No booking found');

            const payment = new Payment();
            const summary = PaymentLogic.toSummary(payment);
            setBooking(prev => 
                produce(prev, (draft) => {
                    if(!draft) return;
                    BookingLogic.toPay(draft, summary);
                })
            )
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting payment')
        }
    }

    const onCompleteBook = async (): Promise<boolean> => {
        try {
            
            if(!profile)
                throw new Error('No user found');
    
            if(!booking)
                throw new Error('No booking found');

            const offer = await fetchOffer(booking.offer.id);
    
            if(!offer) 
                throw new Error('Offer not found for booking');
    
            const finalBooking = new Booking({
                ...booking,
                trail: offer.trail,
                user: UserLogic.toSummary(profile),
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
        onCancelBookingPress,
        getBookOffer,
    }
}