import { functions } from "@/src/core/config/Firebase";
import { Booking } from "@/src/core/models/Booking/Booking";
import { useAuthHook } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { RefundType } from "@/src/features/Admin/screens/Booking/components/AdminRefundModal";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";

export function usePaymentAdmin() {
    const { role } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const [isRefunding, setIsRefunding] = useState<boolean>(false);

    const onRefund = async (
        booking: Booking, 
        refundType: RefundType, 
        customAmount?: number
    ) => {
        try {
            if (!booking) throw new Error('Booking not found');

            const totalAmountPaid = booking.payment?.reduce((total, payment) => total + payment.amount, 0) || 0;

            if (totalAmountPaid === 0) throw new Error('No payment found for this booking');

            if (role !== 'admin') throw new Error('Only admins can refund bookings');

            setIsRefunding(true);
            setLocalError(null);

            const refundBookingFunction = httpsCallable(functions, 'refundBooking');

            // Call the actual Firebase Cloud Function to process the PayMongo refund
            const payload: {
                bookingId: string;
                userId: string;
                reason: string;
                refundPercentage?: number;
                customAmount?: number;
            } = {
                bookingId: booking.id,
                userId: booking.user.id,
                reason: 'requested_by_admin',
            };

            if (refundType === 'custom' && typeof customAmount === 'number') {
                payload.customAmount = customAmount;
            } else {
                payload.refundPercentage = refundType === 'full' ? 100 : 10;
            }

            await refundBookingFunction(payload);
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRefund()');
            setLocalError((error as Error).message || 'Failed to refund booking');
            throw error;
        } finally {
            setIsRefunding(false);
        }
    };

    // const refundBooking = async (booking: Booking, refundPercentage: 'full' | 'partial' = 'full') => {
    //     try {
    //         if (!profile || !businessId || role !== 'admin') {
    //             throw new Error('Only admins can authorize a refund');
    //         }

    //         if (!booking) {
    //             throw new Error('Booking not found');
    //         }

    //         const totalAmountPaid = booking.payment?.reduce((total, payment) => total + payment.amount, 0) || 0;

    //         if (totalAmountPaid === 0) throw new Error('No payment found for this booking');



    //         const refundBookingFunction = httpsCallable(functions, 'refundBooking');

    //         await refundBookingFunction({
    //             amount: totalAmountPaid,
    //             bookingId: booking.id,
    //             userId: booking.user.id,
    //             type: refundPercentage,
    //             returnUrl: ''
    //         });

    //         const response: IPayment<Date> = {
    //             gateway: "paymongo",
    //             sessionId: "refund_processing",
    //             referenceCode: null,
    //             status: "refunded",
    //             refundableUntil: new Date(),
    //             amount: totalAmountPaid,
    //             createdAt: new Date(),
    //         }

    //         return response;

    //         // Check if there are payment records

    //         // If none, return the booking without any changes (no refund needed)

    //         // If there are payment records
    //         // 1. proceed with refund process
    //         // 2. update the booking object to reflect the refund status (e.g., set a 'refunded' flag or update payment records)
    //         // 3. return the updated booking object


    //     } catch (error) {
    //         setLocalError((error as Error).message);
    //         catchError((error as Error), 'localError', 'usePaymentRefund');
    //     }
    // }

    return {
        onRefund,
        localError,
        isRefunding,
    }
}