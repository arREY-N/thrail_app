/**
 * @file LandingScreen.tsx
 * @description Responsive landing screen. On large screens (≥1024×600), renders a
 * split-screen layout — hero image on the left with bottom-left branding, auth forms on
 * the right inside a padded scroll area. On mobile, renders the classic single-screen
 * landing with CTA buttons.
 */

import React, { useEffect, useState } from 'react';
import {
    Animated,
    Easing,
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
import SplashScreenView from '@/src/components/SplashScreenView';

import { BRAND } from '@/src/constants/branding';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import { useAuthHook, useForgotPassword, useSignUp } from '@/src/core/models/User/User';
import ForgotPasswordScreen from '@/src/features/Auth/screens/ForgotPasswordScreen';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';

const HERO_IMAGE = require('@/src/assets/images/Mt.Tagapo.jpg');

// Session flag: launch animation only plays once on initial app cold start
let hasColdLaunched = false;

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
    onModeChange,
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

    // Cold launch animation controls (plays once on app cold startup)
    const [shouldAnimateLaunch] = useState<boolean>(() => !hasColdLaunched && !initialMode);
    const [isLaunchComplete, setIsLaunchComplete] = useState<boolean>(() => !shouldAnimateLaunch);

    const [splashBgOpacity] = useState<Animated.Value>(() => new Animated.Value(shouldAnimateLaunch ? 1 : 0));
    const [splashTranslateY] = useState<Animated.Value>(() => new Animated.Value(0));
    const [splashScale] = useState<Animated.Value>(() => new Animated.Value(1));
    const [mobileCardTranslateY] = useState<Animated.Value>(() => new Animated.Value(shouldAnimateLaunch ? 80 : 0));
    const [webAuthTranslateX] = useState<Animated.Value>(() => new Animated.Value(shouldAnimateLaunch ? 120 : 0));
    const [webAuthOpacity] = useState<Animated.Value>(() => new Animated.Value(shouldAnimateLaunch ? 0 : 1));

    useEffect(() => {
        if (!shouldAnimateLaunch) {
            return;
        }
        hasColdLaunched = true;

        const timer = setTimeout(() => {
            if (isLargeScreen) {
                Animated.parallel([
                    Animated.timing(splashBgOpacity, {
                        toValue: 0,
                        duration: 420,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                        useNativeDriver: true,
                    }),
                    Animated.timing(splashScale, {
                        toValue: 1.1,
                        duration: 420,
                        useNativeDriver: true,
                    }),
                    Animated.spring(webAuthTranslateX, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                    Animated.timing(webAuthOpacity, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setIsLaunchComplete(true);
                });
            } else {
                Animated.parallel([
                    Animated.timing(splashBgOpacity, {
                        toValue: 0,
                        duration: 380,
                        delay: 0,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                        useNativeDriver: true,
                    }),
                    Animated.timing(splashTranslateY, {
                        toValue: -screenHeight * 0.42,
                        duration: 380,
                        delay: 0,
                        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                        useNativeDriver: true,
                    }),
                    Animated.spring(mobileCardTranslateY, {
                        toValue: 0,
                        friction: 7.5,
                        tension: 40,
                        delay: 0,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setIsLaunchComplete(true);
                });
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [
        shouldAnimateLaunch,
        isLargeScreen,
        screenHeight,
        splashBgOpacity,
        splashScale,
        splashTranslateY,
        mobileCardTranslateY,
        webAuthTranslateX,
        webAuthOpacity,
    ]);

    const loginHook = useAuthHook();
    const signupHook = useSignUp(false);
    const forgotHook = useForgotPassword();
    const updateAuthMode = (mode: 'login' | 'signup' | 'forgot') => {
        setAuthMode(mode);
        onModeChange?.(mode);
        forgotHook.reset();
        loginHook.reset();
    };

    const handleDesktopLogIn = async (email?: string, password?: string) => {
        if (!email || !password) return;
        await loginHook.onLogIn(email, password);
    };

    const handleDesktopGmailLogIn = async () => {
        await loginHook.onGmailLogIn();
    };

    const handleDesktopGmailSignUp = async () => {
        await signupHook.onGmailSignUp();
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
                        <View style={styles.brandingTitleRow}>
                            <View style={styles.brandingLogoWrapper}>
                                <CustomImage
                                    source={BRAND.ASSETS.GLYPH_WHITE}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <CustomText variant="h1" style={styles.brandingTitle}>
                                Thrail
                            </CustomText>
                        </View>
                        <CustomText variant="h3" style={styles.brandingSlogan}>
                            {BRAND.SLOGAN}
                        </CustomText>
                        <CustomText variant="body" style={styles.brandingSubtext}>
                            {BRAND.SUBTITLE}
                        </CustomText>
                    </View>
                </View>

                {/* Right Panel — forms own their scroll via isSplitScreen */}
                <Animated.View
                    style={[
                        styles.rightPanel,
                        {
                            opacity: webAuthOpacity,
                            transform: [{ translateX: webAuthTranslateX }],
                        },
                    ]}
                >
                    <View style={styles.formWrapper}>
                        {authMode === 'login' ? (
                            <LogInScreen
                                isSplitScreen={true}
                                onLogInPress={handleDesktopLogIn}
                                onSignUpPress={() => updateAuthMode('signup')}
                                onBackPress={() => {}}
                                onForgotPasswordPress={() => updateAuthMode('forgot')}
                                onRememberMePress={loginHook.onRememberMePress}
                                onGmailLogIn={handleDesktopGmailLogIn}
                                onTermsPress={onTermsPress}
                                onPrivacyPress={onPrivacyPress}
                                error={loginHook.error}
                                remember={loginHook.remember}
                                isLoading={loginHook.isLoading}
                            />
                        ) : authMode === 'signup' ? (
                            <SignUpScreen
                                isSplitScreen={true}
                                onSignUpPress={signupHook.onSignUpPress as (email: string, password: string, username: string, confirmPassword: string) => void}
                                onLogInPress={() => updateAuthMode('login')}
                                onBackPress={() => {}}
                                onGmailSignUp={handleDesktopGmailSignUp}
                                onTermsPress={onTermsPress}
                                onPrivacyPress={onPrivacyPress}
                                error={signupHook.error}
                                isLoading={signupHook.isLoading}
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
                </Animated.View>

                {/* Splash Screen Launch Overlay on Web */}
                {!isLaunchComplete && (
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                zIndex: 9999,
                                opacity: splashBgOpacity,
                                transform: [{ scale: splashScale }],
                            },
                        ]}
                    >
                        <SplashScreenView />
                    </Animated.View>
                )}
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

            <Animated.View style={[
                styles.cardSection,
                {
                    paddingBottom: Math.max(insets.bottom + 16, 32),
                    paddingTop: isLandscapeMode ? 48 : 32,
                    transform: [{ translateY: mobileCardTranslateY }],
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
                                    lineHeight: isLandscapeMode ? 34 : 38,
                                },
                            ]}
                        >
                            {BRAND.SLOGAN_STACKED}
                        </CustomText>

                        <CustomText
                            variant="body"
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            style={[
                                styles.subtitleText,
                                {
                                    marginTop: isLandscapeMode ? 8 : 12,
                                    fontSize: isLandscapeMode ? 12.5 : 13.5,
                                    lineHeight: isLandscapeMode ? 18 : 20,
                                },
                            ]}
                        >
                            {BRAND.SUBTITLE_2LINE}
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
            </Animated.View>

            {/* Splash Screen Launch Overlay on Mobile (Sync Lift) */}
            {!isLaunchComplete && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            zIndex: 9999,
                            opacity: splashBgOpacity,
                            transform: [{ translateY: splashTranslateY }],
                        },
                    ]}
                >
                    <SplashScreenView />
                </Animated.View>
            )}
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
        backgroundColor: '#2E5D32',
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
        lineHeight: 38,
        fontSize: 32,
    },
    subtitleText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginTop: 12,
        paddingHorizontal: 0,
        width: '100%',
        alignSelf: 'center',
        lineHeight: 20,
        fontSize: 13.5,
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
    brandingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8,
    },
    brandingLogoWrapper: {
        width: 76,
        height: 76,
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    brandingTitle: {
        color: Colors.TEXT_INVERSE,
        fontSize: 64,
        lineHeight: 64,
        fontWeight: 'bold',
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
