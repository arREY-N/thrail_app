import { Redirect, Tabs } from "expo-router";
import React, { useEffect } from "react";

import { useAuthStore } from "@/src/core/stores/authStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";

import CustomNavBar from "../../components/CustomNavBar";

export default function UserLayout() {
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const loadTrails = useTrailsStore(s => s.loadTrails);

    useEffect(() => {
        if (!user && !isLoading){
            return;
        } 
        
        loadTrails();
    }, [user, isLoading]);

    if(!user && !isLoading) return <Redirect href={'/(auth)/landing'}/>
    
    return (
        <Tabs
            screenOptions={{ headerShown: false }}
            tabBar={(props) => <CustomNavBar {...props} />}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="hike" />
            <Tabs.Screen name="community" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}
