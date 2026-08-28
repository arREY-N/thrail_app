import { TEdit } from "@/src/core/interface/domainHookInterface";
import { Admin } from "@/src/core/models/Admin/Admin";
import { Business } from "@/src/core/models/Business/interfaces/Business.types";
import { BusinessRepo } from "@/src/core/models/Business/repositories/businessRepository";
import { newBusiness } from "@/src/core/models/Business/utils/BusinessFactory";
import { User } from "@/src/core/models/User/User";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

export type AdminUI = {
    user: User;
    businessId: string;
};

export interface BusinessState {
    data: Business[];
    current: Business | null;
    isLoading: boolean;
    error: string | null;

    fetchAll: () => Promise<void>;
    refresh: (userId?: string | null) => Promise<void>;
    load: (...args: any) => Promise<void>;
    create: (...args: any) => Promise<boolean>;
    delete: (id: string) => Promise<void>;
    edit?: (property: TEdit<Business>) => void;
    reset: () => void;

    businessAdmins: Admin[];
    lastFetchedAt: number;

    createBusinessAdmin: (admin: AdminUI) => Promise<void>;
    loadBusinessAdmins: (providedBusinessId: string | null) => Promise<void>;
    reloadBusinessAdmins: (providedBusinessId: string | null) => Promise<void>;
}

const init = {
    data: [],
    current: null,
    businessAdmins: [],
    lastFetchedAt: 0,
    isLoading: true,
    error: null,
};

export const businessStoreCreator: StateCreator<
    BusinessState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    fetchAll: async () => {
        const data = get().data;

        if (data.length > 0) return;

        try {
            set({ isLoading: true, error: null });

            const businesses = await BusinessRepo.fetchAll();

            set({
                data: businesses,
                lastFetchedAt: Date.now(),
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },

    refresh: async () => {
        const now = Date.now();
        const lastFetchedAt = get().lastFetchedAt;
        const COOLDOWN_MS = 2000;

        if (now - lastFetchedAt < COOLDOWN_MS && get().data.length > 0) {
            console.log('Throttled refresh: reusing in-memory cache to save Firestore reads.');
            return;
        }

        try {
            set({ isLoading: true, error: null });

            const businesses = await BusinessRepo.fetchAll();

            set({
                data: businesses,
                lastFetchedAt: now,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },

    load: async (id: string | null) => {
        if (!id) {
            set({ current: newBusiness() });
            return;
        }

        const data = get().data;

        try {
            set({ isLoading: true, error: null });

            let business = null;

            if (data.length > 0) {
                business = data.find(d => d.id === id);
            }

            if (!business) {
                console.log('calling repo');
                business = await BusinessRepo.fetchById(id);
            }

            if (!business) {
                set({
                    error: 'Business not found',
                    isLoading: false,
                });
                return;
            }

            set((state) => {
                const updated = state.data.filter(u => u.id !== id);

                return {
                    current: business,
                    data: [...updated, business],
                    isLoading: false,
                };
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },

    create: async (business: Business, applicationId: string) => {
        set({ isLoading: true, error: null });

        try {
            const newAccount = await BusinessRepo.write(business, applicationId);

            set((state) => {
                return {
                    data: upsertItem(state.data, newAccount),
                    isLoading: false,
                };
            });
            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed adding business',
                isLoading: false,
            });
            return false;
        }
    },

    edit: () => {

    },

    delete: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
            await BusinessRepo.delete(id);

            set((state) => {
                return {
                    data: [...state.data.filter(b => b.id !== id)],
                    isLoading: false,
                };
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed deleting business',
                isLoading: false,
            });
        }
    },

    reset: () => set(init),

    loadBusinessAdmins: async (providedBusinessId: string | null = null) => {
        if (get().current && get().businessAdmins.length > 0) return;

        set({ isLoading: true, error: null });

        try {
            const targetID = providedBusinessId || get().current?.id;
            console.log('Target ID: ', targetID);
            if (!targetID) throw new Error('Missing Business ID');

            const businessAdmins = await BusinessRepo.fetchBusinessAdmins(targetID);

            set({
                businessAdmins,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                isLoading: false,
                error: (err as Error).message ?? 'Failed loading admins',
            });
        }
    },

    reloadBusinessAdmins: async (providedBusinessId: string | null = null) => {
        set({ isLoading: true, error: null });

        try {
            const targetID = providedBusinessId || get().current?.id;
            console.log('Target ID: ', targetID);
            if (!targetID) throw new Error('Missing Business ID');

            const businessAdmins = await BusinessRepo.fetchBusinessAdmins(targetID);

            set({
                businessAdmins,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                isLoading: false,
                error: (err as Error).message ?? 'Failed loading admins',
            });
        }
    },

    createBusinessAdmin: async ({ user, businessId }: AdminUI) => {
        set({ isLoading: true, error: null });

        try {
            const role = user.role as string;

            if (role === 'admin' || get().businessAdmins.some(a => a.id === user.id)) {
                const errMsg = 'User is already an admin of this business';
                set({
                    error: errMsg,
                    isLoading: false,
                });
                throw new Error(errMsg);
            }

            const admin = await BusinessRepo.createBusinessAdmin(user, businessId);

            set((state) => {
                return {
                    businessAdmins: [...state.businessAdmins, admin],
                    isLoading: false,
                };
            });
        } catch (err) {
            set({
                error: (err as Error).message ?? 'Store: Failed creating business admin',
                isLoading: false,
            });
        }
    },
});
