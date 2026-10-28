/**
 * @file BookingDetailsScreen.tsx
 * @description Comprehensive details screen for a user's booking, handling rejected document re-uploads, payment triggers, reschedule, and cancellation.
 */

import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import { useToast } from '@/src/components/Toast/Toast';
import {
    CustomTutorialModal,
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    TutorialHelpButton,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';
import EmergencySetupModal, { UserSearchResult } from '@/src/components/EmergencyModal';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { Booking, BookingStatus, Requirements, useBookingsStore } from "@/src/core/models/Booking/Booking";
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { IOffer } from "@/src/core/models/Offer/Offer";
import { IEmergencyContact, User } from '@/src/core/models/User/User';
import { logger } from '@/src/core/utility/errorFormatter';

import { formatBookingDate } from '@/src/utils/dateFormatter';
import { RescheduleRepo } from '@/src/core/models/Reschedule/repositories/RescheduleRepository';
import { Cancellation, IUserWalletDetails } from '@/src/core/models/Cancellation/Cancellation';
import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';
import BookingActionMenuModal from '@/src/features/Book/screens/MyBookings/components/BookingActionMenuModal';
import BookingStatusComponent from '@/src/features/Book/screens/MyBookings/components/BookingStatus';
import CancelBookingModal from '@/src/features/Book/screens/MyBookings/components/CancelBookingModal';
import CancellationCard from '@/src/features/Book/screens/MyBookings/components/CancellationCard';
import OverpaymentRefundCard from '@/src/features/Book/screens/MyBookings/components/OverpaymentRefundCard';
import HeroHeader from '@/src/features/Book/screens/MyBookings/components/HeroHeader';
import ItinerarySection from '@/src/features/Book/screens/MyBookings/components/ItinerarySection';
import PaymentSummaryCard from '@/src/features/Book/screens/MyBookings/components/PaymentSummaryCard';
import PersonalInformationSection from '@/src/features/Book/screens/MyBookings/components/PersonalInformationSection';
import QuickInfoCard from '@/src/features/Book/screens/MyBookings/components/QuickInfoCard';
import RequiredDocumentsSection from '@/src/features/Book/screens/MyBookings/components/RequiredDocumentsSection';
import RescheduleModal from '@/src/features/Book/screens/MyBookings/components/RescheduleModal';
import { useBookingContactVerification } from '@/src/features/Book/screens/MyBookings/hooks/useBookingContactVerification';
import { useBookingResubmit } from '@/src/features/Book/screens/MyBookings/hooks/useBookingResubmit';
import { getResubmitModalContent, RESUBMIT_TOASTS } from '@/src/features/Book/screens/MyBookings/utils/bookingResubmitMessages';
import { getBookingFooterConfig } from '@/src/features/Book/screens/MyBookings/utils/getBookingFooterConfig';

export interface BookingDetailsScreenProps {
    /** The booking data */
    booking: Booking;
    /** Function to fetch full offer details */
    getBookOffer: (id: string) => Promise<IOffer | null>;
    /** Callback for back button press */
    onBackPress: () => void;
    /** Callback when user proceeds to payment */
    onProceedToPayment: (booking: Booking) => void;
    /** Callback for reschedule confirmation */
    onReschedule?: (booking: Booking, newOffer: IOffer, reason?: string) => Promise<void> | void;
    /** Callback to view receipt */
    onViewReceipt: (booking: Booking) => void;
    /** Callback for cancellation confirmation */
    onCancelConfirm: (booking: Booking, reason: string, userWallet?: IUserWalletDetails<Date>) => Promise<void> | void;
    /** Callback for refund confirmation */
    onRefundConfirm: (booking: Booking, reason: string, userWallet?: IUserWalletDetails<Date>) => Promise<void> | void;
    /** Callback when re-uploading all rejected documents and/or updating contacts on rejected bookings */
    onResubmitDocuments?: (
        booking: Booking,
        updatedDocs: Requirements[],
        updatedPhone?: string,
        updatedEmergency?: IEmergencyContact
    ) => Promise<boolean>;
    /** Callback when updating contact details on rejected bookings */
    onUpdateContacts?: (booking: Booking, phone: string, emergencyContact: IEmergencyContact) => Promise<boolean>;
    /** Available future offers for rescheduling */
    availableFutureOffers?: IOffer[];
    /** All user bookings to prevent presenting offers the user already booked */
    userBookings?: Booking[];
    /** Active cancellation associated with this booking, if any */
    cancellation?: Cancellation | null;
    /** Handler to withdraw an active cancellation request */
    onWithdrawCancellation?: (cancellation: Cancellation) => Promise<void> | void;
    /** Handler to appeal / update the cancellation reason */
    onUpdateCancellationReason?: (params: { reason: string; oldRequest: Cancellation }) => Promise<void> | void;
    /** Handler to accept an admin-initiated cancellation */
    onAcceptAdminCancellation?: (cancellation: Cancellation) => Promise<void> | void;
    /** The authenticated user profile passed from controller */
    currentUserProfile?: User | null;
    /** Callback to self-heal phone verification on profile */
    onSyncBookingVerification?: (booking: Booking) => Promise<void>;
    /** Async user search passed to emergency setup modal */
    onSearchUser?: (email: string) => Promise<UserSearchResult[]>;
}

/**
 * Screen component displaying the full details of a user's booking.
 * Handles document uploads, payments, rescheduling, and cancellation.
 * 
 * @param {BookingDetailsScreenProps} props - Component props
 */
const BookingDetailsScreen = ({
    booking,
    getBookOffer,
    onBackPress,
    onProceedToPayment,
    onReschedule,
    onViewReceipt,
    onCancelConfirm, onRefundConfirm,
    onResubmitDocuments, onUpdateContacts,
    currentUserProfile,
    onSyncBookingVerification,
    onSearchUser,
    availableFutureOffers = [],
    userBookings = [],
    cancellation,
    onWithdrawCancellation,
    onUpdateCancellationReason,
    onAcceptAdminCancellation,
}: BookingDetailsScreenProps): React.JSX.Element => {
    const { showToast } = useToast();
    const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
    const [showCancelDraftModal, setShowCancelDraftModal] = useState<boolean>(false);
    const [isCancelingDraft, setIsCancelingDraft] = useState<boolean>(false);
    const [activeCancelModal, setActiveCancelModal] = useState<'cancel' | 'refund' | 'update' | null>(null);
    const [modalInitialReason, setModalInitialReason] = useState<string>('');
    const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
    const [isSubmittingCancellation, setIsSubmittingCancellation] = useState<boolean>(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
    const [isDismissingDecline, setIsDismissingDecline] = useState<boolean>(false);
    const [isDeclineDismissedLocally, setIsDeclineDismissedLocally] = useState<boolean>(false);
    const isReschedulingRef = useRef<boolean>(false);

    const handleDismissDecline = async () => {
        if (!booking?.id || !booking?.user?.id) return;
        setIsDeclineDismissedLocally(true);
        setIsDismissingDecline(true);
        try {
            await RescheduleRepo.dismissRescheduleDecline(booking.user.id, booking.id);
            showToast.success('Reschedule notice dismissed.');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to dismiss notice';
            showToast.error(msg);
        } finally {
            setIsDismissingDecline(false);
        }
    };

    const storeUserBookings = useBookingsStore(s => s.userBookings);
    const effectiveBookings = storeUserBookings && storeUserBookings.length > 0 ? storeUserBookings : userBookings;

    // Filter available offers so users NEVER see or select offers they already booked,
    // nor the current offer, nor offers from other businesses, cancelled offers, or full capacity offers.
    const reschedulableOffers = useMemo(() => {
        const currentOfferId = booking.offer?.id;
        const currentBusinessId = booking.business?.id;

        // Collect all offer IDs for which the user currently has an active booking
        const activeBookedOfferIds = new Set<string>();
        for (const b of effectiveBookings) {
            if (!['cancelled', 'refunded', 'expired', 'rescheduled'].includes(b.status)) {
                const offId = b.offer?.id || (b as any).offerId;
                if (offId) activeBookedOfferIds.add(offId);
            }
        }
        // Also ensure current booking's offer is unconditionally excluded
        if (currentOfferId) {
            activeBookedOfferIds.add(currentOfferId);
        }

        return availableFutureOffers.filter(offer => {
            if (!offer.id) return false;
            // Exclude already booked offers
            if (activeBookedOfferIds.has(offer.id)) return false;

            // Strictly require matching the current booking's organizer/business
            const offerBusinessId = offer.business?.id || (offer as any).businessId;
            if (!currentBusinessId || !offerBusinessId || offerBusinessId !== currentBusinessId) return false;

            // Must be strictly in the future
            if (new Date(offer.date).getTime() <= Date.now()) return false;

            // Exclude cancelled offers
            if ((offer.status || '').toLowerCase() === 'cancelled') return false;
            // Exclude full offers
            if (offer.maxPax > 0 && offer.reservedPax >= offer.maxPax) return false;

            return true;
        });
    }, [availableFutureOffers, booking.offer?.id, booking.business?.id, effectiveBookings]);

    const [showContactsModal, setShowContactsModal] = useState<boolean>(false);

    const [fullOffer, setFullOffer] = useState<IOffer | null>(null);
    const [isLoadingOffer, setIsLoadingOffer] = useState<boolean>(true);
    
    const [localDocs, setLocalDocs] = useState<Requirements[]>(booking?.documents || []);
    const [localStatus, setLocalStatus] = useState<BookingStatus | undefined>(booking?.status);

    const [localUserPhone, setLocalUserPhone] = useState<string>(booking?.user?.phoneNumber || '');
    const [localEmergencyContact, setLocalEmergencyContact] = useState<IEmergencyContact | undefined>(booking?.emergencyContact);
    const [hasStagedContactChanges, setHasStagedContactChanges] = useState<boolean>(false);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

    const [prevBooking, setPrevBooking] = useState(booking);
    if (booking !== prevBooking) {
        setPrevBooking(booking);
        setLocalDocs(booking?.documents || []);
        setLocalStatus(booking?.status);
        setLocalUserPhone(booking?.user?.phoneNumber || '');
        setLocalEmergencyContact(booking?.emergencyContact);
        setHasStagedContactChanges(false);
    }

    const [prevCancellation, setPrevCancellation] = useState<Cancellation | null | undefined>(cancellation);
    const [wasAdminCancellationLifted, setWasAdminCancellationLifted] = useState<boolean>(false);

    if (cancellation !== prevCancellation) {
        if (prevCancellation && prevCancellation.cancelledBy === 'admin' && !cancellation) {
            setWasAdminCancellationLifted(true);
        }
        setPrevCancellation(cancellation);
    }

    useEffect(() => {
        const fetchOfferDetails = async () => {
            const offerToUse = booking?.offer as unknown as IOffer;
            if (offerToUse && offerToUse.schedule && offerToUse.schedule.length > 0) {
                setFullOffer(offerToUse);
                setIsLoadingOffer(false);
                return;
            }

            if (booking?.offer?.id) {
                setIsLoadingOffer(true);
                try {
                    const fetchedData = await getBookOffer(booking.offer.id);
                    setFullOffer(fetchedData);
                } catch (error) {
                    logger('BookingDetailsScreen', 'Failed to load offer details', error);
                } finally {
                    setIsLoadingOffer(false);
                }
            } else {
                setIsLoadingOffer(false);
            }
        };

        fetchOfferDetails();
    }, [booking?.offer, getBookOffer]);

    const totalAmount = booking?.offer?.price || 0;
    const payments = booking?.payment || [];
    const amountPaid = payments.reduce((sum, p) => {
        if (p.status === 'captured' || p.status === 'refunded' || ((p.refundedAmount || 0) > 0)) {
            return sum + (p.amount || 0);
        }
        return sum;
    }, 0) || 0;

    const isAdminCancelled =
        cancellation?.cancelledBy === 'admin' ||
        (localStatus === 'cancelled' && booking?.cancelledBy === 'admin');

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
        (localStatus === 'refunded' ||
         cancellation?.status === 'refund_completed' ||
         cancellation?.handshakeStep === 'completed' ||
         (isPayMongo && (isAllRefunded || hasRefundedPayment)));

    let displayStatus: BookingStatus | undefined = localStatus;

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
            } else if (isManualRefundPending && (hasCapturedPayments || cancellation?.refundAmount)) {
                displayStatus = 'refund';
            } else {
                displayStatus = 'cancelled';
            }
        }
    } else if (
        cancellation?.status === 'rejected' &&
        localStatus !== 'cancelled' &&
        localStatus !== 'refund' &&
        localStatus !== 'refunded'
    ) {
        displayStatus = localStatus;
    }

    if (!isNoRefund && (displayStatus === 'cancelled' || displayStatus === 'for-cancellation' || displayStatus === 'refund')) {
        if (isRefundComplete) {
            displayStatus = 'refunded';
        }
    }

    // Ensure cancelled or refunded bookings do not display a false remaining balance
    const isInactiveBooking = displayStatus === 'cancelled' || displayStatus === 'refunded' || localStatus === 'cancelled' || localStatus === 'refunded';
    const remainingBalance = isInactiveBooking ? 0 : Math.max(0, totalAmount - amountPaid);

    const isSpecialFlow =
        displayStatus === 'for-reschedule' ||
        displayStatus === 'rescheduled' ||
        displayStatus === 'reschedule-rejected' ||
        displayStatus === 'for-cancellation' ||
        displayStatus === 'cancellation-rejected' ||
        isInactiveBooking;

    const isCompletedOrFullyPaid = 
        displayStatus === 'completed' || 
        booking?.status === 'completed' || 
        booking?.paymentVerificationStatus === 'fully_paid' ||
        isSpecialFlow;

    const isPaymentVerifying = !isCompletedOrFullyPaid && (
        booking?.paymentVerificationStatus === 'pending_verification' ||
        Boolean(booking?.payment?.some(p => p.gateway === 'manual_qr' && p.status === 'pending'))
    );

    const isPaymentRejected = !isPaymentVerifying && (
        booking?.paymentVerificationStatus === 'rejected' ||
        (displayStatus === 'for-payment' && Boolean(booking?.payment?.length && booking.payment[booking.payment.length - 1].status === 'rejected'))
    );

    const user = booking?.user;

    const {
        userPhoneValidity,
        emergencyPhoneValidity,
        userExpiryText,
        emergencyExpiryText,
    } = useBookingContactVerification({
        booking,
        localUserPhone,
        localEmergencyContact,
        currentUserProfile,
        onSyncBookingVerification,
    });


    const hasPendingCancellation = cancellation?.status === 'pending';
    const isCancelled = [
        'for-cancellation',
        'cancellation-rejected',
        'refund',
        'refunded',
        'cancelled',
        'expired',
    ].includes(displayStatus || '') || hasPendingCancellation;

    const hasActiveCancellation = Boolean(cancellation) || hasPendingCancellation || isCancelled;

    const isConfirmed = ['paid', 'completed', 'downpayment'].includes(displayStatus || '');

    // Initial draft reservation or rejected documents can be cancelled directly without reason or admin review
    const isPreApprovalDraft = ['for-reservation', 'reservation-rejected'].includes(displayStatus || '');

    // Bookings requiring formal cancellation request to organizer with reason
    const canCancelBooking = [
        'for-payment',
        'approved-docs',
        'for-reschedule',
        'reschedule-rejected',
    ].includes(displayStatus || '') && !isCancelled && !hasActiveCancellation;

    const canCancelDraft = isPreApprovalDraft && !isCancelled && !hasActiveCancellation;
    const canRefund = isConfirmed && !isCancelled && !hasActiveCancellation;
    const canReschedule = (amountPaid > 0) &&
        displayStatus !== 'for-reschedule' &&
        displayStatus !== 'rescheduled' &&
        !isCancelled &&
        !isAdminCancelled &&
        !hasActiveCancellation;

    const showMenuIcon = canCancelDraft || canCancelBooking || canRefund || canReschedule;
    const hasHistoricalPayments = (booking?.payment?.length || 0) > 0;

    const inclusions = useMemo((): string[] => {
        const raw = fullOffer?.inclusions;
        if (!raw || !Array.isArray(raw)) return [];
        return raw
            .map((item: string) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
            .filter((item: string) => item.length > 0);
    }, [fullOffer?.inclusions]);

    const thingsToBring = useMemo((): string[] => {
        const raw = fullOffer?.thingsToBring;
        if (!raw || !Array.isArray(raw)) return [];
        return raw
            .map((item: string) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
            .filter((item: string) => item.length > 0);
    }, [fullOffer?.thingsToBring]);

    const reminders = useMemo((): string[] => {
        const raw = fullOffer?.reminders;
        if (!raw || !Array.isArray(raw)) return [];
        return raw
            .map((item: string) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
            .filter((item: string) => item.length > 0);
    }, [fullOffer?.reminders]);

    const schedule = fullOffer?.schedule || [];

    const enhancedBooking = {
        ...booking,
        status: displayStatus || booking.status,
        offer: {
            ...booking?.offer,
            duration: fullOffer?.duration || 'N/A',
            endDate: fullOffer?.endDate || booking?.offer?.date
        },
        trail: {
            ...booking?.trail,
            location: booking?.trail?.location || 'N/A'
        }
    };

    const {
        stagedReplacements, setStagedReplacements,
        isSubmittingDocs,
        confirmResubmitModalVisible, setConfirmResubmitModalVisible,
        hasAttemptedSubmit, setHasAttemptedSubmit,
        originalRejectedIndices,
        totalRejectedCount,
        stagedCount,
        isPhoneRejection,
        isRejectedReservation,
        contactReady,
        canResubmitAll,
        handleExecuteResubmit,
        handleResubmitPress,
    } = useBookingResubmit({
        booking,
        localDocs,
        localUserPhone,
        localEmergencyContact,
        onResubmitDocuments,
        setLocalDocs,
        setLocalStatus,
        setHasStagedContactChanges,
        displayStatus,
        isCancelled,
        hasStagedContactChanges,
    });

    const resubmitModalContent = getResubmitModalContent(
        totalRejectedCount,
        hasStagedContactChanges || isPhoneRejection
    );

    const footerConfig = getBookingFooterConfig({
        booking,
        displayStatus,
        isRejectedReservation,
        totalRejectedCount,
        isPhoneRejection,
        hasStagedContactChanges,
        isSubmittingDocs,
        canResubmitAll,
        stagedCount,
        contactReady,
        hasAttemptedSubmit,
        isConfirmed,
        isCancelled,
        hasHistoricalPayments,
        handleResubmitPress,
        onProceedToPayment,
        onViewReceipt,
    });

    const tutorial = useTutorialGuide('my_booking_details', !isLoadingOffer);
    const activeTutorialStep = tutorial.isVisible ? tutorial.currentStep?.targetSpotlight : undefined;

    const scrollViewRef = useRef<ScrollView>(null);
    const quickInfoRef = useRef<View>(null);
    const statusTrackerRef = useRef<View>(null);
    const documentsRef = useRef<View>(null);
    const accordionsRef = useRef<View>(null);
    const paymentSummaryRef = useRef<View>(null);

    const statusOffsetY = useRef<number>(0);
    const documentsOffsetY = useRef<number>(0);
    const accordionsOffsetY = useRef<number>(0);
    const paymentSummaryOffsetY = useRef<number>(0);

    const measureQuickInfoNow = useCallback(() => {
        quickInfoRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 16) {
                registerTutorialLayout('my_booking_quick_info', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 16,
                });
            }
        });
    }, []);

    const measureStatusTrackerNow = useCallback(() => {
        statusTrackerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 16) {
                registerTutorialLayout('my_booking_status_tracker', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 16,
                });
            }
        });
    }, []);

    const measureDocumentsNow = useCallback(() => {
        documentsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 12) {
                registerTutorialLayout('my_booking_documents', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 12,
                });
            }
        });
    }, []);

    const measureAccordionsNow = useCallback(() => {
        accordionsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 12) {
                registerTutorialLayout('my_booking_accordions', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 12,
                });
            }
        });
    }, []);

    const measurePaymentSummaryNow = useCallback(() => {
        paymentSummaryRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 40 && height > 16) {
                registerTutorialLayout('my_booking_payment_summary', {
                    x: x + 20,
                    y,
                    width: width - 40,
                    height: height - 16,
                });
            }
        });
    }, []);

    useEffect(() => {
        const unsubQuick = registerMeasureCallback('my_booking_quick_info', measureQuickInfoNow);
        const unsubStatus = registerMeasureCallback('my_booking_status_tracker', measureStatusTrackerNow);
        const unsubDocs = registerMeasureCallback('my_booking_documents', measureDocumentsNow);
        const unsubAcc = registerMeasureCallback('my_booking_accordions', measureAccordionsNow);
        const unsubPay = registerMeasureCallback('my_booking_payment_summary', measurePaymentSummaryNow);
        return () => {
            unsubQuick();
            unsubStatus();
            unsubDocs();
            unsubAcc();
            unsubPay();
        };
    }, [
        measureQuickInfoNow,
        measureStatusTrackerNow,
        measureDocumentsNow,
        measureAccordionsNow,
        measurePaymentSummaryNow,
    ]);

    useEffect(() => {
        if (!tutorial.isVisible) return;

        if (activeTutorialStep === 'my_booking_quick_info' || activeTutorialStep === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            const timer = setTimeout(measureQuickInfoNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_status_tracker') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, statusOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measureStatusTrackerNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_documents') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, documentsOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measureDocumentsNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_accordions') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, accordionsOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measureAccordionsNow, 260);
            return () => clearTimeout(timer);
        } else if (activeTutorialStep === 'my_booking_payment_summary') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, paymentSummaryOffsetY.current - 24),
                animated: true,
            });
            const timer = setTimeout(measurePaymentSummaryNow, 260);
            return () => clearTimeout(timer);
        }
    }, [
        tutorial.isVisible,
        activeTutorialStep,
        measureQuickInfoNow,
        measureStatusTrackerNow,
        measureDocumentsNow,
        measureAccordionsNow,
        measurePaymentSummaryNow,
    ]);

    const prevTutorialVisible = useRef(tutorial.isVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !tutorial.isVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = tutorial.isVisible;
    }, [tutorial.isVisible]);

    if (isLoadingOffer) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Booking Details" centerTitle={true} onBackPress={onBackPress} />
                <CustomLoading
                    visible={true}
                    message="Loading itinerary..."
                />
        </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Booking Details"
                centerTitle={true}
                onBackPress={onBackPress}
                rightActions={
                    <View style={styles.headerActionsRow}><TutorialHelpButton onPress={tutorial.onReplayTour} />{showMenuIcon ? (
                        <TouchableOpacity style={styles.headerOptionsBtn} onPress={() => setShowActionMenu(true)} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    ) : null}</View>
                }
            />

            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                <View style={styles.constrainer}>

                    <HeroHeader booking={enhancedBooking} />

                    <View
                        ref={quickInfoRef}
                        onLayout={() => {
                            if (isTutorialMeasurementActive()) {
                                measureQuickInfoNow();
                            }
                        }}
                    >
                        <QuickInfoCard booking={enhancedBooking} />
                    </View>

                    <View
                        ref={statusTrackerRef}
                        onLayout={(e) => {
                            statusOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) {
                                measureStatusTrackerNow();
                            }
                        }}
                    >

                    <BookingStatusComponent
                        status={displayStatus}
                        isPaid={hasHistoricalPayments}
                        isPaymentRejected={isPaymentRejected}
                        isPaymentVerifying={isPaymentVerifying}
                    />

                    {isPaymentVerifying && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={styles.paymentPendingBanner}>
                                <View style={styles.paymentPendingHeader}>
                                    <View style={styles.paymentPendingIconCircle}>
                                        <CustomIcon library="Feather" name="clock" size={18} color={Colors.SUCCESS} />
                                    </View>
                                    <View style={styles.paymentPendingTitleContainer}>
                                        <CustomText style={styles.paymentPendingTitle}>
                                            Payment Verification in Progress
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.paymentPendingSubtitle}>
                                            Your payment receipt has been submitted and is currently being verified by the organizer. You will be notified once it is approved.
                                        </CustomText>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {isPaymentRejected && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={styles.paymentRejectionBanner}>
                                <View style={styles.paymentRejectionHeader}>
                                    <View style={styles.paymentRejectionIconCircle}>
                                        <CustomIcon library="Feather" name="alert-triangle" size={18} color={Colors.ERROR} />
                                    </View>
                                    <View style={styles.paymentRejectionTitleContainer}>
                                        <CustomText style={styles.paymentRejectionTitle}>
                                            Payment Verification Rejected
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.paymentRejectionSubtitle}>
                                            Your payment receipt could not be verified by the organizer.
                                        </CustomText>
                                    </View>
                                </View>
                                {booking?.paymentRejectionReason ? (
                                    <View style={styles.paymentRejectionReasonBox}>
                                        <CustomText variant="caption" style={styles.paymentRejectionReasonLabel}>
                                            Organizer Feedback:
                                        </CustomText>
                                        <CustomText style={styles.paymentRejectionReasonText}>
                                            {`"${booking.paymentRejectionReason}"`}
                                        </CustomText>
                                    </View>
                                ) : null}
                                <CustomText variant="caption" style={styles.paymentRejectionHintText}>
                                    Please review the feedback above and resubmit your payment and valid receipt to confirm your reservation.
                                </CustomText>
                            </View>
                        </View>
                    )}

                    {wasAdminCancellationLifted && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={styles.revertNoticeBanner}>
                                <CustomIcon library="Feather" name="info" size={18} color={Colors.PRIMARY} />
                                <View style={styles.revertNoticeContent}>
                                    <CustomText style={styles.revertNoticeTitle}>
                                        Cancellation Lifted by Organizer
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.revertNoticeText}>
                                        The organizer has withdrawn the cancellation notice. Your reservation is active and proceeding normally.
                                    </CustomText>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setWasAdminCancellationLifted(false)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <CustomIcon library="Feather" name="x" size={16} color={Colors.TEXT_SECONDARY} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Overpayment Refund Card (Case A: Excess Payment Without Cancelling Booking) */}
                    {booking?.overpayment && (
                        <View style={styles.paddingHorizontal}>
                            <OverpaymentRefundCard
                                booking={booking}
                                onRefresh={async () => {
                                    if (onSyncBookingVerification) {
                                        await onSyncBookingVerification(booking);
                                    }
                                }}
                            />
                        </View>
                    )}

                    <CancellationCard
                        booking={{
                            ...booking,
                            status: displayStatus || booking.status,
                        }}
                        cancellation={cancellation}
                        onWithdraw={async (item) => {
                            if (onWithdrawCancellation) {
                                try {
                                    await onWithdrawCancellation(item);
                                    showToast.success('Cancellation request withdrawn successfully.');
                                } catch (err: unknown) {
                                    showToast.error(err instanceof Error ? err.message : 'Failed to withdraw cancellation request.');
                                }
                            }
                        }}
                        onAppeal={(cancellationItem) => {
                            setModalInitialReason(cancellationItem.reason || '');
                            setModalErrorMessage(null);
                            setActiveCancelModal('update');
                        }}
                        onAcceptAdminCancellation={async (item) => {
                            if (onAcceptAdminCancellation) {
                                try {
                                    await onAcceptAdminCancellation(item);
                                    showToast.success('Cancellation confirmed successfully.');
                                } catch (err: unknown) {
                                    showToast.error(err instanceof Error ? err.message : 'Failed to confirm cancellation.');
                                }
                            }
                        }}
                        onReschedule={() => setShowRescheduleModal(true)}
                    />

                    {displayStatus === 'for-reservation' && (!cancellation || cancellation.status === 'rejected') && !isAdminCancelled && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={styles.infoBanner}>
                                <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                                <CustomText variant="caption" style={styles.infoBannerText}>
                                    Verification usually takes 1–2 business days. You will receive a notification once you are cleared to proceed to payment.
                                </CustomText>
                            </View>
                        </View>
                    )}

                    {displayStatus === 'for-reschedule' && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={[styles.infoBanner, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                <CustomIcon library="Feather" name="calendar" size={20} color="#0284C7" />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <CustomText variant="body" style={{ fontWeight: '600', color: '#0369A1' }}>
                                        Reschedule Request Pending
                                    </CustomText>
                                    <CustomText variant="caption" style={{ color: '#0284C7', marginTop: 2 }}>
                                        Your request to reschedule this hike has been submitted and is currently being reviewed by the organizer.
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    )}

                    {displayStatus === 'rescheduled' && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={[styles.infoBanner, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                <CustomIcon library="Feather" name="check-circle" size={20} color="#059669" />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <CustomText variant="body" style={{ fontWeight: '600', color: '#065F46' }}>
                                        Booking Rescheduled
                                    </CustomText>
                                    <CustomText variant="caption" style={{ color: '#047857', marginTop: 2 }}>
                                        This booking was moved to a new hike schedule. Please view your My Bookings list for your updated booking.
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    )}

                    {!isDeclineDismissedLocally && Boolean(booking?.rescheduleDeclineReason) && displayStatus !== 'for-reschedule' && (
                        <View style={[styles.paddingHorizontal, styles.spacingBottom]}>
                            <View style={[styles.infoBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                                <CustomIcon library="Feather" name="calendar" size={20} color={Colors.ERROR} />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <CustomText variant="body" style={{ fontWeight: '600', color: '#991B1B' }}>
                                            Reschedule Request
                                        </CustomText>
                                        <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' }}>
                                            <CustomText style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>DECLINED</CustomText>
                                        </View>
                                    </View>
                                    <CustomText variant="caption" style={{ color: '#B91C1C', marginTop: 2, lineHeight: 18 }}>
                                        {`Organizer's note: "${booking.rescheduleDeclineReason}". `}
                                        Your booking remains confirmed for your original hike schedule on {formatBookingDate(booking?.offer?.date, null, true)}.
                                    </CustomText>
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: Colors.PRIMARY,
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 6,
                                            }}
                                            onPress={() => setShowRescheduleModal(true)}
                                        >
                                            <CustomText variant="caption" style={{ color: '#FFF', fontWeight: 'bold' }}>
                                                Request Another Date
                                            </CustomText>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#FFF',
                                                borderWidth: 1,
                                                borderColor: '#CBD5E1',
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 6,
                                            }}
                                            disabled={isDismissingDecline}
                                            onPress={handleDismissDecline}
                                        >
                                            <CustomText variant="caption" style={{ color: Colors.TEXT_PRIMARY, fontWeight: '600' }}>
                                                {isDismissingDecline ? 'Dismissing...' : 'Dismiss'}
                                            </CustomText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    </View>

                    <View
                        ref={documentsRef}
                        onLayout={(e) => {
                            documentsOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) {
                                measureDocumentsNow();
                            }
                        }}
                    >
                    <RequiredDocumentsSection
                        localDocs={localDocs}
                        originalRejectedIndices={originalRejectedIndices}
                        stagedReplacements={stagedReplacements}
                        displayStatus={displayStatus}
                        isCancelled={isCancelled}
                        rejectionReason={booking.cancellationReason}
                        onUploadSuccess={(idx, url, docName) => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setStagedReplacements(prev => ({
                                ...prev,
                                [idx]: url,
                            }));
                            setLocalDocs(prevDocs =>
                                prevDocs.map((doc, i) => {
                                    if (i === idx) {
                                        return {
                                            name: doc.name || docName,
                                            file: url,
                                            valid: 'pending' as const,
                                        };
                                    }
                                    return doc;
                                })
                            );
                            setHasAttemptedSubmit(false);
                        }}
                        onPreviewDoc={(url) => setPreviewDocUrl(url || null)}
                    />

                    </View>

                    <View
                        ref={accordionsRef}
                        onLayout={(e) => {
                            accordionsOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) {
                                measureAccordionsNow();
                            }
                        }}
                    >
                    {(user || localEmergencyContact) && (
                        <PersonalInformationSection
                            user={user}
                            localUserPhone={localUserPhone}
                            localEmergencyContact={localEmergencyContact}
                            userPhoneValidity={userPhoneValidity}
                            emergencyPhoneValidity={emergencyPhoneValidity}
                            userExpiryText={userExpiryText}
                            emergencyExpiryText={emergencyExpiryText}
                            displayStatus={displayStatus}
                            isCancelled={isCancelled}
                            onEditContactsPress={() => setShowContactsModal(true)}
                        />
                    )}

                    {inclusions.length > 0 && (
                        <AccordionItem title="Inclusions" icon="archive" defaultOpen={false}>
                            {inclusions.map((item: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.tinyDot} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    {thingsToBring.length > 0 && (
                        <AccordionItem title="Things to Bring" icon="briefcase" defaultOpen={isConfirmed}>
                            {thingsToBring.map((item: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.tinyDot} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    <ItinerarySection schedule={schedule} isConfirmed={isConfirmed} />

                    {reminders.length > 0 && (
                        <AccordionItem title="Important Reminders" icon="alert-circle" defaultOpen={!isCancelled}>
                            {reminders.map((item: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.tinyDot} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    </View>

                    <View style={styles.spacing} />

                    <View
                        ref={paymentSummaryRef}
                        onLayout={(e) => {
                            paymentSummaryOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) {
                                measurePaymentSummaryNow();
                            }
                        }}
                    >

                    <PaymentSummaryCard
                        totalAmount={totalAmount}
                        amountPaid={amountPaid}
                        remainingBalance={remainingBalance}
                        payments={booking?.payment || []}
                        refundedAmount={booking?.refundedAmount || cancellation?.refundAmount}
                    />

                </View>
                    </View>
            </ScrollView>

            {footerConfig && (
                <CustomStickyFooter
                    enableToastDock={true}
                    primaryButton={footerConfig.primaryButton}
                    secondaryButton={footerConfig.secondaryButton}
                />
            )}

            <CancelBookingModal
                visible={!!activeCancelModal}
                actionType={activeCancelModal}
                initialReason={modalInitialReason}
                previousReason={activeCancelModal === 'update' ? modalInitialReason : undefined}
                isSubmitting={isSubmittingCancellation}
                errorMessage={modalErrorMessage}
                isPaidBooking={['paid', 'downpayment', 'completed'].includes(booking.status) || (booking.payment || []).some(p => p.status === 'captured')}
                onClose={() => {
                    setActiveCancelModal(null);
                    setModalInitialReason('');
                    setModalErrorMessage(null);
                }}
                onConfirm={async (reason: string, userWallet?: IUserWalletDetails<Date>) => {
                    setIsSubmittingCancellation(true);
                    setModalErrorMessage(null);
                    try {
                        if (activeCancelModal === 'cancel') {
                            await onCancelConfirm(booking, reason, userWallet);
                            setActiveCancelModal(null);
                            showToast.success('Cancellation request submitted successfully.');
                        } else if (activeCancelModal === 'refund') {
                            await onRefundConfirm(booking, reason, userWallet);
                            setActiveCancelModal(null);
                            const isPaid = ['paid', 'downpayment'].includes(booking.status);
                            showToast.success(
                                isPaid
                                    ? 'Cancellation & refund request submitted successfully.'
                                    : 'Cancellation request submitted successfully.'
                            );
                        } else if (activeCancelModal === 'update' && cancellation && onUpdateCancellationReason) {
                            try {
                                await onUpdateCancellationReason({ reason, oldRequest: cancellation });
                                setActiveCancelModal(null);
                                showToast.success('Cancellation appeal submitted successfully.');
                            } catch (err: unknown) {
                                setActiveCancelModal(null);
                                showToast.error(err instanceof Error ? err.message : 'Failed to submit cancellation appeal.');
                            }
                        }
                    } catch (err: unknown) {
                        setModalErrorMessage(err instanceof Error ? err.message : 'An error occurred.');
                    } finally {
                        setIsSubmittingCancellation(false);
                    }
                }}
            />

            <RescheduleModal
                visible={showRescheduleModal}
                onClose={() => {
                    isReschedulingRef.current = false;
                    setShowRescheduleModal(false);
                }}
                availableFutureOffers={reschedulableOffers}
                onConfirm={(selectedOffer: IOffer | 'explore', reason?: string) => {
                    if (isReschedulingRef.current) return;
                    isReschedulingRef.current = true;
                    setShowRescheduleModal(false);
                    setTimeout(async () => {
                        try {
                            if (selectedOffer === 'explore') {
                                router.replace('/explore');
                            } else if (onReschedule && typeof selectedOffer === 'object') {
                                await onReschedule(booking, selectedOffer, reason);
                            }
                        } finally {
                            isReschedulingRef.current = false;
                        }
                    }, 300);
                }}
            />

            <EmergencySetupModal
                visible={showContactsModal}
                onClose={() => setShowContactsModal(false)}
                mode="unified"
                initialUserPhone={localUserPhone}
                initialEmergencyContact={localEmergencyContact}
                currentUserProfile={currentUserProfile}
                onSearchUser={onSearchUser}
                onSaveUnifiedContacts={async (data) => {
                    setShowContactsModal(false);
                    setLocalUserPhone(data.phone);
                    setLocalEmergencyContact(data.emergencyContact);

                    if (displayStatus === 'reservation-rejected') {
                        setHasStagedContactChanges(true);
                        showToast.success(RESUBMIT_TOASTS.STAGED_CONTACTS_SUCCESS);
                        return;
                    }

                    if (onUpdateContacts) {
                        const ok = await onUpdateContacts(booking, data.phone, data.emergencyContact);
                        if (ok) {
                            showToast.success('Contact details updated successfully.');
                        } else {
                            showToast.error('Failed to update contact details.');
                        }
                    }
                }}
            />

            <BookingActionMenuModal
                visible={showActionMenu}
                onClose={() => setShowActionMenu(false)}
                canReschedule={canReschedule}
                canCancelDraft={canCancelDraft}
                canCancelBooking={canCancelBooking}
                canRefund={canRefund}
                onReschedulePress={() => setShowRescheduleModal(true)}
                onCancelDraftPress={() => setShowCancelDraftModal(true)}
                onCancelBookingPress={() => setActiveCancelModal('cancel')}
                onRefundPress={() => setActiveCancelModal('refund')}
            />

            {/* Confirmation Modal for canceling pre-approval draft reservations */}
            <ConfirmationModal
                visible={showCancelDraftModal}
                onClose={() => !isCancelingDraft && setShowCancelDraftModal(false)}
                onConfirm={async () => {
                    setIsCancelingDraft(true);
                    try {
                        await onCancelConfirm(booking, '');
                        setShowCancelDraftModal(false);
                    } catch (err: unknown) {
                        setShowCancelDraftModal(false);
                        showToast.error(err instanceof Error ? err.message : 'Failed to cancel reservation.');
                    } finally {
                        setIsCancelingDraft(false);
                    }
                }}
                title="Cancel Reservation"
                message="Are you sure you want to cancel this reservation? Your booking will be deleted."
                confirmText="Yes, Cancel"
                cancelText="Keep Reservation"
                isDestructive={true}
                isLoading={isCancelingDraft}
                iconName="x-circle"
                iconColor={Colors.ERROR}
            />

            {/* Confirmation Modal before submitting documents / contact details */}
            <ConfirmationModal
                visible={confirmResubmitModalVisible}
                onClose={() => !isSubmittingDocs && setConfirmResubmitModalVisible(false)}
                onConfirm={handleExecuteResubmit}
                title={resubmitModalContent.title}
                message={resubmitModalContent.message}
                confirmText={resubmitModalContent.confirmText}
                cancelText={resubmitModalContent.cancelText}
                iconName={resubmitModalContent.iconName}
                iconLibrary={resubmitModalContent.iconLibrary}
                iconColor={resubmitModalContent.iconColor}
            />

            {/* Modal Image Preview for uploaded/approved documents */}
            <ImagePreviewModal
                visible={Boolean(previewDocUrl)}
                images={previewDocUrl ? [previewDocUrl] : []}
                onClose={() => setPreviewDocUrl(null)}
            />
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
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    scrollContent: {
        paddingBottom: 100
    },
    spacing: {
        height: 16
    },
    spacingBottom: {
        marginBottom: 16
    },
    paddingHorizontal: {
        paddingHorizontal: 20,
    },
    headerActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    headerOptionsBtn: {
        paddingHorizontal: 8
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 12
    },
    infoBannerText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20
    },
    revertNoticeBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.STATUS_PENDING_BG,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        gap: 12,
    },
    revertNoticeContent: {
        flex: 1,
        gap: 2,
    },
    revertNoticeTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: Colors.PRIMARY,
    },
    revertNoticeText: {
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        gap: 12
    },
    tinyDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.PRIMARY,
        marginTop: 8
    },
    bulletText: {
        flex: 1,
        lineHeight: 22
    },
    paymentRejectionBanner: {
        backgroundColor: Colors.ERROR_BG,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: Colors.ERROR_BORDER,
        gap: 12,
    },
    paymentRejectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    paymentRejectionIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    paymentRejectionTitleContainer: {
        flex: 1,
        gap: 2,
    },
    paymentRejectionTitle: {
        fontWeight: 'bold',
        fontSize: 15,
        color: Colors.ERROR,
    },
    paymentRejectionSubtitle: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    paymentRejectionReasonBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.ERROR,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 4,
    },
    paymentRejectionReasonLabel: {
        fontWeight: '600',
        color: Colors.ERROR,
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    paymentRejectionReasonText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    paymentRejectionHintText: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    paymentPendingBanner: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: Colors.SUCCESS,
        gap: 12,
    },
    paymentPendingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    paymentPendingIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.SUCCESS,
    },
    paymentPendingTitleContainer: {
        flex: 1,
        gap: 2,
    },
    paymentPendingTitle: {
        fontWeight: 'bold',
        fontSize: 15,
        color: Colors.SUCCESS,
    },
    paymentPendingSubtitle: {
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
});

export default BookingDetailsScreen;
