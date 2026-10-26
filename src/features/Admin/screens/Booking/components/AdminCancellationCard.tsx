import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ExpandableText from '@/src/components/ExpandableText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { IPayment } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { SelectedFile } from '@/src/core/repositories/fileRepository';
import { formatBookingDate } from '@/src/utils/dateFormatter';

/**
 * Props for AdminCancellationCard.
 * @param status - Current workflow status of the booking.
 * @param cancellation - Optional cancellation request object.
 * @param cancellationReason - Reason submitted by the hiker or organizer.
 * @param declineReason - Decline explanation/adminNote provided by organizer if declined.
 * @param totalAmountPaid - Total captured payment amount for the booking.
 * @param requestedAt - Optional timestamp when the cancellation was requested.
 * @param cancelledBy - Optional name/role of who cancelled the booking.
 * @param onRevert - Optional callback when organizer reverts a pending admin-initiated cancellation.
 * @param isReverting - Whether the revert operation is currently processing.
 */
export interface AdminCancellationCardProps {
    status: string;
    cancellation?: Cancellation | null;
    cancellationReason?: string;
    declineReason?: string;
    totalAmountPaid: number;
    totalRefundedAmount?: number;
    requestedAt?: Date | null;
    cancelledBy?: string;
    onRevert?: () => void;
    isReverting?: boolean;
    onRefundClick?: () => void;
    onCloseWithoutRefundClick?: () => void;
    onUploadRefundProof?: (file: SelectedFile) => Promise<boolean | void>;
    isUploadingProof?: boolean;
    onApproveWithManualRefund?: (amount: number) => Promise<void> | void;
    payments?: IPayment<Date>[];
    isPayMongo?: boolean;
}

/**
 * AdminCancellationCard — Renders contextual cancellation details within the Admin ReviewScreen.
 */
const AdminCancellationCard: React.FC<AdminCancellationCardProps> = ({
    status,
    cancellation,
    cancellationReason,
    declineReason,
    totalAmountPaid,
    totalRefundedAmount = 0,
    requestedAt,
    cancelledBy,
    onRevert,
    isReverting = false,
    onRefundClick,
    onCloseWithoutRefundClick,
    onUploadRefundProof,
    isUploadingProof = false,
    onApproveWithManualRefund,
    payments,
    isPayMongo,
}) => {
    const [previewAdminProof, setPreviewAdminProof] = useState<string | null>(null);

    const handlePickReceipt = async () => {
        if (!onUploadRefundProof) return;
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                const fileName = asset.fileName || `refund_proof_${Date.now()}.jpg`;
                await onUploadRefundProof({
                    uri: asset.uri,
                    name: fileName,
                    mimeType: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                });
            }
        } catch (err) {
            console.error('Image picker error:', err);
        }
    };

    const isCancelledByAdmin =
        cancellation?.cancelledBy === 'admin' || cancelledBy === 'admin';

    const isPending = cancellation
        ? cancellation.status === 'pending'
        : status === 'for-cancellation';
    const isDeclined = cancellation
        ? cancellation.status === 'rejected'
        : status === 'cancellation-rejected';

    const resolvedIsPayMongo = isPayMongo ?? payments?.some(p => p.gateway === 'paymongo');
    const isManualRefund = !resolvedIsPayMongo && (PAYMENT_CONFIG.PROVIDER === 'manual_qr' || payments?.some(p => p.gateway === 'manual_qr'));
    const isRefundComplete = resolvedIsPayMongo
        ? (totalRefundedAmount > 0 || status === 'refunded')
        : (Boolean(cancellation?.adminRefundReceiptUrl) || cancellation?.handshakeStep === 'completed' || status === 'refunded');

    const isCancelled =
        (status === 'cancelled' && totalRefundedAmount === 0) ||
        (cancellation?.status === 'approved' && totalRefundedAmount === 0 && !cancellation?.refundAmount);

    if (!isPending && !isDeclined && !isRefundComplete && !isCancelled && !cancellation?.refundAmount) {
        return null;
    }

    const isPaid = totalAmountPaid > 0 || totalRefundedAmount > 0;
    const isDirectCancellation = !cancellation && status === 'cancelled' && totalAmountPaid === 0;

    const isApproved = !isDirectCancellation && (
        cancellation?.status === 'approved' ||
        (status === 'cancelled' && Boolean(cancellation)) ||
        status === 'refund' ||
        status === 'refunded'
    );

    const isAwaitingRefundDecision = isManualRefund && isApproved && isPaid && !isRefundComplete && (cancellation?.handshakeStep === 'awaiting_admin_refund_decision' || (!cancellation?.handshakeStep && !cancellation?.refundDecision));
    const isAwaitingWallet = isManualRefund && isApproved && isPaid && !isRefundComplete && (cancellation?.handshakeStep === 'awaiting_user_wallet' || (!cancellation?.userWallet && !isAwaitingRefundDecision));
    const isAwaitingPayout = isManualRefund && isApproved && isPaid && !isRefundComplete && Boolean(cancellation?.userWallet) && !cancellation?.adminRefundReceiptUrl;

    const headerTitle = isDirectCancellation
        ? 'Reservation Cancelled'
        : isCancelledByAdmin
        ? 'Hike Cancelled by Organizer'
        : isDeclined
        ? 'Cancellation Request Declined'
        : isApproved
        ? (isRefundComplete
            ? 'Cancellation Approved & Refunded'
            : (isAwaitingPayout
                ? 'Cancellation Approved — Send Payout'
                : (isAwaitingWallet
                    ? 'Cancellation Approved — Awaiting Hiker Wallet'
                    : (isAwaitingRefundDecision ? 'Awaiting Refund Decision' : 'Cancellation Approved'))))
        : 'Cancellation Review';

    const headerIcon = isDirectCancellation
        ? 'x-circle'
        : isCancelledByAdmin
        ? 'slash'
        : isDeclined
        ? 'x-circle'
        : isApproved
        ? (isRefundComplete ? 'check-circle' : 'clock')
        : 'alert-triangle';

    const iconColor = isDirectCancellation || isCancelledByAdmin || isDeclined || isPending
        ? Colors.ERROR
        : (isRefundComplete ? Colors.SUCCESS : '#B45309');

    const subtitleText = isDirectCancellation
        ? 'Booking cancelled by Hiker. Reserved slot released.'
        : isCancelledByAdmin
        ? (isPending
            ? 'You cancelled this reservation. Hiker has been notified.'
            : isAwaitingRefundDecision
            ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                ? 'The hiker accepted your cancellation. Please issue a refund or finalize without refund if resolved offline.'
                : 'The hiker accepted your cancellation. Please issue a refund via PayMongo or finalize without refund if resolved offline.')
            : isRefundComplete
            ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                ? 'Hike cancelled by organizer. Refund issued.'
                : 'Hike cancelled by organizer. Refund issued via PayMongo.')
            : 'Booking cancelled by organizer. Reserved slot released.')
        : (isPending
            ? 'Hiker requested to cancel this reservation. Review reason and inventory status.'
            : isDeclined
            ? 'Organizer declined this request. Hiker can submit an appeal.'
            : isAwaitingRefundDecision
            ? 'Cancellation approved. Please select a refund option below to complete resolution.'
            : isRefundComplete
            ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                ? 'Cancellation approved and refund issued.'
                : 'Cancellation approved and refund issued via PayMongo.')
            : `Booking cancelled by ${cancelledBy && cancelledBy !== 'admin' ? cancelledBy : 'Hiker'}. Reserved slot released.`);

    const resolvedReason = isDirectCancellation
        ? undefined
        : (cancellation?.reason || cancellationReason);
    const resolvedDeclineReason =
        declineReason || cancellation?.adminNote;
    const resolvedTimestamp =
        requestedAt || cancellation?.createdAt;

    const reasonBoxLabel = isCancelledByAdmin
        ? "ORGANIZER'S CANCELLATION REASON"
        : "HIKER'S SUBMITTED REASON";

    return (
        <View style={styles.cardContainer}>
            {/* Header Row: Title & Icon on Left, Approved Badge on Right */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <CustomIcon
                        library="Feather"
                        name={headerIcon}
                        size={16}
                        color={iconColor}
                    />
                    <CustomText style={styles.headerTitle}>
                        {headerTitle}
                    </CustomText>
                </View>

                {isApproved && (
                    <View style={[
                        styles.approvedBadge,
                        isAwaitingRefundDecision && styles.actionRequiredBadge
                    ]}>
                        <CustomIcon 
                            library="Feather" 
                            name={isAwaitingRefundDecision ? "alert-circle" : "check"} 
                            size={12} 
                            color={isAwaitingRefundDecision ? "#B45309" : Colors.SUCCESS} 
                        />
                        <CustomText style={[
                            styles.approvedBadgeText,
                            isAwaitingRefundDecision && styles.actionRequiredBadgeText
                        ]}>
                            {isAwaitingRefundDecision 
                                ? (isCancelledByAdmin ? 'ACCEPTED BY HIKER' : 'NEEDS REFUND DECISION') 
                                : 'APPROVED'}
                        </CustomText>
                    </View>
                )}
            </View>

            <CustomText variant="caption" style={styles.headerSubtitle}>
                {subtitleText}
            </CustomText>

            {/* Reason Box (Hiker or Organizer) */}
            {resolvedReason ? (
                <View style={styles.infoBox}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.infoBoxLabel}>
                            {reasonBoxLabel}
                        </CustomText>
                        {resolvedTimestamp && (
                            <CustomText variant="caption" style={styles.infoBoxTimestamp}>
                                {formatBookingDate(resolvedTimestamp)}
                            </CustomText>
                        )}
                    </View>
                    <ExpandableText
                        text={resolvedReason}
                        quote={true}
                        textStyle={styles.infoBoxText}
                        characterLimit={160}
                        arrowColor={Colors.TEXT_PRIMARY}
                    />
                </View>
            ) : null}

            {/* Organizer Decline Reason Box (if declined) */}
            {isDeclined && resolvedDeclineReason ? (
                <View style={[styles.infoBox, styles.declineBox]}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.declineBoxLabel}>
                            ORGANIZER&apos;S DECLINE NOTE
                        </CustomText>
                    </View>
                    <ExpandableText
                        text={resolvedDeclineReason}
                        quote={true}
                        textStyle={styles.declineBoxText}
                        characterLimit={160}
                        arrowColor={Colors.ERROR}
                    />
                </View>
            ) : null}

            {/* Financial & Inventory Impact Metrics Row */}
            {(() => {
                const resolvedRefunded = typeof cancellation?.refundAmount === 'number' && cancellation.refundAmount > 0
                    ? cancellation.refundAmount
                    : totalRefundedAmount;

                return (
                    <View style={styles.impactRow}>
                        <View style={styles.impactItem}>
                            <CustomText variant="caption" style={styles.impactLabel}>
                                PAYMENT CAPTURED
                            </CustomText>
                            <CustomText style={styles.impactValue}>
                                {totalAmountPaid > 0 
                                    ? `₱${totalAmountPaid.toFixed(2)}` 
                                    : (resolvedRefunded > 0 
                                        ? `₱${resolvedRefunded.toFixed(2)} (Refunded)` 
                                        : '₱0.00 (Unpaid)')}
                            </CustomText>
                        </View>
                        {resolvedRefunded > 0 && (
                            <>
                                <View style={styles.impactDivider} />
                                <View style={styles.impactItem}>
                                    <CustomText variant="caption" style={[styles.impactLabel, { color: Colors.ERROR }]}>
                                        AMOUNT REFUNDED
                                    </CustomText>
                                    <CustomText style={[styles.impactValue, { color: Colors.ERROR }]}>
                                        ₱{resolvedRefunded.toFixed(2)}
                                    </CustomText>
                                </View>
                            </>
                        )}
                        <View style={styles.impactDivider} />
                        <View style={styles.impactItem}>
                            <CustomText variant="caption" style={styles.impactLabel}>
                                SLOT STATUS
                            </CustomText>
                            <CustomText
                                style={[
                                    styles.impactValue,
                                    isPending ? styles.slotPendingText : styles.slotReleasedText,
                                ]}
                            >
                                {isPending ? 'Held (Pending)' : 'Released to Tour'}
                            </CustomText>
                        </View>
                    </View>
                );
            })()}

            {/* Manual QR Handshake: Uploaded Proof Display */}
            {isManualRefund && cancellation?.adminRefundReceiptUrl && (
                <View style={styles.manualRefundAdminBox}>
                    <View style={styles.manualRefundHeader}>
                        <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                        <CustomText style={styles.manualRefundSuccessTitle}>
                            Refund Payout Proof Uploaded
                        </CustomText>
                    </View>
                    <CustomText variant="caption" style={styles.manualRefundSubtitle}>
                        Payout receipt proof has been verified and stored.
                    </CustomText>
                    <TouchableOpacity
                        style={styles.viewProofBtn}
                        onPress={() => setPreviewAdminProof(cancellation.adminRefundReceiptUrl || null)}
                        activeOpacity={0.8}
                    >
                        <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                        <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Manual QR Handshake: Hiker Wallet Submitted Display & Upload Action */}
            {isManualRefund && cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl && (
                <View style={styles.walletDetailsAdminBox}>
                    <View style={styles.manualRefundHeader}>
                        <CustomIcon library="Feather" name="credit-card" size={16} color={Colors.PRIMARY} />
                        <CustomText style={styles.walletDetailsTitle}>
                            Hiker E-Wallet for Refund
                        </CustomText>
                    </View>
                    <View style={styles.walletFieldRow}>
                        <CustomText style={styles.walletLabel}>Provider:</CustomText>
                        <CustomText style={styles.walletValue}>{cancellation.userWallet.walletType}</CustomText>
                    </View>
                    <View style={styles.walletFieldRow}>
                        <CustomText style={styles.walletLabel}>Mobile Number:</CustomText>
                        <CustomText style={styles.walletValue} selectable={true}>{cancellation.userWallet.accountNumber}</CustomText>
                    </View>
                    <View style={styles.walletFieldRow}>
                        <CustomText style={styles.walletLabel}>Account Name:</CustomText>
                        <CustomText style={styles.walletValue}>{cancellation.userWallet.accountName || 'N/A'}</CustomText>
                    </View>
                    <View style={styles.walletFieldRow}>
                        <CustomText style={styles.walletLabel}>Amount to Send:</CustomText>
                        <CustomText style={styles.walletAmount}>₱{(cancellation.refundAmount || totalAmountPaid).toFixed(2)}</CustomText>
                    </View>

                    <CustomButton
                        title={isUploadingProof ? "Uploading Proof..." : "Upload Proof of Refund Receipt"}
                        variant="primary"
                        icon="upload"
                        iconLibrary="Feather"
                        onPress={handlePickReceipt}
                        isLoading={isUploadingProof}
                        style={{ marginTop: 8 }}
                    />
                </View>
            )}

            {/* Manual QR Handshake: Waiting for Hiker Wallet Banner */}
            {isManualRefund && cancellation?.handshakeStep === 'awaiting_user_wallet' && !cancellation?.userWallet && (
                <View style={styles.waitingWalletBox}>
                    <View style={styles.waitingWalletLeft}>
                        <CustomIcon library="Feather" name="clock" size={16} color={Colors.STATUS_PENDING_TEXT} />
                        <CustomText style={styles.waitingWalletText}>
                            Refund approved (₱{(cancellation.refundAmount || totalAmountPaid).toFixed(2)}). Waiting for hiker to submit their GCash or Maya wallet.
                        </CustomText>
                    </View>
                    {Boolean(onRefundClick) && (
                        <TouchableOpacity
                            style={styles.changeRefundAmountBtn}
                            onPress={onRefundClick}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="edit-2" size={12} color={Colors.PRIMARY} />
                            <CustomText style={styles.changeRefundAmountBtnText}>
                                Change Amount
                            </CustomText>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Interactive Refund Resolution Banner for Paid Cancellations */}
            {isAwaitingRefundDecision && !cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl && cancellation?.handshakeStep !== 'awaiting_user_wallet' && cancellation?.handshakeStep !== 'awaiting_admin_payout' && cancellation?.handshakeStep !== 'completed' && (
                isManualRefund ? (
                    <View style={styles.actionBanner}>
                        <View style={styles.actionBannerHeader}>
                            <CustomIcon library="Feather" name="alert-circle" size={15} color="#B45309" />
                            <CustomText style={styles.actionBannerTitle}>
                                Action Required: Refund Decision
                            </CustomText>
                        </View>
                        <CustomText variant="caption" style={styles.actionBannerSubtitle}>
                            Select the refund amount to return via manual e-wallet payout, or finalize without refund.
                        </CustomText>
                        <View style={styles.actionBtnRow}>
                            {Boolean(onRefundClick || onApproveWithManualRefund) && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.refundBtn]}
                                    onPress={onRefundClick ? onRefundClick : () => onApproveWithManualRefund && onApproveWithManualRefund(totalAmountPaid)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="corner-up-left" size={14} color={Colors.WHITE} />
                                    <CustomText style={styles.refundBtnText}>
                                        Choose Refund Amount
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                            {Boolean(onCloseWithoutRefundClick) && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.finalizeBtn]}
                                    onPress={onCloseWithoutRefundClick}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="check" size={14} color={Colors.TEXT_PRIMARY} />
                                    <CustomText style={styles.finalizeBtnText}>
                                        Finalize Without Refund
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    (Boolean(onRefundClick) || Boolean(onCloseWithoutRefundClick)) && (
                        <View style={styles.actionBanner}>
                            <View style={styles.actionBannerHeader}>
                                <CustomIcon library="Feather" name="alert-circle" size={15} color="#B45309" />
                                <CustomText style={styles.actionBannerTitle}>
                                    Action Required: Finalize Refund
                                </CustomText>
                            </View>
                            <CustomText variant="caption" style={styles.actionBannerSubtitle}>
                                {isCancelledByAdmin
                                    ? "The hiker has accepted the hike cancellation. Issue a refund via PayMongo or finalize without refund if resolved offline."
                                    : "This reservation cancellation is approved. Issue a refund or finalize without refund to complete resolution."}
                            </CustomText>
                            <View style={styles.actionBtnRow}>
                                {Boolean(onRefundClick) && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.refundBtn]}
                                        onPress={onRefundClick}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon library="Feather" name="corner-up-left" size={14} color={Colors.WHITE} />
                                        <CustomText style={styles.refundBtnText}>
                                            Issue Refund via PayMongo
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                                {Boolean(onCloseWithoutRefundClick) && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.finalizeBtn]}
                                        onPress={onCloseWithoutRefundClick}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon library="Feather" name="check" size={14} color={Colors.TEXT_PRIMARY} />
                                        <CustomText style={styles.finalizeBtnText}>
                                            Finalize Without Refund
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )
                )
            )}

            {/* Optional Revert Cancellation Action for Admin-Initiated Pending Cancellations */}
            {isCancelledByAdmin && isPending && Boolean(onRevert) && (
                <TouchableOpacity
                    style={styles.revertBtn}
                    onPress={onRevert}
                    disabled={isReverting}
                    activeOpacity={0.7}
                >
                    <CustomIcon library="Feather" name="rotate-ccw" size={14} color={Colors.ERROR} />
                    <CustomText style={styles.revertBtnText}>
                        {isReverting ? 'Reverting Cancellation...' : 'Revert Cancellation'}
                    </CustomText>
                </TouchableOpacity>
            )}

            {previewAdminProof && (
                <ImagePreviewModal
                    visible={Boolean(previewAdminProof)}
                    imageUrl={previewAdminProof}
                    onClose={() => setPreviewAdminProof(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    approvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    approvedBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
        letterSpacing: 0.5,
    },
    actionRequiredBadge: {
        backgroundColor: '#FEF3C7',
    },
    actionRequiredBadgeText: {
        color: '#B45309',
    },
    headerSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 14,
    },
    infoBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 10,
    },
    declineBox: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.ERROR_BORDER,
    },
    infoBoxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoBoxLabel: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
    },
    declineBoxLabel: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.ERROR,
    },
    infoBoxTimestamp: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    infoBoxText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
    declineBoxText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: Colors.ERROR,
        fontWeight: '500',
        lineHeight: 18,
    },
    impactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 12,
        marginTop: 2,
    },
    impactItem: {
        flex: 1,
    },
    impactLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    impactValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    impactDivider: {
        width: 1,
        height: 28,
        backgroundColor: Colors.GRAY_LIGHT,
        marginHorizontal: 12,
    },
    slotPendingText: {
        color: Colors.ERROR,
    },
    slotReleasedText: {
        color: Colors.PRIMARY,
    },
    revertBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR,
        backgroundColor: Colors.WHITE,
        marginTop: 12,
    },
    revertBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    actionBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    actionBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    actionBannerTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400E',
    },
    actionBannerSubtitle: {
        fontSize: 11,
        color: '#92400E',
        lineHeight: 15,
        marginBottom: 10,
    },
    actionBtnRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 8,
        flex: 1,
        minWidth: 140,
    },
    refundBtn: {
        backgroundColor: Colors.PRIMARY,
    },
    refundBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    finalizeBtn: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
    },
    finalizeBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    manualRefundAdminBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        padding: 12,
        marginTop: 10,
    },
    manualRefundHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    manualRefundSuccessTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#166534',
    },
    manualRefundSubtitle: {
        fontSize: 11,
        color: '#15803D',
        marginBottom: 8,
    },
    viewProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        marginTop: 4,
    },
    viewProofBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    walletDetailsAdminBox: {
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        padding: 12,
        marginTop: 10,
    },
    walletDetailsTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1E40AF',
    },
    walletFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    walletLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    walletValue: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    walletAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    waitingWalletBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        padding: 12,
        marginTop: 10,
    },
    waitingWalletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    waitingWalletText: {
        fontSize: 12,
        color: '#92400E',
        flex: 1,
        lineHeight: 16,
    },
    changeRefundAmountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        marginLeft: 8,
    },
    changeRefundAmountBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
});

export default AdminCancellationCard;
