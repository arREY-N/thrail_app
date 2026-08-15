import { Booking } from "@/src/core/models/Booking/interfaces/IBooking";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";

export const updateBookingOnCancellation = (
    booking: Booking,
    request: Cancellation,
    approved: boolean,
): Booking => {
    const updatedBooking: Booking = {
        ...booking,
        updatedAt: new Date(),
        status: approved
            ? "refund" 
            : booking.status,
    }

    if(approved) {
        updatedBooking.cancellationReason = request.reason;
        updatedBooking.cancelledBy = request.cancelledBy;
    }

    return updatedBooking;
}