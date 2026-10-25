/**
 * @file BrandingPreviewScreen.tsx
 * @description Interactive development testing screen for comparing and simulating
 * Thrail's candidate logos (Idea 2, Idea 4, Idea 5) across Splash Screen launch animations,
 * Android Launcher adaptive icon masks with safe-zone overlays, app headers, and side-by-side grids.
 */

import React, { useCallback, useState } from 'react';
import {
    Animated,
    Easing,
    GestureResponderEvent,
    ImageSourcePropType,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

const HERO_IMAGE = require('@/src/assets/images/Mt.Tagapo.jpg');

export type IdeaKey = 'idea2' | 'idea4' | 'idea5';
export type VariantKey = 'primary' | 'inverted';
export type ShapeKey = 'glyph' | 'square' | 'circle';
export type TabKey = 'splash' | 'transition' | 'launcher' | 'header' | 'compare';
export type SplashSizeKey = 140 | 180 | 220 | 260;
export type TransitionStyleKey = 'zoom-in' | 'zoom-out' | 'sync-lift' | 'sequenced-fade';
export type PlatformPreviewKey = 'mobile' | 'desktop';

interface LogoConcept {
    id: IdeaKey;
    name: string;
    description: string;
    tagline: string;
    primary: {
        glyph: ImageSourcePropType;
        square: ImageSourcePropType;
        circle: ImageSourcePropType;
    };
    inverted: {
        glyph: ImageSourcePropType;
        square: ImageSourcePropType;
        circle: ImageSourcePropType;
    };
}

const LOGO_CONCEPTS: Record<IdeaKey, LogoConcept> = {
    idea2: {
        id: 'idea2',
        name: 'Idea 2',
        description: 'Summit & Winding Trail / Tent',
        tagline: 'Minimalist mountain peak with organic trail switchback',
        primary: {
            glyph: require('@/src/assets/logos/Logo Idea 2/Icon.png'),
            square: require('@/src/assets/logos/Logo Idea 2/Squere Logo.png'),
            circle: require('@/src/assets/logos/Logo Idea 2/Circle Logo.png'),
        },
        inverted: {
            glyph: require('@/src/assets/logos/Logo Idea 2/Inverted Icon.png'),
            square: require('@/src/assets/logos/Logo Idea 2/Inverted Squere Logo.png'),
            circle: require('@/src/assets/logos/Logo Idea 2/Inverted Circle Logo.png'),
        },
    },
    idea4: {
        id: 'idea4',
        name: 'Idea 4',
        description: 'Monogram "T" & Summits',
        tagline: 'Lettermark "T" trail stem crowned with mountain summits',
        primary: {
            glyph: require('@/src/assets/logos/Logo Idea 4/Icon.png'),
            square: require('@/src/assets/logos/Logo Idea 4/Squere Logo.png'),
            circle: require('@/src/assets/logos/Logo Idea 4/Circle Logo V1.png'),
        },
        inverted: {
            glyph: require('@/src/assets/logos/Logo Idea 4/Inverted Icon.png'),
            square: require('@/src/assets/logos/Logo Idea 4/Inverted Squere Logo.png'),
            circle: require('@/src/assets/logos/Logo Idea 4/Inverted Circle Logo V1.png'),
        },
    },
    idea5: {
        id: 'idea5',
        name: 'Idea 5',
        description: 'Mountain Bookmark Ribbon',
        tagline: 'Bookmark / save ribbon with mountain peak cutoff (reservations)',
        primary: {
            glyph: require('@/src/assets/logos/Logo Idea 5/Icon.png'),
            square: require('@/src/assets/logos/Logo Idea 5/Squere Logo.png'),
            circle: require('@/src/assets/logos/Logo Idea 5/Circle Logo.png'),
        },
        inverted: {
            glyph: require('@/src/assets/logos/Logo Idea 5/Inverted Icon.png'),
            square: require('@/src/assets/logos/Logo Idea 5/Inverted Squere Logo.png'),
            circle: require('@/src/assets/logos/Logo Idea 5/Inverted Circle Logo.png'),
        },
    },
};

/**
 * Props for BrandingPreviewScreen component.
 * @param onBackPress - Callback invoked when the top back navigation action is triggered.
 */
export interface BrandingPreviewScreenProps {
    onBackPress: () => void;
}

const BrandingPreviewScreen = ({ onBackPress }: BrandingPreviewScreenProps): React.JSX.Element => {
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();

    const [activeIdea, setActiveIdea] = useState<IdeaKey>('idea2');
    const [activeVariant, setActiveVariant] = useState<VariantKey>('primary'); // Default to Forest Green #2E7D32 as requested
    const [activeShape, setActiveShape] = useState<ShapeKey>('glyph'); // Default to pure borderless glyph
    const [activeTab, setActiveTab] = useState<TabKey>('splash');
    const [platformMode, setPlatformMode] = useState<PlatformPreviewKey>('mobile');
    const [splashSize, setSplashSize] = useState<SplashSizeKey>(140);
    const [showTypography, setShowTypography] = useState<boolean>(true);
    const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
    const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

    // Full Launch Sequence State & Choreographed Animations
    const [transitionStyle, setTransitionStyle] = useState<TransitionStyleKey>('sync-lift'); // Default to Sync Lift as requested
    const [isTransitionComplete, setIsTransitionComplete] = useState<boolean>(false);

    const [animOpacity] = useState<Animated.Value>(() => new Animated.Value(1));
    const [animScale] = useState<Animated.Value>(() => new Animated.Value(1));

    // Refined Multi-Phase Transition Animated Values (Mobile)
    const [splashLogoOpacity] = useState<Animated.Value>(() => new Animated.Value(1));
    const [splashLogoScale] = useState<Animated.Value>(() => new Animated.Value(1));
    const [splashLogoTranslateY] = useState<Animated.Value>(() => new Animated.Value(0));
    const [splashBgOpacity] = useState<Animated.Value>(() => new Animated.Value(1));
    const [landingCardTranslateY] = useState<Animated.Value>(() => new Animated.Value(80));
    const [landingHeroOpacity] = useState<Animated.Value>(() => new Animated.Value(0));

    // Desktop Web Split-Screen Animated Values
    const [webSplashOpacity] = useState<Animated.Value>(() => new Animated.Value(1));
    const [webSplashScale] = useState<Animated.Value>(() => new Animated.Value(1));
    const [webRightPanelTranslateX] = useState<Animated.Value>(() => new Animated.Value(140));
    const [webRightPanelOpacity] = useState<Animated.Value>(() => new Animated.Value(0));
    const [webHeroOpacity] = useState<Animated.Value>(() => new Animated.Value(0));
    const [webBrandingTranslateY] = useState<Animated.Value>(() => new Animated.Value(30));
    const [webBrandingOpacity] = useState<Animated.Value>(() => new Animated.Value(0));

    const handleReplaySplash = useCallback(() => {
        animOpacity.setValue(0);
        animScale.setValue(0.85);

        Animated.parallel([
            Animated.timing(animOpacity, {
                toValue: 1,
                duration: 650,
                useNativeDriver: true,
            }),
            Animated.spring(animScale, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, [animOpacity, animScale]);

    const handleRunWebTransition = useCallback(() => {
        setIsTransitionComplete(false);
        webSplashOpacity.setValue(1);
        webSplashScale.setValue(1);
        webRightPanelTranslateX.setValue(140);
        webRightPanelOpacity.setValue(0);
        webHeroOpacity.setValue(0);
        webBrandingTranslateY.setValue(30);
        webBrandingOpacity.setValue(0);

        Animated.parallel([
            Animated.timing(webSplashScale, {
                toValue: 1.08,
                duration: 380,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(webSplashOpacity, {
                toValue: 0,
                duration: 350,
                delay: 60,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(webHeroOpacity, {
                toValue: 1,
                duration: 400,
                delay: 80,
                useNativeDriver: true,
            }),
            Animated.timing(webBrandingOpacity, {
                toValue: 1,
                duration: 380,
                delay: 140,
                useNativeDriver: true,
            }),
            Animated.spring(webBrandingTranslateY, {
                toValue: 0,
                friction: 7.5,
                tension: 40,
                delay: 140,
                useNativeDriver: true,
            }),
            Animated.timing(webRightPanelOpacity, {
                toValue: 1,
                duration: 400,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.spring(webRightPanelTranslateX, {
                toValue: 0,
                friction: 8,
                tension: 38,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsTransitionComplete(true);
        });
    }, [
        webSplashOpacity,
        webSplashScale,
        webRightPanelTranslateX,
        webRightPanelOpacity,
        webHeroOpacity,
        webBrandingTranslateY,
        webBrandingOpacity,
    ]);

    const handleRunLaunchSequence = useCallback((chosenStyle?: TransitionStyleKey) => {
        const style = chosenStyle ?? transitionStyle;
        setIsTransitionComplete(false);

        // Reset animated values to clean baseline
        splashLogoOpacity.setValue(1);
        splashLogoScale.setValue(1);
        splashLogoTranslateY.setValue(0);
        splashBgOpacity.setValue(1);
        landingCardTranslateY.setValue(80);
        landingHeroOpacity.setValue(0);

        if (style === 'zoom-in') {
            // ZOOM-IN (FLY-THROUGH):
            Animated.parallel([
                Animated.timing(splashLogoScale, {
                    toValue: 1.75,
                    duration: 340,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(splashLogoOpacity, {
                    toValue: 0,
                    duration: 280,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(splashBgOpacity, {
                    toValue: 0,
                    duration: 380,
                    delay: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(landingHeroOpacity, {
                    toValue: 1,
                    duration: 350,
                    delay: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(landingCardTranslateY, {
                    toValue: 0,
                    friction: 7,
                    tension: 40,
                    delay: 240,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsTransitionComplete(true);
            });
        } else if (style === 'zoom-out') {
            // ZOOM-OUT (FADE-BACK):
            Animated.parallel([
                Animated.timing(splashLogoScale, {
                    toValue: 0.72,
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(splashLogoOpacity, {
                    toValue: 0,
                    duration: 260,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(splashBgOpacity, {
                    toValue: 0,
                    duration: 380,
                    delay: 190,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(landingHeroOpacity, {
                    toValue: 1,
                    duration: 350,
                    delay: 190,
                    useNativeDriver: true,
                }),
                Animated.spring(landingCardTranslateY, {
                    toValue: 0,
                    friction: 7,
                    tension: 40,
                    delay: 230,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsTransitionComplete(true);
            });
        } else if (style === 'sync-lift') {
            // SYNCHRONIZED LIFT (ZERO-LATENCY MECHANICAL LOCKSTEP):
            // 1. Splash logo lifts upward (-90px) and dissolves with delay: 0
            // 2. Splash canvas dissolves simultaneously with delay: 0
            // 3. Landing card ascends (80 -> 0) with delay: 0
            // 4. Hero image fades in concurrently with delay: 0
            Animated.parallel([
                Animated.timing(splashLogoTranslateY, {
                    toValue: -90,
                    duration: 380,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(splashLogoOpacity, {
                    toValue: 0,
                    duration: 280,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(splashBgOpacity, {
                    toValue: 0,
                    duration: 380,
                    delay: 0,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true,
                }),
                Animated.timing(landingHeroOpacity, {
                    toValue: 1,
                    duration: 350,
                    delay: 0,
                    useNativeDriver: true,
                }),
                Animated.spring(landingCardTranslateY, {
                    toValue: 0,
                    friction: 7.5,
                    tension: 40,
                    delay: 0,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsTransitionComplete(true);
            });
        } else {
            // SEQUENCED DISSOLVE:
            Animated.sequence([
                Animated.timing(splashLogoOpacity, {
                    toValue: 0,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.parallel([
                    Animated.timing(splashBgOpacity, {
                        toValue: 0,
                        duration: 380,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(landingHeroOpacity, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                    }),
                    Animated.spring(landingCardTranslateY, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => {
                setIsTransitionComplete(true);
            });
        }
    }, [
        transitionStyle,
        splashLogoOpacity,
        splashLogoScale,
        splashLogoTranslateY,
        splashBgOpacity,
        landingHeroOpacity,
        landingCardTranslateY,
    ]);

    const handleReplayTransition = useCallback((chosenStyle?: TransitionStyleKey, targetPlatform?: PlatformPreviewKey) => {
        const platform = targetPlatform ?? platformMode;
        if (platform === 'desktop') {
            webSplashOpacity.setValue(1);
            webSplashScale.setValue(1);
            webRightPanelTranslateX.setValue(140);
            webRightPanelOpacity.setValue(0);
            webHeroOpacity.setValue(0);
            webBrandingTranslateY.setValue(30);
            webBrandingOpacity.setValue(0);
            setIsTransitionComplete(false);

            const timer = setTimeout(() => {
                handleRunWebTransition();
            }, 650);
            return () => clearTimeout(timer);
        }

        // Mobile launch replay
        splashLogoOpacity.setValue(1);
        splashLogoScale.setValue(1);
        splashLogoTranslateY.setValue(0);
        splashBgOpacity.setValue(1);
        landingCardTranslateY.setValue(80);
        landingHeroOpacity.setValue(0);
        setIsTransitionComplete(false);

        // Auto trigger after a brief pause (650ms) so user perceives splash logo first
        const timer = setTimeout(() => {
            handleRunLaunchSequence(chosenStyle);
        }, 650);

        return () => clearTimeout(timer);
    }, [
        platformMode,
        handleRunWebTransition,
        handleRunLaunchSequence,
        webSplashOpacity,
        webSplashScale,
        webRightPanelTranslateX,
        webRightPanelOpacity,
        webHeroOpacity,
        webBrandingTranslateY,
        webBrandingOpacity,
        splashLogoOpacity,
        splashLogoScale,
        splashLogoTranslateY,
        splashBgOpacity,
        landingHeroOpacity,
        landingCardTranslateY,
    ]);

    const currentConcept = LOGO_CONCEPTS[activeIdea];
    const currentAsset = currentConcept[activeVariant][activeShape];

    const backgroundColor = activeVariant === 'primary' ? Colors.PRIMARY : Colors.BACKGROUND;
    const textColor = activeVariant === 'primary' ? Colors.BACKGROUND : Colors.PRIMARY;
    const subtextColor = activeVariant === 'primary' ? Colors.SECONDARY : Colors.GRAY;

    /**
     * Renders the floating options configuration drawer.
     */
    const renderConfigDrawer = (): React.JSX.Element | null => {
        if (!showConfigModal) return null;

        return (
            <View style={styles.modalOverlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setShowConfigModal(false)}
                />

                <View style={[styles.modalCard, { marginBottom: insets.bottom + 12 }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeaderRow}>
                        <View style={styles.modalHeaderTitleGroup}>
                            <CustomText variant="h3" style={styles.modalTitle}>
                                Splash & Logo Options
                            </CustomText>
                            <CustomText variant="caption" style={styles.modalSubtitle}>
                                Configure live on your Android emulator
                            </CustomText>
                        </View>
                        <Pressable
                            onPress={() => setShowConfigModal(false)}
                            style={styles.modalCloseBtn}
                        >
                            <CustomIcon
                                library="Ionicons"
                                name="close"
                                size={20}
                                color={Colors.TEXT_PRIMARY}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.modalScrollBody}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Concept Selector */}
                        <CustomText variant="label" style={styles.modalSectionLabel}>
                            Choose Concept:
                        </CustomText>
                        <View style={styles.modalPillsRow}>
                            {(['idea2', 'idea4', 'idea5'] as IdeaKey[]).map((key) => {
                                const isPicked = activeIdea === key;
                                return (
                                    <Pressable
                                        key={key}
                                        onPress={() => setActiveIdea(key)}
                                        style={[
                                            styles.modalChoicePill,
                                            isPicked ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                        ]}
                                    >
                                        <CustomText
                                            variant="caption"
                                            style={isPicked ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                        >
                                            {LOGO_CONCEPTS[key].name}
                                        </CustomText>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <CustomText variant="caption" style={styles.modalConceptDescription}>
                            {currentConcept.description} — {currentConcept.tagline}
                        </CustomText>

                        {/* Palette Selector */}
                        <CustomText variant="label" style={styles.modalSectionLabel}>
                            Background Palette:
                        </CustomText>
                        <View style={styles.modalPillsRow}>
                            <Pressable
                                onPress={() => setActiveVariant('primary')}
                                style={[
                                    styles.modalChoicePill,
                                    activeVariant === 'primary' ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeVariant === 'primary' ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                >
                                    Forest Green #2E7D32
                                </CustomText>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveVariant('inverted')}
                                style={[
                                    styles.modalChoicePill,
                                    activeVariant === 'inverted' ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeVariant === 'inverted' ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                >
                                    Off-White #FAFCFA
                                </CustomText>
                            </Pressable>
                        </View>

                        {/* Shape Selector */}
                        <CustomText variant="label" style={styles.modalSectionLabel}>
                            Logo Silhouette:
                        </CustomText>
                        <View style={styles.modalPillsRow}>
                            <Pressable
                                onPress={() => setActiveShape('glyph')}
                                style={[
                                    styles.modalChoicePill,
                                    activeShape === 'glyph' ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeShape === 'glyph' ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                >
                                    Borderless Glyph
                                </CustomText>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveShape('square')}
                                style={[
                                    styles.modalChoicePill,
                                    activeShape === 'square' ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeShape === 'square' ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                >
                                    Square Mark
                                </CustomText>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveShape('circle')}
                                style={[
                                    styles.modalChoicePill,
                                    activeShape === 'circle' ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeShape === 'circle' ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                >
                                    Circle Badge
                                </CustomText>
                            </Pressable>
                        </View>

                        {/* Size Selector */}
                        <CustomText variant="label" style={styles.modalSectionLabel}>
                            Logo Scale on Screen:
                        </CustomText>
                        <View style={styles.modalPillsRow}>
                            {([140, 180, 220, 260] as SplashSizeKey[]).map((size) => {
                                const isSizeActive = splashSize === size;
                                return (
                                    <Pressable
                                        key={size}
                                        onPress={() => setSplashSize(size)}
                                        style={[
                                            styles.modalChoicePill,
                                            isSizeActive ? styles.modalChoicePillSelected : styles.modalChoicePillUnselected,
                                        ]}
                                    >
                                        <CustomText
                                            variant="caption"
                                            style={isSizeActive ? styles.modalChoiceTextSelected : styles.modalChoiceTextUnselected}
                                        >
                                            {size}px
                                        </CustomText>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Slogan Toggle */}
                        <CustomText variant="label" style={styles.modalSectionLabel}>
                            App Slogan:
                        </CustomText>
                        <Pressable
                            onPress={() => setShowTypography(!showTypography)}
                            style={[
                                styles.sloganToggleCard,
                                showTypography ? styles.sloganToggleCardActive : null,
                            ]}
                        >
                            <View style={styles.sloganToggleContent}>
                                <CustomText variant="label" style={styles.sloganTitleText}>
                                    &quot;Find thrill in your trail&quot;
                                </CustomText>
                                <CustomText variant="caption" style={styles.sloganSubText}>
                                    {showTypography ? 'Visible on splash screen' : 'Hidden (Logo mark only)'}
                                </CustomText>
                            </View>
                            <CustomIcon
                                library="Ionicons"
                                name={showTypography ? 'checkmark-circle' : 'ellipse-outline'}
                                size={22}
                                color={showTypography ? Colors.PRIMARY : Colors.GRAY}
                            />
                        </Pressable>

                        {/* Launch Transition Simulation Action */}
                        <CustomButton
                            title="🎬 Test Splash → Landing Transition"
                            variant="primary"
                            onPress={() => {
                                setShowConfigModal(false);
                                setActiveTab('transition');
                                handleReplayTransition();
                            }}
                            style={{ marginTop: 14, marginBottom: 4 }}
                        />

                        {/* Quick View Switches */}
                        <CustomText variant="label" style={styles.modalSectionLabel}>
                            Switch Development Tools:
                        </CustomText>
                        <View style={styles.toolSwitchRow}>
                            <Pressable
                                onPress={() => {
                                    setActiveTab('launcher');
                                    setIsFullScreen(false);
                                    setShowConfigModal(false);
                                }}
                                style={styles.toolSwitchBtn}
                            >
                                <CustomIcon library="Ionicons" name="apps" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="caption" style={styles.toolSwitchText}>
                                    Launcher Icons
                                </CustomText>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setActiveTab('compare');
                                    setIsFullScreen(false);
                                    setShowConfigModal(false);
                                }}
                                style={styles.toolSwitchBtn}
                            >
                                <CustomIcon library="Ionicons" name="git-compare" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="caption" style={styles.toolSwitchText}>
                                    Side-by-Side
                                </CustomText>
                            </Pressable>
                        </View>
                    </ScrollView>

                    <CustomButton
                        title="Close Options"
                        variant="outline"
                        onPress={() => {
                            setShowConfigModal(false);
                            handleReplaySplash();
                        }}
                        style={styles.modalDoneButton}
                    />
                </View>
            </View>
        );
    };

    // =========================================================================
    // 1. TRUE 1:1 EDGE-TO-EDGE FULL-SCREEN SPLASH MODE
    // =========================================================================
    if (activeTab === 'splash' && isFullScreen) {
        return (
            <Pressable
                onPress={handleReplaySplash}
                style={[styles.fullScreenSplashRoot, { backgroundColor }]}
            >
                <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle={activeVariant === 'primary' ? 'light-content' : 'dark-content'}
                />

                {/* Top-Left Floating Exit Back Button */}
                <Pressable
                    onPress={(e: GestureResponderEvent) => {
                        e.stopPropagation();
                        onBackPress();
                    }}
                    style={[
                        styles.fullScreenFloatingBtn,
                        {
                            top: insets.top + 16,
                            left: 16,
                            backgroundColor: activeVariant === 'primary' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
                        },
                    ]}
                >
                    <CustomIcon
                        library="Ionicons"
                        name="arrow-back"
                        size={20}
                        color={textColor}
                    />
                </Pressable>

                {/* Top-Center Concept Pill */}
                <View
                    style={[
                        styles.fullScreenConceptPill,
                        {
                            top: insets.top + 20,
                            backgroundColor: activeVariant === 'primary' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)',
                        },
                    ]}
                >
                    <CustomText variant="caption" style={[styles.fullScreenConceptText, { color: textColor }]}>
                        {currentConcept.name} • {activeVariant === 'primary' ? 'Green' : 'White'} {activeShape}
                    </CustomText>
                </View>

                {/* Top-Right Floating Pin / Options Circle Button */}
                <Pressable
                    onPress={(e: GestureResponderEvent) => {
                        e.stopPropagation();
                        setShowConfigModal(true);
                    }}
                    style={[
                        styles.fullScreenFloatingBtn,
                        {
                            top: insets.top + 16,
                            right: 16,
                            backgroundColor: activeVariant === 'primary' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)',
                        },
                    ]}
                >
                    <CustomIcon
                        library="Ionicons"
                        name="options"
                        size={20}
                        color={textColor}
                    />
                </Pressable>

                {/* Center Launch Artwork */}
                <Animated.View
                    style={[
                        styles.animatedSplashContent,
                        {
                            opacity: animOpacity,
                            transform: [{ scale: animScale }],
                        },
                    ]}
                >
                    <View style={[styles.logoImageWrapper, { width: splashSize, height: splashSize }]}>
                        <CustomImage
                            source={currentAsset}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    </View>

                    {showTypography && (
                        <View style={styles.splashTypographyGroup}>
                            <CustomText
                                variant="h1"
                                style={[styles.splashTitle, { color: textColor }]}
                            >
                                THRAIL
                            </CustomText>
                            <CustomText
                                variant="caption"
                                style={[styles.splashSubtitle, { color: subtextColor }]}
                            >
                                FIND THRILL IN YOUR TRAIL
                            </CustomText>
                        </View>
                    )}
                </Animated.View>

                {/* Bottom Tap Hint */}
                <View style={[styles.fullScreenBottomBar, { bottom: insets.bottom + 16 }]}>
                    <CustomText variant="caption" style={[styles.fullScreenBottomHint, { color: subtextColor }]}>
                        Tap screen to replay launch • Tap top-right circle for options
                    </CustomText>
                </View>

                {/* Slide-Up Config Drawer */}
                {renderConfigDrawer()}
            </Pressable>
        );
    }

    // =========================================================================
    // 2. FULL LAUNCH SEQUENCE SIMULATOR (SPLASH -> LANDING SCREEN TRANSITION)
    // =========================================================================
    if (activeTab === 'transition') {
        return (
            <View style={styles.transitionSimulatorContainer}>
                <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle="light-content"
                />

                {platformMode === 'desktop' ? (
                    /* ------------------------------------------------------------- */
                    /* A. DESKTOP WEB SPLIT-SCREEN VIEW (>=1024px Split Layout)      */
                    /* ------------------------------------------------------------- */
                    <View style={styles.webDesktopRoot}>
                        {/* Left 50% Panel: Mt. Tagapo Hero + Bottom-Left Branding Lockup */}
                        <Animated.View
                            style={[
                                styles.webLeftPanel,
                                {
                                    opacity: webHeroOpacity,
                                },
                            ]}
                        >
                            <CustomImage
                                source={HERO_IMAGE}
                                style={styles.fullImage}
                                resizeMode="cover"
                            />
                            <View style={styles.webLeftOverlay} />

                            {/* Bottom-Left Branding Lockup */}
                            <Animated.View
                                style={[
                                    styles.webBrandingContainer,
                                    {
                                        opacity: webBrandingOpacity,
                                        transform: [{ translateY: webBrandingTranslateY }],
                                    },
                                ]}
                            >
                                <View style={styles.webBrandingHeaderRow}>
                                    <View style={styles.webBrandingGlyphWrapper}>
                                        <CustomImage
                                            source={currentAsset}
                                            style={styles.fullImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <CustomText variant="h1" style={styles.webBrandingTitle}>
                                        THRAIL
                                    </CustomText>
                                </View>
                                <CustomText variant="label" style={styles.webBrandingSlogan}>
                                    FIND THRILL IN YOUR TRAIL
                                </CustomText>
                                <CustomText variant="caption" style={styles.webBrandingSubtext}>
                                    The outdoor guide booking platform for Philippine mountains.
                                </CustomText>
                            </Animated.View>
                        </Animated.View>

                        {/* Right 50% Panel: Interactive Clean Auth Card */}
                        <Animated.View
                            style={[
                                styles.webRightPanel,
                                {
                                    opacity: webRightPanelOpacity,
                                    transform: [{ translateX: webRightPanelTranslateX }],
                                },
                            ]}
                        >
                            <View style={styles.webFormCard}>
                                <CustomText variant="h2" style={styles.webFormTitle}>
                                    Welcome Back
                                </CustomText>
                                <CustomText variant="body" style={styles.webFormSubtitle}>
                                    Sign in to access your mountain bookings and guides.
                                </CustomText>

                                <View style={styles.webFieldGroup}>
                                    <CustomText variant="caption" style={styles.webFieldLabel}>
                                        Email Address
                                    </CustomText>
                                    <View style={styles.webMockInput}>
                                        <CustomText variant="caption" style={styles.webMockInputPlaceholder}>
                                            hiker@example.com
                                        </CustomText>
                                    </View>
                                </View>

                                <View style={styles.webFieldGroup}>
                                    <CustomText variant="caption" style={styles.webFieldLabel}>
                                        Password
                                    </CustomText>
                                    <View style={styles.webMockInput}>
                                        <CustomText variant="caption" style={styles.webMockInputPlaceholder}>
                                            ••••••••••••
                                        </CustomText>
                                    </View>
                                </View>

                                <CustomButton
                                    title="Sign In"
                                    variant="primary"
                                    onPress={() => {}}
                                    style={styles.webFormBtn}
                                />

                                <View style={styles.webDividerRow}>
                                    <View style={styles.webDividerLine} />
                                    <CustomText variant="caption" style={styles.webDividerText}>
                                        OR
                                    </CustomText>
                                    <View style={styles.webDividerLine} />
                                </View>

                                <CustomButton
                                    title="Continue with Google"
                                    variant="outline"
                                    onPress={() => {}}
                                    style={styles.webFormBtn}
                                />

                                <CustomText variant="caption" style={styles.webFormFooter}>
                                    Don&apos;t have an account?{' '}
                                    <CustomText variant="caption" style={styles.webFormFooterLink}>
                                        Create an account
                                    </CustomText>
                                </CustomText>
                            </View>
                        </Animated.View>

                        {/* Desktop Web Splash Screen Overlay */}
                        <Animated.View
                            pointerEvents={isTransitionComplete ? 'none' : 'auto'}
                            style={[
                                styles.webSplashOverlay,
                                {
                                    backgroundColor,
                                    opacity: webSplashOpacity,
                                },
                            ]}
                        >
                            <Pressable
                                style={styles.webSplashCenter}
                                onPress={() => handleRunWebTransition()}
                            >
                                <Animated.View
                                    style={[
                                        styles.webSplashLogoWrap,
                                        {
                                            width: splashSize + 20,
                                            height: splashSize + 20,
                                            transform: [{ scale: webSplashScale }],
                                        },
                                    ]}
                                >
                                    <CustomImage
                                        source={currentAsset}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                </Animated.View>

                                {showTypography && (
                                    <View style={styles.splashTypographyGroup}>
                                        <CustomText
                                            variant="h1"
                                            style={[styles.splashTitle, { color: textColor }]}
                                        >
                                            THRAIL
                                        </CustomText>
                                        <CustomText
                                            variant="caption"
                                            style={[styles.splashSubtitle, { color: subtextColor }]}
                                        >
                                            FIND THRILL IN YOUR TRAIL
                                        </CustomText>
                                    </View>
                                )}
                            </Pressable>

                            {!isTransitionComplete && (
                                <View style={[styles.transitionTapHintBar, { bottom: 24 }]}>
                                    <CustomText variant="caption" style={[styles.fullScreenBottomHint, { color: subtextColor }]}>
                                        Web Desktop Sequence Launching... (tap to trigger)
                                    </CustomText>
                                </View>
                            )}
                        </Animated.View>
                    </View>
                ) : (
                    /* ------------------------------------------------------------- */
                    /* B. MOBILE LAUNCH SEQUENCE VIEW (Calibrated Sync Lift + Hero)  */
                    /* ------------------------------------------------------------- */
                    <View style={StyleSheet.absoluteFill}>
                        {/* 1. Underlying Realistic Landing Screen View */}
                        <Animated.View
                            style={[
                                styles.simulatedLandingRoot,
                                {
                                    opacity: landingHeroOpacity,
                                },
                            ]}
                        >
                            {/* Top Hero Image Section - Extended to 58% height with mountain green fallback */}
                            <View style={[styles.simulatedHeroWrapper, { height: screenHeight * 0.58 }]}>
                                <CustomImage
                                    source={HERO_IMAGE}
                                    style={styles.fullImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.simulatedHeroOverlay} />
                            </View>

                            {/* Bottom White Card Section */}
                            <Animated.View
                                style={[
                                    styles.simulatedCardSection,
                                    {
                                        paddingBottom: Math.max(insets.bottom + 16, 24),
                                        transform: [{ translateY: landingCardTranslateY }],
                                    },
                                ]}
                            >
                                <View style={styles.simulatedContentConstrainer}>
                                    <CustomText variant="label" style={styles.simulatedWelcomeText}>
                                        WELCOME TO THRAIL
                                    </CustomText>
                                    <CustomText variant="h1" style={styles.simulatedTitleText}>
                                        Your Next Trail
                                    </CustomText>
                                    <CustomText variant="h1" style={styles.simulatedTitleText}>
                                        Begins Here
                                    </CustomText>
                                    <CustomText variant="body" style={styles.simulatedSubtitleText}>
                                        Discover breathtaking mountains, book local guides, and start your adventure today.
                                    </CustomText>

                                    <View style={styles.simulatedButtonContainer}>
                                        <CustomButton
                                            title="Sign Up"
                                            onPress={() => {}}
                                            variant="primary"
                                        />
                                        <CustomButton
                                            title="Log In"
                                            onPress={() => {}}
                                            variant="outline"
                                        />
                                    </View>

                                    <CustomText variant="caption" style={styles.simulatedFooterText}>
                                        By continuing, you agree to our{' '}
                                        <CustomText variant="caption" style={styles.simulatedLinkText}>
                                            Terms of Service
                                        </CustomText>
                                        {' '}and{' '}
                                        <CustomText variant="caption" style={styles.simulatedLinkText}>
                                            Privacy Policy
                                        </CustomText>
                                    </CustomText>
                                </View>
                            </Animated.View>
                        </Animated.View>

                        {/* 2a. Solid Splash Canvas Overlay (Fades out in Phase 2 to reveal scene) */}
                        <Animated.View
                            pointerEvents={isTransitionComplete ? 'none' : 'auto'}
                            style={[
                                styles.transitionSplashOverlay,
                                {
                                    backgroundColor,
                                    opacity: splashBgOpacity,
                                },
                            ]}
                        >
                            <Pressable
                                style={StyleSheet.absoluteFill}
                                onPress={() => handleRunLaunchSequence()}
                            />
                        </Animated.View>

                        {/* 2b. Splash Logo & Slogan Artwork Layer (Fades/Scales in Phase 1 before canvas dissolves) */}
                        <Animated.View
                            pointerEvents={isTransitionComplete ? 'none' : 'auto'}
                            style={[
                                styles.transitionLogoFloatingLayer,
                                {
                                    opacity: splashLogoOpacity,
                                    transform: [
                                        { scale: splashLogoScale },
                                        { translateY: splashLogoTranslateY },
                                    ],
                                },
                            ]}
                        >
                            <Pressable
                                style={styles.transitionSplashCenter}
                                onPress={() => handleRunLaunchSequence()}
                            >
                                <View style={[styles.logoImageWrapper, { width: splashSize, height: splashSize }]}>
                                    <CustomImage
                                        source={currentAsset}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                </View>
                                {showTypography && (
                                    <View style={styles.splashTypographyGroup}>
                                        <CustomText
                                            variant="h1"
                                            style={[styles.splashTitle, { color: textColor }]}
                                        >
                                            THRAIL
                                        </CustomText>
                                        <CustomText
                                            variant="caption"
                                            style={[styles.splashSubtitle, { color: subtextColor }]}
                                        >
                                            FIND THRILL IN YOUR TRAIL
                                        </CustomText>
                                    </View>
                                )}
                            </Pressable>

                            {!isTransitionComplete && (
                                <View style={[styles.transitionTapHintBar, { bottom: insets.bottom + 20 }]}>
                                    <CustomText variant="caption" style={[styles.fullScreenBottomHint, { color: subtextColor }]}>
                                        Auto-launching... (tap screen to trigger)
                                    </CustomText>
                                </View>
                            )}
                        </Animated.View>
                    </View>
                )}

                {/* 3. Floating Interactive Testing HUD */}
                <View
                    pointerEvents="box-none"
                    style={[styles.transitionHudContainer, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}
                >
                    {/* Top HUD Group — Stacks Platform Switcher and Transition Styles neatly at the top */}
                    <View style={styles.transitionTopHudWrapper}>
                        <View style={styles.transitionTopHud}>
                            <Pressable
                                onPress={() => {
                                    setActiveTab('splash');
                                    setIsFullScreen(true);
                                }}
                                style={styles.transitionHudBackBtn}
                            >
                                <CustomIcon library="Ionicons" name="arrow-back" size={20} color={Colors.TEXT_PRIMARY} />
                            </Pressable>

                            {/* Platform Mode Selector */}
                            <View style={styles.platformPillsGroup}>
                                <Pressable
                                    onPress={() => {
                                        setPlatformMode('mobile');
                                        handleReplayTransition(undefined, 'mobile');
                                    }}
                                    style={[
                                        styles.platformPill,
                                        platformMode === 'mobile' ? styles.platformPillActive : null,
                                    ]}
                                >
                                    <CustomText
                                        variant="caption"
                                        style={platformMode === 'mobile' ? styles.platformPillTextActive : styles.platformPillTextInactive}
                                    >
                                        📱 Mobile
                                    </CustomText>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        setPlatformMode('desktop');
                                        handleReplayTransition(undefined, 'desktop');
                                    }}
                                    style={[
                                        styles.platformPill,
                                        platformMode === 'desktop' ? styles.platformPillActive : null,
                                    ]}
                                >
                                    <CustomText
                                        variant="caption"
                                        style={platformMode === 'desktop' ? styles.platformPillTextActive : styles.platformPillTextInactive}
                                    >
                                        💻 Desktop Web
                                    </CustomText>
                                </Pressable>
                            </View>

                            {/* Palette Switcher */}
                            <Pressable
                                onPress={() => {
                                    setActiveVariant(activeVariant === 'primary' ? 'inverted' : 'primary');
                                    handleReplayTransition();
                                }}
                                style={styles.transitionPaletteBtn}
                            >
                                <CustomText variant="caption" style={styles.transitionPaletteText}>
                                    {activeVariant === 'primary' ? '🌿 Green' : '⚪ White'}
                                </CustomText>
                            </Pressable>
                        </View>

                        {/* Sub HUD: Mobile Transition Style Pills */}
                        {platformMode === 'mobile' && (
                            <View style={styles.transitionSubHudRow}>
                                <View style={styles.transitionStylePillsGroup}>
                                    {(
                                        [
                                            { key: 'sync-lift', label: 'Sync Lift' },
                                            { key: 'zoom-in', label: 'Zoom-In' },
                                            { key: 'zoom-out', label: 'Zoom-Out' },
                                            { key: 'sequenced-fade', label: 'Clean Fade' },
                                        ] as const
                                    ).map((item) => {
                                        const isPicked = transitionStyle === item.key;
                                        return (
                                            <Pressable
                                                key={item.key}
                                                onPress={() => {
                                                    setTransitionStyle(item.key);
                                                    handleReplayTransition(item.key);
                                                }}
                                                style={[
                                                    styles.transitionStylePill,
                                                    isPicked ? styles.transitionStylePillActive : null,
                                                ]}
                                            >
                                                <CustomText
                                                    variant="caption"
                                                    style={isPicked ? styles.transitionStyleTextActive : styles.transitionStyleTextInactive}
                                                >
                                                    {item.label}
                                                </CustomText>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Bottom HUD Bar */}
                    <View style={styles.transitionBottomHud}>
                        {/* Concept Selector Chips */}
                        <View style={styles.transitionConceptsRow}>
                            {(['idea2', 'idea4', 'idea5'] as IdeaKey[]).map((key) => {
                                const isPicked = activeIdea === key;
                                return (
                                    <Pressable
                                        key={key}
                                        onPress={() => {
                                            setActiveIdea(key);
                                            handleReplayTransition();
                                        }}
                                        style={[
                                            styles.transitionConceptPill,
                                            isPicked ? styles.transitionConceptPillActive : null,
                                        ]}
                                    >
                                        <CustomText
                                            variant="caption"
                                            style={isPicked ? styles.transitionConceptTextActive : styles.transitionConceptTextInactive}
                                        >
                                            {LOGO_CONCEPTS[key].name}
                                        </CustomText>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Explanatory Caption */}
                        <CustomText variant="caption" style={styles.transitionExplanationText}>
                            {platformMode === 'desktop'
                                ? '🖥️ Desktop Web (≥1024px): Splash unveils into 50/50 split — Mt. Tagapo hero left & auth form sliding right.'
                                : transitionStyle === 'sync-lift'
                                ? '⬆️ Sync Lift: Splash lifts & bottom card ascends in 100% mechanical lockstep (0ms delay).'
                                : transitionStyle === 'zoom-in'
                                ? '🚀 Zoom-In: Logo expands 1.75x & flies forward into the mountain landscape.'
                                : transitionStyle === 'zoom-out'
                                ? '🔍 Zoom-Out: Logo recedes into distance (0.72x) as hero & card appear.'
                                : '✨ Clean Fade: Logo clears on solid canvas first, zero double-exposure.'}
                        </CustomText>

                        {/* Large Replay Button */}
                        <CustomButton
                            title="↺ Replay Launch Flow"
                            variant="primary"
                            onPress={() => handleReplayTransition()}
                            style={styles.transitionReplayBtn}
                        />
                    </View>
                </View>
            </View>
        );
    }

    // =========================================================================
    // 3. DASHBOARD VIEW (LAUNCHER ICONS, APP HEADER, SIDE-BY-SIDE COMPARE)
    // =========================================================================
    return (
        <View style={[styles.rootContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={Colors.BACKGROUND}
            />

            {/* Top Toolbar */}
            <View style={styles.topToolbar}>
                <Pressable
                    onPress={onBackPress}
                    style={({ hovered }: { hovered?: boolean }) => [
                        styles.backButton,
                        hovered ? styles.buttonHovered : null,
                    ]}
                >
                    <CustomIcon
                        library="Ionicons"
                        name="arrow-back"
                        size={22}
                        color={Colors.TEXT_PRIMARY}
                    />
                </Pressable>
                <View style={styles.toolbarTitleGroup}>
                    <CustomText variant="h3" style={styles.toolbarTitle}>
                        Branding & Splash Sandbox
                    </CustomText>
                    <CustomText variant="caption" style={styles.toolbarSubtitle}>
                        Test Logo Ideas 2, 4, and 5 live on Android
                    </CustomText>
                </View>

                {/* Quick Launch Fullscreen Splash Button */}
                <Pressable
                    onPress={() => {
                        setActiveTab('splash');
                        setIsFullScreen(true);
                        handleReplaySplash();
                    }}
                    style={styles.launchFullscreenHeaderBtn}
                >
                    <CustomIcon library="Ionicons" name="expand" size={16} color={Colors.BACKGROUND} />
                    <CustomText variant="caption" style={styles.launchFullscreenHeaderText}>
                        Splash
                    </CustomText>
                </Pressable>
            </View>

            {/* Global Controls Section */}
            <View style={styles.controlsCard}>
                {/* Idea Selector */}
                <View style={styles.selectorRow}>
                    <CustomText variant="label" style={styles.selectorLabel}>
                        Concept:
                    </CustomText>
                    <View style={styles.chipsRow}>
                        {(['idea2', 'idea4', 'idea5'] as IdeaKey[]).map((ideaKey) => {
                            const isSelected = activeIdea === ideaKey;
                            return (
                                <Pressable
                                    key={ideaKey}
                                    onPress={() => setActiveIdea(ideaKey)}
                                    style={[
                                        styles.chipPill,
                                        isSelected ? styles.chipPillSelected : styles.chipPillUnselected,
                                    ]}
                                >
                                    <CustomText
                                        variant="caption"
                                        style={isSelected ? styles.chipTextSelected : styles.chipTextUnselected}
                                    >
                                        {LOGO_CONCEPTS[ideaKey].name}
                                    </CustomText>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Variant & Shape Toggles */}
                <View style={styles.dualToggleRow}>
                    <View style={styles.toggleGroup}>
                        <CustomText variant="label" style={styles.selectorLabel}>
                            Palette:
                        </CustomText>
                        <View style={styles.segmentedControl}>
                            <Pressable
                                onPress={() => setActiveVariant('primary')}
                                style={[
                                    styles.segmentItem,
                                    activeVariant === 'primary' ? styles.segmentItemSelected : null,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeVariant === 'primary' ? styles.segmentTextSelected : styles.segmentTextUnselected}
                                >
                                    Green #2E7D32
                                </CustomText>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveVariant('inverted')}
                                style={[
                                    styles.segmentItem,
                                    activeVariant === 'inverted' ? styles.segmentItemSelected : null,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeVariant === 'inverted' ? styles.segmentTextSelected : styles.segmentTextUnselected}
                                >
                                    Off-White
                                </CustomText>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.toggleGroup}>
                        <CustomText variant="label" style={styles.selectorLabel}>
                            Shape:
                        </CustomText>
                        <View style={styles.segmentedControl}>
                            <Pressable
                                onPress={() => setActiveShape('square')}
                                style={[
                                    styles.segmentItem,
                                    activeShape === 'square' ? styles.segmentItemSelected : null,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeShape === 'square' ? styles.segmentTextSelected : styles.segmentTextUnselected}
                                >
                                    Square
                                </CustomText>
                            </Pressable>
                            <Pressable
                                onPress={() => setActiveShape('circle')}
                                style={[
                                    styles.segmentItem,
                                    activeShape === 'circle' ? styles.segmentItemSelected : null,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={activeShape === 'circle' ? styles.segmentTextSelected : styles.segmentTextUnselected}
                                >
                                    Circle
                                </CustomText>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Concept Description Banner */}
                <View style={styles.conceptMetaBanner}>
                    <CustomIcon
                        library="FontAwesome5"
                        name="mountain"
                        size={18}
                        color={Colors.PRIMARY}
                    />
                    <View style={styles.conceptMetaContent}>
                        <CustomText variant="label" style={styles.conceptMetaTitle}>
                            {currentConcept.description}
                        </CustomText>
                        <CustomText variant="caption" style={styles.conceptMetaSub}>
                            {currentConcept.tagline}
                        </CustomText>
                    </View>
                </View>
            </View>

            {/* Mode Navigation Tabs */}
            <View style={styles.tabBar}>
                {(
                    [
                        { id: 'splash', label: '🚀 Splash', icon: 'flash' },
                        { id: 'transition', label: '🎬 Splash → Landing', icon: 'play' },
                        { id: 'launcher', label: '📱 Launcher', icon: 'apps' },
                        { id: 'header', label: '🧭 Header', icon: 'navigate' },
                        { id: 'compare', label: '⚖️ Compare', icon: 'git-compare' },
                    ] as const
                ).map((tab) => {
                    const isTabActive = activeTab === tab.id;
                    return (
                        <Pressable
                            key={tab.id}
                            onPress={() => {
                                setActiveTab(tab.id);
                                if (tab.id === 'splash') {
                                    setIsFullScreen(true);
                                    handleReplaySplash();
                                } else if (tab.id === 'transition') {
                                    handleReplayTransition();
                                }
                            }}
                            style={[
                                styles.tabItem,
                                isTabActive ? styles.tabItemActive : null,
                            ]}
                        >
                            <CustomText
                                variant="caption"
                                style={isTabActive ? styles.tabTextActive : styles.tabTextInactive}
                            >
                                {tab.label}
                            </CustomText>
                        </Pressable>
                    );
                })}
            </View>

            {/* Mode Content Views */}
            <ScrollView
                style={styles.scrollCanvas}
                contentContainerStyle={styles.scrollCanvasContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. LAUNCHER ADAPTIVE ICON SIMULATOR */}
                {activeTab === 'launcher' && (
                    <View style={styles.modeContainer}>
                        <View style={styles.safeZoneControlBar}>
                            <View style={styles.safeZoneTextGroup}>
                                <CustomText variant="label" style={styles.safeZoneTitle}>
                                    Android Adaptive Safe-Zone
                                </CustomText>
                                <CustomText variant="caption" style={styles.safeZoneNotice}>
                                    Inner circle represents the 66% safe mask area. Corners outside get clipped!
                                </CustomText>
                            </View>
                            <Pressable
                                onPress={() => setShowSafeZone(!showSafeZone)}
                                style={[
                                    styles.safeZoneToggle,
                                    showSafeZone ? styles.safeZoneToggleActive : null,
                                ]}
                            >
                                <CustomText
                                    variant="caption"
                                    style={showSafeZone ? styles.safeZoneToggleTextActive : styles.safeZoneToggleTextInactive}
                                >
                                    {showSafeZone ? 'Guide: VISIBLE' : 'Guide: HIDDEN'}
                                </CustomText>
                            </Pressable>
                        </View>

                        {/* Mask Comparison Grid */}
                        <View style={styles.launcherCardsRow}>
                            {/* Circle Mask */}
                            <View style={styles.launcherCard}>
                                <View style={[styles.iconWrapper, styles.circleMask]}>
                                    <CustomImage
                                        source={currentConcept[activeVariant].square}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                    {showSafeZone && <View style={styles.safeZoneCircleOverlay} />}
                                </View>
                                <CustomText variant="label" style={styles.maskLabel}>
                                    Pixel Circle
                                </CustomText>
                                <CustomText variant="caption" style={styles.maskSub}>
                                    48dp Launcher
                                </CustomText>
                            </View>

                            {/* Squircle Mask */}
                            <View style={styles.launcherCard}>
                                <View style={[styles.iconWrapper, styles.squircleMask]}>
                                    <CustomImage
                                        source={currentConcept[activeVariant].square}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                    {showSafeZone && <View style={styles.safeZoneCircleOverlay} />}
                                </View>
                                <CustomText variant="label" style={styles.maskLabel}>
                                    Samsung Squircle
                                </CustomText>
                                <CustomText variant="caption" style={styles.maskSub}>
                                    OneUI Theme
                                </CustomText>
                            </View>

                            {/* Rounded Rect Mask */}
                            <View style={styles.launcherCard}>
                                <View style={[styles.iconWrapper, styles.roundedRectMask]}>
                                    <CustomImage
                                        source={currentConcept[activeVariant].square}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                    {showSafeZone && <View style={styles.safeZoneCircleOverlay} />}
                                </View>
                                <CustomText variant="label" style={styles.maskLabel}>
                                    Standard Android
                                </CustomText>
                                <CustomText variant="caption" style={styles.maskSub}>
                                    Rounded Square
                                </CustomText>
                            </View>
                        </View>

                        {/* Simulated Android Home Dock */}
                        <View style={styles.homeDockContainer}>
                            <CustomText variant="caption" style={styles.dockTitle}>
                                Simulated Home Screen Dock
                            </CustomText>
                            <View style={styles.dockRow}>
                                <View style={styles.dockItem}>
                                    <View style={[styles.dockIcon, { backgroundColor: '#34A853' }]}>
                                        <CustomIcon library="Ionicons" name="call" size={24} color="#FFF" />
                                    </View>
                                    <CustomText variant="caption" style={styles.dockLabel}>
                                        Phone
                                    </CustomText>
                                </View>

                                <View style={styles.dockItem}>
                                    <View style={[styles.dockIcon, { backgroundColor: '#4285F4' }]}>
                                        <CustomIcon library="Ionicons" name="chatbubble" size={24} color="#FFF" />
                                    </View>
                                    <CustomText variant="caption" style={styles.dockLabel}>
                                        Messages
                                    </CustomText>
                                </View>

                                {/* Active Thrail App Icon */}
                                <View style={styles.dockItem}>
                                    <View style={[styles.dockIcon, styles.squircleMask, { backgroundColor: Colors.PRIMARY }]}>
                                        <CustomImage
                                            source={currentAsset}
                                            style={styles.fullImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <CustomText variant="caption" style={[styles.dockLabel, styles.activeAppLabel]}>
                                        Thrail
                                    </CustomText>
                                </View>

                                <View style={styles.dockItem}>
                                    <View style={[styles.dockIcon, { backgroundColor: '#EA4335' }]}>
                                        <CustomIcon library="Ionicons" name="camera" size={24} color="#FFF" />
                                    </View>
                                    <CustomText variant="caption" style={styles.dockLabel}>
                                        Camera
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* 2. APP TOP NAVBAR SIMULATOR */}
                {activeTab === 'header' && (
                    <View style={styles.modeContainer}>
                        <CustomText variant="caption" style={styles.sectionNotice}>
                            Evaluating logo proportions when placed inside Thrail top navigation bars.
                        </CustomText>

                        {/* Light Header Mockup */}
                        <View style={styles.headerMockupCard}>
                            <CustomText variant="caption" style={styles.headerMockupLabel}>
                                Standard Light Navigation Bar
                            </CustomText>
                            <View style={styles.simulatedNavBarLight}>
                                <View style={styles.navBarLeft}>
                                    <View style={styles.headerLogoWrapper}>
                                        <CustomImage
                                            source={currentConcept.primary.circle}
                                            style={styles.fullImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <CustomText variant="h3" style={styles.headerTitleLight}>
                                        Explore CALABARZON
                                    </CustomText>
                                </View>
                                <CustomIcon library="Ionicons" name="notifications-outline" size={22} color={Colors.TEXT_PRIMARY} />
                            </View>
                        </View>

                        {/* Dark Header Mockup */}
                        <View style={styles.headerMockupCard}>
                            <CustomText variant="caption" style={styles.headerMockupLabel}>
                                Dark Atmospheric Hero Bar
                            </CustomText>
                            <View style={styles.simulatedNavBarDark}>
                                <View style={styles.navBarLeft}>
                                    <View style={styles.headerLogoWrapper}>
                                        <CustomImage
                                            source={currentConcept.inverted.circle}
                                            style={styles.fullImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <CustomText variant="h3" style={styles.headerTitleDark}>
                                        Mt. Tagapo
                                    </CustomText>
                                </View>
                                <CustomIcon library="Ionicons" name="bookmark-outline" size={22} color={Colors.BACKGROUND} />
                            </View>
                        </View>
                    </View>
                )}

                {/* 3. SIDE-BY-SIDE COMPARISON */}
                {activeTab === 'compare' && (
                    <View style={styles.modeContainer}>
                        <CustomText variant="caption" style={styles.sectionNotice}>
                            Direct visual comparison of all 3 imported candidates simultaneously.
                        </CustomText>

                        {(['idea2', 'idea4', 'idea5'] as IdeaKey[]).map((key) => {
                            const concept = LOGO_CONCEPTS[key];
                            const isPicked = activeIdea === key;
                            return (
                                <View
                                    key={key}
                                    style={[
                                        styles.compareCard,
                                        isPicked ? styles.compareCardSelected : null,
                                    ]}
                                >
                                    <View style={styles.compareHeader}>
                                        <View>
                                            <CustomText variant="h3" style={styles.compareTitle}>
                                                {concept.name} — {concept.description}
                                            </CustomText>
                                            <CustomText variant="caption" style={styles.compareTagline}>
                                                {concept.tagline}
                                            </CustomText>
                                        </View>
                                        {isPicked && (
                                            <View style={styles.activeCheckBadge}>
                                                <CustomIcon library="Ionicons" name="checkmark-circle" size={18} color={Colors.PRIMARY} />
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.compareAssetsRow}>
                                        {/* Square */}
                                        <View style={styles.compareItem}>
                                            <View style={[styles.compareImageContainer, styles.squircleMask]}>
                                                <CustomImage
                                                    source={concept.primary.square}
                                                    style={styles.fullImage}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <CustomText variant="caption" style={styles.compareItemLabel}>
                                                Primary Square
                                            </CustomText>
                                        </View>

                                        {/* Circle */}
                                        <View style={styles.compareItem}>
                                            <View style={[styles.compareImageContainer, styles.circleMask]}>
                                                <CustomImage
                                                    source={concept.primary.circle}
                                                    style={styles.fullImage}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <CustomText variant="caption" style={styles.compareItemLabel}>
                                                Primary Circle
                                            </CustomText>
                                        </View>

                                        {/* Inverted Square */}
                                        <View style={styles.compareItem}>
                                            <View style={[styles.compareImageContainer, styles.squircleMask, { backgroundColor: Colors.TEXT_PRIMARY }]}>
                                                <CustomImage
                                                    source={concept.inverted.square}
                                                    style={styles.fullImage}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <CustomText variant="caption" style={styles.compareItemLabel}>
                                                Inverted Square
                                            </CustomText>
                                        </View>

                                        {/* Inverted Circle */}
                                        <View style={styles.compareItem}>
                                            <View style={[styles.compareImageContainer, styles.circleMask, { backgroundColor: Colors.TEXT_PRIMARY }]}>
                                                <CustomImage
                                                    source={concept.inverted.circle}
                                                    style={styles.fullImage}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <CustomText variant="caption" style={styles.compareItemLabel}>
                                                Inverted Circle
                                            </CustomText>
                                        </View>
                                    </View>

                                    <CustomButton
                                        title={isPicked ? 'Active in Sandbox' : `Select ${concept.name}`}
                                        variant={isPicked ? 'primary' : 'outline'}
                                        onPress={() => {
                                            setActiveIdea(key);
                                            setActiveTab('splash');
                                            setIsFullScreen(true);
                                            handleReplaySplash();
                                        }}
                                        style={styles.selectConceptButton}
                                    />
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    topToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        backgroundColor: Colors.BACKGROUND,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.GRAY_LIGHT,
        marginRight: 12,
    },
    buttonHovered: {
        opacity: 0.85,
    },
    toolbarTitleGroup: {
        flex: 1,
    },
    toolbarTitle: {
        color: Colors.TEXT_PRIMARY,
    },
    toolbarSubtitle: {
        color: Colors.GRAY,
        marginTop: 2,
    },
    launchFullscreenHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    launchFullscreenHeaderText: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
        fontSize: 11,
    },
    controlsCard: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 14,
        borderRadius: 16,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(1),
    },
    selectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    selectorLabel: {
        width: 68,
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
    },
    chipsRow: {
        flexDirection: 'row',
        flex: 1,
        gap: 8,
    },
    chipPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipPillSelected: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    chipPillUnselected: {
        backgroundColor: Colors.GRAY_LIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipTextSelected: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
    },
    chipTextUnselected: {
        color: Colors.TEXT_PRIMARY,
    },
    dualToggleRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    toggleGroup: {
        flex: 1,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 10,
        padding: 2,
        marginTop: 4,
    },
    segmentItem: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    segmentItemSelected: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(1),
    },
    segmentTextSelected: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 11,
    },
    segmentTextUnselected: {
        color: Colors.GRAY,
        fontSize: 11,
    },
    conceptMetaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 8,
    },
    conceptMetaContent: {
        flex: 1,
    },
    conceptMetaTitle: {
        color: Colors.PRIMARY,
        fontSize: 12,
    },
    conceptMetaSub: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 12,
        padding: 3,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    tabItemActive: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(1),
    },
    tabTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 11,
    },
    tabTextInactive: {
        color: Colors.GRAY,
        fontSize: 11,
    },
    scrollCanvas: {
        flex: 1,
    },
    scrollCanvasContent: {
        padding: 16,
        paddingBottom: 40,
    },
    modeContainer: {
        flex: 1,
    },

    // 1:1 Fullscreen Splash Styles
    fullScreenSplashRoot: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    fullScreenFloatingBtn: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        ...GlobalStyles.dropShadow(2),
    },
    fullScreenConceptPill: {
        position: 'absolute',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        zIndex: 40,
    },
    fullScreenConceptText: {
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    fullScreenBottomBar: {
        position: 'absolute',
        alignItems: 'center',
    },
    fullScreenBottomHint: {
        fontSize: 11,
        opacity: 0.8,
        letterSpacing: 0.5,
    },
    animatedSplashContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    splashTypographyGroup: {
        alignItems: 'center',
        marginTop: 20,
    },
    splashTitle: {
        letterSpacing: 5,
        fontSize: 32,
        fontWeight: 'bold',
    },
    splashSubtitle: {
        letterSpacing: 2.5,
        fontSize: 12,
        marginTop: 6,
        fontWeight: '600',
    },

    // Modal Drawer Styles
    modalOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 100,
    },
    modalCard: {
        width: '92%',
        maxWidth: 500,
        maxHeight: '80%',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        ...GlobalStyles.dropShadow(4),
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        paddingBottom: 12,
        marginBottom: 12,
    },
    modalHeaderTitleGroup: {
        flex: 1,
    },
    modalTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 18,
    },
    modalSubtitle: {
        color: Colors.GRAY,
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.GRAY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScrollBody: {
        maxHeight: 340,
    },
    modalSectionLabel: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
        marginTop: 12,
        marginBottom: 6,
    },
    modalPillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    modalChoicePill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
        borderWidth: 1,
    },
    modalChoicePillSelected: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    modalChoicePillUnselected: {
        backgroundColor: Colors.GRAY_LIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    modalChoiceTextSelected: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
        fontSize: 11,
    },
    modalChoiceTextUnselected: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 11,
    },
    modalConceptDescription: {
        color: Colors.PRIMARY,
        marginTop: 6,
        fontStyle: 'italic',
        fontSize: 11,
    },
    sloganToggleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 14,
        backgroundColor: Colors.GRAY_LIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    sloganToggleCardActive: {
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        borderColor: Colors.PRIMARY,
    },
    sloganToggleContent: {
        flex: 1,
    },
    sloganTitleText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
    },
    sloganSubText: {
        color: Colors.GRAY,
        marginTop: 2,
    },
    toolSwitchRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
        marginBottom: 10,
    },
    toolSwitchBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    toolSwitchText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 11,
    },
    modalDoneButton: {
        marginTop: 14,
    },

    // Launcher & Headers Styles
    safeZoneControlBar: {
        backgroundColor: Colors.WHITE,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    safeZoneTextGroup: {
        flex: 1,
        marginRight: 8,
    },
    safeZoneTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
    },
    safeZoneNotice: {
        color: Colors.GRAY,
        fontSize: 10,
        marginTop: 2,
    },
    safeZoneToggle: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    safeZoneToggleActive: {
        backgroundColor: Colors.PRIMARY,
    },
    safeZoneToggleTextActive: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
        fontSize: 10,
    },
    safeZoneToggleTextInactive: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 10,
    },
    launcherCardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    launcherCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    iconWrapper: {
        width: 76,
        height: 76,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        backgroundColor: Colors.PRIMARY,
        overflow: 'hidden',
    },
    circleMask: {
        borderRadius: 999,
    },
    squircleMask: {
        borderRadius: 20,
    },
    roundedRectMask: {
        borderRadius: 14,
    },
    safeZoneCircleOverlay: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: '#FFD600',
        borderStyle: 'dashed',
    },
    maskLabel: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 11,
    },
    maskSub: {
        color: Colors.GRAY,
        fontSize: 10,
        marginTop: 1,
    },
    homeDockContainer: {
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    dockTitle: {
        color: Colors.GRAY,
        fontSize: 11,
        marginBottom: 12,
        textAlign: 'center',
    },
    dockRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    dockItem: {
        alignItems: 'center',
        width: 60,
    },
    dockIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    dockLabel: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 10,
    },
    activeAppLabel: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    sectionNotice: {
        color: Colors.GRAY,
        marginBottom: 12,
        textAlign: 'center',
    },
    headerMockupCard: {
        marginBottom: 16,
    },
    headerMockupLabel: {
        color: Colors.GRAY,
        fontSize: 11,
        marginBottom: 6,
    },
    simulatedNavBarLight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(1),
    },
    simulatedNavBarDark: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.TEXT_PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        ...GlobalStyles.dropShadow(2),
    },
    navBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerLogoWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    headerTitleLight: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
    },
    headerTitleDark: {
        color: Colors.BACKGROUND,
        fontSize: 16,
    },
    compareCard: {
        backgroundColor: Colors.WHITE,
        padding: 14,
        borderRadius: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(1),
    },
    compareCardSelected: {
        borderColor: Colors.PRIMARY,
        borderWidth: 1.5,
    },
    compareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    compareTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
    },
    compareTagline: {
        color: Colors.GRAY,
        fontSize: 11,
        marginTop: 2,
    },
    activeCheckBadge: {
        marginLeft: 8,
    },
    compareAssetsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    compareItem: {
        alignItems: 'center',
    },
    compareImageContainer: {
        width: 58,
        height: 58,
        backgroundColor: Colors.PRIMARY,
        overflow: 'hidden',
        marginBottom: 4,
    },
    compareItemLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 9,
    },
    selectConceptButton: {
        marginTop: 4,
    },

    // Transition Simulator Styles
    transitionSimulatorContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        position: 'relative',
    },
    simulatedLandingRoot: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.BACKGROUND,
    },
    simulatedHeroWrapper: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#2E5D32',
    },
    simulatedHeroOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
    },
    simulatedCardSection: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        paddingHorizontal: 24,
        paddingTop: 24,
        alignItems: 'center',
        flex: 1,
        ...GlobalStyles.dropShadow(3),
    },
    simulatedContentConstrainer: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    simulatedWelcomeText: {
        color: Colors.PRIMARY,
        letterSpacing: 1,
        marginBottom: 6,
        fontWeight: '700',
        fontSize: 12,
    },
    simulatedTitleText: {
        textAlign: 'center',
        fontSize: 28,
        lineHeight: 34,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    simulatedSubtitleText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 12,
        fontSize: 13,
        lineHeight: 20,
    },
    simulatedButtonContainer: {
        width: '100%',
        gap: 10,
        marginBottom: 16,
    },
    simulatedFooterText: {
        textAlign: 'center',
        lineHeight: 18,
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    simulatedLinkText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    transitionSplashOverlay: {
        ...StyleSheet.absoluteFill,
        zIndex: 20,
    },
    transitionLogoFloatingLayer: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
    },
    transitionSplashCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transitionTapHintBar: {
        position: 'absolute',
        alignSelf: 'center',
    },
    transitionHudContainer: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'space-between',
        zIndex: 50,
    },
    transitionTopHudWrapper: {
        width: '100%',
        gap: 8,
    },
    transitionTopHud: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        gap: 8,
    },
    transitionHudBackBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        ...GlobalStyles.dropShadow(2),
    },
    transitionStylePillsGroup: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        padding: 3,
        borderRadius: 20,
    },
    transitionStylePill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    transitionStylePillActive: {
        backgroundColor: Colors.PRIMARY,
    },
    transitionStyleTextActive: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
        fontSize: 10,
    },
    transitionStyleTextInactive: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 10,
    },
    transitionPaletteBtn: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        ...GlobalStyles.dropShadow(2),
    },
    transitionPaletteText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 11,
    },
    transitionBottomHud: {
        marginHorizontal: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(4),
    },
    transitionConceptsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    transitionConceptPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    transitionConceptPillActive: {
        backgroundColor: Colors.PRIMARY,
    },
    transitionConceptTextActive: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
        fontSize: 11,
    },
    transitionConceptTextInactive: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 11,
    },
    transitionExplanationText: {
        color: Colors.GRAY,
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    transitionReplayBtn: {
        width: '100%',
    },
    platformPillsGroup: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        borderRadius: 20,
        padding: 3,
        gap: 4,
    },
    platformPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    platformPillActive: {
        backgroundColor: Colors.PRIMARY,
    },
    platformPillTextActive: {
        color: Colors.BACKGROUND,
        fontWeight: 'bold',
        fontSize: 11,
    },
    platformPillTextInactive: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 11,
    },
    transitionSubHudRow: {
        marginTop: 6,
        alignItems: 'center',
    },
    webDesktopRoot: {
        ...StyleSheet.absoluteFill,
        flexDirection: 'row',
        backgroundColor: Colors.BACKGROUND,
    },
    webLeftPanel: {
        flex: 1,
        height: '100%',
        position: 'relative',
        backgroundColor: '#2E5D32',
        overflow: 'hidden',
    },
    webLeftOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0, 0, 0, 0.38)',
    },
    webBrandingContainer: {
        position: 'absolute',
        bottom: 40,
        left: 36,
        right: 36,
    },
    webBrandingHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    webBrandingGlyphWrapper: {
        width: 44,
        height: 44,
    },
    webBrandingTitle: {
        color: Colors.WHITE,
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 2,
    },
    webBrandingSlogan: {
        color: '#A5D6A7',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    webBrandingSubtext: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 12,
        marginTop: 4,
    },
    webRightPanel: {
        flex: 1,
        height: '100%',
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    webFormCard: {
        width: '100%',
        maxWidth: 380,
    },
    webFormTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 6,
    },
    webFormSubtitle: {
        color: Colors.GRAY,
        fontSize: 13,
        marginBottom: 20,
    },
    webFieldGroup: {
        marginBottom: 14,
    },
    webFieldLabel: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    webMockInput: {
        height: 44,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderRadius: 10,
        backgroundColor: '#F9FAF9',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    webMockInputPlaceholder: {
        color: Colors.GRAY,
        fontSize: 13,
    },
    webFormBtn: {
        marginTop: 6,
        marginBottom: 8,
    },
    webDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        gap: 10,
    },
    webDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    webDividerText: {
        color: Colors.GRAY,
        fontSize: 11,
    },
    webFormFooter: {
        textAlign: 'center',
        color: Colors.GRAY,
        fontSize: 12,
        marginTop: 14,
    },
    webFormFooterLink: {
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    webSplashOverlay: {
        ...StyleSheet.absoluteFill,
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webSplashCenter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    webSplashLogoWrap: {
        marginBottom: 12,
    },
});

export default BrandingPreviewScreen;
