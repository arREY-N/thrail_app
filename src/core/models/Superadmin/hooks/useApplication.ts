import { useApplicationsStore } from "@/src/core/models/Application/Application";
import { useBusinessesStore } from "@/src/core/models/Business/Business";
import { useEffect, useState } from "react";

export type ApplicationParams = {
    applicationId?: string,
}

export function useSuperadminApply(params: ApplicationParams = {}) {
    const [rejectionLetter, setRejectionLetter] = useState<string | null>(null);

    const loadApplication = useApplicationsStore(s => s.load);
    const application = useApplicationsStore(s => s.current);
    const businessIsLoading = useBusinessesStore(s => s.isLoading);
    const applicationIsLoading = useApplicationsStore(s => s.isLoading);

    async function onApproveApplication(id: string) {
    }

    async function onRejectApplication(id: string) {
    }

    useEffect(() => {
        loadApplication(params?.applicationId);
    }, [loadApplication, params?.applicationId])

    return {
        application,
        isLoading: businessIsLoading || applicationIsLoading,
        setRejectionLetter,
        onApproveApplication,
        onRejectApplication,
        rejectionLetter,
    }
}