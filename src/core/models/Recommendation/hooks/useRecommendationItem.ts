import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useRecommendationsStore } from "@/src/core/models/Recommendation/stores/recommendationStore";
import { useEffect } from "react";

export function useRecommendationItem() {
    const recommendation = useRecommendationsStore(s => s.current);
    const { profile } = useAuthHook();
    const isLoading = useRecommendationsStore(s => s.isLoading);
    const error = useRecommendationsStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (!profile?.id) return;

            useRecommendationsStore.getState().load(profile.id);
        };

        fetch();
    }, [profile?.id]);

    return {
        recommendation,
        isLoading,
        error,
    };
}
