import { Redirect } from 'expo-router';
import { View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { Colors } from '@/src/constants/colors';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useLandingNavigation from '@/src/core/hook/navigation/useLandingNavigation';
import { useSignUp } from '@/src/core/models/User/User';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

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
        onTerms
    } = useLandingNavigation();

    if (isLargeScreen) {
        return <Redirect href="/(auth)/landing?mode=signup" />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}>
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
