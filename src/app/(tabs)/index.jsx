import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import useBookingsStore from '@/src/core/stores/bookingsStore';
import { useWeatherStore } from '@/src/core/stores/weatherStore';

import { useRecommendationsStore } from '@/src/core/stores/recommendationsStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const router = useRouter();
    const { onMountainPress, onDownloadPress } = useAppNavigation();
    
    const locationWeather = useWeatherStore(s => s.locationWeather);
    const loadWeather = useWeatherStore(s => s.loadWeather);
    const profile = useAuthStore(s => s.profile);
    const recommendations = useRecommendationsStore(s => s.recommendations);
    const loadUserBookings = useBookingsStore(s => s.loadUserBookings);
    const recommendedTrails = useTrailsStore(s => s.recommendedTrails);
    const trails = useTrailsStore(s => s.trails);
    const setRecommendedTrails = useTrailsStore(s => s.setRecommendedTrails);
    const loadRecommendations = useRecommendationsStore(s => s.loadRecommendations)
    
    useEffect(() => {
        if(!profile || !profile.id) return;    
        loadWeather();
        loadUserBookings(profile.id);
        loadRecommendations(profile.id);
    }, [profile]);
    
    useEffect(() => {
        if(trails){
            setRecommendedTrails(recommendations?.trails);
        }
    }, [trails, recommendations])

    const onWeatherPress = () => {
        router.push('/(main)/home/weather')
    }

    const onViewAllRecommendationPress = () => {
        router.push('/(main)/home/recommendations')
    }
    
    const onViewAllTrendingPress = () => {
        router.push('/home/trending')
    }

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