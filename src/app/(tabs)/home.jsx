import HomeScreen from '@/src/features/Home/screens/HomeScreen';
import { useRouter } from 'expo-router';
import React from 'react';

/**
 * Weather (preview, access button)
 * Recommendations (list, view all, download)
 * Trending (list, view all, download)
 * Notifications
 * Booking
 */

export default function home(){
    const router = useRouter();

    const onWeatherPress = () => {
        // go to weather page    
    }

    return <HomeScreen/>
}