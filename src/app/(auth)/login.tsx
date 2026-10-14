/**
 * @file login.tsx
 * @description Route controller for the native mobile authentication login flow.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useAuthHook } from '@/src/core/models/User/User';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

/**
 * Controller managing the native mobile log-in screen state and authentication actions.
 *
 * @returns {React.JSX.Element} The rendered login controller view.
 */
export default function Login() {
    const {
        onBackToLanding,
        onSwitchToSignUp,
        onForgotPassword,
        onTerms,
        onPrivacy,
    } = useLandingNavigation();

    const {
        onLogIn,
        onGmailLogIn,
        error,
        isLoading,
        reset,
    } = useAuthHook();

    useEffect(() => {
        reset();
    }, [reset]);

    return (
        <View style={styles.container}>
            <LogInScreen
                onLogInPress={onLogIn}
                onSignUpPress={onSwitchToSignUp}
                error={error}
                onForgotPasswordPress={onForgotPassword}
                onBackPress={onBackToLanding}
                onGmailLogIn={onGmailLogIn}
                onTermsPress={onTerms}
                onPrivacyPress={onPrivacy}
                isLoading={isLoading}
            />

            <CustomLoading
                visible={isLoading}
                message="Signing in..."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
