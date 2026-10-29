import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Offer, useOfferStore } from '@/src/core/models/Offer/Offer';
import { Reschedule, useRescheduleAdmin } from '@/src/core/models/Reschedule/Reschedule';
import { formatBookingDate } from '@/src/utils/dateFormatter';

export interface AdminRescheduleCardProps {
    booking?: Booking | null;
    offers?: Offer[];
    reschedule?: Reschedule | null;
    totalAmountPaid?: number;
    onApproveReschedule?: (newOffer: Offer, booking?: Booking, adminNote?: string) => Promise<unknown>;
    onDeclineReschedule?: (reason: string, reschedule?: Reschedule | null, booking?: Booking) => Promise<void>;
    isProcessing?: boolean;
}

const RESCHEDULE_DECLINE_SUGGESTIONS = [
    'Target hike is fully booked or at maximum capacity',
    'Requested hike date is no longer available',
    'Reschedule request submitted past the allowable deadline',
    'Logistical or trail constraints on the requested date',
];

export const AdminRescheduleCard: React.FC<AdminRescheduleCardProps> = ({
    booking,
    offers = [],
    reschedule: propReschedule,
    totalAmountPaid: propTotalAmountPaid,
    onApproveReschedule: propOnApprove,
    onDeclineReschedule: propOnDecline,
    isProcessing: propIsProcessing = false,
}) => {
    const { showToast } = useToast();

    // Internal hook fallback if props are not explicitly passed
    const {
        rescheduleRequest: hookReschedule,
        onApproveReschedule: hookOnApprove,
        onDeclineReschedule: hookOnDecline,
        isWriting: isHookWriting,
    } = useRescheduleAdmin(booking?.id, booking?.business?.id, booking?.rescheduleRequestId || '');

    const activeReschedule = propReschedule || hookReschedule;
    const resolvedOnApprove = propOnApprove || hookOnApprove;
    const resolvedOnDecline = propOnDecline || hookOnDecline;

    // Component states
    const [isDeclineExpanded, setIsDeclineExpanded] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [approvalAdminNote] = useState('');
    const [isConfirmApproveVisible, setIsConfirmApproveVisible] = useState(false);
    const [isConfirmDeclineVisible, setIsConfirmDeclineVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [optimisticStatus, setOptimisticStatus] = useState<'approved' | 'rejected' | null>(null);
    const [prevRescheduleKey, setPrevRescheduleKey] = useState<string>('');

    // Reset optimistic status if a new active request arrives or status changes to pending
    const currentRescheduleKey = `${activeReschedule?.id || ''}_${activeReschedule?.status || ''}_${booking?.status || ''}`;
    if (currentRescheduleKey !== prevRescheduleKey) {
        setPrevRescheduleKey(currentRescheduleKey);
        if (activeReschedule?.status === 'pending' || booking?.status === 'for-reschedule') {
            setOptimisticStatus(null);
        }
    }

    // Target offer resolution
    const targetOfferId = activeReschedule?.newOfferId || booking?.rescheduledToOfferId;
    const [fetchedTargetOffer, setFetchedTargetOffer] = useState<Offer | null>(null);

    const targetOffer = useMemo(() => {
        if (!targetOfferId) return null;
        const found = offers.find(o => o.id === targetOfferId);
        return found || fetchedTargetOffer;
    }, [offers, targetOfferId, fetchedTargetOffer]);

    // Fetch target offer if not in offers list
    useEffect(() => {
        let isMounted = true;
        if (targetOfferId && !targetOffer) {
            useOfferStore.getState().fetchOfferById(targetOfferId)
                .then(off => {
                    if (isMounted && off) setFetchedTargetOffer(off);
                })
                .catch(() => { });
        }
        return () => { isMounted = false; };
    }, [targetOfferId, targetOffer]);

    // Determine status
    // 1. Approved status (optimistic or persisted)
    const isApproved =
        optimisticStatus === 'approved' ||
        activeReschedule?.status === 'approved' ||
        booking?.status === 'rescheduled';

    // 2. Pending status: Active reschedule request awaiting organizer review
    const isPending =
        !isApproved &&
        optimisticStatus !== 'rejected' &&
        (booking?.status === 'for-reschedule' || activeReschedule?.status === 'pending');

    // 3. Declined status: Only when not approved and not actively pending
    const isDeclined =
        !isApproved &&
        !isPending &&
        (optimisticStatus === 'rejected' ||
            activeReschedule?.status === 'rejected' ||
            booking?.status === 'reschedule-rejected' ||
            Boolean(booking?.rescheduleDeclineReason));

    // Visibility guard: only render if reschedule request is active, approved, or declined
    if (!isPending && !isApproved && !isDeclined && !activeReschedule) {
        return null;
    }

    const isBusy = propIsProcessing || isSubmitting || isHookWriting;

    // Financial calculations
    const oldPrice = Number(booking?.offer?.price || booking?.totalAmount) || 0;
    const newPrice = Number(targetOffer?.price) || 0;

    const payments = Array.isArray(booking?.payment) ? booking.payment : [];
    const calculatedCaptured = payments
        .filter(p => p && p.status === 'captured')
        .reduce((sum, p) => {
            const net = (Number(p.amount) || 0) - (Number(p.refundedAmount) || 0);
            return sum + Math.max(0, net);
        }, 0);

    const totalPaid = propTotalAmountPaid !== undefined ? propTotalAmountPaid : calculatedCaptured;

    const resultingRemainingBalance = Math.max(0, newPrice - totalPaid);
    const resultingOverpayment = Math.max(0, totalPaid - newPrice);

    // Handlers
    const handleApprove = async () => {
        if (!booking || !targetOffer) {
            showToast.error('Target offer details not loaded yet.');
            return;
        }

        setIsSubmitting(true);
        try {
            await resolvedOnApprove(targetOffer, booking, approvalAdminNote.trim() || undefined);
            setOptimisticStatus('approved');
            showToast.success('Reschedule request approved successfully!');
            setIsConfirmApproveVisible(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to approve reschedule';
            showToast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!declineReason.trim()) {
            showToast.error('Please specify a reason for declining the reschedule.');
            return;
        }

        if (!activeReschedule && !booking) {
            showToast.error('Reschedule request details missing.');
            return;
        }

        setIsSubmitting(true);
        try {
            await resolvedOnDecline(declineReason.trim(), activeReschedule, booking || undefined);
            setOptimisticStatus('rejected');
            showToast.success('Reschedule request declined. Hiker notified.');
            setIsConfirmDeclineVisible(false);
            setIsDeclineExpanded(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to decline reschedule';
            showToast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Header metadata
    const headerTitle = isPending
        ? 'Reschedule Request Review'
        : isApproved
            ? 'Reschedule Approved'
            : 'Reschedule Request Declined';

    const headerIcon = isPending ? 'calendar' : isApproved ? 'check-circle' : 'x-circle';
    const headerIconColor = isPending ? Colors.PRIMARY : isApproved ? Colors.SUCCESS : Colors.ERROR;

    const badgeText = isPending ? 'PENDING APPROVAL' : isApproved ? 'APPROVED' : 'DECLINED';
    const badgeStyle = isPending ? styles.badgePending : isApproved ? styles.badgeApproved : styles.badgeDeclined;
    const badgeTextStyle = isPending ? styles.badgeTextPending : isApproved ? styles.badgeTextApproved : styles.badgeTextDeclined;

    return (
        <View style={styles.cardContainer}>
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: isPending ? '#E8F5E9' : isApproved ? '#DCFCE7' : '#FEE2E2' }]}>
                        <CustomIcon library="Feather" name={headerIcon} size={16} color={headerIconColor} />
                    </View>
                    <CustomText style={styles.headerTitle}>{headerTitle}</CustomText>
                </View>
                <View style={[styles.badge, badgeStyle]}>
                    <CustomText style={[styles.badgeText, badgeTextStyle]}>{badgeText}</CustomText>
                </View>
            </View>

            {/* Status Informational Banner */}
            {isPending && (
                <View style={styles.pendingBanner}>
                    <CustomIcon library="Feather" name="info" size={15} color={Colors.PRIMARY} />
                    <CustomText style={styles.bannerText}>
                        The hiker submitted a reschedule request to move their reservation to a different hike date. Review target availability and price reconciliation below.
                    </CustomText>
                </View>
            )}

            {isApproved && (
                <View style={styles.approvedBanner}>
                    <CustomIcon library="Feather" name="check" size={15} color={Colors.SUCCESS} />
                    <CustomText style={styles.approvedBannerText}>
                        This booking has been rescheduled. A new reservation document has been issued with transferred payments.
                    </CustomText>
                </View>
            )}

            {isDeclined && (
                <View style={styles.declinedBanner}>
                    <CustomIcon library="Feather" name="alert-circle" size={15} color={Colors.ERROR} />
                    <CustomText style={styles.declinedBannerText}>
                        This reschedule request was declined. The original reservation remains active under its previous payment status.
                    </CustomText>
                </View>
            )}

            {/* Hiker Submitted Reason */}
            {(activeReschedule?.reason || booking?.rescheduleReason) && (
                <View style={styles.reasonSection}>
                    <CustomText style={styles.sectionLabel}>HIKER&apos;S SUBMITTED REASON</CustomText>
                    <View style={styles.reasonBox}>
                        <CustomIcon library="Feather" name="message-square" size={14} color="#64748B" style={styles.reasonIcon} />
                        <CustomText style={styles.reasonText}>
                            &quot;{activeReschedule?.reason || booking?.rescheduleReason}&quot;
                        </CustomText>
                    </View>
                </View>
            )}

            {/* Organizer Decline Reason (if declined) */}
            {isDeclined && (activeReschedule?.adminNote || booking?.rescheduleDeclineReason) && (
                <View style={styles.reasonSection}>
                    <CustomText style={[styles.sectionLabel, { color: Colors.ERROR }]}>ORGANIZER DECLINE REASON</CustomText>
                    <View style={[styles.reasonBox, styles.declineReasonBox]}>
                        <CustomIcon library="Feather" name="alert-triangle" size={14} color={Colors.ERROR} style={styles.reasonIcon} />
                        <CustomText style={[styles.reasonText, { color: '#991B1B' }]}>
                            {activeReschedule?.adminNote || booking?.rescheduleDeclineReason}
                        </CustomText>
                    </View>
                </View>
            )}

            {/* Hike Comparison Section */}
            <View style={styles.comparisonContainer}>
                {/* Current Hike */}
                <View style={styles.comparisonColumn}>
                    <CustomText style={styles.columnHeader}>CURRENT HIKE</CustomText>
                    <View style={styles.infoRow}>
                        <CustomIcon library="Feather" name="calendar" size={13} color="#64748B" />
                        <CustomText style={styles.infoText}>
                            {formatBookingDate(booking?.offer?.date, null, true)}
                        </CustomText>
                    </View>
                    <View style={styles.infoRow}>
                        <CustomIcon library="Feather" name="map-pin" size={13} color="#64748B" />
                        <CustomText style={styles.infoText} numberOfLines={1}>
                            {booking?.trail?.name || 'Current Trail'}
                        </CustomText>
                    </View>
                    <View style={styles.infoRow}>
                        <CustomIcon library="Feather" name="tag" size={13} color="#64748B" />
                        <CustomText style={styles.infoText}>
                            ₱{oldPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </CustomText>
                    </View>
                </View>

                {/* Arrow Divider */}
                <View style={styles.arrowDivider}>
                    <CustomIcon library="Feather" name="arrow-right" size={18} color="#94A3B8" />
                </View>

                {/* Requested Target Hike */}
                <View style={[styles.comparisonColumn, styles.targetColumn]}>
                    <CustomText style={[styles.columnHeader, { color: Colors.PRIMARY }]}>REQUESTED HIKE</CustomText>
                    <View style={styles.infoRow}>
                        <CustomIcon library="Feather" name="calendar" size={13} color={Colors.PRIMARY} />
                        <CustomText style={[styles.infoText, styles.highlightText]}>
                            {targetOffer?.date ? formatBookingDate(targetOffer.date, null, true) : 'Loading date...'}
                        </CustomText>
                    </View>
                    <View style={styles.infoRow}>
                        <CustomIcon library="Feather" name="map-pin" size={13} color={Colors.PRIMARY} />
                        <CustomText style={styles.infoText} numberOfLines={1}>
                            {targetOffer?.trail?.name || 'Target Trail'}
                        </CustomText>
                    </View>
                    <View style={styles.infoRow}>
                        <CustomIcon library="Feather" name="tag" size={13} color={Colors.PRIMARY} />
                        <CustomText style={[styles.infoText, styles.highlightText]}>
                            ₱{newPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </CustomText>
                    </View>
                    {targetOffer && (
                        <View style={styles.infoRow}>
                            <CustomIcon library="Feather" name="users" size={13} color={Colors.PRIMARY} />
                            <CustomText style={styles.capacityText}>
                                {Math.max(0, (targetOffer.maxPax || 0) - (targetOffer.reservedPax || 0))} slots available
                            </CustomText>
                        </View>
                    )}
                </View>
            </View>

            {/* Financial Reconciliation Breakdown */}
            <View style={styles.reconciliationCard}>
                <CustomText style={styles.reconciliationTitle}>FINANCIAL RECONCILIATION PREVIEW</CustomText>

                <View style={styles.reconcileRow}>
                    <CustomText style={styles.reconcileLabel}>Total payments received:</CustomText>
                    <CustomText style={styles.reconcileValue}>
                        ₱{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </CustomText>
                </View>
                <View style={styles.reconcileRow}>
                    <CustomText style={styles.reconcileLabel}>Target offer price:</CustomText>
                    <CustomText style={styles.reconcileValue}>
                        ₱{newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </CustomText>
                </View>

                <View style={styles.reconcileDivider} />

                <View style={styles.reconcileRow}>
                    <CustomText style={[styles.reconcileLabel, { fontWeight: '600', color: '#1E293B' }]}>Payment action:</CustomText>
                    <CustomText style={[
                        styles.reconcileValue,
                        totalPaid > newPrice ? styles.textGreen : newPrice > totalPaid ? styles.textAmber : styles.textGreen
                    ]}>
                        {totalPaid > newPrice
                            ? `Refund excess: ₱${resultingOverpayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : newPrice > totalPaid
                                ? `Balance: ₱${resultingRemainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : 'No balance (₱0.00)'}
                    </CustomText>
                </View>
            </View>

            {/* Action Buttons for Pending State */}
            {isPending && (
                <View style={styles.actionContainer}>
                    {isDeclineExpanded ? (
                        <View style={styles.declineForm}>
                            <CustomFeedbackInput
                                label="Decline Reason *"
                                helperText="Provide an explanation for declining this reschedule request. The hiker will receive this message."
                                placeholder="Explain why the reschedule request cannot be approved..."
                                value={declineReason}
                                onChangeText={setDeclineReason}
                                suggestions={[...RESCHEDULE_DECLINE_SUGGESTIONS]}
                                variant="danger"
                            />
                            <View style={styles.buttonRow}>
                                <CustomButton
                                    title="Cancel"
                                    variant="outline"
                                    onPress={() => {
                                        setIsDeclineExpanded(false);
                                        setDeclineReason('');
                                    }}
                                    disabled={isBusy}
                                    style={styles.flexButton}
                                />
                                <CustomButton
                                    title="Confirm Decline"
                                    variant="destructive"
                                    onPress={() => setIsConfirmDeclineVisible(true)}
                                    disabled={!declineReason.trim() || isBusy}
                                    isLoading={isBusy}
                                    style={styles.flexButton}
                                    icon="x-circle"
                                    iconLibrary="Feather"
                                />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.buttonRow}>
                            <CustomButton
                                title="Decline Request"
                                variant="outline"
                                onPress={() => setIsDeclineExpanded(true)}
                                disabled={isBusy}
                                style={styles.flexButton}
                                icon="x-circle"
                                iconLibrary="Feather"
                            />
                            <CustomButton
                                title="Approve Reschedule"
                                variant="primary"
                                onPress={() => setIsConfirmApproveVisible(true)}
                                disabled={!targetOffer || isBusy}
                                isLoading={isBusy}
                                style={styles.flexButton}
                                icon="check-circle"
                                iconLibrary="Feather"
                            />
                        </View>
                    )}
                </View>
            )}

            {/* Approval Confirmation Modal */}
            {isConfirmApproveVisible && (
                <ConfirmationModal
                    visible={isConfirmApproveVisible}
                    onClose={() => !isBusy && setIsConfirmApproveVisible(false)}
                    onConfirm={handleApprove}
                    title={isBusy ? "Approving Reschedule..." : "Approve Reschedule"}
                    message={`Are you sure you want to approve this reschedule to ${targetOffer?.date ? formatBookingDate(targetOffer.date, null, true) : 'the new offer'}?\n\nTransferred payments (₱${totalPaid.toFixed(2)}) will be credited to the new booking.`}
                    confirmText={isBusy ? "Approving..." : "Approve Reschedule"}
                    cancelText="Cancel"
                    iconName={isBusy ? "clock" : "check-circle"}
                    isDestructive={false}
                    isLoading={isBusy}
                    loadingMessage="Approving reschedule and transferring payment credits. Please wait..."
                />
            )}

            {/* Decline Confirmation Modal */}
            {isConfirmDeclineVisible && (
                <ConfirmationModal
                    visible={isConfirmDeclineVisible}
                    onClose={() => !isBusy && setIsConfirmDeclineVisible(false)}
                    onConfirm={handleDecline}
                    title={isBusy ? "Declining Reschedule..." : "Decline Reschedule Request"}
                    message={`Are you sure you want to decline this reschedule request? The hiker will be notified and the reservation will remain on the current date.`}
                    confirmText={isBusy ? "Declining..." : "Decline Request"}
                    cancelText="Cancel"
                    iconName="alert-triangle"
                    isDestructive={true}
                    isLoading={isBusy}
                    loadingMessage="Declining reschedule request and reverting status. Please wait..."
                />
            )}
        </View>
    );
};

export default AdminRescheduleCard;

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        ...GlobalStyles.dropShadow(2),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgePending: {
        backgroundColor: '#E8F5E9',
    },
    badgeApproved: {
        backgroundColor: '#DCFCE7',
    },
    badgeDeclined: {
        backgroundColor: '#FEE2E2',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    badgeTextPending: {
        color: '#166534',
    },
    badgeTextApproved: {
        color: '#15803D',
    },
    badgeTextDeclined: {
        color: '#B91C1C',
    },
    pendingBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 14,
    },
    bannerText: {
        fontSize: 13,
        color: '#166534',
        flex: 1,
        lineHeight: 18,
    },
    approvedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 14,
    },
    approvedBannerText: {
        fontSize: 13,
        color: '#15803D',
        flex: 1,
        lineHeight: 18,
    },
    declinedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
        marginBottom: 14,
    },
    declinedBannerText: {
        fontSize: 13,
        color: '#991B1B',
        flex: 1,
        lineHeight: 18,
    },
    reasonSection: {
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    reasonBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F8FAFC',
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
        padding: 10,
        borderRadius: 6,
    },
    declineReasonBox: {
        borderLeftColor: Colors.ERROR,
        backgroundColor: '#FEF2F2',
    },
    reasonIcon: {
        marginTop: 2,
    },
    reasonText: {
        fontSize: 13,
        color: '#334155',
        flex: 1,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    comparisonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    comparisonColumn: {
        flex: 1,
    },
    targetColumn: {
        backgroundColor: '#F0FDF4',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    columnHeader: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    arrowDivider: {
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '500',
    },
    highlightText: {
        color: Colors.PRIMARY,
        fontWeight: '700',
    },
    capacityText: {
        fontSize: 11,
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    reconciliationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginBottom: 16,
    },
    reconciliationTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    reconcileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    reconcileLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    reconcileValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    textAmber: {
        color: '#D97706',
    },
    textGreen: {
        color: Colors.SUCCESS,
    },
    reconcileDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 8,
    },
    actionContainer: {
        marginTop: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    flexButton: {
        flex: 1,
    },
    declineForm: {
        gap: 12,
    },
});
