import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import PaymentBreakdownPanel from '@/src/features/Book/screens/MyBookings/components/PaymentBreakdownPanel';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { formatBookingDate, safeParseDateString } from '@/src/utils/dateFormatter';

export interface ReceiptScreenProps {
    bookingData: Booking;
    cancellation?: Cancellation | null;
    onFinish: () => void;
    onNavigateToBooking?: (bookingId: string) => void;
}

const formatReceiptTimestamp = (dateVal?: unknown): string => {
    if (!dateVal) return 'Recently';
    const dateObj = (dateVal && typeof dateVal === 'object' && 'toDate' in dateVal && typeof (dateVal as { toDate: () => Date }).toDate === 'function')
        ? (dateVal as { toDate: () => Date }).toDate()
        : safeParseDateString(dateVal as string | Date);
    return dateObj.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getPaymentLabel = (
    index: number,
    totalCount: number,
    amount: number,
    totalPrice: number,
    balance: number
): string => {
    if (totalCount === 1) {
        if (balance === 0 || amount >= totalPrice) {
            return '1. Full Payment';
        }
        return '1. Deposit Paid';
    }
    if (totalCount === 2) {
        return index === 0 ? '1. Deposit Paid' : '2. Remaining Balance Paid';
    }
    return `Payment #${index + 1}`;
};

const ReceiptScreen = ({
    bookingData,
    cancellation,
    onFinish,
    onNavigateToBooking,
}: ReceiptScreenProps): React.JSX.Element => {
    const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
    const payments = Array.isArray(bookingData?.payment)
        ? bookingData.payment.filter((p: IPayment<Date>) => p.status !== 'abandoned')
        : [];
    const capturedPayments = payments.filter((p: IPayment<Date>) => p.status === 'captured');
    const refundedPayments = payments.filter((p: IPayment<Date>) => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
    const calculatedRefunded = payments.reduce((sum: number, p: IPayment<Date>) => sum + (p.refundedAmount || (p.status === 'refunded' ? p.amount : 0)), 0);
    const totalRefunded = (typeof bookingData?.refundedAmount === 'number' && bookingData.refundedAmount > 0)
        ? bookingData.refundedAmount
        : (typeof cancellation?.refundAmount === 'number' && cancellation.refundAmount > 0
            ? cancellation.refundAmount
            : calculatedRefunded);
    const hasRefund = totalRefunded > 0 || refundedPayments.length > 0;

    const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const extBooking = bookingData as Booking & {
        rescheduledFromBookingId?: string;
        rescheduledToBookingId?: string;
    };
    const isNewRescheduled = Boolean(extBooking?.rescheduledFromBookingId);
    const isOldRescheduled = bookingData?.status === 'rescheduled' && Boolean(extBooking?.rescheduledToBookingId);

    const refundProofReceiptUrl = cancellation?.adminRefundReceiptUrl ||
        payments.find((p: IPayment<Date>) => Boolean(p.refundProofUrl))?.refundProofUrl;

    const latestPayment: IPayment<Date> = capturedPayments[capturedPayments.length - 1] || refundedPayments[refundedPayments.length - 1] || payments[0];

    const totalAmount = bookingData?.offer?.price || 0;
    const isRefunded = bookingData?.status === 'refunded' || bookingData?.status === 'refund' || hasRefund;

    const totalPaid = capturedPayments.length > 0
        ? capturedPayments.reduce((sum: number, p: IPayment<Date>) => sum + (p.amount || 0), 0)
        : (isRefunded ? 0 : (['completed', 'paid'].includes(bookingData?.status || '') ? totalAmount : 0));

    const remainingBalance = typeof bookingData?.remainingBalance === 'number'
        ? bookingData.remainingBalance
        : Math.max(0, totalAmount - totalPaid);

    const hasUnrecordedRefund = refundedPayments.some((p: IPayment<Date>) => p.refundedAmount === undefined || p.refundedAmount === null);

    const totalOriginalAmountForRefunded = refundedPayments.reduce((sum: number, p: IPayment<Date>) => sum + (p.amount || 0), 0);
    const refundPercentageLabel = (totalRefunded > 0 && totalOriginalAmountForRefunded > 0)
        ? ` (${Math.round((totalRefunded / totalOriginalAmountForRefunded) * 100)}%)`
        : '';

    const formattedDate = formatBookingDate(bookingData?.offer?.date);

    let datePaid = 'Recently';
    if (latestPayment?.paidAt || latestPayment?.createdAt) {
        datePaid = formatReceiptTimestamp(latestPayment.paidAt || latestPayment.createdAt);
    }

    const isVerifying = bookingData?.status === 'paid' && bookingData?.paymentVerificationStatus === 'pending_verification';

    let headerTitle = isVerifying ? "Verifying Payment" : "Payment Successful!";
    let headerSubtitle = isVerifying
        ? "Your transaction receipt has been sent. The provider is currently verifying it."
        : "Your transaction was verified. Present this digital receipt to your guide on the day of the hike.";

    let headerColor: string = Colors.PRIMARY;
    let headerIcon: string = isVerifying ? "clock" : "check";

    if (isRefunded) {
        headerTitle = "Refund Processed!";
        headerSubtitle = "A refund has been processed for this booking. The refunded amount has been returned to your original payment method.";
        headerColor = Colors.SUCCESS;
        headerIcon = "check-circle";
    } else if (isOldRescheduled) {
        headerTitle = "Hike Rescheduled";
        headerSubtitle = "This reservation was moved to a new hike schedule. All verified payments were transferred to your updated booking.";
        headerColor = Colors.PRIMARY;
        headerIcon = "calendar";
    }

    const bookingRefId = bookingData?.id ? `#${bookingData.id.slice(-6).toUpperCase()}` : null;
    const organizerName = bookingData?.business?.name || null;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Official Receipt"
                centerTitle={true}
                onBackPress={onFinish}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    <View style={styles.successHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: headerColor }]}>
                            <CustomIcon library="Feather" name={headerIcon} size={28} color={Colors.WHITE} />
                        </View>
                        <CustomText variant="h2" style={styles.successTitle}>
                            {headerTitle}
                        </CustomText>
                        <CustomText variant="body" style={styles.successSubtitle}>
                            {headerSubtitle}
                        </CustomText>
                    </View>

                    <View style={styles.ticketCard}>
                        <View style={styles.ticketHeader}>
                            <View style={styles.ticketHeaderRow}>
                                <View style={styles.ticketTitleContainer}>
                                    <CustomText variant="h3" style={styles.trailName}>
                                        {bookingData?.trail?.name || 'Trail Hike'}
                                    </CustomText>
                                    {Boolean(organizerName) && (
                                        <CustomText variant="caption" style={styles.guideName}>
                                            Organizer: {organizerName}
                                        </CustomText>
                                    )}
                                </View>
                                {Boolean(bookingRefId) && (
                                    <View style={styles.bookingIdBadge}>
                                        <CustomText variant="caption" style={styles.bookingIdText}>
                                            {bookingRefId}
                                        </CustomText>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.dottedDivider} />

                        {/* Top Financial Breakdown: Total Price, Amount Already Paid, Remaining Balance */}
                        <View style={styles.breakdownPanelContainer}>
                            <PaymentBreakdownPanel
                                totalPrice={totalAmount}
                                amountPaid={totalPaid}
                                remainingBalance={isOldRescheduled ? 0 : remainingBalance}
                                refundedAmount={totalRefunded}
                                variant="receipt"
                            />
                        </View>

                        <View style={styles.dottedDivider} />

                        <View style={styles.infoSection}>
                            {/* Booking Details */}
                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Booking Details
                            </CustomText>

                            <View style={styles.dataRow}>
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Hiker Name</CustomText>
                                <CustomText variant="body" style={styles.value} numberOfLines={1}>
                                    {bookingData?.user?.firstname} {bookingData?.user?.lastname}
                                </CustomText>
                            </View>

                            <View style={styles.dataRow}>
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Schedule</CustomText>
                                <CustomText variant="body" style={styles.value}>
                                    {formattedDate}
                                    {isNewRescheduled && (
                                        <CustomText style={styles.rescheduledInlineText}>
                                            {' '}•{' '}Rescheduled
                                        </CustomText>
                                    )}
                                    {isOldRescheduled && (
                                        <CustomText style={styles.movedInlineText}>
                                            {' '}(Moved)
                                        </CustomText>
                                    )}
                                </CustomText>
                            </View>

                            {isNewRescheduled && Boolean(extBooking?.rescheduledFromBookingId) && (
                                <View style={styles.dataRow}>
                                    <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Transferred From</CustomText>
                                    <TouchableOpacity
                                        style={styles.provenanceShortcutBtn}
                                        activeOpacity={0.7}
                                        onPress={() => onNavigateToBooking?.(extBooking.rescheduledFromBookingId!)}
                                        disabled={!onNavigateToBooking}
                                    >
                                        <CustomText style={styles.provenanceShortcutText}>
                                            Booking #{extBooking.rescheduledFromBookingId!.slice(-6).toUpperCase()}
                                        </CustomText>
                                        <CustomIcon library="Feather" name="arrow-right" size={13} color={Colors.PRIMARY} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {isOldRescheduled && Boolean(extBooking?.rescheduledToBookingId) && (
                                <View style={styles.dataRow}>
                                    <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Rescheduled To</CustomText>
                                    <TouchableOpacity
                                        style={styles.provenanceShortcutBtn}
                                        activeOpacity={0.7}
                                        onPress={() => onNavigateToBooking?.(extBooking.rescheduledToBookingId!)}
                                        disabled={!onNavigateToBooking}
                                    >
                                        <CustomText style={styles.provenanceShortcutText}>
                                            Booking #{extBooking.rescheduledToBookingId!.slice(-6).toUpperCase()}
                                        </CustomText>
                                        <CustomIcon library="Feather" name="arrow-right" size={13} color={Colors.PRIMARY} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.divider} />

                            {/* Verified Payment Audit Log */}
                            <CustomText variant="caption" style={styles.auditSectionHeader}>
                                PAYMENT HISTORY ({capturedPayments.length} {capturedPayments.length === 1 ? 'PAYMENT' : 'PAYMENTS'})
                            </CustomText>

                            {capturedPayments.length > 0 ? (
                                capturedPayments.map((cp: IPayment<Date>, cIdx: number) => {
                                    const baseLabel = getPaymentLabel(
                                        cIdx,
                                        capturedPayments.length,
                                        cp.amount || 0,
                                        totalAmount,
                                        remainingBalance
                                    );
                                    const paymentLabel = isOldRescheduled ? `${baseLabel} (Transferred)` : baseLabel;
                                    const paymentTimestamp = formatReceiptTimestamp(cp.paidAt || cp.createdAt || cp.verifiedAt);
                                    const refLabel = cp.referenceCode ? `Ref: ${cp.referenceCode}` : 'Ref: N/A';

                                    return (
                                        <View key={cIdx} style={styles.auditPaymentItem}>
                                            <View style={styles.auditPaymentRow}>
                                                <CustomText variant="body" style={styles.auditPaymentName}>
                                                    {paymentLabel}
                                                </CustomText>
                                                <CustomText variant="body" style={styles.auditPaymentAmount}>
                                                    {formatCurrency(cp.amount || 0)}
                                                </CustomText>
                                            </View>
                                            <View style={styles.auditMetaRow}>
                                                <CustomText variant="caption" style={styles.auditMetaText}>
                                                    {paymentTimestamp}
                                                </CustomText>
                                                <CustomText variant="caption" style={styles.auditMetaText}>
                                                    {refLabel}
                                                </CustomText>
                                            </View>
                                        </View>
                                    );
                                })
                            ) : (
                                totalPaid > 0 ? (
                                    <View style={styles.auditPaymentItem}>
                                        <View style={styles.auditPaymentRow}>
                                            <CustomText variant="body" style={styles.auditPaymentName}>
                                                {isOldRescheduled ? "1. Deposit Paid (Transferred)" : "1. Deposit Paid"}
                                            </CustomText>
                                            <CustomText variant="body" style={styles.auditPaymentAmount}>
                                                {formatCurrency(totalPaid)}
                                            </CustomText>
                                        </View>
                                        <View style={styles.auditMetaRow}>
                                            <CustomText variant="caption" style={styles.auditMetaText}>
                                                {datePaid}
                                            </CustomText>
                                            {Boolean(latestPayment?.referenceCode) && (
                                                <CustomText variant="caption" style={styles.auditMetaText}>
                                                    Ref: {latestPayment.referenceCode}
                                                </CustomText>
                                            )}
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.auditPaymentItem}>
                                        <CustomText variant="caption" style={styles.auditMetaText}>
                                            No verified payments recorded.
                                        </CustomText>
                                    </View>
                                )
                            )}

                            {Boolean(bookingData?.overpayment && bookingData.overpayment.excessAmount > 0) && (() => {
                                const op = bookingData.overpayment;
                                const isCompleted = op?.status === 'completed';
                                const isSent = op?.status === 'awaiting_user_confirmation';
                                const isDisputed = op?.status === 'refund_disputed';
                                const isWalletNeeded = op?.status === 'awaiting_hiker_wallet';

                                const label = isCompleted
                                    ? 'Overpayment Excess (Refunded)'
                                    : isSent
                                    ? 'Overpayment Excess (Sent)'
                                    : isDisputed
                                    ? 'Overpayment Excess (Disputed)'
                                    : 'Overpayment Excess';

                                const meta = isCompleted
                                    ? `Refund confirmed & credited to ${op?.userWallet?.walletType || 'e-wallet'}`
                                    : isSent
                                    ? 'Payout proof uploaded — awaiting confirmation'
                                    : isDisputed
                                    ? 'Payout reported not received'
                                    : isWalletNeeded
                                    ? 'Awaiting e-wallet submission'
                                    : 'To be refunded by organizer';

                                const color = isCompleted
                                    ? Colors.PRIMARY
                                    : isDisputed
                                    ? Colors.ERROR
                                    : Colors.WARNING;

                                return (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.dataRow}>
                                            <View style={styles.flexCol}>
                                                <CustomText variant="caption" color={color}>
                                                    {label}
                                                </CustomText>
                                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                                                    {meta}
                                                </CustomText>
                                            </View>
                                            <CustomText variant="body" style={[styles.value, { color }]}>
                                                +{formatCurrency(op?.excessAmount || 0)}
                                            </CustomText>
                                        </View>
                                    </>
                                );
                            })()}

                            {(totalRefunded > 0 || refundedPayments.length > 0) && (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.dataRow}>
                                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                                            Amount Refunded{refundPercentageLabel}
                                        </CustomText>
                                        <CustomText variant="body" style={[styles.value, { color: Colors.ERROR }]}>
                                            {hasUnrecordedRefund && totalRefunded === 0
                                                ? 'Not recorded'
                                                : `-${formatCurrency(totalRefunded)}`
                                            }
                                        </CustomText>
                                    </View>
                                </>
                            )}

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <CustomText variant="body" style={styles.totalLabel}>
                                    {isRefunded && totalRefunded > 0
                                        ? "Net Amount Paid"
                                        : (isOldRescheduled ? "Total Transferred Amount" : "Total Amount Paid")}
                                </CustomText>
                                <CustomText
                                    variant="h2"
                                    style={[styles.totalValue, { color: isRefunded ? Colors.TEXT_PRIMARY : headerColor }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                >
                                    {formatCurrency(isRefunded && totalRefunded > 0 ? Math.max(0, totalPaid - totalRefunded) : totalPaid)}
                                </CustomText>
                            </View>
                        </View>
                    </View>

                    {Boolean(refundProofReceiptUrl) && (
                        <View style={styles.refundProofCard}>
                            <View style={styles.refundProofHeader}>
                                <View style={styles.refundProofIconBox}>
                                    <CustomIcon library="Feather" name="check-circle" size={18} color={Colors.SUCCESS} />
                                </View>
                                <View style={styles.refundProofHeaderTextGroup}>
                                    <CustomText variant="label" style={styles.refundProofTitle}>
                                        Organizer Refund Receipt Proof
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.refundProofSubtitle}>
                                        Official payout proof transferred to your e-wallet.
                                    </CustomText>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.viewProofButton}
                                onPress={() => setPreviewProofUrl(refundProofReceiptUrl || null)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon library="Feather" name="eye" size={16} color={Colors.PRIMARY} />
                                <CustomText style={styles.viewProofButtonText}>View Refund Receipt Proof</CustomText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {previewProofUrl && (
                <ImagePreviewModal
                    visible={Boolean(previewProofUrl)}
                    imageUrl={previewProofUrl}
                    onClose={() => setPreviewProofUrl(null)}
                />
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 60,
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        ...GlobalStyles.dropShadow(2),
    },
    successTitle: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
        textAlign: 'center',
    },
    successSubtitle: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        lineHeight: 18,
        paddingHorizontal: 15,
    },
    ticketCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(3),
        marginBottom: 20,
    },
    ticketHeader: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: Colors.WHITE,
    },
    ticketHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    ticketTitleContainer: {
        flex: 1,
    },
    bookingIdBadge: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        flexShrink: 0,
    },
    bookingIdText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    breakdownPanelContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    trailName: {
        color: Colors.PRIMARY,
        fontSize: 19,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    guideName: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
    },
    dottedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderStyle: 'dashed',
        marginHorizontal: -10,
    },
    infoSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 14,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    value: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    rescheduledInlineText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.PRIMARY,
    },
    movedInlineText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    },
    provenanceShortcutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    provenanceShortcutText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.PRIMARY,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 14,
    },
    auditSectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 12,
    },
    auditPaymentItem: {
        marginBottom: 12,
    },
    auditPaymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    auditPaymentName: {
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        flex: 1,
    },
    auditPaymentAmount: {
        fontWeight: '700',
        color: Colors.PRIMARY,
        fontSize: 14,
        marginLeft: 8,
    },
    auditMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    auditMetaText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    flexCol: {
        flex: 1,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 15,
        color: Colors.TEXT_PRIMARY,
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 22,
    },
    refundProofCard: {
        marginTop: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    refundProofHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    refundProofIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    refundProofHeaderTextGroup: {
        flex: 1,
    },
    refundProofTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    refundProofSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    viewProofButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    viewProofButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.PRIMARY,
    },
});

export default ReceiptScreen;
