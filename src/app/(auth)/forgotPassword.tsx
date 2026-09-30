/**
 * @file forgotPassword.tsx
 * @description Route controller for password recovery and reset link dispatch.
 */

import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useForgotPassword } from '@/src/core/models/User/User';
import ForgotPasswordScreen from '@/src/features/Auth/screens/ForgotPasswordScreen';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Controller managing password reset email requests and desktop redirects.
 *
 * @returns {React.JSX.Element} The rendered forgot password controller view.
 */
export default function ForgotPassword() {
    const { isLargeScreen } = useBreakpoints();
    const { onBackPress } = useAppNavigation();

    const controller = useForgotPassword();

    if (isLargeScreen) {
        return <Redirect href="/(auth)/landing?mode=forgot" />;
    }

    return (
        <View style={styles.container}>
            <ForgotPasswordScreen
                onSendResetEmail={controller.onSendResetEmail}
                error={controller.error}
                success={controller.success}
                onLogIn={controller.onLogIn}
                onBackPress={onBackPress}
            />

            <CustomLoading
                message="Sending reset email..."
                visible={controller.loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});