import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import useBookingsStore from '@/src/core/stores/bookingsStore';
import { useWeatherStore } from '@/src/core/stores/weatherStore';

import HomeScreen from '../../features/Home/screens/HomeScreen';

export default function home(){
    const router = useRouter();
    const { onMountainPress, onDownloadPress } = useAppNavigation();
    
    const locationWeather = useWeatherStore((state) => state.locationWeather);
    const loadWeather = useWeatherStore((state) => state.loadWeather);
    const profile = useAuthStore((state) => state.profile);
    const loadUserBookings = useBookingsStore((state) => state.loadUserBookings);
    
    const DUMMY_DATA = [
        { 
            id: '1', 
            name: 'Mt. Binicayan', 
            location: 'Cainta, Rizal', 
            score: '4.6', 
            length: '3.06 km', 
            elevation: '380 m', 
            duration: '1h 45m',
        }, 
        
        { 
            id: '2', 
            name: 'Mt. Sipit Ulang', 
            location: 'Rodriguez, Rizal', 
        },

        { 
            id: '3',
        }
    ];

    useEffect(() => {
        if(!profile || !profile.id) return;    
        loadWeather();
        loadUserBookings(profile.id);
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
        router.push('/(book)/userBooking')
    }

    return (
        <HomeScreen 
            locationTemp={locationWeather} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onNotificationPress={onNotificationPress}
            onBookingPress={onBookingPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            
            onMountainPress={onMountainPress}
            onDownloadPress={onDownloadPress}

            recommendedTrails={null} 
            isLoaded={false}
        />
    );
    //     <TESTHOME 
    //         locationTemp={locationWeather} 
    //         onWeatherPress={onWeatherPress}
    //         onViewAllRecommendationPress={onViewAllRecommendationPress}
    //         onNotificationPress={onNotificationPress}
    //         onBookingPress={onBookingPress}
    //         recommendedTrails={null}
    //         onMountainPress={onMountainPress}
    //         onDownloadPress={onDownloadPress}
    //         onViewAllTrendingPress={onViewAllTrendingPress}
    //         isLoaded={false}/>
    // )
    // return <HomeScreen/>
}

// const TESTHOME = ({
//     locationTemp, 
//     onWeatherPress,
//     onViewAllRecommendationPress,
//     onNotificationPress,
//     onBookingPress,
//     recommendedTrails,
//     onMountainPress,
//     onDownloadPress,
//     onViewAllTrendingPress,
//     isLoaded
// }) => {
//     return (
//         <View>
//             <Text>Location: {locationTemp?.location}</Text>
//             <Text>Temperature: {locationTemp?.temperature}°C</Text>
//             <Text>Day: {locationTemp?.day}°C</Text>
//             <Text>Night: {locationTemp?.night}°C</Text>

//             <CustomButton title={'Weather Button'} onPress={onWeatherPress}/>
//             <CustomButton title={'View all recommendations'} onPress={onViewAllRecommendationPress}/>
//             <CustomButton title={'Notification'} onPress={onNotificationPress}/>
//             <CustomButton title={'Booking'} onPress={onBookingPress}/>
//             {
//                 isLoaded &&
//                 recommendedTrails.map((r) => {
//                     return (
//                         <View>
//                             <Text key={r.id}>{r.name}</Text>
//                             <Text>{r.length}</Text>
//                             <Text>{r.score}</Text>
//                             <CustomButton title={'View mountain'} onPress={() => onMountainPress(r.id)}/>
//                             <CustomButton title={'Download'} onPress={() => onDownloadPress(r.id)}/>
//                         </View>
//                     )
//                 })
//             }
//             <CustomButton title={'View all trending'} onPress={onViewAllTrendingPress}/>
//         </View>
//     )
// }