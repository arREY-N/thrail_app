import { useRecommendationsStore } from "@/src/core/models/Recommendation/stores/recommendationStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export function useRecommendationItem() {
    const recommendation = useRecommendationsStore(s => s.current);
    const { profile, user } = useAuthHook();
    const isLoading = useRecommendationsStore(s => s.isLoading);
    const error = useRecommendationsStore(s => s.error);

    useEffect(() => {
        const uid = profile?.id || user?.uid;
        if (!uid) return;

        useRecommendationsStore.getState().load(uid);
    }, [profile?.id, user?.uid]);

    return {
        recommendation,
        isLoading,
        error,
    };
}
