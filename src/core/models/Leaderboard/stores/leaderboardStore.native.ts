import { LeaderboardState, leaderboardStoreCreator } from "@/src/core/models/Leaderboard/stores/leaderboardStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useLeaderboardStore = create<LeaderboardState>()(
    persist(
        immer(leaderboardStoreCreator),
        {
            name: "leaderboard-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                data: state.data.length > 0 ? state.data : [],
                current: state.current,
            })
        }
    )
);
