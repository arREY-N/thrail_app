import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useReview from '@/src/core/hook/review/useReview';
import useTrailDomain from "@/src/core/hook/trail/useTrailDomain";
import ExploreScreen from '@/src/features/Explore/screens/ExploreScreen';

/**
 * Controller component for the Explore tab.
 * Responsible for fetching trail data and passing navigation callbacks.
 */
export default function explore() {
    const { 
        onViewTrail, 
        trails,
        isLoading,
        fetchAllTrails
    } = useTrailDomain();

    const {
        onGroupPress
    } = useAppNavigation();
    
    const {
        getItemRating,
    } = useReview();

    useFocusEffect(
        useCallback(() => {
            if (trails.length === 0 && !isLoading) {
                fetchAllTrails();
            }
        }, [trails.length, isLoading, fetchAllTrails])
    );
    
    return (
        <ExploreScreen
            getItemRating={getItemRating}
            trails={trails}
            onViewMountain={onViewTrail}
            onGroupPress={onGroupPress}
            isLoading={isLoading} 
        />
    );
}
