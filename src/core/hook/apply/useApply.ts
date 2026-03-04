import { IBaseDomainHook } from "@/src/core/interface/domainHookInterface";
import { Application } from "@/src/core/models/Application/Application";
import { Role } from "@/src/core/models/User/User.types";
import { useApplicationsStore } from "@/src/core/stores/applicationsStore";
import { useEffect } from "react";

export interface IApplyDomain extends IBaseDomainHook{
    /** Access all submitted applications */
    applications: Application[]
    
    /** Access to an application */
    application: Application | null;
    
}

export type UseApplyParms = {
    role: Role;
    applicationId?: string
}

export default function useApply(params: UseApplyParms = { role: 'user' }): IApplyDomain {
    const { role, applicationId } = params;

    const isLoading = useApplicationsStore(s => s.isLoading);
    const error = useApplicationsStore(s => s.error);
    const application = useApplicationsStore(s => s.current);
    const applications = useApplicationsStore(s => s.data);

    const loadAllApplications = useApplicationsStore(s => s.fetchAll);
    const loadApplication = useApplicationsStore(s => s.load);

    useEffect(() => {
        if(role === 'superadmin' ) loadAllApplications();
    },[]);

    useEffect(() => {
        loadApplication(applicationId);
    },[applicationId])

    return {
        applications,
        application,
        isLoading,
        error,
    }
}