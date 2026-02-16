import { useAuthStore } from '@/src/core/stores/authStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

export default function homeLayout() {
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const loadTrails = useTrailsStore(s => s.loadAllTrails);
    const profile = useAuthStore(s => s.profile);

    useEffect(() => {
        loadTrails();
    }, []);

    if(isLoading) return <LoadingScreen/>

    if(!user) return <Redirect href={'/(auth)/landing'}/>
    
    return (
        <Tabs screenOptions= {{ headerShown: false }}>
            <Tabs.Screen name="home"/>
            <Tabs.Screen name="community"/>
            <Tabs.Screen name="explore"/>
            <Tabs.Screen name="hike"/>
            <Tabs.Screen name="profile"/>
        </Tabs>
    );
}