import { useAuthHook } from "@/src/core/hook/user/useAuthHook"
import { createCancellationRequest } from "@/src/core/models/Cancellation/Cancellation"
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation"
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore"
import { useState } from "react"

type CancellationRequest = Required<Pick<Cancellation, 'reason' | 'offerId' | 'businessId' | 'bookingId'>>

export default function useCancellation() {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const [request, setRequest] = useState<CancellationRequest | null>(null);
    
    const write = useCancellationStore(s => s.write);

    const submitCancellationRequest = async (request: CancellationRequest) => {
        try {
            
            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(profile.role === "admin") {
                throw new Error("Only users can submit cancellation requests.");
            }
    
            const cancellationRequest = createCancellationRequest(
                { 
                    ...request, 
                    cancelledBy: "user", 
                    userId: profile.id 
                }
            ); 

            console.log("Cancellation Request Created:", cancellationRequest);

            setRequest(cancellationRequest);

            await write(request.businessId, cancellationRequest)
        } catch (error) {
            console.error("Error submitting cancellation request:", (error as Error).message);
            setLocalError((error as Error).message || "An unexpected error occurred.");
        }
        
    }
    
    return {
        localError,
        request,
        submitCancellationRequest
    }
}