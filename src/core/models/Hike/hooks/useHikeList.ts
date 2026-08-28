import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useHikeStore } from "@/src/core/models/Hike/stores/hikeStore";
import { useEffect } from "react";

export function useHikeList() {
    const hikes = useHikeStore(s => s.hikes);
    const isLoading = useHikeStore(s => s.isLoading);
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
        isLoading,
        error,
    };
}