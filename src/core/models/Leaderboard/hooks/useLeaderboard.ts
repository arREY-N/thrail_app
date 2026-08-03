import { Leaderboard } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import { generateLeaderboard } from "@/src/core/models/Leaderboard/Leaderboard";
import { useState } from "react";

export const useLeaderboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [leaderboard, setLeaderboard] = useState<Leaderboard<Date> | null>(null);
    const [localError, setLocalError] = useState<Error | null>(null);

    const generateMonthlyLeaderboard = async (date: Date = new Date()) => {
        try {
            setIsLoading(true);

            const leaderboard = await generateLeaderboard(date);
         
            setLeaderboard(leaderboard);
        } catch (error) {
            console.error("Error generating leaderboard:", error);
            setLocalError(error as Error);
        } finally {
            setIsLoading(false);
        }
    }

    return {
        localError, 
        isLoading, 
        leaderboard, 
        setIsLoading, 
        setLeaderboard,
        generateMonthlyLeaderboard,
    };
}