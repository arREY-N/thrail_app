import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useCancellationStore } from "@/src/core/models/Cancellation/stores/cancellationStore";
import { useEffect, useState } from "react";

/**
 * Fetches the current user's cancellation requests across all businesses.
 *
 * User-only — if the current profile is missing or has an `admin` role,
 * the fetch is skipped and `error` is set accordingly rather than throwing.
 * Re-fetches when the profile id changes. Duplicate/in-flight fetches are
 * deduped in the store.
 */
export function useCancellationUserList() {
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);

    const userCancellations = useCancellationStore(s => s.userCancellations);
    const storeError = useCancellationStore(s => s.error);
    const storeFetching = useCancellationStore(s => s.isFetching);

    useEffect(() => {
        if(!profile || !profile.id) {
            setLocalError("User profile is not available.");
            return;
        }

        if(profile.role === "admin") {
            setLocalError("Only users can fetch the list of their cancellation requests.");
            return;
        }

        setLocalError(null);
        useCancellationStore.getState().fetchAllUserCancellations(profile.id).catch(err => {
            setLocalError(`Error fetching cancellations: ${(err as Error).message}`);
        });
        
    },[profile?.id, profile?.role]);

    const refreshUserCancellations = async () => {
        try {
            if(!profile || !profile.id) {
                throw new Error("User profile is not available. Cannot refresh cancellations.");
            }
            await useCancellationStore.getState().fetchAllUserCancellations(profile.id, true);
        } catch (error) {
            setLocalError(`Error refreshing cancellations: ${(error as Error).message}`);
        }
    }

    return {
        userCancellations,
        error: localError || storeError,
        isFetching: storeFetching,
        refreshUserCancellations
    }
}