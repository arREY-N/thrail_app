import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Hike, useHikeStore } from "@/src/core/models/Hike/Hike";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export interface IUseHike {
    hikes: Hike[];
    error: string | null;
    isLoading: boolean;

    viewHike: (id: string) => void;
}

export type UseHikeParams = {

}

export default function useHike(): IUseHike {
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);
    const error = useHikeStore(s => s.error);
    const isLoading = useHikeStore(s => s.isLoading);

    const hikes = useHikeStore(s => s.hikes);
    const fetchAll = useHikeStore(s => s.fetchAll);

    useEffect(() => {
        const init = async () => {
            if (!profile?.id) {
                setLocalError("User ID is required to fetch hikes");
                return;
            }

            await fetchAll(profile.id);
        }

        init();
    }, [profile?.id, fetchAll]);

    const viewHike = (id: string) => {
        router.push({
            pathname: '/(main)/hike/view',
            params: { hikeId: id }
        })
    }

    return {
        hikes,
        error: error || localError,
        isLoading,
        viewHike,
    }
}