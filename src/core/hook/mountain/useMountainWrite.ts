import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { Mountain } from "@/src/core/models/Mountain/Mountain";
import { validate } from "@/src/core/utility/validate";
import { MountainUIConfig } from "@/src/fields/mountainFields";
import { router } from "expo-router";
import { useState } from "react";
import { useMountainsStore } from "../../stores/mountainsStore";

export interface IUseMountainWriteParams {
    mountainId?: string; 
}

export interface IUseMountainWrite extends IBaseWriteHook<Mountain> {}

export default function useMountainWrite(params: IUseMountainWriteParams): IUseMountainWrite{
    const { mountainId } = params;

    const mountains = useMountainsStore(s => s.data);
    const information = MountainUIConfig;
    const error = useMountainsStore(s => s.error);
    const isLoading = useMountainsStore(s => s.isLoading);
    
    const [localError, setLocalError] = useState<string | null>(null);
    const [mountain, setMountain] = useState<Mountain>(() => {
        const existing = mountains.find(m => m.id === mountainId);
        return existing ? new Mountain({...existing}) : new Mountain();
    })

    const options = {
        provinces: [...OPTIONS.provinces],
    }

    const create = useMountainsStore(s => s.create);
    const edit = useMountainsStore(s => s.edit);
    const remove = useMountainsStore(s => s.delete);

    const onSubmitPress = async () => {
        setLocalError(null)
        console.log(mountain);

        try {
            const errors = validate(mountain, information);
            
            if(errors.length > 0) 
                throw new Error(`${errors.join(', ')} missing`)

            console.log('Create: ', mountain)
            const created = await create(mountain);
            
            if(created) router.back();
        } catch (error: any) {
            setLocalError(error instanceof Error ? error.message : 'Failed submitting data')
        }
    }

    const onRemovePress = async () => {
        // if(mountainId) await remove(mountainId);
        // router.back();
    }

    const onUpdatePress = (params: TEdit) => {
        const { section, id, value} = params;
        try {
            if(section !== 'root' && !id)
                throw new Error(`Missing key for ${section}`);
            
            let finalValue = value;

            const fieldConfig = information.find(f => f.section === section && f.id === id);

            if (fieldConfig?.type === 'multi-select') {
                const current: [] = section === 'root'
                    ? mountain[id]
                    : mountain[section][id]

                finalValue = current.find(c => c === value)
                    ? current.filter(c => c !== value)
                    : [...current, value]
            }
            
            setMountain(prev => {
                return section === 'root'
                    ? new Mountain({
                        ...prev,
                        [id]: finalValue
                    })
                    : new Mountain({
                        ...prev,
                        [section]: { ...(prev[section] as object), [id]: finalValue}
                    })
            })

        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving trail');   
        }
    }

    return {
        object: mountain,
        information,
        error: error || localError,
        isLoading,
        options,
        onUpdatePress,
        onSubmitPress,
        onRemovePress,
    }

}