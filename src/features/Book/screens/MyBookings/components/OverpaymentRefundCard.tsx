import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { httpsCallable } from 'firebase/functions';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking } from '@/src/core/models/Booking/Booking';
import { functions } from '@/src/core/config/Firebase';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

export interface OverpaymentRefundCardProps {
    booking: Booking;
    onRefresh?: () => void;
}

const OverpaymentRefundCard: React.FC<OverpaymentRefundCardProps> = ({
    booking,
    onRefresh,
}) => {
    const { showToast } = useToast();
    const overpayment = booking.overpayment;
    const status = overpayment?.status;

    // Wallet form states (Strict Zero Pre-Fill Rule)
    const [selectedWallet, setSelectedWallet] = useState<'GCash' | 'Maya'>('GCash');
    const [accountNumber, setAccountNumber] = useState<string>('');
    const [accountName, setAccountName] = useState<string>('');
    const [isSubmittingWallet, setIsSubmittingWallet] = useState<boolean>(false);

    // Handshake states
    const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
    const [isConfirmingReceipt, setIsConfirmingReceipt] = useState<boolean>(false);
    const [isDisputeModalVisible, setIsDisputeModalVisible] = useState<boolean>(false);
    const [disputeReason, setDisputeReason] = useState<string>('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState<boolean>(false);

    // Accordion state (adjust state during render on status changes)
    const [prevStatus, setPrevStatus] = useState<string | undefined>(status);
    const [isExpanded, setIsExpanded] = useState<boolean>(status !== 'completed');

    if (prevStatus !== status) {
        setPrevStatus(status);
        setIsExpanded(status !== 'completed');
    }

    if (!overpayment || !overpayment.excessAmount || overpayment.excessAmount <= 0) {
        return null;
    }

    const {
        excessAmount,
        originalVerifiedAmount,
        hikeAmountCaptured,
        userWallet,
        adminRefundReceiptUrl,
        adminRefundReceiptUploadedAt,
        disputeCount = 0,
        disputeReason: existingDisputeReason,
    } = overpayment;

    const isMaxDisputesReached = disputeCount >= 3;
    const isCompleted = status === 'completed';

    // Handle wallet submission
    const handleSubmitWallet = async () => {
        const cleanNumber = accountNumber.replace(/\D/g, '');
        if (!cleanNumber.startsWith('09') || cleanNumber.length !== 11) {
            showToast.error('Please enter a valid 11-digit mobile number starting with 09.');
            return;
        }

        if (!accountName.trim()) {
            showToast.error('Please enter the account holder name.');
            return;
        }

        setIsSubmittingWallet(true);
        try {
            const submitFn = httpsCallable(functions, 'submitOverpaymentWallet');
            await submitFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                userWallet: {
                    walletType: selectedWallet,
                    accountNumber: cleanNumber,
                    accountName: accountName.trim(),
                },
            });

            showToast.success('Wallet details submitted successfully.');
            if (onRefresh) onRefresh();
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to submit wallet details.');
        } finally {
            setIsSubmittingWallet(false);
        }
    };

    // Handle confirming payout receipt
    const handleConfirmReceipt = async () => {
        setIsConfirmingReceipt(true);
        try {
            const confirmFn = httpsCallable(functions, 'confirmOverpaymentReceived');
            await confirmFn({
                bookingId: booking.id,
                userId: booking.user?.id,
            });

            showToast.success('Excess refund confirmed received. Thank you!');
            if (onRefresh) onRefresh();
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to confirm refund receipt.');
        } finally {
            setIsConfirmingReceipt(false);
        }
    };

    // Handle submitting dispute
    const handleSubmitDispute = async () => {
        if (!disputeReason.trim()) {
            showToast.error('Please describe why the refund was not received.');
            return;
        }

        setIsSubmittingDispute(true);
        try {
            const disputeFn = httpsCallable(functions, 'disputeOverpaymentRefund');
            await disputeFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                disputeReason: disputeReason.trim(),
            });

            showToast.success('Dispute reported to the tour organizer.');
            setIsDisputeModalVisible(false);
            setDisputeReason('');
            if (onRefresh) onRefresh();
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to report dispute.');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    return (
        <View style={[styles.container, isCompleted && styles.containerCompleted]}>
            {/* Header with Excess Amount & Badge */}
            <TouchableOpacity
                style={styles.headerRow}
                onPress={() => setIsExpanded(prev => !prev)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <CustomIcon 
                        library="Feather" 
                        name={isCompleted ? "check-circle" : "alert-circle"} 
                        size={18} 
                        color={isCompleted ? Colors.SUCCESS : "#D97706"} 
                    />
                    <CustomText style={[styles.headerTitle, isCompleted && styles.headerTitleCompleted]}>
                        {isCompleted ? "Overpayment Refund Resolved" : "Overpayment Refund"}
                    </CustomText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.excessBadge, isCompleted && styles.excessBadgeCompleted]}>
                        <CustomText style={[styles.excessBadgeText, isCompleted && styles.excessBadgeTextCompleted]}>
                            {isCompleted ? `₱${excessAmount.toFixed(2)} REFUNDED` : `₱${excessAmount.toFixed(2)} EXCESS`}
                        </CustomText>
                    </View>
                    <CustomIcon
                        library="Feather"
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isCompleted ? Colors.SUCCESS : Colors.TEXT_SECONDARY}
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <>
                    <View style={[styles.divider, isCompleted && styles.dividerCompleted]} />

                    {/* Explanation Note */}
                    <View style={styles.infoBanner}>
                        <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                        <CustomText style={styles.infoBannerText}>
                            Your tour reservation is 100% paid and confirmed! You sent ₱{originalVerifiedAmount.toFixed(2)} for a ₱{hikeAmountCaptured.toFixed(2)} balance. The organizer will refund the ₱{excessAmount.toFixed(2)} excess.
                        </CustomText>
                    </View>

            {/* State 1: Awaiting Hiker Wallet Submission */}
            {status === 'awaiting_hiker_wallet' && (
                <View style={styles.section}>
                    <View style={styles.walletHeader}>
                        <CustomIcon library="Feather" name="credit-card" size={16} color={Colors.PRIMARY} />
                        <CustomText style={styles.sectionTitle}>Refund E-Wallet Details</CustomText>
                    </View>
                    <CustomText style={styles.sectionSubtitle}>
                        Select your digital wallet and enter your details to receive the ₱{excessAmount.toFixed(2)} refund.
                    </CustomText>

                    {/* Wallet Selector Buttons */}
                    <View style={styles.walletTypeRow}>
                        <TouchableOpacity
                            style={[
                                styles.walletTypeBtn,
                                selectedWallet === 'GCash' && styles.walletTypeBtnActive,
                            ]}
                            onPress={() => setSelectedWallet('GCash')}
                            activeOpacity={0.8}
                        >
                            <CustomIcon
                                library="Feather"
                                name="smartphone"
                                size={16}
                                color={selectedWallet === 'GCash' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.walletTypeText,
                                    selectedWallet === 'GCash' && styles.walletTypeTextActive,
                                ]}
                            >
                                GCash
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.walletTypeBtn,
                                selectedWallet === 'Maya' && styles.walletTypeBtnActive,
                            ]}
                            onPress={() => setSelectedWallet('Maya')}
                            activeOpacity={0.8}
                        >
                            <CustomIcon
                                library="Feather"
                                name="activity"
                                size={16}
                                color={selectedWallet === 'Maya' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.walletTypeText,
                                    selectedWallet === 'Maya' && styles.walletTypeTextActive,
                                ]}
                            >
                                Maya
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    {/* Account Number Input (Zero Pre-Fill) */}
                    <CustomTextInput
                        label="Mobile Number (11-Digits) *"
                        placeholder="0917 123 4567"
                        keyboardType="phone-pad"
                        maxLength={11}
                        value={accountNumber}
                        onChangeText={(t: string) => setAccountNumber(String(t || '').replace(/\D/g, '').slice(0, 11))}
                        icon="phone"
                        iconLibrary="Feather"
                        containerStyle={{ marginBottom: 12 }}
                    />

                    {/* Account Name Input */}
                    <CustomTextInput
                        label="Account Full Name *"
                        placeholder="e.g. Juan Dela Cruz"
                        value={accountName}
                        onChangeText={(t: string) => setAccountName(String(t || ''))}
                        icon="user"
                        iconLibrary="Feather"
                        containerStyle={{ marginBottom: 4 }}
                    />

                    {/* Submit Button */}
                    <CustomButton
                        title="Submit Refund Wallet"
                        variant="primary"
                        onPress={handleSubmitWallet}
                        isLoading={isSubmittingWallet}
                        style={styles.submitBtn}
                    />
                </View>
            )}

            {/* State 2: Awaiting Organizer Payout */}
            {status === 'awaiting_admin_payout' && (
                <View style={styles.section}>
                    <View style={styles.statusCallout}>
                        <CustomIcon library="Feather" name="clock" size={16} color="#D97706" />
                        <View style={{ flex: 1 }}>
                            <CustomText style={styles.statusCalloutTitle}>Awaiting Organizer Payout</CustomText>
                            <CustomText style={styles.statusCalloutText}>
                                Your {userWallet?.walletType} details ({userWallet?.accountNumber} - {userWallet?.accountName}) have been submitted. The organizer is preparing your ₱{excessAmount.toFixed(2)} refund.
                            </CustomText>
                        </View>
                    </View>
                </View>
            )}

            {/* State 3: Awaiting User Confirmation (Handshake) or Disputed */}
            {(status === 'awaiting_user_confirmation' || status === 'refund_disputed') && (
                <View style={styles.section}>
                    <CustomText style={styles.sectionTitle}>
                        {status === 'refund_disputed' ? 'Refund Disputed' : 'Verify Refund Receipt'}
                    </CustomText>
                    <CustomText style={styles.sectionSubtitle}>
                        {status === 'refund_disputed'
                            ? `You reported an issue with this payout (Attempt ${disputeCount}/3).`
                            : `The organizer has sent your ₱${excessAmount.toFixed(2)} refund. Please check your wallet and confirm receipt.`}
                    </CustomText>

                    {/* Dispute Banner if disputed */}
                    {status === 'refund_disputed' && (
                        <View style={styles.disputeCallout}>
                            <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.ERROR} />
                            <View style={{ flex: 1 }}>
                                <CustomText style={styles.disputeCalloutTitle}>
                                    Dispute Active (Attempt {disputeCount}/3)
                                </CustomText>
                                <CustomText style={styles.disputeCalloutText}>
                                    {existingDisputeReason || 'Funds not received.'}
                                </CustomText>
                            </View>
                        </View>
                    )}

                    {/* Admin Payout Receipt Screenshot */}
                    {adminRefundReceiptUrl && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setIsPreviewVisible(true)}
                            style={styles.receiptPreviewBox}
                        >
                            <Image
                                source={{ uri: adminRefundReceiptUrl }}
                                style={styles.receiptThumbnail}
                                resizeMode="cover"
                            />
                            <View style={styles.receiptOverlay}>
                                <CustomIcon library="Feather" name="maximize-2" size={16} color={Colors.WHITE} />
                                <CustomText style={styles.receiptOverlayText}>Tap to View Receipt Proof</CustomText>
                            </View>
                        </TouchableOpacity>
                    )}

                    {adminRefundReceiptUploadedAt && (
                        <CustomText style={styles.uploadedAtText}>
                            Sent on {formatDateToStandard(adminRefundReceiptUploadedAt)}
                        </CustomText>
                    )}

                    {/* Two-Way Handshake Buttons (Only when awaiting user confirmation, NOT while disputed) */}
                    {status === 'awaiting_user_confirmation' && (
                        <View style={styles.handshakeButtonsRow}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleConfirmReceipt}
                                disabled={isConfirmingReceipt}
                                style={styles.confirmBtn}
                            >
                                {isConfirmingReceipt ? (
                                    <ActivityIndicator size="small" color={Colors.WHITE} />
                                ) : (
                                    <>
                                        <CustomIcon library="Feather" name="check" size={16} color={Colors.WHITE} />
                                        <CustomText style={styles.confirmBtnText}>Confirm Received</CustomText>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    if (isMaxDisputesReached) {
                                        showToast.error('Maximum dispute limit reached. Please coordinate directly in the tour chat.');
                                    } else {
                                        setIsDisputeModalVisible(true);
                                    }
                                }}
                                disabled={isMaxDisputesReached}
                                style={[styles.appealBtn, isMaxDisputesReached && styles.btnDisabled]}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="alert-circle"
                                    size={15}
                                    color={isMaxDisputesReached ? Colors.TEXT_SECONDARY : Colors.ERROR}
                                />
                                <CustomText
                                    style={[
                                        styles.appealBtnText,
                                        isMaxDisputesReached && { color: Colors.TEXT_SECONDARY }
                                    ]}
                                >
                                    {isMaxDisputesReached ? 'Max Appeals (3/3)' : 'Not Received / Appeal'}
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Tour group chat reminder */}
                    <View style={styles.chatRetentionNotice}>
                        <CustomIcon library="Feather" name="message-square" size={13} color={Colors.PRIMARY} />
                        <CustomText style={styles.chatRetentionNoticeText}>
                            You remain active in the tour group chat throughout this process for direct communication.
                        </CustomText>
                    </View>
                </View>
            )}

            {/* State 4: Completed */}
            {status === 'completed' && (
                <View style={styles.section}>
                    <View style={styles.completedCallout}>
                        <CustomIcon library="Feather" name="check-circle" size={18} color={Colors.SUCCESS} />
                        <View style={{ flex: 1 }}>
                            <CustomText style={styles.completedCalloutTitle}>Excess Refund Resolved</CustomText>
                            <CustomText style={styles.completedCalloutText}>
                                You confirmed receiving the ₱{excessAmount.toFixed(2)} refund. Your tour reservation remains active and ready!
                            </CustomText>
                        </View>
                    </View>
                    {Boolean(adminRefundReceiptUrl) && (
                        <TouchableOpacity
                            style={styles.viewProofBtn}
                            onPress={() => setIsPreviewVisible(true)}
                            activeOpacity={0.8}
                        >
                            <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                            <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                        </TouchableOpacity>
                    )}
                </View>
            )}
                </>
            )}

            {/* Receipt Modal Preview */}
            {adminRefundReceiptUrl && (
                <ImagePreviewModal
                    visible={isPreviewVisible}
                    imageUrl={adminRefundReceiptUrl}
                    onClose={() => setIsPreviewVisible(false)}
                />
            )}

            {/* Dispute Reason Modal */}
            <Modal
                visible={isDisputeModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDisputeModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalBackdrop}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
                >
                    <ScrollView
                        contentContainerStyle={styles.modalScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <CustomIcon library="Feather" name="alert-circle" size={20} color={Colors.ERROR} />
                                    <CustomText variant="h3" style={{ color: Colors.TEXT_PRIMARY }}>
                                        Report Payment Not Received
                                    </CustomText>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setIsDisputeModalVisible(false)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <CustomIcon library="Feather" name="x" size={18} color={Colors.TEXT_SECONDARY} />
                                </TouchableOpacity>
                            </View>

                            <CustomText style={styles.modalDescription}>
                                Please specify why you are disputing the excess refund (e.g. wrong account, reference does not match).
                            </CustomText>

                            <View style={styles.disputeLimitTag}>
                                <CustomIcon library="Feather" name="info" size={13} color="#D97706" />
                                <CustomText style={styles.disputeLimitTagText}>
                                    Attempt {disputeCount + 1} of 3 maximum automated appeals
                                </CustomText>
                            </View>

                            <CustomTextInput
                                placeholder="Enter your explanation..."
                                value={disputeReason}
                                onChangeText={(val: string | Date | null) => setDisputeReason(String(val || ''))}
                                multiline={true}
                                numberOfLines={4}
                                style={{ marginBottom: 4 }}
                                containerStyle={{ minHeight: 96 }}
                            />

                            <View style={styles.modalButtonsRow}>
                                <CustomButton
                                    title="Cancel"
                                    variant="outline"
                                    onPress={() => setIsDisputeModalVisible(false)}
                                    style={{ flex: 1 }}
                                />
                                <CustomButton
                                    title="Submit Appeal"
                                    variant="primary"
                                    onPress={handleSubmitDispute}
                                    isLoading={isSubmittingDispute}
                                    style={{ flex: 1, backgroundColor: Colors.ERROR }}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
        ...GlobalStyles.dropShadow(2),
    },
    containerCompleted: {
        borderColor: Colors.STATUS_APPROVED_BORDER || '#86EFAC',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#92400E',
    },
    headerTitleCompleted: {
        color: '#166534',
    },
    excessBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    excessBadgeCompleted: {
        backgroundColor: '#F0FDF4',
        borderColor: '#86EFAC',
    },
    excessBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#B45309',
    },
    excessBadgeTextCompleted: {
        color: '#166534',
    },
    divider: {
        height: 1,
        backgroundColor: '#FDE68A',
        marginVertical: 12,
    },
    dividerCompleted: {
        backgroundColor: '#BBF7D0',
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 10,
        padding: 10,
        gap: 8,
        marginBottom: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 12,
        color: '#166534',
        lineHeight: 16,
    },
    section: {
        gap: 8,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        marginBottom: 6,
    },
    walletTypeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    walletTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
    },
    walletTypeBtnActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    walletTypeText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    walletTypeTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    submitBtn: {
        marginTop: 8,
    },
    statusCallout: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 10,
        gap: 8,
        alignItems: 'flex-start',
    },
    statusCalloutTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400E',
    },
    statusCalloutText: {
        fontSize: 12,
        color: '#B45309',
        lineHeight: 16,
        marginTop: 2,
    },
    disputeCallout: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 12,
        borderRadius: 10,
        gap: 8,
        marginBottom: 10,
    },
    disputeCalloutTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    disputeCalloutText: {
        fontSize: 12,
        color: Colors.ERROR,
        lineHeight: 16,
        marginTop: 2,
    },
    receiptPreviewBox: {
        position: 'relative',
        height: 120,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginTop: 6,
    },
    receiptThumbnail: {
        width: '100%',
        height: '100%',
    },
    receiptOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
    },
    receiptOverlayText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: '600',
    },
    uploadedAtText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'right',
        marginTop: 2,
    },
    handshakeButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    confirmBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 10,
        borderRadius: 8,
    },
    confirmBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: 'bold',
    },
    appealBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.ERROR,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: Colors.WHITE,
    },
    appealBtnText: {
        color: Colors.ERROR,
        fontSize: 13,
        fontWeight: 'bold',
    },
    btnDisabled: {
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.BACKGROUND,
    },
    chatRetentionNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 8,
        borderRadius: 6,
        marginTop: 10,
    },
    chatRetentionNoticeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
        lineHeight: 14,
    },
    completedCallout: {
        flexDirection: 'row',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        padding: 12,
        borderRadius: 10,
        gap: 8,
    },
    completedCalloutTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
    },
    completedCalloutText: {
        fontSize: 12,
        color: '#166534',
        lineHeight: 16,
        marginTop: 2,
    },
    viewProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.WHITE,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    viewProofBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 20,
        gap: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalDescription: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    disputeLimitTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        padding: 8,
        borderRadius: 6,
    },
    disputeLimitTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#B45309',
    },
    disputeInput: {
        minHeight: 96,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
    },
});

export default OverpaymentRefundCard;
