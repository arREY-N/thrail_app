import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useTrailDomain from "@/src/core/hook/trail/useTrailDomain";
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import React from 'react';

export default function explore(){
    const { 
        onViewTrail, 
        trails 
    } = useTrailDomain() 

    const {
        onGroupPress
    } = useAppNavigation()
    
    return (
        <ExploreScreen
            trails={trails}
            onViewMountain={onViewTrail}
            onGroupPress={onGroupPress}
        />
    )
}