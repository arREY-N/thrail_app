import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { TRAIL_INFORMATION } from "@/src/fields/trailFields";
import { router } from "expo-router";
import { useEffect } from "react";
import { useMountainsStore } from "../stores/mountainsStore";

export default function useTrailHook({
    trailId = null,
    mode = null,
}){
    const { onDownloadPress } = useAppNavigation();
    
    const trail = useTrailsStore();

    const {
        mountains,
        loadAllMountains, 
    } = useMountainsStore();

    const information = TRAIL_INFORMATION;

    useEffect(() => {
        if(!trailId) trail.load();
        if(trailId && (mode === 'view' || mode === 'write')){
            console.log('With id ', mode)
            loadAllMountains();
            trail.load(trailId);
        }
        
        if(mode === 'write' && !trailId){
            loadAllMountains();
            console.log('No id', mode)
        } 

        if(mode === 'list') trail.fetchAll();
    }, [mode, trailId]);

    const onViewTrail = (trailId) => {  
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    const onBookPress = (trailId) => {
        console.log('TO FIX');
        // router.push({
        //     pathname: '/(main)/offer/list',
        //     params: { trailId }
        // })
    }

    const onHikePress = (trailId) => {
        console.log('TO FIX');
        // hikeTrail(trailId);
        // router.push({
        //     pathname: '/(main)/hike/view',
        // })
    }

    const onSubmitPress = async () => {
        const success = await trail.create();
        if(!success) return;
        router.replace('/(tabs)');
    }

    const onRemovePress = async () => {
        if(trailId) await trail.delete(trailId);
        router.replace('../trail/list');
    }

    return {
        trail: trail.current,
        trails: trail.data,
        loading: trail.isLoading,
        error: trail.error,
        information, 
        writeTrail: trail.writeTrail,
        //hikingTrail,
        // setOnHike,
        onEditProperty: trail.edit,
        onViewTrail,
        onBookPress,
        onHikePress,
        onDownloadPress,
        onSubmitPress,
        onRemovePress,
    }
}