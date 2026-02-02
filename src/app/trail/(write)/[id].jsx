import WriteComponent from "@/src/components/CustomWriteComponents";
import { TRAIL_CONSTANTS } from '@/src/constants/trails';
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function writeTrail(){
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const trailInformation = TRAIL_CONSTANTS.TRAIL_INFORMATION;
    const system = useTrailsStore(s => s.error);
    const trail = useTrailsStore(s => s.trail);
    const isLoading = useTrailsStore(s => s.isLoading);

    const removeTrail = useTrailsStore(s => s.removeTrail);
    const writeTrail = useTrailsStore(s => s.writeTrail);
    const createTrail = useTrailsStore(s => s.createTrail);
    const onEditProperty = useTrailsStore(s => s.editProperty);
    const resetTrail = useTrailsStore(s => s.resetTrail);

    useEffect(() => {
        resetTrail();
        if(id){
            writeTrail(id);
        }
    }, [id])

    const onSubmitTrailPress = async () => {
        const success = await createTrail();
        if(!success) return;
        router.back();
    }

    const onRemovePress = async () => {
        if(id) await removeTrail(id);
        router.back();
    }
    
    return (
        <WriteComponent
            informationSet={trailInformation}
            object={trail}
            system={system}
            isLoading={isLoading}
            onSubmit={onSubmitTrailPress}
            onDelete={onRemovePress}
            onEditProperty={onEditProperty}
        />
    )
}