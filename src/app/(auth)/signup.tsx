/**
 * @file signup.tsx
 * @description Route controller for the account registration flow.
 */

import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { Colors } from '@/src/constants/colors';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useSignUp } from '@/src/core/models/User/User';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Controller managing account creation credentials and validation flow.
 *
 * @returns {React.JSX.Element} The rendered signup controller view.
 */
export default function Signup() {
    const { isLargeScreen } = useBreakpoints();
    const {
        error,
        isLoading,
        onGmailSignUp,
        onSignUpPress,
    } = useSignUp(true);

    const {
        onLogIn,
        onBackPress,
    } = useAppNavigation();

    const {
        onPrivacy,
        onTerms,
    } = useLandingNavigation();

    if (isLargeScreen) {
        return <Redirect href="/(auth)/landing?mode=signup" />;
    }

    return (
        <View style={styles.container}>
            <SignUpScreen
                onSignUpPress={onSignUpPress}
                onLogInPress={onLogIn}
                onBackPress={onBackPress}
                onGmailSignUp={onGmailSignUp}
                onTermsPress={onTerms}
                onPrivacyPress={onPrivacy}
                error={error}
            />

            <CustomLoading
                visible={isLoading}
                message="Validating..."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
});
