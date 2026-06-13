import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import EmergencyNotification from '@/src/components/EmergencyNotification';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailDomain from '@/src/core/hook/trail/useTrailDomain';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 */
const home = () => {
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
        onViewAllDiscoverPress,
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
                onWeatherPress={onWeatherPress}
                onViewAllRecommendationPress={onViewAllRecommendationPress}
                onViewAllDiscoverPress={onViewAllDiscoverPress}
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
};

export default home;
