/**
 * @file AdminRefundModal.tsx
 * @description An adaptive, responsive modal allowing admins to select between 100% full refund, 10% partial refund, or a custom refund amount.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { toDateOrNull } from '@/src/core/utility/date';

export type RefundType = 'full' | 'partial' | 'custom';

/**
 * Props for AdminRefundModal component.
 * @param visible - Controls visibility of the modal dialog.
 * @param onClose - Callback invoked when closing the dialog.
 * @param onSelect - Callback when a refund type selection is made.
 * @param amountPaid - Total amount paid by the hiker to calculate refund percentages.
 * @param isLoading - Optional loading state when refund processing is in flight.
 * @param paymentCapturedAt - Optional timestamp when the payment was captured, used for same-day gateway rules.
 */
export interface AdminRefundModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (refundType: RefundType, customAmount?: number) => void;
    amountPaid?: number;
    isLoading?: boolean;
    paymentCapturedAt?: Date | string | null;
}

/**
 * AdminRefundModal — An adaptive modal to select full, standard partial, or custom refund.
 */
const AdminRefundModal: React.FC<AdminRefundModalProps> = ({ 
    visible, 
    onClose, 
    onSelect, 
    amountPaid = 0,
    isLoading = false,
    paymentCapturedAt = null
}) => {
    const fullRefundAmount = amountPaid;
    const partialRefundAmount = Math.round(amountPaid * 0.10 * 100) / 100;

    const { width } = useWindowDimensions();
    const isDesktop = width >= 768 || Platform.OS === 'web';
    const scrollViewRef = useRef<ScrollView>(null);

    const [selectedType, setSelectedType] = useState<RefundType>('full');
    const [customAmountText, setCustomAmountText] = useState<string>('');
    const [inputError, setInputError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const isSubmittingRef = useRef<boolean>(false);

    // Check if the payment was captured on the same calendar day
    const isCapturedToday = useMemo(() => {
        if (!paymentCapturedAt) return false;
        const captured = toDateOrNull(paymentCapturedAt);
        if (!captured) return false;
        const now = new Date();
        return (
            captured.getFullYear() === now.getFullYear() &&
            captured.getMonth() === now.getMonth() &&
            captured.getDate() === now.getDate()
        );
    }, [paymentCapturedAt]);

    // Reset internal state whenever modal opens
    useEffect(() => {
        if (visible) {
            setSelectedType('full');
            setCustomAmountText('');
            setInputError(null);
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    }, [visible]);

    const parsedCustomAmount = parseFloat(customAmountText) || 0;

    const handleCustomAmountChange = (text: string) => {
        // Allow only digits and a single decimal point
        const sanitized = text.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        setCustomAmountText(clean);

        const val = parseFloat(clean);
        if (!clean) {
            setInputError(null);
        } else if (isNaN(val) || val < 1.00) {
            setInputError('Minimum refund amount is ₱1.00');
        } else if (val > amountPaid) {
            setInputError(`Amount cannot exceed total paid (₱${amountPaid.toFixed(2)})`);
        } else if (isCapturedToday && val < amountPaid) {
            setInputError(`PayMongo Policy: Same-day payments cannot be partially refunded. You can issue a 100% full refund today (₱${amountPaid.toFixed(2)}) or wait until tomorrow.`);
        } else {
            setInputError(null);
        }
    };

    const handlePresetChip = (percentage: number) => {
        const val = Math.round((amountPaid * (percentage / 100)) * 100) / 100;
        setCustomAmountText(val.toFixed(2));
        if (isCapturedToday && val < amountPaid) {
            setInputError(`PayMongo Policy: Same-day payments cannot be partially refunded. You can issue a 100% full refund today (₱${amountPaid.toFixed(2)}) or wait until tomorrow.`);
        } else {
            setInputError(null);
        }
    };

    const handleConfirm = (type: RefundType) => {
        if (isSubmittingRef.current || isSubmitting || isLoading) return;

        if (type === 'partial' && isCapturedToday) {
            setInputError('PayMongo Policy: Partial refunds cannot be processed on the same calendar day the payment was captured. Please issue a 100% full refund today, or wait until tomorrow after daily settlement.');
            return;
        }

        if (type === 'custom') {
            if (isNaN(parsedCustomAmount) || parsedCustomAmount < 1.00) {
                setInputError('Minimum refund amount is ₱1.00');
                return;
            }
            if (parsedCustomAmount > amountPaid) {
                setInputError(`Amount cannot exceed total paid (₱${amountPaid.toFixed(2)})`);
                return;
            }
            if (isCapturedToday && parsedCustomAmount < amountPaid) {
                setInputError(`PayMongo Policy: Same-day payments cannot be partially refunded. Please enter ₱${amountPaid.toFixed(2)} for a full refund or wait until tomorrow.`);
                return;
            }
            isSubmittingRef.current = true;
            setIsSubmitting(true);
            onSelect('custom', parsedCustomAmount);
        } else {
            isSubmittingRef.current = true;
            setIsSubmitting(true);
            onSelect(type);
        }
    };

    const customPercentage = amountPaid > 0 && parsedCustomAmount > 0
        ? Math.min(100, Math.round((parsedCustomAmount / amountPaid) * 100))
        : 0;

    const isCustomDisabled = isSubmitting || isLoading || !!inputError || parsedCustomAmount < 1.00 || parsedCustomAmount > amountPaid || (isCapturedToday && parsedCustomAmount < amountPaid);

    return (
        <Modal 
            transparent={true} 
            visible={visible} 
            animationType="fade" 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={[styles.overlay, isDesktop && styles.overlayDesktop]} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View 
                    style={[
                        styles.bottomSheetWrapper, 
                        isDesktop && styles.bottomSheetWrapperDesktop
                    ]}
                >
                    <TouchableOpacity 
                        activeOpacity={1} 
                        style={[
                            styles.bottomSheet, 
                            isDesktop && styles.bottomSheetDesktop
                        ]}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
                            style={styles.keyboardAvoid}
                        >
                            <ScrollView 
                                ref={scrollViewRef}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="interactive"
                                automaticallyAdjustKeyboardInsets={true}
                                showsVerticalScrollIndicator={false} 
                                contentContainerStyle={styles.scrollContent}
                            >
                                <View style={styles.headerRow}>
                                    <CustomText variant="h2" style={styles.title}>
                                        Select Refund Amount
                                    </CustomText>
                                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isSubmitting || isLoading}>
                                        <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_SECONDARY} />
                                    </TouchableOpacity>
                                </View>

                                <CustomText variant="caption" style={styles.subtitle}>
                                    Please choose the appropriate refund policy or enter a custom amount for this cancellation.
                                </CustomText>

                                {/* Option 1: Full Refund (100%) */}
                                <TouchableOpacity 
                                    style={[
                                        styles.optionCard,
                                        selectedType === 'full' && styles.optionCardSelected
                                    ]} 
                                    onPress={() => {
                                        setSelectedType('full');
                                        handleConfirm('full');
                                    }}
                                    disabled={isSubmitting || isLoading}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrapper, { backgroundColor: Colors.STATUS_APPROVED_BG }]}>
                                        <CustomIcon library="Feather" name="refresh-ccw" size={20} color={Colors.STATUS_APPROVED_TEXT} />
                                    </View>
                                    
                                    <View style={styles.optionContent}>
                                        <CustomText variant="body" style={styles.optionLabel}>
                                            Full Refund (100%)
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.optionSubLabel}>
                                            Return the entire amount paid.
                                        </CustomText>
                                    </View>
                                    
                                    <CustomText variant="h3" style={styles.amountText}>
                                        ₱{fullRefundAmount.toFixed(2)}
                                    </CustomText>
                                </TouchableOpacity>

                                {/* Option 2: Partial Refund (10%) */}
                                <TouchableOpacity 
                                    style={[
                                        styles.optionCard,
                                        selectedType === 'partial' && styles.optionCardSelected
                                    ]} 
                                    onPress={() => {
                                        setSelectedType('partial');
                                        if (isCapturedToday) {
                                            setInputError('PayMongo Policy: Partial refunds (< 100%) cannot be processed on the same calendar day. You may issue a 100% full refund today, or wait until tomorrow after daily settlement.');
                                        } else {
                                            handleConfirm('partial');
                                        }
                                    }}
                                    disabled={isSubmitting || isLoading}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrapper, { backgroundColor: Colors.STATUS_WARNING_BG }]}>
                                        <CustomIcon library="Feather" name="pie-chart" size={20} color={Colors.STATUS_WARNING_TEXT} />
                                    </View>

                                    <View style={styles.optionContent}>
                                        <View style={styles.optionTitleRow}>
                                            <CustomText variant="body" style={styles.optionLabel}>
                                                Partial Refund (10%)
                                            </CustomText>
                                            {isCapturedToday && (
                                                <View style={styles.sameDayBadge}>
                                                    <CustomIcon library="Feather" name="clock" size={11} color="#B45309" />
                                                    <CustomText style={styles.sameDayBadgeText}>Available Tomorrow</CustomText>
                                                </View>
                                            )}
                                        </View>
                                        <CustomText variant="caption" style={styles.optionSubLabel}>
                                            Standard cancellation policy.
                                        </CustomText>
                                    </View>
                                    
                                    <CustomText variant="h3" style={styles.amountText}>
                                        ₱{partialRefundAmount.toFixed(2)}
                                    </CustomText>
                                </TouchableOpacity>

                                {/* Same-Day Warning Box for Partial Refund */}
                                {selectedType === 'partial' && isCapturedToday && (
                                    <View style={styles.sameDayWarningBox}>
                                        <CustomIcon library="Feather" name="alert-triangle" size={16} color="#B45309" />
                                        <CustomText style={styles.sameDayWarningText}>
                                            PayMongo Policy: This payment was captured today. The gateway requires payments to settle overnight before partial refunds can be processed. You can issue a 100% Full Refund today, or wait until tomorrow after gateway settlement.
                                        </CustomText>
                                    </View>
                                )}

                                {/* Option 3: Custom Amount */}
                                <TouchableOpacity 
                                    style={[
                                        styles.optionCard,
                                        selectedType === 'custom' && styles.optionCardSelected,
                                        { marginBottom: selectedType === 'custom' ? 8 : 12 }
                                    ]} 
                                    onPress={() => {
                                        setSelectedType('custom');
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                        }, 150);
                                    }}
                                    disabled={isSubmitting || isLoading}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconWrapper, { backgroundColor: '#EDE9FE' }]}>
                                        <CustomIcon library="Feather" name="edit-3" size={20} color="#7C3AED" />
                                    </View>

                                    <View style={styles.optionContent}>
                                        <CustomText variant="body" style={styles.optionLabel}>
                                            Custom Amount
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.optionSubLabel}>
                                            Specify exact refund sum or percentage.
                                        </CustomText>
                                    </View>

                                    <CustomIcon 
                                        library="Feather" 
                                        name={selectedType === 'custom' ? 'chevron-up' : 'chevron-down'} 
                                        size={20} 
                                        color={Colors.TEXT_SECONDARY} 
                                    />
                                </TouchableOpacity>

                                {/* Custom Amount Expanded Container */}
                                {selectedType === 'custom' && (
                                    <View style={styles.customContainer}>
                                        {/* Preset Chips */}
                                        <View style={styles.chipsRow}>
                                            <TouchableOpacity 
                                                style={styles.chip} 
                                                onPress={() => handlePresetChip(25)}
                                                activeOpacity={0.7}
                                            >
                                                <CustomText style={styles.chipText}>25%</CustomText>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.chip} 
                                                onPress={() => handlePresetChip(50)}
                                                activeOpacity={0.7}
                                            >
                                                <CustomText style={styles.chipText}>50%</CustomText>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.chip} 
                                                onPress={() => handlePresetChip(75)}
                                                activeOpacity={0.7}
                                            >
                                                <CustomText style={styles.chipText}>75%</CustomText>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Input Field */}
                                        <View style={[styles.inputWrapper, inputError ? styles.inputWrapperError : null]}>
                                            <CustomText style={styles.currencyPrefix}>₱</CustomText>
                                            <TextInput
                                                style={styles.textInput}
                                                value={customAmountText}
                                                onChangeText={handleCustomAmountChange}
                                                placeholder="0.00"
                                                placeholderTextColor={Colors.TEXT_SECONDARY}
                                                keyboardType="decimal-pad"
                                                editable={!isSubmitting && !isLoading}
                                                onFocus={() => {
                                                    setTimeout(() => {
                                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                                    }, Platform.OS === 'android' ? 200 : 100);
                                                }}
                                            />
                                            {parsedCustomAmount > 0 && (
                                                <View style={styles.percentageBadge}>
                                                    <CustomText style={styles.percentageBadgeText}>
                                                        {customPercentage}%
                                                    </CustomText>
                                                </View>
                                            )}
                                        </View>

                                        {/* Error or Calculation Breakdown */}
                                        {inputError ? (
                                            <CustomText style={styles.errorText}>
                                                {inputError}
                                            </CustomText>
                                        ) : parsedCustomAmount > 0 ? (
                                            <CustomText style={styles.breakdownText}>
                                                ₱{parsedCustomAmount.toFixed(2)} will be refunded ({customPercentage}% of ₱{amountPaid.toFixed(2)})
                                            </CustomText>
                                        ) : null}

                                        {/* PayMongo Gateway Warning Box */}
                                        <View style={styles.warningBox}>
                                            <CustomIcon library="Feather" name="info" size={16} color="#B45309" />
                                            <CustomText style={styles.warningText}>
                                                {isCapturedToday
                                                    ? "Note: This payment was captured today. PayMongo requires payments to settle overnight before partial refunds can be processed. Only 100% Full Refunds are available today."
                                                    : "Note: PayMongo gateway does not allow partial refunds on the same calendar day the payment was captured."
                                                }
                                            </CustomText>
                                        </View>

                                        {/* Custom Confirm Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.confirmBtn,
                                                isCustomDisabled && styles.confirmBtnDisabled
                                            ]}
                                            onPress={() => handleConfirm('custom')}
                                            disabled={isCustomDisabled}
                                            activeOpacity={0.8}
                                        >
                                            {isSubmitting || isLoading ? (
                                                <ActivityIndicator size="small" color={Colors.WHITE} />
                                            ) : (
                                                <CustomText style={styles.confirmBtnText}>
                                                    Confirm Refund of ₱{parsedCustomAmount > 0 ? parsedCustomAmount.toFixed(2) : '0.00'}
                                                </CustomText>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    overlayDesktop: {
        justifyContent: 'center',
        padding: 20,
    },
    bottomSheetWrapper: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        maxHeight: '92%',
    },
    bottomSheetWrapperDesktop: {
        maxWidth: 520,
        maxHeight: '85%',
        alignSelf: 'center',
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 36,
        width: '100%',
        maxHeight: '100%',
    },
    bottomSheetDesktop: {
        borderRadius: 24,
        paddingBottom: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(5),
    },
    keyboardAvoid: {
        width: '100%',
        maxHeight: '100%',
    },
    scrollContent: {
        paddingBottom: 20,
        flexGrow: 0,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 20,
    },
    closeBtn: {
        padding: 4,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    optionCardSelected: {
        borderColor: Colors.PRIMARY,
        backgroundColor: '#F8FAFC',
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
        paddingRight: 8,
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 4,
    },
    optionLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    sameDayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    sameDayBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309',
    },
    sameDayWarningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    sameDayWarningText: {
        flex: 1,
        color: '#92400E',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
    },
    optionSubLabel: {
        color: Colors.TEXT_SECONDARY,
    },
    amountText: {
        color: Colors.ERROR,
        fontWeight: '700',
    },
    customContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'center',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 12,
        height: 52,
    },
    inputWrapperError: {
        borderColor: Colors.ERROR,
    },
    currencyPrefix: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginRight: 6,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        paddingVertical: 0,
    },
    percentageBadge: {
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    percentageBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#7C3AED',
    },
    errorText: {
        color: Colors.ERROR,
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
    breakdownText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        marginTop: 6,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        padding: 10,
        marginTop: 12,
        marginBottom: 14,
        gap: 8,
    },
    warningText: {
        flex: 1,
        color: '#92400E',
        fontSize: 11,
        lineHeight: 15,
    },
    confirmBtn: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDisabled: {
        opacity: 0.5,
    },
    confirmBtnText: {
        color: Colors.WHITE,
        fontSize: 15,
        fontWeight: '700',
    },
});

export default AdminRefundModal;
