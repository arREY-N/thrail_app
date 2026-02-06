import { create } from "zustand";
import { deleteMountain, fetchAllMountains, fetchMountain, writeMountain } from "../repositories/mountainRepository";

const MOUNTAIN_TEMPLATE = {
    name: null,
    province: []
}

const init = {
    isLoading: false,
    error: null,
    mountain: null,
    mountains: [],
}

export const useMountainsStore = create((set, get) => ({
    ...init,

    loadAllMountains: async () => {
        console.log('here');
        try {
            if(get().mountains.length > 0) return;
            
            set({ isLoading: true, error: null});
            
            const mountains = await fetchAllMountains();

            if(mountains.length === 0){
                console.log('No mountains available');
                set({ mountains: [], isLoading: false });
                return;
            }

            set({
                mountains: mountains.sort((a,b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase())),
                isLoading: false
            })
        } catch (err) {
            console.error(err.message);
            set({
                error: err.message || 'Failed loading mountains',
                isLoading: false,
            })
        }
    },

    loadMountain: async (id) => {
        set({ isLoading: true, error: null });
        console.log(id);
        if(!id) {
            console.log('No id')
            set({ isLoading: false, mountain: MOUNTAIN_TEMPLATE })
            return;
        }
        
        try {
            if(get().mountains.length > 0){
                const mountain = get().mountains.find(m => m.id === id);
    
                if(!mountain) {
                    set({ mountain: MOUNTAIN_TEMPLATE});
                } else {
                    set({ mountain, isLoading: false });
                    return;
                }
            }

            const mountain = await fetchMountain(id);

            if(!mountain) throw new Error('Mountain not found')

            set({
                mountain,
                isLoading: false,
            })
        } catch (err) {
            console.error(err.message);
            set({
                error: err.message || 'Failed loading mountain',
                isLoading: false,
            })
        }
    },

    writeMountain: async () => {
        try {
            set({ isLoading: true, error: null });
            
            const data = get().mountain;

            if(get().mountains.find(m => m.name.toUpperCase().includes(data.name.toUpperCase()) && m.id !== data.id)){
                throw new Error('This mountain already exists')
            }

            const mountain = await writeMountain(data);

            if(!mountain) throw new Error('Mountain not written');

            set((state) => {
                const newList = state.mountains.find(m => m.id === mountain.id)
                    ? [...state.mountains.filter(m => m.id !== mountain.id), mountain]
                    : [...state.mountains, mountain];
                const sorted = newList.sort((a, b) => a.name.localeCompare(b.name));

                console.log(sorted);
                
                return {
                    mountains: sorted,
                    isLoading: false
                }
            })
            
            return true;
        } catch (err) {
            console.error(err.message);
            set({
                error: err.message || 'Failed writing mountain',
                isLoading: false,
            })
        }
    },
    
    deleteMountain: async (id) => {
        set({ isLoading: true, error: null});

        try {
            console.log('Delete: ', id)
            const mountain = get().mountains.find(m => m.id === id); 
            if(!mountain) throw new Error('Mountain not found')
            
            await deleteMountain(id);

            const updated = get().mountains.filter(m => m.id !== id);
            console.log(updated);

            set({
                mountains: updated,
                isLoading: false,
            })
        } catch (err) {
            console.error(err.message);
            set({
                error: err.message || 'Failed writing mountain',
                isLoading: false,
            })
        }
    },

    editProperty: (property) => {
        const { type, key, value } = property;
        const mountain = get().mountain;
        
        let current = mountain[key] ?? null;
        let finalValue = value;
        
        if(type === 'multi-select'){
            current = current || [];
            finalValue = current?.find(v => v === value)
                ? current.filter(c => c !== value)
                : [...current, value]
        } else if (type ===  'boolean'){
            finalValue = !current
        } 

        set((state) => {
            return {
                mountain: {
                    ...state.mountain,
                    [key]: finalValue
                }
            }
        })
    }
}));