import { Tabs } from "expo-router";
import React from "react";

import LoadingScreen from "@/src/app/loading";
import CustomNavBar from "@/src/components/CustomNavBar";
import useTrail from "@/src/core/hook/trail/useTrail";

export default function homeLayout() {
    const { isLoading } = useTrail();

    if(isLoading) return <LoadingScreen/>
    
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
