import { create } from "zustand";
import { BaseStore } from "../interface/storeInterface";
import { Mountain } from "../models/Mountain/Mountain";
import { MountainRepository } from "../repositories/mountainRepository";

export interface MountainState extends BaseStore<Mountain>{}

const init = {
    data: [],
    current: null,
    isLoading: true,
    error: null,
}

export const useMountainsStore = create<MountainState>((set, get) => ({
    ...init,

    fetchAll: async () => {
        const data = get().data;
        try {
            if(data.length > 0) return;
            
            set({ isLoading: true, error: null});
            
            const mountains: Mountain[] = await MountainRepository.fetchAll();

            if(mountains.length === 0){
                console.log('No mountains available');
                set({ data: [], isLoading: false });
                return;
            }

            set({
                data: mountains.sort((a,b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase())),
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed loading mountains',
                isLoading: false,
            })
        }
    },
    
    refresh: async () => {
        try {
            set({ isLoading: true, error: null});
            
            const mountains: Mountain[] = await MountainRepository.fetchAll();

            if(mountains.length === 0){
                console.log('No mountains available');
                set({ data: [], isLoading: false });
                return;
            }

            set({
                data: mountains.sort((a,b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase())),
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed loading mountains',
                isLoading: false,
            })
        }
    },

    load: async (id) => {
        set({ isLoading: true, error: null });
        if(!id) {
            set({ isLoading: false, current: new Mountain()})
            return;
        }
        
        try {
            const data = get().data;
            let mountain = null;
            if(data.length > 0){
                mountain = data.find(m => m.id === id);
            }

            if(!mountain){
                mountain = await MountainRepository.fetchById(id);
            }

            if(!mountain) throw new Error('Mountain not found')

            set({
                current: mountain,
                isLoading: false,
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed loading mountain',
                isLoading: false,
            })
        }
    },
    
    create: async (create: Mountain) => {
        const data = get().data;
        const current = get().current;
        
        if(!current){
            set({ error: 'No data to create', })
        }
        
        set({ isLoading: true, error: null });

        try {
            if(data.find(m => m.name
                .toUpperCase()
                .includes(create.name.toUpperCase().trim()) && m.id !== create.id)
            ){
                throw new Error('This mountain already exists')
            }

            const created = await MountainRepository.write(create);

            if(!created) throw new Error('Mountain not written');

            const newList = data.find(m => m.id === create.id)
                ? [...data.filter(m => m.id !== create.id), created]
                : [...data, created];
            const sorted = newList.sort((a, b) => a.name.localeCompare(b.name));
            
            console.log(sorted);
            set({
                data: sorted,
                isLoading: false
            })

            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing mountain',
                isLoading: false,
            })
            return false;
        }
    },
    
    delete: async (id: string) => {
        const data = get().data;
        set({ isLoading: true, error: null});

        try {
            const mountain = data.find(m => m.id === id); 
            if(!mountain) throw new Error('Mountain not found')
            
            await MountainRepository.delete(id);

            const updated = data.filter(m => m.id !== id);

            set({
                data: updated,
                isLoading: false,
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing mountain',
                isLoading: false,
            })
        }
    },

    reset: () => set(init),
}));