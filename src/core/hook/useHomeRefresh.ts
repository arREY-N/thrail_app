import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useOfferStore } from "@/src/core/models/Offer/Offer";
import { useRecommendationsStore } from "@/src/core/models/Recommendation/Recommendation";
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useRef, useState } from "react";

export function useHomeRefresh() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const lastRefreshTimeRef = useRef<number>(0);
    const { profile } = useAuthHook();

    const onRefreshPress = async () => {
        const now = Date.now();
        if (isRefreshing || (now - lastRefreshTimeRef.current < 5000)) {
            return;
        }

        lastRefreshTimeRef.current = now;
        setIsRefreshing(true);
        try {
            if (!profile?.id) return;

            await Promise.all([
                useOfferStore.getState().fetchAll(),
                useTrailsStore.getState().fetchAll(),
                useRecommendationsStore.getState().load(profile.id),
            ]);
        } catch (err) {
            console.error("Error pulling to refresh Home screen:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    return {
        isRefreshing,
        onRefreshPress,
    }
}