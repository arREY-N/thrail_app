import { useTrailsStore } from '@/src/core/stores/trailsStore';
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import { useRouter } from 'expo-router';
import React from 'react';

export default function explore(){
    const router = useRouter();

    const trails = useTrailsStore(s => s.trails);

    const onViewMountain = (trailId) => {  
        router.push({
            pathname: `/(trail)/trail`,
            params: { trailId }
        })
    }

    return (
        <ExploreScreen
            trails={trails}
            onViewMountain={onViewMountain}
        />
    )
}