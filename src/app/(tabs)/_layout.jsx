import { useAuthStore } from '@/src/core/stores/authStore';
import { useRecommendationsStore } from '@/src/core/stores/recommendationsStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { Redirect, Tabs, useRouter } from 'expo-router';
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
            console.log('NO USER');
            return;
        }

        if(user && profile){
            loadTrails();
            loadRecommendations(profile.id);
        }
    }, [user])

    if(!user && !isLoading){
        return <Redirect href={'/'}/>
    }

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
