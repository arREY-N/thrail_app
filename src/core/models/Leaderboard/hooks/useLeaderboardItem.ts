import { useLeaderboardStore } from "@/src/core/models/Leaderboard/stores/leaderboardStore";
import { useEffect } from "react";

export function useLeaderboardItem(date?: Date | null) {
    const leaderboard = useLeaderboardStore(s => s.current);
    const isLoading = useLeaderboardStore(s => s.isLoading);
    const error = useLeaderboardStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (date) {
                await useLeaderboardStore.getState().fetchLeaderboard(date);
            }
        };

        fetch();
    }, [date]);

    return {
        leaderboard,
        isLoading,
        error,
    };
}
