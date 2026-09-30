import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ExpandableText from '@/src/components/ExpandableText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
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
    requestedAt?: Date | null;
    cancelledBy?: string;
    onRevert?: () => void;
    isReverting?: boolean;
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
    requestedAt,
    cancelledBy,
    onRevert,
    isReverting = false,
}) => {
    const isCancelledByAdmin =
        cancellation?.cancelledBy === 'admin' || cancelledBy === 'admin';

    const isPending = cancellation
        ? cancellation.status === 'pending'
        : status === 'for-cancellation';
    const isDeclined = cancellation
        ? cancellation.status === 'rejected'
        : status === 'cancellation-rejected';
    const isRefunded =
        (cancellation?.status === 'approved' && totalAmountPaid > 0) ||
        status === 'refund' ||
        status === 'refunded';
    const isCancelled =
        status === 'cancelled' ||
        (cancellation?.status === 'approved' && totalAmountPaid === 0);

    if (!isPending && !isDeclined && !isRefunded && !isCancelled) {
        return null;
    }

    const isPaid = totalAmountPaid > 0;

    const isApproved =
        cancellation?.status === 'approved' ||
        status === 'cancelled' ||
        status === 'refund' ||
        status === 'refunded';

    const headerTitle = isCancelledByAdmin
        ? 'Hike Cancelled by Organizer'
        : isDeclined
        ? 'Cancellation Request Declined'
        : isApproved
        ? (isRefunded ? 'Cancellation Approved & Refunded' : 'Cancellation Approved')
        : 'Cancellation Review';

    const headerIcon = isCancelledByAdmin
        ? 'slash'
        : isDeclined
        ? 'x-circle'
        : isApproved
        ? 'check-circle'
        : 'alert-triangle';

    const iconColor = isCancelledByAdmin || isDeclined || isPending
        ? Colors.ERROR
        : Colors.SUCCESS;

    const subtitleText = isCancelledByAdmin
        ? (isPending
            ? 'You cancelled this reservation. Hiker has been notified.'
            : 'Booking cancelled by organizer. Reserved slot released.')
        : (isPending
            ? 'Hiker requested to cancel this reservation. Review reason and inventory status.'
            : isDeclined
            ? 'Organizer declined this request. Hiker can submit an appeal.'
            : isRefunded
            ? 'Cancellation approved and refund issued via PayMongo.'
            : `Booking cancelled by ${cancelledBy || 'Hiker'}. Reserved slot released.`);

    const resolvedReason =
        cancellation?.reason || cancellationReason;
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
                    <View style={styles.approvedBadge}>
                        <CustomIcon library="Feather" name="check" size={12} color={Colors.SUCCESS} />
                        <CustomText style={styles.approvedBadgeText}>
                            APPROVED
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
            <View style={styles.impactRow}>
                <View style={styles.impactItem}>
                    <CustomText variant="caption" style={styles.impactLabel}>
                        PAYMENT CAPTURED
                    </CustomText>
                    <CustomText style={styles.impactValue}>
                        {isPaid ? `₱${totalAmountPaid.toFixed(2)}` : '₱0.00 (Unpaid)'}
                    </CustomText>
                </View>
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
});

export default AdminCancellationCard;
