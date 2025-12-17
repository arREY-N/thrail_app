import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function explore(){
    const router = useRouter();

    const onViewMountain = () => {
        router.push('/(mountain)/mountain')
    }

    return (
        <View>
            <Text>Explore</Text>
            <Pressable onPress={onViewMountain}>
                <Text>View Mountain</Text>
            </Pressable>
        </View>
        // <ExploreScreen/>
    )
}