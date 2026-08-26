import { BaseStore } from "@/src/core/interface/storeInterface";
import { Leaderboard } from "@/src/core/models/Leaderboard/interfaces/Leaderboard.types";
import { LeaderboardRepo } from "@/src/core/models/Leaderboard/repositories/LeaderboardRepository";
import { newLeaderboard } from "@/src/core/models/Leaderboard/utils/LeaderboardFactory";
import { generateLeaderboard } from "@/src/core/models/Leaderboard/utils/Leaderboard.utils";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

export interface LeaderboardState extends BaseStore<Leaderboard> {
    fetchLeaderboard: (date?: Date) => Promise<Leaderboard | null>;
    generateMonthlyLeaderboard: (date?: Date) => Promise<Leaderboard>;
}

const init = {
    data: [] as Leaderboard[],
    current: null as Leaderboard | null,
    isLoading: false,
    error: null as string | null,
};

export const leaderboardStoreCreator: StateCreator<
    LeaderboardState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async () => {
        await get().fetchLeaderboard(new Date());
    },

    refresh: async (_id?: string | null) => {
        await get().fetchLeaderboard(new Date());
    },

    load: async (idOrDate?: string | Date) => {
        if (!idOrDate) {
            set({ current: newLeaderboard() });
            return;
        }

        if (typeof idOrDate === 'string') {
            const cached = get().data.find(l => l.id === idOrDate);
            if (cached) {
                set({ current: cached });
                return;
            }
            try {
                set({ isLoading: true, error: null });
                const board = await LeaderboardRepo.fetchById(idOrDate);
                if (board) {
                    set(state => {
                        state.current = board;
                        state.data = upsertItem(state.data, board);
                        state.isLoading = false;
                    });
                } else {
                    set({ error: 'Leaderboard not found', isLoading: false });
                }
            } catch (err) {
                set({ error: (err as Error).message, isLoading: false });
            }
        } else {
            await get().fetchLeaderboard(idOrDate);
        }
    },

    fetchLeaderboard: async (date: Date = new Date()) => {
        try {
            set({ isLoading: true, error: null });

            const board = await LeaderboardRepo.fetchLeaderboard(date);

            set(state => {
                state.current = board;
                if (board) {
                    state.data = upsertItem(state.data, board);
                }
                state.isLoading = false;
            });

            return board;
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            set({
                error: (err as Error).message || "Failed fetching leaderboard",
                isLoading: false,
            });
            return null;
        }
    },

    generateMonthlyLeaderboard: async (date: Date = new Date()) => {
        try {
            set({ isLoading: true, error: null });

            const board = await generateLeaderboard(date);
            await LeaderboardRepo.write(board);

            set(state => {
                state.current = board;
                state.data = upsertItem(state.data, board);
                state.isLoading = false;
            });

            return board;
        } catch (err) {
            console.error("Error generating leaderboard:", err);
            set({
                error: (err as Error).message || "Failed generating leaderboard",
                isLoading: false,
            });
            throw err;
        }
    },

    create: async (item?: Leaderboard) => {
        if (!item) return false;
        try {
            set({ isLoading: true, error: null });
            await LeaderboardRepo.write(item);
            set(state => {
                state.current = item;
                state.data = upsertItem(state.data, item);
                state.isLoading = false;
            });
            return true;
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
            return false;
        }
    },

    delete: async (id: string) => {
        set(state => {
            state.data = state.data.filter(l => l.id !== id);
            if (state.current?.id === id) {
                state.current = null;
            }
        });
    },
});
