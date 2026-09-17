import { useApplicationsStore } from "@/src/core/models/Application/stores/applicationStore";
import { useEffect } from "react";

export function useApplicationList() {
    const applications = useApplicationsStore(s => s.data);
    const isLoading = useApplicationsStore(s => s.isLoading);
    const error = useApplicationsStore(s => s.error);

    useEffect(() => {
        const fetchAll = async () => {
            await useApplicationsStore.getState().fetchAll();
        };

        fetchAll();
    }, []);

    return {
        applications,
        isLoading,
        error,
        refresh: () => useApplicationsStore.getState().refresh(),
    };
}
