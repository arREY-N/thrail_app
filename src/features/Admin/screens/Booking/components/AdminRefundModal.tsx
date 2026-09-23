/**
 * @file AdminRefundModal.tsx
 * @description A bottom-sheet modal allowing admins to select between 100% full refund, 10% partial refund, or a custom refund amount.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';

export type RefundType = 'full' | 'partial' | 'custom';

/**
 * Props for AdminRefundModal component.
 * @param visible - Controls visibility of the modal dialog.
 * @param onClose - Callback invoked when closing the dialog.
 * @param onSelect - Callback when a refund type selection is made.
 * @param amountPaid - Total amount paid by the hiker to calculate refund percentages.
 * @param isLoading - Optional loading state when refund processing is in flight.
 */
export interface AdminRefundModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (refundType: RefundType, customAmount?: number) => void;
    amountPaid?: number;
    isLoading?: boolean;
}

/**
 * AdminRefundModal — A modal to select full, standard partial, or custom refund.
 */
const AdminRefundModal: React.FC<AdminRefundModalProps> = ({ 
    visible, 
    onClose, 
    onSelect, 
    amountPaid = 0,
    isLoading = false
}) => {
    const fullRefundAmount = amountPaid;
    const partialRefundAmount = Math.round(amountPaid * 0.10 * 100) / 100;

    const [selectedType, setSelectedType] = useState<RefundType>('full');
    const [customAmountText, setCustomAmountText] = useState<string>('');
    const [inputError, setInputError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const isSubmittingRef = useRef<boolean>(false);

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
        } else {
            setInputError(null);
        }
    };

    const handlePresetChip = (percentage: number) => {
        const val = Math.round((amountPaid * (percentage / 100)) * 100) / 100;
        setCustomAmountText(val.toFixed(2));
        setInputError(null);
    };

    const handleConfirm = (type: RefundType) => {
        if (isSubmittingRef.current || isSubmitting || isLoading) return;

        if (type === 'custom') {
            if (isNaN(parsedCustomAmount) || parsedCustomAmount < 1.00) {
                setInputError('Minimum refund amount is ₱1.00');
                return;
            }
            if (parsedCustomAmount > amountPaid) {
                setInputError(`Amount cannot exceed total paid (₱${amountPaid.toFixed(2)})`);
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

    const isCustomDisabled = isSubmitting || isLoading || !!inputError || parsedCustomAmount < 1.00 || parsedCustomAmount > amountPaid;

    return (
        <Modal 
            transparent={true} 
            visible={visible} 
            animationType="fade" 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.bottomSheetWrapper}>
                    <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                                    handleConfirm('partial');
                                }}
                                disabled={isSubmitting || isLoading}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconWrapper, { backgroundColor: Colors.STATUS_WARNING_BG }]}>
                                    <CustomIcon library="Feather" name="pie-chart" size={20} color={Colors.STATUS_WARNING_TEXT} />
                                </View>

                                <View style={styles.optionContent}>
                                    <CustomText variant="body" style={styles.optionLabel}>
                                        Partial Refund (10%)
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.optionSubLabel}>
                                        Standard cancellation policy.
                                    </CustomText>
                                </View>
                                
                                <CustomText variant="h3" style={styles.amountText}>
                                    ₱{partialRefundAmount.toFixed(2)}
                                </CustomText>
                            </TouchableOpacity>

                            {/* Option 3: Custom Amount */}
                            <TouchableOpacity 
                                style={[
                                    styles.optionCard,
                                    selectedType === 'custom' && styles.optionCardSelected,
                                    { marginBottom: selectedType === 'custom' ? 8 : 12 }
                                ]} 
                                onPress={() => setSelectedType('custom')}
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
                                            autoFocus={true}
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
                                            Note: PayMongo gateway does not allow partial refunds on the same calendar day the payment was captured.
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
    bottomSheetWrapper: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        maxHeight: '90%',
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        width: '100%',
    },
    scrollContent: {
        paddingBottom: 16,
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
    optionLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
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
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        borderRadius: 12,
        paddingHorizontal: 14,
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
        fontWeight: '600',
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
