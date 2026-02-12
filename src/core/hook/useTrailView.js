import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useOffersStore } from "../stores/offersStore";

export function useTrailView({
    trailId,
    hikingTrailId,
}){
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);
    const fetchAll = useTrailsStore(s => s.fetchAll);
    const loadTrail = useTrailsStore(s => s.loadTrail);
    const onStartHikePress = useTrailsStore(s => s.setOnHike);
    const setOnHike = useTrailsStore(s => s.hikeTrail);
    const hikingTrail = useTrailsStore(s => s.hikingTrail);
    const loadTrailOffers = useOffersStore(s => s.loadTrailOffers);

    useEffect(() => {
        fetchAll();
        if(trailId) loadTrail(trailId);
        if(hikingTrailId) setOnHike(hikingTrailId);
    },[trailId, hikingTrailId])

    async function onBookPress(trailId){
        await loadTrailOffers(trailId);
        router.push({
            pathname: '(main)/offer/list',
            params: {trailId} 
        })
    }

    function onHikePress(hikingTrailId){
        router.push({
            pathname: '/(main)/hike/view',
            params: { hikingTrailId } 
        })
    }

    return { 
        hikingTrail,
        trails, 
        trail, 
        loadTrail, 
        onBookPress, 
        onHikePress,
        onStartHikePress,
    }
}