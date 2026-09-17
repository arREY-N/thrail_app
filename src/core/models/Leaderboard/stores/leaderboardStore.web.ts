import { LeaderboardState, leaderboardStoreCreator } from "@/src/core/models/Leaderboard/stores/leaderboardStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useLeaderboardStore = create<LeaderboardState>()(
    immer(leaderboardStoreCreator)
);
