/**
 * @file UserRefundScreen.tsx
 * @description Dedicated hiker screen for entering GCash or Maya wallet information
 * once a refund has been approved by the organizer, and inspecting the admin payout proof receipt.
 */

import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation, IUserWalletDetails } from '@/src/core/models/Cancellation/Cancellation';

export interface UserRefundScreenProps {
    booking: Booking;
    cancellation: Cancellation;
    onBackPress: () => void;
    onSubmitWallet: (wallet: IUserWalletDetails<Date>) => Promise<boolean>;
    isLoading?: boolean;
}

export const UserRefundScreen: React.FC<UserRefundScreenProps> = ({
    booking,
    cancellation,
    onBackPress,
    onSubmitWallet,
    isLoading = false,
}) => {
    const { showToast } = useToast();
    const existingWallet = cancellation?.userWallet;

    const [walletType, setWalletType] = useState<'GCash' | 'Maya'>(existingWallet?.walletType || 'GCash');
    const [accountNumber, setAccountNumber] = useState<string>(existingWallet?.accountNumber || '');
    const [accountName, setAccountName] = useState<string>(existingWallet?.accountName || '');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [previewReceiptVisible, setPreviewReceiptVisible] = useState<boolean>(false);

    const isAwaitingAdminDecision = (cancellation?.handshakeStep === 'awaiting_admin_refund_decision' || cancellation?.refundAmount === undefined) && !existingWallet?.accountNumber;
    const refundAmount = cancellation?.refundAmount ?? 0;
    const hasSubmittedWallet = Boolean(existingWallet?.accountNumber);
    const adminProofReceipt = cancellation?.adminRefundReceiptUrl;

    const formatPhoneNumber = (text: string) => {
        // Only allow digits and cap at 11
        const cleaned = text.replace(/\D/g, '').slice(0, 11);
        return cleaned;
    };

    const handleSubmit = async () => {
        if (isAwaitingAdminDecision) {
            showToast.error('Please wait for the organizer to specify the refund amount before submitting wallet details.');
            return;
        }

        const cleanedNumber = accountNumber.replace(/\D/g, '');
        if (cleanedNumber.length !== 11 || !cleanedNumber.startsWith('09')) {
            showToast.error('Please enter a valid 11-digit Philippine mobile number starting with 09.');
            return;
        }

        if (!accountName.trim()) {
            showToast.error('Please enter the account holder name.');
            return;
        }

        setIsSubmitting(true);
        try {
            const walletData: IUserWalletDetails<Date> = {
                walletType,
                accountNumber: cleanedNumber,
                accountName: accountName.trim(),
                submittedAt: new Date(),
            };

            const success = await onSubmitWallet(walletData);
            if (success) {
                showToast.success('Wallet details submitted to organizer.');
            }
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to submit wallet details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Refund Payout Details" centerTitle={true} onBackPress={onBackPress} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.constrainer}>
                        {/* Refund Summary Hero */}
                        <View style={styles.heroCard}>
                            <View style={styles.heroIconBox}>
                                <CustomIcon library="Feather" name="corner-up-left" size={28} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="caption" style={styles.heroSubtitle}>
                                {isAwaitingAdminDecision ? 'Refund Amount Pending' : 'Approved Refund Amount'}
                            </CustomText>
                            <CustomText variant={isAwaitingAdminDecision ? 'h2' : 'h1'} style={isAwaitingAdminDecision ? styles.heroAmountPending : styles.heroAmount}>
                                {isAwaitingAdminDecision ? 'Awaiting Organizer' : `₱${refundAmount.toFixed(2)}`}
                            </CustomText>
                            <View style={styles.trailInfoBox}>
                                <CustomText style={styles.trailName} numberOfLines={1}>
                                    {booking?.trail?.name || 'Hike Booking'}
                                </CustomText>
                                <CustomText style={styles.businessName}>
                                    Organizer: {booking?.business?.name || 'Trail Provider'}
                                </CustomText>
                            </View>
                        </View>

                        {/* Admin Proof Receipt Card (if completed) */}
                        {adminProofReceipt && (
                            <View style={styles.proofCard}>
                                <View style={styles.proofHeader}>
                                    <CustomIcon library="Feather" name="check-circle" size={18} color={Colors.SUCCESS} />
                                    <CustomText style={styles.proofTitle}>Refund Payout Sent</CustomText>
                                </View>
                                <CustomText style={styles.proofSubtitle}>
                                    The organizer has processed your refund and uploaded the receipt below.
                                </CustomText>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => setPreviewReceiptVisible(true)}
                                    style={styles.proofImageWrapper}
                                >
                                    <Image source={{ uri: adminProofReceipt }} style={styles.proofImage} resizeMode="contain" />
                                    <View style={styles.tapToView}>
                                        <CustomIcon library="Feather" name="maximize-2" size={12} color={Colors.WHITE} />
                                        <CustomText style={styles.tapToViewText}>Tap to view full receipt</CustomText>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Wallet Information Form */}
                        <View style={styles.formCard}>
                            <View style={styles.formHeader}>
                                <CustomIcon library="Feather" name="credit-card" size={18} color={Colors.PRIMARY} />
                                <CustomText style={styles.formTitle}>
                                    {hasSubmittedWallet ? 'Submitted E-Wallet Details' : 'Enter Your E-Wallet Details'}
                                </CustomText>
                            </View>

                            <CustomText style={styles.formInstructions}>
                                {hasSubmittedWallet
                                    ? 'The organizer will transfer your refund to the account below and provide receipt proof.'
                                    : (isAwaitingAdminDecision
                                        ? 'The organizer is currently setting the refund amount. You will be able to submit your wallet once confirmed.'
                                        : 'Please choose GCash or Maya and provide your 11-digit mobile number and registered account name.')}
                            </CustomText>

                            {isAwaitingAdminDecision && (
                                <View style={styles.decisionPendingBanner}>
                                    <CustomIcon library="Feather" name="clock" size={16} color={Colors.STATUS_PENDING_TEXT} />
                                    <CustomText style={styles.decisionPendingText}>
                                        The organizer has not yet set the refund amount for this booking. Wallet submission will be enabled once the amount is finalized.
                                    </CustomText>
                                </View>
                            )}

                            {/* Wallet Selector */}
                            <View style={styles.walletTypeRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.walletOptionBtn,
                                        walletType === 'GCash' && styles.walletOptionBtnActive,
                                    ]}
                                    onPress={() => setWalletType('GCash')}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon
                                        library="Feather"
                                        name="smartphone"
                                        size={18}
                                        color={walletType === 'GCash' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                    />
                                    <CustomText
                                        style={[
                                            styles.walletOptionText,
                                            walletType === 'GCash' && styles.walletOptionTextActive,
                                        ]}
                                    >
                                        GCash
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.walletOptionBtn,
                                        walletType === 'Maya' && styles.walletOptionBtnActive,
                                    ]}
                                    onPress={() => setWalletType('Maya')}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon
                                        library="Feather"
                                        name="activity"
                                        size={18}
                                        color={walletType === 'Maya' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                    />
                                    <CustomText
                                        style={[
                                            styles.walletOptionText,
                                            walletType === 'Maya' && styles.walletOptionTextActive,
                                        ]}
                                    >
                                        Maya
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            {/* Mobile Number Input */}
                            <CustomTextInput
                                label="Mobile Number (11-Digits) *"
                                placeholder="0917 123 4567"
                                keyboardType="phone-pad"
                                maxLength={11}
                                value={accountNumber}
                                onChangeText={(t: string) => setAccountNumber(formatPhoneNumber(t))}
                                icon="phone"
                                iconLibrary="Feather"
                            />

                            {/* Account Name Input */}
                            <CustomTextInput
                                label="Account Full Name *"
                                placeholder="e.g. Juan Dela Cruz"
                                value={accountName}
                                onChangeText={setAccountName}
                                icon="user"
                                iconLibrary="Feather"
                            />

                            <CustomButton
                                title={isSubmitting ? 'Saving...' : (isAwaitingAdminDecision ? 'Awaiting Organizer Amount' : (hasSubmittedWallet ? 'Update Wallet Details' : 'Submit Refund Wallet'))}
                                variant={isAwaitingAdminDecision ? 'outline' : 'primary'}
                                onPress={handleSubmit}
                                disabled={isAwaitingAdminDecision}
                                isLoading={isSubmitting || isLoading}
                                style={styles.submitBtn}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {adminProofReceipt && (
                <ImagePreviewModal
                    visible={previewReceiptVisible}
                    imageUrl={adminProofReceipt}
                    onClose={() => setPreviewReceiptVisible(false)}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        gap: 16,
    },
    heroCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 6,
    },
    heroIconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    heroAmountPending: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.STATUS_PENDING_TEXT,
    },
    decisionPendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.STATUS_PENDING_BG,
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    decisionPendingText: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    trailInfoBox: {
        marginTop: 8,
        alignItems: 'center',
        gap: 2,
    },
    trailName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    businessName: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    proofCard: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderRadius: 16,
        padding: 16,
        gap: 10,
    },
    proofHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    proofTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
    },
    proofSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    proofImageWrapper: {
        height: 200,
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    proofImage: {
        width: '100%',
        height: '100%',
    },
    tapToView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 6,
    },
    tapToViewText: {
        color: Colors.WHITE,
        fontSize: 11,
        fontWeight: '600',
    },
    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 14,
    },
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    formTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    formInstructions: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    walletTypeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    walletOptionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    walletOptionBtnActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    walletOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    walletOptionTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    submitBtn: {
        marginTop: 6,
    },
});

export default UserRefundScreen;
