/**
 * @file LegalTermsModal.tsx
 * @description In-place modal bottom-sheet for viewing Terms of Service, Privacy Policy,
 * and Booking & Organizer Policies without navigating away from the active form.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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
}

const LegalTermsModal = ({
    visible,
    onClose,
    initialTab = 'terms',
}: LegalTermsModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
    const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

    if (visible !== prevVisible || initialTab !== prevInitialTab) {
        setPrevVisible(visible);
        setPrevInitialTab(initialTab);
        if (visible) {
            setActiveTab(initialTab);
            setIsAtBottom(false);
        }
    }

    useEffect(() => {
        if (visible) {
            Animated.timing(animValue, {
                toValue: 1,
                duration: 250,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => {
                setRenderModal(false);
            });
        }
    }, [visible, animValue]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const reachedBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
        if (reachedBottom !== isAtBottom) {
            setIsAtBottom(reachedBottom);
        }
    };

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

    if (!renderModal) return null;

    return (
        <Modal
            transparent
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
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
                        onPress={onClose}
                    />
                </Animated.View>

                {/* Bottom Sheet Card */}
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        isWideScreen ? styles.bottomSheetDesktop : styles.bottomSheetMobile,
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
                            onPress={onClose}
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

                    {/* 3-Tab Selector Bar */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'terms' && styles.activeTab]}
                            onPress={() => { setActiveTab('terms'); setIsAtBottom(false); }}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                numberOfLines={1}
                                style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}
                            >
                                Terms
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'privacy' && styles.activeTab]}
                            onPress={() => { setActiveTab('privacy'); setIsAtBottom(false); }}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                numberOfLines={1}
                                style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}
                            >
                                Privacy
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'booking' && styles.activeTab]}
                            onPress={() => { setActiveTab('booking'); setIsAtBottom(false); }}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                numberOfLines={1}
                                style={[styles.tabText, activeTab === 'booking' && styles.activeTabText]}
                            >
                                Booking
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Document Text with Fade Overlay */}
                    <View style={styles.contentWrapper}>
                        <ResponsiveScrollView
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

                    {/* Close / Action Button via CustomButton */}
                    <CustomButton
                        title="I Understand & Close"
                        onPress={onClose}
                        variant="primary"
                        style={styles.closeBtnWrapper}
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
        paddingHorizontal: 24,
        paddingTop: 24,
        maxHeight: '90%',
        ...GlobalStyles.dropShadow(3),
    },
    bottomSheetMobile: {
        width: '100%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    bottomSheetDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: 500,
        borderRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
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
        marginBottom: 14,
        gap: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(2),
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    activeTabText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    contentWrapper: {
        height: 520,
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
        borderRadius: 14,
    },
});

export default LegalTermsModal;
