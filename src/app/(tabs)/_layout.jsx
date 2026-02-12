import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import { useAuthStore } from "@/src/core/stores/authStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";

import CustomNavBar from "@/src/components/CustomNavBar";

export default function homeLayout() {
    const user = useAuthStore(s => s.user);
    const isLoading = useTrailsStore(s => s.isLoading);
    const loadTrails = useTrailsStore(s => s.fetchAll);
    const profile = useAuthStore(s => s.profile);

    useEffect(() => {
        loadTrails();
    }, []);

    console.log('tabs')
    
    // if(isLoading) return <LoadingScreen/>

    //if(!user) return <Redirect href={'/(auth)/landing'}/>
    
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
