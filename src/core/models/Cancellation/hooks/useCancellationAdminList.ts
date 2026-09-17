import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { useEffect, useState } from "react";

/**
 * Hook to fetch a list of cancellation items for admin users
 */
export function useCancellationAdminList() {
    const { businessId } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const businessCancellations = useCancellationStore(s => s.businessCancellations);
    const isFetching = useCancellationStore(s => s.isFetching);

    useEffect(() => {
        const fetch = async () => {
            if (!businessId) return;

            await useCancellationStore.getState().fetchAllBusinessCancellations(businessId);
        }

        fetch();
    }, [businessId]);

    /**
     * Forces a refresh on the admin cancellations list by re-fetching the data from the store. 
     * If the business ID is not available, it will throw an error and set a local error state.
     */
    const refreshAdminCancellations = async () => {
        try {
            if (!businessId)
                throw new Error("Business ID is not available. Cannot refresh cancellations.");

            await useCancellationStore.getState().fetchAllBusinessCancellations(businessId, true);
        } catch (error) {
            catchError((error as Error), "Error refreshing cancellations");
            setLocalError(`Error refreshing cancellations: ${(error as Error).message}`);
        }
    }


    return {
        refreshAdminCancellations,
        businessCancellations,
        isFetching,
        localError
    }
}