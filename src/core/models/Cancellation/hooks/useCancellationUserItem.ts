import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useEffect } from "react";

/**
 * Hook to fetch a specific cancellation item for the current user
 * @param cancellationId 
 * @param businessId 
 */
export function useCancellationUserItem(cancellationId: string, businessId: string) {
    const localError = (() => {
        if (!cancellationId) {
            return 'Cancellation ID is not provided.'
        }

        if (!businessId) {
            return 'Business ID is not provided.'
        }

        return null;
    });

    const cancellationItem = useCancellationStore(
        s => s.userCancellations.find(c => c.id === cancellationId) ?? null
    );

    const isFetching = useCancellationStore(s => s.isFetching);
    const storeError = useCancellationStore(s => s.error);

    useEffect(() => {
        if (!cancellationId || !businessId) return;
        useCancellationStore.getState().fetchUserCancellation(businessId, cancellationId);
    }, [cancellationId, businessId]);

    return {
        cancellationItem,
        isFetching,
        error: storeError || localError,
    }

}