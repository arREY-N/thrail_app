import { useTrailsStore } from '@/src/core/stores/trailsStore';
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import { useRouter } from 'expo-router';
import React from 'react';

export default function explore(){
    const router = useRouter();

    const trails = useTrailsStore(s => s.trails);

    const onViewMountain = (id) => {  
        console.log(id);
        router.push(`/(trail)/${id}`)
    }

    const displayTrails = (trails && trails.length > 0) ? trails : DUMMY_TRAILS;

    return (
        <ExploreScreen
            trails={displayTrails}
            onViewMountain={onViewMountain}
        />
    )
}