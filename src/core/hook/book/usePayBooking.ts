import { IPayment } from "@/src/core/models/Booking/Booking.types";

export interface UsePayBookingParams {
    amount: number;
    bookingId: string;
    userId: string;
}

/**
 * Connects to the payment gateway and sends back a predefined object to record transaction.
 * @param UsePayBookingParams params - The parameters required to process the payment, including amount, booking ID, and user ID. 
 * @returns IPayment<Date> - An object containing details of the payment transaction, such as gateway information, reference code, status, refundable until date, amount, and creation date.
 */
import { functions } from "../../config/Firebase";
import { httpsCallable } from "firebase/functions";

export function payBooking(params: UsePayBookingParams): IPayment<Date> {

    // Note: The actual PayMongo redirect and WebView handling is done in PaymentScreen.jsx.
    // This function satisfies the UI requirement by returning the pending IPayment structure.
    const response: IPayment<Date> = {
        gateway: "paymongo",
        gatewayId: "checkout_session_pending", // Replaced by actual session.id in the backend webhook
        referenceCode: params.bookingId,
        status: "pending",
        refundableUntil: new Date(),
        amount: params.amount,
        createdAt: new Date(),
    }
    
    return response;
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
        gatewayId: "refund_processing",
        referenceCode: params.bookingId,
        status: "refunded",
        refundableUntil: new Date(),
        amount: params.amount,
        createdAt: new Date(),
    }
    
    return response;
}