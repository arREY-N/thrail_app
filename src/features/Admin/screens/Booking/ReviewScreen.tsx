import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomSegmentedTabs from '@/src/components/CustomSegmentedTabs';
import CustomSelectionModal from '@/src/components/CustomSelectionModal';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { useToast } from '@/src/components/Toast/Toast';
import ErrorMessage from '@/src/components/ErrorMessage';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import {
    adminBookingReviewDocSteps,
    adminBookingReviewPaymentSteps,
    createReplayHelpStep,
} from '@/src/components/Tutorial/constants';
import {
    CustomTutorialModal,
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
    TutorialHelpButton,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';

import useReviewLogic from '@/src/features/Admin/hooks/useReviewLogic';
import { ActivityLog } from '@/src/features/Admin/screens/Booking/components/ActivityLog';
import AdminActionMenu from '@/src/features/Admin/screens/Booking/components/AdminActionMenu';
import AdminCancelBookingModal from '@/src/features/Admin/screens/Booking/components/AdminCancelBookingModal';
import AdminCancellationCard from '@/src/features/Admin/screens/Booking/components/AdminCancellationCard';
import AdminRescheduleCard from '@/src/features/Admin/screens/Booking/components/AdminRescheduleCard';
import AdminRefundModal, { RefundType } from '@/src/features/Admin/screens/Booking/components/AdminRefundModal';
import HikerProfileCard from '@/src/features/Admin/screens/Booking/components/HikerProfileCard';
import DocumentTab, { DocState } from '@/src/features/Admin/screens/Booking/tabs/DocumentTab';
import PaymentTab from '@/src/features/Admin/screens/Booking/tabs/PaymentTab';

import { VerificationStatus } from '@/src/core/flows/PhoneVerificationFlow';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { Reschedule } from '@/src/core/models/Reschedule/interfaces/Reschedule.types';
import { Offer } from '@/src/core/models/Offer/Offer';
import { User } from '@/src/core/models/User/User';
import { SelectedFile } from '@/src/core/repositories/fileRepository';
import {
    CANCELLATION_DECLINE_REASONS,
    getDynamicRejectionSuggestions,
    getLockedVerificationToastMessage,
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
 * @param cancellationRequest - Optional active cancellation request document.
 * @param onApproveCancellation - Callback when approving a cancellation request.
 * @param onDeclineCancellation - Callback when declining a cancellation request with adminNote.
 * @param onAdminCancelBooking - Callback when organizer force-cancels a booking.
 */
export interface ReviewScreenProps {
    isLoading: boolean;
    booking?: Booking | null;
    offers: Offer[];
    onBackPress: () => void;
    onApprove: (docStates: DocState[], personalVerifiedAt: Date | null, emergencyVerifiedAt: Date | null, booking?: Booking) => Promise<void>;
    onConfirmPayment: (booking?: Booking) => Promise<void>;
    onReject: (reason: string, docStates: DocState[], personalVerifiedAt: Date | null, emergencyVerifiedAt: Date | null, booking?: Booking) => Promise<void>;
    onReschedule: (offerData: Offer, booking?: Booking) => void | Promise<void>;
    onRefund: (booking: Booking, refundType: RefundType, customAmount?: number) => Promise<Booking | undefined | void> | void;
    onCancelUnpaid?: (booking?: Booking) => Promise<void>;
    error?: string;
    hikerProfile?: User | null;
    cancellationRequest?: Cancellation | null;
    onApproveCancellation?: (request?: Cancellation | null, booking?: Booking, refundType?: RefundType, customAmount?: number, adminNote?: string) => Promise<void>;
    onDeclineCancellation?: (reason: string, request?: Cancellation | null, booking?: Booking) => Promise<void>;
    onRevertCancellation?: (request?: Cancellation | null) => Promise<void>;
    onAdminCancelBooking?: (booking: Booking, reason: string, refundType?: 'full' | 'partial' | 'none', refundAmount?: number) => Promise<void>;
    onVerifyManualPayment?: (classification: 'full' | 'downpayment', note?: string, booking?: Booking, verifiedAmount?: number) => Promise<void>;
    onRejectManualPayment?: (reason: string, booking?: Booking) => Promise<void>;
    onSettleRemainingBalance?: (booking?: Booking, options?: { method?: 'cash' | 'manual_qr'; referenceCode?: string; adminNote?: string }) => Promise<void>;
    onUploadRefundProof?: (file: SelectedFile, request?: Cancellation | null, booking?: Booking | null) => Promise<void | string>;
    onUploadOverpaymentProof?: (file: SelectedFile, booking?: Booking | null) => Promise<void | string>;
    onApproveWithManualRefund?: (amount: number, request?: Cancellation | null, booking?: Booking | null) => Promise<void | Cancellation>;
    rescheduleRequest?: Reschedule | null;
    onApproveReschedule?: (newOffer: Offer, booking?: Booking, adminNote?: string) => Promise<void>;
    onDeclineReschedule?: (reason: string, reschedule?: Reschedule | null, booking?: Booking) => Promise<void>;
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
    hikerProfile,
    cancellationRequest,
    onApproveCancellation,
    onDeclineCancellation,
    onRevertCancellation,
    onAdminCancelBooking,
    onVerifyManualPayment,
    onRejectManualPayment,
    onSettleRemainingBalance,
    onUploadRefundProof,
    onUploadOverpaymentProof,
    onApproveWithManualRefund,
    rescheduleRequest,
    onApproveReschedule,
    onDeclineReschedule,
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
        isCancellationPending,
        isHikerCancellationPending,
        isAdminCancellationPending,
        isReviewComplete,
        adminStatusConfig,
        hasRejections, isDecisionIncomplete,
        availableOffers,
        approvalGuard,
        syncGlobalVerification,
    } = useReviewLogic(booking, offers, cancellationRequest);

    const dynamicTourSteps = useMemo(() => {
        const steps = activeTab === 'payment'
            ? adminBookingReviewPaymentSteps
            : adminBookingReviewDocSteps;
        return [...steps, createReplayHelpStep('Booking Review')];
    }, [activeTab]);

    const tutorial = useTutorialGuide('admin_booking_review', !isLoading && Boolean(booking), dynamicTourSteps);
    const scrollViewRef = useRef<ScrollView>(null);
    const leftColRef = useRef<View>(null);
    const tabBarRef = useRef<View>(null);
    const contentRef = useRef<View>(null);
    const firstCardRef = useRef<View>(null);
    const tabBarOffsetY = useRef<number>(360);

    const measureProfileNow = useCallback(() => {
        leftColRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_profile', {
                    x,
                    y,
                    width: w,
                    height: h,
                });
            }
        });
    }, []);

    const measureTabsNow = useCallback(() => {
        tabBarRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_tabs', { x, y, width: w, height: h });
            }
        });
    }, []);

    const measureContentNow = useCallback(() => {
        const targetRef = activeTab === 'documents' ? firstCardRef : contentRef;
        targetRef.current?.measureInWindow((x, y, w, h) => {
            if (w > 0 && h > 0) {
                registerTutorialLayout('admin_review_content', {
                    x,
                    y,
                    width: w,
                    height: h,
                });
            }
        });
    }, [activeTab]);

    useEffect(() => {
        const u1 = registerMeasureCallback('admin_review_profile', measureProfileNow);
        const u2 = registerMeasureCallback('admin_review_tabs', measureTabsNow);
        const u3 = registerMeasureCallback('admin_review_content', measureContentNow);
        return () => {
            u1();
            u2();
            u3();
        };
    }, [measureProfileNow, measureTabsNow, measureContentNow]);

    useEffect(() => {
        if (!tutorial.isVisible) return;
        const step = tutorial.currentStep?.targetSpotlight;
        if (!step) return;
        if (step === 'admin_review_profile' || step === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } else if (step === 'admin_review_tabs' || step === 'admin_review_content') {
            if (!isWide) {
                scrollViewRef.current?.scrollTo({
                    y: Math.max(0, tabBarOffsetY.current - 32),
                    animated: true,
                });
            }
        } else if (step === 'booking_footer') {
            scrollViewRef.current?.scrollToEnd({ animated: true });
            setTimeout(() => {
                requestTargetMeasurement('booking_footer');
            }, 250);
        }
        requestTargetMeasurement(step);
    }, [tutorial.isVisible, tutorial.currentStep?.targetSpotlight, isWide]);

    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isConfirmPaymentVisible, setIsConfirmPaymentVisible] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleOffer, setSelectedRescheduleOffer] = useState<{ id: string; label: string; subLabel?: string; originalData: Offer } | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundModalInitialType, setRefundModalInitialType] = useState<RefundType>('full');
    const [showCancelUnpaidModal, setShowCancelUnpaidModal] = useState(false);

    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [isRejectingBooking, setIsRejectingBooking] = useState(false);
    const [isDecliningCancellation, setIsDecliningCancellation] = useState(false);
    const [cancellationDeclineReason, setCancellationDeclineReason] = useState('');
    const [isConfirmCancellationVisible, setIsConfirmCancellationVisible] = useState(false);
    const [isConfirmDeclineVisible, setIsConfirmDeclineVisible] = useState(false);
    const [isConfirmRevertVisible, setIsConfirmRevertVisible] = useState(false);
    const [isUploadingProof, setIsUploadingProof] = useState(false);

    const { showToast } = useToast();
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

    const handleUploadRefundProof = async (file: SelectedFile) => {
        if (!onUploadRefundProof) return;
        setIsUploadingProof(true);
        try {
            await onUploadRefundProof(file, cancellationRequest, booking);
            showToast.success("Refund payout proof uploaded successfully.");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to upload refund proof";
            showToast.error(errorMessage);
        } finally {
            setIsUploadingProof(false);
        }
    };

    const handleApproveWithManualRefund = async (amount: number) => {
        if (!onApproveWithManualRefund) return;
        setIsProcessingAction(true);
        try {
            await onApproveWithManualRefund(amount, cancellationRequest, booking);
            const hasWalletUpfront = Boolean(cancellationRequest?.userWallet?.accountNumber);
            showToast.success(
                hasWalletUpfront
                    ? `Refund of ₱${amount.toFixed(2)} approved. Ready for payout.`
                    : `Refund of ₱${amount.toFixed(2)} approved. Awaiting hiker wallet.`
            );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to approve refund";
            showToast.error(errorMessage);
        } finally {
            setIsProcessingAction(false);
        }
    };

    const isRejecting = hasRejections || isRejectingBooking;

    const hasUnverifiedPhone = personalStatus !== 'verified' || (emergencyStatus !== 'verified' && !!booking?.emergencyContact);
    const isSecondaryVisible = isRejecting || hasUnverifiedPhone || hasRejections || docStates.length === 0;

    const dynamicSuggestions = useMemo(
        () => getDynamicRejectionSuggestions(docStates.length, hasRejections),
        [docStates.length, hasRejections]
    );

    const totalAmountPaid = booking?.payment?.reduce((sum: number, p) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;
    const totalRefundedAmount = typeof booking?.refundedAmount === 'number' && booking.refundedAmount > 0
        ? booking.refundedAmount
        : (typeof cancellationRequest?.refundAmount === 'number' && cancellationRequest.refundAmount > 0
            ? cancellationRequest.refundAmount
            : (booking?.payment?.reduce((sum: number, p) => (p.status === 'refunded' || ((p.refundedAmount || 0) > 0)) ? sum + (p.refundedAmount || p.amount) : sum, 0) || 0));
    const remainingRefundableAmount = Math.max(0, totalAmountPaid - totalRefundedAmount);
    const isOfferFinished = Boolean(booking?.offer?.date && new Date(booking.offer.date) < new Date());
    const lastCapturedPayment = booking?.payment?.slice().reverse().find(p => p.status === 'captured');
    const paymentCapturedAt = lastCapturedPayment?.createdAt || null;

    const handleLockedVerifyPress = useCallback((vStatus: VerificationStatus) => {
        const message = getLockedVerificationToastMessage(currentStatus, vStatus);
        showToast.info(message);
    }, [currentStatus, showToast]);

    const handleViewFile = async (url: string, index: number) => {
        if (!url) {
            showToast.info("No file uploaded.");
            return;
        }

        setViewedDocs((prev: Record<number, boolean>) => ({ ...prev, [index]: true }));

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
                await onApprove(docStates, personalVerifiedAt, emergencyVerifiedAt, booking ?? undefined);
                setActiveTab('payment');
            } else {
                await onReject(rejectionReason, docStates, personalVerifiedAt, emergencyVerifiedAt, booking ?? undefined);
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
                showToast.error(REVIEW_TOASTS.REASON_REQUIRED, {
                    onHide: () => setHasAttemptedSubmit(false),
                });
                return;
            }
            setIsConfirmVisible(true);
            return;
        }

        if (isDecisionIncomplete) {
            const pendingCount = docStates.filter((d: DocState) => d.valid === 'pending').length;
            setHasAttemptedSubmit(true);
            showToast.error(REVIEW_TOASTS.DOCS_INCOMPLETE(pendingCount), {
                onHide: () => setHasAttemptedSubmit(false),
            });
            return;
        }

        setIsConfirmVisible(true);
    }, [isRejecting, rejectionReason, isDecisionIncomplete, docStates, showToast]);

    const handleSecondaryPress = useCallback(() => {
        if (isRejecting) {
            setDocStates(prev => prev.map(d => d.valid === 'rejected' ? { ...d, valid: 'pending' as const } : d));
            setRejectionReason('');
            setIsRejectingBooking(false);
            setHasAttemptedSubmit(false);
            return;
        }

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
                validationState: hasReason ? ('valid' as const) : (hasAttemptedSubmit ? ('error' as const) : ('idle' as const)),
                isIdleDisabled: false,
                onPress: handlePrimaryPress,
            };
        }

        // Approval flow
        const isReady = !isDecisionIncomplete && docStates.length > 0;
        return {
            title: "Approve Booking",
            variant: 'primary' as const,
            disabled: isProcessingAction,
            validationState: isReady ? ('valid' as const) : (hasAttemptedSubmit ? ('error' as const) : ('idle' as const)),
            isIdleDisabled: false,
            onPress: handlePrimaryPress,
        };
    }, [isRejecting, rejectionReason, isProcessingAction, hasAttemptedSubmit, isDecisionIncomplete, docStates.length, handlePrimaryPress]);

    const secondaryButtonConfig = useMemo(() => {
        if (isRejecting) {
            return {
                title: "Cancel Rejection",
                variant: 'outline' as const,
                disabled: isProcessingAction,
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
            style: { borderColor: Colors.ERROR },
            textStyle: { color: Colors.ERROR },
            onPress: handleSecondaryPress,
        };
    }, [isRejecting, isSecondaryVisible, isProcessingAction, handleSecondaryPress]);

    const hasRemainingBalance = Boolean(booking?.remainingBalance !== undefined && booking.remainingBalance > 0);
    const isDownpaymentStatus = currentStatus === 'downpayment' || hasRemainingBalance;
    const isLockedStatus = isCancelledStatus || ['reservation-rejected', 'cancellation-rejected', 'for-cancellation', 'for-reschedule'].includes(currentStatus);
    const isPaymentActionable = currentStatus === 'paid' && !hasRemainingBalance && !isLockedStatus;
    const isTutorialFooterPreview = tutorial.isVisible && tutorial.currentStep?.targetSpotlight === 'booking_footer';

    const paymentPrimaryConfig = useMemo(() => {
        const remainingBalAmount = booking?.remainingBalance ?? (booking?.offer?.price ? booking.offer.price / 2 : 0);
        let buttonTitle = isProcessingAction ? "Completing..." : "Complete Booking";
        if (isDownpaymentStatus) {
            buttonTitle = `Balance Pending (₱${remainingBalAmount.toFixed(2)})`;
        }

        return {
            title: buttonTitle,
            variant: 'primary' as const,
            disabled: !isPaymentActionable || isProcessingAction,
            onPress: () => {
                if (isPaymentActionable) {
                    setIsConfirmPaymentVisible(true);
                }
            },
        };
    }, [isProcessingAction, isPaymentActionable, isDownpaymentStatus, booking?.remainingBalance, booking?.offer?.price]);

    const cancellationPrimaryConfig = useMemo(() => {
        if (isDecliningCancellation) {
            const hasReason = cancellationDeclineReason.trim().length > 0;
            return {
                title: "Submit Decline",
                variant: 'destructive' as const,
                disabled: isProcessingAction,
                validationState: hasReason ? ('valid' as const) : (hasAttemptedSubmit ? ('error' as const) : ('idle' as const)),
                isIdleDisabled: false,
                onPress: () => {
                    if (cancellationDeclineReason.trim().length === 0) {
                        setHasAttemptedSubmit(true);
                        showToast.error(REVIEW_TOASTS.REASON_REQUIRED, {
                            onHide: () => setHasAttemptedSubmit(false),
                        });
                        return;
                    }
                    setIsConfirmDeclineVisible(true);
                },
            };
        }

        return {
            title: totalAmountPaid > 0 ? "Approve & Refund" : "Approve Cancellation",
            variant: 'destructive' as const,
            disabled: isProcessingAction,
            onPress: () => {
                if (totalAmountPaid > 0) {
                    setShowRefundModal(true);
                } else {
                    setIsConfirmCancellationVisible(true);
                }
            },
        };
    }, [isDecliningCancellation, cancellationDeclineReason, isProcessingAction, hasAttemptedSubmit, showToast, totalAmountPaid]);

    const cancellationSecondaryConfig = useMemo(() => {
        if (isDecliningCancellation) {
            return {
                title: "Cancel Decline",
                variant: 'outline' as const,
                disabled: isProcessingAction,
                onPress: () => {
                    setIsDecliningCancellation(false);
                    setCancellationDeclineReason('');
                },
            };
        }

        return {
            title: "Decline Cancellation",
            variant: 'outline' as const,
            disabled: isProcessingAction,
            style: { borderColor: Colors.ERROR },
            textStyle: { color: Colors.ERROR },
            onPress: () => {
                setIsDecliningCancellation(true);
            },
        };
    }, [isDecliningCancellation, isProcessingAction]);

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
                isDestructive: true,
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

    if (isLoading) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Review Booking" centerTitle={true} onBackPress={onBackPress} />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!booking || !booking.user) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Review Booking" centerTitle={true} onBackPress={onBackPress} />
                <View style={styles.emptyContainer}>
                    <CustomIcon library="Feather" name="alert-circle" size={48} color={Colors.GRAY_MEDIUM} />
                    <CustomText variant="h3" style={styles.emptyTitle}>
                        Booking Not Available
                    </CustomText>
                    <CustomText variant="caption" style={styles.emptySubtitle}>
                        This booking is no longer available or has been cancelled.
                    </CustomText>
                    <CustomButton
                        title="Return to Bookings"
                        variant="primary"
                        onPress={onBackPress}
                        style={styles.backButton}
                    />
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
                    <View style={styles.headerRightActions}>
                        <TutorialHelpButton onPress={tutorial.onReplayTour} />
                        <TouchableOpacity
                            style={styles.headerOptionsBtn}
                            onPress={() => setShowActionMenu(true)}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>

                    {error && !error.includes('No payment found') && (
                        <ErrorMessage error={error} />
                    )}
                    <View style={isWide ? styles.splitLayoutContainer : styles.verticalLayoutContainer}>
                        {/* Left Column: Hiker Profile */}
                        <View
                            ref={leftColRef}
                            collapsable={false}
                            onLayout={(e) => {
                                tabBarOffsetY.current = e.nativeEvent.layout.height + 16;
                                if (isTutorialMeasurementActive()) measureProfileNow();
                            }}
                            style={isWide ? styles.leftColumn : styles.fullWidthContainer}
                        >
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
                                isEditable={currentStatus === 'for-reservation'}
                                onLockedVerifyPress={handleLockedVerifyPress}
                            />
                            {isWide && (
                                <ActivityLog booking={booking} cancellation={cancellationRequest} currentStatus={currentStatus} />
                            )}
                        </View>

                        {/* Right Column: Documents and Payment Verification */}
                        <View style={isWide ? styles.rightColumn : styles.fullWidthContainer}>
                            <AdminRescheduleCard
                                booking={booking}
                                offers={offers}
                                reschedule={rescheduleRequest}
                                totalAmountPaid={totalAmountPaid}
                                onApproveReschedule={onApproveReschedule || onReschedule}
                                onDeclineReschedule={onDeclineReschedule}
                            />

                            <AdminCancellationCard
                                status={currentStatus}
                                cancellation={cancellationRequest}
                                cancellationReason={cancellationRequest?.reason || (hasRejections ? undefined : booking.cancellationReason)}
                                declineReason={cancellationRequest?.adminNote}
                                totalAmountPaid={totalAmountPaid}
                                totalRefundedAmount={totalRefundedAmount}
                                requestedAt={cancellationRequest?.createdAt || booking.updatedAt}
                                cancelledBy={cancellationRequest?.cancelledBy || (hasRejections ? 'user' : booking.cancelledBy)}
                                onRevert={isAdminCancellationPending && Boolean(onRevertCancellation) ? () => setIsConfirmRevertVisible(true) : undefined}
                                isReverting={isProcessingAction}
                                onRefundClick={() => {
                                    setRefundModalInitialType('full');
                                    setShowRefundModal(true);
                                }}
                                onCloseWithoutRefundClick={() => {
                                    setRefundModalInitialType('none');
                                    setShowRefundModal(true);
                                }}
                                onUploadRefundProof={onUploadRefundProof ? handleUploadRefundProof : undefined}
                                isUploadingProof={isUploadingProof}
                                onApproveWithManualRefund={onApproveWithManualRefund ? handleApproveWithManualRefund : undefined}
                                payments={booking.payment}
                            />

                            {isHikerCancellationPending && isDecliningCancellation && (
                                <View style={styles.cancellationReasonBox}>
                                    <CustomFeedbackInput
                                        label="Decline Reason *"
                                        helperText="Explain why the cancellation request is declined. The hiker will receive this message and can appeal."
                                        placeholder="Explain why cancellation cannot be approved..."
                                        value={cancellationDeclineReason}
                                        onChangeText={setCancellationDeclineReason}
                                        suggestions={[...CANCELLATION_DECLINE_REASONS]}
                                        variant="danger"
                                    />
                                </View>
                            )}

                            {isHikerCancellationPending && (
                                <View style={styles.cancellationPendingBanner}>
                                    <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.ERROR} />
                                    <CustomText variant="caption" style={styles.cancellationPendingText}>
                                        {['for-payment', 'paid', 'downpayment', 'completed'].includes(currentStatus)
                                            ? "A cancellation request is currently pending. Please approve or decline the cancellation request below before reviewing payment."
                                            : "A cancellation request is currently pending. Please approve or decline the cancellation request below before completing document verification."}
                                    </CustomText>
                                </View>
                            )}

                            <View
                                ref={tabBarRef}
                                collapsable={false}
                                onLayout={() => {
                                    if (isTutorialMeasurementActive()) measureTabsNow();
                                }}
                                style={{ marginBottom: 16 }}
                            >
                                <CustomSegmentedTabs
                                    tabs={[
                                        { id: 'documents', label: 'Documents', icon: 'file-text' },
                                        { id: 'payment', label: 'Payment', icon: 'credit-card' },
                                    ]}
                                    activeTab={activeTab}
                                    onTabSelect={(id) => setActiveTab(id as 'documents' | 'payment')}
                                />
                            </View>

                            <View
                                ref={contentRef}
                                collapsable={false}
                                onLayout={() => {
                                    if (isTutorialMeasurementActive()) measureContentNow();
                                }}
                            >
                                {activeTab === 'documents' && (
                                <DocumentTab
                                    booking={booking}
                                    docStates={docStates}
                                    setDocStates={(newStates: DocState[]) => {
                                        setDocStates(newStates);
                                        const hasAnyRejected = newStates.some(d => d.valid === 'rejected');
                                        if (!hasAnyRejected && !isRejectingBooking) {
                                            setRejectionReason('');
                                        }
                                        if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                    }}
                                    viewedDocs={viewedDocs}
                                    isReviewComplete={isReviewComplete}
                                    isRejectedStatus={isRejectedStatus}
                                    isCancelledStatus={isCancelledStatus}
                                    isCancellationPending={isHikerCancellationPending}
                                    hasRejections={hasRejections}
                                    showRejectionReason={isRejecting}
                                    rejectionReason={rejectionReason}
                                    setRejectionReason={handleRejectionReasonChange}
                                    suggestions={dynamicSuggestions}
                                    onAttachmentRequired={() => {
                                        showToast.error(REVIEW_TOASTS.ATTACHMENT_REQUIRED);
                                    }}
                                    onInteraction={() => {
                                        if (hasAttemptedSubmit) setHasAttemptedSubmit(false);
                                    }}
                                    onViewFile={handleViewFile}
                                    firstCardRef={firstCardRef}
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
                                    onVerifyManualPayment={onVerifyManualPayment ? async (classification, note, verifiedAmount) => {
                                        setIsProcessingAction(true);
                                        try {
                                            await onVerifyManualPayment(classification, note, booking, verifiedAmount);
                                            if (classification === 'downpayment') {
                                                showToast.success('Downpayment verified and balance updated!');
                                            }
                                            // Complete payment toast removed per requirements
                                        } catch (err: unknown) {
                                            showToast.error(err instanceof Error ? err.message : 'Failed to verify payment');
                                        } finally {
                                            setIsProcessingAction(false);
                                        }
                                    } : undefined}
                                    onRejectManualPayment={onRejectManualPayment ? async (reason) => {
                                        setIsProcessingAction(true);
                                        try {
                                            await onRejectManualPayment(reason, booking);
                                            showToast.success('Payment receipt rejected. Hiker notified.');
                                        } catch (err: unknown) {
                                            showToast.error(err instanceof Error ? err.message : 'Failed to reject payment');
                                        } finally {
                                            setIsProcessingAction(false);
                                        }
                                    } : undefined}
                                    onSettleRemainingBalance={onSettleRemainingBalance ? async (options) => {
                                        setIsProcessingAction(true);
                                        try {
                                            await onSettleRemainingBalance(booking, options);
                                            // Complete payment toast removed per requirements
                                        } catch (err: unknown) {
                                            showToast.error(err instanceof Error ? err.message : 'Failed to settle balance');
                                        } finally {
                                            setIsProcessingAction(false);
                                        }
                                    } : undefined}
                                    onUploadOverpaymentProof={onUploadOverpaymentProof ? async (file) => {
                                        setIsProcessingAction(true);
                                        try {
                                            await onUploadOverpaymentProof(file, booking);
                                        } finally {
                                            setIsProcessingAction(false);
                                        }
                                    } : undefined}
                                    isProcessing={isProcessingAction}
                                />
                            )}
                            </View>

                            {!isWide && (
                                <ActivityLog booking={booking} cancellation={cancellationRequest} currentStatus={currentStatus} />
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {isHikerCancellationPending ? (
                <CustomStickyFooter
                    enableToastDock={true}
                    primaryButton={cancellationPrimaryConfig}
                    secondaryButton={cancellationSecondaryConfig}
                />
            ) : (activeTab === 'documents' && (!isReviewComplete || isTutorialFooterPreview)) ? (
                <CustomStickyFooter
                    enableToastDock={true}
                    primaryButton={primaryButtonConfig}
                    secondaryButton={secondaryButtonConfig}
                />
            ) : (activeTab === 'payment' && (isPaymentActionable || isTutorialFooterPreview)) ? (
                <CustomStickyFooter
                    enableToastDock={true}
                    primaryButton={paymentPrimaryConfig}
                />
            ) : null}

            {isConfirmVisible && (
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
            )}

            {isConfirmPaymentVisible && (
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
                    iconName="check-circle"
                />
            )}

            {showCancelUnpaidModal && (
                <AdminCancelBookingModal
                    visible={showCancelUnpaidModal}
                    onClose={() => setShowCancelUnpaidModal(false)}
                    isSubmitting={isProcessingAction}
                    booking={booking}
                    onConfirm={async (selectedReason: string, refundType: 'full' | 'partial' | 'none', refundAmount: number) => {
                        setShowCancelUnpaidModal(false);
                        if (onAdminCancelBooking) {
                            setIsProcessingAction(true);
                            try {
                                await onAdminCancelBooking(booking, selectedReason, refundType, refundAmount);
                                showToast.success(REVIEW_TOASTS.ORGANIZER_CANCELLED);
                            } catch (err: unknown) {
                                showToast.error(err instanceof Error ? err.message : "Failed to cancel booking");
                            } finally {
                                setIsProcessingAction(false);
                            }
                        } else if (onCancelUnpaid) {
                            setIsProcessingAction(true);
                            try {
                                await onCancelUnpaid(booking);
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }}
                />
            )}

            {isConfirmCancellationVisible && (
                <ConfirmationModal
                    visible={isConfirmCancellationVisible}
                    onClose={() => setIsConfirmCancellationVisible(false)}
                    onConfirm={async () => {
                        setIsConfirmCancellationVisible(false);
                        if (onApproveCancellation) {
                            setIsProcessingAction(true);
                            try {
                                await onApproveCancellation(cancellationRequest, booking);
                                showToast.success(REVIEW_TOASTS.CANCELLATION_APPROVED);
                            } catch (err: unknown) {
                                showToast.error(err instanceof Error ? err.message : 'Failed to approve cancellation.');
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }}
                    title={REVIEW_MODALS.APPROVE_CANCELLATION.title}
                    message={REVIEW_MODALS.APPROVE_CANCELLATION.message(totalAmountPaid > 0, totalAmountPaid)}
                    confirmText={REVIEW_MODALS.APPROVE_CANCELLATION.confirmText}
                    cancelText={REVIEW_MODALS.APPROVE_CANCELLATION.cancelText}
                    iconName="alert-triangle"
                    isDestructive={true}
                />
            )}

            {isConfirmDeclineVisible && (
                <ConfirmationModal
                    visible={isConfirmDeclineVisible}
                    onClose={() => setIsConfirmDeclineVisible(false)}
                    onConfirm={async () => {
                        setIsConfirmDeclineVisible(false);
                        if (onDeclineCancellation) {
                            setIsProcessingAction(true);
                            try {
                                await onDeclineCancellation(cancellationDeclineReason, cancellationRequest, booking);
                                setIsDecliningCancellation(false);
                                setCancellationDeclineReason('');
                                showToast.success(REVIEW_TOASTS.CANCELLATION_DECLINED);
                            } catch (err: unknown) {
                                showToast.error(err instanceof Error ? err.message : 'Failed to decline cancellation.');
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }}
                    title={REVIEW_MODALS.DECLINE_CANCELLATION.title}
                    message={REVIEW_MODALS.DECLINE_CANCELLATION.message}
                    confirmText={REVIEW_MODALS.DECLINE_CANCELLATION.confirmText}
                    cancelText={REVIEW_MODALS.DECLINE_CANCELLATION.cancelText}
                    iconName="alert-triangle"
                    isDestructive={true}
                />
            )}

            {isConfirmRevertVisible && (
                <ConfirmationModal
                    visible={isConfirmRevertVisible}
                    onClose={() => setIsConfirmRevertVisible(false)}
                    onConfirm={async () => {
                        setIsConfirmRevertVisible(false);
                        if (onRevertCancellation) {
                            setIsProcessingAction(true);
                            try {
                                await onRevertCancellation(cancellationRequest);
                                showToast.success(REVIEW_TOASTS.CANCELLATION_REVERTED);
                            } catch (err: unknown) {
                                showToast.error(err instanceof Error ? err.message : 'Failed to revert cancellation.');
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }}
                    title={REVIEW_MODALS.REVERT_CANCELLATION.title}
                    message={REVIEW_MODALS.REVERT_CANCELLATION.message}
                    confirmText={REVIEW_MODALS.REVERT_CANCELLATION.confirmText}
                    cancelText={REVIEW_MODALS.REVERT_CANCELLATION.cancelText}
                    iconName="alert-triangle"
                    isDestructive={false}
                />
            )}

            {showRescheduleModal && (
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
            )}

            {showRefundModal && (
                <AdminRefundModal
                    visible={showRefundModal}
                    initialType={refundModalInitialType}
                    amountPaid={totalAmountPaid}
                    paymentCapturedAt={paymentCapturedAt}
                    isCancellationFlow={Boolean(cancellationRequest) || isCancellationPending || isCancelledStatus || isHikerCancellationPending || isAdminCancellationPending}
                    onClose={() => setShowRefundModal(false)}
                    onSelect={(refundType: RefundType, customAmount?: number, adminNote?: string) => {
                        setShowRefundModal(false);
                        setTimeout(async () => {
                            setIsProcessingAction(true);
                            try {
                                const isCancellationFlow = Boolean(cancellationRequest) || isCancellationPending || isCancelledStatus || isHikerCancellationPending || isAdminCancellationPending;
                                const isManualProvider = PAYMENT_CONFIG.PROVIDER === 'manual_qr';

                                if (isCancellationFlow) {
                                    if (refundType === 'none') {
                                        if (onApproveCancellation) {
                                            await onApproveCancellation(cancellationRequest, booking, 'none', 0, adminNote);
                                            showToast.success('Cancellation approved and slot released without refund.');
                                        }
                                    } else if (isManualProvider && onApproveWithManualRefund) {
                                        const resolvedAmount = refundType === 'custom'
                                            ? (customAmount || totalAmountPaid)
                                            : (refundType === 'partial' ? Math.round(totalAmountPaid * 0.10 * 100) / 100 : totalAmountPaid);
                                        await onApproveWithManualRefund(resolvedAmount, cancellationRequest, booking);
                                        const hasWalletUpfront = Boolean(cancellationRequest?.userWallet?.accountNumber);
                                        showToast.success(
                                            hasWalletUpfront
                                                ? `Cancellation approved. Refund of ₱${resolvedAmount.toFixed(2)} set. Ready for payout.`
                                                : `Cancellation approved. Refund of ₱${resolvedAmount.toFixed(2)} set. Awaiting hiker wallet.`
                                        );
                                    } else if (onApproveCancellation) {
                                        await onApproveCancellation(cancellationRequest, booking, refundType, customAmount, adminNote);
                                        showToast.success('Cancellation approved and refund processed successfully.');
                                    }
                                } else if (refundType === 'none') {
                                    showToast.error('Policy forfeiture without refund is only applicable when cancelling a booking.');
                                } else if (isManualProvider) {
                                    showToast.info('Direct refund outside cancellation is not supported for manual payments. Please issue via cancellation.');
                                } else if (onRefund) {
                                    await onRefund(booking, refundType, customAmount);
                                    showToast.success('Refund processed successfully.');
                                }
                            } catch (err: unknown) {
                                    const rawMessage = err instanceof Error ? err.message : String(err || '');
                                    let displayMessage = 'Failed to process refund. Please try again.';

                                    if (rawMessage.includes('Cannot partially refund') || rawMessage.includes('same day')) {
                                        displayMessage = 'Payment Policy: Partial refunds cannot be processed on the same calendar day for gateway payments.';
                                    } else if (rawMessage.includes('Insufficient') || rawMessage.includes('balance')) {
                                        displayMessage = 'Your account has insufficient merchant balance to cover this refund.';
                                    } else if (rawMessage) {
                                        displayMessage = rawMessage.replace('Payment Gateway Error: ', '').replace('PayMongo API Error: ', '');
                                    }

                                    showToast.error(displayMessage);
                                } finally {
                                    setIsProcessingAction(false);
                                }
                            }, 300);
                        }}
                    />
            )}

            {Boolean(previewImageUrl) && (
                <ImagePreviewModal
                    visible={!!previewImageUrl}
                    imageUrl={previewImageUrl || undefined}
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}

            {showActionMenu && (
                <AdminActionMenu
                    visible={showActionMenu}
                    onClose={() => setShowActionMenu(false)}
                    isCancelledStatus={isCancelledStatus}
                    isFinishedStatus={currentStatus === 'finished' || currentStatus === 'expired'}
                    totalAmountPaid={totalAmountPaid}
                    totalRefundedAmount={totalRefundedAmount}
                    remainingRefundableAmount={remainingRefundableAmount}
                    isOfferFinished={isOfferFinished}
                    hasPendingCancellation={isCancellationPending}
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
            )}

            <CustomTutorialModal
                visible={tutorial.isVisible}
                tourConfig={tutorial.tourConfig}
                currentStep={tutorial.currentStep}
                currentStepIndex={tutorial.currentStepIndex}
                totalSteps={tutorial.totalSteps}
                onNext={tutorial.onNextStep}
                onPrev={tutorial.onPrevStep}
                onSkip={tutorial.onSkipTour}
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
        paddingHorizontal: 16,
        paddingBottom: 120,
        paddingTop: 8
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
    cancellationReasonBox: {
        marginBottom: 20
    },
    cancellationPendingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_BORDER,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    cancellationPendingText: {
        color: Colors.ERROR,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 64,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 8,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 18,
    },
    backButton: {
        marginTop: 16,
        minWidth: 200,
        borderRadius: 12,
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

export default ReviewScreen;
