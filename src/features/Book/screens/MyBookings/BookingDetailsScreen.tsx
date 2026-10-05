/**
 * @file BookingDetailsScreen.tsx
 * @description Comprehensive details screen for a user's booking, handling rejected document re-uploads, payment triggers, reschedule, and cancellation.
 */

import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomToast from '@/src/components/CustomToast';
import EmergencySetupModal, { UserSearchResult } from '@/src/components/EmergencyModal';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { Booking, BookingStatus, Requirements } from "@/src/core/models/Booking/Booking";
import { IOffer } from "@/src/core/models/Offer/Offer";
import { IEmergencyContact, User } from '@/src/core/models/User/User';
import { logger } from '@/src/core/utility/errorFormatter';

import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';
import BookingActionMenuModal from '@/src/features/Book/screens/MyBookings/components/BookingActionMenuModal';
import BookingStatusComponent from '@/src/features/Book/screens/MyBookings/components/BookingStatus';
import CancelBookingModal from '@/src/features/Book/screens/MyBookings/components/CancelBookingModal';
import CancellationCard from '@/src/features/Book/screens/MyBookings/components/CancellationCard';
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
    onReschedule?: (booking: Booking, newOffer: IOffer) => Promise<void> | void;
    /** Callback to view receipt */
    onViewReceipt: (booking: Booking) => void;
    /** Callback for cancellation confirmation */
    onCancelConfirm: (booking: Booking, reason: string) => Promise<void> | void;
    /** Callback for refund confirmation */
    onRefundConfirm: (booking: Booking, reason: string) => Promise<void> | void;
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
    cancellation,
    onWithdrawCancellation,
    onUpdateCancellationReason,
    onAcceptAdminCancellation,
}: BookingDetailsScreenProps): React.JSX.Element => {
    const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
    const [showCancelDraftModal, setShowCancelDraftModal] = useState<boolean>(false);
    const [isCancelingDraft, setIsCancelingDraft] = useState<boolean>(false);
    const [activeCancelModal, setActiveCancelModal] = useState<'cancel' | 'refund' | 'update' | null>(null);
    const [modalInitialReason, setModalInitialReason] = useState<string>('');
    const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
    const [isSubmittingCancellation, setIsSubmittingCancellation] = useState<boolean>(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
    const isReschedulingRef = useRef<boolean>(false);
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
    const amountPaid = booking?.payment?.reduce((sum, p) => {
        if (p.status === 'captured') return sum + (p.amount || 0);
        return sum;
    }, 0) || 0;
    const remainingBalance = totalAmount - amountPaid;

    const isAdminCancelled =
        cancellation?.cancelledBy === 'admin' ||
        (localStatus === 'cancelled' && booking?.cancelledBy === 'admin');

    let displayStatus: BookingStatus | undefined = localStatus;

    if (cancellation?.status === 'pending') {
        displayStatus = 'for-cancellation';
    } else if (cancellation?.status === 'approved') {
        displayStatus = amountPaid > 0 ? 'refund' : 'cancelled';
    } else if (
        cancellation?.status === 'rejected' &&
        localStatus !== 'cancelled' &&
        localStatus !== 'refund' &&
        localStatus !== 'refunded'
    ) {
        displayStatus = localStatus;
    }

    if (displayStatus === 'cancelled' || displayStatus === 'for-cancellation') {
        const payments = booking?.payment || [];
        const hasRefund = payments.some(p => p.status === 'refunded');
        if (hasRefund) {
            displayStatus = 'refunded';
        }
    }

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
    const canReschedule = (amountPaid > 0 || displayStatus === 'for-reschedule') &&
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
        toastConfig, setToastConfig,
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
                    showMenuIcon ? (
                        <TouchableOpacity style={styles.headerOptionsBtn} onPress={() => setShowActionMenu(true)} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                <View style={styles.constrainer}>

                    <HeroHeader booking={enhancedBooking} />

                    <QuickInfoCard booking={enhancedBooking} />

                    <BookingStatusComponent
                        status={displayStatus}
                        isPaid={hasHistoricalPayments}
                    />

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
                                    setToastConfig({
                                        visible: true,
                                        message: 'Cancellation request withdrawn successfully.',
                                        type: 'success',
                                    });
                                } catch (err: unknown) {
                                    setToastConfig({
                                        visible: true,
                                        message: err instanceof Error ? err.message : 'Failed to withdraw cancellation request.',
                                        type: 'error',
                                    });
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
                                    setToastConfig({
                                        visible: true,
                                        message: 'Cancellation confirmed successfully.',
                                        type: 'success',
                                    });
                                } catch (err: unknown) {
                                    setToastConfig({
                                        visible: true,
                                        message: err instanceof Error ? err.message : 'Failed to confirm cancellation.',
                                        type: 'error',
                                    });
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

                    <RequiredDocumentsSection
                        localDocs={localDocs}
                        originalRejectedIndices={originalRejectedIndices}
                        stagedReplacements={stagedReplacements}
                        displayStatus={displayStatus}
                        isCancelled={isCancelled}
                        rejectionReason={booking.cancellationReason}
                        onUploadSuccess={(idx, url, docName) => {
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
                            setToastConfig(prev => ({ ...prev, visible: false }));
                        }}
                        onPreviewDoc={(url) => setPreviewDocUrl(url || null)}
                    />

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

                    <View style={styles.spacing} />

                    <PaymentSummaryCard
                        totalAmount={totalAmount}
                        amountPaid={amountPaid}
                        remainingBalance={remainingBalance}
                        payments={booking?.payment || []}
                    />

                </View>
            </ScrollView>

            {footerConfig && (
                <CustomStickyFooter
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
                onClose={() => {
                    setActiveCancelModal(null);
                    setModalInitialReason('');
                    setModalErrorMessage(null);
                }}
                onConfirm={async (reason: string) => {
                    setIsSubmittingCancellation(true);
                    setModalErrorMessage(null);
                    try {
                        if (activeCancelModal === 'cancel') {
                            await onCancelConfirm(booking, reason);
                            setActiveCancelModal(null);
                            setToastConfig({
                                visible: true,
                                message: 'Cancellation request submitted successfully.',
                                type: 'success',
                            });
                        } else if (activeCancelModal === 'refund') {
                            await onRefundConfirm(booking, reason);
                            setActiveCancelModal(null);
                            const isPaid = ['paid', 'downpayment'].includes(booking.status);
                            setToastConfig({
                                visible: true,
                                message: isPaid
                                    ? 'Cancellation & refund request submitted successfully.'
                                    : 'Cancellation request submitted successfully.',
                                type: 'success',
                            });
                        } else if (activeCancelModal === 'update' && cancellation && onUpdateCancellationReason) {
                            try {
                                await onUpdateCancellationReason({ reason, oldRequest: cancellation });
                                setActiveCancelModal(null);
                                setToastConfig({
                                    visible: true,
                                    message: 'Cancellation appeal submitted successfully.',
                                    type: 'success',
                                });
                            } catch (err: unknown) {
                                setActiveCancelModal(null);
                                setToastConfig({
                                    visible: true,
                                    message: err instanceof Error ? err.message : 'Failed to submit cancellation appeal.',
                                    type: 'error',
                                });
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
                availableFutureOffers={availableFutureOffers}
                onConfirm={(selectedOffer: IOffer | 'explore') => {
                    if (isReschedulingRef.current) return;
                    isReschedulingRef.current = true;
                    setShowRescheduleModal(false);
                    setTimeout(async () => {
                        try {
                            if (selectedOffer === 'explore') {
                                router.replace('/explore');
                            } else if (onReschedule && typeof selectedOffer === 'object') {
                                await onReschedule(booking, selectedOffer);
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
                        setToastConfig({
                            visible: true,
                            message: RESUBMIT_TOASTS.STAGED_CONTACTS_SUCCESS,
                            type: 'success',
                        });
                        return;
                    }

                    if (onUpdateContacts) {
                        const ok = await onUpdateContacts(booking, data.phone, data.emergencyContact);
                        if (ok) {
                            setToastConfig({
                                visible: true,
                                message: 'Contact details updated successfully.',
                                type: 'success',
                            });
                        } else {
                            setToastConfig({
                                visible: true,
                                message: 'Failed to update contact details.',
                                type: 'error',
                            });
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
                        setToastConfig({
                            visible: true,
                            message: err instanceof Error ? err.message : 'Failed to cancel reservation.',
                            type: 'error',
                        });
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

            {/* Custom Toast above Sticky Footer for document validation feedback */}
            <CustomToast
                visible={toastConfig.visible}
                message={toastConfig.message}
                type={toastConfig.type}
                mode={toastConfig.type === 'error' ? 'dismissible' : 'simple'}
                position="sticky_footer"
                onHide={() => {
                    setToastConfig(prev => ({ ...prev, visible: false }));
                    setHasAttemptedSubmit(false);
                }}
            />

            {/* Modal Image Preview for uploaded/approved documents */}
            <ImagePreviewModal
                visible={Boolean(previewDocUrl)}
                images={previewDocUrl ? [previewDocUrl] : []}
                onClose={() => setPreviewDocUrl(null)}
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
        paddingHorizontal: 16
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
});

export default BookingDetailsScreen;
