import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

export default function TabLayout() {
    const { loadTrails } = useTrailsStore();

    useEffect(() => {
        loadTrails();
    }, [])
    
    return (
        <Tabs screenOptions= {{ headerShown: false }}>
            <Tabs.Screen
                name="home"
                options={{
                title: 'Home',
                }}
            />

            <Tabs.Screen
                name="community"
                options={{
                title: 'Community',
                }}
            />
           
            <Tabs.Screen
                name="explore"
                options={{
                title: 'Explore',
                }}
            />
           
            <Tabs.Screen
                name="hike"
                options={{
                title: 'Hike',
                }}
            />
            
            <Tabs.Screen
                name="profile"
                options={{
                title: 'Profile',
                }}
            />
        </Tabs>
    );
}
