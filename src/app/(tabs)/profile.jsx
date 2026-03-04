import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';

export default function profile(){
    const {
        profile,
        role,
        onSignOutPress,
    } = useAuthHook();

    const {
        onAdminPress,
        onSuperadminPress,
        onViewAccountPress,
        onApplyPress,
    } = useProfileNavigation();

    return (
        <View>
            <ProfileScreen
                onSignOutPress={onSignOutPress}
                onApplyPress={onApplyPress}
                profile={profile}
            />

            <CustomButton 
                title="View Account" 
                onPress={() => onViewAccountPress(profile.id)} 
                variant="primary"
                style={styles.buttonSpacing}
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