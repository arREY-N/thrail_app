import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { createCancellationRequest } from "@/src/core/models/Cancellation/CancellationFactory";
import { CancellationRequest } from "@/src/core/models/Cancellation/interfaces/Cancellation.types";
import { Cancellation } from "@/src/core/models/Cancellation/interfaces/ICancellation";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useState } from "react";

/**
 * A custom hook that provides functionality for users to manage their cancellation requests. It allows users to create new cancellation requests, update the reason for existing requests, and cancel requests. The hook also manages the state of writing operations and any errors that may occur during these operations.
 */
export function useCancellationUser() {
    const { profile } = useAuthHook();
    
    const [writingError, setWritingError] = useState<string | null>(null);
    
    const isWriting = useCancellationStore(s => s.isWriting);
    
    const write = useCancellationStore(s => s.write);
    const deleteCancellation = useCancellationStore(s => s.delete);

    const newCancellationRequest = async (request: CancellationRequest, offerDate: Date) => {
        try {
            setWritingError(null);
            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(profile.role === "admin") {
                throw new Error("Only users can submit cancellation requests.");
            }
    
            if(offerDate <= new Date()) {
                throw new Error("Cannot cancel an expired offer.");
            }

            const cancellationRequest = createCancellationRequest(
                { 
                    ...request, 
                    cancelledBy: "user", 
                    userId: profile.id 
                }
            ); 

            console.log("Cancellation Request Created:", cancellationRequest);

            await write({
                cancellation: cancellationRequest,
                isAdmin: false
            })
            
        } catch (error) {
            console.log("Error writing cancellation request:", (error as Error).message);
            setWritingError(`Error submitting cancellation request: ${(error as Error).message}`);
        } 
    }
    
    const updateCancellationReason = async ({
        reason,
        oldRequest
    } : { 
        reason: string, 
        oldRequest: Cancellation 
    }) => {
        try {
            setWritingError(null);

            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            if(profile.role === "admin") {
                throw new Error("Only users can update cancellation requests.");
            }

            if(!reason || reason.trim() === "") {
                throw new Error("Cancellation reason cannot be empty.");
            }

            const updatedRequest: Cancellation = {
                ...oldRequest,
                reason,
                updatedAt: new Date(),
                status: "pending"
            };

            await write({
                cancellation: updatedRequest,
                oldCancellation: oldRequest,
                isAdmin: false
            });

        } catch (error) {
            console.log("Error updating cancellation request:", (error as Error).message);
            setWritingError(`Error updating cancellation request: ${(error as Error).message}`);
        }
    }

    const cancelRequest = async (request: Cancellation) => {
        try {
            setWritingError(null);
            if(!profile || !profile.id) {
                throw new Error("User profile is not available.");
            }

            await deleteCancellation(request.businessId, request, profile.id);
        } catch (error) {
            console.log("Error cancelling request:", (error as Error).message);
            setWritingError(`Error cancelling request: ${(error as Error).message}`);
        }
    }
    
    return {
        newCancellationRequest,
        updateCancellationReason,
        cancelRequest,
        writingError,
        isWriting
    }
}