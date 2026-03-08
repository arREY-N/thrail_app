import { useEffect, useState } from "react";
import { useApplicationsStore } from "../../stores/applicationsStore";
import { useAuthStore } from "../../stores/authStore";
import { useBusinessesStore } from "../../stores/businessesStore";

export type ApplicationParams = {
    applicationId?: string,
}

export default function useSuperadminApply(params: ApplicationParams = {}){
    const { profile } = useAuthStore();

    const [rejectionLetter, setRejectionLetter ]= useState<string | null>(null);
    
    const loadApplication = useApplicationsStore(s => s.load);
    const application = useApplicationsStore(s => s.current);
    const businessIsLoading = useBusinessesStore(s => s.isLoading);
    const applicationIsLoading = useApplicationsStore(s => s.isLoading);

    async function onApproveApplication(id: string){
    }
    
    async function onRejectApplication(id: string){
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