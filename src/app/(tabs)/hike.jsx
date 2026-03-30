import React from 'react'
import NavigationScreen from '@/src/features/Navigation/screens/NavigationScreen'
import { useLocalSearchParams } from "expo-router";

export default function hike(){
    const params = useLocalSearchParams();
    return <NavigationScreen lon={params.lon} lat={params.lat} />
}