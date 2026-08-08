/**
 * @file LogInScreen.tsx
 * @description Pure-UI screen component for the login flow, handling email/password inputs, Google authentication, and links to registration and password reset.
 */

import { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the LogInScreen component.
 * @param onLogInPress - Callback to handle email and password login.
 * @param onSignUpPress - Callback to navigate to the sign-up page.
 * @param onBackPress - Callback to navigate back to the previous screen.
 * @param onForgotPasswordPress - Callback to navigate to the forgot password page.
 * @param onRememberMePress - Callback to toggle the remember me checkbox.
 * @param onGmailLogIn - Callback to handle Google OAuth sign-in.
 * @param onTermsPress - Callback when Terms of Service is pressed.
 * @param onPrivacyPress - Callback when Privacy Policy is pressed.
 * @param error - Error message to display, if any.
 * @param remember - Current state of the remember me checkbox.
 * @param isSplitScreen - When true, renders without ScreenWrapper/ResponsiveScrollView for the split-screen layout.
 */
export interface LogInScreenProps {
    onLogInPress: (email?: string, password?: string) => void;
    onSignUpPress: () => void;
    onBackPress: () => void;
    onForgotPasswordPress: () => void;
    onRememberMePress: () => void;
    onGmailLogIn: () => void;
    onTermsPress: () => void;
    onPrivacyPress: () => void;
    error?: string | null;
    remember?: boolean;
    isSplitScreen?: boolean;
}

/**
 * Screen component that renders the Log In interface.
 */
const LogInScreen: React.FC<LogInScreenProps> = ({ 
    onLogInPress, 
    onSignUpPress, 
    onBackPress, 
    onForgotPasswordPress, 
    onRememberMePress,
    onGmailLogIn, 
    onTermsPress,
    onPrivacyPress,
    error,
    remember,
    isSplitScreen,
}) => {
    const { isLargeScreen } = useBreakpoints();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Shared form content — reused in both split-screen and mobile render paths.
    const formContent = (
        <View style={AuthStyles.formConstrainer}>
            <CustomText
                variant="title"
                style={[
                    AuthStyles.pageTitle,
                    isSplitScreen && AuthStyles.splitScreenTitle,
                ]}
            >
                Log In
            </CustomText>

            <CustomTextInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <CustomTextInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                rightElement={
                    <TouchableOpacity onPress={onForgotPasswordPress}>
                        <CustomText variant="caption" style={AuthStyles.forgotText}>
                            Forgot Password?
                        </CustomText>
                    </TouchableOpacity>
                }
            />

            <ErrorMessage error={error} />

            <View style={[AuthStyles.buttonContainer, isSplitScreen && AuthStyles.splitScreenSection]}>
                <CustomButton
                    title="Log In"
                    onPress={() => onLogInPress(email, password)}
                    variant="primary"
                />
            </View>

            <View style={[AuthStyles.dividerContainer, isSplitScreen && AuthStyles.splitScreenSection]}>
                <View style={AuthStyles.line} />
                <CustomText variant="caption" style={AuthStyles.dividerText}>
                    or continue with
                </CustomText>
                <View style={AuthStyles.line} />
            </View>

            <TouchableOpacity
                style={[AuthStyles.googleButton, isSplitScreen && AuthStyles.splitScreenSection]}
                onPress={onGmailLogIn}
                activeOpacity={0.8}
            >
                <CustomIcon
                    library='AntDesign'
                    name='google'
                    size={20}
                    color={Colors.BLACK}
                />
                <CustomText variant="body" style={AuthStyles.googleButtonText}>
                    Log in with Google
                </CustomText>
            </TouchableOpacity>

            <View style={AuthStyles.footerContainer}>
                <CustomText variant="caption" style={AuthStyles.footerText}>
                    {"Don't have an account? "}
                </CustomText>
                <TouchableOpacity onPress={onSignUpPress}>
                    <CustomText variant="caption" style={AuthStyles.signUpLink}>
                        Sign Up
                    </CustomText>
                </TouchableOpacity>
            </View>

            {isSplitScreen && (
                <View style={[AuthStyles.termsContainer, AuthStyles.splitScreenSection]}>
                    <CustomText variant="caption" style={AuthStyles.termsText}>
                        By continuing, you agree to our{' '}
                        <CustomText
                            variant="caption"
                            style={AuthStyles.termsLink}
                            onPress={onTermsPress}
                        >
                            Terms of Service
                        </CustomText>
                        {' '}and{' '}
                        <CustomText
                            variant="caption"
                            style={AuthStyles.termsLink}
                            onPress={onPrivacyPress}
                        >
                            Privacy Policy
                        </CustomText>
                        .
                    </CustomText>
                </View>
            )}
        </View>
    );

    // ── Split-screen path: bare ScrollView, no ScreenWrapper overhead ──────────
    if (isSplitScreen) {
        return (
            <ScrollView
                style={AuthStyles.container}
                contentContainerStyle={AuthStyles.splitScreenScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {formContent}
            </ScrollView>
        );
    }

    // ── Mobile path: unchanged ─────────────────────────────────────────────────
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            {!isLargeScreen && <CustomHeader onBackPress={onBackPress} />}

            <ResponsiveScrollView
                minHeight={isLargeScreen ? 0 : 600}
                contentHeightOffset={48}
                style={AuthStyles.container}
                contentContainerStyle={[
                    AuthStyles.scrollContent,
                    isLargeScreen && { justifyContent: 'center' }
                ]}
            >
                <View style={AuthStyles.contentContainer}>
                    {formContent}
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

export default LogInScreen;
