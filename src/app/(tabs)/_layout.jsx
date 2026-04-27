import { Tabs } from "expo-router";
import React from "react";

import CustomNavBar from "@/src/components/CustomNavBar";

export default function homeLayout() {
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
