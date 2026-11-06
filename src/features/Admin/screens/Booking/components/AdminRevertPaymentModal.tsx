/**
 * @file AdminRevertPaymentModal.tsx
 * @description Confirmation modal for reverting verified payments or rejected payment receipts.
 * Restores booking and payment records back to pending review state.
 * Supports responsive design across web and mobile surfaces.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { formatDateTime } from '@/src/core/utility/date';
import { getDisplayReferenceCode } from '@/src/features/Admin/utils/paymentUtils';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AdminRevertPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    payment?: IPayment<Date> | null;
    paymentIndex?: number;
    booking: Booking;
    isRejectionRevert?: boolean;
    onConfirm: (options?: {
        paymentIndex?: number;
        revertRejection?: boolean;
        reason?: string;
    }) => Promise<void> | void;
    isSubmitting?: boolean;
    isProcessing?: boolean;
}

export const AdminRevertPaymentModal: React.FC<AdminRevertPaymentModalProps> = ({
    visible,
    onClose,
    payment,
    paymentIndex,
    booking,
    isRejectionRevert = false,
    onConfirm,
    isSubmitting = false,
    isProcessing = false,
}) => {
    const insets = useSafeAreaInsets();
    const resolvedIsSubmitting = isSubmitting || isProcessing;
    const { isMobile, isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
        }
    }

    useEffect(() => {
        if (visible) {
            Animated.timing(animValue, {
                toValue: 1,
                duration: 280,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 220,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    // Track software keyboard height on mobile to dynamically lift the modal bottom sheet
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const totalPrice = booking.offer?.price || 0;
    const payments = booking.payment || [];

    // Calculate balance if this payment is reverted
    const paymentAmount = payment?.amount || 0;
    const remainingCapturedAfterRevert = payments.reduce((sum, p, idx) => {
        const isThis = (typeof paymentIndex === 'number' && idx === paymentIndex) || (p === payment);
        if (!isThis && p.status === 'captured') {
            return sum + (p.amount || 0);
        }
        return sum;
    }, 0);
    const balanceAfterRevert = Math.max(0, totalPrice - remainingCapturedAfterRevert);

    const { refCode } = payment ? getDisplayReferenceCode(payment) : { refCode: '' };

    const handleConfirm = async () => {
        try {
            await onConfirm({
                paymentIndex,
                revertRejection: isRejectionRevert,
            });
            onClose();
        } catch {
            // Handled by caller
        }
    };

    if (!renderModal) return null;

    return (
        <Modal
            visible={renderModal}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={[styles.overlay, isWideScreen ? styles.overlayDialog : styles.overlaySheet]}>
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>
                <Animated.View
                    style={[
                        styles.container,
                        isWideScreen ? styles.containerDialog : styles.containerSheet,
                        !isWideScreen && keyboardHeight > 0 && { paddingBottom: keyboardHeight },
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
                    <View style={[
                        styles.modalSurface,
                        isWideScreen ? styles.surfaceDialog : styles.surfaceSheet,
                        {
                            paddingBottom: !isWideScreen && keyboardHeight > 0 ? 12 : (isMobile ? Math.max(insets.bottom, 16) : 20),
                            maxHeight: isWideScreen
                                ? SCREEN_HEIGHT * 0.85
                                : keyboardHeight > 0
                                ? Math.max(220, SCREEN_HEIGHT - insets.top - keyboardHeight - 16)
                                : SCREEN_HEIGHT * 0.90,
                        }
                    ]}>
                        {/* Drag Handle on Mobile */}
                        {isMobile && <View style={styles.dragHandle} />}

                        {/* Header */}
                        <View style={styles.headerRow}>
                            <View style={styles.headerTitleGroup}>
                                <View style={styles.iconBadge}>
                                    <CustomIcon library="Feather" name="rotate-ccw" size={18} color="#D97706" />
                                </View>
                                <View>
                                    <CustomText style={styles.modalTitle}>
                                        {isRejectionRevert ? 'Undo Receipt Rejection' : 'Revert Payment Verification'}
                                    </CustomText>
                                    <CustomText style={styles.modalSubtitle}>
                                        Booking #{booking.id.slice(-6).toUpperCase()}
                                    </CustomText>
                                </View>
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={onClose}
                                style={styles.closeButton}
                                disabled={isSubmitting}
                            >
                                <CustomIcon library="Feather" name="x" size={20} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* Scrollable Body Content */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={[
                                styles.scrollBody,
                                !isWideScreen && keyboardHeight > 0 && {
                                    maxHeight: Math.max(160, SCREEN_HEIGHT - insets.top - keyboardHeight - 180),
                                }
                            ]}
                            contentContainerStyle={[
                                styles.bodyContent,
                                !isWideScreen && keyboardHeight > 0 && { paddingBottom: 28 }
                            ]}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Excess Disbursed Danger Banner */}
                            {!isRejectionRevert && Boolean(booking.overpayment && (booking.overpayment.adminRefundReceiptUrl || booking.overpayment.status !== 'completed')) && (
                                <View style={[styles.warningBanner, styles.dangerBanner]}>
                                    <CustomIcon library="Feather" name="alert-octagon" size={18} color={Colors.ERROR} style={{ marginTop: 2 }} />
                                    <View style={{ flex: 1 }}>
                                        <CustomText style={[styles.warningTitle, { color: Colors.ERROR }]}>
                                            Caution: Excess Refund In Progress
                                        </CustomText>
                                        <CustomText style={[styles.warningText, { color: Colors.ERROR }]}>
                                            An excess refund of ₱{(booking.overpayment?.excessAmount || 0).toFixed(2)} has already been {booking.overpayment?.adminRefundReceiptUrl ? 'uploaded/disbursed' : 'initiated'} for this payment. Reverting will reset the hike payment to pending, but the refund record must be manually reconciled.
                                        </CustomText>
                                    </View>
                                </View>
                            )}

                            {/* Warning Banner */}
                            <View style={styles.warningBanner}>
                                <CustomIcon library="Feather" name="alert-triangle" size={16} color="#B45309" style={{ marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                    <CustomText style={styles.warningTitle}>
                                        {isRejectionRevert ? 'Undo Rejection' : 'Reversion Notice'}
                                    </CustomText>
                                    <CustomText style={styles.warningText}>
                                        {isRejectionRevert
                                            ? 'Reverting will clear the rejection notice and return the hiker’s payment receipt to "Pending Verification" so you can review and verify it.'
                                            : `Reverting will reset this payment of ₱${paymentAmount.toFixed(2)} back to Pending. The booking status will be adjusted and balance restored to ₱${balanceAfterRevert.toFixed(2)}.`}
                                    </CustomText>
                                </View>
                            </View>

                            {/* Payment Summary Info Card */}
                            {!isRejectionRevert && payment && (
                                <View style={styles.detailsCard}>
                                    <View style={styles.detailsRow}>
                                        <CustomText style={styles.detailLabel}>Payment to Revert:</CustomText>
                                        <CustomText style={styles.detailValueBold}>₱{paymentAmount.toFixed(2)}</CustomText>
                                    </View>
                                    {Boolean(refCode) && (
                                        <View style={styles.detailsRow}>
                                            <CustomText style={styles.detailLabel}>Reference Code:</CustomText>
                                            <CustomText style={styles.detailValue}>{refCode}</CustomText>
                                        </View>
                                    )}
                                    {Boolean(payment.paidAt || payment.createdAt) && (
                                        <View style={styles.detailsRow}>
                                            <CustomText style={styles.detailLabel}>Paid At:</CustomText>
                                            <CustomText style={styles.detailValue}>
                                                {formatDateTime(payment.paidAt || payment.createdAt)}
                                            </CustomText>
                                        </View>
                                    )}
                                    <View style={styles.detailsDivider} />
                                    <View style={styles.detailsRow}>
                                        <CustomText style={styles.detailLabel}>New Balance After Revert:</CustomText>
                                        <CustomText style={[styles.detailValueBold, { color: Colors.PRIMARY }]}>
                                            ₱{balanceAfterRevert.toFixed(2)}
                                        </CustomText>
                                    </View>
                                </View>
                            )}

                            {isRejectionRevert && booking.paymentRejectionReason && (
                                <View style={styles.detailsCard}>
                                    <CustomText style={styles.detailLabel}>Previous Rejection Reason:</CustomText>
                                    <CustomText style={[styles.detailValue, { marginTop: 4, fontStyle: 'italic' }]}>
                                        &quot;{booking.paymentRejectionReason}&quot;
                                    </CustomText>
                                </View>
                            )}


                        </ScrollView>

                        {/* Actions Row */}
                        <View style={styles.actionRow}>
                            <View style={styles.btnWrapper}>
                                <CustomButton
                                    title="Cancel"
                                    variant="outline"
                                    onPress={onClose}
                                    disabled={resolvedIsSubmitting}
                                    style={styles.actionBtn}
                                />
                            </View>
                            <View style={styles.btnWrapper}>
                                <CustomButton
                                    title={isRejectionRevert ? 'Revert to Pending' : 'Confirm Revert'}
                                    variant={isRejectionRevert ? 'primary' : 'destructive'}
                                    icon="rotate-ccw"
                                    iconLibrary="Feather"
                                    onPress={handleConfirm}
                                    isLoading={resolvedIsSubmitting}
                                    style={styles.actionBtn}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    overlay: {
        flex: 1,
        alignItems: 'center',
    },
    overlayDialog: {
        justifyContent: 'center',
    },
    overlaySheet: {
        justifyContent: 'flex-end',
    },
    container: {
        width: '100%',
        alignItems: 'center',
    },
    containerDialog: {
        maxWidth: 480,
        paddingHorizontal: 16,
    },
    containerSheet: {
        width: '100%',
        justifyContent: 'flex-end',
    },
    modalSurface: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        ...GlobalStyles.dropShadow(5),
    },
    surfaceDialog: {
        borderRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.85,
        overflow: 'hidden',
    },
    surfaceSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.90,
    },
    dragHandle: {
        width: 38,
        height: 4,
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
    },
    headerTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -0.2,
    },
    modalSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    closeButton: {
        padding: 6,
        borderRadius: 8,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    scrollBody: {
        flexShrink: 1,
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
    },
    warningBanner: {
        flexDirection: 'row',
        gap: 10,
        padding: 12,
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    dangerBanner: {
        backgroundColor: Colors.ERROR_BG,
        borderColor: Colors.ERROR_BORDER,
    },
    warningTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 3,
    },
    warningText: {
        fontSize: 12,
        lineHeight: 17,
        color: '#78350F',
    },
    detailsCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    detailValue: {
        fontSize: 12.5,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    detailValueBold: {
        fontSize: 13.5,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    detailsDivider: {
        height: 1,
        backgroundColor: '#CBD5E1',
        marginVertical: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    btnWrapper: {
        flex: 1,
    },
    actionBtn: {
        width: '100%',
    },
});
