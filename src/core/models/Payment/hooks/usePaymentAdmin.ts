import { functions } from "@/src/core/config/Firebase";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking, IPayment } from "@/src/core/models/Booking/Booking";
import { catchError } from "@/src/core/utility/errorFormatter";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";

export function usePaymentAdmin() {
    const { profile, businessId, role } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);

    const onRefund = async (booking: Booking, refundPercentage: 'full' | 'partial' = 'full') => {
        try {
            if (!booking) throw new Error('Booking not found');

            const totalAmountPaid = booking.payment?.reduce((total, payment) => total + payment.amount, 0) || 0;

            if (totalAmountPaid === 0) throw new Error('No payment found for this booking');

            if (role !== 'admin') throw new Error('Only admins can refund bookings');


            const refundBookingFunction = httpsCallable(functions, 'refundBooking');

            // Call the actual Firebase Cloud Function to process the PayMongo refund
            await refundBookingFunction({
                bookingId: booking.id,
                userId: booking.user.id,
                reason: 'requested_by_admin',
                refundPercentage: refundPercentage
            });

            // const response: IPayment<Date> = {
            //     gateway: "paymongo",
            //     sessionId: "refund_processing",
            //     referenceCode: null,
            //     status: "refunded",
            //     refundableUntil: new Date(),
            //     amount: totalAmountPaid,
            //     createdAt: new Date(),
            // }

            return booking;
        } catch (error) {
            catchError(error as Error, 'writingError', 'onRefund()');
            setLocalError((error as Error).message || 'Failed to refund booking');
        }
    }

    const refundBooking = async (booking: Booking, refundPercentage: 'full' | 'partial' = 'full') => {
        try {
            if (!profile || !businessId || role !== 'admin') {
                throw new Error('Only admins can authorize a refund');
            }

            if (!booking) {
                throw new Error('Booking not found');
            }

            const totalAmountPaid = booking.payment?.reduce((total, payment) => total + payment.amount, 0) || 0;

            if (totalAmountPaid === 0) throw new Error('No payment found for this booking');



            const refundBookingFunction = httpsCallable(functions, 'refundBooking');

            await refundBookingFunction({
                amount: totalAmountPaid,
                bookingId: booking.id,
                userId: booking.user.id,
                type: refundPercentage,
                returnUrl: ''
            });

            const response: IPayment<Date> = {
                gateway: "paymongo",
                sessionId: "refund_processing",
                referenceCode: null,
                status: "refunded",
                refundableUntil: new Date(),
                amount: totalAmountPaid,
                createdAt: new Date(),
            }

            return response;

            // Check if there are payment records

            // If none, return the booking without any changes (no refund needed)

            // If there are payment records
            // 1. proceed with refund process
            // 2. update the booking object to reflect the refund status (e.g., set a 'refunded' flag or update payment records)
            // 3. return the updated booking object


        } catch (error) {
            setLocalError((error as Error).message);
            catchError((error as Error), 'localError', 'usePaymentRefund');
        }
    }

    return {
        onRefund,
        localError,
    }
}