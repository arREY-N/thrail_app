import { ApplicationRepository } from '@/src/core/repositories/applicationRepository';
import { Application } from '@/src/types/entities/Application';
import { Property } from '@/src/types/Property';
import { create } from 'zustand';
import { BaseStore } from '../interface/storeInterface';
import { editProperty } from '../utility/editProperty';
export interface ApplicationState extends BaseStore<Application>{
    approveApplication: (id: string) => Promise<void>;
    rejectApplication: (id: string, message: string) => Promise<void>;
}

const applicationTemplate = {
    applicantName: null,
    userId: null,
    email: null,
    validId: null,
    businessName: null,
    address: null,
    servicedLocation: [],
    establishedOn: null,
    dti: null,
    denr: null,
    bir: null,
}

const init = {
    current: null,
    data: [],
    isLoading: false,
    error: null,
}

export const useApplicationsStore = create<ApplicationState>((set, get) =>({
    ...init,   

    fetchAll: async () => {
        const data = get().data;

        if(data.length > 0) return;
        
        set({ isLoading: true });

        try {
            const applications = await ApplicationRepository.fetchAll();
            set({
                data: applications, 
                isLoading: false
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed loading all applications',
                isLoading: false
            })
        }
    },

    load: async (id: string) => {
        set({ isLoading: true, error: null});
        
        if(!id){
            set({ 
                current: new Application(), 
                isLoading: false
            })
            return;
        }
        
        try {
            const data = get().data;
            let application = null;
            
            if(data.length > 0){
                application = data.find(a => a.id === id);
            }
        
            application = await ApplicationRepository.fetchById(id);

            if(!application) throw new Error('Application not found');

            set({
                current: application,
                isLoading: false,
            })
        } catch (err) {
            console.error((err as Error).message);
            set({ 
                error: (err as Error).message, 
                isLoading: false
            });            
        }
    },
    
    refresh: async () => {
        set({ isLoading: true, error: null});

        try{
            const applications = await ApplicationRepository.fetchAll();
            set({
                data: applications, 
                isLoading: false
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed reloading applications',
                isLoading: false,
            })
        }
    },

    create: async (data) => {
        const current = get().current;
        if(!current){
            set({ error: 'No new data to save '});
            return false;
        }
        set({isLoading: true, error: null });
        
        try {

            const completeApplication = new Application({ ...current, ...data})

            console.log(completeApplication)

            await ApplicationRepository.write(completeApplication);
                    
            set({ isLoading: false })
            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: 'Failed creating application',
                isLoading: false,
            })
            return false;
        }
    },

    approveApplication: async (id: string) => {
        set({ isLoading: true, error: null});
        try {
            const application = get().current;
            const data = get().data;

            const updatedApp = await ApplicationRepository.fetchById(id);

            if(!updatedApp) {
                throw new Error('Application cannot be found');
            }
            
            set({
                data: data.map(a => a.id === id ? updatedApp : a),
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed approving application',
                isLoading: false
            })
        }
    },

    rejectApplication: async (id: string, message: string) => {
        set({ isLoading: true, error: null});
        try {
            const application = get().current;
            const data = get().data;
            
            const updatedApp = new Application({
                ...application,
                status: 'rejected',
                message,
            });

            await ApplicationRepository.update(updatedApp);

            set({
                data: data.map(a => a.id === id ? updatedApp : a),
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed approving application',
                isLoading: false
            })
        }
    },

    delete: async (id: string) => {
        set({ isLoading: true, error: null })
        if(!id){
            set({
                error: 'No ID selected',
                isLoading: false,
            })
        }

        try {
            await ApplicationRepository.delete(id);
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
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
}))