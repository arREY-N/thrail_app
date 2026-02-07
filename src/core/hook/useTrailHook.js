import { TRAIL_CONSTANTS } from "@/src/constants/trails";
import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { router } from "expo-router";
import { useEffect } from "react";

export default function useTrailHook({
    trailId = null,
    mode = null,
}){
    const { onDownloadPress } = useAppNavigation();
    
    const { 
        loadTrail, 
        loadAllTrails, 
        trail, 
        trails,
        loading, 
        error,
        removeTrail,
        writeTrail,
        createTrail,
        onEditProperty,
        resetTrail,
        hikingTrail,
        setOnHike,
        hikeTrail,
    } = useTrailsStore();

    const information = TRAIL_CONSTANTS.TRAIL_INFORMATION;

    useEffect(() => {
        if(trailId && (mode === 'view' || mode === 'write')){
            console.log('With id ', mode)
            resetTrail();
            loadTrail(trailId);
        }
        
        if(mode === 'write' && !trailId){
            console.log('No id', mode)
            resetTrail();
        } 

        if(mode === 'list') 
            loadAllTrails();

    }, [mode, trailId]);

    const onViewTrail = (trailId) => {  
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    const onBookPress = (trailId) => {
        router.push({
            pathname: '/(main)/offer/list',
            params: { trailId }
        })
    }

    const onHikePress = (trailId) => {
        hikeTrail(trailId);
        router.push({
            pathname: '/(main)/hike/view',
        })
    }

    const onSubmitPress = async () => {
        const success = await createTrail();
        if(!success) return;
        router.replace('trail/list');
    }

    const onRemovePress = async () => {
        if(trailId) await removeTrail(trailId);
        router.back();
    }

    return {
        trail,
        trails,
        loading,
        error,
        information,
        writeTrail,
        onEditProperty,
        hikingTrail,
        setOnHike,
        onViewTrail,
        onBookPress,
        onHikePress,
        onDownloadPress,
        onSubmitPress,
        onRemovePress,
    }
}