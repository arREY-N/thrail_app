import { MountainUI } from "@/src/types/entities/Mountain";
import { Property } from "@/src/types/Property";
import { create } from "zustand";
import { BaseStore } from "../interface/storeInterface";
import { MountainRepository } from "../repositories/mountainRepository";
import { editProperty } from "../utility/editProperty";

export interface MountainState extends BaseStore<MountainUI>{

}

const MOUNTAIN_TEMPLATE = {
    name: null,
    province: []
}

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
            
            const mountains: MountainUI[] = await MountainRepository.fetchAll();

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
            
            const mountains: MountainUI[] = await MountainRepository.fetchAll();

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
            set({ isLoading: false, current: new MountainUI()})
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

    create: async () => {
        const data = get().data;
        const mountain = get().current;
        
        if(!mountain){
            set({ error: 'No data to create', })
            return false;
        }
        
        set({ isLoading: true, error: null });

        try {
            if(data.find(m => m.name
                .toUpperCase()
                .includes(mountain.name.toUpperCase()) && m.id !== mountain.id)
            ){
                throw new Error('This mountain already exists')
            }

            const created = await MountainRepository.write(mountain);

            if(!created) throw new Error('Mountain not written');

            const newList = data.find(m => m.id === mountain.id)
                ? [...data.filter(m => m.id !== mountain.id), created]
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
    
    delete: async (id) => {
        const data = get().data;
        set({ isLoading: true, error: null});

        try {
            const mountain = data.find(m => m.id === id); 
            if(!mountain) throw new Error('Mountain not found')
            
            await MountainRepository.delete(id);

            const updated = data.filter(m => m.id !== id);
            console.log(updated);

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

    edit: (property: Property) => {
        set((state) => {
            if(!state.current) {
                
                return state
            };
            return {
                current: editProperty(state.current, property)
            }
        })
    },

    reset: () => set(init),
}));