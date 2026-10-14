/**
 * @file SignUpScreen.tsx
 * @description Pure-UI screen component for the user registration flow, handling email, username, password creation with a strength indicator, and Google OAuth signup.
 */

import { useState } from 'react';
import {
    ScrollView,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { useAuthValidation } from '@/src/features/Auth/hooks/useAuthValidation';
import {
    calculatePasswordStrength,
    sanitizeEmail,
    sanitizePassword,
    sanitizeUsername,
} from '@/src/features/Auth/utils/authValidation';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the SignUpScreen component.
 * @param onLogInPress - Callback to navigate back to the log-in page.
 * @param onBackPress - Callback to navigate to the previous screen.
 * @param onSignUpPress - Callback to handle email-based sign-up.
 * @param onGmailSignUp - Callback to handle Google-based sign-up.
 * @param onTermsPress - Callback when Terms of Service link is pressed.
 * @param onPrivacyPress - Callback when Privacy Policy link is pressed.
 * @param error - Error message to display, if any.
 * @param isSplitScreen - When true, renders without ScreenWrapper/ResponsiveScrollView for the split-screen layout.
 * @param isLoading - Indicates if a registration or validation request is in flight.
 */
export interface SignUpScreenProps {
    onLogInPress: () => void;
    onBackPress: () => void;
    onSignUpPress: (email: string, password: string, username: string, confirmPassword: string) => void;
    onGmailSignUp: () => void;
    onTermsPress: () => void;
    onPrivacyPress: () => void;
    error?: string | null;
    isSplitScreen?: boolean;
    isLoading?: boolean;
}

/**
 * Screen component that renders the Sign Up interface.
 */
const SignUpScreen: React.FC<SignUpScreenProps> = ({
    onLogInPress,
    onBackPress,
    onSignUpPress,
    onGmailSignUp,
    onTermsPress,
    onPrivacyPress,
    error,
    isSplitScreen,
    isLoading,
}) => {

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPasswords, setShowPasswords] = useState(false);

    const { strength, color: strengthColor } = calculatePasswordStrength(password);
    const { activeError, validateSignUp, clearError } = useAuthValidation(error);

    const handleSignUpSubmit = () => {
        if (activeError) clearError();
        if (validateSignUp(email, username, password, confirmPassword)) {
            onSignUpPress(email.trim(), password, username.trim(), confirmPassword);
        }
    };

    const { isLargeScreen } = useBreakpoints();

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
                Sign Up
            </CustomText>

            <CustomTextInput
                label="Email Address *"
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
                label="Username *"
                placeholder="Choose a username"
                value={username}
                onChangeText={(text: string) => {
                    setUsername(sanitizeUsername(text));
                    if (activeError) clearError();
                }}
                autoCapitalize="none"
            />

            <View>
                <CustomTextInput
                    label="Password *"
                    placeholder="Type your password"
                    value={password}
                    onChangeText={(text: string) => {
                        setPassword(sanitizePassword(text));
                        if (activeError) clearError();
                    }}
                    secureTextEntry
                    isPasswordVisible={showPasswords}
                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                    style={{ marginBottom: 0 }}
                />

                <View style={AuthStyles.strengthContainer}>
                    {[1, 2, 3].map((level) => (
                        <View
                            key={level}
                            style={[
                                AuthStyles.strengthBar,
                                {
                                    backgroundColor: strength >= level
                                        ? strengthColor
                                        : Colors.STRENGTH_EMPTY
                                }
                            ]}
                        />
                    ))}
                </View>
            </View>

            <CustomTextInput
                label="Confirm Password *"
                placeholder="Retype your password"
                value={confirmPassword}
                onChangeText={(text: string) => {
                    setConfirmPassword(sanitizePassword(text));
                    if (activeError) clearError();
                }}
                secureTextEntry
                isPasswordVisible={showPasswords}
                onTogglePassword={() => setShowPasswords(!showPasswords)}
            />

            <ErrorMessage error={activeError} />

            <View style={[AuthStyles.buttonContainer, isSplitScreen && AuthStyles.splitScreenSection]}>
                <CustomButton
                    title="Continue with Email"
                    onPress={handleSignUpSubmit}
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
                    onGmailSignUp();
                }}
                activeOpacity={0.8}
            >
                <CustomIcon
                    library="AntDesign"
                    name="google"
                    size={20}
                    color={Colors.BLACK}
                />
                <CustomText variant="body" style={AuthStyles.googleButtonText}>
                    Continue with Google
                </CustomText>
            </TouchableOpacity>

            <View style={AuthStyles.footerContainer}>
                <CustomText variant="caption" style={AuthStyles.footerText}>
                    {"Already have an account? "}
                </CustomText>
                <TouchableOpacity
                    onPress={() => {
                        if (activeError) clearError();
                        onLogInPress();
                    }}
                >
                    <CustomText variant="caption" style={AuthStyles.signUpLink}>
                        Log In
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

export default SignUpScreen;
