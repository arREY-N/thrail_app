/**
 * @file CustomTutorialModal.tsx
 * @description Global In-App Tutorial Overlay with true SVG transparent cutout spotlight,
 * glowing target highlight frame, and an adaptive speech-bubble tooltip card with directional
 * pointer arrow. Uses a fast-path outer wrapper so hidden instances consume zero CPU/memory.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    Platform,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import {
    TargetSpotlightType,
    TooltipPlacement,
    TutorialStep,
    TutorialTourConfig,
    TutorialTourId,
} from '@/src/components/Tutorial/interfaces/Tutorial.types';
import {
    getTutorialLayout,
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
    subscribeTutorialLayouts,
} from '@/src/components/Tutorial/utils/tutorialLayoutRegistry';
import {
    getDrawerItemLayout,
    requestDrawerMeasurements,
    setActiveDrawerTarget,
    subscribeDrawerItemLayouts,
} from '@/src/components/Tutorial/utils/webDrawerLayoutRegistry';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useWebDrawer } from '@/src/core/context/WebDrawerContext';

/**
 * Props for CustomTutorialModal.
 *
 * @param visible - Whether the tutorial modal overlay is currently visible
 * @param tourConfig - Active tutorial tour configuration
 * @param currentStep - Current step metadata
 * @param currentStepIndex - Zero-based index of the active step
 * @param totalSteps - Total number of steps in the active tour
 * @param useModal - Whether to wrap the overlay in a React Native Modal (defaults to true)
 * @param onNext - Callback to advance to the next step
 * @param onPrev - Callback to return to the previous step
 * @param onSkip - Callback to skip or close the tour
 */
export interface CustomTutorialModalProps {
    visible: boolean;
    tourConfig: TutorialTourConfig;
    currentStep: TutorialStep;
    currentStepIndex: number;
    totalSteps: number;
    useModal?: boolean;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
}

/**
 * Props for the TutorialHelpButton component placed in screen headers.
 *
 * @param onPress - Handler invoked when the user taps the '?' replay icon
 * @param hasGuide - Optional gate; if false, the button will not render
 * @param tourId - Optional tour identifier
 * @param style - Optional custom wrapper style
 */
export interface TutorialHelpButtonProps {
    onPress?: () => void;
    hasGuide?: boolean;
    tourId?: TutorialTourId;
    style?: StyleProp<ViewStyle>;
}

const TAB_NAMES = ['Home', 'Explore', 'Hike', 'Community', 'Profile'] as const;

const DRAWER_TARGET_TO_ID: Record<string, string> = {
    web_drawer_home: 'home',
    web_drawer_explore: 'explore',
    web_drawer_navigate: 'navigate',
    web_drawer_community: 'community',
    web_drawer_profile: 'profile',
    web_drawer_messages: 'messages',
    web_drawer_settings: 'settings',
    web_drawer_dashboard: 'dashboard',
    web_drawer_offers: 'business',
    web_drawer_trails: 'trail',
    web_drawer_personnel: 'personnel',
    web_drawer_application: 'application',
    web_drawer_business: 'business',
    web_drawer_mountain: 'mountain',
    web_drawer_user: 'user',
    web_drawer_recommendation: 'recommendation',
    web_drawer_0: 'home',
    web_drawer_1: 'explore',
    web_drawer_2: 'navigate',
    web_drawer_3: 'community',
    web_drawer_4: 'profile',
};

const DRAWER_FALLBACK_COORDS: Record<string, { y: number; height: number }> = {
    home: { y: 111, height: 42 },
    explore: { y: 157, height: 42 },
    navigate: { y: 203, height: 42 },
    community: { y: 249, height: 42 },
    profile: { y: 295, height: 42 },
    messages: { y: 341, height: 42 },
    settings: { y: 425, height: 42 },
    dashboard: { y: 467, height: 42 },
    application: { y: 509, height: 42 },
    business: { y: 551, height: 42 },
    trail: { y: 593, height: 42 },
    personnel: { y: 635, height: 42 },
    mountain: { y: 635, height: 42 },
    user: { y: 677, height: 42 },
    recommendation: { y: 719, height: 42 },
};

/**
 * TutorialHelpButton — Compact '?' icon button for CustomHeader to replay a screen's tutorial anytime.
 * Strictly renders null if no guide is placed for this screen or if onPress is omitted.
 */
export const TutorialHelpButton = ({
    onPress,
    hasGuide = true,
    style,
}: TutorialHelpButtonProps): React.JSX.Element | null => {
    const helpBtnRef = useRef<View>(null);

    const measureHelpBtnNow = useCallback(() => {
        helpBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('header_help', { x, y, width, height });
            }
        });
    }, []);

    const handleLayout = useCallback(() => {
        if (!isTutorialMeasurementActive()) return;
        measureHelpBtnNow();
    }, [measureHelpBtnNow]);

    useEffect(() => {
        if (!hasGuide || !onPress) return;
        return registerMeasureCallback('header_help', measureHelpBtnNow);
    }, [hasGuide, measureHelpBtnNow, onPress]);

    // Strictly hide the '?' icon button if no guide exists for this screen
    if (!hasGuide || !onPress) {
        return null;
    }

    return (
        <View
            ref={helpBtnRef}
            onLayout={handleLayout}
            collapsable={false}
            style={style}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Replay screen tutorial guide"
                style={styles.helpIconButton}
                {...(Platform.OS === 'web' ? { title: 'Replay Screen Guide' } : {})}
            >
                <CustomIcon
                    library="Feather"
                    name="help-circle"
                    size={24}
                    color={Colors.PRIMARY}
                />
            </TouchableOpacity>
        </View>
    );
};

interface TargetGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
    placement: TooltipPlacement;
}

/**
 * ActiveTutorialModalContent â€” Only mounted when `visible === true` so hidden tutorial modals
 * on active or backgrounded stack screens attach zero listeners and perform zero geometry work.
 */
const ActiveTutorialModalContent = ({
    visible,
    tourConfig,
    currentStep,
    currentStepIndex,
    totalSteps,
    useModal = true,
    onNext,
    onPrev,
    onSkip,
}: CustomTutorialModalProps): React.JSX.Element => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { toggleDrawer, isDrawerOpen, hasProvider } = useWebDrawer();

    const [measuredCardHeight, setMeasuredCardHeight] = useState<number>(235);
    const [registryVersion, setRegistryVersion] = useState<number>(0);
    const containerRef = useRef<View>(null);
    const [overlayOrigin, setOverlayOrigin] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });

    const measureOverlayOrigin = useCallback(() => {
        containerRef.current?.measureInWindow((ox, oy) => {
            if (typeof ox === 'number' && typeof oy === 'number') {
                setOverlayOrigin((prev) =>
                    Math.abs(prev.x - ox) > 1 || Math.abs(prev.y - oy) > 1
                        ? { x: ox, y: oy }
                        : prev
                );
            }
        });
    }, []);

    // Subscribe to live layout measurements ONLY while this modal is actively visible
    useEffect(() => {
        const unsubDrawer = subscribeDrawerItemLayouts(() => {
            setRegistryVersion((v) => v + 1);
        });
        const unsubTutorial = subscribeTutorialLayouts(() => {
            setRegistryVersion((v) => v + 1);
        });
        return () => {
            unsubDrawer();
            unsubTutorial();
        };
    }, []);

    // Resolve which element is being targeted for the cutout
    const targetSpotlightType: TargetSpotlightType = useMemo(() => {
        if (currentStep?.targetSpotlight) {
            return currentStep.targetSpotlight;
        }
        if (currentStep?.highlightHeaderHelp) {
            return 'header_help';
        }
        if (typeof currentStep?.highlightTabIndex === 'number') {
            const idx = Math.max(0, Math.min(4, currentStep.highlightTabIndex));
            return `tab_${idx}` as TargetSpotlightType;
        }
        return 'content_center';
    }, [currentStep]);

    // Request on-demand measurement and auto-scroll for the active spotlight target
    useEffect(() => {
        measureOverlayOrigin();
        if (targetSpotlightType.startsWith('web_drawer_')) {
            const drawerItemId = DRAWER_TARGET_TO_ID[targetSpotlightType] || null;
            setActiveDrawerTarget(drawerItemId);
            requestDrawerMeasurements();
            return;
        }
        setActiveDrawerTarget(null);
        requestTargetMeasurement(targetSpotlightType);
    }, [targetSpotlightType, isDrawerOpen, measureOverlayOrigin]);

    // Reset drawer target on unmount
    useEffect(() => {
        return () => {
            setActiveDrawerTarget(null);
        };
    }, []);

    // Automatically synchronize the Web navigation drawer when moving into/out of drawer steps
    useEffect(() => {
        if (!hasProvider || !toggleDrawer) return;

        const isDrawerStep = targetSpotlightType.startsWith('web_drawer_');

        if (isDrawerStep && !isDrawerOpen) {
            toggleDrawer();
        } else if (!isDrawerStep && isDrawerOpen) {
            toggleDrawer();
        }
    }, [hasProvider, toggleDrawer, targetSpotlightType, isDrawerOpen]);

    const handleSkip = (): void => {
        setActiveDrawerTarget(null);
        if (hasProvider && isDrawerOpen && toggleDrawer) {
            toggleDrawer();
        }
        onSkip();
    };

    // Calculate pixel coordinates for the transparent spotlight cutout
    const targetGeom: TargetGeometry = useMemo(() => {
        void registryVersion;

        const contentW = Math.min(width - 32, Layout.MAX_WIDTH);
        const contentX = (width - contentW) / 2;

        // 0. Live component layout measured via measureInWindow()
        const liveLayout = getTutorialLayout(targetSpotlightType);
        if (liveLayout && liveLayout.width > 0 && liveLayout.height > 0) {
            const isSmallControl =
                targetSpotlightType === 'header_help' ||
                targetSpotlightType === 'web_nav_menu' ||
                targetSpotlightType === 'admin_offer_add_btn' ||
                targetSpotlightType === 'fab_messages';
            const isTightCard = targetSpotlightType.startsWith('my_booking_');
            const pad = isSmallControl ? 4 : isTightCard ? 0 : 2;

            const rawX = liveLayout.x - overlayOrigin.x - pad;
            const rawY = liveLayout.y - overlayOrigin.y - pad;
            const rawW = liveLayout.width + pad * 2;
            const rawH = liveLayout.height + pad * 2;

            const minVisibleY = Math.max(4, insets.top);
            const maxVisibleBottom = height - Math.max(4, insets.bottom);

            const finalX = Math.max(4, rawX);
            const finalWidth = Math.min(rawW, width - finalX - 4);
            const finalY = Math.max(minVisibleY, rawY);
            const clippedBottom = Math.min(rawY + rawH, maxVisibleBottom);
            const finalHeight = Math.max(28, clippedBottom - finalY);

            const spaceAbove = finalY - (insets.top + 12);
            const spaceBelow = (height - insets.bottom - 12) - (finalY + finalHeight);

            const isExplicitBottomTarget =
                targetSpotlightType.startsWith('tab_') ||
                targetSpotlightType === 'fab_messages' ||
                targetSpotlightType === 'booking_footer' ||
                targetSpotlightType === 'booking_offers_footer' ||
                targetSpotlightType === 'booking_status_primary' ||
                targetSpotlightType === 'legal_scroll_bottom';

            const placement: 'top' | 'bottom' =
                isExplicitBottomTarget || spaceAbove > spaceBelow ? 'bottom' : 'top';

            const isButton =
                targetSpotlightType === 'booking_footer' ||
                targetSpotlightType === 'booking_offers_footer' ||
                targetSpotlightType === 'booking_status_primary' ||
                targetSpotlightType === 'legal_scroll_bottom' ||
                targetSpotlightType === 'emergency_save_btn' ||
                targetSpotlightType.startsWith('admin_action_');

            const isCircleControl =
                targetSpotlightType === 'header_help' ||
                targetSpotlightType === 'fab_messages';

            const rx =
                isCircleControl
                    ? Math.min(finalWidth, finalHeight) / 2
                    : isSmallControl
                        ? 12
                        : targetSpotlightType.startsWith('tab_')
                            ? 20
                            : isButton || isTightCard
                                ? 16
                                : 20;

            return {
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight,
                rx,
                placement,
            };
        }

        // 1. Mobile bottom tabs: tab_0 to tab_4
        if (targetSpotlightType.startsWith('tab_')) {
            const tabIdx = parseInt(targetSpotlightType.replace('tab_', ''), 10);
            const barWidth = Math.min(width - 40, 400);
            const barStartX = (width - barWidth) / 2 + 8;
            const innerWidth = barWidth - 16;
            const tabW = innerWidth / 5;
            const pillW = Math.min(tabW - 4, 68);
            const pillH = 52;
            const x = barStartX + tabIdx * tabW + (tabW - pillW) / 2;
            const y = height - 24 - 58;
            return {
                x,
                y,
                width: pillW,
                height: pillH,
                rx: 20,
                placement: 'bottom',
            };
        }

        // 2. Web navigation menu hamburger trigger
        if (targetSpotlightType === 'web_nav_menu') {
            return {
                x: 16,
                y: insets.top + 12,
                width: 40,
                height: 40,
                rx: 12,
                placement: 'top',
            };
        }

        // 3. Web sidebar drawer items
        if (targetSpotlightType.startsWith('web_drawer_')) {
            const itemId = DRAWER_TARGET_TO_ID[targetSpotlightType] || 'home';
            const measured = getDrawerItemLayout(itemId);
            const fallback = DRAWER_FALLBACK_COORDS[itemId] || { y: 111, height: 42 };

            const itemY = (measured ? measured.y : fallback.y) - overlayOrigin.y;
            const itemH = measured ? measured.height : fallback.height;
            const drawerW = Math.min(width * 0.8, 280);
            const isWideWeb = width >= 600;
            const drawerSpaceAbove = itemY - (insets.top + 12);
            const drawerSpaceBelow = (height - insets.bottom - 12) - (itemY + itemH);
            return {
                x: 12,
                y: itemY,
                width: drawerW - 24,
                height: itemH,
                rx: 10,
                placement: isWideWeb
                    ? 'right'
                    : drawerSpaceAbove > drawerSpaceBelow
                        ? 'bottom'
                        : 'top',
            };
        }

        // 4. Header Replay Help '?' button
        if (targetSpotlightType === 'header_help') {
            const iconSize = 36;
            return {
                x: width - 50,
                y: insets.top + 12,
                width: iconSize,
                height: iconSize,
                rx: 18,
                placement: 'top',
            };
        }

        // 5. Floating Action Button (FAB) Messages on mobile
        if (targetSpotlightType === 'fab_messages') {
            const fabSize = 60;
            const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 16);
            const navBarHeight = 70 + bottomPadding;
            const fabY = height - navBarHeight - 24 - fabSize;
            return {
                x: width - 16 - fabSize,
                y: fabY,
                width: fabSize,
                height: fabSize,
                rx: fabSize / 2,
                placement: 'bottom',
            };
        }

        if (targetSpotlightType.startsWith('admin_action_')) {
            const actionIdx = parseInt(targetSpotlightType.replace('admin_action_', ''), 10);
            const totalRowW = Math.min(width - 32, 600);
            const startX = (width - totalRowW) / 2;
            const btnW = (totalRowW - 16) / 3;
            const x = startX + actionIdx * (btnW + 8);
            const y = height - insets.bottom - 56;
            return {
                x,
                y,
                width: btnW,
                height: 44,
                rx: 12,
                placement: 'bottom',
            };
        }

        if (targetSpotlightType === 'booking_calendar' || targetSpotlightType === 'booking_offers_calendar') {
            const calendarY = insets.top + (width < 600 ? 155 : 145);
            return {
                x: contentX,
                y: calendarY,
                width: contentW,
                height: 140,
                rx: 24,
                placement: 'top',
            };
        }

        if (targetSpotlightType === 'booking_offers' || targetSpotlightType === 'booking_offers_card') {
            const offersY = insets.top + (width < 600 ? 320 : 310);
            return {
                x: contentX,
                y: offersY,
                width: contentW,
                height: 200,
                rx: 24,
                placement: 'center',
            };
        }

        if (targetSpotlightType === 'booking_footer' || targetSpotlightType === 'booking_offers_footer') {
            const footerH = 58;
            const footerY = height - insets.bottom - footerH - 14;
            return {
                x: contentX,
                y: footerY,
                width: contentW,
                height: footerH,
                rx: 16,
                placement: 'bottom',
            };
        }

        if (targetSpotlightType === 'booking_details_contact') {
            return {
                x: contentX,
                y: insets.top + (width < 600 ? 155 : 145),
                width: contentW,
                height: 180,
                rx: 24,
                placement: 'top',
            };
        }

        if (targetSpotlightType === 'booking_details_docs') {
            return {
                x: contentX,
                y: insets.top + (width < 600 ? 350 : 340),
                width: contentW,
                height: 200,
                rx: 24,
                placement: 'center',
            };
        }

        if (targetSpotlightType === 'booking_details_terms') {
            const termsH = 140;
            return {
                x: contentX,
                y: height - insets.bottom - termsH - 80,
                width: contentW,
                height: termsH,
                rx: 20,
                placement: 'bottom',
            };
        }

        if (targetSpotlightType === 'legal_tabs') {
            return {
                x: contentX,
                y: insets.top + 80,
                width: contentW,
                height: 48,
                rx: 16,
                placement: 'top',
            };
        }

        if (targetSpotlightType === 'legal_scroll_bottom') {
            const btnH = 52;
            return {
                x: contentX,
                y: height - insets.bottom - btnH - 24,
                width: contentW,
                height: btnH,
                rx: 16,
                placement: 'bottom',
            };
        }

        if (targetSpotlightType === 'booking_details_waiver') {
            const waiverH = 120;
            return {
                x: contentX,
                y: height - insets.bottom - waiverH - 80,
                width: contentW,
                height: waiverH,
                rx: 20,
                placement: 'bottom',
            };
        }

        if (targetSpotlightType === 'booking_status_primary') {
            const btnH = 52;
            return {
                x: contentX,
                y: height - insets.bottom - btnH - 24,
                width: contentW,
                height: btnH,
                rx: 16,
                placement: 'bottom',
            };
        }

        if (
            targetSpotlightType === 'booking_status_card' ||
            targetSpotlightType === 'booking_status_timeline'
        ) {
            return {
                x: contentX,
                y: insets.top + (width < 600 ? 155 : 145),
                width: contentW,
                height: 180,
                rx: 24,
                placement: 'top',
            };
        }

        if (targetSpotlightType === 'booking_status_summary') {
            return {
                x: contentX,
                y: insets.top + (width < 600 ? 360 : 340),
                width: contentW,
                height: 220,
                rx: 24,
                placement: 'top',
            };
        }

        if (targetSpotlightType === 'content_top') {
            return {
                x: contentX,
                y: insets.top + 60,
                width: contentW,
                height: 120,
                rx: 20,
                placement: 'top',
            };
        }

        if (targetSpotlightType === 'content_bottom') {
            return {
                x: contentX,
                y: height - insets.bottom - 160,
                width: contentW,
                height: 80,
                rx: 16,
                placement: 'bottom',
            };
        }

        return {
            x: contentX,
            y: height * 0.3,
            width: contentW,
            height: 150,
            rx: 20,
            placement: 'center',
        };
    }, [targetSpotlightType, width, height, insets, registryVersion, overlayOrigin]);

    // Universal vector path with evenodd fill rule
    const cutoutPath = useMemo(() => {
        const { x, y, width: w, height: h, rx: rawRx } = targetGeom;
        const rx = Math.max(0, Math.min(rawRx, w / 2, h / 2));
        return [
            `M 0 0`,
            `H ${width}`,
            `V ${height}`,
            `H 0`,
            `Z`,
            `M ${x + rx} ${y}`,
            `H ${x + w - rx}`,
            `A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx}`,
            `V ${y + h - rx}`,
            `A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h}`,
            `H ${x + rx}`,
            `A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx}`,
            `V ${y + rx}`,
            `A ${rx} ${rx} 0 0 1 ${x + rx} ${y}`,
            `Z`,
        ].join(' ');
    }, [targetGeom, width, height]);

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === totalSteps - 1;

    const minSafeTop = insets.top + 12;
    const maxSafeBottom = height - insets.bottom - 12;
    const spaceAbove = targetGeom.y - minSafeTop;
    const spaceBelow = maxSafeBottom - (targetGeom.y + targetGeom.height);
    const spaceRight = (width - 16) - (targetGeom.x + targetGeom.width);

    const targetCenterX = targetGeom.x + targetGeom.width / 2;
    const targetCenterY = targetGeom.y + targetGeom.height / 2;

    let cardMaxWidth = Math.min(width - 32, 370);
    let cardLeft = Math.max(
        16,
        Math.min(width - cardMaxWidth - 16, targetCenterX - cardMaxWidth / 2)
    );
    let cardTop = minSafeTop;
    let arrowDirection: 'up' | 'down' | 'left' | 'none' = 'up';

    if (targetGeom.placement === 'right' && spaceRight >= 250) {
        arrowDirection = 'left';
        cardMaxWidth = Math.min(360, spaceRight - 16);
        cardLeft = targetGeom.x + targetGeom.width + 14;
        cardTop = Math.max(
            minSafeTop,
            Math.min(
                maxSafeBottom - measuredCardHeight,
                targetCenterY - measuredCardHeight / 2
            )
        );
    } else {
        const neededSpace = measuredCardHeight + 14;
        const preferAbove =
            (targetGeom.placement === 'bottom' && spaceAbove >= neededSpace) ||
            (spaceBelow < neededSpace && spaceAbove > spaceBelow);

        if (preferAbove) {
            cardTop = targetGeom.y - measuredCardHeight - 14;
        } else {
            cardTop = targetGeom.y + targetGeom.height + 14;
        }

        const maxCardTop = Math.max(minSafeTop, maxSafeBottom - measuredCardHeight);
        cardTop = Math.max(minSafeTop, Math.min(maxCardTop, cardTop));

        const overlapsSpotlight =
            cardTop < targetGeom.y + targetGeom.height &&
            cardTop + measuredCardHeight > targetGeom.y;

        if (overlapsSpotlight) {
            if (spaceBelow >= spaceAbove) {
                cardTop = Math.min(maxCardTop, targetGeom.y + targetGeom.height + 12);
            } else {
                cardTop = Math.max(minSafeTop, targetGeom.y - measuredCardHeight - 12);
            }
        }

        const cardCenterY = cardTop + measuredCardHeight / 2;
        if (cardCenterY >= targetCenterY) {
            arrowDirection = 'up';
        } else {
            arrowDirection = 'down';
        }
    }

    const arrowX = Math.max(18, Math.min(cardMaxWidth - 30, targetCenterX - cardLeft - 8));
    const arrowY = Math.max(16, Math.min(measuredCardHeight - 24, targetCenterY - cardTop - 8));

    const categoryLabel =
        currentStep.category ||
        (targetSpotlightType.startsWith('web_drawer_')
            ? 'Sidebar Navigation'
            : typeof currentStep.highlightTabIndex === 'number'
                ? `${TAB_NAMES[currentStep.highlightTabIndex]} Tab`
                : currentStep.highlightHeaderHelp
                    ? 'Replay Guide'
                    : `Step ${currentStepIndex + 1} of ${totalSteps}`);

    const overlayContent = (
        <View
            ref={containerRef}
            style={styles.fullscreenContainer}
            onLayout={measureOverlayOrigin}
        >
            {/* 1. Fullscreen SVG: Dimmed Backdrop + Spotlight Frame */}
            <Svg
                width={width}
                height={height}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            >
                <Path
                    d={cutoutPath}
                    fill="rgba(0, 0, 0, 0.58)"
                    fillRule="evenodd"
                />
                <Rect
                    x={targetGeom.x - 1}
                    y={targetGeom.y - 1}
                    width={targetGeom.width + 2}
                    height={targetGeom.height + 2}
                    rx={targetGeom.rx}
                    ry={targetGeom.rx}
                    fill="none"
                    stroke={Colors.PRIMARY}
                    strokeWidth={2.5}
                />
            </Svg>

            {/* 2. Interactive Backdrop: Tapping outside the tooltip advances to the next step */}
            <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={onNext}
                accessibilityRole="button"
                accessibilityLabel="Next tutorial step"
            />

            {/* 3. Floating Speech-Bubble Tooltip */}
            <View
                style={[
                    styles.tooltipWrapper,
                    {
                        left: cardLeft,
                        top: cardTop,
                        width: cardMaxWidth,
                    },
                ]}
            >
                {arrowDirection === 'left' && (
                    <View style={[styles.arrowContainerLeft, { top: arrowY }]}>
                        <Svg width={9} height={16} viewBox="0 0 9 16">
                            <Polygon points="9,0 0,8 9,16" fill={Colors.WHITE} />
                        </Svg>
                    </View>
                )}

                {arrowDirection === 'up' && (
                    <View style={[styles.arrowContainerUp, { left: arrowX }]}>
                        <Svg width={16} height={9} viewBox="0 0 16 9">
                            <Polygon points="0,9 8,0 16,9" fill={Colors.WHITE} />
                        </Svg>
                    </View>
                )}

                <View
                    style={styles.bubbleCard}
                    onLayout={(e) => {
                        const layoutH = e.nativeEvent.layout.height;
                        if (layoutH > 0 && Math.abs(layoutH - measuredCardHeight) > 6) {
                            setMeasuredCardHeight(layoutH);
                        }
                    }}
                >
                    <View style={styles.bubbleHeaderRow}>
                        <View style={styles.categoryPill}>
                            <CustomText variant="caption" style={styles.categoryText}>
                                {categoryLabel}
                            </CustomText>
                        </View>

                        <TouchableOpacity
                            onPress={handleSkip}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.skipButton}
                            activeOpacity={0.7}
                        >
                            <CustomText variant="caption" style={styles.skipButtonText}>
                                {isLastStep ? 'Close' : 'Skip'}
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    <CustomText variant="h3" style={styles.tooltipTitle}>
                        {currentStep.title}
                    </CustomText>

                    <CustomText variant="body" style={styles.tooltipDescription}>
                        {currentStep.description}
                    </CustomText>

                    {Boolean(currentStep.actionTip) && (
                        <View style={styles.tipRow}>
                            <CustomIcon
                                library="Feather"
                                name="corner-down-right"
                                size={13}
                                color={Colors.PRIMARY}
                            />
                            <CustomText variant="caption" style={styles.tipText}>
                                {currentStep.actionTip}
                            </CustomText>
                        </View>
                    )}

                    <View style={styles.bubbleFooterRow}>
                        {!isFirstStep ? (
                            <TouchableOpacity
                                onPress={onPrev}
                                activeOpacity={0.7}
                                style={styles.backButton}
                            >
                                <CustomText variant="caption" style={styles.backButtonText}>
                                    Back
                                </CustomText>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.emptySpacer} />
                        )}

                        <View style={styles.dotsRow}>
                            {(() => {
                                const stepCount = tourConfig.steps.length;
                                if (stepCount <= 7) {
                                    return tourConfig.steps.map((_, idx) => {
                                        const isActive = idx === currentStepIndex;
                                        return (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.dot,
                                                    isActive ? styles.dotActive : styles.dotInactive,
                                                ]}
                                            />
                                        );
                                    });
                                }

                                // Adaptive sliding window capped at 7 dots
                                const WINDOW_SIZE = 7;
                                let windowStart = Math.max(0, currentStepIndex - 3);
                                let windowEnd = windowStart + WINDOW_SIZE - 1;
                                if (windowEnd >= stepCount) {
                                    windowEnd = stepCount - 1;
                                    windowStart = Math.max(0, windowEnd - WINDOW_SIZE + 1);
                                }

                                const visibleDots: React.JSX.Element[] = [];
                                for (let i = windowStart; i <= windowEnd; i++) {
                                    const isActive = i === currentStepIndex;
                                    const isLeftEdge = i === windowStart && windowStart > 0;
                                    const isRightEdge = i === windowEnd && windowEnd < stepCount - 1;
                                    const isEdge = isLeftEdge || isRightEdge;

                                    visibleDots.push(
                                        <View
                                            key={i}
                                            style={[
                                                styles.dot,
                                                isActive
                                                    ? styles.dotActive
                                                    : isEdge
                                                        ? styles.dotEdge
                                                        : styles.dotInactive,
                                            ]}
                                        />
                                    );
                                }
                                return visibleDots;
                            })()}
                        </View>

                        <TouchableOpacity
                            onPress={onNext}
                            activeOpacity={0.8}
                            style={styles.nextButton}
                        >
                            <CustomText variant="caption" style={styles.nextButtonText}>
                                {isLastStep ? 'Got It!' : 'Next'}
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>

                {arrowDirection === 'down' && (
                    <View style={[styles.arrowContainerDown, { left: arrowX }]}>
                        <Svg width={16} height={9} viewBox="0 0 16 9">
                            <Polygon points="0,0 8,9 16,0" fill={Colors.WHITE} />
                        </Svg>
                    </View>
                )}
            </View>
        </View>
    );

    if (!useModal) {
        return (
            <View style={styles.nonModalContainer}>
                {overlayContent}
            </View>
        );
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            statusBarTranslucent={true}
            animationType="fade"
            onRequestClose={handleSkip}
        >
            {overlayContent}
        </Modal>
    );
};

/**
 * CustomTutorialModal â€” Fast-path outer gate that returns `null` immediately when hidden,
 * avoiding any hook subscriptions, dimension listeners, or SVG geometry calculations.
 */
const CustomTutorialModal = (
    props: CustomTutorialModalProps
): React.JSX.Element | null => {
    if (!props.visible || !props.currentStep) {
        return null;
    }

    return <ActiveTutorialModalContent {...props} />;
};

const styles = StyleSheet.create({
    nonModalContainer: {
        ...StyleSheet.absoluteFill,
        zIndex: 9999,
    },
    fullscreenContainer: {
        ...StyleSheet.absoluteFill,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    helpIconButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipWrapper: {
        position: 'absolute',
        zIndex: 100,
    },
    arrowContainerUp: {
        position: 'absolute',
        top: -8,
        zIndex: 102,
    },
    arrowContainerDown: {
        position: 'absolute',
        bottom: -8,
        zIndex: 102,
    },
    arrowContainerLeft: {
        position: 'absolute',
        left: -8,
        zIndex: 102,
    },
    bubbleCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(5),
    },
    bubbleHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryPill: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    categoryText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 12,
    },
    skipButton: {
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    skipButtonText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    tooltipTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    tooltipDescription: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 8,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 12,
    },
    tipText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
        flex: 1,
    },
    bubbleFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
    },
    backButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    backButtonText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
        fontSize: 12,
    },
    emptySpacer: {
        width: 44,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dot: {
        height: 6,
        borderRadius: 999,
    },
    dotActive: {
        width: 14,
        backgroundColor: Colors.PRIMARY,
    },
    dotInactive: {
        width: 6,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    dotEdge: {
        width: 4,
        height: 4,
        backgroundColor: Colors.GRAY_LIGHT,
        opacity: 0.5,
    },
    nextButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
    },
    nextButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default CustomTutorialModal;
