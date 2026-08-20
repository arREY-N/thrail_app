import { RescheduleRepo } from "@/src/core/init/repositories";
import { Reschedule } from "@/src/core/models/Reschedule/interfaces/IReschedule";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

export interface RescheduleState {
    fetchAll: () => Promise<void>;
    fetchAllByBusinessId: (businessId: string) => Promise<void>;
    fetchById: (businessId: string, rescheduleId: string, isAdmin?: boolean) => Promise<void>;
    fetchAllUserReschedules: (userId: string) => Promise<void>;

    write: (reschedule: Reschedule) => Promise<Reschedule>;

    isFetching: boolean;
    isWriting: boolean;
    error: Error | null;

    businessReschedules: Reschedule[];
    allReschedules: Reschedule[];
    userReschedules: Reschedule[];
}

const init = {
    isFetching: false,
    isWriting: false,
    error: null,

    businessReschedules: [],
    allReschedules: [],
    userReschedules: [],
}

export const rescheduleStoreCreator: StateCreator<RescheduleState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    fetchAll: async () => {
        try {
            set({ isFetching: true, error: null });

            const allReschedules = await RescheduleRepo.fetchAll();

            set({ allReschedules });
        } catch (error) {
            set({ error: error as Error });
        } finally {
            set({ isFetching: false });
        }
    },

    fetchAllByBusinessId: async (businessId: string) => {
        try {
            set({ isFetching: true, error: null });

            const businessReschedules = await RescheduleRepo.fetchAllByBusinessId(businessId);

            set({ businessReschedules });
        } catch (error) {
            set({ error: error as Error });
        } finally {
            set({ isFetching: false });
        }
    },

    fetchById: async (businessId: string, rescheduleId: string, isAdmin: boolean = false) => {
        try {
            set({ isFetching: true, error: null });

            const reschedule = await RescheduleRepo.fetchById(businessId, rescheduleId);

            if (!reschedule) {
                throw new Error(`Reschedule with ID ${rescheduleId} not found for business ${businessId}`);
            }

            set(state => {
                if (isAdmin) {
                    state.businessReschedules = upsertItem(state.businessReschedules, reschedule);
                } else {
                    state.userReschedules = upsertItem(state.userReschedules, reschedule);
                }
            });
        } catch (error) {
            set({ error: error as Error });
        } finally {
            set({ isFetching: false });
        }
    },

    fetchAllUserReschedules: async (userId: string) => {
        try {
            set({ isFetching: true, error: null });

            const userReschedules = await RescheduleRepo.fetchAllUserReschedules(userId);

            set({ userReschedules });
        } catch (error) {
            set({ error: error as Error });
        } finally {
            set({ isFetching: false });
        }
    },

    write: async (reschedule: Reschedule) => {
        try {
            set({ isWriting: true, error: null });

            const updatedReschedule = await RescheduleRepo.write(reschedule);

            set(state => {
                state.allReschedules = upsertItem(state.allReschedules, updatedReschedule);
            });

            return updatedReschedule;
        } catch (error) {
            set({ error: error as Error });
            throw error;
        } finally {
            set({ isWriting: false });
        }
    }
})