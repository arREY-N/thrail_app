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
export function payBooking(params: UsePayBookingParams): IPayment<Date> {

    /**
     * Raven
     * TODO: connect payment gateway here and send a receipt based on the IPayment<Date> structure
     * Revise the function parameters if needed to accommodate the payment gateway's requirements.
     */


    const response: IPayment<Date> = {
        gateway: "sample_gateway",
        gatewayId: "gateway_123",
        referenceCode: new Date().getTime().toString(),
        status: "pending",
        refundableUntil: new Date(),
        amount: params.amount,
        createdAt: new Date(),
    }
    
    return response;
}

export function refundBooking(params: UsePayBookingParams): IPayment<Date> {

    /**
     * Raven
     * TODO: connect payment gateway here and send a receipt based on the IPayment<Date> structure
     * Revise the function parameters if needed to accommodate the payment gateway's requirements.
     */


    const response: IPayment<Date> = {
        gateway: "sample_gateway",
        gatewayId: "gateway_123",
        referenceCode: new Date().getTime().toString(),
        status: "pending",
        refundableUntil: new Date(),
        amount: params.amount,
        createdAt: new Date(),
    }
    
    return response;
}