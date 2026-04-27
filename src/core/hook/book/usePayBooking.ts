import { IPayment } from "@/src/core/models/Booking/Booking.types";

export interface UsePayBookingParams {
    amount: number;
    bookingId: string;
    userId: string;
    type: string;
    returnUrl: string;
}

/**
 * Connects to the payment gateway and sends back a predefined object to record transaction.
 * @param UsePayBookingParams params - The parameters required to process the payment, including amount, booking ID, and user ID. 
 * @returns IPayment<Date> - An object containing details of the payment transaction, such as gateway information, reference code, status, refundable until date, amount, and creation date.
 */
import { functions } from "../../config/Firebase";
import { httpsCallable } from "firebase/functions";

export async function payBooking(params: UsePayBookingParams): Promise<any> {
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

export async function refundBooking(params: UsePayBookingParams): Promise<IPayment<Date>> {

    const refundBookingFunction = httpsCallable(functions, 'refundBooking');
    
    // Call the actual Firebase Cloud Function to process the PayMongo refund
    await refundBookingFunction({
        bookingId: params.bookingId,
        userId: params.userId,
        reason: 'requested_by_customer'
    });

    const response: IPayment<Date> = {
        gateway: "paymongo",
        sessionId: "refund_processing",
        referenceCode: null,
        status: "refunded",
        refundableUntil: new Date(),
        amount: params.amount,
        createdAt: new Date(),
    }
    
    return response;
}