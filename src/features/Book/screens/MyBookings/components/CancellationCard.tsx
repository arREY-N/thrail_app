import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ExpandableText from '@/src/components/ExpandableText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

export interface CancellationCardProps {
    /** The active booking */
    booking: Booking;
    /** The active cancellation request associated with this booking, if any */
    cancellation?: Cancellation | null;
    /** Handler to withdraw an active cancellation request */
    onWithdraw?: (cancellation: Cancellation) => void | Promise<void>;
    /** Handler to appeal / update the cancellation reason */
    onAppeal?: (cancellation: Cancellation) => void;
    /** Handler to accept an admin-initiated cancellation */
    onAcceptAdminCancellation?: (cancellation: Cancellation) => void | Promise<void>;
    /** Handler to explore or reschedule after admin cancellation */
    onReschedule?: () => void;
}

/**
 * In-Page Lifecycle Card for displaying cancellation states, reasons,
 * organizer feedback, refund estimates, and user action buttons.
 */
const CancellationCard: React.FC<CancellationCardProps> = ({
    booking,
    cancellation,
    onWithdraw,
    onAppeal,
    onAcceptAdminCancellation,
    onReschedule,
}) => {
    const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
    const [isAccepting, setIsAccepting] = useState<boolean>(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);

    const bookingStatus = booking.status;
    const isCancellationRelated =
        Boolean(cancellation) ||
        [
            'for-cancellation',
            'cancellation-rejected',
            'refund',
            'refunded',
            'cancelled',
        ].includes(bookingStatus || '');

    if (!isCancellationRelated) {
        return null;
    }

    const isAdminCancelled =
        cancellation?.cancelledBy === 'admin' ||
        (bookingStatus === 'cancelled' && booking.cancelledBy === 'admin');

    const isRejected =
        cancellation?.status === 'rejected' ||
        bookingStatus === 'cancellation-rejected';

    const isApprovedOrRefunded =
        (cancellation?.status === 'approved' && !isAdminCancelled) ||
        bookingStatus === 'refund' ||
        bookingStatus === 'refunded';

    const isCancelledClosed =
        bookingStatus === 'cancelled' && !isAdminCancelled && !isRejected;

    const userReason =
        cancellation?.reason ||
        booking.cancellationReason ||
        'No reason provided by user.';

    const adminNote =
        cancellation?.adminNote ||
        (isAdminCancelled ? cancellation?.reason : null);

    const createdAtDate = cancellation?.createdAt
        ? formatDateToStandard(cancellation.createdAt)
        : null;

    const isAppeal = Boolean(
        cancellation?.updatedAt &&
        cancellation?.createdAt &&
        new Date(cancellation.updatedAt).getTime() > new Date(cancellation.createdAt).getTime()
    );

    const handleExecuteWithdraw = async () => {
        if (!cancellation || !onWithdraw) return;
        setIsWithdrawing(true);
        try {
            await onWithdraw(cancellation);
            setShowWithdrawModal(false);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleExecuteAcceptAdmin = async () => {
        if (!cancellation || !onAcceptAdminCancellation) return;
        setIsAccepting(true);
        try {
            await onAcceptAdminCancellation(cancellation);
        } finally {
            setIsAccepting(false);
        }
    };

    const renderConfirmationModal = () => (
        <ConfirmationModal
            visible={showWithdrawModal}
            onClose={() => !isWithdrawing && setShowWithdrawModal(false)}
            onConfirm={handleExecuteWithdraw}
            title="Withdraw Cancellation Request"
            message="Are you sure you want to withdraw your cancellation request? Your booking will remain active and confirmed."
            confirmText="Yes, Withdraw"
            cancelText="Keep Request"
            isDestructive={true}
            isLoading={isWithdrawing}
            iconName="alert-triangle"
            iconColor={Colors.ERROR}
        />
    );

    // 1. ORGANIZER INITIATED CANCELLATION
    if (isAdminCancelled) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCircleError}>
                        <CustomIcon
                            library="Feather"
                            name="alert-circle"
                            size={18}
                            color={Colors.ERROR}
                        />
                    </View>
                    <View style={styles.headerTextGroup}>
                        <CustomText variant="label" style={styles.titleError}>
                            Hike Cancelled by Organizer
                        </CustomText>
                        <CustomText variant="caption" style={styles.subtitle}>
                            Event cancellation notice
                        </CustomText>
                    </View>
                </View>

                <View style={styles.noticeBox}>
                    <CustomText variant="caption" style={styles.noticeLabel}>
                        Organizer&apos;s Explanation:
                    </CustomText>
                    <CustomText style={styles.noticeText}>
                        {adminNote || 'The organizer had to cancel this hike due to weather, safety, or schedule constraints.'}
                    </CustomText>
                </View>

                <View style={styles.infoRow}>
                    <CustomIcon
                        library="Feather"
                        name="info"
                        size={15}
                        color={Colors.TEXT_SECONDARY}
                    />
                    <CustomText variant="caption" style={styles.infoText}>
                        You are eligible for a full refund or can choose to reschedule to an alternative available date.
                    </CustomText>
                </View>

                <View style={styles.actionsColumn}>
                    {cancellation && onAcceptAdminCancellation && cancellation.status !== 'approved' && (
                        <TouchableOpacity
                            style={styles.primaryDestructiveBtn}
                            onPress={handleExecuteAcceptAdmin}
                            disabled={isAccepting}
                            activeOpacity={0.8}
                        >
                            {isAccepting ? (
                                <ActivityIndicator size="small" color={Colors.WHITE} />
                            ) : (
                                <CustomText style={styles.primaryDestructiveBtnText}>
                                    Accept Cancellation & Request Refund
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    )}

                    {onReschedule && (
                        <TouchableOpacity
                            style={styles.outlineBtn}
                            onPress={onReschedule}
                            activeOpacity={0.7}
                        >
                            <CustomIcon
                                library="Feather"
                                name="calendar"
                                size={16}
                                color={Colors.PRIMARY}
                            />
                            <CustomText style={styles.outlineBtnTextPrimary}>
                                Reschedule to Another Date
                            </CustomText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // 2. REJECTED / DECLINED BY ORGANIZER (Awaiting Hiker Action: Appeal or Withdraw)
    if (isRejected) {
        return (
            <>
                <View style={styles.container}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconCircleError}>
                            <CustomIcon
                                library="Feather"
                                name="x-octagon"
                                size={18}
                                color={Colors.ERROR}
                            />
                        </View>
                        <View style={styles.headerTextGroup}>
                            <CustomText variant="label" style={styles.titleError}>
                                Cancellation Request Declined
                            </CustomText>
                            <CustomText variant="caption" style={styles.subtitle}>
                                Reviewed by hike organizer
                            </CustomText>
                        </View>
                    </View>

                    <View style={styles.errorHighlightBox}>
                        <CustomText variant="caption" style={styles.errorHighlightLabel}>
                            Reason for Decline:
                        </CustomText>
                        <ExpandableText
                            text={adminNote || 'The organizer declined this cancellation request based on policy terms.'}
                            textStyle={styles.errorHighlightText}
                            arrowColor={Colors.ERROR}
                            characterLimit={160}
                        />
                    </View>

                    <View style={styles.previousReasonBox}>
                        <CustomText variant="caption" style={styles.previousReasonLabel}>
                            Your Submitted Reason:
                        </CustomText>
                        <ExpandableText
                            text={userReason}
                            quote={true}
                            textStyle={styles.previousReasonText}
                            arrowColor={Colors.TEXT_PRIMARY}
                            characterLimit={160}
                        />
                    </View>

                    <View style={styles.actionsColumn}>
                        {cancellation && onAppeal && (
                            <TouchableOpacity
                                style={styles.appealBtn}
                                onPress={() => onAppeal(cancellation)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="edit-3"
                                    size={16}
                                    color={Colors.ERROR}
                                />
                                <CustomText style={styles.appealBtnText}>
                                    Appeal / Update Reason
                                </CustomText>
                            </TouchableOpacity>
                        )}

                        {cancellation && onWithdraw && (
                            <TouchableOpacity
                                style={styles.withdrawTriggerBtn}
                                onPress={() => setShowWithdrawModal(true)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="rotate-ccw"
                                    size={15}
                                    color={Colors.ERROR}
                                />
                                <CustomText style={styles.withdrawTriggerBtnText}>
                                    Withdraw Cancellation Request
                                </CustomText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {renderConfirmationModal()}
            </>
        );
    }

    // 3. APPROVED & REFUNDED (Terminal State in History)
    if (isApprovedOrRefunded) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCircleSuccess}>
                        <CustomIcon
                            library="Feather"
                            name="check-circle"
                            size={18}
                            color={Colors.PRIMARY}
                        />
                    </View>
                    <View style={styles.headerTextGroup}>
                        <CustomText variant="label" style={styles.titleSuccess}>
                            Cancellation Approved & Refunded
                        </CustomText>
                        <CustomText variant="caption" style={styles.subtitle}>
                            Booking closed
                        </CustomText>
                    </View>
                </View>

                <View style={styles.successBox}>
                    <CustomText style={styles.successMessage}>
                        Your cancellation request has been approved. The refund transaction is being processed via PayMongo.
                    </CustomText>
                    <View style={styles.timelineBox}>
                        <CustomIcon
                            library="Feather"
                            name="clock"
                            size={14}
                            color={Colors.TEXT_SECONDARY}
                        />
                        <CustomText variant="caption" style={styles.timelineText}>
                            Estimated 3–5 business days to credit back to your original payment method.
                        </CustomText>
                    </View>
                </View>

                <View style={styles.previousReasonBox}>
                    <CustomText variant="caption" style={styles.previousReasonLabel}>
                        Cancellation Reason:
                    </CustomText>
                    <CustomText style={styles.previousReasonText}>
                        {`"${userReason}"`}
                    </CustomText>
                </View>
            </View>
        );
    }

    // 4. CANCELLED / CLOSED (Terminal State in History without payment)
    if (isCancelledClosed) {
        return (
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCircleError}>
                        <CustomIcon
                            library="Feather"
                            name="x-circle"
                            size={18}
                            color={Colors.ERROR}
                        />
                    </View>
                    <View style={styles.headerTextGroup}>
                        <CustomText variant="label" style={styles.titleError}>
                            Booking Cancelled
                        </CustomText>
                        <CustomText variant="caption" style={styles.subtitle}>
                            Reservation closed
                        </CustomText>
                    </View>
                </View>

                <View style={styles.noticeBox}>
                    <CustomText style={styles.noticeText}>
                        This booking has been cancelled and your reservation spot has been released.
                    </CustomText>
                </View>

                {Boolean(userReason && userReason !== 'No reason provided by user.') && (
                    <View style={styles.previousReasonBox}>
                        <CustomText variant="caption" style={styles.previousReasonLabel}>
                            Cancellation Reason:
                        </CustomText>
                        <ExpandableText
                            text={userReason}
                            quote={true}
                            textStyle={styles.previousReasonText}
                            arrowColor={Colors.TEXT_PRIMARY}
                            characterLimit={160}
                        />
                    </View>
                )}
            </View>
        );
    }

    // 5. PENDING REVIEW (DEFAULT SUB-APPROVAL STATE)
    return (
        <>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCirclePending}>
                        <CustomIcon
                            library="Feather"
                            name="alert-triangle"
                            size={18}
                            color={Colors.ERROR}
                        />
                    </View>
                    <View style={styles.headerTextGroup}>
                        <CustomText variant="label" style={styles.titlePending}>
                            {isAppeal ? 'Cancellation Request Under Review (Appeal)' : 'Cancellation Request Under Review'}
                        </CustomText>
                        <CustomText variant="caption" style={styles.subtitle}>
                            {createdAtDate ? `Submitted on ${createdAtDate}` : 'Awaiting organizer decision'}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.quoteBox}>
                    <CustomText variant="caption" style={styles.quoteLabel}>
                        {isAppeal ? 'Your Submitted Reason (Appeal):' : 'Your Submitted Reason:'}
                    </CustomText>
                    <ExpandableText
                        text={userReason}
                        quote={true}
                        textStyle={styles.quoteText}
                        arrowColor={Colors.TEXT_PRIMARY}
                        characterLimit={160}
                    />
                </View>

                <View style={styles.infoBanner}>
                    <CustomIcon
                        library="Feather"
                        name="info"
                        size={16}
                        color={Colors.TEXT_SECONDARY}
                    />
                    <CustomText variant="caption" style={styles.infoBannerText}>
                        Organizers typically review cancellation requests within 24–48 hours. If approved, your booking will be cancelled and any refundable amount will be returned via PayMongo.
                    </CustomText>
                </View>

                {cancellation && onWithdraw && (
                    <TouchableOpacity
                        style={styles.withdrawTriggerBtn}
                        onPress={() => setShowWithdrawModal(true)}
                        activeOpacity={0.8}
                    >
                        <CustomIcon
                            library="Feather"
                            name="rotate-ccw"
                            size={15}
                            color={Colors.ERROR}
                        />
                        <CustomText style={styles.withdrawTriggerBtnText}>
                            Withdraw Cancellation Request
                        </CustomText>
                    </TouchableOpacity>
                )}
            </View>
            {renderConfirmationModal()}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    headerTextGroup: {
        flex: 1,
        gap: 2,
    },
    iconCircleError: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCirclePending: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleSuccess: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleError: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    titlePending: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    titleSuccess: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    noticeBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 14,
    },
    noticeLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    noticeText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        lineHeight: 18,
    },
    errorHighlightBox: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        marginBottom: 14,
    },
    errorHighlightLabel: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    errorHighlightText: {
        color: Colors.ERROR,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    previousReasonBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 16,
    },
    previousReasonLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    previousReasonText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    quoteBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 14,
    },
    quoteLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    quoteText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 12,
        gap: 10,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    infoBannerText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 17,
    },
    actionsColumn: {
        gap: 10,
    },
    primaryDestructiveBtn: {
        backgroundColor: Colors.ERROR,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryDestructiveBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    outlineBtn: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.WHITE,
    },
    outlineBtnTextPrimary: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
    appealBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderWidth: 1.5,
        borderColor: Colors.ERROR,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    appealBtnText: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    successMessage: {
        color: Colors.PRIMARY,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
        marginBottom: 8,
    },
    timelineBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timelineText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    withdrawTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        paddingVertical: 11,
        gap: 6,
    },
    withdrawTriggerBtnText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 13,
    },
});

export default CancellationCard;
