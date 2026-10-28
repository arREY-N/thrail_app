/**
 * @file ActivityLog.tsx
 * @description Renders chronological log/timeline of booking status updates and transaction events.
 */

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
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
 * @param cancellation - Optional cancellation request details.
 */
export interface ActivityLogProps {
    booking: Booking;
    currentStatus: string;
    cancellation?: Cancellation | null;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ booking, currentStatus, cancellation }) => {
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
    const getEventDate = (dateObj: unknown) => {
        if (!dateObj) return new Date();
        if (dateObj instanceof Date) return dateObj;
        if (typeof dateObj === 'object' && dateObj !== null && 'toDate' in dateObj && typeof (dateObj as { toDate: () => Date }).toDate === 'function') {
            return (dateObj as { toDate: () => Date }).toDate();
        }
        return new Date(dateObj as string | number);
    };

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

    // 2. Phone Verifications
    if (booking.user?.phoneVerifiedAt) {
        timelineEvents.push({
            title: "Personal Phone Verified",
            time: formatDateToStandard(booking.user.phoneVerifiedAt),
            desc: `Verified hiker phone number (${booking.user.phoneNumber}).`,
            status: "VERIFIED",
            color: Colors.PRIMARY,
            sortDate: getEventDate(booking.user.phoneVerifiedAt)
        });
    }

    const rawEmergencyVerified = booking.emergencyContact?.phoneVerifiedAt ?? (booking.emergencyContact as { verifiedAt?: unknown })?.verifiedAt;
    if (rawEmergencyVerified) {
        const emergencyDate = getEventDate(rawEmergencyVerified);
        timelineEvents.push({
            title: "Emergency Contact Verified",
            time: formatDateToStandard(emergencyDate),
            desc: `Verified emergency contact (${booking.emergencyContact.name} - ${booking.emergencyContact.contactNumber}).`,
            status: "VERIFIED",
            color: Colors.PRIMARY,
            sortDate: emergencyDate
        });
    }

    const hasRejectedDocs = Array.isArray(booking.documents) && booking.documents.some(d => d.valid === 'rejected');
    const hasAllDocsApproved = Array.isArray(booking.documents) && booking.documents.length > 0 && booking.documents.every(d => d.valid === 'approved');
    const docRejectionNote = (booking as unknown as { documentRejectionReason?: string }).documentRejectionReason || (hasRejectedDocs ? booking.cancellationReason : undefined);

    // 3. Documents Review & Decision
    if (booking.status === 'for-reservation' || booking.status === 'pending-docs') {
        timelineEvents.push({
            title: "Documents Under Review",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : formatDateToStandard(booking.createdAt),
            desc: "Hiker uploaded required documents. Awaiting organizer review.",
            status: getStatusConfig('for-reservation', 'admin').label,
            color: getStatusThemeColor('for-reservation'),
            sortDate: getEventDate(booking.updatedAt || booking.createdAt)
        });
    } else if (booking.status === 'reservation-rejected' || (booking.status === 'cancelled' && hasRejectedDocs)) {
        timelineEvents.push({
            title: "Reservation Rejected",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: `Rejected by ${booking.cancelledBy && booking.cancelledBy !== 'user' ? booking.cancelledBy : 'Organizer'}.`,
            reason: docRejectionNote || 'N/A',
            status: getStatusConfig('reservation-rejected', 'admin').label,
            color: getStatusThemeColor('reservation-rejected'),
            sortDate: getEventDate(booking.createdAt ? new Date(new Date(booking.createdAt).getTime() + 1000) : booking.updatedAt)
        });
    } else if (!hasRejectedDocs && (hasAllDocsApproved || ['approved-docs', 'for-payment', 'paid', 'downpayment', 'completed', 'finished', 'cancelled', 'refunded'].includes(booking.status))) {
        // Documents were verified before payment was captured
        const firstPaymentDate = booking.payment?.[0]?.createdAt;
        const docsDate = firstPaymentDate 
            ? new Date(getEventDate(firstPaymentDate).getTime() - 1000)
            : (booking.updatedAt ? getEventDate(booking.updatedAt) : new Date(getEventDate(booking.createdAt).getTime() + 1000));

        timelineEvents.push({
            title: "Documents Verified",
            time: formatDateToStandard(docsDate),
            desc: "All required documents approved. Awaiting hiker payment.",
            status: getStatusConfig('for-payment', 'admin').label,
            color: getStatusThemeColor('for-payment'),
            sortDate: docsDate
        });
    }

    // 4. Payment Transitions
    if (Array.isArray(booking.payment)) {
        booking.payment.forEach((paymentRecord: IPayment<Date>) => {
            const paymentDate = getEventDate(paymentRecord.createdAt);
            const offerPrice = booking.offer?.price || 0;
            const isFullPayment = offerPrice > 0 ? paymentRecord.amount >= (offerPrice - 1) : true;
            const percentage = offerPrice > 0 ? Math.round((paymentRecord.amount / offerPrice) * 100) : 100;
            const paymentTypeLabel = isFullPayment ? "FULLY PAID" : `DOWNPAYMENT (${percentage}%)`;

            // If the payment was captured (now or in the past before being refunded), log the capture event
            const wasEverCaptured = paymentRecord.status === 'captured' || 
                                    paymentRecord.status === 'refunded' || 
                                    ((paymentRecord.refundedAmount || 0) > 0);

            if (wasEverCaptured) {
                timelineEvents.push({
                    title: "Payment Captured",
                    time: paymentRecord.createdAt ? formatDateToStandard(paymentRecord.createdAt) : '',
                    desc: `Processed via ${paymentRecord.gateway.toUpperCase()}. Amount: ₱${paymentRecord.amount.toFixed(2)}`,
                    status: paymentTypeLabel,
                    color: isFullPayment ? Colors.SUCCESS : getStatusThemeColor('downpayment'),
                    sortDate: paymentDate
                });
            }

            // If a refund was issued on this payment, add a separate, distinct "Refund Issued" event
            const hasBeenRefunded = paymentRecord.status === 'refunded' || ((paymentRecord.refundedAmount || 0) > 0);
            if (hasBeenRefunded) {
                const refundAmount = paymentRecord.refundedAmount || paymentRecord.amount;
                const isPartial = refundAmount < (paymentRecord.amount - 0.01);
                const refundDate = getEventDate(paymentRecord.refundedAt || paymentRecord.createdAt);
                const refundTimeStr = (paymentRecord.refundedAt || paymentRecord.createdAt) 
                    ? formatDateToStandard(paymentRecord.refundedAt || paymentRecord.createdAt) 
                    : '';
                const reasonSnippet = paymentRecord.refundReason ? ` (Reason: ${paymentRecord.refundReason})` : '';

                timelineEvents.push({
                    title: isPartial ? "Partial Refund Processed" : "Payment Refunded",
                    time: refundTimeStr,
                    desc: `Refunded via ${paymentRecord.gateway.toUpperCase()}. Amount: ₱${refundAmount.toFixed(2)}${reasonSnippet}`,
                    status: isPartial ? "PARTIALLY REFUNDED" : "REFUNDED",
                    color: getStatusThemeColor('refund'),
                    sortDate: refundDate
                });
            } else if (paymentRecord.status === 'failed') {
                timelineEvents.push({
                    title: "Payment Attempt Failed",
                    time: paymentRecord.createdAt ? formatDateToStandard(paymentRecord.createdAt) : '',
                    desc: `Payment attempt of ₱${paymentRecord.amount.toFixed(2)} via ${paymentRecord.gateway.toUpperCase()} failed.`,
                    status: "FAILED",
                    color: Colors.ERROR,
                    sortDate: paymentDate
                });
            } else if (paymentRecord.status === 'pending') {
                const descText = paymentRecord.gateway === 'manual_qr'
                    ? "Payment receipt submitted via MANUAL_QR is currently pending verification."
                    : `Payment of ₱${paymentRecord.amount.toFixed(2)} via ${paymentRecord.gateway.toUpperCase()} is currently pending.`;
                timelineEvents.push({
                    title: "Payment Processing",
                    time: paymentRecord.createdAt ? formatDateToStandard(paymentRecord.createdAt) : '',
                    desc: descText,
                    status: "PENDING",
                    color: Colors.STATUS_WARNING_TEXT,
                    sortDate: paymentDate
                });
            }
        });
    }

    // 5. Payment Submitted (Awaiting Organizer Verification)
    if (booking.status === 'paid') {
        timelineEvents.push({
            title: "Payment Submitted",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: "Hiker submitted full payment. Awaiting organizer payment verification.",
            status: getStatusConfig('paid', 'admin').label,
            color: getStatusThemeColor('paid'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 6. Reschedule Transitions
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
            reason: booking.rescheduleDeclineReason || booking.cancellationReason || 'N/A',
            status: getStatusConfig('reschedule-rejected', 'admin').label,
            color: getStatusThemeColor('reschedule-rejected'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    const hasRefund = booking.payment?.some(p => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));

    // 7. Cancellation transitions (Enhanced with full Cancellation document lifecycle if present)
    if (cancellation) {
        const isCancelledByAdmin = cancellation.cancelledBy === 'admin';
        const cancelDate = getEventDate(cancellation.createdAt);
        const resolvedDate = getEventDate(cancellation.updatedAt || cancellation.createdAt);

        if (isCancelledByAdmin) {
            // Organizer initiated
            timelineEvents.push({
                title: "Hike Cancelled by Organizer",
                time: formatDateToStandard(cancellation.createdAt),
                desc: "Organizer initiated reservation cancellation.",
                reason: cancellation.reason || undefined,
                status: cancellation.status === 'pending' ? "PENDING HIKER" : "ORGANIZER CANCELLED",
                color: Colors.ERROR,
                sortDate: cancelDate
            });

            if (cancellation.status === 'approved') {
                timelineEvents.push({
                    title: "Cancellation Accepted by Hiker",
                    time: formatDateToStandard(resolvedDate),
                    desc: "Hiker acknowledged and accepted the cancellation.",
                    status: "HIKER ACCEPTED",
                    color: Colors.PRIMARY,
                    sortDate: resolvedDate
                });

                if (cancellation.adminNote || cancellation.refundAmount !== undefined || cancellation.refundedAt) {
                    const hasRefundAmount = Boolean(cancellation.refundAmount && cancellation.refundAmount > 0);
                    timelineEvents.push({
                        title: hasRefundAmount ? "Refund Decision Finalized" : "Cancellation Finalized Without Refund",
                        time: formatDateToStandard(cancellation.refundedAt || cancellation.updatedAt || resolvedDate),
                        desc: hasRefundAmount
                            ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                                ? `Organizer issued ₱${cancellation.refundAmount!.toFixed(2)} refund.`
                                : `Organizer issued ₱${cancellation.refundAmount!.toFixed(2)} refund via PayMongo.`)
                            : "Organizer finalized cancellation with ₱0.00 refund (Policy Forfeiture).",
                        reason: cancellation.adminNote || undefined,
                        status: hasRefundAmount ? "REFUNDED" : "NO REFUND (0%)",
                        color: hasRefundAmount ? getStatusThemeColor('refund') : Colors.TEXT_SECONDARY,
                        sortDate: getEventDate(cancellation.refundedAt || cancellation.updatedAt || resolvedDate)
                    });
                }
            }
        } else {
            // Hiker requested
            timelineEvents.push({
                title: "Cancellation Requested",
                time: formatDateToStandard(cancellation.createdAt),
                desc: "Hiker submitted a cancellation request.",
                reason: cancellation.reason || undefined,
                status: getStatusConfig('for-cancellation', 'admin').label,
                color: getStatusThemeColor('for-cancellation'),
                sortDate: cancelDate
            });

            if (cancellation.status === 'approved') {
                const refundMsg = (cancellation.refundAmount && cancellation.refundAmount > 0)
                    ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                        ? `Organizer approved cancellation with ₱${cancellation.refundAmount.toFixed(2)} refund.`
                        : `Organizer approved cancellation with ₱${cancellation.refundAmount.toFixed(2)} refund via PayMongo.`)
                    : "Organizer approved cancellation. Reserved slot released.";
                timelineEvents.push({
                    title: "Cancellation Approved",
                    time: formatDateToStandard(resolvedDate),
                    desc: refundMsg,
                    reason: cancellation.adminNote || undefined,
                    status: "APPROVED",
                    color: Colors.SUCCESS,
                    sortDate: resolvedDate
                });
            } else if (cancellation.status === 'rejected') {
                timelineEvents.push({
                    title: "Cancellation Request Declined",
                    time: formatDateToStandard(resolvedDate),
                    desc: "Organizer declined the hiker's cancellation request.",
                    reason: cancellation.adminNote || 'N/A',
                    status: getStatusConfig('cancellation-rejected', 'admin').label,
                    color: getStatusThemeColor('cancellation-rejected'),
                    sortDate: resolvedDate
                });
            }
        }
    } else {
        // Fallback to legacy booking document status if no cancellation doc exists
        if (booking.status === 'cancelled' && !hasRefund) {
            const isUserCancelled = booking.cancelledBy === 'user' || hasRejectedDocs || !booking.cancellationReason || booking.cancelledBy !== 'admin';
            timelineEvents.push({
                title: "Booking Cancelled",
                time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
                desc: isUserCancelled ? "Cancelled by Hiker." : `Cancelled by ${booking.cancelledBy || 'Organizer'}.`,
                reason: hasRejectedDocs ? undefined : (booking.cancellationReason || undefined),
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
    }

    // 8. Explicit Refund Status (Fallback if payment array does not contain refund details)
    const hasLoggedPaymentRefund = Array.isArray(booking.payment) && booking.payment.some(p => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
    if ((booking.status === 'refund' || booking.status === 'refunded' || hasRefund) && !hasLoggedPaymentRefund) {
        const totalRefunded = booking.payment?.reduce((sum, p) => sum + (p.refundedAmount || (p.status === 'refunded' ? p.amount : 0)), 0) || 0;
        timelineEvents.push({
            title: "Booking Refunded",
            time: booking.updatedAt ? formatDateToStandard(booking.updatedAt) : '',
            desc: totalRefunded > 0 
                ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                    ? `Refund of ₱${totalRefunded.toFixed(2)} processed.`
                    : `Refund of ₱${totalRefunded.toFixed(2)} processed via PayMongo.`)
                : "Booking has been refunded.",
            reason: booking.cancellationReason || undefined,
            status: getStatusConfig('refunded', 'admin').label,
            color: getStatusThemeColor('refunded'),
            sortDate: getEventDate(booking.updatedAt)
        });
    }

    // 9. Booking Completed
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

    // 10. Booking Finished
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

    // 11. Booking Expired
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
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4
    },
    timelineEventTitle: {
        fontWeight: 'bold',
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        flex: 1,
    },
    timelineTime: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        flexShrink: 0,
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
