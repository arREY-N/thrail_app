import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Hike } from "@/src/core/models/Hike/Hike";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
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

export default function useHike(params: UseHikeParams): IUseHike {
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);
    const error = useHikesStore(s => s.error);
    const isLoading = useHikesStore(s => s.isLoading);

    const hikes = useHikesStore(s => s.hikes);
    const fetchAll = useHikesStore(s => s.fetchAll);
    
    useEffect(() => {
        const init = async () => {
            if(!profile?.id){
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