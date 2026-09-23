/**
 * @file AdminCancellationCard.tsx
 * @description In-page review card for tour organizers displaying cancellation request status,
 * hiker reason, submission timestamp, financial impact, and organizer decline notes.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { formatBookingDate } from '@/src/utils/dateFormatter';

/**
 * Props for AdminCancellationCard.
 * @param status - Current workflow status of the booking.
 * @param cancellationReason - Reason submitted by the hiker.
 * @param declineReason - Decline explanation/adminNote provided by organizer if declined.
 * @param totalAmountPaid - Total captured payment amount for the booking.
 * @param requestedAt - Optional timestamp when the cancellation was requested.
 * @param cancelledBy - Optional name/role of who cancelled the booking.
 */
export interface AdminCancellationCardProps {
    status: string;
    cancellationReason?: string;
    declineReason?: string;
    totalAmountPaid: number;
    requestedAt?: Date | null;
    cancelledBy?: string;
}

/**
 * AdminCancellationCard — Renders contextual cancellation details within the Admin ReviewScreen.
 */
const AdminCancellationCard: React.FC<AdminCancellationCardProps> = ({
    status,
    cancellationReason,
    declineReason,
    totalAmountPaid,
    requestedAt,
    cancelledBy,
}) => {
    const isPending = status === 'for-cancellation';
    const isDeclined = status === 'cancellation-rejected';
    const isRefunded = status === 'refund' || status === 'refunded';
    const isCancelled = status === 'cancelled';

    if (!isPending && !isDeclined && !isRefunded && !isCancelled) {
        return null;
    }

    const isPaid = totalAmountPaid > 0;
    const statusConfig = getStatusConfig(status, 'admin');

    return (
        <View style={styles.cardContainer}>
            {/* Header Row: Title & Icon on Left, Official Status Badge on Right */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <CustomIcon
                        library="Feather"
                        name={statusConfig.icon}
                        size={16}
                        color={statusConfig.textColor}
                    />
                    <CustomText style={styles.headerTitle}>
                        Cancellation Review
                    </CustomText>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <CustomText style={[styles.statusBadgeText, { color: statusConfig.textColor }]}>
                        {statusConfig.label}
                    </CustomText>
                </View>
            </View>

            <CustomText variant="caption" style={styles.headerSubtitle}>
                {isPending
                    ? 'Hiker requested to cancel this reservation. Review reason and inventory status.'
                    : isDeclined
                    ? 'Organizer declined this request. Hiker can submit an appeal.'
                    : isRefunded
                    ? 'Cancellation approved and refund issued via PayMongo.'
                    : `Booking cancelled by ${cancelledBy || 'Hiker'}. Reserved slot released.`}
            </CustomText>

            {/* Hiker Reason Box (for pending, cancelled, or declined) */}
            {cancellationReason ? (
                <View style={styles.infoBox}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.infoBoxLabel}>
                            HIKER&apos;S SUBMITTED REASON
                        </CustomText>
                        {requestedAt && (
                            <CustomText variant="caption" style={styles.infoBoxTimestamp}>
                                {formatBookingDate(requestedAt)}
                            </CustomText>
                        )}
                    </View>
                    <CustomText style={styles.infoBoxText}>
                        &ldquo;{cancellationReason}&rdquo;
                    </CustomText>
                </View>
            ) : null}

            {/* Organizer Decline Reason Box (if declined) */}
            {isDeclined && declineReason ? (
                <View style={[styles.infoBox, styles.declineBox]}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.declineBoxLabel}>
                            ORGANIZER&apos;S DECLINE NOTE
                        </CustomText>
                    </View>
                    <CustomText style={styles.declineBoxText}>
                        &ldquo;{declineReason}&rdquo;
                    </CustomText>
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
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontWeight: 'bold',
        fontSize: 10,
        textTransform: 'uppercase',
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
});

export default AdminCancellationCard;
