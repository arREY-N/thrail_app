import { BaseStore } from '@/src/core/interface/storeInterface';
import { TrailRepository } from '@/src/core/repositories/trailRepository';
import { editProperty } from '@/src/core/utility/editProperty';
import { validateTrail } from '@/src/core/utility/validate';
import { TRAIL_INFORMATION } from '@/src/fields/trailFields';
import { TrailUI } from '@/src/types/entities/Trail';
import { Property } from '@/src/types/Property';
import { create } from "zustand";

export interface TrailState extends BaseStore<TrailUI> {
    hikingTrail: TrailUI[] | [];
    setHikingTrail: (id: string) => TrailUI; 
    recommendedTrail: TrailUI[] | [];
    setRecommendedTrail: (id: string) => Promise<TrailUI[] | []> 
    discoverTrail: TrailUI[] | [];
    setDiscoverTrail: () => Promise<TrailUI[] | []>
}

const init = {
    data: [],
    current: null,
    isLoading: true,
    error: null,
    hikingTrail: [],
    recommendedTrail: [],
    discoverTrail: [],
}

export const useTrailsStore = create<TrailState>((set, get) => ({
    ...init,

    fetchAll: async () => {
        if(get().data.length > 0) return;

        set({isLoading: true, error: null});

        try {
            const trails = await TrailRepository.fetchAll();
            const sorted = trails.sort((a: TrailUI, b: TrailUI) => a.name.localeCompare(b.name))             
            set({
                data: sorted, 
                isLoading: false
            })
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed to load trails',
                isLoading: false
            });
        }
    },

    refresh: async () => {
        set({isLoading: true, error: null});

        try {
            const trails = await TrailRepository.fetchAll();
            const sorted = trails.sort((a: TrailUI, b: TrailUI) => a.name.localeCompare(b.name))             
            set({
                data: sorted, 
                isLoading: false
            })
        } catch (err) {
            console.error(err);
            set({
                error: (err as Error).message ?? 'Failed to load trails',
                isLoading: false
            });
        }
    },

    load: async (id: string | null) => {
        if(!id) {
            set({ current: new TrailUI() })
            return;
        }

        set({ isLoading: true, error: null})

        try {
            let trail: TrailUI | undefined | null = null;
            let data = get().data;

            if(data.length > 0){
                trail = data.find(t => t.id === id);
            } 

            if(!trail){
                trail = await TrailRepository.fetchById(id);
            }

            if(!trail){
                throw new Error(`Could not find trail with id ${id}`);
            }

            console.log(trail);
            const trailInstance = new TrailUI(trail);

            set({
                data: data.find(d => d.id === trailInstance.id)
                    ? data
                    : [...data, trailInstance],
                current: trailInstance,
                isLoading: false
            })
        } catch (err: any) {
            console.error(err.message);
            set({
                error: err.message,
                isLoading: false,
            })
        }
    },

    create: async () => {
        const current = get().current;            
        
        if(!current) {
            set({ error: 'No new data to save'});
            return false;
        }

        set({ isLoading: true, error: null });
        
        try {
            const validatedTrail = new TrailUI(current);

            const info = TRAIL_INFORMATION;
            const generalErrors = validateTrail(validatedTrail, info)            

            if(generalErrors.length > 0) 
                throw new Error(`${generalErrors.join(', ')} required`)
            
            const savedTrail = await TrailRepository.write(validatedTrail);
            
            set({
                data: get().data.some(d => d.id === savedTrail.id)
                    ? [...get().data.filter(d => d.id !== savedTrail.id), savedTrail] 
                    : [...get().data, savedTrail],
                isLoading: false,    
            })
            
            return true;
        } catch (err: any) {
            console.error(err);
            set({
                error: err.message ?? 'Failed to create new trail',
                isLoading: false
            })

            return false
        }
    },

    delete: async (id: string) => {
        set({isLoading: true, error: null});

        try{
            await TrailRepository.delete(id);

            set({
                data: get().data.filter(f => f.id !== id),
                isLoading: false,
            })
        } catch (err: any) {
            console.error(err);
            set({
                error: err.message ?? 'Failed to delete trail',
                isLoading: false
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

    setHikingTrail: () => {
        let trail: TrailUI = new TrailUI();
        return trail;
    },

    setDiscoverTrail: async () => {
        let discover: TrailUI[] = [];

        return discover;
    },

    setRecommendedTrail: async (id) => {
        let recommended: TrailUI[] = []
        return recommended;
    },

    // hikeTrail: async (id: string) => {
    //     set({ isLoading: true, error: null });

    //     try {
    //         const trail = get().data.find(t => t.id === id);

    //         if(!trail) throw new Error('Trail not found');

    //         const map = await TrailRepository.getMap(id);
    //         const weather = await getTrailWeather(trail.province);

    //         set({
    //             hikingTrail: {
    //                 trail,
    //                 map, 
    //                 weather,
    //                 hiking: false
    //             },
    //             isLoading: false
    //         })
    //     } catch (err: any) {
    //         set({
    //             isLoading: false,
    //             error: err.message || 'Failed setting trail'
    //         })
    //     }
    // },
}))

// export const useTrailsStore = create<TrailState>((set, get) => ({
//     ...init,

//     reset: () => set(init),

//     resetTrail: () => set({trail: trailTemplate}),


//     hikeTrail: async (id) => {
//         set({ isLoading: true, error: null });

//         try {
//             const trail = get().trails.find(t => t.id === id);

//             if(!trail) throw new Error('Trail not found');

//             const map = await getTrailMap(id);
//             const weather = await getTrailWeather(trail.province);

//             set({
//                 hikingTrail: {
//                     trail,
//                     map, 
//                     weather,
//                     hiking: false
//                 },
//                 isLoading: false
//             })
//         } catch (err) {
//             set({
//                 isLoading: false,
//                 error: err.message || 'Failed setting trail'
//             })
//         }
//     },

//     setOnHike: () => {
//         const hiking = get().hikingTrail.hiking;
//         console.log(hiking);

//         set((state) => {
//             return {
//                 hikingTrail: {
//                     ...state.hikingTrail,
//                     hiking: !hiking
//                 }
//             }
//         })
//     },

//     fetchTrails: async () => {
//         if(get().trails.length > 0) return;

//         set({isLoading: true, error: null});

//         try {
//             const trails = await fetchAllTrails();
//             const sorted = trails.sort((a, b) => a.name.localeCompare(b.name))             
//             set({
//                 trails: sorted, 
//                 isLoading: false
//             })
//         } catch (err) {
//             console.error(err);
//             set({
//                 error: err.message ?? 'Failed to load trails',
//                 isLoading: false
//             });
//         }
//     },

//     loadTrail: async (id) => {
//         if(get().trails.length > 0){
//             const trail = get().trails.find(t => t.id === id);

//             if(!trail){
//                 set({
//                     error: 'Trail Not found',
//                     trail: trailTemplate
//                 })
//                 return;
//             }

//             set({
//                 trail
//             })
//         }
//     },

//     refreshTrails: async () => {
//         set({isLoading: true, error: null});

//         try {
//             const trails = await fetchAllTrails();
//             set({trails, isLoading: false});
//         } catch (err) {
//             console.error(err);
//             set({
//                 error: err.message ?? 'Failed to load trails',
//                 isLoading: false
//             });
//         }
//     },

//     setRecommendedTrails: async (recommendations) => {
//         set({ isLoading: true, error: null});

//         try {
//             if(!recommendations) {
//                 console.log('No recommendation data');
//                 set({
//                     isLoading: false,
//                     recommendedTrails: []
//                 })
//                 return;
//             }
            
//             const trailList = get().trails;

//             const recommendedTrails = recommendations
//                 .map(m => trailList
//                     .find(t => t.id === m.trailId))
//                 .filter(Boolean);

//             set({
//                 recommendedTrails,
//                 isLoading: false
//             })
//         } catch (err) {
//             console.error(err);
//             set({
//                 error: err.message ?? 'Failed to load recommended trails',
//                 isLoading: false
//             })
//         }
//     },

//     setDiscoverTrails: () => {
//         set({ isLoading: true, error: null })

//         try {
//             // generate 5 random numbers
//             // fetch trails[random_number] save to discoverTrails

//             if(true){
//                 set({
//                     error: 'Function to be added soon',
//                     isLoading: false
//                 })
//                 return;
//             }

//             // set({
//             //     isLoading: false,
//             // })
//         } catch (err) {
//             console.error(err);
//             set({
//                 error: err.message || 'Failed loading discover trails'
//             })
//         }
//     }
// }));

