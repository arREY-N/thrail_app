import { OPTIONS } from "@/src/constants/constants";
import { TrailUIConfig } from "@/src/fields/trailFields";
import { router } from "expo-router";
import { useEffect } from "react";
import { IFormField } from "../../interface/formFieldInterface";
import { Trail } from "../../models/Trail/Trail";
import { useMountainsStore } from "../../stores/mountainsStore";
import { useTrailsStore } from "../../stores/trailsStore";

type TrailParams = {
    id: string;
}

export interface IuseTrailWrite {
    information: IFormField[],
    trail: Trail | null, 
    error: string | null,
    isLoading: boolean,

    options: {
        [key: string]: string[] | any[];
    },
    
    onSubmitPress: () => Promise<void>,
    onRemovePress: (id: string) => Promise<void>,
    onEditProperty: (section: string, id: string, value: any) => void,
}

export default function useTrailWrite(params: TrailParams): IuseTrailWrite{
    const information = TrailUIConfig;

    const trail = useTrailsStore(s => s.current);
    const error = useTrailsStore(s => s.error);
    const isLoading = useTrailsStore(s => s.isLoading);
    const create = useTrailsStore(s => s.create);
    const remove = useTrailsStore(s => s.delete);
    const edit = useTrailsStore(s => s.editTrail);
    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        load(params.id);
    }, [params.id]);

    const mountains = useMountainsStore(s => s.data);
    
    const options = {
        mountains: [...mountains.map(m => m.name)],
        provinces: [...OPTIONS.provinces],
        circularity: [...OPTIONS.circularity],
        quality: [...OPTIONS.quality],
        difficultyPoints: [...OPTIONS.difficulty_points],
        viewpoints: [...OPTIONS.viewpoints],
    }

    const onSubmitPress = async () => {
        const success = await create();
        if(!success) return;
        router.replace('/(tabs)');
    }

    const onRemovePress = async (trailId: string) => {
        if(trailId) await remove(trailId);
        router.replace('../trail/list');
    }

    const onEditProperty = (section: string, id: string, value: any) => {
        let finalValue = value;

        const fieldConfig = information.find(f => f.section === section && f.id === id);

        if (fieldConfig?.type === 'object-select' && fieldConfig.options === 'mountains') {
            const found = mountains.find(m => m.name === value);
            finalValue = found ? found.name : value;
        }

        console.log(section, id, finalValue);

        edit(section, id, finalValue);
    }
    
    
    return {
        information,
        trail, 
        error,
        isLoading,
        options,
        onSubmitPress,
        onRemovePress,
        onEditProperty
    } as IuseTrailWrite;
}