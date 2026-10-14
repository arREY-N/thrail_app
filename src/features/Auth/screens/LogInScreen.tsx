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
import { useAuthValidation } from '@/src/features/Auth/hooks/useAuthValidation';
import { sanitizeEmail, sanitizePassword } from '@/src/features/Auth/utils/authValidation';
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
 * @param isLoading - Indicates if an authentication request is currently processing.
 */
export interface LogInScreenProps {
    onLogInPress: (email: string, password: string) => void;
    onSignUpPress: () => void;
    onBackPress: () => void;
    onForgotPasswordPress: () => void;
    onRememberMePress?: () => void;
    onGmailLogIn: () => void;
    onTermsPress: () => void;
    onPrivacyPress: () => void;
    error?: string | null;
    remember?: boolean;
    isSplitScreen?: boolean;
    isLoading?: boolean;
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
    isLoading,
}) => {
    const { isLargeScreen } = useBreakpoints();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { activeError, validateLogIn, clearError } = useAuthValidation(error);

    const handleLogInSubmit = () => {
        if (activeError) clearError();
        if (validateLogIn(email, password)) {
            onLogInPress(email.trim(), password);
        }
    };

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
                onChangeText={(text: string) => {
                    setEmail(sanitizeEmail(text));
                    if (activeError) clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <CustomTextInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text: string) => {
                    setPassword(sanitizePassword(text));
                    if (activeError) clearError();
                }}
                secureTextEntry
                rightElement={
                    <TouchableOpacity
                        onPress={() => {
                            if (activeError) clearError();
                            onForgotPasswordPress();
                        }}
                    >
                        <CustomText variant="caption" style={AuthStyles.forgotText}>
                            Forgot Password?
                        </CustomText>
                    </TouchableOpacity>
                }
            />

            <ErrorMessage error={activeError} />

            <View style={[AuthStyles.buttonContainer, isSplitScreen && AuthStyles.splitScreenSection]}>
                <CustomButton
                    title="Log In"
                    onPress={handleLogInSubmit}
                    variant="primary"
                    disabled={isLoading}
                    isLoading={isLoading}
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
                onPress={() => {
                    if (activeError) clearError();
                    onGmailLogIn();
                }}
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
                <TouchableOpacity
                    onPress={() => {
                        if (activeError) clearError();
                        onSignUpPress();
                    }}
                >
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
                            onPress={() => {
                                if (activeError) clearError();
                                onTermsPress();
                            }}
                        >
                            Terms of Service
                        </CustomText>
                        {' '}and{' '}
                        <CustomText
                            variant="caption"
                            style={AuthStyles.termsLink}
                            onPress={() => {
                                if (activeError) clearError();
                                onPrivacyPress();
                            }}
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

            <CustomHeader
                onBackPress={() => {
                    if (activeError) clearError();
                    onBackPress();
                }}
            />

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
