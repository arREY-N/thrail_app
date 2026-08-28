/**
 * @file LandingScreen.tsx
 * @description Responsive landing screen. On large screens (≥1024×600), renders a
 * split-screen layout — hero image on the left with bottom-left branding, auth forms on
 * the right inside a padded scroll area. On mobile, renders the classic single-screen
 * landing with CTA buttons.
 */

import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    useWindowDimensions,
    View
} from "react-native";

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from "@/src/components/CustomButton";
import CustomImage from "@/src/components/CustomImage";
import CustomLoading from '@/src/components/CustomLoading';
import CustomText from "@/src/components/CustomText";

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import { useAuthHook, useForgotPassword, useSignUp } from '@/src/core/models/User/User';
import ForgotPasswordScreen from '@/src/features/Auth/screens/ForgotPasswordScreen';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';

const HERO_IMAGE = require('@/src/assets/images/Mt.Tagapo.jpg');

/**
 * Props for the LandingScreen component.
 * @param onLogInPress - Callback when Log In button is pressed.
 * @param onSignUpPress - Callback when Sign Up button is pressed.
 * @param onTermsPress - Callback when Terms of Service is pressed.
 * @param onPrivacyPress - Callback when Privacy Policy is pressed.
 * @param initialMode - Initial auth form mode ('login' | 'signup' | 'forgot').
 * @param onModeChange - Callback when auth mode updates.
 */
export interface LandingScreenProps {
    onLogInPress: () => void;
    onSignUpPress: () => void;
    onTermsPress: () => void;
    onPrivacyPress: () => void;
    initialMode?: 'login' | 'signup' | 'forgot';
    onModeChange?: (mode: 'login' | 'signup' | 'forgot') => void;
}

/**
 * Screen component that renders the Landing page with options to Log In or Sign Up,
 * or handles split-screen desktop authentication.
 */
const LandingScreen: React.FC<LandingScreenProps> = ({
    onLogInPress,
    onSignUpPress,
    onTermsPress,
    onPrivacyPress,
    initialMode,
    onModeChange
}) => {
    const { isLargeScreen } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const heroImageHeight = screenHeight < 500 ? 180 : screenHeight * 0.45;

    const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(initialMode || 'login');

    if (initialMode !== prevInitialMode) {
        setPrevInitialMode(initialMode);
        if (initialMode) {
            setAuthMode(initialMode);
        }
    }

    const loginHook = useAuthHook();
    const signupHook = useSignUp(true);
    const forgotHook = useForgotPassword();

    const updateAuthMode = (mode: 'login' | 'signup' | 'forgot') => {
        setAuthMode(mode);
        onModeChange?.(mode);
        forgotHook.reset();
    };

    if (isLargeScreen) {
        return (
            <View style={styles.splitScreenContainer}>
                <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

                {/* Left Panel — full-height hero image with bottom-left branding */}
                <View style={styles.leftPanel}>
                    <CustomImage
                        source={HERO_IMAGE}
                        style={styles.splitHeroImage}
                        resizeMode="cover"
                    />
                    <View style={styles.overlay} />
                    {/* All branding at the absolute bottom-left */}
                    <View style={styles.brandingContainer}>
                        <CustomText variant="h1" style={styles.brandingTitle}>
                            Thrail
                        </CustomText>
                        <CustomText variant="h3" style={styles.brandingSlogan}>
                            Find thrill in your trail
                        </CustomText>
                        <CustomText variant="body" style={styles.brandingSubtext}>
                            Discover breathtaking mountains, book local guides,{'\n'}and start your adventure today.
                        </CustomText>
                    </View>
                </View>

                {/* Right Panel — forms own their scroll via isSplitScreen */}
                <View style={styles.rightPanel}>
                    <View style={styles.formWrapper}>
                        {authMode === 'login' ? (
                            <LogInScreen
                                isSplitScreen={true}
                                onLogInPress={loginHook.onLogIn as (email?: string, password?: string) => void}
                                onSignUpPress={() => updateAuthMode('signup')}
                                onBackPress={undefined as unknown as () => void}
                                onForgotPasswordPress={() => updateAuthMode('forgot')}
                                onRememberMePress={loginHook.onRememberMePress}
                                onGmailLogIn={loginHook.onGmailLogIn}
                                onTermsPress={onTermsPress}
                                onPrivacyPress={onPrivacyPress}
                                error={loginHook.error}
                                remember={loginHook.remember}
                            />
                        ) : authMode === 'signup' ? (
                            <SignUpScreen
                                isSplitScreen={true}
                                onSignUpPress={signupHook.onSignUpPress as (email?: string, password?: string, username?: string, confirmPassword?: string) => void}
                                onLogInPress={() => updateAuthMode('login')}
                                onBackPress={undefined as unknown as () => void}
                                onGmailSignUp={signupHook.onGmailSignUp}
                                onTermsPress={onTermsPress}
                                onPrivacyPress={onPrivacyPress}
                                error={signupHook.error}
                            />
                        ) : (
                            <ForgotPasswordScreen
                                isSplitScreen={true}
                                onSendResetEmail={forgotHook.onSendResetEmail}
                                error={forgotHook.error}
                                success={forgotHook.success}
                                onLogIn={() => updateAuthMode('login')}
                                onBackPress={() => updateAuthMode('login')}
                            />
                        )}
                    </View>

                    <CustomLoading
                        visible={loginHook.isLoading || signupHook.isLoading || forgotHook.loading}
                        message={
                            authMode === 'login'
                                ? "Signing in..."
                                : authMode === 'signup'
                                    ? "Validating..."
                                    : "Sending reset email..."
                        }
                    />
                </View>
            </View>
        );
    }

    const isLandscapeMode = screenHeight < 500;

    const content = (
        <>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <View style={[styles.imageWrapper, isLandscapeMode && { height: heroImageHeight }]}>
                <CustomImage
                    source={HERO_IMAGE}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
            </View>

            <View style={[
                styles.cardSection,
                {
                    paddingBottom: Math.max(insets.bottom + 16, 32),
                    paddingTop: isLandscapeMode ? 48 : 32,
                }
            ]}>
                <View style={styles.contentConstrainer}>

                    <View style={[
                        styles.headerContainer,
                        { marginBottom: isLandscapeMode ? 16 : 24 }
                    ]}>
                        <CustomText variant="label" style={styles.welcomeText}>
                            WELCOME TO THRAIL
                        </CustomText>

                        <CustomText
                            variant="h1"
                            style={[
                                styles.titleText,
                                {
                                    fontSize: isLandscapeMode ? 28 : 32,
                                    lineHeight: isLandscapeMode ? 36 : 40
                                }
                            ]}
                        >
                            Your Next Trail
                        </CustomText>
                        <CustomText
                            variant="h1"
                            style={[
                                styles.titleText,
                                {
                                    fontSize: isLandscapeMode ? 28 : 32,
                                    lineHeight: isLandscapeMode ? 36 : 40
                                }
                            ]}
                        >
                            Begins Here
                        </CustomText>

                        <CustomText
                            variant="body"
                            style={[
                                styles.subtitleText,
                                {
                                    marginTop: isLandscapeMode ? 10 : 16,
                                    fontSize: isLandscapeMode ? 14 : 15
                                }
                            ]}
                        >
                            Discover breathtaking mountains, book local guides, and start your adventure today.
                        </CustomText>
                    </View>

                    <View style={[
                        styles.buttonContainer,
                        {
                            gap: isLandscapeMode ? 12 : 16,
                            marginBottom: isLandscapeMode ? 24 : 32
                        }
                    ]}>
                        <CustomButton
                            title="Sign Up"
                            onPress={onSignUpPress}
                            variant="primary"
                        />
                        <CustomButton
                            title="Log In"
                            onPress={onLogInPress}
                            variant="outline"
                        />
                    </View>

                    <CustomText variant="caption" style={styles.footerText}>
                        By continuing, you agree to our{' '}
                        <CustomText
                            variant="caption"
                            style={styles.linkText}
                            onPress={onTermsPress}
                        >
                            Terms of Service
                        </CustomText>
                        {' '}and{' '}
                        <CustomText
                            variant="caption"
                            style={styles.linkText}
                            onPress={onPrivacyPress}
                        >
                            Privacy Policy
                        </CustomText>
                        .
                    </CustomText>
                </View>
            </View>
        </>
    );

    if (isLandscapeMode) {
        return (
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContainer}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                {content}
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            {content}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.WHITE,
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: Colors.WHITE,
    },

    imageWrapper: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },

    cardSection: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        paddingHorizontal: 24,
        paddingTop: 32,
        alignItems: 'center',

        ...Platform.select({
            ios: {




            },
            android: {
                ...GlobalStyles.dropShadow(3),
            },
            web: {
                boxShadow: '0px -8px 24px rgba(0, 0, 0, 0.12)'
            }
        })
    },

    contentConstrainer: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },

    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        color: Colors.PRIMARY,
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: '700',
    },
    titleText: {
        textAlign: 'center',
        lineHeight: 40,
        fontSize: 32,
    },
    subtitleText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginTop: 16,
        paddingHorizontal: 16,
        lineHeight: 24,
        fontSize: 15,
    },

    buttonContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 32,
    },
    footerText: {
        textAlign: 'center',
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
    },
    linkText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },

    // ─── Split-Screen Styles ──────────────────────────────────────────────────

    splitScreenContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: Colors.BACKGROUND,
    },

    // Left panel: image fills panel edge-to-edge, overlay + bottom-left branding
    leftPanel: {
        flex: 1,
        height: '100%',
        backgroundColor: Colors.BACKGROUND,
        position: 'relative',
        overflow: 'hidden',
    },
    splitHeroImage: {
        ...StyleSheet.absoluteFill,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.38)',
    },
    brandingContainer: {
        position: 'absolute',
        bottom: 36,
        left: 32,
        right: 32,
    },
    brandingTitle: {
        color: Colors.TEXT_INVERSE,
        fontSize: 64,
        lineHeight: 48,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    brandingSlogan: {
        color: Colors.TEXT_INVERSE,
        fontSize: 32,
        fontWeight: '600',
        marginBottom: 6,
    },
    brandingSubtext: {
        color: Colors.TEXT_INVERSE,
        fontSize: 16,
        lineHeight: 24,
    },

    // Right panel: forms fill it via isSplitScreen prop, footer pinned at bottom
    rightPanel: {
        flex: 1,
        height: '100%',
        backgroundColor: Colors.BACKGROUND,
        flexDirection: 'column',
    },
    formWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
});

export default LandingScreen;
