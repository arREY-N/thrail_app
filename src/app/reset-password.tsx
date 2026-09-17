import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { useForgotPassword } from '@/src/core/models/User/User';
import ResetPasswordScreen from '@/src/features/Auth/screens/ResetPasswordScreen';

export default function ResetPassword() {
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