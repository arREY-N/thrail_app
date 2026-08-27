/**
 * @file ActivityLog.tsx
 * @description Renders chronological log/timeline of booking status updates and transaction events.
 */

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { formatDateToStandard } from '@/src/utils/dateFormatter';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface TimelineEvent {
    title: string;
    time: string;
    desc: string;
    status?: string;
    reason?: string;
    color: string;
    sortDate: Date;
}

/**
 * Props for ActivityLog component.
 * @param booking - The booking details model.
 * @param currentStatus - The derived current workflow status.
 */
interface ActivityLogProps {
    booking: Booking;
    currentStatus: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ booking, currentStatus }) => {
    if (!booking) return null;

    // Helper to get status color from statusConfig, adjusting for white badge text to primary theme color
    const getStatusThemeColor = (statusKey: string): string => {
        const config = getStatusConfig(statusKey, 'admin');
        if (config.textColor === Colors.WHITE) {
            return Colors.PRIMARY;
        }
        return config.textColor;
    };

    const timelineEvents: TimelineEvent[] = [];

    // Helper to build dates
    const getEventDate = (dateObj: any) => dateObj ? new Date(dateObj) : new Date();

    // 1. Booking Initiated
    if (booking.createdAt) {
        timelineEvents.push({
            title: "Booking Initiated",
            time: formatDateToStandard(booking.createdAt),
            desc: "Hiker requested slot reservation.",
            status: getStatusConfig('for-reservation', 'admin').label,
            color: getStatusThemeColor('for-reservation'),
            sortDate: getEventDate(booking.createdAt)
        });
    }

    // 2. Documents status
    if (booking.status === 'reservation-rejected') {
        timelineEvents.push({
            title: "Reservation Rejected",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: `Rejected by ${booking.cancelledBy || 'Admin'}.`,
            reason: booking.cancellationReason || 'N/A',
            status: getStatusConfig('reservation-rejected', 'admin').label,
            color: getStatusThemeColor('reservation-rejected'),
            sortDate: getEventDate(booking.updatedAt)
        });
    } else if (booking.status === 'pending-docs') {
        timelineEvents.push({
            title: "Documents Pending Re-upload",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Admin requested hiker to re-upload clear document copies.",
            reason: booking.cancellationReason || 'N/A',
            status: getStatusConfig('pending-docs', 'admin').label,
            color: getStatusThemeColor('pending-docs'),
            sortDate: getEventDate(booking.updatedAt)
        });
    } else if (booking.status === 'approved-docs' || booking.status === 'for-payment' || 
               ['paid', 'downpayment', 'completed', 'finished', 'for-cancellation', 'cancellation-rejected', 'cancelled', 'refund', 'refunded', 'for-reschedule', 'reschedule-rejected', 'rescheduled'].includes(booking.status)) {
        timelineEvents.push({
            title: "Documents Verified",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "All required documents approved. Awaiting hiker payment.",
            status: getStatusConfig('for-payment', 'admin').label,
            color: getStatusThemeColor('for-payment'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 3. Payment Transitions
    if (Array.isArray(booking.payment)) {
        booking.payment.forEach((paymentRecord: IPayment<Date>) => {
            const paymentDate = getEventDate(paymentRecord.createdAt);
            
            if (paymentRecord.status === 'captured') {
                const isPaidStatus = booking.status === 'paid' || booking.status === 'completed' || booking.status === 'finished';
                timelineEvents.push({
                    title: "Payment Captured",
                    time: paymentRecord.createdAt ? formatDateToStandard(paymentRecord.createdAt) : '',
                    desc: `Processed via ${paymentRecord.gateway.toUpperCase()}. Amount: ₱${paymentRecord.amount.toFixed(2)}`,
                    status: isPaidStatus ? "FULLY PAID" : "DOWNPAYMENT (50%)",
                    color: isPaidStatus ? getStatusThemeColor('completed') : getStatusThemeColor('downpayment'),
                    sortDate: paymentDate
                });
            } else if (paymentRecord.status === 'refunded') {
                timelineEvents.push({
                    title: "Payment Refunded",
                    time: paymentRecord.createdAt ? formatDateToStandard(paymentRecord.createdAt) : '',
                    desc: `Refunded via ${paymentRecord.gateway.toUpperCase()}. Amount: ₱${(paymentRecord.refundedAmount || paymentRecord.amount).toFixed(2)}`,
                    status: "REFUNDED",
                    color: getStatusThemeColor('refund'),
                    sortDate: paymentDate
                });
            }
        });
    }

    // 4. Reschedule Transitions
    if (booking.status === 'for-reschedule') {
        timelineEvents.push({
            title: "Reschedule Requested",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Hiker submitted a rescheduling request, awaiting review.",
            reason: booking.cancellationReason || undefined,
            status: getStatusConfig('for-reschedule', 'admin').label,
            color: getStatusThemeColor('for-reschedule'),
            sortDate: getEventDate(booking.updatedAt)
        });
    } else if (booking.status === 'rescheduled') {
        timelineEvents.push({
            title: "Booking Rescheduled",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Admin approved the reschedule request.",
            status: getStatusConfig('rescheduled', 'admin').label,
            color: getStatusThemeColor('rescheduled'),
            sortDate: getEventDate(booking.updatedAt)
        });
    } else if (booking.status === 'reschedule-rejected') {
        timelineEvents.push({
            title: "Reschedule Request Declined",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Admin declined the reschedule request.",
            reason: booking.cancellationReason || 'N/A',
            status: getStatusConfig('reschedule-rejected', 'admin').label,
            color: getStatusThemeColor('reschedule-rejected'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 5. Cancellation transitions
    if (booking.status === 'cancelled') {
        timelineEvents.push({
            title: "Booking Cancelled",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Cancelled by Hiker.",
            reason: booking.cancellationReason || 'N/A',
            status: getStatusConfig('cancelled', 'admin').label,
            color: getStatusThemeColor('cancelled'),
            sortDate: getEventDate(booking.updatedAt)
        });
    } else if (booking.status === 'for-cancellation') {
        timelineEvents.push({
            title: "Cancellation Requested",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Hiker has submitted a cancellation request, awaiting review.",
            reason: booking.cancellationReason || 'N/A',
            status: getStatusConfig('for-cancellation', 'admin').label,
            color: getStatusThemeColor('for-cancellation'),
            sortDate: getEventDate(booking.updatedAt)
        });
    } else if (booking.status === 'cancellation-rejected') {
        timelineEvents.push({
            title: "Cancellation Request Declined",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Admin declined the hiker's cancellation request.",
            reason: booking.cancellationReason || 'N/A',
            status: getStatusConfig('cancellation-rejected', 'admin').label,
            color: getStatusThemeColor('cancellation-rejected'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 6. Explicit Refund Status
    if (booking.status === 'refund') {
        timelineEvents.push({
            title: "Booking Refunded",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Booking has been explicitly refunded by the admin.",
            reason: booking.cancellationReason || undefined,
            status: getStatusConfig('refund', 'admin').label,
            color: getStatusThemeColor('refund'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 7. Booking Completed
    if (booking.status === 'completed' || booking.status === 'finished') {
        timelineEvents.push({
            title: "Booking Completed",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Documents approved and payment successfully verified.",
            status: getStatusConfig('completed', 'admin').label,
            color: getStatusThemeColor('completed'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 8. Booking Finished
    if (booking.status === 'finished') {
        timelineEvents.push({
            title: "Hike Concluded",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "The hike event has successfully concluded.",
            status: getStatusConfig('finished', 'admin').label,
            color: getStatusThemeColor('finished'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 9. Booking Expired
    if (currentStatus === 'expired') {
        const expiredDate = booking.offer?.date ? new Date(booking.offer.date) : new Date();
        timelineEvents.push({
            title: "Booking Expired",
            time: booking.offer?.date ? formatDateToStandard(booking.offer.date) : '',
            desc: "The reservation has expired because the offer date has passed without completion.",
            status: getStatusConfig('expired', 'admin').label,
            color: getStatusThemeColor('expired'),
            sortDate: expiredDate
        });
    }

    // Sort timeline events chronologically by sortDate
    timelineEvents.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    return (
        <View style={styles.timelineCard}>
            <CustomText variant="h3" style={styles.timelineTitle}>
                Activity Log
            </CustomText>
            <View style={styles.timelineList}>
                {timelineEvents.map((evt, idx) => (
                    <View key={idx} style={styles.timelineItem}>
                        <View style={styles.timelineLineWrapper}>
                            <View style={[styles.timelineDot, { backgroundColor: evt.color }]} />
                            {idx < timelineEvents.length - 1 && <View style={styles.timelineLine} />}
                        </View>
                        <View style={styles.timelineTextWrapper}>
                            <View style={styles.timelineHeaderRow}>
                                <CustomText style={styles.timelineEventTitle}>{evt.title}</CustomText>
                                <CustomText style={styles.timelineTime}>{evt.time}</CustomText>
                            </View>
                            <CustomText style={styles.timelineDesc}>{evt.desc}</CustomText>
                            
                            {evt.status && (
                                <CustomText style={[styles.timelineStatusText, { color: evt.color }]}>
                                    Status: {evt.status}
                                </CustomText>
                            )}
                            
                            {evt.reason && (
                                <CustomText style={[styles.timelineReasonText, { color: evt.color }]}>
                                    Reason: {evt.reason}
                                </CustomText>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    timelineCard: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        marginTop: 16,
        ...GlobalStyles.dropShadow(3),
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 16
    },
    timelineList: {
        flexDirection: 'column'
    },
    timelineItem: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 16
    },
    timelineLineWrapper: {
        alignItems: 'center',
        width: 10
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
        zIndex: 1
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginTop: 6,
        marginBottom: -16
    },
    timelineTextWrapper: {
        flex: 1,
        marginTop: -2
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    timelineEventTitle: {
        fontWeight: 'bold',
        fontSize: 13,
        color: Colors.TEXT_PRIMARY
    },
    timelineTime: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY
    },
    timelineDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16
    },
    timelineReasonText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: -6
    },
    timelineStatusText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 4,
        textTransform: 'uppercase'
    }
});

export default ActivityLog;
