import { useAuthStore } from '@/src/core/stores/authStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function profile(){
    const router = useRouter();

    const signOut = useAuthStore((state) => state.signOut);
    const profile = useAuthStore((state) => state.profile);
    
    const onSignOutPress = async () => {
        try{
            await signOut();
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
            onApplyPress={onApplyPress}
            profile={profile}/>
    )
}

const ProfileScreenTest = ({
    onSignOut, 
    onApplyPress,
    profile,
}) => {
    return (
        <View>
            <Text>profile</Text>

            <View style={styles.profileInfo}>
                <Text>USER INFORMATION</Text>
                <Text>  Name: {profile?.firstname} {profile?.lastname} </Text>
                <Text>  Username: {profile?.username}</Text>
                <Text>  Email: {profile?.email} </Text>
                <Text>  Created: {profile?.createdAt?.toDate().toLocaleDateString()}</Text>
            </View>

            <Pressable onPress={onSignOut}>
                <Text>Sign out</Text>
            </Pressable>

            <Pressable onPress={onApplyPress}>
                <Text>Apply for a business acconunt</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    profileInfo: {
        margin: 10
    }
})