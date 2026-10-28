import { BookingStatus } from "@/src/core/models/Booking/interfaces/Booking.types";
import { Reschedule } from "@/src/core/models/Reschedule/interfaces/Reschedule.types";
import { RescheduleRepo } from "@/src/core/models/Reschedule/repositories/RescheduleRepository";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface RescheduleState {
    fetchAll: () => Promise<void>;
    fetchAllByBusinessId: (businessId: string) => Promise<void>;
    fetchById: (businessId: string, rescheduleId: string, isAdmin?: boolean) => Promise<void>;
    fetchAllUserReschedules: (userId: string) => Promise<void>;
    subscribeToUserReschedules: (userId: string) => Unsubscribe;
    subscribeToBusinessReschedules: (businessId: string) => Unsubscribe;

    write: (reschedule: Reschedule) => Promise<Reschedule>;
    submitUserRescheduleRequest: (reschedule: Reschedule) => Promise<Reschedule>;
    withdrawUserRescheduleRequest: (
        businessId: string,
        rescheduleId: string,
        userId: string,
        bookingId: string,
        revertStatus?: BookingStatus
    ) => Promise<void>;
    rejectRescheduleRequest: (
        businessId: string,
        rescheduleId: string,
        userId: string,
        bookingId: string,
        reason: string,
        revertStatus?: BookingStatus
    ) => Promise<void>;
    reset: () => void;

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
};

export const rescheduleStoreCreator: StateCreator<RescheduleState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    reset: () => set(init),

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

    subscribeToUserReschedules: (userId: string) => {
        if (!userId) return () => {};

        return RescheduleRepo.listenToUserReschedules(
            userId,
            (reschedules) => {
                set(state => {
                    state.userReschedules = reschedules;
                });
            },
            (error) => {
                set({ error });
            }
        );
    },

    subscribeToBusinessReschedules: (businessId: string) => {
        if (!businessId) return () => {};

        return RescheduleRepo.listenToBusinessReschedules(
            businessId,
            (reschedules) => {
                set(state => {
                    state.businessReschedules = reschedules;
                });
            },
            (error) => {
                set({ error });
            }
        );
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
    },

    submitUserRescheduleRequest: async (reschedule: Reschedule) => {
        try {
            set({ isWriting: true, error: null });

            const createdReschedule = await RescheduleRepo.submitUserRescheduleRequest(reschedule);

            set(state => {
                state.userReschedules = upsertItem(state.userReschedules, createdReschedule);
                state.allReschedules = upsertItem(state.allReschedules, createdReschedule);
            });

            return createdReschedule;
        } catch (error) {
            set({ error: error as Error });
            throw error;
        } finally {
            set({ isWriting: false });
        }
    },

    withdrawUserRescheduleRequest: async (
        businessId: string,
        rescheduleId: string,
        userId: string,
        bookingId: string,
        revertStatus: BookingStatus = 'paid'
    ) => {
        try {
            set({ isWriting: true, error: null });

            await RescheduleRepo.withdrawUserRescheduleRequest(
                businessId,
                rescheduleId,
                userId,
                bookingId,
                revertStatus
            );

            set(state => {
                state.userReschedules = state.userReschedules.filter(r => r.id !== rescheduleId);
                state.allReschedules = state.allReschedules.filter(r => r.id !== rescheduleId);
                state.businessReschedules = state.businessReschedules.filter(r => r.id !== rescheduleId);
            });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        } finally {
            set({ isWriting: false });
        }
    },

    rejectRescheduleRequest: async (
        businessId: string,
        rescheduleId: string,
        userId: string,
        bookingId: string,
        reason: string,
        revertStatus: BookingStatus = 'completed'
    ) => {
        try {
            set({ isWriting: true, error: null });

            await RescheduleRepo.rejectRescheduleRequest(
                businessId,
                rescheduleId,
                userId,
                bookingId,
                reason,
                revertStatus
            );

            set(state => {
                const markRejected = (list: Reschedule[]) =>
                    list.map(r => r.id === rescheduleId ? { ...r, status: 'rejected' as const, adminNote: reason } : r);
                state.userReschedules = markRejected(state.userReschedules);
                state.allReschedules = markRejected(state.allReschedules);
                state.businessReschedules = markRejected(state.businessReschedules);
            });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        } finally {
            set({ isWriting: false });
        }
    },
});