// TODO
// Move functions in useApprovedBooking() related to 
// admin actions to processing user bookings to useBookingAdmin.ts

import { refundBooking } from "@/src/core/hook/book/usePayBooking";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking, BookingLogic, newBooking, Requirements, useBookingsStore } from "@/src/core/models/Booking/Booking";


import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";

import { User } from "@/src/core/models/User/User";
import { UserRepository } from "@/src/core/repositories/userRepository";
import { catchError } from "@/src/core/utility/errorFormatter";
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
    const offerIsLoading = useOfferStore(s => s.isLoading);
    const offerError = useOfferStore(s => s.error);
    const [localError, setLocalError] = useState<string | null>(null);

    const offers = useOfferStore(s => s.businessOffers);
    const bookings = useBookingsStore(s => s.bookingByOffer[offerId] || []);
    const loadOffer = useOfferStore(s => s.fetchOfferById);
    const loadBooking = useBookingsStore(s => s.loadById);
    const create = useBookingsStore(s => s.create);

    const [offer, setOffer] = useState<Offer | null>(offers.find(o => o.id === offerId) || null);
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
                    catchError(e as Error, 'writingError', 'onFetchHikerProfile()');
                }
            } else {
                setHikerProfile(null);
            }
        };

        console.log('running line 54');
        fetchHiker();
    }, [booking?.user?.id]);

    useEffect(() => {
        setLocalError(null);
        try {
            console.log('running line 61');
            if (offerId && bookingId) {
                loadOffer(offerId);
                loadBooking(bookingId);
            }
        } catch (error) {
            catchError(error as Error, 'writingError', 'onLoadOfferOrBooking()');
            setLocalError((error as Error).message || 'Failed to load offer or booking');
        }
    }, [offerId, bookingId]);

    useEffect(() => {
        try {
            console.log('running line 74');
            if (offerId) {
                setOffer(offers.find(o => o.id === offerId) || null);
            }

            if (bookingId) {
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
                    setBooking(newBooking({ ...b, documents: normalizedDocs }));
                } else {
                    setBooking(null);
                }
            }
        } catch (error) {
            catchError(error as Error, 'writingError', 'onSetOfferOrBooking()');
            setLocalError((error as Error).message || 'Failed to set offer or booking');
        }
    }, [offerId, bookingId]);

    const onApproveBooking = async (
        validatedDocuments: Requirements[],
        personalVerifiedAt?: Date | null,
        emergencyVerifiedAt?: Date | null
    ) => {
        try {
            if (!booking) throw new Error('Booking not found');

            const approvedBook = newBooking({
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

            console.log('Attempting to approve booking: ', approvedBook);

            if (!BookingLogic.checkDocuments(approvedBook)) {
                setLocalError('Cannot approve booking with pending documents. Please validate all documents first.');
                return;
            }

            const success = await create(approvedBook, true);
            console.log('Status updated to for-payment: ', approvedBook);

            if (!success) {
                setLocalError('Failed to approve booking');
                return;
            }

            // Sync the hiker's profile and emergency contact profile if they exist
            // WRONG USE CASE
            // 
            // Sync upon submission of reservation not in approval
            // Admins do not have permissions to edit users' profiles.

            router.back();

        } catch (error) {
            catchError(error as Error, 'writingError', 'onApproveBooking()');
            setLocalError((error as Error).message || 'Failed to approve booking');
        }
    }

    const onConfirmPayment = async () => {
        try {
            if (!booking) throw new Error('Booking not found');

            if (booking.status !== 'paid' && booking.status !== 'downpayment') {
                throw new Error('Booking is not ready to be confirmed');
            }

            const completedBook = newBooking({
                ...booking,
                status: 'completed'
            });

            const success = await create(completedBook, true);
            if (!success) {
                setLocalError('Failed to finalize booking to completed status.');
                return;
            }

            router.back();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onConfirmPayment()');
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
            if (!reason) throw new Error('Rejection reason is required');
            if (!booking) throw new Error('Booking not found');
            if (!profile) {
                setLocalError('Admin must be logged in to reject a booking');
                return;
            }

            const rejectedBook = newBooking({
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

            if (!BookingLogic.checkDocuments(rejectedBook)) {
                setLocalError('Cannot reject booking with pending documents. Please validate all documents first.');
                return;
            }

            const success = await create(rejectedBook, true);
            if (!success) {
                setLocalError('Failed to reject booking');
                return;
            }

            // Sync the hiker's profile and emergency contact profile if they exist
            // WRONG USE CASE
            // 
            // Sync upon submission of reservation not in approval
            // Admins do not have permissions to edit users' profiles.

            router.back();
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRejectBooking()');
            setLocalError((error as Error).message || 'Failed to reject booking');
        }
    }

    const onRescheduleBooking = (newOffer: Offer) => {
        try {
            if (!booking) throw new Error('Booking not found');
            if (!newOffer) throw new Error('A new offer must be provided to reschedule');

            if (newOffer.price !== booking.offer.price) {
                alert(`The new offer costs ${newOffer.price} while the old one is ${booking.offer.price}`)
            }

            const rescheduledBook = newBooking({
                ...booking,
                offer: {
                    date: newOffer.date,
                    price: newOffer.price,
                    id: newOffer.id,
                }
            });
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRescheduleBooking()');
            setLocalError((error as Error).message || 'Failed to reschedule booking');
        }
    }

    const onRefund = async (refundPercentage: 'full' | 'partial' = 'full') => {
        try {
            if (!booking) throw new Error('Booking not found');

            const totalAmountPaid = booking.payment?.reduce((total, payment) => total + payment.amount, 0) || 0;

            if (totalAmountPaid === 0) throw new Error('No payment found for this booking');

            if (role !== 'admin') throw new Error('Only admins can refund bookings');

            await refundBooking({
                amount: totalAmountPaid,
                bookingId: booking.id,
                userId: booking.user.id,
                type: refundPercentage,
                returnUrl: ''
            });

            router.back();

        } catch (error) {
            catchError(error as Error, 'writingError', 'onRefund()');
            setLocalError((error as Error).message || 'Failed to refund booking');
        }
    }

    // TODO: implement cancel function for unpaid bookings
    const onCancelUnpaid = async () => {
        try {
            if (!booking) throw new Error('Booking not found');
            if (role !== 'admin') throw new Error('Only admins can cancel bookings');

            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                "Placeholder Active",
                "BACKEND: Insert `cancelBooking` Cloud Function call here."
            );

            router.back();

        } catch (error) {
            catchError(error as Error, 'writingError', 'onCancelUnpaid()');
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

// try {
//     if (hikerProfile) {
//         const updatedHiker = new User({
//             ...hikerProfile,
//             phoneVerifiedAt: personalVerifiedAt !== undefined ? personalVerifiedAt : hikerProfile.phoneVerifiedAt,
//             emergencyContact: hikerProfile.emergencyContact ? {
//                 ...hikerProfile.emergencyContact,
//                 phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : hikerProfile.emergencyContact.phoneVerifiedAt,
//             } : undefined
//         });
//         await UserRepository.write(updatedHiker);
//     }

//     if (booking.emergencyContact?.userId) {
//         const emergencyProfile = await UserRepository.fetchById(booking.emergencyContact.userId);
//         if (emergencyProfile) {
//             const updatedEmergency = new User({
//                 ...emergencyProfile,
//                 phoneVerifiedAt: emergencyVerifiedAt !== undefined ? emergencyVerifiedAt : emergencyProfile.phoneVerifiedAt
//             });
//             await UserRepository.write(updatedEmergency);
//         }
//     }
// } catch (syncError) {
//     console.error('Failed to sync global profile verifications: ', syncError);
// }