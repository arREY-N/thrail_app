import { OPTIONS } from "@/src/constants/constants";
import { IBaseWriteHook, TEdit } from "@/src/core/interface/domainHookInterface";
import { validate } from "@/src/core/utility/validate";
import { TrailUIConfig } from "@/src/fields/trailFields";
import { router } from "expo-router";
import { useState } from "react";
import { Trail } from "../../models/Trail/Trail";
import { useMountainsStore } from "../../stores/mountainsStore";
import { useTrailsStore } from "../../stores/trailsStore";

/** */
type TrailParams = {
    trailId?: string;
}

export interface IUseTrailWrite extends IBaseWriteHook<Trail> {}

/** Provide access to write and/or delete trails */
export default function useTrailWrite(params: TrailParams = {}): IUseTrailWrite{
    const { trailId } = params;

    const information = TrailUIConfig;
    
    const trails = useTrailsStore(s => s.data);
    const mountains = useMountainsStore(s => s.data);
    
    const error = useTrailsStore(s => s.error);
    const isLoading = useTrailsStore(s => s.isLoading);
    const remove = useTrailsStore(s => s.delete);
    const create =  useTrailsStore(s => s.create);

    const [localError, setLocalError] = useState<string | null>(null);
    const [trail, setTrail] = useState<Trail>(() => {
        const existing = trails.find(t => t.id === trailId);
        return existing ? new Trail({ ...existing }) : new Trail() ;
    })

    const options = {
        mountains: [...mountains.map(m => m.name)],
        provinces: [...OPTIONS.provinces],
        circularity: [...OPTIONS.circularity],
        quality: [...OPTIONS.quality],
        difficultyPoints: [...OPTIONS.difficulty_points],
        viewpoints: [...OPTIONS.viewpoints],
    }

    /**
     * @param section - checks if property is a root property or an object
     * @param key - if an object, a key must be provided
     * @param value - the value to be saved
     */
    const onUpdatePress = (params: TEdit<Trail>) => {
        const { section, id, value } = params;

        try {
            if(section !== 'root' && !id)
                throw new Error(`Missing key for ${String(section)}`);
            
            
            const fieldConfig = information.find(f => f.section === section && f.id === id);
            
            let finalValue = value;
            
            if (fieldConfig?.type === 'object-select' && fieldConfig.options === 'mountains') {
                const found = mountains.find(m => m.name === value);
                finalValue = found ? found.name : value;
            } else if (fieldConfig?.type === 'multi-select') {
                const current: [] = section === 'root'
                    ? trail[id]
                    : trail[section][id]

                finalValue = current.find(c => c === value)
                    ? current.filter(c => c !== value)
                    : [...current, value]
            } else if (fieldConfig?.type === 'boolean') {
                const current: boolean = section === 'root'
                    ? trail[id]
                    : trail[section][id];

                finalValue = current === null
                    ? true
                    : !current;
            } else if (fieldConfig?.type === 'single-select') {
                const current: string = section === 'root'
                    ? trail[id]
                    : trail[section][id]

                finalValue = current === value 
                    ? ''
                    : value
            } else if (fieldConfig?.type === 'numerical') {
                if(value.trim() === ''){
                    finalValue = 0;
                } else {
                    let cleaned = value.replace(',', '.');

                    cleaned = cleaned.replace(/[^0-9.]/g, '');

                    const parts = cleaned.split('.');

                    if (parts.length > 2) {
                        cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
                    }

                    const result = parseFloat(cleaned);
                    finalValue = isNaN(result) ? 0 : result;
                }
            }


            setTrail(prev => {
                return section === 'root'
                    ? new Trail({
                        ...prev,
                        [id]: finalValue
                    })
                    : new Trail({
                        ...prev,
                        [section]: { ...(prev[section] as object), [id]: finalValue}
                    })
            })
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving trail');   
        }
    }

    const onSubmitPress = async () => {
        try {
            const result = validate(trail, TrailUIConfig);

            if(result.length > 0) throw new Error(`${result.join(', ')} missing`)

            const created = await create(trail);

            if(!created) throw new Error('Error in saving trail in store');

            router.back();
        } catch (error: any) {
            setLocalError(error instanceof Error ? error.message : 'Failed saving trail');   
        }
    }

    const onRemovePress = async (trailId: string) => {
        if(trailId) await remove(trailId);
        // TODO fix routing location post-deletion
        router.replace('../trail/list');
    }


    

    // const onSubmitPress = async () => {
    //     const success = await create();
    //     if(!success) return;
    //     router.replace('/(tabs)');
    // }

    
    
    return {
        information,
        object: trail, 
        error: error || localError,
        isLoading,
        options,
        onSubmitPress,
        onRemovePress,
        onUpdatePress,
    };
}