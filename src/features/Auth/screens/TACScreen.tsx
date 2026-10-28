/**
 * @file TACScreen.tsx
 * @description Terms and Conditions screen for user registration.
 * Presents a responsive modal bottom sheet on mobile and centered card on desktop,
 * with per-tab scroll tracking, sequential progression buttons, and floating toast guidance.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { CustomToast } from '@/src/components/Toast/Toast';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PRIVACY_TEXT, TERMS_TEXT } from '@/src/constants/legal';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface TACScreenProps {
    onAcceptPress?: () => void;
    onDeclinePress?: () => void;
    error?: string | null;
}

const TACScreen = ({ 
    onAcceptPress, 
    onDeclinePress,
    error,
}: TACScreenProps) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isLargeScreen = isDesktop || isTablet;

    const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
    const [isChecked, setIsChecked] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    const [hasReadTerms, setHasReadTerms] = useState(false);
    const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [hasAttemptedProceed, setHasAttemptedProceed] = useState(false);
    const [animValue] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    }, [animValue]);

    const canAccept = hasReadTerms && hasReadPrivacy;
    const readCount = [hasReadTerms, hasReadPrivacy].filter(Boolean).length;
    const isCurrentTabRead = activeTab === 'terms' ? hasReadTerms : hasReadPrivacy;

    const handleTabChange = (tab: 'terms' | 'privacy') => {
        setActiveTab(tab);
        setIsAtBottom(false);
        setToastMessage(null);
        setHasAttemptedProceed(false);
    };

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
        }
    };

    const handleDeclineConfirm = () => {
        setShowDeclineModal(false);
        if (onDeclinePress) {
            onDeclinePress();
        }
    };

    // Sequential top button title and action
    let buttonTitle = '';
    let buttonVariant: 'primary' | 'outline' = 'outline';
    let buttonIcon: string | undefined = undefined;
    let buttonIconPosition: 'left' | 'right' = 'right';
    let buttonValidationState: 'valid' | 'idle' | 'error' = 'idle';
    let handleTopButtonPress = () => {};

    if (canAccept) {
        if (isChecked) {
            buttonTitle = 'Proceed';
            buttonVariant = 'primary';
            buttonIcon = 'check';
            buttonIconPosition = 'left';
            buttonValidationState = 'valid';
            handleTopButtonPress = () => {
                if (onAcceptPress) onAcceptPress();
            };
        } else {
            buttonTitle = 'Agree & Proceed';
            buttonVariant = 'outline';
            buttonValidationState = hasAttemptedProceed ? 'error' : 'idle';
            handleTopButtonPress = () => {
                setHasAttemptedProceed(true);
                setToastMessage('Please check the agreement box below to proceed.');
            };
        }
    } else if (isCurrentTabRead) {
        const nextTab = activeTab === 'terms' ? 'Privacy Policy' : 'Terms & Conditions';
        buttonTitle = `Continue to ${nextTab}`;
        buttonVariant = 'primary';
        buttonIcon = 'arrow-right';
        buttonIconPosition = 'right';
        buttonValidationState = 'valid';
        handleTopButtonPress = () => {
            handleTabChange(activeTab === 'terms' ? 'privacy' : 'terms');
        };
    } else {
        buttonTitle = `Read to Continue (${readCount}/2)`;
        buttonVariant = 'outline';
        buttonValidationState = hasAttemptedProceed ? 'error' : 'idle';
        handleTopButtonPress = () => {
            setHasAttemptedProceed(true);
            const currentTabName = activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy';
            setToastMessage(`Please read through to the bottom of the ${currentTabName} to continue.`);
        };
    }

    const footerPadding = isLargeScreen ? 24 : Math.max(insets.bottom + 16, 20);
    const toastBottomOffset = isLargeScreen ? footerPadding + 95 : footerPadding + 155;

    const isTermsActive = activeTab === 'terms';
    const isPrivacyActive = activeTab === 'privacy';

    return (
        <ScreenWrapper backgroundColor="transparent">
            <View style={[styles.modalOverlay, isLargeScreen && styles.modalOverlayLarge]}>
                
                <ConfirmationModal
                    visible={showDeclineModal}
                    title="Decline Terms?"
                    message="You must accept the Terms & Conditions and Privacy Policy to create an account. Declining will cancel the sign-up process."
                    confirmText="Confirm"
                    cancelText="Cancel"
                    onConfirm={handleDeclineConfirm}
                    onClose={() => setShowDeclineModal(false)}
                    isDestructive={true}
                    iconName="x-octagon"
                />

                <Animated.View style={[
                    styles.modalCard, 
                    isLargeScreen ? styles.modalCardLarge : styles.modalCardMobile,
                    {
                        paddingBottom: footerPadding,
                        transform: [
                            {
                                translateY: animValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: isLargeScreen ? [50, 0] : [SCREEN_HEIGHT, 0],
                                }),
                            },
                        ],
                        opacity: isLargeScreen ? animValue : 1,
                    },
                ]}>

                    {/* 2-Tab Segmented Switcher */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[
                                styles.tabButton, 
                                isTermsActive && styles.activeTab,
                                isTermsActive && hasReadTerms && styles.activeTabRead
                            ]}
                            onPress={() => handleTabChange('terms')}
                            activeOpacity={0.7}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isTermsActive }}
                            accessibilityLabel="Terms & Conditions"
                        >
                            <View style={styles.tabContentRow}>
                                <CustomIcon 
                                    library="Feather" 
                                    name={hasReadTerms ? "check" : "file-text"} 
                                    size={13} 
                                    color={
                                        isTermsActive && hasReadTerms 
                                            ? Colors.WHITE 
                                            : isTermsActive 
                                            ? Colors.PRIMARY 
                                            : hasReadTerms 
                                            ? Colors.SUCCESS 
                                            : Colors.TEXT_SECONDARY
                                    } 
                                />
                                <CustomText 
                                    numberOfLines={1} 
                                    style={[
                                        styles.tabText, 
                                        isTermsActive && styles.activeTabText,
                                        isTermsActive && hasReadTerms && styles.activeTabTextRead,
                                        !isTermsActive && hasReadTerms && styles.readTabText,
                                    ]}
                                >
                                    Terms & Conditions
                                </CustomText>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.tabButton, 
                                isPrivacyActive && styles.activeTab,
                                isPrivacyActive && hasReadPrivacy && styles.activeTabRead
                            ]}
                            onPress={() => handleTabChange('privacy')}
                            activeOpacity={0.7}
                            accessibilityRole="tab"
                            accessibilityState={{ selected: isPrivacyActive }}
                            accessibilityLabel="Privacy Policy"
                        >
                            <View style={styles.tabContentRow}>
                                <CustomIcon 
                                    library="Feather" 
                                    name={hasReadPrivacy ? "check" : "shield"} 
                                    size={13} 
                                    color={
                                        isPrivacyActive && hasReadPrivacy 
                                            ? Colors.WHITE 
                                            : isPrivacyActive 
                                            ? Colors.PRIMARY 
                                            : hasReadPrivacy 
                                            ? Colors.SUCCESS 
                                            : Colors.TEXT_SECONDARY
                                    } 
                                />
                                <CustomText 
                                    numberOfLines={1}
                                    style={[
                                        styles.tabText, 
                                        isPrivacyActive && styles.activeTabText,
                                        isPrivacyActive && hasReadPrivacy && styles.activeTabTextRead,
                                        !isPrivacyActive && hasReadPrivacy && styles.readTabText,
                                    ]}
                                >
                                    Privacy Policy
                                </CustomText>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Document Text with Fresh Instance per Tab */}
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
                                {activeTab === 'terms' ? TERMS_TEXT : PRIVACY_TEXT}
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

                    {/* Agreement Checkbox */}
                    <View style={styles.agreementContainer}>
                        <ErrorMessage error={error} />

                        <TouchableOpacity 
                            style={[
                                styles.checkboxRow, 
                                !canAccept && styles.checkboxRowDisabled
                            ]} 
                            onPress={() => {
                                if (canAccept) {
                                    setIsChecked(!isChecked);
                                } else {
                                    setToastMessage('Please read through both policies before agreeing.');
                                }
                            }}
                            activeOpacity={canAccept ? 0.7 : 0.9}
                        >
                            <View style={[styles.checkbox, isChecked && styles.checkedBox]}>
                                {isChecked && (
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check" 
                                        size={14} 
                                        color={Colors.WHITE} 
                                    />
                                )}
                            </View>
                            
                            <CustomText variant="caption" style={styles.agreementText}>
                                I have read and agree to follow the <CustomText style={styles.linkText}>Terms & Conditions</CustomText> and <CustomText style={styles.linkText}>Privacy Policy</CustomText>.
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.buttonContainer, isLargeScreen && styles.buttonContainerWeb]}>
                        {isLargeScreen && (
                            <CustomButton 
                                title="Decline" 
                                onPress={() => setShowDeclineModal(true)}
                                variant="outline"
                                style={[styles.declineButton, styles.declineButtonWeb]}
                                textStyle={styles.declineButtonText}
                            />
                        )}

                        <CustomButton 
                            title={buttonTitle} 
                            onPress={handleTopButtonPress}
                            variant={buttonVariant}
                            validationState={buttonValidationState}
                            isIdleDisabled={false}
                            icon={buttonIcon}
                            iconPosition={buttonIconPosition}
                            iconLibrary="Feather"
                            style={isLargeScreen ? styles.primaryButtonWeb : undefined}
                        />

                        {!isLargeScreen && (
                            <CustomButton 
                                title="Decline" 
                                onPress={() => setShowDeclineModal(true)}
                                variant="outline"
                                style={styles.declineButton}
                                textStyle={styles.declineButtonText}
                            />
                        )}
                    </View>

                    {/* Floating Toast Alert inside Modal */}
                    <CustomToast
                        visible={Boolean(toastMessage)}
                        message={toastMessage || ''}
                        onHide={() => {
                            setToastMessage(null);
                            setHasAttemptedProceed(false);
                        }}
                        type="warning"
                        mode="simple"
                        position="floating"
                        bottomOffset={toastBottomOffset}
                    />

                </Animated.View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'flex-end',
        width: '100%',
    },
    modalOverlayLarge: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: Colors.WHITE,
        flexDirection: 'column',
        ...GlobalStyles.dropShadow(3),
    },
    modalCardMobile: {
        width: '100%',
        height: '85%',
        maxHeight: '90%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    modalCardLarge: {
        width: '94%',
        maxWidth: 760,
        height: 700,
        maxHeight: '90%',
        borderRadius: 24,
        paddingHorizontal: 36,
        paddingTop: 28,
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
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
    },
    activeTab: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(2),
    },
    activeTabRead: {
        backgroundColor: Colors.PRIMARY,
    },
    tabContentRow: {
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
    agreementContainer: {
        width: '100%',
        marginTop: 12,
        marginBottom: 6,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        gap: 12,
        paddingVertical: 4,
    },
    checkboxRowDisabled: {
        opacity: 0.5,
    },
    checkbox: {
        width: 20, 
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.GRAY_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedBox: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    agreementText: {
        flex: 1, 
        fontSize: 13,
        lineHeight: 18,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'left', 
    },
    linkText: {
        fontWeight: '700',
        fontSize: 13,
        color: Colors.PRIMARY,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'column',
        gap: 10,
        marginTop: 10,
    },
    buttonContainerWeb: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    primaryButtonWeb: {
        flex: 0.72,
    },
    declineButton: {
        borderColor: Colors.ERROR,
        backgroundColor: Colors.WHITE,
    },
    declineButtonWeb: {
        flex: 0.28,
        minWidth: 120,
    },
    declineButtonText: {
        color: Colors.ERROR,
    },
});

export default TACScreen;
