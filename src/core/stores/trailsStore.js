import { TRAIL_CONSTANTS } from '@/src/constants/trails';
import { validateTrail } from '@/src/core/domain/utility';
import { deleteTrail, fetchAllTrails, getTrailMap, saveTrail } from '@/src/core/repositories/trailRepository';
import { getTrailWeather } from '@/src/core/repositories/weatherRepository';
import { create } from "zustand";

const trailTemplate = {
    name: null,
    province: [],
    address: null,
    longitude: null,
    latitude: null,
    masl: null,
    start: null,
    end: null,
    length: null,
    gain: null,
    slope: null,
    obstacles: null,
    circularity: null,
    quality: null,
    hours: null,
    difficulty_points: null,
    shelter: null,
    resting: null,
    viewpoint: null,
    information_board: null,
    clean_water: null,
    river: null,
    lake: null,
    waterfall: null,
    monument: null,
    community: null,
}

const hikingTrailTemplate = {
    trail: null,
    map: null,
    weather: null,
    hiking: false,
}

const init = {
    trails: [],
    isLoading: true,
    error: null,
    trail: trailTemplate,
    hikingTrail: null,
    recommendedTrails: [],
    discoverTrails: [],
}


export const useTrailsStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    resetTrail: () => set({trail: trailTemplate}),

    writeTrail: (id) => {
        set({isLoading: true, error: null});

        try {
            if(get().trails.length > 0 && get().trails.find(t => t.id === id)){
                set({
                    trail: get().trails.find(t => t.id === id),
                    isLoading: false,
                })
                return;
            }

            set({
                trail: trailTemplate,
                isLoading: false
            })
        } catch (err) {
            set({
                error: err.message || 'Failed writing trail',
                isLoading: false
            })
        }
    },

    createTrail: async () => {
        set({isLoading: true, error: null});

        try {
            const info = TRAIL_CONSTANTS.TRAIL_INFORMATION;
            console.log('CREATE TRAIL: ', get().trail);
            
            const generalErrors = validateTrail(
                get().trail, 
                {...info.general, ...info.geography, ...info.difficulty_points}
            )            

            if(generalErrors.length > 0) 
                throw new Error(`${generalErrors.join(', ')} required`)
            
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
            return true;
        } catch (err) {
            console.error(err);
            set({
                error: err.message ?? 'Failed to create new trail',
                isLoading: false
            })

            return false
        }
    },

    editProperty: (property) => {
        const { type, key, value } = property;
        const trail = get().trail;
        
        let current = trail[key] ?? null;
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
                trail: {
                    ...state.trail,
                    [key]: finalValue
                }
            }
        })
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

    loadAllTrails: async () => {
        if(get().trails.length > 0) return;

        set({isLoading: true, error: null});

        try {
            const trails = await fetchAllTrails();
            const sorted = trails.sort((a, b) => a.name.localeCompare(b.name))             
            set({
                trails: sorted, 
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

    loadTrail: async (id) => {
        if(get().trails.length > 0){
            const trail = get().trails.find(t => t.id === id);

            if(!trail){
                set({
                    error: 'Trail Not found',
                    trail: trailTemplate
                })
                return;
            }

            set({
                trail
            })
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

    setDiscoverTrails: () => {
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

