import { APPLICATION_INFO } from "@/src/fields/applicationFields";
import { useEffect } from "react";
import { useApplicationsStore } from "../stores/applicationsStore";
import { useAuthStore } from "../stores/authStore";

type ApplicationParams = {
    id: string
}

export default function useApply(params: ApplicationParams | null){    
    const application = useApplicationsStore(s => s.current);   
    const applications = useApplicationsStore(s => s.data);
    const loadApplication = useApplicationsStore(s => s.load);
    const fetchAllApplications = useApplicationsStore(s => s.fetchAll);
    const onEditProperty = useApplicationsStore(s => s.edit);
    const create = useApplicationsStore(s => s.create);

    const profile = useAuthStore(s => s.profile);
    
    const information = APPLICATION_INFO;

    useEffect(() => {
        fetchAllApplications()    
        loadApplication(params?.id)
    },[params?.id])


    const onApplyPress = () => {
        const applicant = {
            userId: profile?.id,
            email: profile?.email,
            name: `${profile?.firstname} ${profile?.lastname}`
        }

        console.log(applicant);
        create(applicant);
    }

    return {
        application,
        applications,
        information,
        onEditProperty,
        onApplyPress,
    }
}