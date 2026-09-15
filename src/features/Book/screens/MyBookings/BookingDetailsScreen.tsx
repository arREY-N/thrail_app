/**
 * @file BookingDetailsScreen.tsx
 * @description Comprehensive details screen for a user's booking, handling rejected document re-uploads, payment triggers, reschedule, and cancellation.
 */

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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

import { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { calculateVerificationValidity, formatVerificationExpiry } from '@/src/core/flows/PhoneVerificationFlow';
import { Booking, BookingStatus, Requirements } from "@/src/core/models/Booking/Booking";
import { IActivity, IOffer, ISchedule } from "@/src/core/models/Offer/Offer";
import { IEmergencyContact, User, UserRepo } from '@/src/core/models/User/User';
import { formatTime } from '@/src/utils/dateFormatter';

import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';
import BookingStatusComponent from '@/src/features/Book/screens/MyBookings/components/BookingStatus';
import HeroHeader from '@/src/features/Book/screens/MyBookings/components/HeroHeader';
import PaymentSummaryCard from '@/src/features/Book/screens/MyBookings/components/PaymentSummaryCard';
import PersonalInformationSection from '@/src/features/Book/screens/MyBookings/components/PersonalInformationSection';
import QuickInfoCard from '@/src/features/Book/screens/MyBookings/components/QuickInfoCard';
import ReasonModal from '@/src/features/Book/screens/MyBookings/components/ReasonModal';
import RequiredDocumentsSection from '@/src/features/Book/screens/MyBookings/components/RequiredDocumentsSection';
import RescheduleModal from '@/src/features/Book/screens/MyBookings/components/RescheduleModal';
import {
    getResubmitButtonTitle,
    getResubmitModalContent,
    RESUBMIT_TOASTS,
} from '@/src/features/Book/screens/MyBookings/utils/bookingResubmitMessages';

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
    onReschedule?: (booking: Booking, newOffer: IOffer) => void;
    /** Callback to view receipt */
    onViewReceipt: (booking: Booking) => void;
    /** Callback for cancellation confirmation */
    onCancelConfirm: (booking: Booking, reason: string) => void;
    /** Callback for refund confirmation */
    onRefundConfirm: (booking: Booking, reason: string) => void;
    /** Callback when re-uploading all rejected documents and/or updating contacts on rejected bookings */
    onResubmitDocuments?: (
        booking: Booking,
        updatedDocs: Requirements[],
        updatedPhone?: string,
        updatedEmergency?: IEmergencyContact
    ) => Promise<boolean>;
    /** Callback when updating contact details on rejected bookings */
    onUpdateContacts?: (booking: Booking, phone: string, emergencyContact: IEmergencyContact) => Promise<boolean>;
    /** Optional callback for update press */
    onUpdatePress?: () => void;
    /** Available future offers for rescheduling */
    availableFutureOffers?: IOffer[];
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
    onCancelConfirm,
    onRefundConfirm,
    onResubmitDocuments,
    onUpdateContacts,
    currentUserProfile,
    onSyncBookingVerification,
    onSearchUser,
    availableFutureOffers = []
}: BookingDetailsScreenProps) => {
    const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
    const [activeReasonModal, setActiveReasonModal] = useState<'cancel' | 'refund' | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
    const [showContactsModal, setShowContactsModal] = useState<boolean>(false);

    const [fullOffer, setFullOffer] = useState<IOffer | null>(null);
    const [isLoadingOffer, setIsLoadingOffer] = useState<boolean>(true);
    
    const [localDocs, setLocalDocs] = useState<Requirements[]>(booking?.documents || []);
    const [localStatus, setLocalStatus] = useState<BookingStatus | undefined>(booking?.status);

    const [stagedReplacements, setStagedReplacements] = useState<Record<number, string>>({});
    const [isSubmittingDocs, setIsSubmittingDocs] = useState<boolean>(false);
    const [confirmResubmitModalVisible, setConfirmResubmitModalVisible] = useState<boolean>(false);

    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [toastConfig, setToastConfig] = useState<{ visible: boolean; message: string; type: 'error' | 'success' }>({
        visible: false,
        message: '',
        type: 'error',
    });

    const [localUserPhone, setLocalUserPhone] = useState<string>(booking?.user?.phoneNumber || '');
    const [localEmergencyContact, setLocalEmergencyContact] = useState<IEmergencyContact | undefined>(booking?.emergencyContact);
    const [hasStagedContactChanges, setHasStagedContactChanges] = useState<boolean>(false);
    const [linkedEmergencyVerifiedAt, setLinkedEmergencyVerifiedAt] = useState<Date | null>(null);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

    const [prevBooking, setPrevBooking] = useState(booking);
    if (booking !== prevBooking) {
        setPrevBooking(booking);
        setLocalDocs(booking?.documents || []);
        setLocalStatus(booking?.status);
        setStagedReplacements({});
        setHasAttemptedSubmit(false);
        setToastConfig({ visible: false, message: '', type: 'error' });
        setLocalUserPhone(booking?.user?.phoneNumber || '');
        setLocalEmergencyContact(booking?.emergencyContact);
        setHasStagedContactChanges(false);
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
                    console.error("Failed to load offer details:", error);
                } finally {
                    setIsLoadingOffer(false);
                }
            } else {
                setIsLoadingOffer(false);
            }
        };

        fetchOfferDetails();
    }, [booking?.offer, getBookOffer]);

    let displayStatus: BookingStatus | undefined = localStatus;
    if (localStatus === 'cancelled' || localStatus === 'for-cancellation') {
        const payments = booking?.payment || [];
        const hasRefund = payments.some(p => p.status === 'refunded');
        if (hasRefund) {
            displayStatus = 'refunded';
        }
    }

    const totalAmount = booking?.offer?.price || 0;
    const amountPaid = booking?.payment?.reduce((sum, p) => {
        if (p.status === 'captured') return sum + (p.amount || 0);
        return sum;
    }, 0) || 0;
    const remainingBalance = totalAmount - amountPaid;

    const user = booking?.user;
    const cancellationReason = booking?.cancellationReason;

    // Determine effective user phone verification:
    // If the booking itself has a valid timestamp and phone matches localUserPhone, use it.
    // If missing on booking, fallback to currentUserProfile.phoneVerifiedAt if phone matches.
    const effectiveUserPhoneVerifiedAt = useMemo(() => {
        const bookingClean = cleanPhoneNumber(booking?.user?.phoneNumber || '');
        const currentClean = cleanPhoneNumber(localUserPhone);

        if (booking?.user?.phoneVerifiedAt && bookingClean === currentClean) {
            return booking.user.phoneVerifiedAt;
        }

        if (currentUserProfile?.phoneVerifiedAt && currentUserProfile?.phoneNumber) {
            const profileClean = cleanPhoneNumber(currentUserProfile.phoneNumber);
            if (currentClean && currentClean === profileClean) {
                return currentUserProfile.phoneVerifiedAt;
            }
        }

        return null;
    }, [booking?.user, localUserPhone, currentUserProfile]);

    // Resolve linked emergency contact user profile if linked via userId
    useEffect(() => {
        let isMounted = true;

        const resolveLinkedEmergencyContact = async () => {
            if (localEmergencyContact?.userId && !localEmergencyContact.phoneVerifiedAt) {
                try {
                    const contactUser = await UserRepo.fetchById(localEmergencyContact.userId);
                    if (isMounted && contactUser) {
                        const contactPhoneClean = cleanPhoneNumber(contactUser.phoneNumber || '');
                        const emergencyPhoneClean = cleanPhoneNumber(localEmergencyContact.contactNumber || '');

                        if (contactPhoneClean && contactPhoneClean === emergencyPhoneClean && contactUser.phoneVerifiedAt) {
                            setLinkedEmergencyVerifiedAt(contactUser.phoneVerifiedAt);
                            return;
                        }
                    }
                } catch {
                    // Fail silently, fallback to null
                }
            }
            if (isMounted) {
                setLinkedEmergencyVerifiedAt(null);
            }
        };

        resolveLinkedEmergencyContact();
        return () => {
            isMounted = false;
        };
    }, [localEmergencyContact?.userId, localEmergencyContact?.phoneVerifiedAt, localEmergencyContact?.contactNumber]);

    const effectiveEmergencyPhoneVerifiedAt = useMemo(() => {
        const contactClean = cleanPhoneNumber(localEmergencyContact?.contactNumber || '');

        if (localEmergencyContact?.phoneVerifiedAt) {
            return localEmergencyContact.phoneVerifiedAt;
        }

        if (linkedEmergencyVerifiedAt) {
            return linkedEmergencyVerifiedAt;
        }

        if (currentUserProfile?.emergencyContact?.phoneVerifiedAt && currentUserProfile?.emergencyContact?.contactNumber) {
            const profileContactClean = cleanPhoneNumber(currentUserProfile.emergencyContact.contactNumber);
            if (contactClean && contactClean === profileContactClean) {
                return currentUserProfile.emergencyContact.phoneVerifiedAt;
            }
        }

        return null;
    }, [localEmergencyContact, linkedEmergencyVerifiedAt, currentUserProfile]);

    const userPhoneValidity = calculateVerificationValidity(effectiveUserPhoneVerifiedAt);
    const emergencyPhoneValidity = calculateVerificationValidity(effectiveEmergencyPhoneVerifiedAt);
    const userExpiryText = formatVerificationExpiry(effectiveUserPhoneVerifiedAt);
    const emergencyExpiryText = formatVerificationExpiry(effectiveEmergencyPhoneVerifiedAt);

    // Trigger flow-level verification synchronization if provided
    useEffect(() => {
        if (onSyncBookingVerification && booking) {
            onSyncBookingVerification(booking);
        }
    }, [booking, onSyncBookingVerification]);


    const isCancelled = ['for-cancellation', 'cancellation-rejected', 'refund', 'refunded', 'cancelled', 'reschedule-rejected', 'expired'].includes(displayStatus || '');
    const isConfirmed = ['paid', 'completed', 'downpayment'].includes(displayStatus || '');

    const canCancel = ['for-reservation', 'pending-docs', 'for-reschedule', 'for-payment', 'approved-docs'].includes(displayStatus || '');
    const canRefund = isConfirmed;
    const canReschedule = ['for-reservation', 'pending-docs', 'for-reschedule'].includes(displayStatus || '');

    const showMenuIcon = !isCancelled && (canCancel || canRefund || canReschedule);
    const hasHistoricalPayments = (booking?.payment?.length || 0) > 0;

    const inclusions = fullOffer?.inclusions || [];
    const thingsToBring = fullOffer?.thingsToBring || [];
    const reminders = fullOffer?.reminders || [];
    const schedule = fullOffer?.schedule || [];

    const enhancedBooking = {
        ...booking,
        status: displayStatus,
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

    const isPhoneRejection = Boolean(cancellationReason && /phone|contact|unreachable/i.test(cancellationReason));
    const isRejectedReservation = !isCancelled && displayStatus === 'reservation-rejected';

    const originalRejectedIndices = useMemo(() => {
        return (booking?.documents || [])
            .map((doc, index) => (doc.valid === 'rejected' ? index : -1))
            .filter((index): index is number => index !== -1);
    }, [booking?.documents]);

    const totalRejectedCount = originalRejectedIndices.length;
    const stagedCount = originalRejectedIndices.filter((idx) => Boolean(stagedReplacements[idx])).length;
    const remainingRejectedCount = totalRejectedCount - stagedCount;

    const docsReady = totalRejectedCount === 0 || remainingRejectedCount === 0;
    const contactReady = !isPhoneRejection || hasStagedContactChanges || localUserPhone !== booking?.user?.phoneNumber;
    const canResubmitAll = isRejectedReservation && (totalRejectedCount > 0 || isPhoneRejection || hasStagedContactChanges) && docsReady && contactReady;

    const handleExecuteResubmit = async () => {
        setConfirmResubmitModalVisible(false);
        setIsSubmittingDocs(true);

        try {
            const updatedDocs: Requirements[] = localDocs.map((doc, idx) => {
                const stagedUrl = stagedReplacements[idx];
                if (stagedUrl) {
                    return {
                        name: doc.name || 'Document',
                        file: stagedUrl,
                        valid: 'pending' as const
                    };
                }
                return doc;
            });

            let success = false;

            if (onResubmitDocuments) {
                success = await onResubmitDocuments(
                    booking,
                    updatedDocs,
                    localUserPhone,
                    localEmergencyContact
                );
            }

            if (success) {
                setLocalDocs(updatedDocs);
                setLocalStatus('pending-docs');
                setStagedReplacements({});
                setHasStagedContactChanges(false);
                setToastConfig({
                    visible: true,
                    message: RESUBMIT_TOASTS.RESUBMIT_SUCCESS,
                    type: 'success',
                });
            } else {
                setToastConfig({
                    visible: true,
                    message: RESUBMIT_TOASTS.RESUBMIT_ERROR,
                    type: 'error',
                });
            }
        } catch (err: unknown) {
            console.error('Error in handleExecuteResubmit:', err);
            setToastConfig({
                visible: true,
                message: err instanceof Error ? err.message : RESUBMIT_TOASTS.RESUBMIT_ERROR,
                type: 'error',
            });
        } finally {
            setIsSubmittingDocs(false);
        }
    };

    const handleResubmitPress = () => {
        if (!canResubmitAll) {
            setHasAttemptedSubmit(true);
            let msg: string = RESUBMIT_TOASTS.DOCS_REPLACE_REQUIRED(remainingRejectedCount);
            if (isPhoneRejection && !contactReady && totalRejectedCount > 0 && remainingRejectedCount > 0) {
                msg = RESUBMIT_TOASTS.BOTH_UPDATE_REQUIRED;
            } else if (isPhoneRejection && !contactReady) {
                msg = RESUBMIT_TOASTS.CONTACT_UPDATE_REQUIRED;
            } else if (remainingRejectedCount === 1) {
                msg = RESUBMIT_TOASTS.DOC_REPLACE_REQUIRED;
            }
            setToastConfig({
                visible: true,
                message: msg,
                type: 'error',
            });
            return;
        }

        setConfirmResubmitModalVisible(true);
    };

    const getFooterConfig = () => {
        if (isRejectedReservation && (totalRejectedCount > 0 || isPhoneRejection || hasStagedContactChanges)) {
            const buttonTitle = getResubmitButtonTitle(
                isSubmittingDocs,
                canResubmitAll,
                stagedCount,
                totalRejectedCount,
                isPhoneRejection && !contactReady
            );

            return {
                primaryButton: {
                    title: buttonTitle,
                    variant: "primary" as const,
                    disabled: isSubmittingDocs,
                    style: {
                        borderRadius: 12,
                        backgroundColor: canResubmitAll
                            ? Colors.PRIMARY
                            : (hasAttemptedSubmit ? Colors.STATUS_CANCELLED_BG : Colors.GRAY_ULTRALIGHT),
                        borderColor: canResubmitAll
                            ? Colors.PRIMARY
                            : (hasAttemptedSubmit ? Colors.STATUS_CANCELLED_TEXT : Colors.GRAY_LIGHT),
                        borderWidth: 1.5,
                    },
                    textStyle: {
                        color: canResubmitAll
                            ? Colors.WHITE
                            : (hasAttemptedSubmit ? Colors.STATUS_CANCELLED_TEXT : Colors.TEXT_SECONDARY),
                        fontWeight: 'bold' as const,
                    },
                    onPress: handleResubmitPress,
                }
            };
        }

        if (canReschedule) {
            return {
                primaryButton: {
                    title: "Reschedule",
                    variant: "primary" as const,
                    style: { borderRadius: 12 },
                    onPress: () => setShowRescheduleModal(true)
                }
            };
        }

        if (displayStatus === 'for-payment' || displayStatus === 'approved-docs') {
            return {
                primaryButton: {
                    title: "Complete Payment",
                    variant: "primary" as const,
                    style: { borderRadius: 12, backgroundColor: Colors.PRIMARY },
                    onPress: () => onProceedToPayment(booking)
                }
            };
        }

        if (displayStatus === 'downpayment') {
            return {
                secondaryButton: {
                    title: "View Receipt",
                    variant: "outline" as const,
                    style: { borderColor: Colors.PRIMARY, borderRadius: 12 },
                    textStyle: { color: Colors.PRIMARY },
                    onPress: () => onViewReceipt(booking)
                },
                primaryButton: {
                    title: "Pay Balance",
                    variant: "primary" as const,
                    style: { borderRadius: 12, backgroundColor: Colors.PRIMARY },
                    onPress: () => onProceedToPayment(booking)
                }
            };
        }

        if (isConfirmed || (isCancelled && hasHistoricalPayments)) {
            return {
                primaryButton: {
                    title: "View Receipt",
                    variant: "primary" as const,
                    style: { borderRadius: 12 },
                    onPress: () => onViewReceipt(booking)
                }
            };
        }

        return null;
    };


    const resubmitModalContent = getResubmitModalContent(
        totalRejectedCount,
        hasStagedContactChanges || isPhoneRejection
    );

    const footerConfig = getFooterConfig();

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
                            <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.TEXT_PRIMARY} />
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

                    <BookingStatusComponent status={displayStatus} reason={cancellationReason} />

                    {(displayStatus === 'for-reservation' || displayStatus === 'pending-docs') && (
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
                                    <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    {thingsToBring.length > 0 && (
                        <AccordionItem title="Things to Bring" icon="briefcase" defaultOpen={isConfirmed}>
                            {thingsToBring.map((item: string, idx: number) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.tinyDot} />
                                    <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                </View>
                            ))}
                        </AccordionItem>
                    )}

                    {schedule.length > 0 && (
                        <AccordionItem title="Itinerary" icon="map" defaultOpen={isConfirmed}>
                            <View style={styles.timelineContainer}>
                                {schedule.map((dayData: ISchedule<Date>, dayIdx: number) => (
                                    <View key={dayIdx} style={styles.timelineDay}>
                                        <CustomText variant="label" style={styles.dayLabelText}>Day {dayData.day}</CustomText>
                                        {dayData.activities?.map((act: IActivity<Date>, actIdx: number) => (
                                            <View key={actIdx} style={styles.timelineRow}>
                                                <View style={styles.timelineDot} />
                                                <View style={styles.timelineContent}>
                                                    <CustomText variant="label" style={styles.timelineTime}>
                                                        {formatTime(act.time)} — {act.event.split(' - ')[0] || 'Activity'}
                                                    </CustomText>
                                                    {act.event.includes(' - ') && (
                                                        <CustomText variant="caption" style={styles.timelineSubEvent}>
                                                            {act.event.split(' - ')[1]}
                                                        </CustomText>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </AccordionItem>
                    )}

                    {reminders.length > 0 && (
                        <AccordionItem title="Important Reminders" icon="alert-circle" defaultOpen={!isCancelled}>
                            {Array.isArray(reminders) ? (
                                reminders.map((item: string, idx: number) => (
                                    <View key={idx} style={styles.bulletRow}>
                                        <View style={styles.tinyDot} />
                                        <CustomText variant="caption" style={styles.bulletText}>{item}</CustomText>
                                    </View>
                                ))
                            ) : (
                                <CustomText variant="caption" style={styles.bulletText}>{reminders}</CustomText>
                            )}
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
                <View style={styles.floatingFooterContainer}>
                    <CustomStickyFooter
                        primaryButton={footerConfig.primaryButton}
                        secondaryButton={footerConfig.secondaryButton}
                    />
                </View>
            )}

            <ReasonModal
                visible={!!activeReasonModal}
                actionType={activeReasonModal}
                onClose={() => setActiveReasonModal(null)}
                onConfirm={(reason: string) => {
                    if (activeReasonModal === 'cancel') {
                        onCancelConfirm(booking, reason);
                    } else if (activeReasonModal === 'refund') {
                        onRefundConfirm(booking, reason);
                    }
                }}
            />

            <RescheduleModal
                visible={showRescheduleModal}
                onClose={() => setShowRescheduleModal(false)}
                availableFutureOffers={availableFutureOffers}
                onConfirm={(selectedOffer: IOffer | 'explore') => {
                    setShowRescheduleModal(false);
                    setTimeout(() => {
                        if (selectedOffer === 'explore') {
                            router.replace('/explore');
                        } else if (onReschedule && typeof selectedOffer === 'object') {
                            onReschedule(booking, selectedOffer);
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

            <Modal transparent={true} visible={showActionMenu} animationType="fade" onRequestClose={() => setShowActionMenu(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
                    <View style={styles.actionSheetWrapper}>
                        <View style={styles.actionSheet}>
                            <View style={styles.actionSheetHandle} />
                            <CustomText variant="h3" style={styles.actionSheetTitle}>Booking Options</CustomText>

                            {canReschedule && (
                                <TouchableOpacity
                                    style={styles.actionItem}
                                    onPress={() => {
                                        setShowActionMenu(false);
                                        setTimeout(() => setShowRescheduleModal(true), 300);
                                    }}
                                >
                                    <View style={styles.actionIconBgPrimary}>
                                        <CustomIcon library="Feather" name="calendar" size={18} color={Colors.PRIMARY} />
                                    </View>
                                    <CustomText style={styles.actionItemText}>Reschedule Booking</CustomText>
                                </TouchableOpacity>
                            )}

                            {canCancel && (
                                <TouchableOpacity
                                    style={styles.actionItem}
                                    onPress={() => {
                                        setShowActionMenu(false);
                                        setTimeout(() => setActiveReasonModal('cancel'), 300);
                                    }}
                                >
                                    <View style={styles.actionIconBgError}>
                                        <CustomIcon library="Feather" name="x-circle" size={18} color={Colors.ERROR} />
                                    </View>
                                    <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>Cancel Booking</CustomText>
                                </TouchableOpacity>
                            )}

                            {canRefund && (
                                <TouchableOpacity
                                    style={styles.actionItem}
                                    onPress={() => {
                                        setShowActionMenu(false);
                                        setTimeout(() => setActiveReasonModal('refund'), 300);
                                    }}
                                >
                                    <View style={styles.actionIconBgError}>
                                        <CustomIcon library="Feather" name="refresh-ccw" size={18} color={Colors.ERROR} />
                                    </View>
                                    <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>Request Refund</CustomText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

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
                mode="dismissible"
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
    timelineContainer: {
        borderLeftWidth: 1,
        borderLeftColor: Colors.GRAY_LIGHT,
        marginLeft: 8,
        paddingLeft: 16,
        marginTop: 8
    },
    timelineDay: {
        marginBottom: 20
    },
    dayLabelText: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 12
    },
    timelineRow: {
        flexDirection: 'row',
        marginBottom: 16,
        position: 'relative'
    },
    timelineDot: {
        position: 'absolute',
        left: -20.5,
        top: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.PRIMARY
    },
    timelineContent: {
        flex: 1
    },
    timelineTime: {
        fontWeight: 'bold',
        fontSize: 13,
        color: Colors.TEXT_PRIMARY
    },
    timelineSubEvent: {
        lineHeight: 20,
        marginTop: 2
    },
    floatingFooterContainer: {
        paddingBottom: 20,
        paddingHorizontal: 10,
        backgroundColor: 'transparent'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    actionSheetWrapper: {
        width: '100%',
        maxWidth: 768
    },
    actionSheet: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40
    },
    actionSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16
    },
    actionSheetTitle: {
        marginBottom: 20
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 16
    },
    actionIconBgPrimary: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionIconBgError: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.ERROR_BG,
        justifyContent: 'center',
        alignItems: 'center'
    },
    actionItemText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BookingDetailsScreen;
