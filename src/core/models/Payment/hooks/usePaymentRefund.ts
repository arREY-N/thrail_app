import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";

export function usePaymentRefund() {
    const { profile, businessId, role } = useAuthHook();

    const authorizeRefund = async (booking: Booking): Promise<Booking> => {
        // Check if current user is authorized (only admins are authorized to issue refunds). 
        
        // Throw an error if not authorized.

        // Check if there are payment records

        // If none, return the booking without any changes (no refund needed)

        // If there are payment records
        // 1. proceed with refund process
        // 2. update the booking object to reflect the refund status (e.g., set a 'refunded' flag or update payment records)
        // 3. return the updated booking object

        return booking;
    }

    return {
        authorizeRefund
    }
}