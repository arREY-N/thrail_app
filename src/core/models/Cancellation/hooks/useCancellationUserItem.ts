import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useEffect, useState } from "react";

/**
 * Hook to fetch a specific cancellation item for the current user
 * @param cancellationId 
 * @param businessId 
 */
export function useCancellationUserItem(cancellationId: string, businessId: string) {
    const [localError, setLocalError] = useState<string | null>(null);

    const cancellationItem = useCancellationStore(
        s => s.userCancellations.find(c => c.id === cancellationId) ?? null
    );
    
    const isFetching = useCancellationStore(s => s.isFetching);
    const storeError = useCancellationStore(s => s.error);

    useEffect(() => {
        if(!cancellationId) {
            setLocalError("Cancellation ID is not provided.");
            return;
        }

        if(!businessId) {
            setLocalError("Business ID is not provided.");
            return;
        }

        useCancellationStore.getState().fetchUserCancellation(businessId, cancellationId);
    },[cancellationId, businessId]);

    return {
        cancellationItem,
        isFetching,
        error: storeError || localError,
    }

}