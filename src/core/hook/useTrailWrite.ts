import { TRAIL_INFORMATION } from "@/src/fields/trailFields";
import { Property } from "@/src/types/Property";
import { router } from "expo-router";
import { useEffect } from "react";
import { useMountainsStore } from "../stores/mountainsStore";
import { useTrailsStore } from "../stores/trailsStore";

type TrailParams = {
    id: string;
}

export default function useTrailWrite(params: TrailParams){
    const information = TRAIL_INFORMATION;

    const trail = useTrailsStore(s => s.current);
    const error = useTrailsStore(s => s.error);
    const isLoading = useTrailsStore(s => s.isLoading);
    const create = useTrailsStore(s => s.create);
    const remove = useTrailsStore(s => s.delete);
    const edit = useTrailsStore(s => s.edit);
    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        load(params.id);
    }, [params.id]);

    const mountains = useMountainsStore(s => s.data);
    const options = {
        mountains: [...mountains.map(m => m.name)]
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

    const onEditProperty = (property: Property) => {
        const { value, type } = property;
        let finalValue = value;

        if(type === 'object-select'){
            const object = mountains.find(t => t.name === property.value);
            finalValue = object ? object.name : '[missing]'; 
        }

        edit({
            ...property,
            value: finalValue
        })
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
    } 
}