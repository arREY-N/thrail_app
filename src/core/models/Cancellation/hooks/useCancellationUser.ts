import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/BookingFactory";
import { useBookingDelete } from "@/src/core/models/Booking/hooks/useBookingDelete";
import { createCancellationRequest, newCancellation } from "@/src/core/models/Cancellation/CancellationFactory";
import { CancellationRequest } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { Offer } from "@/src/core/models/Offer/Offer";
import { catchError, logger } from "@/src/core/utility/errorFormatter";
import { useState } from "react";

/**
 * A custom hook that provides functionality for users to manage their 
 * cancellation requests. It allows users to create new cancellation 
 * requests, update the reason for existing requests, and cancel requests. 
 * The hook also manages the state of writing operations and any errors 
 * that may occur during these operations.
 */
export function useCancellationUser() {
    const { profile } = useAuthHook();
    
    const { cancelPendingBooking } = useBookingDelete();

    const [writingError, setWritingError] = useState<string | null>(null);
    
    const isWriting = useCancellationStore(s => s.isWriting);
    
    const write = useCancellationStore(s => s.write);
    const deleteCancellation = useCancellationStore(s => s.delete);
    
    /**
     * Allows users to submit a new cancellation request for a booking. 
     * This function checks if the user is authorized to make the request 
     * and if the offer date is valid before proceeding with the creation 
     * of the cancellation request.
     * @param request - An object containing the details of the cancellation 
     * request, including the booking ID, offer ID, business ID, and reason 
     * for cancellation. This object is used to create a new cancellation 
     * request in the system.
     * @param offerDate - The date of the offer associated with the booking 
     * that the user 
     */
    const cancelBooking = async (booking: Booking, reason: string) => {
        
        const request: CancellationRequest = {
            bookingId: booking.id,
            offerId: booking.offer.id,
            businessId: booking.business.id,
            reason: reason,
        }

        const offerDate = booking.offer.date;

        try {
            setWritingError(null);
            
            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(profile.role === "admin") {
                throw new Error("Only users can submit cancellation requests.");
            }
    
            if(offerDate <= new Date()) {
                throw new Error("Cannot cancel an expired offer.");
            }

            if(booking.status === "for-reservation") {
                await cancelPendingBooking(booking);
            } else {
                const cancellationRequest = createCancellationRequest({ 
                    ...request, 
                    cancelledBy: "user", 
                    userId: profile.id 
                }); 
    
                await write({
                    cancellation: cancellationRequest,
                    isAdmin: false
                })
            }

            // TODO: move this to admin hook for cancellation approval
            // const cancelBookingFn = httpsCallable(functions, 'cancelBooking');
            // await cancelBookingFn({
            //     bookingId: booking.id,
            //     userId: profile?.id || profile?.uid,
            //     reason: reason
            // });
        } catch (error) {
            catchError(error as Error, 'writingError', 'useCancellationUser');
            setWritingError(`Error submitting cancellation request: ${(error as Error).message}`);
        } 
    }
    
    /**
     * Allows users to update the reason for an existing cancellation request. 
     * This function ensures that the user is authorized to make the update and 
     * that the new reason is valid before proceeding with the update operation.
     * @param reason - The new reason for the cancellation request. 
     * This should be a non-empty string that explains why the user wants 
     * to cancel their booking.
     * @param oldRequest - The original cancellation request object 
     * that the user wants to update. This should contain all the details of 
     * the existing cancellation request, including the booking ID, offer ID, 
     * and any other relevant information.
     */
    const updateCancellationReason = async ({
        reason,
        oldRequest
    } : { 
        reason: string, 
        oldRequest: Cancellation 
    }) => {
        try {
            setWritingError(null);

            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(profile.role === "admin") {
                throw new Error("Only users can update cancellation requests.");
            }

            if(!reason || reason.trim() === "") {
                throw new Error("Cancellation reason cannot be empty.");
            }

            const updatedRequest: Cancellation = {
                ...oldRequest,
                reason,
                updatedAt: new Date(),
                status: "pending"
            };

            await write({
                cancellation: updatedRequest,
                oldCancellation: oldRequest,
                isAdmin: false
            });
        } catch (error) {
            catchError(error as Error, 'writingError', 'updateCancellationReason()');
            setWritingError(`Error updating cancellation request: ${(error as Error).message}`);
        }
    }

    /**
     * Allows users to cancel thir own cancellation requests, 
     * as long as the request is still pending 
     * @param request - Cancellation object submitted by the user
     */
    const cancelUserRequest = async (request: Cancellation) => {
        try {
            setWritingError(null);
            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            await deleteCancellation(request.businessId, request, profile.id);
        } catch (error) {
            catchError(error as Error, 'writingError', 'cancelRequest()');
            setWritingError(`Error cancelling request: ${(error as Error).message}`);
        }
    }

    /**
     * Allows users to approved cancellations made by admin for pre-approved
     * booking reservations.
     * @param request - The cancellation request object that contains 
     * details about the cancelled booking and the reason for cancellation. 
     * This object is used to identify the specific cancellation request that 
     * the user wants to approve.
     */
    const proceedToAdminCancellation = async (request: Cancellation) => {
        try {
            setWritingError(null);

            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(profile.role === "admin") {
                throw new Error("Only users can approve admin cancellation requests.");
            }

            if(request.cancelledBy !== "admin") {
                throw new Error("Only cancellations made by admins can be approved by users.");
            }

            const updatedRequest: Cancellation = newCancellation(
                request, 
                { status: "approved" }
            );

            await write({
                cancellation: updatedRequest,
                oldCancellation: request,
                isAdmin: false
            })
        } catch (error) {
            catchError(error as Error, 'writingError', 'approveAdminRequest()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
        }
    }

    /**
     * Allow users to proceed with rescheduling for a cancelled booking
     * @param request - The cancellation request object that contains details 
     * about the cancelled booking and the reason for cancellation.
     * @param newOffer - The new offer object that the user wants to reschedule 
     * to. This should contain details about the new booking offer, such as date, time, and any other relevant information.
     */
    const proceedToAdminReschedule = async (request: Cancellation, newOffer: Offer | null) => {
        try {
            setWritingError(null);

            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(!request || !newOffer) {
                throw new Error("Invalid cancellation request or new offer.");
            }
            
            logger('useCancellationUser()', 'Rescheduling for cancellation request: ', request);
            logger('useCancellationUser()', 'New offer for rescheduling: ', newOffer);
            // create a reschedule request for the admin to approve

            throw new Error("Rescheduling functionality is not yet implemented. This function is a placeholder for future development.");
        } catch (error) {
            catchError(error as Error, 'writingError', 'rescheduleAdminRequest()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
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
    const onRefundBooking = async (booking: Booking, reason: string) => {
        try {
            throw new Error("Refund processing is not yet implemented. This function is a placeholder for future development.");    
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRefundBooking()');
            setWritingError((error as Error).message || "An unexpected error occurred.");
        }

        // try {
        //     if(!booking) throw new Error('No booking selected');
            
        //     const refundBookingFn = httpsCallable(functions, 'refundBooking');
        //     await refundBookingFn({
        //         bookingId: booking.id,
        //         userId: profile?.id || profile?.uid,
        //         reason: reason || 'User requested refund'
        //     });

        //     router.back();
        // } catch (error) {
        //     setLocalError((error as Error).message || 'Failed processing refund')  
        // }
    }

    return {
        cancelBooking,
        updateCancellationReason,
        cancelUserRequest,
        proceedToAdminCancellation,
        proceedToAdminReschedule,
        onRefundBooking,
        writingError,
        isWriting
    }
}


// TODO
// By @Zeed111
// To move in admin side for approval of cancellation requests
// /**
//  * Cancels a booking securely via Firebase Cloud Functions.
//  * Only works before payment is captured.
//  * 
//  * @param {Booking} booking - The booking object to cancel.
//  * @param {string} reason - The user's reason for cancellation.
//  * @returns {Promise<void>}
//  */
// const onCancelBookingPress = async (booking: Booking, reason: string) => {
//     try {
//         Alert.alert('This cancel booking function is the old procedure.');

//         if(!booking)
//             throw new Error('No booking selected');
        
//         if(!reason)
//             throw new Error('Cancellation reason is required'); 
    
//         const cancelBookingFn = httpsCallable(functions, 'cancelBooking');
//         await cancelBookingFn({
//             bookingId: booking.id,
//             userId: profile?.id || profile?.uid,
//             reason: reason
//         });

//         router.back();
//     } catch (error) {
//         setLocalError((error as Error).message || 'Failed cancelling booking')  
//     }
// }

// /**
//  * Requests a refund securely via Firebase Cloud Functions.
//  * Invokes PayMongo refund API and updates the booking status.
//  * 
//  * @param {Booking} booking - The booking object to refund.
//  * @param {string} reason - The user's reason for requesting a refund.
//  * @returns {Promise<void>}
//  */
// const onRefundBookingPress = async (booking: Booking, reason: string) => {
//     try {
//         if(!booking) throw new Error('No booking selected');
        
//         const refundBookingFn = httpsCallable(functions, 'refundBooking');
//         await refundBookingFn({
//             bookingId: booking.id,
//             userId: profile?.id || profile?.uid,
//             reason: reason || 'User requested refund'
//         });

//         router.back();
//     } catch (error) {
//         setLocalError((error as Error).message || 'Failed processing refund')  
//     }
// }