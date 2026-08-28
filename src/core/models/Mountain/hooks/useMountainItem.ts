import { useMountainStore } from "@/src/core/models/Mountain/stores/mountainStore";
import { useEffect } from "react";

export function useMountainItem(id?: string | null) {
    const mountain = useMountainStore(s => s.current);
    const isLoading = useMountainStore(s => s.isLoading);
    const error = useMountainStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (id !== undefined && id !== null) {
                await useMountainStore.getState().load(id);
            }
        };

        fetch();
    }, [id]);

    return {
        mountain,
        isLoading,
        error,
    };
}
