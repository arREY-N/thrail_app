import { refundBooking } from "@/src/core/hook/book/usePayBooking";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Requirements } from "@/src/core/models/Booking/Booking.types";
import { BookingLogic } from "@/src/core/models/Booking/logic/Booking.logic";
import { Booking, createBooking } from "@/src/core/models/Booking/Ref_Booking";
import { Offer } from "@/src/core/models/Offer/Offer";
import { User } from "@/src/core/models/User/User";
import { UserRepository } from "@/src/core/repositories/userRepository";
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
    const [hikerProfile, setHikerProfile] = useState<User | null>(null);

    // Fetch the hiker profile when the booking's user ID changes
    useEffect(() => {
        const fetchHiker = async () => {
            if (booking?.user?.id) {
                try {
                    const u = await UserRepository.fetchById(booking.user.id);
                    if (u) setHikerProfile(new User(u));
                } catch (e) {
                    console.error('Error fetching hiker profile: ', e);
                }
            } else {
                setHikerProfile(null);
            }
        };
        fetchHiker();
    }, [booking?.user?.id]);

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
                    setBooking(createBooking({ ...b, documents: normalizedDocs }));
                } else {
                    setBooking(null);
                }
            }
        } catch (error) {
            console.error('Error setting offer or booking: ', error);
            setLocalError((error as Error).message || 'Failed to set offer or booking');
        }
    }, [offers, bookings, offerId, bookingId]);

    const onApproveBooking = async (
        validatedDocuments: Requirements[],
        personalVerifiedAt?: Date | null,
        emergencyVerifiedAt?: Date | null
    ) => {
        try {
            if(!booking) throw new Error('Booking not found');

            const approvedBook = createBooking({
                ...booking,
                user: {
                    ...booking.user,
                    phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : booking.user.phoneVerifiedAt,
                },
                emergencyContact: booking.emergencyContact ? {
                    ...booking.emergencyContact,
                    phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : booking.emergencyContact.phoneVerifiedAt,
                } : {
                    name: "",
                    contactNumber: "",
                },
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

            // Sync the hiker's profile and emergency contact profile if they exist
            try {
                if (hikerProfile) {
                    const updatedHiker = new User({
                        ...hikerProfile,
                        phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : hikerProfile.phoneVerifiedAt,
                        emergencyContact: hikerProfile.emergencyContact ? {
                            ...hikerProfile.emergencyContact,
                            phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : hikerProfile.emergencyContact.phoneVerifiedAt,
                        } : undefined
                    });
                    await UserRepository.write(updatedHiker);
                }
                
                if (booking.emergencyContact?.userId) {
                    const emergencyProfile = await UserRepository.fetchById(booking.emergencyContact.userId);
                    if (emergencyProfile) {
                        const updatedEmergency = new User({
                            ...emergencyProfile,
                            phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : emergencyProfile.phoneVerifiedAt
                        });
                        await UserRepository.write(updatedEmergency);
                    }
                }
            } catch (syncError) {
                console.error('Failed to sync global profile verifications: ', syncError);
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

            const completedBook = createBooking({
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

    const onRejectBooking = async (
        reason: string, 
        validatedDocuments: Requirements[],
        personalVerifiedAt?: Date | null,
        emergencyVerifiedAt?: Date | null
    ) => {  
        try {
            if(!reason) throw new Error('Rejection reason is required');
            if(!booking) throw new Error('Booking not found');
            if(!profile) {
                setLocalError('Admin must be logged in to reject a booking');
                return;
            }

            const rejectedBook = createBooking({  
                ...booking,
                user: {
                    ...booking.user,
                    phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : booking.user.phoneVerifiedAt,
                },
                emergencyContact: booking.emergencyContact ? {
                    ...booking.emergencyContact,
                    phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : booking.emergencyContact.phoneVerifiedAt,
                } : {
                    name: "",
                    contactNumber: "",
                },
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

            // Sync the hiker's profile and emergency contact profile if they exist
            try {
                if (hikerProfile) {
                    const updatedHiker = new User({
                        ...hikerProfile,
                        phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : hikerProfile.phoneVerifiedAt,
                        emergencyContact: hikerProfile.emergencyContact ? {
                            ...hikerProfile.emergencyContact,
                            phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : hikerProfile.emergencyContact.phoneVerifiedAt,
                        } : undefined
                    });
                    await UserRepository.write(updatedHiker);
                }
                
                if (booking.emergencyContact?.userId) {
                    const emergencyProfile = await UserRepository.fetchById(booking.emergencyContact.userId);
                    if (emergencyProfile) {
                        const updatedEmergency = new User({
                            ...emergencyProfile,
                            phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : emergencyProfile.phoneVerifiedAt
                        });
                        await UserRepository.write(updatedEmergency);
                    }
                }
            } catch (syncError) {
                console.error('Failed to sync global profile verifications: ', syncError);
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

            const rescheduledBook = createBooking({
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
        hikerProfile,
        onRefund,
        onApproveBooking,
        onConfirmPayment,
        onRejectBooking,
        onRescheduleBooking,
        onCancelUnpaid
    }
}