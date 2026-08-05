import { useAuthHook } from "@/src/core/hook/user/useAuthHook"
import { CancellationRepo } from "@/src/core/init/repositories"
import { createCancellationRequest } from "@/src/core/models/Cancellation/Cancellation"
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation"
import { useState } from "react"

type CancellationRequest = Required<Pick<Cancellation, 'reason' | 'offerId' | 'businessId' | 'bookingId'>>

export default function useCancellation() {
    const { profile } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const [request, setRequest] = useState<CancellationRequest | null>(null);

    const submitCancellationRequest = async (request: CancellationRequest) => {
        try {
    
            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }
    
            const cancellationRequest = createCancellationRequest(
                { ...request, userId: profile.id }
            ); 

            console.log("Cancellation Request Created:", cancellationRequest);

            setRequest(cancellationRequest);

            await CancellationRepo.write(request.businessId, cancellationRequest)
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