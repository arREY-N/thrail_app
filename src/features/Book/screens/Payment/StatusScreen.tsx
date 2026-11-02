/**
 * @file StatusScreen.tsx
 * @description Production payment confirmation and status screen for manual QR and online transactions.
 * Features comprehensive transaction breakdown, interactive next-steps timeline, and robust loading/error handling.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomText from '@/src/components/CustomText';
import { usePaymentStatusTutorial } from '@/src/features/Book/screens/Payment/hooks/usePaymentTutorial';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { formatDateToStandard, formatTime } from '@/src/utils/dateFormatter';

export interface StatusScreenProps {
    /** Selected payment method name */
    selectedMethod?: string | null;
    /** Amount submitted for payment */
    amountToPay?: number | string;
    /** Unique booking identifier */
    bookingId?: string;
    /** Date when payment was submitted */
    paymentDate?: Date | string;
    /** Optional active status: 'success' | 'loading' | 'error' */
    status?: 'success' | 'loading' | 'error';
    /** Error message to display when status is 'error' */
    errorMessage?: string;
    /** Callback triggered when user taps retry on error */
    onRetry?: () => void;
    /** Tutorial step key */
    activeTutorialStep?: string;
    /** Whether tutorial overlay is visible */
    isTutorialVisible?: boolean;
}

const StatusScreen = ({
    selectedMethod,
    amountToPay = 0,
    bookingId,
    paymentDate,
    status = 'success',
    errorMessage,
    onRetry,
    activeTutorialStep,
    isTutorialVisible,
}: StatusScreenProps): React.JSX.Element => {
    const {
        scrollViewRef,
        bannerRef,
        timelineRef,
        receiptRef,
        handlers: {
            handleBannerLayout,
            handleTimelineLayout,
            handleReceiptLayout,
        },
    } = usePaymentStatusTutorial({
        activeTutorialStep,
        isTutorialVisible,
    });

    // 1. Loading State
    if (status === 'loading') {
        return (
            <View style={styles.stateContainer}>
                <CustomLoading message="Submitting your payment receipt..." />
            </View>
        );
    }

    // 2. Error State
    if (status === 'error') {
        return (
            <View style={styles.stateContainer}>
                <View style={styles.errorIconCircle}>
                    <CustomIcon library="Feather" name="alert-triangle" size={32} color={Colors.WHITE} />
                </View>
                <CustomText variant="h2" style={styles.title}>
                    Submission Failed
                </CustomText>
                <CustomText variant="caption" style={styles.subtitle}>
                    {errorMessage || 'We were unable to submit your payment receipt. Please check your network and try again.'}
                </CustomText>
                {onRetry && (
                    <View style={styles.retryButtonContainer}>
                        <CustomButton
                            title="Retry Submission"
                            variant="primary"
                            onPress={onRetry}
                            style={styles.retryButton}
                        />
                    </View>
                )}
            </View>
        );
    }

    const formattedAmount = `₱${Number(amountToPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const displayMethod = selectedMethod || 'Manual QR (GCash / Maya)';

    const effectiveDate = paymentDate ? new Date(paymentDate) : new Date();
    const formattedDate = `${formatDateToStandard(effectiveDate)} • ${formatTime(effectiveDate)}`;

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.constrainer}>
                {/* Success Header Banner */}
                <View
                    ref={bannerRef}
                    collapsable={false}
                    style={styles.headerSection}
                    onLayout={handleBannerLayout}
                >
                    <View style={styles.iconCircle}>
                        <CustomIcon library="Feather" name="check" size={26} color={Colors.WHITE} />
                    </View>
                    
                    <CustomText variant="h2" style={styles.title}>
                        Payment Submitted!
                    </CustomText>
                    
                    <CustomText variant="caption" style={styles.subtitle}>
                        Your payment receipt has been successfully sent to the tour organizer for verification.
                    </CustomText>
                </View>

                {/* What Happens Next? Process Timeline (Top Section matching Booking/StatusScreen) */}
                <View
                    ref={timelineRef}
                    collapsable={false}
                    onLayout={handleTimelineLayout}
                    style={styles.timelineCard}
                >
                    <View style={styles.timelineHeaderRow}>
                        <CustomIcon library="Feather" name="clock" size={15} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.timelineCardTitle}>
                            What Happens Next?
                        </CustomText>
                    </View>

                    <View style={styles.timelineBody}>
                        {/* Step 1: Receipt Uploaded */}
                        <View style={styles.timelineStepRow}>
                            <View style={styles.timelineNodeCol}>
                                <View style={[styles.timelineNodeCircle, styles.timelineNodeDone]}>
                                    <CustomIcon library="Feather" name="check" size={11} color={Colors.STATUS_APPROVED_TEXT} />
                                </View>
                                <View style={styles.timelineConnectorLine} />
                            </View>
                            <View style={styles.timelineTextCol}>
                                <CustomText variant="label" style={styles.timelineStepNameDone}>
                                    Receipt Uploaded
                                </CustomText>
                                <CustomText variant="caption" style={styles.timelineStepDesc}>
                                    Your proof of payment was received and securely stored in audit records.
                                </CustomText>
                            </View>
                        </View>

                        {/* Step 2: Organizer Verification */}
                        <View style={styles.timelineStepRow}>
                            <View style={styles.timelineNodeCol}>
                                <View style={[styles.timelineNodeCircle, styles.timelineNodeActive]}>
                                    <CustomIcon library="Feather" name="clock" size={11} color={Colors.STATUS_PENDING_TEXT} />
                                </View>
                                <View style={styles.timelineConnectorLine} />
                            </View>
                            <View style={styles.timelineTextCol}>
                                <CustomText variant="label" style={styles.timelineStepNameActive}>
                                    Organizer Verification
                                </CustomText>
                                <CustomText variant="caption" style={styles.timelineStepDesc}>
                                    The tour coordinator cross-checks your receipt and confirms the transferred amount.
                                </CustomText>
                            </View>
                        </View>

                        {/* Step 3: Booking Confirmed */}
                        <View style={styles.timelineStepRow}>
                            <View style={styles.timelineNodeCol}>
                                <View style={[styles.timelineNodeCircle, styles.timelineNodePending]}>
                                    <CustomIcon library="Feather" name="credit-card" size={10} color={Colors.TEXT_SECONDARY} />
                                </View>
                            </View>
                            <View style={styles.timelineTextCol}>
                                <CustomText variant="label" style={styles.timelineStepNamePending}>
                                    Booking Confirmed
                                </CustomText>
                                <CustomText variant="caption" style={styles.timelineStepDesc}>
                                    You will receive an in-app notification once verified. Your booking will move to Upcoming.
                                </CustomText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Transaction Summary Section */}
                <View
                    style={styles.sectionContainer}
                    onLayout={handleReceiptLayout}
                >
                    <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h2" style={styles.sectionHeaderTitle}>
                            Transaction Summary
                        </CustomText>
                    </View>

                    <View 
                        ref={receiptRef}
                        collapsable={false}
                        style={styles.summaryCard}
                    >
                        <View style={styles.cardHeaderRow}>
                            <CustomText variant="h3" style={styles.summarySubtitle}>
                                Payment Details
                            </CustomText>
                            <View style={styles.statusChip}>
                                <CustomIcon library="Feather" name="clock" size={11} color={Colors.STATUS_PENDING_TEXT} />
                                <CustomText variant="caption" style={styles.statusChipText}>
                                    Awaiting Verification
                                </CustomText>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <CustomText style={styles.infoLabel}>Payment Method</CustomText>
                            <CustomText style={styles.infoValue}>{displayMethod}</CustomText>
                        </View>

                        <View style={styles.infoRow}>
                            <CustomText style={styles.infoLabel}>Amount Submitted</CustomText>
                            <CustomText style={styles.infoValueHighlight}>{formattedAmount}</CustomText>
                        </View>

                        {bookingId ? (
                            <View style={styles.infoRow}>
                                <CustomText style={styles.infoLabel}>Booking Reference</CustomText>
                                <CustomText style={styles.infoValue}>{bookingId}</CustomText>
                            </View>
                        ) : null}

                        <View style={[styles.infoRow, styles.infoRowLast]}>
                            <CustomText style={styles.infoLabel}>Payment Date</CustomText>
                            <CustomText style={styles.infoValue}>{formattedDate}</CustomText>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 16,
    },
    scrollContent: { 
        paddingTop: 24, 
        paddingBottom: 100,
        alignItems: 'center',
    },
    stateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 8, 
    },
    iconCircle: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        backgroundColor: Colors.SUCCESS, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 12, 
        ...GlobalStyles.dropShadow(3), 
    },
    errorIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.ERROR,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        ...GlobalStyles.dropShadow(3),
    },
    title: { 
        marginBottom: 4, 
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    subtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        paddingHorizontal: 16, 
        lineHeight: 18, 
    },
    retryButtonContainer: {
        marginTop: 24,
        width: '100%',
        maxWidth: 280,
    },
    retryButton: {
        borderRadius: 12,
    },
    timelineCard: {
        backgroundColor: Colors.WHITE,
        width: '100%',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2, 0.04, Colors.SHADOW, { radius: 4 }),
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    timelineCardTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: '700',
    },
    timelineBody: {
        gap: 0,
    },
    timelineStepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineNodeCol: {
        alignItems: 'center',
        width: 24,
        marginRight: 10,
    },
    timelineNodeCircle: {
        width: 22,
        height: 22,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineNodeDone: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    timelineNodeActive: {
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_PENDING_BORDER,
    },
    timelineNodePending: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    timelineConnectorLine: {
        width: 2,
        height: 26,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 2,
    },
    timelineTextCol: {
        flex: 1,
        paddingBottom: 10,
    },
    timelineStepNameDone: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.STATUS_APPROVED_TEXT,
        marginBottom: 2,
    },
    timelineStepNameActive: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.STATUS_PENDING_TEXT,
        marginBottom: 2,
    },
    timelineStepNamePending: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    timelineStepDesc: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        fontSize: 11,
    },
    sectionContainer: {
        width: '100%',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionHeaderTitle: {
        marginBottom: 0,
    },
    summaryCard: { 
        backgroundColor: Colors.WHITE, 
        width: '100%', 
        borderRadius: 24, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }), 
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summarySubtitle: { 
        fontWeight: '700', 
        color: Colors.TEXT_PRIMARY, 
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderColor: Colors.STATUS_PENDING_BORDER,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        gap: 5,
    },
    statusChipText: {
        color: Colors.STATUS_PENDING_TEXT,
        fontWeight: '700',
        fontSize: 11,
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginBottom: 12, 
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    infoRowLast: {
        paddingBottom: 2,
    },
    infoLabel: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    infoValueHighlight: {
        fontSize: 15,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});

export default StatusScreen;
