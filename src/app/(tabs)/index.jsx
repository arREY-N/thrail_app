import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

import useRecommendation from '@/src/core/hook/recommendation/useRecommendation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import useWeather from '@/src/core/hook/weather/useWeather';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { profile } = useAuthHook();
    
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
    
    return (
        <HomeScreen 
            locationTemp={locationWeather} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            recommendedTrails={recommendedTrails}
            discoverTrails={[]}
            onMountainPress={onMountainPress}
            onDownloadPress={onDownloadPress}
        />
    );
}