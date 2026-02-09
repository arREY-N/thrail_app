import useTrailHook from "@/src/core/hook/useTrailHook";
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import React from 'react';

export default function explore(){
    const { 
        onViewTrail, 
        trails 
    } = useTrailHook({ mode: 'list'}) 
    
    return (
        <ExploreScreen
            trails={trails}
            onViewMountain={onViewTrail}
        />
    )
}