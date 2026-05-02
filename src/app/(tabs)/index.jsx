import React, { useMemo } from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

import useTrailDomain from '@/src/core/hook/trail/useTrailDomain';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { profile } = useAuthHook();
    const { 
        trails, 
        onViewTrail
    } = useTrailDomain();
    
    const { 
        onMountainPress, 
        onDownloadPress, 
        onWeatherPress, 
        onViewAllRecommendationPress, 
        onViewAllTrendingPress 
    } = useAppNavigation();

    const discoverList = useMemo(() => {
        if (!trails || !Array.isArray(trails)) return [];
        return trails.slice(0, 3);
    }, [trails]);
    
    return (
        <HomeScreen 
            locationTemp={{}} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            recommendedTrails={[]}
            discoverTrails={discoverList}
            onMountainPress={onViewTrail}
            onDownloadPress={onDownloadPress}
        />
    );
}