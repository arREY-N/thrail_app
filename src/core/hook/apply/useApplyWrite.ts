import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { Application } from "@/src/core/models/Application/Application";
import { useApplicationsStore } from "@/src/core/stores/applicationsStore";
import { ApplicationUIConfig } from "@/src/fields/applicationFields";
import { useState } from "react";

export interface IApplyWrite extends IBaseWriteHook<Application> {

}

export type UseApplyWriteParams = {
    applicationId?: string
}

export default function useApplyWrite(params: UseApplyWriteParams = {}): IApplyWrite {
    const { applicationId } = params;

    const data = useApplicationsStore(s => s.data);
    
    const error = useApplicationsStore(s => s.error);
    const isLoading = useApplicationsStore(s => s.isLoading);
    const [localError, setLocalError] = useState<string | null>(null);
    const [application, setApplication] = useState<Application>(() => {
        const existing = data.find(d => d.id === applicationId);
        return existing ? new Application({ ...existing }) : new Application();
    })

    const information = ApplicationUIConfig;

    const options = {
        provinces: [...OPTIONS.provinces],
    }
    async function onUpdatePress(edit: TEdit){
        const { section, id, value } = edit;
    }

    async function onSubmitPress(){

    }

    async function onRemovePress(){

    }
    
    return {
        information,
        object: application,
        error: error || localError,
        isLoading,
        options,
        onRemovePress,
        onSubmitPress,
        onUpdatePress
    }
}