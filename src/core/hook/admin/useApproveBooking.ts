import { refundBooking } from "@/src/core/hook/book/usePayBooking";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Requirements } from "@/src/core/models/Booking/Booking.types";
import { BookingLogic } from "@/src/core/models/Booking/logic/Booking.logic";
import { Offer } from "@/src/core/models/Offer/Offer";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

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
    const bookings = useBookingsStore(s => s.bookingByOffer[offerId] || []);
    const loadOffer = useOffersStore(s => s.loadOffer);
    const loadBooking = useBookingsStore(s => s.loadById);
    const create = useBookingsStore(s => s.create);
    
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
                const b = bookings.find(b => b.id === bookingId);
                if (b) {
                    let normalizedDocs = b.documents;
                    if (!Array.isArray(b.documents)) {
                        normalizedDocs = Object.entries(b.documents || {}).map(([key, value]: [string, any]) => ({
                            name: value.name || key,
                            file: value.file || '',
                            valid: value.valid || 'pending'
                        }));
                    }
                    setBooking(new Booking({ ...b, documents: normalizedDocs }));
                } else {
                    setBooking(null);
                }
            }
        } catch (error) {
            console.error('Error setting offer or booking: ', error);
            setLocalError((error as Error).message || 'Failed to set offer or booking');
        }
    }, [offers, bookings, offerId, bookingId]);

    const onApproveBooking = async (validatedDocuments: Requirements[]) => {
        try {
            if(!booking) throw new Error('Booking not found');

            const approvedBook = new Booking({
                ...booking,
                documents: validatedDocuments, 
                status: 'for-payment',
            });
            
            if(!BookingLogic.checkDocuments(approvedBook)){
                setLocalError('Cannot approve booking with pending documents. Please validate all documents first.');
                return;
            }
            
            const success = await create(approvedBook, true);
            console.log('Status updated to for-payment: ', approvedBook);
            
            if(!success){
                setLocalError('Failed to approve booking');
                return;
            }
        
            router.back();

        } catch (error) {
            console.error('Error approving booking: ', error);
            setLocalError((error as Error).message || 'Failed to approve booking');
        }
    }

    const onConfirmPayment = async () => {
        try {
            if(!booking) throw new Error('Booking not found');
            
            if(booking.status !== 'paid' && booking.status !== 'downpayment') {
                throw new Error('Booking is not ready to be confirmed');
            }

            const completedBook = new Booking({
                ...booking,
                status: 'completed'
            });

            const success = await create(completedBook, true);
            if(!success) {
                setLocalError('Failed to finalize booking to completed status.');
                return;
            }

            router.back();
        } catch (error) {
            console.error('Error confirming payment: ', error);
            setLocalError((error as Error).message || 'Failed to confirm payment');
        }
    }

    const onRejectBooking = async (reason: string, validatedDocuments: Requirements[]) => {  
        try {
            if(!reason) throw new Error('Rejection reason is required');
            if(!booking) throw new Error('Booking not found');
            if(!profile) {
                setLocalError('Admin must be logged in to reject a booking');
                return;
            }

            const rejectedBook = new Booking({  
                ...booking,
                documents: validatedDocuments, 
                status: 'reservation-rejected',
                cancellationReason: reason,
                cancelledBy: `${profile?.firstname} ${profile?.lastname}`
            });

            if(!BookingLogic.checkDocuments(rejectedBook)){
                setLocalError('Cannot reject booking with pending documents. Please validate all documents first.');
                return;
            }

            const success = await create(rejectedBook, true);
            if(!success){
                setLocalError('Failed to reject booking');
                return;
            }

            router.back();
        } catch (error) {
            console.error('Error rejecting booking: ', error);
            setLocalError((error as Error).message || 'Failed to reject booking');
        }   
    }

    const onRescheduleBooking = (newOffer: Offer) => {
        try {
            if(!booking) throw new Error('Booking not found');
            if(!newOffer) throw new Error('A new offer must be provided to reschedule');

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
            });
        } catch (error) {
            setLocalError((error as Error).message || 'Failed to reschedule booking');
        }
    }

    const onRefund = async (refundPercentage: 'full' | 'partial' = 'full') => {
        try {
            if(!booking) throw new Error('Booking not found');

            const totalAmountPaid = booking.payment?.reduce((total, payment) => total + payment.amount, 0) || 0;

            if(totalAmountPaid === 0) throw new Error('No payment found for this booking');
            
            if(role !== 'admin') throw new Error('Only admins can refund bookings');

            await refundBooking({
                amount: totalAmountPaid,
                bookingId: booking.id,
                userId: booking.user.id,
                type: refundPercentage,
                returnUrl: ''
            });

            router.back();

        } catch (error) {
            setLocalError((error as Error).message || 'Failed to refund booking');  
        }
    }

    // TODO: implement cancel function for unpaid bookings
    const onCancelUnpaid = async () => {
        try {
            if(!booking) throw new Error('Booking not found');
            if(role !== 'admin') throw new Error('Only admins can cancel bookings');

            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                "Placeholder Active", 
                "BACKEND: Insert `cancelBooking` Cloud Function call here."
            );

            router.back();

        } catch (error) {
            console.error('Error cancelling unpaid booking: ', error);
            setLocalError((error as Error).message || 'Failed to cancel booking');
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
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onCancelUnpaid
    }
}