import { useApplicationsStore } from "@/src/core/models/Application/stores/applicationStore";
import { useEffect } from "react";

export function useApplicationItem(id?: string | null) {
    const application = useApplicationsStore(s => s.current);
    const isLoading = useApplicationsStore(s => s.isLoading);
    const error = useApplicationsStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (id !== undefined && id !== null) {
                await useApplicationsStore.getState().load(id);
            }
        };

        fetch();
    }, [id]);

    return {
        application,
        isLoading,
        error,
    };
}
