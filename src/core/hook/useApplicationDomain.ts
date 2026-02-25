import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useApplicationsStore } from "../stores/applicationsStore";
import { useAuthStore } from "../stores/authStore";
import { useBusinessesStore } from "../stores/businessesStore";

export type ApplicationParams = {
    applicationId: string,
}

export default function useApplicationDomain(params: ApplicationParams | null){
    const { profile } = useAuthStore();

    const [rejectionLetter, setRejectionLetter ]= useState<string | null>(null);
    
    const loadApplication = useApplicationsStore(s => s.load);
    const application = useApplicationsStore(s => s.current);
    const approveApplication = useApplicationsStore(s => s.approveApplication);
    const rejectApplication = useApplicationsStore(s => s.rejectApplication);
    const createBusiness = useBusinessesStore(s => s.create);
    const businessIsLoading = useBusinessesStore(s => s.isLoading);
    const applicationIsLoading = useApplicationsStore(s => s.isLoading);

    async function onApproveApplication(id: string){
        console.log('Approved by: ', profile?.username);
        console.log(application);   
        
        const created = await createBusiness(application, id);
        if(created){
            await approveApplication(id)
            console.log('BUSINESS CREATED');
            router.back();
        }
    }
    
    async function onRejectApplication(id: string){
        if(!rejectionLetter || rejectionLetter.trim().length === 0) {
            console.log('Include reason for rejection');
            return;
        }
        console.log('Rejected by: ', profile?.username);
        console.log('Reason: ', rejectionLetter);
        
        await rejectApplication(id, rejectionLetter)
        
        router.back();
    }

    useEffect(() => {
        loadApplication(params?.applicationId);
    },[params?.applicationId])

    return {
        application,
        isLoading: businessIsLoading || applicationIsLoading,
        setRejectionLetter,
        onApproveApplication,
        onRejectApplication,
        rejectionLetter,
    }
}