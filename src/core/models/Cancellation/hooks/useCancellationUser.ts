import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { createCancellationRequest } from "@/src/core/models/Cancellation/CancellationFactory";
import { CancellationRequest } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore.web";
import { useState } from "react";

/**
 * Hook to fetch a specific cancellation item
 * @param id 
 */
export function useCancellationUser(cancellationId: string) {
    const { profile } = useAuthHook();
    const [request, setRequest] = useState<CancellationRequest | null>(null);
    
    const userRequests = useCancellationStore(s => s.userCancellations);
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
        } 

        return {
            submitCancellationRequest,
            userRequests
        }
        
    }
}