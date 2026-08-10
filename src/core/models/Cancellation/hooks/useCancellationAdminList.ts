import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useEffect, useState } from "react";

/**
 * Hook to fetch a list of cancellation items for admin users
 */
export function useCancellationAdminList() {
    const { businessId } = useAuthHook();
    const [localError, setLocalError] = useState<string | null>(null);
    const businessCancellations = useCancellationStore(s => s.businessCancellations);
    const fetchAllBusinessCancellations = useCancellationStore(s => s.fetchAllBusinessCancellations);
    const isFetching = useCancellationStore(s => s.isFetching);
    
    useEffect(() => {
        if(!businessId) return;

        fetchAllBusinessCancellations(businessId);
    },[businessId]);

    const refreshAdminCancellations = async () => {
        try {
            if(!businessId) 
                throw new Error("Business ID is not available. Cannot refresh cancellations.");

            fetchAllBusinessCancellations(businessId, true);
        } catch (error) {
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