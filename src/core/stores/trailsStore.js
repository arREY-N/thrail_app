import { validateTrailData } from '@/src/core/domain/trailDomain';
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
    hikingTrail: hikingTrailTemplate,
    recommendedTrails: [],
    discoverTrails: [],
}


export const useTrailsStore = create((set, get) => ({
    ...init,

    selectTrail: async (id) => {
        set({isLoading: true, error: null});

        if(!id){
            get().initTrail();
            return;
        }

        const selectedTrail = get().trails.find(t => t.id === id);

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
            console.log(trails);
            
            set({
                trails: trails, 
                isLoading: false
            })
        } catch (err) {
            console.error(err);
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
            console.error(err);
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

            validateTrailData(get().trail);

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
            console.error(err);
            set({
                error: err.message ?? 'Failed to create new trail',
                isLoading: false
            })
        }
    },

    updateTrail: (id) => {
        set({ isLoading: true, error: null });
        
        try {
            const selectedTrail = get().trails.find(t => t.id === id);

            if(!selectedTrail) throw new Error('Trail not found');

            set({
                isLoading: false,
                trail: selectedTrail
            });
        } catch (err) {
            console.error(err);
            set({
                isLoading: false,
                error: err.message
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
            console.error(err);
            set({
                error: err.message ?? 'Failed to delete trail',
                isLoading: false
            })
        }
    },

    setRecommendedTrails: async (recommendations) => {
        set({ isLoading: true, error: null});

        try {
            if(!recommendations) {
                console.log('No recommendation data');
                set({
                    isLoading: false,
                    recommendedTrails: []
                })
                return;
            }
            
            const trailList = get().trails;

            const recommendedTrails = recommendations
                .map(m => trailList
                    .find(t => t.id === m.trailId))
                .filter(Boolean);

            set({
                recommendedTrails,
                isLoading: false
            })
        } catch (err) {
            console.error(err);
            set({
                error: err.message ?? 'Failed to load recommended trails',
                isLoading: false
            })
        }
    },

    loadDiscoverTrails: () => {
        set({ isLoading: true, error: null })

        try {
            // generate 5 random numbers
            // fetch trails[random_number] save to discoverTrails

            if(true){
                set({
                    error: 'Function to be added soon',
                    isLoading: false
                })
                return;
            }

            // set({
            //     isLoading: false,
            // })
        } catch (err) {
            console.error(err);
            set({
                error: err.message || 'Failed loading discover trails'
            })
        }
    }
}));

