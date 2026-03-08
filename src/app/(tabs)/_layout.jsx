import { Tabs } from "expo-router";
import React from "react";

import LoadingScreen from "@/src/app/loading";
import CustomNavBar from "@/src/components/CustomNavBar";
import useTrail from "@/src/core/hook/trail/useTrail";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";

export default function homeLayout() {
    const { trailIsLoading } = useTrail();
    const { authIsLoading } = useAuthHook();

    const loaded = !trailIsLoading && !authIsLoading

    if(!loaded) return <LoadingScreen/>
    
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
