import { ApplicationRepository } from '@/src/core/repositories/applicationRepository';
import { create } from 'zustand';
import { BaseStore } from '../interface/storeInterface';
import { Application } from '../models/Application/Application';
export interface ApplicationState extends BaseStore<Application>{
    approveApplication: (id: string) => Promise<void>;
    rejectApplication: (application: Application) => Promise<void>;
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

    create: async (application: Application) => {
        const data = get().data;
        
        set({isLoading: true, error: null });
    
        try {
            data.map(t => {
                const applicant = t.owner.id;
                const save = application.owner.id;
                
                if(applicant === save){
                    const currentStatus = t.status;
                    
                    switch(currentStatus){
                        case 'approved':
                            throw new Error('An application made with your user ID has been approved.')
                        case 'pending':
                            throw new Error('An application made with your user ID is still pending.')
                        case 'reviewed':
                            throw new Error('An application made with your user ID is still under review.')
                        case 'rejected':
                            throw new Error('An application made with your user ID was rejected.')
                        default:
                            throw new Error('Application status unknown.')
                    }
                }
            })

            console.log(application);

            const created = await ApplicationRepository.write(application);
                    
            set((state) => {
                return {
                    data: [...state.data, created],
                    isLoading: false 
                } 
            })
            
            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed creating application',
                isLoading: false,
            })
            throw err;
        }
    },

    approveApplication: async (id: string) => {
        set({ isLoading: true, error: null});
        try {
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
            throw err
        }
    },

    rejectApplication: async (application: Application) => {
        set({ isLoading: true, error: null});
        try {
            const data = get().data;
            
            await ApplicationRepository.update(application);

            set({
                data: data.map(a => a.id === application.id ? application : a),
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

    reset: () => set(init),
}))