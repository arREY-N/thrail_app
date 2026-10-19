/**
 * @file LegalTermsModal.tsx
 * @description In-place modal bottom-sheet for viewing Terms of Service, Privacy Policy,
 * and Booking & Organizer Policies without navigating away from the active form.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { CustomToast } from '@/src/components/Toast/Toast';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { BOOKING_TERMS_TEXT, PRIVACY_TEXT as PRIVACY_POLICY_TEXT, TERMS_TEXT as TERMS_OF_SERVICE_TEXT } from '@/src/constants/legal';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type LegalTabType = 'terms' | 'privacy' | 'booking';

export interface LegalTermsModalProps {
    visible: boolean;
    onClose: () => void;
    initialTab?: LegalTabType;
    /** If true, user must scroll all 3 policies to the bottom to acknowledge. Default: true */
    requireReadToAgree?: boolean;
    /** True if user has already acknowledged all policies (shows 'Done' button on re-entry) */
    isAlreadyAcknowledged?: boolean;
    /** Callback fired when modal is dismissed via close button or backdrop before acknowledging */
    onDismissWithStatus?: (status: { readCount: number; hasReadAll: boolean }) => void;
    /** Callback fired when user successfully completes and acknowledges all legal terms */
    onAcknowledgeAll?: () => void;
}

interface TabConfig {
    key: LegalTabType;
    icon: 'file-text' | 'shield' | 'calendar';
    label: string;
    isRead: boolean;
}

/**
 * LegalTermsModal — Responsive modal bottom-sheet for reviewing Terms, Privacy,
 * and Booking policies with per-tab scroll tracking and adaptive tab presentation.
 */
const LegalTermsModal = ({
    visible,
    onClose,
    initialTab = 'terms',
    requireReadToAgree = true,
    isAlreadyAcknowledged = false,
    onDismissWithStatus,
    onAcknowledgeAll,
}: LegalTermsModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
    const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
    const [animValue] = useState(() => new Animated.Value(visible ? 1 : 0));

    // Per-tab scroll completion tracking
    const [hasReadTerms, setHasReadTerms] = useState<boolean>(!requireReadToAgree || isAlreadyAcknowledged);
    const [hasReadPrivacy, setHasReadPrivacy] = useState<boolean>(!requireReadToAgree || isAlreadyAcknowledged);
    const [hasReadBooking, setHasReadBooking] = useState<boolean>(!requireReadToAgree || isAlreadyAcknowledged);

    // Inline state derivation matching systematic-debugging protocol for prop changes
    const [prevVisible, setPrevVisible] = useState<boolean>(visible);
    const [prevInitialTab, setPrevInitialTab] = useState<LegalTabType>(initialTab);
    const [prevIsAlreadyAcknowledged, setPrevIsAlreadyAcknowledged] = useState<boolean>(isAlreadyAcknowledged);

    if (visible !== prevVisible || initialTab !== prevInitialTab || isAlreadyAcknowledged !== prevIsAlreadyAcknowledged) {
        setPrevVisible(visible);
        setPrevInitialTab(initialTab);
        setPrevIsAlreadyAcknowledged(isAlreadyAcknowledged);
        if (visible) {
            setRenderModal(true);
            setActiveTab(initialTab);
            setIsAtBottom(false);
            if (isAlreadyAcknowledged) {
                setHasReadTerms(true);
                setHasReadPrivacy(true);
                setHasReadBooking(true);
            }
        }
    }

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [hasAttemptedAcknowledge, setHasAttemptedAcknowledge] = useState<boolean>(false);

    const hasReadAll = hasReadTerms && hasReadPrivacy && hasReadBooking;
    const canAcknowledge = !requireReadToAgree || hasReadAll;
    const readCount = [hasReadTerms, hasReadPrivacy, hasReadBooking].filter(Boolean).length;

    useEffect(() => {
        if (visible) {
            Animated.timing(animValue, {
                toValue: 1,
                duration: 250,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else if (renderModal) {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => {
                setRenderModal(false);
            });
        }
    }, [visible, animValue, renderModal]);

    const handleDismiss = useCallback(() => {
        if (!isAlreadyAcknowledged && onDismissWithStatus) {
            onDismissWithStatus({ readCount, hasReadAll });
        }
        onClose();
    }, [isAlreadyAcknowledged, onDismissWithStatus, readCount, hasReadAll, onClose]);

    // Physical Escape key dismissal on Web
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleDismiss();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, handleDismiss]);

    // Toast offset calculation: guarantee clean 12px floating headroom above CTA button
    const footerPadding = isWideScreen ? 24 : Math.max(insets.bottom + 16, 20);
    const toastBottomOffset = footerPadding + 52 + 12;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const reachedBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        if (reachedBottom !== isAtBottom) {
            setIsAtBottom(reachedBottom);
        }
        if (reachedBottom) {
            if (activeTab === 'terms' && !hasReadTerms) setHasReadTerms(true);
            if (activeTab === 'privacy' && !hasReadPrivacy) setHasReadPrivacy(true);
            if (activeTab === 'booking' && !hasReadBooking) setHasReadBooking(true);
        }
    };

    const handleTabChange = (tab: LegalTabType) => {
        setActiveTab(tab);
        setIsAtBottom(false);
        setHasAttemptedAcknowledge(false);
        setToastMessage(null);
    };

    const handleAcknowledgePress = () => {
        if (canAcknowledge) {
            if (onAcknowledgeAll) onAcknowledgeAll();
            onClose();
        } else {
            setHasAttemptedAcknowledge(true);
            setToastMessage(`Please scroll to the bottom of all 3 policies to acknowledge (${readCount}/3 read).`);
        }
    };

    const getTabDisplayName = (tab: LegalTabType): string => {
        switch (tab) {
            case 'privacy':
                return 'Privacy Policy';
            case 'booking':
                return 'Booking Policies';
            case 'terms':
            default:
                return 'Terms & Conditions';
        }
    };

    const getNextUnreadTab = (
        current: LegalTabType,
        termsRead: boolean,
        privacyRead: boolean,
        bookingRead: boolean
    ): LegalTabType | null => {
        if (current === 'terms') {
            if (!privacyRead) return 'privacy';
            if (!bookingRead) return 'booking';
            return null;
        }
        if (current === 'privacy') {
            if (!bookingRead) return 'booking';
            if (!termsRead) return 'terms';
            return null;
        }
        if (current === 'booking') {
            if (!termsRead) return 'terms';
            if (!privacyRead) return 'privacy';
            return null;
        }
        return null;
    };

    const isCurrentTabRead =
        (activeTab === 'terms' && hasReadTerms) ||
        (activeTab === 'privacy' && hasReadPrivacy) ||
        (activeTab === 'booking' && hasReadBooking);

    const nextUnreadTab = getNextUnreadTab(activeTab, hasReadTerms, hasReadPrivacy, hasReadBooking);

    let buttonTitle = '';
    let buttonVariant: 'primary' | 'outline' = 'outline';
    let buttonIcon: string | undefined = undefined;
    let buttonIconPosition: 'left' | 'right' = 'right';
    let buttonValidationState: 'valid' | 'idle' | 'error' = 'idle';
    let handleButtonPress = () => {};

    if (isAlreadyAcknowledged) {
        buttonTitle = 'Done';
        buttonVariant = 'primary';
        buttonIcon = 'check';
        buttonIconPosition = 'left';
        buttonValidationState = 'valid';
        handleButtonPress = onClose;
    } else if (canAcknowledge) {
        buttonTitle = 'I Understand & Agree';
        buttonVariant = 'primary';
        buttonIcon = 'check';
        buttonIconPosition = 'left';
        buttonValidationState = 'valid';
        handleButtonPress = handleAcknowledgePress;
    } else if (isCurrentTabRead) {
        if (nextUnreadTab) {
            buttonTitle = `Continue to ${getTabDisplayName(nextUnreadTab)}`;
            buttonVariant = 'primary';
            buttonIcon = 'arrow-right';
            buttonIconPosition = 'right';
            buttonValidationState = 'valid';
            handleButtonPress = () => handleTabChange(nextUnreadTab);
        } else {
            buttonTitle = 'I Understand & Agree';
            buttonVariant = 'primary';
            buttonIcon = 'check';
            buttonIconPosition = 'left';
            buttonValidationState = 'valid';
            handleButtonPress = handleAcknowledgePress;
        }
    } else {
        buttonTitle = `Read to Continue (${readCount}/3)`;
        buttonVariant = 'outline';
        buttonValidationState = hasAttemptedAcknowledge ? 'error' : 'idle';
        handleButtonPress = () => {
            setHasAttemptedAcknowledge(true);
            setToastMessage(`Please scroll to the bottom of ${getTabDisplayName(activeTab)} to continue.`);
        };
    }

    const getTabContent = () => {
        switch (activeTab) {
            case 'privacy':
                return PRIVACY_POLICY_TEXT;
            case 'booking':
                return BOOKING_TERMS_TEXT;
            case 'terms':
            default:
                return TERMS_OF_SERVICE_TEXT;
        }
    };

    const tabs: TabConfig[] = [
        {
            key: 'terms',
            icon: 'file-text',
            label: isDesktop ? 'Terms & Conditions' : 'Terms',
            isRead: hasReadTerms,
        },
        {
            key: 'privacy',
            icon: 'shield',
            label: isDesktop ? 'Privacy Policy' : 'Privacy',
            isRead: hasReadPrivacy,
        },
        {
            key: 'booking',
            icon: 'calendar',
            label: isDesktop ? 'Booking Policies' : 'Booking',
            isRead: hasReadBooking,
        },
    ];

    if (!renderModal) return null;

    const modalDialogStyle = isDesktop
        ? styles.bottomSheetDesktop
        : isTablet
            ? styles.bottomSheetTablet
            : styles.bottomSheetMobile;

    return (
        <Modal
            transparent
            visible={renderModal}
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <KeyboardAvoidingView 
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={handleDismiss}
                    />
                </Animated.View>

                {/* Bottom Sheet / Centered Modal Card */}
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        modalDialogStyle,
                        { paddingBottom: isWideScreen ? 24 : Math.max(insets.bottom + 16, 20) },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [50, 0] : [SCREEN_HEIGHT, 0]
                                    })
                                }
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        }
                    ]}
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <CustomText variant="h2" style={styles.headerTitle}>
                            Terms & Conditions
                        </CustomText>
                        <TouchableOpacity
                            onPress={handleDismiss}
                            style={styles.closeBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <CustomIcon
                                library="Feather"
                                name="x"
                                size={20}
                                color={Colors.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Segmented 3-Tab Selector Bar with Highlighted Selected Pill and Full Labels */}
                    <View style={styles.tabContainer}>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            const isRead = tab.isRead;
                            const iconName = isRead ? 'check' : tab.icon;

                            let iconColor = Colors.TEXT_SECONDARY;
                            if (isActive && isRead) {
                                iconColor = Colors.WHITE;
                            } else if (isActive) {
                                iconColor = Colors.PRIMARY;
                            } else if (isRead) {
                                iconColor = Colors.SUCCESS;
                            }

                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[
                                        styles.tabButton,
                                        isActive && styles.activeTab,
                                        isActive && isRead && styles.activeTabRead,
                                    ]}
                                    onPress={() => handleTabChange(tab.key)}
                                    activeOpacity={0.7}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: isActive }}
                                    accessibilityLabel={tab.label}
                                >
                                    <View style={styles.tabInnerRow}>
                                        <CustomIcon
                                            library="Feather"
                                            name={iconName}
                                            size={13}
                                            color={iconColor}
                                        />
                                        <CustomText 
                                            numberOfLines={1}
                                            style={[
                                                styles.tabText,
                                                isActive && styles.activeTabText,
                                                isActive && isRead && styles.activeTabTextRead,
                                                !isActive && isRead && styles.readTabText,
                                            ]}
                                        >
                                            {tab.label}
                                        </CustomText>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Scrollable Document Text with Fresh Instance per Tab to Reset Scroll */}
                    <View style={styles.contentWrapper}>
                        <ResponsiveScrollView
                            key={activeTab}
                            minHeight={0}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            showsVerticalScrollIndicator={true}
                            persistentScrollbar={true}
                            contentContainerStyle={styles.scrollContent}
                        >
                            <CustomText variant="body" style={styles.legalText}>
                                {getTabContent()}
                            </CustomText>
                        </ResponsiveScrollView>

                        {!isAtBottom && (
                            <LinearGradient
                                colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE]}
                                style={styles.fadeOverlay}
                                pointerEvents="none"
                            />
                        )}
                    </View>

                    {/* Interactive Action Button with Encapsulated Validation State & Sequential Guidance */}
                    <CustomButton
                        title={buttonTitle}
                        onPress={handleButtonPress}
                        variant={buttonVariant}
                        validationState={buttonValidationState}
                        isIdleDisabled={false}
                        icon={buttonIcon}
                        iconPosition={buttonIconPosition}
                        iconLibrary="Feather"
                        style={styles.closeBtnWrapper}
                    />

                    {/* Floating Toast Alert inside Modal with Responsive Docking */}
                    <CustomToast
                        visible={!!toastMessage}
                        message={toastMessage || ''}
                        onHide={() => {
                            setToastMessage(null);
                            setHasAttemptedAcknowledge(false);
                        }}
                        type="warning"
                        mode="simple"
                        position="floating"
                        bottomOffset={toastBottomOffset}
                    />
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
        width: '100%',
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        paddingTop: 24,
        maxHeight: '90%',
        flexDirection: 'column',
        ...GlobalStyles.dropShadow(3),
    },
    bottomSheetMobile: {
        width: '100%',
        height: '85%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
    },
    bottomSheetTablet: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: '92%',
        maxWidth: 520,
        height: 620,
        maxHeight: '85%',
        borderRadius: 24,
        paddingHorizontal: 28,
    },
    bottomSheetDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: '92%',
        maxWidth: 640,
        height: 660,
        maxHeight: '85%',
        borderRadius: 24,
        paddingHorizontal: 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
        gap: 6,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 9,
        paddingHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    activeTab: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(2),
    },
    activeTabRead: {
        backgroundColor: Colors.PRIMARY,
    },
    tabInnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    activeTabText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    activeTabTextRead: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    readTabText: {
        color: Colors.SUCCESS,
        fontWeight: '600',
    },
    contentWrapper: {
        flex: 1,
        flexShrink: 1,
        minHeight: 180,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        position: 'relative',
    },
    scrollContent: {
        padding: 18,
        paddingBottom: 48,
    },
    legalText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.TEXT_PRIMARY,
    },
    fadeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
    },
    closeBtnWrapper: {
        marginTop: 14,
        borderRadius: 16,
    },
});

export default LegalTermsModal;
