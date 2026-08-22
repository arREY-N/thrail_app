import { MountainRepo } from "@/src/core/init/repositories";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { BaseStore } from "@/src/core/interface/storeInterface";
import { Mountain } from "@/src/core/models/Mountain/interfaces/Mountain.types";
import { newMountain } from "@/src/core/models/Mountain/utils/MountainFactory";
import { StateCreator } from "zustand";

export interface MountainState extends BaseStore<Mountain> {
    fetchMountainByProvince: (province: string) => Promise<Mountain[]>;
}

const init = {
    data: [],
    current: null,
    isLoading: true,
    error: null,
};

export const mountainStoreCreator: StateCreator<
    MountainState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async () => {
        const data = get().data;
        try {
            if (data.length > 0) return;

            set({ isLoading: true, error: null });

            const mountains: Mountain[] = await MountainRepo.fetchAll();

            if (mountains.length === 0) {
                console.log('No mountains available');
                set({ data: [], isLoading: false });
                return;
            }

            set({
                data: mountains.sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase())),
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed loading mountains',
                isLoading: false,
            });
        }
    },

    refresh: async () => {
        try {
            set({ isLoading: true, error: null });

            const mountains: Mountain[] = await MountainRepo.fetchAll();

            if (mountains.length === 0) {
                console.log('No mountains available');
                set({ data: [], isLoading: false });
                return;
            }

            set({
                data: mountains.sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase())),
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed loading mountains',
                isLoading: false,
            });
        }
    },

    load: async (id: string | null) => {
        set({ isLoading: true, error: null });
        if (!id) {
            set({ isLoading: false, current: newMountain() });
            return;
        }

        try {
            const data = get().data;
            let mountain: Mountain | null = null;
            if (data.length > 0) {
                mountain = data.find(m => m.id === id) || null;
            }

            if (!mountain) {
                mountain = await MountainRepo.fetchById(id);
            }

            if (!mountain) throw new Error('Mountain not found');

            set({
                current: mountain,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed loading mountain',
                isLoading: false,
            });
        }
    },

    create: async (create: Mountain) => {
        const data = get().data;
        const current = get().current;

        if (!current) {
            set({ error: 'No data to create' });
        }

        set({ isLoading: true, error: null });

        try {
            if (data.find(m => m.name
                .toUpperCase()
                .includes(create.name.toUpperCase().trim()) && m.id !== create.id)
            ) {
                throw new Error('This mountain already exists');
            }

            const created = await MountainRepo.write(create);

            if (!created) throw new Error('Mountain not written');

            const newList = data.find(m => m.id === create.id)
                ? [...data.filter(m => m.id !== create.id), created]
                : [...data, created];
            const sorted = newList.sort((a, b) => a.name.localeCompare(b.name));

            set({
                data: sorted,
                isLoading: false,
            });

            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing mountain',
                isLoading: false,
            });
            return false;
        }
    },

    edit: (property: TEdit<Mountain>) => {
        const { section, id, value } = property;
        set(state => {
            if (!state.current) return;
            if (section === 'root') {
                (state.current as any)[id] = value;
            } else {
                (state.current as any)[section][id] = value;
            }
        });
    },

    delete: async (id: string) => {
        const data = get().data;
        set({ isLoading: true, error: null });

        try {
            const mountain = data.find(m => m.id === id);
            if (!mountain) throw new Error('Mountain not found');

            await MountainRepo.delete(id);

            const updated = data.filter(m => m.id !== id);

            set({
                data: updated,
                isLoading: false,
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing mountain',
                isLoading: false,
            });
        }
    },

    fetchMountainByProvince: async (province: string): Promise<Mountain[]> => {
        try {
            return await MountainRepo.fetchMountainByProvince(province);
        } catch (err) {
            console.error((err as Error).message);
            return [];
        }
    },
});
