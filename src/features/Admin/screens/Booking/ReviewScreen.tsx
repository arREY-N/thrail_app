import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomSelectionModal from '@/src/components/CustomSelectionModal';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomToast from '@/src/components/CustomToast';
import ErrorMessage from '@/src/components/ErrorMessage';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

import useReviewLogic from '@/src/features/Admin/hooks/useReviewLogic';
import { ActivityLog } from '@/src/features/Admin/screens/Booking/components/ActivityLog';
import AdminActionMenu from '@/src/features/Admin/screens/Booking/components/AdminActionMenu';
import AdminRefundModal, { RefundType } from '@/src/features/Admin/screens/Booking/components/AdminRefundModal';
import HikerProfileCard from '@/src/features/Admin/screens/Booking/components/HikerProfileCard';
import DocumentTab, { DocState } from '@/src/features/Admin/screens/Booking/tabs/DocumentTab';
import PaymentTab from '@/src/features/Admin/screens/Booking/tabs/PaymentTab';

import { Booking } from '@/src/core/models/Booking/Booking';
import { Offer } from '@/src/core/models/Offer/Offer';
import { User } from '@/src/core/models/User/User';
import { 
    getDynamicRejectionSuggestions, 
    getVerificationWarningMessage, 
    REVIEW_MODALS, 
    REVIEW_TOASTS 
} from '@/src/features/Admin/utils/reviewMessages';

/**
 * Props for ReviewScreen component.
 * @param isLoading - Flag indicating screen is in a loading state.
 * @param booking - The booking details model.
 * @param offers - List of rescheduling offers.
 * @param onBackPress - Callback for back navigation.
 * @param onApprove - Callback when approving the booking.
 * @param onConfirmPayment - Callback when verifying payment.
 * @param onReject - Callback when rejecting the booking.
 * @param onReschedule - Callback when selecting a reschedule offer.
 * @param onRefund - Callback when issuing a refund.
 * @param onCancelUnpaid - Callback when cancelling an unpaid booking.
 * @param error - Optional error message text.
 * @param hikerProfile - The hiker profile details.
 */
export interface ReviewScreenProps {
    isLoading: boolean;
    booking: Booking;
    offers: Offer[];
    onBackPress: () => void;
    onApprove: (docStates: DocState[], personalVerifiedAt: Date | null, emergencyVerifiedAt: Date | null, booking?: Booking) => Promise<void>;
    onConfirmPayment: (booking?: Booking) => Promise<void>;
    onReject: (reason: string, docStates: DocState[], personalVerifiedAt: Date | null, emergencyVerifiedAt: Date | null, booking?: Booking) => Promise<void>;
    onReschedule: (offerData: Offer, booking?: Booking) => void | Promise<void>;
    onRefund: (booking: Booking, refundType: RefundType) => Promise<Booking | undefined | void> | void;
    onCancelUnpaid?: (booking?: Booking) => Promise<void>;
    error?: string;
    hikerProfile?: User | null;
}

/**
 * ReviewScreen — Admin booking review screen that consolidates the document and payment workflows.
 */
const ReviewScreen: React.FC<ReviewScreenProps> = ({
    isLoading,
    booking,
    offers,
    onBackPress,
    onApprove,
    onConfirmPayment,
    onReject,
    onReschedule,
    onRefund,
    onCancelUnpaid,
    error,
    hikerProfile
}) => {
    const { width } = useWindowDimensions();
    const isWide = width >= 768;

    const {
        activeTab, setActiveTab,
        docStates, setDocStates,
        viewedDocs, setViewedDocs,
        rejectionReason, setRejectionReason,
        personalVerifiedAt,
        emergencyVerifiedAt,
        personalStatus, emergencyStatus,
        personalMonthsRemaining, emergencyMonthsRemaining,
        togglePersonalVerify, toggleEmergencyVerify,
        isMinor,
        currentStatus,
        isApprovedStatus,
        isRejectedStatus,
        isCancelledStatus,
        isReviewComplete,
        adminStatusConfig,
        hasRejections, isDecisionIncomplete,
        availableOffers,
        approvalGuard,
        syncGlobalVerification,
    } = useReviewLogic(booking, offers);

    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isConfirmPaymentVisible, setIsConfirmPaymentVisible] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleOffer, setSelectedRescheduleOffer] = useState<{ id: string; label: string; subLabel?: string; originalData: Offer } | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showCancelUnpaidModal, setShowCancelUnpaidModal] = useState(false);

    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [isRejectingBooking, setIsRejectingBooking] = useState(false);

    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
    }>({
        visible: false,
        message: '',
        type: 'info',
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [hasInteracted, setHasInteracted] = useState<boolean>(false);

    const isRejecting = hasRejections || isRejectingBooking || rejectionReason.trim().length > 0;

    const hasUnverifiedPhone = personalStatus !== 'verified' || (emergencyStatus !== 'verified' && !!booking?.emergencyContact);
    const isSecondaryVisible = isRejecting 
        ? true 
        : (hasInteracted || hasUnverifiedPhone || docStates.length === 0);

    const dynamicSuggestions = useMemo(
        () => getDynamicRejectionSuggestions(docStates.length, hasRejections),
        [docStates.length, hasRejections]
    );

    const totalAmountPaid = booking?.payment?.reduce((sum: number, p) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;

    const handleViewFile = async (url: string, index: number) => {
        if (!url) return Alert.alert("Notice", "No file uploaded.");

        setViewedDocs((prev: Record<number, boolean>) => ({ ...prev, [index]: true }));
        setHasInteracted(true);

        if (url.toLowerCase().includes('.pdf')) {
            if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
            }
        } else {
            setPreviewImageUrl(url);
        }
    };

    const handleFinalDecision = async () => {
        setIsConfirmVisible(false);
        const allApproved = !isRejecting && docStates.every((d: DocState) => d.valid === 'approved');

        setIsProcessingAction(true);
        try {
            if (booking?.user?.id) {
                await syncGlobalVerification(booking.user.id, 'personal', personalVerifiedAt);
                await syncGlobalVerification(booking.user.id, 'emergency', emergencyVerifiedAt);
                const linkedUserId = booking.emergencyContact?.userId;
                if (linkedUserId) {
                    await syncGlobalVerification(linkedUserId, 'personal', emergencyVerifiedAt);
                }
            }

            if (allApproved) {
                await onApprove(docStates, personalVerifiedAt, emergencyVerifiedAt, booking);
                setActiveTab('payment');
            } else {
                await onReject(rejectionReason, docStates, personalVerifiedAt, emergencyVerifiedAt, booking);
            }
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleRejectionReasonChange = useCallback((reason: string) => {
        setRejectionReason(reason);
        if (hasAttemptedSubmit) {
            setHasAttemptedSubmit(false);
        }
    }, [hasAttemptedSubmit, setRejectionReason]);

    const handlePrimaryPress = useCallback(() => {
        if (isRejecting) {
            const hasReason = rejectionReason.trim().length > 0;
            if (!hasReason) {
                setHasAttemptedSubmit(true);
                setToastConfig({
                    visible: true,
                    message: REVIEW_TOASTS.REASON_REQUIRED,
                    type: 'error',
                });
                return;
            }
            setIsConfirmVisible(true);
            return;
        }

        if (isDecisionIncomplete) {
            const pendingCount = docStates.filter((d: DocState) => d.valid === 'pending').length;
            setHasAttemptedSubmit(true);
            setToastConfig({
                visible: true,
                message: REVIEW_TOASTS.DOCS_INCOMPLETE(pendingCount),
                type: 'error',
            });
            return;
        }

        setIsConfirmVisible(true);
    }, [isRejecting, rejectionReason, isDecisionIncomplete, docStates]);

    const handleSecondaryPress = useCallback(() => {
        if (isRejecting) {
            setDocStates(prev => prev.map(d => d.valid === 'rejected' ? { ...d, valid: 'pending' as const } : d));
            setRejectionReason('');
            setIsRejectingBooking(false);
            setHasAttemptedSubmit(false);
            setToastConfig(prev => ({ ...prev, visible: false }));
            return;
        }

        setHasInteracted(true);
        setIsRejectingBooking(true);
        setHasAttemptedSubmit(false);
    }, [isRejecting, setDocStates, setRejectionReason]);

    const primaryButtonConfig = useMemo(() => {
        if (isRejecting) {
            const hasReason = rejectionReason.trim().length > 0;
            return {
                title: "Submit Rejection",
                variant: 'destructive' as const,
                disabled: isProcessingAction,
                style: hasReason ? {
                    backgroundColor: Colors.ERROR,
                    borderColor: Colors.ERROR,
                } : (hasAttemptedSubmit ? {
                    backgroundColor: Colors.STATUS_CANCELLED_BG,
                    borderColor: Colors.STATUS_CANCELLED_TEXT,
                    borderWidth: 1.5,
                } : {
                    backgroundColor: Colors.GRAY_ULTRALIGHT,
                    borderColor: Colors.GRAY_LIGHT,
                    borderWidth: 1.5,
                }),
                textStyle: hasReason ? {
                    color: Colors.WHITE,
                    fontWeight: 'bold' as const,
                } : (hasAttemptedSubmit ? {
                    color: Colors.STATUS_CANCELLED_TEXT,
                    fontWeight: 'bold' as const,
                } : {
                    color: Colors.TEXT_SECONDARY,
                    fontWeight: 'bold' as const,
                }),
                onPress: handlePrimaryPress,
            };
        }

        // Approval flow
        const isReady = !isDecisionIncomplete && docStates.length > 0;
        return {
            title: "Approve Booking",
            variant: 'primary' as const,
            disabled: isProcessingAction,
            style: isReady ? {
                backgroundColor: Colors.PRIMARY,
                borderColor: Colors.PRIMARY,
            } : (hasAttemptedSubmit ? {
                backgroundColor: Colors.STATUS_CANCELLED_BG,
                borderColor: Colors.STATUS_CANCELLED_TEXT,
                borderWidth: 1.5,
            } : {
                backgroundColor: Colors.GRAY_ULTRALIGHT,
                borderColor: Colors.GRAY_LIGHT,
                borderWidth: 1.5,
            }),
            textStyle: isReady ? {
                color: Colors.WHITE,
                fontWeight: 'bold' as const,
            } : (hasAttemptedSubmit ? {
                color: Colors.STATUS_CANCELLED_TEXT,
                fontWeight: 'bold' as const,
            } : {
                color: Colors.TEXT_SECONDARY,
                fontWeight: 'bold' as const,
            }),
            onPress: handlePrimaryPress,
        };
    }, [isRejecting, rejectionReason, isProcessingAction, hasAttemptedSubmit, isDecisionIncomplete, docStates.length, handlePrimaryPress]);

    const secondaryButtonConfig = useMemo(() => {
        if (isRejecting) {
            return {
                title: "Cancel Rejection",
                variant: 'outline' as const,
                disabled: isProcessingAction,
                textStyle: { color: Colors.TEXT_PRIMARY },
                style: {
                    borderColor: Colors.GRAY_LIGHT,
                    backgroundColor: Colors.WHITE,
                },
                onPress: handleSecondaryPress,
            };
        }

        if (!isSecondaryVisible) {
            return undefined;
        }

        return {
            title: "Reject Booking",
            variant: 'outline' as const,
            disabled: isProcessingAction,
            textStyle: { color: Colors.ERROR },
            style: {
                borderColor: Colors.GRAY_LIGHT,
                backgroundColor: Colors.WHITE,
            },
            onPress: handleSecondaryPress,
        };
    }, [isRejecting, isSecondaryVisible, isProcessingAction, handleSecondaryPress]);

    const confirmModalConfig = useMemo(() => {
        if (isRejecting) {
            return {
                title: REVIEW_MODALS.REJECT.title,
                message: REVIEW_MODALS.REJECT.message,
                confirmText: REVIEW_MODALS.REJECT.confirmText,
                cancelText: REVIEW_MODALS.REJECT.cancelText,
                iconName: "alert-triangle",
                isDestructive: true,
            };
        }

        if (approvalGuard?.requiresOverride) {
            return {
                title: REVIEW_MODALS.SAFETY_OVERRIDE.title,
                message: getVerificationWarningMessage(personalStatus, emergencyStatus),
                confirmText: REVIEW_MODALS.SAFETY_OVERRIDE.confirmText,
                cancelText: REVIEW_MODALS.SAFETY_OVERRIDE.cancelText,
                iconName: "alert-triangle",
                isDestructive: false,
            };
        }

        return {
            title: REVIEW_MODALS.APPROVE.title,
            message: REVIEW_MODALS.APPROVE.message,
            confirmText: REVIEW_MODALS.APPROVE.confirmText,
            cancelText: REVIEW_MODALS.APPROVE.cancelText,
            iconName: "check-circle",
            isDestructive: false,
        };
    }, [isRejecting, approvalGuard?.requiresOverride, personalStatus, emergencyStatus]);

    if (isLoading || !booking || !booking.user) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Review Booking" centerTitle={true} onBackPress={onBackPress} />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <CustomLoading
                visible={isProcessingAction}
                message="Processing request..."
            />

            <CustomHeader
                title="Review Booking"
                centerTitle={true}
                onBackPress={onBackPress}
                rightActions={
                    <TouchableOpacity
                        style={styles.headerOptionsBtn}
                        onPress={() => setShowActionMenu(true)}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                }
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.constrainer}>

                    {error && !error.includes('No payment found') && (
                        <ErrorMessage error={error} />
                    )}
                    <View style={isWide ? styles.splitLayoutContainer : styles.verticalLayoutContainer}>
                        {/* Left Column: Hiker Profile */}
                        <View style={isWide ? styles.leftColumn : styles.fullWidthContainer}>
                            <HikerProfileCard
                                user={booking.user}
                                emergencyContact={booking.emergencyContact}
                                hikerProfile={hikerProfile}
                                personalStatus={personalStatus}
                                emergencyStatus={emergencyStatus}
                                personalMonthsRemaining={personalMonthsRemaining}
                                emergencyMonthsRemaining={emergencyMonthsRemaining}
                                personalVerifiedAt={personalVerifiedAt}
                                emergencyVerifiedAt={emergencyVerifiedAt}
                                onTogglePersonalVerify={togglePersonalVerify}
                                onToggleEmergencyVerify={toggleEmergencyVerify}
                                statusText={adminStatusConfig.label}
                                statusBgColor={adminStatusConfig.bgColor}
                                statusTextColor={adminStatusConfig.textColor}
                                isMinor={isMinor}
                            />
                        </View>

                        {/* Right Column: Documents and Payment Verification */}
                        <View style={isWide ? styles.rightColumn : styles.fullWidthContainer}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]}
                                    onPress={() => setActiveTab('documents')}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon library="Feather" name="file-text" size={16} color={activeTab === 'documents' ? Colors.WHITE : Colors.TEXT_SECONDARY} />
                                    <CustomText style={[styles.tabText, activeTab === 'documents' && { color: Colors.WHITE }]}>
                                        Documents
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.tabBtn, activeTab === 'payment' && styles.tabBtnActive]}
                                    onPress={() => setActiveTab('payment')}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon library="Feather" name="credit-card" size={16} color={activeTab === 'payment' ? Colors.WHITE : Colors.TEXT_SECONDARY} />
                                    <CustomText style={[styles.tabText, activeTab === 'payment' && { color: Colors.WHITE }]}>
                                        Payment
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            {activeTab === 'documents' && (
                                <DocumentTab
                                    booking={booking}
                                    docStates={docStates}
                                    setDocStates={(newStates: DocState[]) => {
                                        setDocStates(newStates);
                                        if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                    }}
                                    viewedDocs={viewedDocs}
                                    isReviewComplete={isReviewComplete}
                                    isRejectedStatus={isRejectedStatus}
                                    isCancelledStatus={isCancelledStatus}
                                    hasRejections={hasRejections}
                                    showRejectionReason={isRejecting}
                                    rejectionReason={rejectionReason}
                                    setRejectionReason={handleRejectionReasonChange}
                                    suggestions={dynamicSuggestions}
                                    onAttachmentRequired={() => {
                                        setToastConfig({
                                            visible: true,
                                            message: REVIEW_TOASTS.ATTACHMENT_REQUIRED,
                                            type: 'error',
                                        });
                                    }}
                                    onInteraction={() => {
                                        setHasInteracted(true);
                                        if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                    }}
                                    onViewFile={handleViewFile}
                                />
                            )}

                            {activeTab === 'payment' && (
                                <PaymentTab
                                    booking={booking}
                                    currentStatus={currentStatus}
                                    isApprovedStatus={isApprovedStatus}
                                    isRejectedStatus={isRejectedStatus}
                                    isCancelledStatus={isCancelledStatus}
                                    onConfirmPaymentClick={() => setIsConfirmPaymentVisible(true)}
                                />
                            )}

                            <ActivityLog booking={booking} currentStatus={currentStatus} />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {!isReviewComplete && activeTab === 'documents' && (
                <View style={styles.footerWrapper}>
                    <CustomStickyFooter
                        primaryButton={primaryButtonConfig}
                        secondaryButton={secondaryButtonConfig}
                    />
                </View>
            )}

            {/* Custom Toast above Sticky Footer */}
            <CustomToast
                visible={toastConfig.visible}
                message={toastConfig.message}
                type={toastConfig.type}
                mode="dismissible"
                position="sticky_footer"
                onHide={() => {
                    setToastConfig(prev => ({ ...prev, visible: false }));
                    setHasAttemptedSubmit(false);
                }}
            />

            <ConfirmationModal
                visible={isConfirmVisible}
                onClose={() => setIsConfirmVisible(false)}
                onConfirm={handleFinalDecision}
                title={confirmModalConfig.title}
                message={confirmModalConfig.message}
                confirmText={confirmModalConfig.confirmText}
                cancelText={confirmModalConfig.cancelText}
                iconName={confirmModalConfig.iconName}
                isDestructive={confirmModalConfig.isDestructive}
            />

            <ConfirmationModal
                visible={isConfirmPaymentVisible}
                onClose={() => setIsConfirmPaymentVisible(false)}
                onConfirm={async () => {
                    setIsConfirmPaymentVisible(false);
                    setIsProcessingAction(true);
                    try {
                        await onConfirmPayment(booking);
                    } finally {
                        setIsProcessingAction(false);
                    }
                }}
                title={REVIEW_MODALS.CONFIRM_PAYMENT.title}
                message={REVIEW_MODALS.CONFIRM_PAYMENT.message}
                confirmText={REVIEW_MODALS.CONFIRM_PAYMENT.confirmText}
                cancelText={REVIEW_MODALS.CONFIRM_PAYMENT.cancelText}
            />

            <ConfirmationModal
                visible={showCancelUnpaidModal}
                onClose={() => setShowCancelUnpaidModal(false)}
                title={REVIEW_MODALS.CANCEL_UNPAID.title}
                message={REVIEW_MODALS.CANCEL_UNPAID.message}
                confirmText={REVIEW_MODALS.CANCEL_UNPAID.confirmText}
                cancelText={REVIEW_MODALS.CANCEL_UNPAID.cancelText}
                onConfirm={async () => {
                    setShowCancelUnpaidModal(false);
                    if (onCancelUnpaid) {
                        setIsProcessingAction(true);
                        try {
                            await onCancelUnpaid(booking);
                        } finally {
                            setIsProcessingAction(false);
                        }
                    }
                }}
                isDestructive={true}
                iconName="alert-triangle"
            />

            <CustomSelectionModal
                visible={showRescheduleModal}
                onClose={() => setShowRescheduleModal(false)}
                title="Select New Offer"
                options={availableOffers}
                selectedValue={selectedRescheduleOffer?.id}
                onSelect={(selected) => {
                    const offerOption = selected as { id: string; label: string; subLabel?: string; originalData: Offer };
                    setSelectedRescheduleOffer(offerOption);
                    setShowRescheduleModal(false);
                    setTimeout(async () => {
                        if (onReschedule) {
                            setIsProcessingAction(true);
                            try {
                                await onReschedule(offerOption.originalData, booking);
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }, 300);
                }}
            />

            <AdminRefundModal
                visible={showRefundModal}
                amountPaid={totalAmountPaid}
                onClose={() => setShowRefundModal(false)}
                onSelect={(refundType: RefundType) => {
                    setShowRefundModal(false);
                    setTimeout(async () => {
                        if (onRefund) {
                            setIsProcessingAction(true);
                            try {
                                await onRefund(booking, refundType);
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }, 300);
                }}
            />

            <ImagePreviewModal
                visible={!!previewImageUrl}
                imageUrl={previewImageUrl || undefined}
                onClose={() => setPreviewImageUrl(null)}
            />

            <AdminActionMenu
                visible={showActionMenu}
                onClose={() => setShowActionMenu(false)}
                isCancelledStatus={isCancelledStatus || currentStatus === 'completed'}
                totalAmountPaid={totalAmountPaid}
                onRescheduleClick={() => {
                    setShowActionMenu(false);
                    setTimeout(() => setShowRescheduleModal(true), 300);
                }}
                onRefundClick={() => {
                    setShowActionMenu(false);
                    setTimeout(() => setShowRefundModal(true), 300);
                }}
                onCancelClick={() => {
                    setShowActionMenu(false);
                    setTimeout(() => setShowCancelUnpaidModal(true), 300);
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerOptionsBtn: {
        padding: 4
    },
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center'
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
        paddingTop: 20
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 20
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8
    },
    tabBtnActive: {
        backgroundColor: Colors.PRIMARY
    },
    tabText: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        fontSize: 14
    },
    footerWrapper: {
        alignItems: 'center',
        width: '100%'
    },

    // Two-Column Grid Styles
    splitLayoutContainer: {
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
        width: '100%',
        marginTop: 16
    },
    verticalLayoutContainer: {
        flexDirection: 'column',
        width: '100%',
        marginTop: 16,
        gap: 20
    },
    leftColumn: {
        flex: 1.2,
        minWidth: 320
    },
    rightColumn: {
        flex: 1.8,
        minWidth: 380
    },
    fullWidthContainer: {
        width: '100%'
    },


});

export default ReviewScreen;
