import { useMountainStore } from "@/src/core/models/Mountain/stores/mountainStore";
import { useEffect } from "react";

export function useMountainList() {
    const mountains = useMountainStore(s => s.data);
    const isLoading = useMountainStore(s => s.isLoading);
    const error = useMountainStore(s => s.error);

    useEffect(() => {
        const fetchAll = async () => {
            await useMountainStore.getState().fetchAll();
        };

        fetchAll();
    }, []);

    return {
        mountains,
        isLoading,
        error,
        refresh: () => useMountainStore.getState().refresh(),
    };
}
