import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {

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
