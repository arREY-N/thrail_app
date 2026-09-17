import { useHikeStore } from "@/src/core/models/Hike/stores/hikeStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export function useHikeList() {
    const hikes = useHikeStore(s => s.hikes);
    const hikeIsLoading = useHikeStore(s => s.isLoading);
    const error = useHikeStore(s => s.error);
    const { profile } = useAuthHook();

    useEffect(() => {
        const fetch = async () => {
            if (!profile?.id) return;
            await useHikeStore.getState().fetchAll(profile.id);
        };
        fetch();
    }, [profile?.id]);

    return {
        hikes,
        hikeIsLoading,
        error,
    };
}