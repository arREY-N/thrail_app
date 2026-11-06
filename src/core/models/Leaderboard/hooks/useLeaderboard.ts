import { Leaderboard } from "@/src/core/models/Leaderboard/interfaces/Leaderboard.types";
import { useLeaderboardStore } from "@/src/core/models/Leaderboard/stores/leaderboardStore";
import { useEffect } from "react";

export const useLeaderboard = () => {
    const leaderboard = useLeaderboardStore(s => s.current);
    const isLoading = useLeaderboardStore(s => s.isLoading);
    const localError = useLeaderboardStore(s => s.error);

    const generateMonthlyLeaderboard = async (date: Date = new Date()) => {
        return await useLeaderboardStore.getState().generateMonthlyLeaderboard(date);
    };

    const getMonthLeaderboard = async (date: Date = new Date()) => {
        return await useLeaderboardStore.getState().fetchLeaderboard(date);
    };

    const setIsLoading = (loading: boolean) => {
        useLeaderboardStore.setState({ isLoading: loading });
    };

    const setLeaderboard = (board: Leaderboard | null) => {
        useLeaderboardStore.setState({ current: board });
    };

    useEffect(() => {
        const fetch = async () => {
            await getMonthLeaderboard();
        }

        fetch();
    }, [])

    return {
        localError,
        isLoading,
        leaderboard,
        setIsLoading,
        setLeaderboard,
        generateMonthlyLeaderboard,
        getMonthLeaderboard,
    };
};