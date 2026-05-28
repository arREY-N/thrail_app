import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

import useReview from '@/src/core/hook/review/useReview';
import useTrailDomain from '@/src/core/hook/trail/useTrailDomain';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { 
        trails, 
        onViewTrail 
    } = useTrailDomain();

    const {
        onDownloadPress, 
        onWeatherPress, 
        onViewAllRecommendationPress, 
        onViewAllTrendingPress,
        onGroupPress
    } = useAppNavigation();

    const {
        getItemRating,
    } = useReview();

    return (
        <HomeScreen 
            locationTemp={{}} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            recommendedTrails={[]}
            discoverTrails={trails}
            onMountainPress={onViewTrail}
            onDownloadPress={onDownloadPress}
            onGroupPress={onGroupPress}
            getItemRating={getItemRating}
        />
    );
}