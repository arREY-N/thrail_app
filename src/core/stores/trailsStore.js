import { deleteTrail, fetchAllTrails, getTrailMap, saveTrail } from '@/src/core/repositories/trailRepository';
import { getTrailWeather } from '@/src/core/repositories/weatherRepository';
import { create } from "zustand";

const trailTemplate = {
    name: '',
    length: null,
    province: [],
    address: '',
}

const hikingTrailTemplate = {
    trail: null,
    map: null,
    weather: null,
    hiking: false,
}

const init = {
    trails: [],
    isLoading: false,
    error: null,
    trail: trailTemplate,
    hikingTrail: hikingTrailTemplate
}


export const useTrailsStore = create((set, get) => ({
    ...init,

    selectTrail: async (id) => {
        const selectedTrail = get().trails.find(t => t.id === id);
        
        set({isLoading: true, error: null});

        if(!selectedTrail) 
            set({
                error: 'Trail not found',
                isLoading: false,
            });

        set({
            trail: selectedTrail,
            isLoading: false
        })
    },

    hikeTrail: async (id) => {
        set({ isLoading: true, error: null });

        try {
            const trail = get().trails.find(t => t.id === id);

            if(!trail) throw new Error('Trail not found');

            const map = await getTrailMap(id);
            const weather = await getTrailWeather(trail.province);

            set({
                hikingTrail: {
                    trail,
                    map, 
                    weather,
                    hiking: false
                },
                isLoading: false
            })
        } catch (err) {
            set({
                isLoading: false,
                error: err.message || 'Failed setting trail'
            })
        }
    },

    setOnHike: () => {
        const hiking = get().hikingTrail.hiking;
        console.log(hiking);

        set((state) => {
            return {
                hikingTrail: {
                    ...state.hikingTrail,
                    hiking: !hiking
                }
            }
        })
    },

    editTrail: async (trailData) => {
        set((state) => {
            return {
                trail: {...state.trail, ...trailData}
            }
        })
    },

    initTrail: () => {
        set({
            trail: trailTemplate,      
        })
    },

    reset: () => set(init),

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

    createTrail: async () => {
        set({isLoading: true, error: null});

        try {
            // validate if get().trail has complete data
            console.log((get().trail));
            const newTrail = await saveTrail(get().trail);
            
            set((state) => {
                const exists = state.trails.some(t => t.id === newTrail.id)
                
                return {
                    trails: exists 
                        ? state.trails.map(t => t.id === newTrail.id ? newTrail : t)
                        : [...state.trails, newTrail],
                    isLoading: false,
                    trail: trailTemplate
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

