/**
 * @file AdminCancelBookingModal.tsx
 * @description Dedicated modal for organizer-initiated booking cancellations,
 * featuring organizer suggestion chips (weather, trail closures, safety) and custom reason input.
 * Upgraded with responsive dual-surface (bottom sheet on mobile, centered dialog on desktop),
 * physical keyboard lifting engine, standardized CustomButton actions, in-modal CustomToast, and web Escape dismissal.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { CustomToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { ORGANIZER_CANCEL_REASONS } from '@/src/features/Admin/utils/reviewMessages';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AdminCancelBookingModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when admin confirms cancellation with reason */
    onConfirm: (reason: string) => Promise<void> | void;
    /** Whether the cancellation action is in progress */
    isSubmitting?: boolean;
    /** Error message to display, if any */
    errorMessage?: string | null;
}

/**
 * Universal Responsive Modal for organizer-initiated booking cancellations.
 * Centers on tablet/desktop screens and slides up as an interactive bottom sheet on mobile screens.
 */
const AdminCancelBookingModal: React.FC<AdminCancelBookingModalProps> = ({
    visible,
    onClose,
    onConfirm,
    isSubmitting = false,
    errorMessage = null,
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }

    const [reason, setReason] = useState<string>('');
    const [animValue] = useState(() => new Animated.Value(0));
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

    const [toastConfig, setToastConfig] = useState<{
        message: string | null;
        type: 'error' | 'warning' | 'info' | 'success';
    }>({
        message: null,
        type: 'error',
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

    const showModalToast = (
        message: string,
        type: 'error' | 'warning' | 'info' | 'success' = 'error'
    ) => {
        setToastConfig({ message, type });
    };

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
            setReason('');
            setToastConfig({ message: null, type: 'error' });
            setHasAttemptedSubmit(false);
        }
    }

    // Sync external error messages into in-modal toast
    const [prevErrorMessage, setPrevErrorMessage] = useState(errorMessage);
    if (errorMessage !== prevErrorMessage) {
        setPrevErrorMessage(errorMessage);
        if (errorMessage) {
            showModalToast(errorMessage, 'error');
        }
    }

    useEffect(() => {
        if (visible) {
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    const isSubmittingRef = useRef(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!visible) {
            isSubmittingRef.current = false;
        }
    }, [visible]);

    // Keyboard listener: tracks exact pixel height for physical bottom sheet lift on mobile
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Physical Escape key dismissal on Web
    const handleClose = useCallback(() => {
        setToastConfig({ message: null, type: 'error' });
        setHasAttemptedSubmit(false);
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, handleClose]);

    const isReasonValid = reason.trim().length >= 5;

    const handleConfirm = async () => {
        if (isSubmittingRef.current || isSubmitting) return;

        if (!isReasonValid) {
            setHasAttemptedSubmit(true);
            showModalToast('Please provide a reason with at least 5 characters.', 'error');
            return;
        }

        isSubmittingRef.current = true;
        try {
            await onConfirm(reason.trim());
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to cancel booking. Please try again.';
            showModalToast(msg, 'error');
            setHasAttemptedSubmit(true);
        } finally {
            isSubmittingRef.current = false;
        }
    };

    if (!renderModal) return null;

    // Toast offset calculation: guarantee clean 12px floating headroom above action buttons
    const footerHeight = 52 + 16;
    const baseBottomPadding = isWideScreen ? 24 : Math.max(insets.bottom + 16, 24);
    const toastBottomOffset = (keyboardHeight > 0 ? keyboardHeight + 16 : baseBottomPadding) + footerHeight + 12;

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <KeyboardAvoidingView
                behavior={undefined}
                style={styles.modalContainer}
            >
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modalContent,
                        isWideScreen ? styles.modalContentDesktop : styles.modalContentMobile,
                        {
                            paddingBottom: keyboardHeight > 0
                                ? keyboardHeight + 16
                                : isWideScreen
                                ? 24
                                : Math.max(insets.bottom + 16, 24),
                            maxHeight: isWideScreen
                                ? '85%'
                                : keyboardHeight > 0
                                ? Math.round((SCREEN_HEIGHT - keyboardHeight - insets.top) * 0.88) + keyboardHeight + 16
                                : '90%',
                        },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [40, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        },
                    ]}
                >
                    {!isWideScreen && <View style={styles.sheetHandle} />}

                    <View style={styles.header}>
                        <View style={styles.headerSide} />
                        <CustomText variant="h3" style={styles.headerTitle}>
                            Cancel Booking
                        </CustomText>
                        <View style={[styles.headerSide, styles.headerSideRight]}>
                            <TouchableOpacity
                                onPress={handleClose}
                                activeOpacity={0.7}
                                style={styles.closeBtn}
                                accessibilityLabel="Close modal"
                                disabled={isSubmitting}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="x"
                                    size={20}
                                    color={Colors.TEXT_PRIMARY}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.warningBox}>
                            <CustomIcon
                                library="Feather"
                                name="alert-triangle"
                                size={18}
                                color={Colors.ERROR}
                            />
                            <CustomText variant="caption" style={styles.warningText}>
                                Cancelling this booking will notify the hiker and update the reservation status. Please select a reason or provide a clear explanation for the cancellation.
                            </CustomText>
                        </View>

                        {errorMessage ? (
                            <View style={styles.errorBox}>
                                <CustomIcon
                                    library="Feather"
                                    name="alert-circle"
                                    size={16}
                                    color={Colors.ERROR}
                                />
                                <CustomText variant="caption" style={styles.errorText}>
                                    {errorMessage}
                                </CustomText>
                            </View>
                        ) : null}

                        <CustomFeedbackInput
                            label="Reason for Cancellation"
                            placeholder="Select a suggestion above or enter specific details..."
                            helperText="Tap a suggestion above or type your own detailed reason."
                            value={reason}
                            onChangeText={(val) => {
                                setReason(val);
                                if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                            }}
                            suggestions={[...ORGANIZER_CANCEL_REASONS]}
                            variant="danger"
                        />

                        <View style={styles.counterRow}>
                            <CustomText variant="caption" style={styles.counterText}>
                                {reason.length} / 300 characters
                            </CustomText>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <CustomButton
                            title="Keep Booking"
                            onPress={handleClose}
                            variant="outline"
                            disabled={isSubmitting}
                            style={styles.cancelBtn}
                        />

                        <CustomButton
                            title="Confirm Cancellation"
                            onPress={handleConfirm}
                            variant="destructive"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                            validationState={
                                isReasonValid
                                    ? 'valid'
                                    : (hasAttemptedSubmit ? 'error' : 'idle')
                            }
                            isIdleDisabled={false}
                            style={styles.confirmBtn}
                        />
                    </View>

                    <CustomToast
                        visible={!!toastConfig.message}
                        message={toastConfig.message || ''}
                        onHide={() => {
                            setToastConfig({ message: null, type: 'error' });
                            setHasAttemptedSubmit(false);
                        }}
                        type={toastConfig.type}
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
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(5, 0.15, Colors.SHADOW, { radius: 16 }),
    },
    modalContentMobile: {
        width: '100%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingTop: 8,
    },
    modalContentDesktop: {
        alignSelf: 'center',
        width: '92%',
        maxWidth: 540,
        borderRadius: 24,
        paddingTop: 20,
        marginVertical: 'auto',
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.GRAY_LIGHT,
        alignSelf: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerSide: {
        width: 32,
    },
    headerSideRight: {
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 18,
        color: Colors.ERROR,
        marginBottom: 0,
        textAlign: 'center',
        flex: 1,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
    },
    scrollBody: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 12,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: Colors.ERROR_BG,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 12,
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    warningText: {
        flex: 1,
        color: Colors.ERROR,
        lineHeight: 18,
        fontSize: 13,
    },
    errorBox: {
        flexDirection: 'row',
        backgroundColor: Colors.ERROR_BG,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    errorText: {
        flex: 1,
        color: Colors.ERROR,
        fontSize: 12,
        fontWeight: '500',
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 6,
        marginRight: 4,
    },
    counterText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    cancelBtn: {
        flex: 1,
    },
    confirmBtn: {
        flex: 1.3,
    },
});

export default AdminCancelBookingModal;
