import CustomButton from '@/src/components/CustomButton';
import { useAuth } from '@/src/core/context/AuthProvider';
import { useRecommendation } from '@/src/core/context/RecommendationProvider';
import { useWeather } from '@/src/core/context/WeatherProvider';
import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function home(){
    const router = useRouter();
    const { locationTemp } = useWeather();
    const { loadLatestRecommendation, recommendedTrails, isLoaded } = useRecommendation();
    const { trails } = useTrailsStore();
    const { profile, role } = useAuth();
    const { onMountainPress, onDownloadPress } = useAppNavigation();

    useEffect(() => {
        if(!profile || !profile.uid) return;
        loadLatestRecommendation(profile.uid, trails);
        console.log('Role: ', role);
    }, [profile]);
    
    const onWeatherPress = () => {
        console.log('to weather page')
        router.push('/(home)/weather')
    }

    const onViewAllRecommendationPress = () => {
        console.log('View all recommendations')
        router.push('/(home)/recommendations')
    }
    
    const onViewAllTrendingPress = () => {
        console.log('View all trending')
        router.push('/(home)/trending')
    }

    const onNotificationPress = () => {
        console.log('View notification')
        router.push('/(home)/notification')
    }

    const onBookingPress = () => {
        console.log('View booking')
        router.push('/(book)/booking')
    }

    return (
        <TESTHOME 
            locationTemp={locationTemp} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onNotificationPress={onNotificationPress}
            onBookingPress={onBookingPress}
            recommendedTrails={recommendedTrails}
            onMountainPress={onMountainPress}
            onDownloadPress={onDownloadPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            isLoaded={isLoaded}/>
    )
    // return <HomeScreen/>
}

const TESTHOME = ({
    locationTemp, 
    onWeatherPress,
    onViewAllRecommendationPress,
    onNotificationPress,
    onBookingPress,
    recommendedTrails,
    onMountainPress,
    onDownloadPress,
    onViewAllTrendingPress,
    isLoaded
}) => {
    return (
        <View>
            <Text>Location: {locationTemp.location}</Text>
            <Text>Temperature: {locationTemp.temperature}°C</Text>
            <Text>Day: {locationTemp.day}°C</Text>
            <Text>Night: {locationTemp.night}°C</Text>

            <CustomButton title={'Weather Button'} onPress={onWeatherPress}/>
            <CustomButton title={'View all recommendations'} onPress={onViewAllRecommendationPress}/>
            <CustomButton title={'Notification'} onPress={onNotificationPress}/>
            <CustomButton title={'Booking'} onPress={onBookingPress}/>
            {
                isLoaded &&
                recommendedTrails.map((r) => {
                    return (
                        <View>
                            <Text key={r.id}>{r.name}</Text>
                            <Text>{r.length}</Text>
                            <Text>{r.score}</Text>
                            <CustomButton title={'View mountain'} onPress={() => onMountainPress(r.id)}/>
                            <CustomButton title={'Download'} onPress={() => onDownloadPress(r.id)}/>
                        </View>
                    )
                })
            }
            <CustomButton title={'View all trending'} onPress={onViewAllTrendingPress}/>
        </View>
    )
}