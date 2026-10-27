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
import CustomTextInput from '@/src/components/CustomTextInput';
import { CustomToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking } from '@/src/core/models/Booking/Booking';
import { ORGANIZER_CANCEL_REASONS } from '@/src/features/Admin/utils/reviewMessages';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AdminCancelBookingModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when admin confirms cancellation with reason and refund decision */
    onConfirm: (
        reason: string,
        refundType: 'full' | 'partial' | 'none',
        refundAmount: number
    ) => Promise<void> | void;
    /** Whether the cancellation action is in progress */
    isSubmitting?: boolean;
    /** Error message to display, if any */
    errorMessage?: string | null;
    /** Target booking being cancelled */
    booking?: Booking | null;
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
    booking = null,
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

    const totalAmountPaid = (booking?.payment || []).reduce(
        (sum, p) => (p.status === 'captured' ? sum + p.amount : sum),
        0
    );
    const isPaid = totalAmountPaid > 0;

    const [refundType, setRefundType] = useState<'full' | 'partial' | 'none' | null>(null);
    const [customAmountText, setCustomAmountText] = useState<string>('');

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
            setRefundType(null);
            setCustomAmountText('');
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
    }, [onClose, setToastConfig, setHasAttemptedSubmit]);

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

        if (isPaid && !refundType) {
            setHasAttemptedSubmit(true);
            showModalToast('Please select a refund decision (Full, Partial, or No Refund).', 'error');
            return;
        }

        let resolvedAmount = 0;
        if (isPaid) {
            if (refundType === 'full') {
                resolvedAmount = totalAmountPaid;
            } else if (refundType === 'partial') {
                const parsed = parseFloat(customAmountText.trim());
                if (isNaN(parsed) || parsed <= 0 || parsed > totalAmountPaid) {
                    setHasAttemptedSubmit(true);
                    showModalToast(`Please enter a valid partial refund between ₱1.00 and ₱${totalAmountPaid.toFixed(2)}.`, 'error');
                    return;
                }
                resolvedAmount = parsed;
            } else {
                resolvedAmount = 0;
            }
        }

        isSubmittingRef.current = true;
        try {
            await onConfirm(reason.trim(), refundType || 'none', resolvedAmount);
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
                        contentContainerStyle={[styles.scrollBody, { paddingBottom: keyboardHeight > 0 ? 90 : 16 }]}
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

                        {isPaid ? (
                            <View style={styles.refundSection}>
                                <View style={styles.refundSectionHeader}>
                                    <CustomText style={styles.refundSectionTitle}>
                                        Refund Decision <CustomText style={{ color: Colors.ERROR }}>*</CustomText>
                                    </CustomText>
                                    <CustomText style={styles.paidAmountBadge}>
                                        Total Paid: ₱{totalAmountPaid.toFixed(2)}
                                    </CustomText>
                                </View>

                                <View style={styles.refundOptionsCol}>
                                    {/* Full Refund Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.refundOptionCard,
                                            refundType === 'full' && styles.refundOptionCardSelected,
                                        ]}
                                        onPress={() => {
                                            setRefundType('full');
                                            if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.refundOptionLeft}>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    refundType === 'full' && styles.radioCircleSelected,
                                                ]}
                                            >
                                                {refundType === 'full' && <View style={styles.radioDot} />}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <CustomText style={styles.refundOptionTitle}>Full Refund (100%)</CustomText>
                                                <CustomText style={styles.refundOptionSubtitle}>
                                                    Return the entire amount paid to the hiker
                                                </CustomText>
                                            </View>
                                        </View>
                                        <CustomText style={styles.refundOptionAmount}>
                                            ₱{totalAmountPaid.toFixed(2)}
                                        </CustomText>
                                    </TouchableOpacity>

                                    {/* Partial Refund Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.refundOptionCard,
                                            refundType === 'partial' && styles.refundOptionCardSelected,
                                        ]}
                                        onPress={() => {
                                            setRefundType('partial');
                                            if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.refundOptionLeft}>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    refundType === 'partial' && styles.radioCircleSelected,
                                                ]}
                                            >
                                                {refundType === 'partial' && <View style={styles.radioDot} />}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <CustomText style={styles.refundOptionTitle}>Partial Refund</CustomText>
                                                <CustomText style={styles.refundOptionSubtitle}>
                                                    Specify a custom amount to return
                                                </CustomText>
                                            </View>
                                        </View>
                                        <CustomIcon library="Feather" name="edit-3" size={16} color={Colors.TEXT_SECONDARY} />
                                    </TouchableOpacity>

                                    {refundType === 'partial' && (
                                        <View style={styles.customAmountWrapper}>
                                            <CustomTextInput
                                                label="Partial Refund Amount (₱)"
                                                placeholder={`e.g. ${(totalAmountPaid * 0.5).toFixed(2)}`}
                                                keyboardType="decimal-pad"
                                                value={customAmountText}
                                                onFocus={() => {
                                                    setTimeout(() => {
                                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                                    }, Platform.OS === 'android' ? 200 : 100);
                                                }}
                                                onChangeText={(val: string) => {
                                                    setCustomAmountText(val);
                                                    if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                                }}
                                            />
                                            <CustomText variant="caption" style={styles.helperText}>
                                                {`Must be between ₱1.00 and ₱${totalAmountPaid.toFixed(2)}`}
                                            </CustomText>
                                        </View>
                                    )}

                                    {/* No Refund Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.refundOptionCard,
                                            refundType === 'none' && styles.refundOptionCardSelected,
                                        ]}
                                        onPress={() => {
                                            setRefundType('none');
                                            if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.refundOptionLeft}>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    refundType === 'none' && styles.radioCircleSelected,
                                                ]}
                                            >
                                                {refundType === 'none' && <View style={styles.radioDot} />}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <CustomText style={styles.refundOptionTitle}>No Refund</CustomText>
                                                <CustomText style={styles.refundOptionSubtitle}>
                                                    Cancel booking without returning funds
                                                </CustomText>
                                            </View>
                                        </View>
                                        <CustomText style={styles.refundOptionAmount}>
                                            ₱0.00
                                        </CustomText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.unpaidNoticeBox}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                                <CustomText style={styles.unpaidNoticeText}>
                                    This reservation is unpaid. No refund payout will be required.
                                </CustomText>
                            </View>
                        )}
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
    refundSection: {
        marginTop: 16,
        gap: 10,
    },
    refundSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    refundSectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    paidAmountBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    refundOptionsCol: {
        gap: 8,
    },
    refundOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
    },
    refundOptionCardSelected: {
        borderColor: Colors.ERROR,
        backgroundColor: '#FEF2F2',
    },
    refundOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: Colors.GRAY_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        borderColor: Colors.ERROR,
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.ERROR,
    },
    refundOptionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    refundOptionSubtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    refundOptionAmount: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    customAmountWrapper: {
        marginTop: 4,
        paddingLeft: 28,
    },
    helperText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
        marginLeft: 2,
    },
    unpaidNoticeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 12,
        borderRadius: 10,
        marginTop: 14,
    },
    unpaidNoticeText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
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
