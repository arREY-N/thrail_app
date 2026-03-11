import { Application } from "@/src/core/models/Application/Application";
import { Business } from "@/src/core/models/Business/Business";
import { Role } from "@/src/core/models/User/User.types";
import { useApplicationsStore } from "@/src/core/stores/applicationsStore";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { router } from "expo-router";
import { useState } from "react";

export type UseManageApplicationParams = {
    applicationId?: string;
    role: Role | null,
}

export interface IUseManageApplication {
    onApproveApplication: () => Promise<void>;
    onRejectApplication: () => Promise<void>;
    setRejectionLetter: (text: string) => void;

    application: Application;
    isLoading: boolean;
    error: string | null;
}

export default function useManageApplication(params: UseManageApplicationParams = { role: 'user'}): IUseManageApplication{
    const { applicationId, role } = params;
    const data = useApplicationsStore(s => s.data);
    const create = useBusinessesStore(s => s.create);
    const rejectApplication = useApplicationsStore(s => s.rejectApplication);
    const approveApplication = useApplicationsStore(s => s.approveApplication);
    const applicationError = useApplicationsStore(s => s.error);
    const businessError = useBusinessesStore(s => s.error);
    const businessLoading = useBusinessesStore(s => s.isLoading);
    const applicationLoading = useApplicationsStore(s => s.isLoading);

    const [localError, setLocalError] = useState<string | null>(null);

    const [application, setApplication] = useState<Application>(() => {
        if(role !== 'superadmin') return new Application();

        const current = data.find(app => app.id === applicationId);
        return current ? new Application({...current}) : new Application();
    });

    const onApproveApplication = async () => {
        try {
            console.log('Approving: ', application)
    
            if(role !== 'superadmin')
                throw new Error('Only superadmins can approve application');
            
            application.status = 'approved';

            const business = Business.fromApplication(application);

            const applicationId = application.id;
            
            const created = await create(business, applicationId);
            
            if(created) {
                await approveApplication(application.id);
                router.back();
            }
        } catch (error) {
            setLocalError((error as Error).message || 'Failed approving application')        
        } 
    }
    
    const onRejectApplication = async () => {
        console.log('Rejecting: ', application.message)
        try {
            if(application.message.trim().length === 0){
                console.log('Missing letter');
                throw new Error('Reason for rejection must be provided');
            }
            
            application.status = 'rejected';

            await rejectApplication(application)
            router.back();
        } catch (error) {
            setLocalError((error as Error).message || 'Failed rejecting application')
        }
        
    }

    const setRejectionLetter = (letter: string) => {
        setApplication(prev => {
            return new Application({
                ...prev,
                message: letter,
            })
        })
    }

    return {
        onApproveApplication,
        onRejectApplication,
        setRejectionLetter,
        application,
        isLoading: businessLoading || applicationLoading,
        error: applicationError || businessError || localError,
    }

}