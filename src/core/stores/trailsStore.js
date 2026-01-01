import { deleteTrail, fetchAllTrails, saveTrail } from '@/src/core/repositories/trailRepository';
import { create } from "zustand";

export const useTrailsStore = create((set, get) => ({
    trails: [],
    isLoading: false,
    error: null,

    loadTrails: async () => {
        if(get().trails.length > 0) return;

        set({isLoading: true, error: null});

        try {
            const trails = await fetchAllTrails();
            set({trails, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load trails',
                isLoading: false
            });
        }
    },

    refreshTrails: async () => {
        set({isLoading: true, error: null});

        try {
            const trails = await fetchAllTrails();
            set({trails, isLoading: false});
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load trails',
                isLoading: false
            });
        }
    },

    createTrail: async (trailData) => {
        set({isLoading: true, error: null});

        try {
            const newTrail = await saveTrail(trailData);
            
            set((state) => {
                const exists = state.trails.some(t => t.id === newTrail.id)
                
                return {
                    trails: exists 
                        ? state.trails.map(t => t.id === newTrail.id ? newTrail : t)
                        : [...state.trails, newTrail],
                    isLoading: false,
                };
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed to create new trail',
                isLoading: false
            })
        }
    },

    removeTrail: async (id) => {
        set({isLoading: true, error: null});

        try{
            const trailId = await deleteTrail(id);

            set((state) => ({
                trails: state.trails.filter(t => t.id !== trailId),
                isLoading: false
            }))
        } catch (err) {
            set({
                error: err.message ?? 'Failed to delete trail',
                isLoading: false
            })
        }
    }
}));

