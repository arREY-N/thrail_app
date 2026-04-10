import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Requirements } from "@/src/core/models/Booking/Booking.types";
import { BookingLogic } from "@/src/core/models/Booking/logic/Booking.logic";
import { Offer } from "@/src/core/models/Offer/Offer";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useUsersStore } from "@/src/core/stores/usersStore";
import { router } from "expo-router";
import { produce } from "immer";
import { useEffect, useState } from "react";

export type UseApproveBookingParams = {
    bookingId: string;
    offerId: string;
}

export default function useApproveBooking(params: UseApproveBookingParams) {
    const { bookingId, offerId } = params;
    const { profile, role } = useAuthHook();
    
    const bookingIsLoading = useBookingsStore(s => s.isLoading);
    const offerIsLoading = useOffersStore(s => s.isLoading);
    const offerError = useOffersStore(s => s.error);
    const [localError, setLocalError] = useState<string | null>(null);

    const offers = useOffersStore(s => s.businessOffers);
    const bookings = useBookingsStore(s => s.offerBookings);
    const loadOffer = useOffersStore(s => s.loadOffer);
    const loadBooking = useBookingsStore(s => s.loadById);
    const create = useBookingsStore(s => s.create);
    const fetchUser = useUsersStore(s => s.loadUser);
    const [offer, setOffer] = useState<Offer | null>(null);
    const [booking, setBooking] = useState<Booking | null>(null);


    useEffect(() => {
        setLocalError(null);
        try{
            if(offerId && bookingId) {
                loadOffer(offerId);
                loadBooking(bookingId);
            }
        } catch (error) {
            console.error('Error loading offer or booking: ', error);
            setLocalError((error as Error).message || 'Failed to load offer or booking');
        }
    }, [offerId, bookingId]);

    useEffect(() => {
        try {
            if(offerId){
                setOffer(offers.find(o => o.id === offerId) || null);
            }
    
            if(bookingId){
                setBooking(bookings.find(b => b.id === bookingId) || null);
            }
        } catch (error) {
            console.error('Error setting offer or booking: ', error);
            setLocalError((error as Error).message || 'Failed to set offer or booking');
        }
    },[offers, bookings, offerId, bookingId])

    const onValidateDocument = (document: Requirements, valid: 'approved' | 'rejected') => {
        try {
            if(!booking)
                throw new Error('Booking not found');
            setBooking(prev =>
                produce(prev, (draft) => {
                    if (!draft) return;

                    const docIndex = draft.documents.findIndex(d => d.name === document.name);

                    if (docIndex !== -1) {
                        draft.documents[docIndex].valid = valid; 
                        console.log(`Success: ${document.name} set to ${valid}`);
                    } else {
                        console.error('Document name not found in array');
                    }
                }
            ))
        } catch (error) {
            console.error('Error approving document: ', error);
            setLocalError((error as Error).message || 'Failed to approve document');
        }
        console.log('Validated booking: ', booking);
    }                   

    const onApproveBooking = async (forceApprove: boolean = false) => {
        try {
            if(!booking)
                throw new Error('Booking not found');

            if(booking.status === 'for-reservation' || forceApprove){
                setBooking(prev => 
                    produce(prev, (draft) => {
                        if(draft && draft.id === booking.id){
                            draft.status = 'for-payment';
                        }
                    })
                )

                if(forceApprove){
                    alert('Force approving booking');
                }

                if(!BookingLogic.checkDocuments(booking)){
                    setLocalError('Cannot reject booking with pending documents. Please validate all documents first.');
                    return;
                }
    
                const approvedBook = new Booking({
                    ...booking,
                    status: 'for-payment',
                })
                
                const success = await create(approvedBook, true)
                console.log('Status updated to for-payment: ', approvedBook);
                
                if(!success){
                    setLocalError('Failed to approve booking');
                    return;
                }
            
                router.back();
            } else {
                setLocalError(`Cannot approve this booking with status ${booking?.status}`);
            }

        } catch (error) {
            console.error('Error approving booking: ', error);
            setLocalError((error as Error).message || 'Failed to approve booking');
        }
    }

    const onRejectBooking = (reason: string, forceReject: boolean = false) => {  
        try {
            if(!reason)
                throw new Error('Rejection reason is required');
            
            if(!booking)
                throw new Error('Booking not found');

            if((booking.status === 'reservation-rejected' || booking.status === 'cancellation-rejected') && !forceReject){
                setLocalError(`Booking has been rejected by ${booking.cancelledBy} due to ${booking.cancellationReason}`);
                return;
            }

            if(!BookingLogic.checkDocuments(booking)){
                setLocalError('Cannot reject booking with pending documents. Please validate all documents first.');
                return;
            }

            if(forceReject){
                alert('Force rejecting booking');
            }
            
            setBooking(prev => 
                produce(prev, (draft) => {
                    if(draft){
                        draft.status = 'reservation-rejected';
                        draft.cancellationReason = reason;
                        draft.cancelledBy = `${profile?.firstname} ${profile?.lastname}`;
                    }
                })
            )   

            if(!profile){
                console.error('Admin must be logged in to reject a booking');
                setLocalError('Admin must be logged in to reject a booking');
                return;
            }
            const rejectedBook = new Booking({  
                ...booking,
                status: 'reservation-rejected',
                cancellationReason: reason,
                cancelledBy: `${profile?.firstname} ${profile?.lastname}`
            });
            console.log('Rejecting booking: ', rejectedBook)

            create(rejectedBook, true);
            router.back();
        } catch (error) {
            console.error('Error rejecting booking: ', error);
            setLocalError((error as Error).message || 'Failed to reject booking');
        }   
    }

    const onRescheduleBooking = (newOffer: Offer) => {
        try {
            if(!booking)
                throw new Error('Booking not found');

            if(!newOffer)
                throw new Error('A new offer must be provided to reschedule');

            if(newOffer.price !== booking.offer.price){
                alert(`The new offer costs ${newOffer.price} while the old one is ${booking.offer.price}`)
            }

            const rescheduledBook = new Booking({
                ...booking,
                offer: {
                    date: newOffer.date,
                    price: newOffer.price,
                    id: newOffer.id,
                }
            })

            console.log('Original: ', booking)
            console.log('Reschedule: ', rescheduledBook)
        } catch (error) {
            setLocalError((error as Error).message || 'Failed to reschedule booking');
        }
    }

    const onRefund = () => {
        try {
            if(!booking) 
                throw new Error('Booking not found');

            const totalAmountPaid = booking.payment.reduce((total, payment) => total + payment.amount, 0);

            if(totalAmountPaid === 0)
                throw new Error('No payment found for this booking');
            
            if(role !== 'admin')
                throw new Error('Only admins can refund bookings');


            alert(`To refund: ${totalAmountPaid}`);
        } catch (error) {
            setLocalError((error as Error).message || 'Failed to refund booking');  
        }
    }

    return {
        error: offerError || localError,
        isLoading: bookingIsLoading || offerIsLoading,
        offer,
        offers,
        booking,
        onRefund,
        onApproveBooking,
        onRejectBooking,
        onRescheduleBooking,
        onValidateDocument,
    }
}