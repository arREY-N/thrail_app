import { auth } from '@/src/core/config/Firebase';
import { useRecommendation } from '@/src/core/context/RecommendationProvider';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function profile(){
    const { resetRecommendations } = useRecommendation();
    const router = useRouter();

    const onSignOutPress = async () => {
        try{
            await signOut(auth);
            resetRecommendations();
        } catch (err) {
            console.error('Error:', err);
        }
    }

    const onApplyPress = () => {
        console.log('Apply');
        router.push('/(business)/apply');
    }

    return (
        <ProfileScreenTest 
            onSignOut={onSignOutPress}
            onApplyPress={onApplyPress}/>
    )
}

const ProfileScreenTest = ({onSignOut, onApplyPress}) => {
    return (
        <View>
            <Text>profile</Text>
            <Pressable onPress={onSignOut}>
                <Text>Sign out</Text>
            </Pressable>

            <Pressable onPress={onApplyPress}>
                <Text>Apply for a business acconunt</Text>
            </Pressable>
        </View>
    )
}