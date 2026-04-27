import React, { useMemo } from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

import useRecommendation from '@/src/core/hook/recommendation/useRecommendation';
import useTrailDomain from '@/src/core/hook/trail/useTrailDomain';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import useWeather from '@/src/core/hook/weather/useWeather';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { profile } = useAuthHook();
    const { trails } = useTrailDomain();
    
    const { 
        onMountainPress, 
        onDownloadPress, 
        onWeatherPress, 
        onViewAllRecommendationPress, 
        onViewAllTrendingPress 
    } = useAppNavigation();

    const { 
        isLoading: weatherLoading, 
        error: errorWeather, 
        locationWeather 
    } = useWeather();
    
    const { 
        recommendation, 
        isLoading: loadingReco, 
        error: errorReco,
        recommendedTrails, 
    } = useRecommendation({userId: profile.id});

    const discoverList = useMemo(() => {
        if (!trails || !Array.isArray(trails)) return [];
        return trails.slice(0, 3);
    }, [trails]);
    
    return (
        <HomeScreen 
            locationTemp={locationWeather} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            recommendedTrails={recommendedTrails}
            discoverTrails={discoverList}
            onMountainPress={onMountainPress}
            onDownloadPress={onDownloadPress}
        />
    );
}