/**
 * @file AdminEditPaymentModal.tsx
 * @description Responsive modal allowing admins to edit verified manual payment details,
 * including verified amount, reference code, classification, and admin notes.
 * Supports both desktop centered dialog and mobile bottom sheet surfaces.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
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
import CustomTextInput, { stripEmojis } from '@/src/components/CustomTextInput';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { sanitizeCurrencyInput } from '@/src/features/Admin/screens/Booking/components/ManualQRVerificationCard';
import { getDisplayReferenceCode } from '@/src/features/Admin/utils/paymentUtils';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AdminEditPaymentModalProps {
    visible: boolean;
    onClose: () => void;
    payment: IPayment<Date> | null;
    paymentIndex?: number;
    booking: Booking;
    onConfirm?: (options: {
        paymentIndex?: number;
        newAmount: number;
        newReferenceCode: string;
        newClassification: 'full' | 'downpayment';
        newAdminNote?: string;
    }) => Promise<void> | void;
    onSubmit?: (options: {
        paymentIndex?: number;
        newAmount: number;
        newReferenceCode: string;
        newClassification: 'full' | 'downpayment';
        newAdminNote?: string;
    }) => Promise<void> | void;
    isSubmitting?: boolean;
    isProcessing?: boolean;
}

export const AdminEditPaymentModal: React.FC<AdminEditPaymentModalProps> = ({
    visible,
    onClose,
    payment,
    paymentIndex,
    booking,
    onConfirm,
    onSubmit,
    isSubmitting = false,
    isProcessing = false,
}) => {
    const insets = useSafeAreaInsets();
    const resolvedIsSubmitting = isSubmitting || isProcessing;
    const resolvedOnConfirm = onSubmit || onConfirm;
    const { isMobile, isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;
    const { showToast } = useToast();

    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

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

    const [amountInput, setAmountInput] = useState<string>('');
    const [referenceCode, setReferenceCode] = useState<string>('');
    const [classification, setClassification] = useState<'full' | 'downpayment'>('full');
    const [adminNote, setAdminNote] = useState<string>('');
    const [trackedPayment, setTrackedPayment] = useState<IPayment<Date> | null>(null);

    // Pre-populate fields whenever payment changes or modal becomes visible
    if (visible && payment && payment !== trackedPayment) {
        setTrackedPayment(payment);
        const { refCode, note } = getDisplayReferenceCode(payment);
        setAmountInput(payment.amount ? String(payment.amount) : '');
        setReferenceCode(refCode && refCode !== 'Verified by Admin' && refCode !== 'Onsite Cash' ? refCode : (payment.referenceCode || ''));
        setClassification(payment.classification || 'full');
        setAdminNote(note || payment.adminNote || '');
    }

    const totalPrice = booking.offer?.price || 0;
    const payments = booking.payment || [];

    // Calculate sum of other captured payments
    const otherCaptured = payments.reduce((sum, p, idx) => {
        const isThisPayment = (typeof paymentIndex === 'number' && idx === paymentIndex) || (p === payment);
        if (!isThisPayment && p.status === 'captured') {
            return sum + (p.amount || 0);
        }
        return sum;
    }, 0);

    const neededBalanceForThis = Math.max(0, totalPrice - otherCaptured);
    const parsedAmount = parseFloat(amountInput);
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
    const isOverpaid = isValidAmount && parsedAmount > neededBalanceForThis;
    const excessAmount = isOverpaid ? parsedAmount - neededBalanceForThis : 0;
    const approvedAmount = isOverpaid ? neededBalanceForThis : (isValidAmount ? parsedAmount : 0);
    const resultingRemaining = Math.max(0, neededBalanceForThis - approvedAmount);
    const isFullSettlement = isOverpaid || resultingRemaining === 0 || (classification === 'full' && approvedAmount >= neededBalanceForThis);

    const handleSubmit = async () => {
        if (!isValidAmount) {
            showToast.error('Please enter a valid payment amount.');
            return;
        }

        if (!referenceCode.trim()) {
            showToast.error('Reference number is required.');
            return;
        }

        const maxAllowedLimit = Math.max(totalPrice * 10, 100000);
        if (parsedAmount > maxAllowedLimit) {
            showToast.error('Entered amount exceeds maximum allowed limit. Please check for extra zeros.');
            return;
        }

        try {
            if (resolvedOnConfirm) {
                await resolvedOnConfirm({
                    paymentIndex,
                    newAmount: parsedAmount,
                    newReferenceCode: referenceCode.trim(),
                    newClassification: isFullSettlement ? 'full' : classification,
                    newAdminNote: adminNote.trim() || undefined,
                });
            }
            onClose();
        } catch {
            // Error handling is handled in caller or toast
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType={isMobile ? 'slide' : 'fade'}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={[styles.overlay, isWideScreen ? styles.overlayDialog : styles.overlaySheet]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View
                    style={[
                        styles.container,
                        isWideScreen ? styles.containerDialog : styles.containerSheet,
                        !isWideScreen && keyboardHeight > 0 && { paddingBottom: keyboardHeight },
                    ]}
                >
                    <View style={[
                        styles.modalSurface,
                        isWideScreen ? styles.surfaceDialog : styles.surfaceSheet,
                        {
                            paddingBottom: !isWideScreen && keyboardHeight > 0 ? 12 : (isMobile ? Math.max(insets.bottom, 16) : 20),
                            maxHeight: isWideScreen
                                ? SCREEN_HEIGHT * 0.88
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
                                    <CustomIcon library="Feather" name="edit-3" size={18} color={Colors.PRIMARY} />
                                </View>
                                <View>
                                    <CustomText style={styles.modalTitle}>Edit Payment Verification</CustomText>
                                    <CustomText style={styles.modalSubtitle}>
                                        Booking #{booking.id.slice(-6).toUpperCase()} · Total ₱{totalPrice.toFixed(2)}
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

                        {/* Scrollable Form Body */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={[
                                styles.scrollBody,
                                !isWideScreen && keyboardHeight > 0 && {
                                    maxHeight: Math.max(160, SCREEN_HEIGHT - insets.top - keyboardHeight - 180),
                                }
                            ]}
                            contentContainerStyle={[
                                styles.scrollContent,
                                !isWideScreen && keyboardHeight > 0 && { paddingBottom: 28 }
                            ]}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Balance Context Card */}
                            <View style={styles.contextCard}>
                                <View style={styles.contextItem}>
                                    <CustomText style={styles.contextLabel}>Total Price</CustomText>
                                    <CustomText style={styles.contextValue}>₱{totalPrice.toFixed(2)}</CustomText>
                                </View>
                                <View style={styles.contextDividerVertical} />
                                <View style={styles.contextItem}>
                                    <CustomText style={styles.contextLabel}>Other Paid</CustomText>
                                    <CustomText style={styles.contextValue}>₱{otherCaptured.toFixed(2)}</CustomText>
                                </View>
                                <View style={styles.contextDividerVertical} />
                                <View style={styles.contextItem}>
                                    <CustomText style={styles.contextLabel}>Needed for Hike</CustomText>
                                    <CustomText style={[styles.contextValue, { color: Colors.PRIMARY }]}>
                                        ₱{neededBalanceForThis.toFixed(2)}
                                    </CustomText>
                                </View>
                            </View>

                            {/* Amount Input */}
                            <CustomTextInput
                                label="Verified Amount (₱) *"
                                placeholder="Enter updated amount..."
                                type="numerical"
                                prefix="₱ "
                                maxLength={10}
                                sanitizeText={sanitizeCurrencyInput}
                                value={amountInput}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                    }, 150);
                                }}
                                onChangeText={(val: string) => setAmountInput(sanitizeCurrencyInput(String(val || '')))}
                            />

                            {/* Reference Number */}
                            <CustomTextInput
                                label="REF Code *"
                                placeholder="e.g. GCash / Maya Ref Code"
                                value={referenceCode}
                                maxLength={60}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollTo({ y: 120, animated: true });
                                    }, 150);
                                }}
                                sanitizeText={(text) => stripEmojis(text).replace(/[\x00-\x1F\x7F]/g, '')}
                                onChangeText={(val: string) => setReferenceCode(stripEmojis(String(val || '')).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 60))}
                            />

                            {/* Classification Selector */}
                            <View style={styles.fieldGroup}>
                                <CustomText style={styles.fieldLabel}>Payment Classification</CustomText>
                                <View style={styles.classificationRow}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={[
                                            styles.classificationOption,
                                            classification === 'downpayment' && styles.classificationOptionActive
                                        ]}
                                        onPress={() => setClassification('downpayment')}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name="pie-chart"
                                            size={14}
                                            color={classification === 'downpayment' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText style={[
                                            styles.classificationOptionText,
                                            classification === 'downpayment' && styles.classificationOptionTextActive
                                        ]}>
                                            Downpayment
                                        </CustomText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={[
                                            styles.classificationOption,
                                            classification === 'full' && styles.classificationOptionActive
                                        ]}
                                        onPress={() => setClassification('full')}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name="check-circle"
                                            size={14}
                                            color={classification === 'full' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText style={[
                                            styles.classificationOptionText,
                                            classification === 'full' && styles.classificationOptionTextActive
                                        ]}>
                                            Full Payment
                                        </CustomText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Admin Note Input */}
                            <CustomTextInput
                                label="Admin Note (Optional)"
                                placeholder="e.g. Adjusted amount after checking GCash statement..."
                                value={adminNote}
                                maxLength={140}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 150);
                                }}
                                sanitizeText={(text) => stripEmojis(text).replace(/[\x00-\x1F\x7F]/g, '')}
                                onChangeText={(val: string) => setAdminNote(stripEmojis(String(val || '')).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 140))}
                            />

                            {/* Live calculation feedback banner */}
                            {isValidAmount && (
                                <View style={[
                                    styles.calcFeedbackBox,
                                    isOverpaid
                                        ? styles.calcFeedbackOverpaid
                                        : (isFullSettlement ? styles.calcFeedbackFull : styles.calcFeedbackPartial)
                                ]}>
                                    <CustomIcon
                                        library="Feather"
                                        name={isOverpaid ? "alert-triangle" : (isFullSettlement ? "check-circle" : "info")}
                                        size={14}
                                        color={isOverpaid ? '#D97706' : (isFullSettlement ? Colors.SUCCESS : Colors.STATUS_DOWNPAYMENT_TEXT)}
                                        style={{ marginTop: 2 }}
                                    />
                                    <CustomText style={[
                                        styles.calcFeedbackText,
                                        { color: isOverpaid ? '#D97706' : (isFullSettlement ? Colors.SUCCESS : Colors.STATUS_DOWNPAYMENT_TEXT) }
                                    ]}>
                                        {isOverpaid
                                            ? `Overpayment Detected: ₱${parsedAmount.toFixed(2)} exceeds ₱${neededBalanceForThis.toFixed(2)} balance needed. ₱${excessAmount.toFixed(2)} excess refund will be recorded.`
                                            : (isFullSettlement
                                                ? `Full payment verified. Booking will be marked Completed with ₱0.00 remaining balance.`
                                                : `Downpayment recorded. Remaining balance to collect will be ₱${resultingRemaining.toFixed(2)}.`)}
                                    </CustomText>
                                </View>
                            )}
                        </ScrollView>

                        {/* Action Buttons Row */}
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
                                    title="Save Changes"
                                    variant="primary"
                                    onPress={handleSubmit}
                                    isLoading={resolvedIsSubmitting}
                                    disabled={!isValidAmount || !referenceCode.trim()}
                                    style={styles.actionBtn}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
        maxWidth: 520,
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
        maxHeight: SCREEN_HEIGHT * 0.88,
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
        backgroundColor: '#ECFDF5',
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
        maxHeight: SCREEN_HEIGHT * 0.58,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
    },
    contextCard: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    contextItem: {
        flex: 1,
        alignItems: 'center',
    },
    contextLabel: {
        fontSize: 10.5,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    contextValue: {
        fontSize: 13.5,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    contextDividerVertical: {
        width: 1,
        height: 24,
        backgroundColor: '#CBD5E1',
    },
    fieldGroup: {
        gap: 6,
    },
    fieldLabel: {
        fontSize: 12.5,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    classificationRow: {
        flexDirection: 'row',
        gap: 10,
    },
    classificationOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    classificationOptionActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: '#F0FDF4',
    },
    classificationOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    classificationOptionTextActive: {
        color: Colors.PRIMARY,
        fontWeight: '700',
    },
    calcFeedbackBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    calcFeedbackFull: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    calcFeedbackPartial: {
        backgroundColor: '#F8FAFC',
        borderColor: '#CBD5E1',
    },
    calcFeedbackOverpaid: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    calcFeedbackText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '500',
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
