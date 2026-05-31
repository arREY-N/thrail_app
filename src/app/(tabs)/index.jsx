import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import EmergencyNotification from '@/src/components/EmergencyNotification';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailDomain from '@/src/core/hook/trail/useTrailDomain';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { 
        trails, 
        onViewTrail,
        isLoading,
        fetchAllTrails
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

    useFocusEffect(
        useCallback(() => {
            if (trails.length === 0) {
                fetchAllTrails();
            }
        }, [trails.length, fetchAllTrails])
    );

    return (
        <View style={{ flex: 1 }}>
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
                isLoading={isLoading}
            />

            <EmergencyNotification />
        </View>
    );
}