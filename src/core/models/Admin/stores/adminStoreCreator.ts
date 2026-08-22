import { AdminRepo } from "@/src/core/init/repositories";
import { BaseStore } from "@/src/core/interface/storeInterface";
import { Admin } from "@/src/core/models/Admin/interfaces/Admin.types";
import { newAdmin } from "@/src/core/models/Admin/utils/AdminFactory";
import { User } from "@/src/core/models/User/User";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

export interface AdminState extends BaseStore<Admin> {
    businessAdmins: Admin[];
    lastFetchedAt: number;

    fetchAllByBusinessId: (businessId: string) => Promise<void>;
    fetchById: (businessId: string, adminId: string) => Promise<void>;
    createAdmin: (user: User, businessId: string) => Promise<void>;
    removeAdmin: (businessId: string, adminId: string) => Promise<void>;
}

const init = {
    data: [],
    current: newAdmin(),
    businessAdmins: [],
    lastFetchedAt: 0,
    isLoading: false,
    error: null,
};

export const adminStoreCreator: StateCreator<
    AdminState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async () => {
        // Fallback or no-op when businessId is not provided
    },

    refresh: async () => {
        // Refresh handled via fetchAllByBusinessId
    },

    load: async (id: string | null) => {
        if (!id) {
            set({ current: newAdmin() });
            return;
        }

        const cached = get().data.find(a => a.id === id);
        if (cached) {
            set({ current: cached });
        }
    },

    create: async () => {
        return true;
    },

    edit: () => {},

    delete: async (id: string) => {
        set(state => {
            state.data = state.data.filter(a => a.id !== id);
            state.businessAdmins = state.businessAdmins.filter(a => a.id !== id);
        });
    },

    fetchAllByBusinessId: async (businessId: string) => {
        if (!businessId) return;

        try {
            set({ isLoading: true, error: null });

            const admins = await AdminRepo.fetchAll(businessId);

            set({
                data: admins,
                businessAdmins: admins,
                lastFetchedAt: Date.now(),
                isLoading: false,
            });
        } catch (err: unknown) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed loading admins',
                isLoading: false,
            });
        }
    },

    fetchById: async (businessId: string, adminId: string) => {
        if (!businessId || !adminId) return;

        try {
            set({ isLoading: true, error: null });

            const admin = await AdminRepo.fetchById(businessId, adminId);

            if (!admin) {
                set({ error: 'Admin not found', isLoading: false });
                return;
            }

            set(state => {
                state.current = admin;
                state.data = upsertItem(state.data, admin);
                state.businessAdmins = upsertItem(state.businessAdmins, admin);
                state.isLoading = false;
            });
        } catch (err: unknown) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed fetching admin',
                isLoading: false,
            });
        }
    },

    createAdmin: async (user: User, businessId: string) => {
        try {
            set({ isLoading: true, error: null });

            const role = user.role as string;
            if (role === 'admin' || get().businessAdmins.some(a => a.id === user.id)) {
                const errMsg = 'User is already an admin of this business';
                set({ error: errMsg, isLoading: false });
                throw new Error(errMsg);
            }

            const admin = await AdminRepo.createBusinessAdmin(user, businessId);

            set(state => {
                state.businessAdmins = upsertItem(state.businessAdmins, admin);
                state.data = upsertItem(state.data, admin);
                state.isLoading = false;
            });
        } catch (err: unknown) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed creating business admin',
                isLoading: false,
            });
            throw err;
        }
    },

    removeAdmin: async (businessId: string, adminId: string) => {
        try {
            set({ isLoading: true, error: null });

            await AdminRepo.delete(businessId, adminId);

            set(state => {
                state.businessAdmins = state.businessAdmins.filter(a => a.id !== adminId);
                state.data = state.data.filter(a => a.id !== adminId);
                state.isLoading = false;
            });
        } catch (err: unknown) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed removing admin',
                isLoading: false,
            });
            throw err;
        }
    },
});
