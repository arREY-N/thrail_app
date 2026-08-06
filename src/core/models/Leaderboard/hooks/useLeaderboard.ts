import { LeadberboardRepo } from "@/src/core/init/repositories";
import { Leaderboard } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import { generateLeaderboard } from "@/src/core/models/Leaderboard/Leaderboard";
import { useState } from "react";

export const useLeaderboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [leaderboard, setLeaderboard] = useState<Leaderboard<Date> | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const generateMonthlyLeaderboard = async (date: Date = new Date()) => {
        try {
            setIsLoading(true);

            const leaderboard = await generateLeaderboard(date);
            
            await LeadberboardRepo.write(leaderboard);

            if(leaderboard.userRankings.length === 0) {
                throw new Error(`No user rankings found for ${date.toISOString()}`);
            }

            setLeaderboard(leaderboard);
        } catch (error) {
            console.error("Error generating leaderboard:", error);
            setLocalError((error as Error).message);
        } finally {
            setIsLoading(false);
        }
    }

    const getMonthLeaderboard = async (date: Date = new Date()) => {
        try {
            setIsLoading(true);

            const leaderboard = await LeadberboardRepo.fetchLeaderboard(date);

            if(leaderboard === null) {
                throw new Error(`Leaderboard for ${date.toISOString()} not found`);
            }

            if(leaderboard.userRankings.length === 0) {
                throw new Error(`No user rankings found for ${date.toISOString()}`);
            }   

            setLeaderboard(leaderboard);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            setLocalError((error as Error).message);
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
        getMonthLeaderboard
    };
}