import { Tabs } from "expo-router";

import CustomNavBar from "@/src/components/CustomNavBar";
import { useAppSubscriptions } from "@/src/core/hook/useAppSubscriptions";

export const unstable_settings = {
    initialRouteName: 'index',
};

/**
 * Main navigation layout for the bottom tab bar.
 */
export default function HomeLayout() {
    useAppSubscriptions();

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
