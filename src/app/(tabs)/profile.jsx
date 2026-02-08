import { useAuthStore } from '@/src/core/stores/authStore';
import { useRouter } from 'expo-router';
import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';

export default function profile(){
    const router = useRouter();
    const role = useAuthStore(s => s.role);

    const signOut = useAuthStore(s => s.signOut);
    const profile = useAuthStore(s => s.profile);

    async function onSignOutPress(){
        await signOut();
    }

    function onApplyPress(){
        router.push('/(main)/business/apply');
    }

    function onAdminPress(){
        router.push('/(main)/admin')
    }
    
    function onSuperadminPress(){
        router.push('/(main)/superadmin');
    }

    return (
        <View>
            <ProfileScreen
                onSignOutPress={onSignOutPress}
                onApplyPress={onApplyPress}
                profile={profile}
            />
            { role === 'superadmin' &&
                <View>
                    <CustomButton 
                        title="Superadmin Dashboard" 
                        onPress={onSuperadminPress} 
                        variant="primary"
                        style={styles.buttonSpacing}
                    />
                </View>  
            }

            { role === 'admin' &&
                <View>
                    <CustomButton 
                        title="Admin Dashboard" 
                        onPress={onAdminPress} 
                        variant="primary"
                        style={styles.buttonSpacing}
                    />
                </View>  
            }

            <View style={{margin: 50}}/>
        </View>
    )
}

const styles = StyleSheet.create({
    buttonSpacing: {
        marginBottom: 8,
    }
});