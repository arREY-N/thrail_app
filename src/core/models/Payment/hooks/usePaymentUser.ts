import { functions } from "@/src/core/config/Firebase";
import { UsePayBookingParams } from "@/src/core/models/Booking/Booking";
import { httpsCallable } from "firebase/functions";

export function usePaymentUser() {
    const payBooking = async (params: UsePayBookingParams) => {
        const createPaymongoCheckout = httpsCallable(functions, 'createPaymongoCheckout');

        const response = await createPaymongoCheckout({
            amount: params.amount,
            type: params.type,
            returnUrl: params.returnUrl,
            bookingId: params.bookingId,
            userId: params.userId
        });

        return response.data;
    }

    return {
        payBooking
    }
}