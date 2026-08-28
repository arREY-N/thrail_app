import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useEffect, useState } from "react";

/**
 * Hook to fetch a specific cancellation item for admin users
 * @param cancellationId - The ID of the cancellation to fetch
 * @param businessId - Optional business ID, falls back to authenticated user's businessId
 */
export function useCancellationAdminItem(cancellationId: string, businessId?: string) {
    const { businessId: authBusinessId } = useAuthHook();
    const activeBusinessId = businessId || authBusinessId;
    const [localError, setLocalError] = useState<string | null>(null);

    const cancellationItem = useCancellationStore(
        s => s.businessCancellations.find(c => c.id === cancellationId) ?? null
    );
    const isFetching = useCancellationStore(s => s.isFetching);
    const storeError = useCancellationStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (!cancellationId) {
                setLocalError("Cancellation ID is not provided.");
                return;
            }
            if (!activeBusinessId) {
                setLocalError("Business ID is not provided.");
                return;
            }
            if (!cancellationItem) {
                await useCancellationStore.getState().fetchAllBusinessCancellations(activeBusinessId);
            }
        };
        fetch();
    }, [cancellationId, activeBusinessId]);

    return {
        cancellationItem,
        isFetching,
        error: storeError || localError,
    };
}