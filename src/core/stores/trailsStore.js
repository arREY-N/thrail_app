import { fetchAllTrails } from '@/src/core/repositories/trailRepository';
import { create } from "zustand";
/**
 * Trails shared store
 */
export const useTrailsStore = create((set, get) => ({
    trails: [],
    isLoading: false,
    error: null,

    /**
     * Load trails only once
     */
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

    refresehTrails: async () => {
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
    }
}));

