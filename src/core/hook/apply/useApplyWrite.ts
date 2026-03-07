import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { Application } from "@/src/core/models/Application/Application";
import { User } from "@/src/core/models/User/User";
import { useApplicationsStore } from "@/src/core/stores/applicationsStore";
import { useAuthStore } from "@/src/core/stores/authStore";
import setFinalValue from "@/src/core/utility/setFinalValue";
import { validate } from "@/src/core/utility/validate";
import { ApplicationUIConfig } from "@/src/fields/applicationFields";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export interface IApplyWrite extends IBaseWriteHook<Application> {
    onApproveApplication: (profile: User) => Promise<void>;
    onRejectApplication: (profile: User) => Promise<void>;
}

export type UseApplyWriteParams = {
    applicationId?: string,
    userId?: string
}

export default function useApplyWrite(params: UseApplyWriteParams = {}): IApplyWrite {
    const { applicationId, userId } = params;
    const profile = useAuthStore(s =>  s.profile);

    const data = useApplicationsStore(s => s.data);
    
    const error = useApplicationsStore(s => s.error);
    const isLoading = useApplicationsStore(s => s.isLoading);
    const create = useApplicationsStore(s => s.create);
    const [localError, setLocalError] = useState<string | null>(error);
    const [application, setApplication] = useState<Application>(() => {
        const existing = data.find(d => d.id === applicationId || d.owner.id === userId);
        return existing 
            ? new Application({ ...existing }) 
            : new Application({ 
                owner: {
                    id: profile?.id || '',
                    name: `${profile?.firstname} ${profile?.lastname}`,
                    email: profile?.email || '',
                    validId: '',
                }
            });
    })

    useEffect(() => {
        setLocalError(null);
    }, [])

    const information = ApplicationUIConfig;

    const options = {
        provinces: [...OPTIONS.provinces],
    }
    async function onUpdatePress(params: TEdit){
        const { section, id, value } = params;

        try {
            if(section !== 'root' && !id)
                throw new Error(`Missing key for ${section}`);
            
            const fieldConfig = information.find(f => f.section === section && f.id === id);
            
            const finalValue = setFinalValue<Application>({
                fieldConfig,
                draft: application,
                section,
                id,
                value,
            })
            
            setApplication(prev => {
                return section === 'root'
                    ? new Application({
                        ...prev,
                        [id]: finalValue
                    })
                    : new Application({
                        ...prev,
                        [section]: { ...(prev[section] as object), [id]: finalValue}
                    })
            })

        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving trail');   
        }

    }

    async function onSubmitPress(){
        try {
            if(!profile) throw new Error('Applicant must be logged in to apply for a business account.') 
                
            const errors = validate(application, information)

            if(errors.length > 0) 
                throw new Error(`${errors.join(', ')} missing`)

            const submitted = await create(application);
    
            if(!submitted) throw new Error('An error occured while submitting application.');
            
            router.back();
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed submitting application.')
        }
    }

    async function onRemovePress(){

    }

    async function onRejectApplication(user: User){
        try {
            if(user.role !== 'superadmin') 
                throw new Error('Only superadmins are allowed to reject applications')


        } catch (error: any) {
            setLocalError((error as Error).message || 'Failed rejecting application');
        }
    }

    async function onApproveApplication(user: User){
        try {
            if(user.role !== 'superadmin') 
                throw new Error('Only superadmins are allowed to approve applications')


        } catch (error: any) {
            setLocalError((error as Error).message || 'Failed rejecting application');
        }
    }

    
    return {
        information,
        object: application,
        error: localError,
        isLoading,
        options,
        onRemovePress,
        onSubmitPress,
        onUpdatePress,
        onRejectApplication,
        onApproveApplication,
    }
}