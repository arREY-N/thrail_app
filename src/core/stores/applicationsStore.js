import { createApplication, fetchApplication, fetchApplications } from '@/src/core/repositories/applicationRepository';
import { create } from 'zustand';

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
    application: applicationTemplate,
    applications: [],
    isLoading: false,
    error: null,
}

export const useApplicationsStore = create((set,get) => ({
    ...init, 

    reset: () => set(init),

    loadAllApplications: async () => {
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

    loadApplication: async (id) => {
        if(get().applications.length > 0){
            const application = get().applications.find(a => a.id === id);

            if(application){
                set({ application })
                return;
            }
        }

        try {
            set({ isLoading: true, error: null});

            const application = await fetchApplication(id);

            if(!application) throw new Error('Application not found');

            set({
                application,
                isLoading: false,
            })
        } catch (err) {
            console.error(err.message);
            set({ error: err.message, isLoading: false});            
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
                    
            set({ isLoading: false })
            return applicationId;
        } catch (err) {
            throw new Error(err);
        }
    },

    editProperty: (property) => {
        const { type, key, value } = property;
        const application = get().application;
        
        let current = application[key] ?? null;
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
                application: {
                    ...state.application,
                    [key]: finalValue
                }
            }
        })
    }
}));