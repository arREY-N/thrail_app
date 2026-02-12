import useTrailDomain from "@/src/core/hook/useTrailDomain";
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import React from 'react';

export default function explore(){
    const { 
        onViewTrail, 
        trails 
    } = useTrailDomain() 
    
    return (
        <ExploreScreen
            trails={trails}
            onViewMountain={onViewTrail}
        />
    )
}