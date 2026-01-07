import { createApplication, fetchApplications } from '@/src/core/repositories/applicationRepository';
import { create } from 'zustand';

const init ={
    applications: [],
    isLoading: false,
    error: null,
}

export const useApplicationsStore = create((set,get) => ({
    ...init, 

    reset: () => set(init),

    loadApplications: async () => {
        console.log('Loading applications');
        if(get().applications.length > 0) return;
        
        set({isLoading: true});

        try {
            const applications = await fetchApplications();
            set({applications, isLoading: false});
        } catch (err) {
            set({
                error: err.message ?? 'Failed loading all applications',
                isLoading: false
            })
        }
    },

    reloadApplications: async () => {
        set({isLoading: true});

        try{
            const applications = await fetchApplications();
            set({applications, isLoading: false});
        } catch (err) {
            set({
                erro: err.message ?? 'Failed reloading applications'
            })
        }
    },

    approveApplication: async (id) => {
        set({isLoading: true});

        try {
            console.log('hello');
            const current = get().applications;
            const app = current.find(a => a.userId === id);
            
            if(!app) throw new Error('Application not found');
            
            const updatedApp = {
                ...app,
                approved: true
            }

            set((state)=>{
                return{
                    applications: state.applications.map(
                        a => a.id === id ? updatedApp : a
                    ),
                    isLoading: false
                }
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed approving application',
                isLoading: false
            })
        }
    },

    createApplication: async (businessData) => {
        set({isLoading: true});

        try {
            if(!businessData.email || !businessData.businessName || !businessData.businessAddress || !businessData.province || !businessData.userId) 
                throw new Error('Please fill up all information');
            
            const applicationId = await createApplication(businessData);
                    
            return applicationId;
        } catch (err) {
            throw new Error(err);
        }
    }
}));