import { BaseStore } from '@/src/core/interface/storeInterface';
import { IRecommendedTrail } from '@/src/core/models/Recommendation/Recommendation.types';
import { TrailRepository } from '@/src/core/repositories/trailRepository';
import { dummyTrails } from '@/src/core/stores/dummyData';
import { create } from "zustand";
import { immer } from 'zustand/middleware/immer';
import { Trail } from '../models/Trail/Trail';
export interface TrailState extends BaseStore<Trail> {
    hikingTrail: {
        trail: Trail | null;
        hiking: boolean;
    };
    setHikingTrail: (id: string) => void; 
    recommendedTrail: Trail[];
    setRecommendedTrail: (trails: IRecommendedTrail[]) => Promise<Trail[]> 
    discoverTrail: Trail[];
    setDiscoverTrail: () => Promise<Trail[]>;
    setOnHike: () => void;
}

const init = {
    data: dummyTrails,
    current: null,
    isLoading: true,
    error: null,
    hikingTrail: {
        trail: null,
        hiking: false,
    },
    recommendedTrail: [],
    discoverTrail: [],
}

export const useTrailsStore = create<TrailState>()(immer((set, get) => ({
    ...init,

    fetchAll: async () => {
        if(get().data.length > 0) return;

        set({isLoading: true, error: null});

        try {
            const trails = await TrailRepository.fetchAll();
            const sorted = trails.sort((a: Trail, b: Trail) => a.general.name.localeCompare(b.general.name))             
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
            const sorted = trails.sort((a: Trail, b: Trail) => a.general.name.localeCompare(b.general.name))             
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
            set({ current: new Trail() })
            return;
        }

        set({ isLoading: true, error: null})

        try {
            let trail: Trail | undefined | null = null;
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

            set({
                data: data.find(d => d.id === trail.id)
                    ? data
                    : [...data, trail],
                current: trail,
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

    create: async (trail: Trail) => {
        set({ isLoading: true, error: null });
        const data = get().data;

        try {
            data.find(t => {
                const name = t.general.name.toUpperCase().trim();
                const save = trail.general.name.toUpperCase().trim();

                if(name.includes(save) && t.id !== trail.id) 
                    throw new Error('A trail with the same name already exists.')
                }
            )

            console.log('New:', trail);
            const saved = await TrailRepository.write(trail);

            set({
                data: get().data.some(d => d.id === saved.id)
                    ? [...get().data.filter(d => d.id !== saved.id), saved] 
                    : [...get().data, saved],
                isLoading: false,    
            })
            return true;
        } catch (err: any) {
            console.error(err.message);
            set({
                error: err.message,
                isLoading: false,
            })
            return false;
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

    reset: () => set(init),

    setHikingTrail: (id: string) => {
        set({ isLoading: true, error: null })
        console.log('setting: ', id);
        try {
            const data = get().data;
            const trail = data.find(t => t.id === id);

            if(!trail){
                set({ 
                    error: 'Trail not found', 
                    isLoading: false 
                })
                return;
            }

            set((state) => {
                return {
                    hikingTrail: {
                        ...state.hikingTrail,
                        trail,
                    }
                }
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false
            })
        }
        let trail: Trail = new Trail();
        return trail;
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

    setDiscoverTrail: async () => {
        let discover: Trail[] = [];

        return discover;
    },

    setRecommendedTrail: async (trails: IRecommendedTrail[]) => {
        let recommended: Trail[] = []
        return recommended;
    },
})))