import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useEffect, useState } from "react";

/**
 * Hook to fetch a specific cancellation item for the current user
 * @param cancellationId 
 * @param businessId 
 */
export function useCancellationUserItem(cancellationId: string, businessId?: string) {
    const [localError, setLocalError] = useState<string | null>(null);
    const { profile } = useAuthHook();

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

        if(!profile || !profile.id) {
            setLocalError("User profile is not available.");
            return;
        }

        useCancellationStore.getState().fetchUserCancellationById(profile?.id , cancellationId);
    },[cancellationId]);

    return {
        cancellationItem,
        isFetching,
        error: storeError || localError,
    }

}