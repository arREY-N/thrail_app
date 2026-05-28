import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useTrailDomain from "@/src/core/hook/trail/useTrailDomain";
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';
import React from 'react';

import useReview from '@/src/core/hook/review/useReview';

export default function explore(){
    const { 
        onViewTrail, 
        trails 
    } = useTrailDomain() 

    const {
        onGroupPress
    } = useAppNavigation()
    
    const {
        getItemRating,
    } = useReview();
    
    return (
        <ExploreScreen
            getItemRating={getItemRating}
            trails={trails}
            onViewMountain={onViewTrail}
            onGroupPress={onGroupPress}
        />
    )
}