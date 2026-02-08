import { useAuthStore } from '@/src/core/stores/authStore';
import { useRecommendationsStore } from '@/src/core/stores/recommendationsStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function UserLayout() {
    const router = useRouter();
    
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const profile = useAuthStore((state) => state.profile);
    
    const loadTrails = useTrailsStore((state) => state.loadTrails);
    const loadRecommendations = useRecommendationsStore((state) => state.loadRecommendations)
    
    useEffect(() => {
        if(!user && !isLoading){
            router.replace('/(auth)/landing');
            return;
        }

        if(user && profile){
            loadTrails();
            loadRecommendations(profile.id);
        }
    }, [user, isLoading, profile])
    
    return (
        <Tabs screenOptions={{ 
            headerShown: false, // This hides the top bar globally
            tabBarActiveTintColor: '#228B22' // Green color for active tab
        }}>
            <Tabs.Screen name="home"/>
            <Tabs.Screen name="community"/>
            <Tabs.Screen 
                name="map" 
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
                }}
            />

            <Tabs.Screen name="explore"/>
            <Tabs.Screen name="hike"/>
            <Tabs.Screen name="profile"/>
        </Tabs>
    );
}