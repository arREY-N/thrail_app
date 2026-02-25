import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import { useAuthHook } from '@/src/core/hook/useAuthHook';
import useBusiness from '@/src/core/hook/useBusiness';
import useUserDomain from '@/src/core/hook/useUserDomain';

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
    } = useUserDomain();

    const { onApplyPress } = useBusiness();

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