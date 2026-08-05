import React from 'react';
import { Pressable, Text, View } from 'react-native';

import EmergencyNotification from '@/src/components/EmergencyNotification';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailView from '@/src/core/hook/trail/useTrailView';
import useCancellation from '@/src/core/models/Cancellation/hooks/useCancellation';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { 
        trails, 
        onViewTrail,
        isLoading,
    } = useTrailView();

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

    const {
        submitCancellationRequest,
    } = useCancellation();

    return (
        <View style={{ flex: 1 }}>
            <Pressable onPress={() => submitCancellationRequest({
                reason: 'Test cancellation request',
                offerId: 'bsI4zIzQkPjmgyZ8fumN',
                businessId: 'smsV3pyBQpQMuRRcwUaQ7kLFYaZ2',
                bookingId: '20eVkBPhSgRVdBLwgdlB',
            })}>
                <Text>Test Cancellation</Text>
            </Pressable>
            <View style={{ height: 20 }} />
            <Pressable onPress={() => submitCancellationRequest({
                reason: 'Test cancellation request',
                businessId: 'test-business-id',
                bookingId: 'test-booking-id',
            })}>
                <Text>Test Cancellation Error No Offer ID</Text>
            </Pressable>
            <View style={{ height: 20 }} />

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