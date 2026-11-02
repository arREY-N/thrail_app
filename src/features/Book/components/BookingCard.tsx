import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import BookingCardBanner from '@/src/features/Book/components/BookingCardBanner';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { DateInput, formatBookingDate, safeParseDateString } from '@/src/utils/dateFormatter';

import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { Booking, IPayment, useBookingsStore } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { useOfferStore } from '@/src/core/models/Offer/Offer';

type RescheduledBooking = Booking & {
    rescheduledToBookingId?: string;
    rescheduledFromBookingId?: string;
};

const getFormattedUpdateStatus = (
    updatedAt: DateInput,
    createdAt: DateInput,
    status?: string,
    offerDate?: DateInput
): string => {
    let prefix = 'Updated';
    let targetDateInput: DateInput = updatedAt || createdAt;

    if (status === 'expired') {
        prefix = 'Expired';
        targetDateInput = offerDate || updatedAt || createdAt;
    } else if (status === 'finished' || status === 'completed') {
        prefix = 'Completed';
        targetDateInput = offerDate || updatedAt || createdAt;
    } else if (status === 'cancelled') {
        prefix = 'Cancelled';
        targetDateInput = updatedAt || createdAt;
    } else if (status === 'refund' || status === 'refunded') {
        prefix = 'Refunded';
        targetDateInput = updatedAt || createdAt;
    } else {
        const updateTime = updatedAt ? safeParseDateString(updatedAt).getTime() : 0;
        const createTime = createdAt ? safeParseDateString(createdAt).getTime() : 0;
        const isUpdated = updateTime > 0 && Math.abs(updateTime - createTime) > 60000;
        prefix = isUpdated ? 'Updated' : 'Booked';
        targetDateInput = isUpdated ? updatedAt : createdAt;
    }

    if (!targetDateInput) return '';

    const targetDate = safeParseDateString(targetDateInput);
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return `${prefix} just now`;
    if (diffMins < 60) return `${prefix} ${diffMins}m ago`;
    if (diffHours < 24) return `${prefix} ${diffHours}h ago`;
    if (diffDays < 7) return `${prefix} ${diffDays}d ago`;

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${prefix} ${shortMonths[targetDate.getMonth()]} ${targetDate.getDate()}`;
};

export interface BookingCardProps {
    booking: Booking | null;
    onSelectBooking: (booking: Booking) => void;
    role?: 'user' | 'admin' | 'superadmin' | 'business';
    /** Optional active cancellation request */
    cancellation?: Cancellation | null;
}

const BookingCard: React.FC<BookingCardProps> = ({
    booking,
    onSelectBooking,
    role = 'user',
    cancellation,
}) => {
    const offers = useOfferStore(s => s.data);
    const userBookings = useBookingsStore(s => s.userBookings);

    if (!booking) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateVal = booking?.offer?.date;
    const hikeDate = safeParseDateString(dateVal);
    const isPast = hikeDate.getTime() < today.getTime();

    let displayStatus = booking?.status;
    if (booking?.status === 'for-reschedule') {
        displayStatus = 'for-reschedule';
    }

    const payments = booking?.payment || [];
    const isPayMongo = payments.some(p => p.gateway === 'paymongo');
    const hasRefundedPayment = payments.some(p => p.status === 'refunded' || (p.refundedAmount || 0) > 0);
    const isAllRefunded = payments.length > 0 && payments.every(p => p.status === 'refunded');
    const isNoRefund =
        cancellation?.refundDecision === 'no_refund' ||
        (cancellation?.status === 'approved' &&
            booking?.status === 'cancelled' &&
            cancellation?.refundAmount === 0 &&
            cancellation?.handshakeStep !== 'awaiting_user_wallet' &&
            cancellation?.handshakeStep !== 'awaiting_admin_payout' &&
            !cancellation?.adminRefundReceiptUrl);

    const isRefundComplete =
        !isNoRefund &&
        (booking?.status === 'refunded' ||
            cancellation?.status === 'refund_completed' ||
            cancellation?.handshakeStep === 'completed' ||
            (isPayMongo && (isAllRefunded || hasRefundedPayment)));

    if (isNoRefund) {
        displayStatus = 'cancelled';
    } else if (cancellation?.status === 'pending') {
        if (cancellation?.cancelledBy === 'admin') {
            const hasCapturedPayments = payments.some(p => p.status === 'captured');
            if (isRefundComplete) {
                displayStatus = 'refunded';
            } else if (hasCapturedPayments || (cancellation?.refundAmount ?? 0) > 0) {
                displayStatus = 'refund';
            } else {
                displayStatus = 'cancelled';
            }
        } else {
            displayStatus = 'for-cancellation';
        }
    } else if (
        cancellation?.status === 'approved' ||
        cancellation?.status === 'refund_submitted' ||
        cancellation?.status === 'refund_disputed'
    ) {
        if (
            cancellation?.status === 'approved' &&
            booking?.status === 'cancelled' &&
            typeof cancellation?.refundAmount === 'number' &&
            cancellation.refundAmount === 0
        ) {
            displayStatus = 'cancelled';
        } else {
            const hasCapturedPayments = payments.some(p => p.status === 'captured');
            const isManualRefundPending =
                !isPayMongo &&
                ((cancellation.handshakeStep && cancellation.handshakeStep !== 'completed') ||
                    payments.some(p => p.gateway === 'manual_qr') ||
                    PAYMENT_CONFIG.PROVIDER === 'manual_qr');

            if (isRefundComplete) {
                displayStatus = 'refunded';
            } else if (isManualRefundPending && (hasCapturedPayments || cancellation.refundAmount)) {
                displayStatus = 'refund';
            } else {
                displayStatus = 'cancelled';
            }
        }
    } else if (
        cancellation?.status === 'rejected' &&
        booking?.status !== 'cancelled' &&
        booking?.status !== 'refund' &&
        booking?.status !== 'refunded'
    ) {
        displayStatus = booking.status;
    }

    if (!isNoRefund && (displayStatus === 'cancelled' || displayStatus === 'for-cancellation' || displayStatus === 'refund')) {
        if (isRefundComplete) {
            displayStatus = 'refunded';
        }
    }

    const isDead = [
        'cancelled',
        'refunded',
        'cancellation-rejected',
        'reschedule-rejected',
        'finished',
        'expired',
        'rescheduled',
    ].includes(displayStatus || '');

    if (isPast && !isDead) {
        if (['completed', 'paid'].includes(displayStatus || '')) {
            displayStatus = 'finished';
        } else {
            displayStatus = 'expired';
        }
    }

    const configRole = (role === 'admin' || role === 'superadmin') ? 'admin' : 'user';
    const statusConfig = getStatusConfig(displayStatus, configRole);

    const isSpecialFlow =
        displayStatus === 'for-reschedule' ||
        displayStatus === 'rescheduled' ||
        displayStatus === 'reschedule-rejected' ||
        displayStatus === 'for-cancellation' ||
        displayStatus === 'cancellation-rejected' ||
        displayStatus === 'cancelled' ||
        displayStatus === 'refund' ||
        displayStatus === 'refunded';

    const isCompletedOrFullyPaid =
        displayStatus === 'completed' ||
        booking?.status === 'completed' ||
        booking?.paymentVerificationStatus === 'fully_paid' ||
        isSpecialFlow;

    const isPaymentVerifying = !isCompletedOrFullyPaid && (
        booking?.paymentVerificationStatus === 'pending_verification' ||
        Boolean(booking?.payment?.some(p => p.gateway === 'manual_qr' && p.status === 'pending'))
    );

    const isPaymentRejected = !isCompletedOrFullyPaid && !isPaymentVerifying && (
        booking?.paymentVerificationStatus === 'rejected' ||
        (displayStatus === 'for-payment' && Boolean(booking?.payment?.length && booking.payment[booking.payment.length - 1].status === 'rejected'))
    );

    let actionLabel = "View Details";
    let actionColor: string = Colors.PRIMARY;
    let actionIcon = "chevron-right";

    if (!isPast && !isDead) {
        if (displayStatus === 'refund') {
            const isAwaitingDecision = cancellation?.handshakeStep === 'awaiting_admin_refund_decision' || (!cancellation?.refundAmount && cancellation?.refundDecision !== 'no_refund');
            if (isAwaitingDecision) {
                actionLabel = "Awaiting Decision";
                actionColor = Colors.STATUS_PENDING_TEXT;
            } else if (!isPayMongo && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted')) {
                actionLabel = "Confirm Receipt";
                actionColor = Colors.WARNING;
            } else if (!isPayMongo && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed')) {
                actionLabel = "Dispute Under Review";
                actionColor = Colors.ERROR;
            } else if (!isPayMongo && !cancellation?.userWallet?.accountNumber) {
                actionLabel = "Submit Wallet";
                actionColor = Colors.WARNING;
            } else if (!isPayMongo) {
                actionLabel = "Awaiting Payout";
                actionColor = Colors.PRIMARY;
            } else {
                actionLabel = "View Details";
                actionColor = Colors.PRIMARY;
            }
        } else if (['for-payment', 'approved-docs'].includes(displayStatus || '')) {
            if (isPaymentRejected) {
                actionLabel = "Resubmit Payment";
                actionColor = Colors.ERROR;
            } else if (isPaymentVerifying) {
                actionLabel = "View Details";
                actionColor = Colors.PRIMARY;
            } else {
                actionLabel = "Pay Now";
                actionColor = Colors.SUCCESS;
            }
        } else if (displayStatus === 'reservation-rejected') {
            actionLabel = "Update Docs";
            actionColor = Colors.ERROR;
        } else if (displayStatus === 'downpayment') {
            actionLabel = "Pay Balance";
            actionColor = Colors.WARNING;
        } else if (displayStatus === 'for-reschedule') {
            actionLabel = "View Details";
            actionColor = Colors.STATUS_PENDING_TEXT;
        } else if (displayStatus === 'rescheduled') {
            actionLabel = "View Details";
            actionColor = Colors.SUCCESS;
        }
    }

    const isRejection = ['reservation-rejected', 'cancellation-rejected'].includes(displayStatus || '') || isPaymentRejected;
    const isPaymentNeeded = ['for-payment', 'approved-docs'].includes(displayStatus || '') && !isPaymentVerifying;
    const isWalletNeeded = displayStatus === 'refund' && !isPayMongo && !cancellation?.userWallet?.accountNumber;
    const isConfirmReceiptNeeded = displayStatus === 'refund' && !isPayMongo && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted');
    const isOverpaymentActionNeeded = booking?.overpayment?.status === 'awaiting_hiker_wallet' || booking?.overpayment?.status === 'awaiting_user_confirmation';
    const isDownpayment = displayStatus === 'downpayment';

    const borderHighlightStyle = !isPast && !isDead
        ? isRejection || (displayStatus === 'refund' && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed'))
            ? styles.rejectionBorder
            : (isPaymentNeeded || isWalletNeeded || isConfirmReceiptNeeded || isOverpaymentActionNeeded)
                ? styles.paymentBorder
                : isDownpayment
                    ? styles.downpaymentBorder
                    : displayStatus === 'for-reschedule'
                        ? styles.rescheduleBorder
                        : null
        : null;

    const bookingUpdateTime = booking?.updatedAt ? safeParseDateString(booking.updatedAt).getTime() : 0;
    const cancelUpdateTime = cancellation?.updatedAt
        ? safeParseDateString(cancellation.updatedAt).getTime()
        : (cancellation?.createdAt ? safeParseDateString(cancellation.createdAt).getTime() : 0);

    const effectiveUpdatedAt = cancelUpdateTime > bookingUpdateTime
        ? (cancellation?.updatedAt || cancellation?.createdAt)
        : booking?.updatedAt;

    const updateStatusText = getFormattedUpdateStatus(
        effectiveUpdatedAt,
        booking?.createdAt,
        displayStatus,
        booking?.offer?.date
    );
    const trailName = booking?.trail?.name || 'Hiking Package';
    const businessName = booking?.business?.name || 'Independent Guide';
    const formattedDate = formatBookingDate(booking?.offer?.date, undefined, true);

    const extBooking = booking as RescheduledBooking | undefined;
    const targetOffer = offers?.find(o => o.id === booking?.rescheduledToOfferId);
    const targetBooking = userBookings?.find(b => {
        const ext = b as RescheduledBooking;
        return ext.id === extBooking?.rescheduledToBookingId || ext.rescheduledFromBookingId === booking?.id;
    });
    const newOfferDate = targetOffer?.date || targetBooking?.offer?.date;
    const newDateFormatted = newOfferDate ? formatBookingDate(newOfferDate, undefined, true) : null;

    const price = booking?.offer?.price || 0;
    const capturedAmount = booking?.payment?.reduce((sum: number, p: IPayment<Date>) => p.status === 'captured' ? sum + (p.amount || 0) : sum, 0) || 0;
    const remainingBalance = booking?.remainingBalance !== undefined
        ? booking.remainingBalance
        : Math.max(0, price - capturedAmount);

    // Pill color and border resolution
    const pillBgColor = isPaymentRejected
        ? Colors.ERROR_BG
        : (isPaymentVerifying
            ? Colors.STATUS_PENDING_BG
            : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted')
                ? Colors.STATUS_WARNING_BG
                : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed')
                    ? Colors.ERROR_BG
                    : statusConfig.bgColor)));

    const pillBorderColor = isPaymentRejected
        ? Colors.ERROR_BORDER
        : (isPaymentVerifying
            ? Colors.STATUS_PENDING_BORDER
            : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted')
                ? Colors.STATUS_WARNING_BORDER
                : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed')
                    ? Colors.ERROR_BORDER
                    : (statusConfig.borderColor || Colors.STATUS_PENDING_BORDER))));

    const pillTextColor = isPaymentRejected
        ? Colors.ERROR
        : (isPaymentVerifying
            ? Colors.STATUS_PENDING_TEXT
            : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted')
                ? Colors.STATUS_WARNING_TEXT
                : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed')
                    ? Colors.ERROR
                    : statusConfig.textColor)));

    const pillIconName = isPaymentRejected
        ? "alert-triangle"
        : (isPaymentVerifying
            ? "clock"
            : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted')
                ? "alert-circle"
                : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed')
                    ? "alert-triangle"
                    : statusConfig.icon)));

    const pillLabel = isPaymentRejected
        ? "PAYMENT REJECTED"
        : (isPaymentVerifying
            ? "VERIFYING PAYMENT"
            : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'awaiting_user_confirmation' || cancellation?.status === 'refund_submitted')
                ? "ACTION REQUIRED: CONFIRM RECEIPT"
                : (displayStatus === 'refund' && (cancellation?.handshakeStep === 'refund_disputed' || cancellation?.status === 'refund_disputed')
                    ? "REFUND DISPUTED"
                    : statusConfig.label)));

    return (
        <TouchableOpacity
            style={[styles.cardContainer, borderHighlightStyle]}
            onPress={() => onSelectBooking(booking)}
            activeOpacity={0.7}
        >
            <View style={styles.topRow}>
                <CustomText
                    variant="body"
                    style={styles.trailName}
                    numberOfLines={1}
                >
                    {trailName}
                </CustomText>

                <View
                    style={[
                        styles.statusPill,
                        {
                            backgroundColor: pillBgColor,
                            borderColor: pillBorderColor,
                        }
                    ]}
                >
                    <CustomIcon
                        library="Feather"
                        name={pillIconName}
                        size={12}
                        color={pillTextColor}
                    />
                    <CustomText
                        style={[
                            styles.statusPillText,
                            { color: pillTextColor }
                        ]}
                    >
                        {pillLabel}
                    </CustomText>
                </View>
            </View>

            <View style={styles.middleRow}>
                <View style={styles.infoWrapper}>
                    <CustomIcon
                        library="Feather"
                        name="user"
                        size={14}
                        color={Colors.TEXT_PLACEHOLDER}
                    />
                    <CustomText
                        variant="caption"
                        style={styles.infoText}
                        numberOfLines={1}
                    >
                        {businessName}
                    </CustomText>
                </View>

                <View style={styles.infoWrapper}>
                    <CustomIcon
                        library="Feather"
                        name="calendar"
                        size={14}
                        color={Colors.TEXT_PLACEHOLDER}
                    />
                    {displayStatus === 'rescheduled' && newDateFormatted ? (
                        <View style={styles.dateTransitionRow}>
                            <CustomText variant="caption" style={styles.dateOldText}>
                                {formattedDate}
                            </CustomText>
                            <CustomIcon
                                library="Feather"
                                name="arrow-right"
                                size={11}
                                color={Colors.PRIMARY}
                            />
                            <CustomText variant="caption" style={styles.dateNewText}>
                                {newDateFormatted}
                            </CustomText>
                        </View>
                    ) : (
                        <CustomText variant="caption" style={styles.infoText}>
                            {formattedDate}
                        </CustomText>
                    )}
                </View>
            </View>

            {isPaymentRejected && (
                <BookingCardBanner
                    status="payment-rejected"
                    reason={booking?.paymentRejectionReason}
                />
            )}

            {displayStatus === 'reservation-rejected' && (
                <BookingCardBanner
                    status="reservation-rejected"
                    reason={booking?.cancellationReason}
                />
            )}

            {displayStatus === 'cancellation-rejected' && (
                <BookingCardBanner
                    status="cancellation-rejected"
                    reason={cancellation?.adminNote}
                />
            )}

            {displayStatus === 'for-reschedule' && (
                <BookingCardBanner
                    status="for-reschedule"
                />
            )}

            <View style={styles.dottedDivider} />

            <View style={styles.bottomRow}>
                {displayStatus === 'downpayment' ? (
                    <View style={styles.flexCol}>
                        <CustomText variant="caption" style={styles.dataLabel} numberOfLines={1}>
                            Balance
                        </CustomText>
                        <CustomText
                            variant="h2"
                            style={[
                                styles.dataValue,
                                { color: Colors.WARNING }
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                        >
                            ₱{remainingBalance.toFixed(2)}
                        </CustomText>
                    </View>
                ) : (
                    <View style={styles.flexCol}>
                        <CustomText variant="caption" style={styles.dataLabel} numberOfLines={1}>
                            Total Amount
                        </CustomText>
                        <CustomText variant="h2" style={styles.dataValue} numberOfLines={1} adjustsFontSizeToFit={true}>
                            ₱{price.toFixed(2)}
                        </CustomText>
                    </View>
                )}

                <View style={styles.actionCol}>
                    <CustomText variant="caption" style={styles.updateLabel}>
                        {updateStatusText || ' '}
                    </CustomText>

                    <View style={styles.viewDetailsContainer}>
                        <CustomText
                            style={[
                                styles.viewDetailsText,
                                { color: actionColor }
                            ]}
                        >
                            {actionLabel}
                        </CustomText>
                        <CustomIcon
                            library="Feather"
                            name={actionIcon}
                            size={16}
                            color={actionColor}
                        />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
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
        ...GlobalStyles.dropShadow(3),
    },
    rejectionBorder: {
        borderColor: Colors.ERROR,
        borderWidth: 1.5,
    },
    paymentBorder: {
        borderColor: Colors.PRIMARY,
        borderWidth: 1.5,
    },
    downpaymentBorder: {
        borderColor: Colors.WARNING,
        borderWidth: 1.5,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    trailName: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: 'bold',
        paddingRight: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    middleRow: {
        gap: 8,
        marginBottom: 4,
    },
    infoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
    },
    dateTransitionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateOldText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
    },
    dateNewText: {
        color: Colors.PRIMARY,
        fontSize: 13,
        fontWeight: '600',
    },
    dottedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        borderStyle: 'dashed',
        marginVertical: 16,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
    },
    priceColumnContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    flexCol: {
        justifyContent: 'space-between',
        flexShrink: 1,
        marginRight: 8,
    },
    actionCol: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexShrink: 0,
    },
    dataLabel: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 11,
        marginBottom: 4,
    },
    updateLabel: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 11,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    dataValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 0,
    },
    viewDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginBottom: 0,
    },
    viewDetailsText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    rescheduleBorder: {
        borderColor: Colors.STATUS_PENDING_BORDER,
        borderWidth: 1.5,
    },
});

export default BookingCard;
