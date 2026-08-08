import React from 'react';
import { Pressable, Text, View } from 'react-native';

import EmergencyNotification from '@/src/components/EmergencyNotification';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import useTrailView from '@/src/core/hook/trail/useTrailView';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useCancellationAdmin, useCancellationUser, useCancellationUserList } from '@/src/core/models/Cancellation/Cancellation';
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
    } = useCancellationUser();
    
    const {
        userCancellations,
    } = useCancellationUserList();

    const {
        cancellationRequests,
        processCancellationRequest,
    } = useCancellationAdmin();

    const {
        profile 
    } = useAuthHook();
    
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
        
            <Pressable onPress={() => getAllUserRequests(profile?.id || '')}>
                <Text>Fetch User Cancellations</Text>
            </Pressable>
            <View style={{ height: 30 }} />

            { userCancellations && userCancellations.length > 0 && userCancellations.map((request) => (
                <View key={request.id} style={{ marginBottom: 10 }}>
                    <Text>Request ID: {request.id}</Text>
                    <Text>Reason: {request.reason}</Text>
                </View>
            ))}

            { cancellationRequests.length > 0 && cancellationRequests.map((request) => (
                <View key={request.id} style={{ marginBottom: 10 }}>
                    <Text>Request ID: {request.id}</Text>
                    <Text>Reason: {request.reason}</Text>
                    <Pressable onPress={() => processCancellationRequest(request, true, 'Approved by admin')}>
                        <Text>Approve</Text>
                    </Pressable>
                    <Pressable onPress={() => processCancellationRequest(request, false, 'Rejected by admin')}>
                        <Text>Reject</Text>
                    </Pressable>
                </View>
            ))}

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