import { Hike } from "@/src/core/models/Hike/interfaces/Hike.types";
import { useHikeStore } from "@/src/core/models/Hike/stores/hikeStore";
import { useEffect, useState } from "react";

export function useHikeItem(id?: string, userId?: string) {
    const [hike, setHike] = useState<Hike | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            if (!id || !userId) return;
            setIsLoading(true);
            setError(null);
            try {
                const result = await useHikeStore.getState().load(id, userId);
                setHike(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load hike");
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [id, userId]);

    return {
        hike,
        isLoading,
        error,
    };
}
