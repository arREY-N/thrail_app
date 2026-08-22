import { ApplicationRepo } from '@/src/core/init/repositories';
import { BaseStore } from '@/src/core/interface/storeInterface';
import { Application } from '@/src/core/models/Application/interfaces/Application.types';
import { newApplication } from '@/src/core/models/Application/utils/ApplicationFactory';
import { StateCreator } from 'zustand';

export interface ApplicationState extends BaseStore<Application> {
    approveApplication: (id: string) => Promise<void>;
    rejectApplication: (application: Application) => Promise<void>;
}

const init = {
    current: null,
    data: [],
    isLoading: false,
    error: null,
};

export const applicationStoreCreator: StateCreator<
    ApplicationState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    fetchAll: async () => {
        const data = get().data;

        if (data.length > 0) return;

        set({ isLoading: true });

        try {
            const applications = await ApplicationRepo.fetchAll();
            set({
                data: applications,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed loading all applications',
                isLoading: false,
            });
        }
    },

    load: async (id: string) => {
        set({ isLoading: true, error: null });

        if (!id) {
            set({
                current: newApplication(),
                isLoading: false,
            });
            return;
        }

        try {
            const data = get().data;
            let application = null;

            if (data.length > 0) {
                application = data.find(a => a.id === id);
            }

            if (!application) {
                application = await ApplicationRepo.fetchById(id);
            }

            if (!application) throw new Error('Application not found');

            set({
                current: application,
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
        set({ isLoading: true, error: null });

        try {
            const applications = await ApplicationRepo.fetchAll();
            set({
                data: applications,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed reloading applications',
                isLoading: false,
            });
        }
    },

    create: async (application: Application) => {
        const data = get().data;

        set({ isLoading: true, error: null });

        try {
            data.forEach(t => {
                const applicant = t.owner.id;
                const save = application.owner.id;

                if (applicant === save) {
                    const currentStatus = t.status;

                    switch (currentStatus) {
                        case 'approved':
                            throw new Error('An application made with your user ID has been approved.');
                        case 'pending':
                            throw new Error('An application made with your user ID is still pending.');
                        case 'reviewed':
                            throw new Error('An application made with your user ID is still under review.');
                        case 'rejected':
                            throw new Error('An application made with your user ID was rejected.');
                        default:
                            throw new Error('Application status unknown.');
                    }
                }
            });

            console.log(application);

            const created = await ApplicationRepo.write(application);

            set((state) => {
                return {
                    data: [...state.data, created],
                    isLoading: false,
                };
            });

            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed creating application',
                isLoading: false,
            });
            throw err;
        }
    },

    edit: () => {

    },

    approveApplication: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const data = get().data;

            const updatedApp = await ApplicationRepo.fetchById(id);

            if (!updatedApp) {
                throw new Error('Application cannot be found');
            }

            set({
                data: data.map(a => a.id === id ? updatedApp : a),
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed approving application',
                isLoading: false,
            });
            throw err;
        }
    },

    rejectApplication: async (application: Application) => {
        set({ isLoading: true, error: null });
        try {
            const data = get().data;

            await ApplicationRepo.update(application);

            set({
                data: data.map(a => a.id === application.id ? application : a),
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed rejecting application',
                isLoading: false,
            });
        }
    },

    delete: async (id: string) => {
        set({ isLoading: true, error: null });
        if (!id) {
            set({
                error: 'No ID selected',
                isLoading: false,
            });
            return;
        }

        try {
            await ApplicationRepo.delete(id);
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },

    reset: () => set(init),
});
