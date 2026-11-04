/**
 * @file AdminOverpaymentRefundCard.tsx
 * @description Dedicated first-class container for managing excess payment refund payouts on the Admin side.
 * Renders destination wallet details, dispute alerts, payout proof inspection, and proof upload actions.
 * Strictly avoids raw emojis, using semantic CustomIcon vector icons throughout.
 */

import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStatusBadge from '@/src/components/CustomStatusBadge';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useToast } from '@/src/components/Toast/Toast';
import { Booking } from '@/src/core/models/Booking/Booking';
import { SelectedFile } from '@/src/core/repositories/fileRepository';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface AdminOverpaymentRefundCardProps {
    booking: Booking;
    onUploadOverpaymentProof?: (file: SelectedFile) => Promise<void | string>;
    isProcessing?: boolean;
}

export const AdminOverpaymentRefundCard: React.FC<AdminOverpaymentRefundCardProps> = ({
    booking,
    onUploadOverpaymentProof,
    isProcessing = false,
}) => {
    const { isMobile } = useBreakpoints();
    const { showToast } = useToast();
    const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
    const [proofPreviewVisible, setProofPreviewVisible] = useState<boolean>(false);

    const overpayment = booking.overpayment;
    if (!overpayment || !overpayment.excessAmount || overpayment.excessAmount <= 0) {
        return null;
    }

    const {
        excessAmount,
        status,
        userWallet,
        adminRefundReceiptUrl,
        disputeCount = 0,
        disputeReason,
    } = overpayment;

    const handlePickProof = async () => {
        if (!onUploadOverpaymentProof) return;
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                const fileName = asset.fileName || `excess_refund_${Date.now()}.jpg`;
                setIsUploadingProof(true);
                await onUploadOverpaymentProof({
                    uri: asset.uri,
                    name: fileName,
                    mimeType: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                });
                showToast.success('Excess refund payout proof uploaded successfully.');
            }
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to pick image';
            showToast.error(errorMsg);
        } finally {
            setIsUploadingProof(false);
        }
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'awaiting_hiker_wallet':
                return { status: 'downpayment', label: 'AWAITING WALLET' };
            case 'awaiting_admin_payout':
                return { status: 'downpayment', label: 'ACTION REQUIRED' };
            case 'awaiting_user_confirmation':
                return { status: 'for-reservation', label: 'PENDING CONFIRMATION' };
            case 'refund_disputed':
                return { status: 'reservation-rejected', label: `DISPUTED (${Math.min(3, disputeCount)}/3)` };
            case 'completed':
                return { status: 'completed', label: 'COMPLETED' };
            default:
                return { status: 'downpayment', label: 'OVERPAID' };
        }
    };

    const badgeConfig = getStatusBadge();
    const isDisputed = status === 'refund_disputed';
    const isCompleted = status === 'completed';
    const canUpload = (status === 'awaiting_admin_payout' || status === 'refund_disputed') && Boolean(onUploadOverpaymentProof);

    return (
        <View style={[styles.card, isMobile && styles.cardMobile]}>
            {/* ── Header ── */}
            <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                    <CustomIcon
                        library="Feather"
                        name={isCompleted ? 'check-circle' : 'credit-card'}
                        size={16}
                        color={isCompleted ? Colors.SUCCESS : (isDisputed ? Colors.ERROR : Colors.PRIMARY)}
                    />
                    <CustomText style={styles.cardTitle}>
                        Excess Payment Refund (₱{excessAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </CustomText>
                </View>
                <CustomStatusBadge
                    status={badgeConfig.status}
                    label={badgeConfig.label}
                    size="sm"
                />
            </View>

            <View style={styles.divider} />

            {/* ── Context / Instruction Info Box ── */}
            <View style={[
                styles.infoBox,
                isDisputed && styles.infoBoxDisputed,
                isCompleted && styles.infoBoxCompleted,
            ]}>
                <View style={styles.infoHeaderRow}>
                    <CustomIcon
                        library="Feather"
                        name={isCompleted ? 'check-circle' : (isDisputed ? 'alert-triangle' : 'info')}
                        size={15}
                        color={isCompleted ? Colors.SUCCESS : (isDisputed ? Colors.ERROR : Colors.TEXT_SECONDARY)}
                        style={styles.infoIcon}
                    />
                    <CustomText style={[
                        styles.infoTitle,
                        isDisputed && styles.infoTitleDisputed,
                        isCompleted && styles.infoTitleCompleted,
                    ]}>
                        {status === 'awaiting_hiker_wallet' && 'Awaiting Hiker Destination Wallet'}
                        {status === 'awaiting_admin_payout' && 'Organizer Action Required'}
                        {status === 'awaiting_user_confirmation' && 'Payout Uploaded — Awaiting Confirmation'}
                        {status === 'refund_disputed' && `Hiker Disputed Payout (Attempt ${Math.min(3, disputeCount)} of 3)`}
                        {status === 'completed' && 'Excess Refund Finalized and Confirmed'}
                    </CustomText>
                </View>
                <CustomText style={[styles.infoMessage, isDisputed && styles.infoMessageDisputed]}>
                    {status === 'awaiting_hiker_wallet' && 'The hiker has been notified in their app to submit their GCash or Maya wallet details.'}
                    {status === 'awaiting_admin_payout' && `Please disburse ₱${excessAmount.toFixed(2)} to the hiker's wallet and upload receipt screenshot proof below.`}
                    {status === 'awaiting_user_confirmation' && 'Payout proof has been uploaded. Waiting for the hiker to verify and confirm receipt on their device.'}
                    {status === 'refund_disputed' && (disputeReason ? `"${disputeReason}". Please review and upload corrected payout proof.` : 'The hiker reported not receiving the funds. Please verify and upload corrected proof.')}
                    {status === 'completed' && 'The hiker has verified and confirmed receipt of the refund. Financial resolution is complete.'}
                </CustomText>
            </View>

            {/* ── Recipient Destination Wallet Card ── */}
            {userWallet ? (
                <View style={styles.sectionBlock}>
                    <CustomText style={styles.sectionHeaderLabel}>
                        RECIPIENT {userWallet.walletType.toUpperCase()} WALLET
                    </CustomText>
                    <View style={styles.walletCard}>
                        <View style={styles.walletDetails}>
                            <CustomText style={styles.walletNumber} selectable={true}>
                                {userWallet.accountNumber}
                            </CustomText>
                            {Boolean(userWallet.accountName) && (
                                <CustomText style={styles.walletName}>
                                    {userWallet.accountName}
                                </CustomText>
                            )}
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.copyBtn}
                            onPress={async () => {
                                await Clipboard.setStringAsync(userWallet.accountNumber);
                                showToast.success('Wallet number copied to clipboard.');
                            }}
                        >
                            <CustomIcon library="Feather" name="copy" size={13} color={Colors.PRIMARY} />
                            <CustomText style={styles.copyBtnText}>Copy</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {/* ── Uploaded Payout Proof Viewer ── */}
            {adminRefundReceiptUrl ? (
                <View style={styles.sectionBlock}>
                    <CustomText style={styles.sectionHeaderLabel}>
                        {isDisputed ? 'PREVIOUS PAYOUT PROOF' : 'UPLOADED PAYOUT PROOF'}
                    </CustomText>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setProofPreviewVisible(true)}
                        style={styles.proofCard}
                    >
                        <Image
                            source={{ uri: adminRefundReceiptUrl }}
                            style={styles.proofThumbnail}
                            resizeMode="cover"
                        />
                        <View style={styles.proofTextColumn}>
                            <CustomText style={styles.proofTitle}>
                                Payout Receipt Proof
                            </CustomText>
                            <CustomText style={styles.proofSubtitle}>
                                Tap to inspect full screenshot
                            </CustomText>
                        </View>
                        <CustomIcon library="Feather" name="maximize-2" size={16} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* ── Primary Action CTA ── */}
            {canUpload && (
                <View style={styles.actionContainer}>
                    <CustomButton
                        title={
                            isDisputed
                                ? `Upload Corrected Proof (₱${excessAmount.toFixed(2)})`
                                : `Upload Refund Receipt Proof (₱${excessAmount.toFixed(2)})`
                        }
                        variant="primary"
                        icon="upload"
                        iconLibrary="Feather"
                        onPress={handlePickProof}
                        isLoading={isUploadingProof || isProcessing}
                        disabled={isUploadingProof || isProcessing}
                        style={styles.uploadBtn}
                    />
                </View>
            )}

            {/* ── Fullscreen Receipt Preview Modal ── */}
            {adminRefundReceiptUrl && proofPreviewVisible && (
                <ImagePreviewModal
                    visible={proofPreviewVisible}
                    imageUrl={adminRefundReceiptUrl}
                    onClose={() => setProofPreviewVisible(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 14,
    },
    cardMobile: {
        padding: 14,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: 0.3,
        includeFontPadding: false,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    infoBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 12,
        gap: 6,
    },
    infoBoxDisputed: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_WARNING_BORDER,
    },
    infoBoxCompleted: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    infoHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoIcon: {
        marginTop: 1,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        includeFontPadding: false,
    },
    infoTitleDisputed: {
        color: Colors.STATUS_WARNING_TEXT,
    },
    infoTitleCompleted: {
        color: Colors.PRIMARY,
    },
    infoMessage: {
        fontSize: 12.5,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
        includeFontPadding: false,
    },
    infoMessageDisputed: {
        color: Colors.STATUS_WARNING_TEXT,
    },
    sectionBlock: {
        gap: 6,
    },
    sectionHeaderLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        includeFontPadding: false,
    },
    walletCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    walletDetails: {
        gap: 2,
    },
    walletNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: 0.8,
        includeFontPadding: false,
    },
    walletName: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        includeFontPadding: false,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    copyBtnText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: Colors.PRIMARY,
        includeFontPadding: false,
    },
    proofCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 10,
        padding: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    proofThumbnail: {
        width: 44,
        height: 44,
        borderRadius: 6,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    proofTextColumn: {
        flex: 1,
        gap: 2,
    },
    proofTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        includeFontPadding: false,
    },
    proofSubtitle: {
        fontSize: 11.5,
        color: Colors.TEXT_SECONDARY,
        includeFontPadding: false,
    },
    actionContainer: {
        marginTop: 2,
    },
    uploadBtn: {
        width: '100%',
        minHeight: 46,
    },
});
