import React from 'react';
import { View } from 'react-native';


import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailView from '@/src/core/hook/trail/useTrailView';
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
    } = useTrailView();

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
        </View>
    );
};

export default home;
