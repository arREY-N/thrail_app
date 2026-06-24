import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import CustomLoading from '@/src/components/CustomLoading';
import { useForgotPassword } from '@/src/core/hook/user/useForgotPassword';
import ResetPasswordScreen from '@/src/features/Auth/screens/ResetPasswordScreen';

export default function resetPassword() {
    const { oobCode } = useLocalSearchParams();
    const controller = useForgotPassword(oobCode as string | undefined);

    return (
        <View style={{ flex: 1 }}>
            <ResetPasswordScreen
                onResetPassword={controller.onResetPassword}
                error={controller.error}
                success={controller.success}
                onLanding={controller.onLanding}
                onLogIn={controller.onLogIn}
            />
            
            <CustomLoading 
                visible={controller.loading} 
                message="Loading..." 
            />
        </View>
    );
}