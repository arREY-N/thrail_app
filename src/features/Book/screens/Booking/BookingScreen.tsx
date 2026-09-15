/**
 * @file BookingScreen.tsx
 * @description Wizard controller screen managing the multi-step booking flow (Offers -> Details -> Confirmation Status).
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomLoading from '@/src/components/CustomLoading';
import { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { Booking, BookingLogic } from '@/src/core/models/Booking/Booking';
import { Offer } from '@/src/core/models/Offer/Offer';
import { IEmergencyContact } from '@/src/core/models/User/User';
import { toDateOrNull } from '@/src/core/utility/date';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

import ProgressStep from '@/src/features/Book/components/ProgressStep';
import DetailsScreen, { HikerBookingDetails } from '@/src/features/Book/screens/Booking/DetailsScreen';
import { UserSearchResult } from '@/src/components/EmergencyModal';
import OffersScreen from '@/src/features/Book/screens/Booking/OffersScreen';
import StatusScreen, { BookingStatusOutcome } from '@/src/features/Book/screens/Booking/StatusScreen';

export interface BookingScreenProps {
    offers?: Offer[];
    bookedOfferIds?: string[];
    userBookings?: Booking[];
    error?: string | null;
    onBackPress: () => void;
    onSetOffer?: (offer: Offer) => void;
    onCompleteOffer: (data?: {
        hikerDetails?: {
            phone?: string;
            emergencyContact?: IEmergencyContact;
        } | null;
        uploadedDocs?: Record<string, string> | null;
    }) => Promise<boolean>;
    onUpdatePress?: (params: TEdit<Booking>) => void;
    onTermsPress?: () => void;
    onPrivacyPress?: () => void;
    onViewBookingDetails?: (bookingId?: string) => void;
    onSearchUser?: (email: string) => Promise<UserSearchResult[]>;
}

export interface BookingDataState {
    selectedOfferId: string | null;
    hikerDetails: HikerBookingDetails | null;
    uploadedDocs: Record<string, string> | null;
}

/**
 * BookingScreen — Multi-step wizard screen for selecting offers, uploading documents,
 * entering contact info, signing terms, and submitting hike reservations.
 *
 * @param {BookingScreenProps} props - Component props
 * @returns {React.JSX.Element} The rendered component
 */
const BookingScreen = ({
    offers = [],
    bookedOfferIds,
    userBookings,
    error,
    onBackPress,
    onSetOffer,
    onCompleteOffer,
    onUpdatePress,
    onTermsPress,
    onPrivacyPress,
    onViewBookingDetails,
    onSearchUser,
}: BookingScreenProps): React.JSX.Element => {

    const [currentView, setCurrentView] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitPhase, setSubmitPhase] = useState('idle');
    const [bookingStatusOutcome, setBookingStatusOutcome] = useState<BookingStatusOutcome>('success');
    const [bookingErrorMessage, setBookingErrorMessage] = useState<string | null>(null);
    const [isDetailsDirty, setIsDetailsDirty] = useState(false);
    const [showDiscardModal, setShowDiscardModal] = useState(false);
    const pendingStepRef = useRef<number | null>(null);

    const [bookingData, setBookingData] = useState<BookingDataState>({
        selectedOfferId: null,
        hikerDetails: null,
        uploadedDocs: null,
    });

    const safeOffers = React.useMemo(() => (Array.isArray(offers) ? offers : []), [offers]);
    const lineFillPercentage = ((currentView - 1) / 2) * 100;

    const computedBookedOfferIds = React.useMemo(() => {
        if (bookedOfferIds) return bookedOfferIds;
        if (userBookings && Array.isArray(userBookings)) {
            const activeBookings = userBookings.filter((b) => !BookingLogic.isInactiveStatus(b.status));
            return activeBookings.map((b) => b.offer?.id).filter(Boolean) as string[];
        }
        return [];
    }, [bookedOfferIds, userBookings]);

    const createdBookingId = React.useMemo(() => {
        if (userBookings && Array.isArray(userBookings)) {
            const match = userBookings.find(
                (b) => b.offer?.id === bookingData.selectedOfferId && !BookingLogic.isInactiveStatus(b.status)
            );
            return match?.id || null;
        }
        return null;
    }, [userBookings, bookingData.selectedOfferId]);

    const computedConflictOfferIds = React.useMemo(() => {
        if (userBookings && Array.isArray(userBookings)) {
            const activeBookings = userBookings.filter((b) => !BookingLogic.isInactiveStatus(b.status));
            const bookedDatesSet = new Set(
                activeBookings.map((b) => formatDateToStandard(b.offer?.date)).filter(Boolean)
            );

            return safeOffers
                .filter((o) => bookedDatesSet.has(formatDateToStandard(o.date)))
                .map((o) => o.id);
        }
        return [];
    }, [userBookings, safeOffers]);
    
    const completeOfferRef = useRef(onCompleteOffer);
    useEffect(() => {
        completeOfferRef.current = onCompleteOffer;
    }, [onCompleteOffer]);

    const bookingDataRef = useRef(bookingData);
    useEffect(() => {
        bookingDataRef.current = bookingData;
    }, [bookingData]);

    const resetStateAndGoBack = () => {
        setCurrentView(1);
        setBookingData({
            selectedOfferId: null,
            hikerDetails: null,
            uploadedDocs: null,
        });
        setBookingStatusOutcome('success');
        setBookingErrorMessage(null);
        setIsDetailsDirty(false);
        onBackPress();
    };

    const handleHeaderBackPress = () => {
        if (currentView === 3) {
            resetStateAndGoBack();
        } else if (currentView === 2) {
            if (isDetailsDirty) {
                pendingStepRef.current = 1;
                setShowDiscardModal(true);
            } else {
                setCurrentView(1);
            }
        } else {
            resetStateAndGoBack();
        }
    };

    const handleStepNavigation = (step: number) => {
        if (currentView === 3) return;
        if (step > currentView || isSubmitting) return;
        if (currentView === 2 && step === 1 && isDetailsDirty) {
            pendingStepRef.current = 1;
            setShowDiscardModal(true);
            return;
        }
        setCurrentView(step);
    };

    const handleConfirmDiscard = () => {
        setShowDiscardModal(false);
        setIsDetailsDirty(false);
        const targetStep = pendingStepRef.current ?? 1;
        pendingStepRef.current = null;
        setCurrentView(targetStep);
    };

    const handleRetryBooking = () => {
        setCurrentView(2);
        setSubmitPhase('idle');
        setIsSubmitting(false);
    };

    const handleChangeDate = () => {
        setCurrentView(1);
        setSubmitPhase('idle');
        setIsSubmitting(false);
    };

    const handleViewBooking = (targetId?: string) => {
        if (onViewBookingDetails) {
            onViewBookingDetails(targetId || createdBookingId || undefined);
        }
    };

    const handleReserve = (payload: { 
        hikerDetails: HikerBookingDetails; 
        uploadedDocs: Record<string, string>; 
    }) => {
        setIsSubmitting(true);

        const cleanedPhone = cleanPhoneNumber(payload.hikerDetails.phone || '');
        const cleanedEmergencyContact: IEmergencyContact = {
            name: payload.hikerDetails.emergencyContact?.name || '',
            contactNumber: cleanPhoneNumber(payload.hikerDetails.emergencyContact?.contactNumber || ''),
            email: payload.hikerDetails.emergencyContact?.email || '',
            userId: payload.hikerDetails.emergencyContact?.userId || '',
            phoneVerifiedAt: payload.hikerDetails.emergencyContact?.phoneVerifiedAt
                ? toDateOrNull(payload.hikerDetails.emergencyContact.phoneVerifiedAt)
                : null,
        };

        const normalizedHikerDetails: HikerBookingDetails = {
            phone: cleanedPhone,
            emergencyContact: cleanedEmergencyContact,
        };

        if (onUpdatePress) {
            onUpdatePress({
                section: 'root',
                id: 'emergencyContact',
                value: cleanedEmergencyContact,
            });

            const formattedDocsArray = Object.keys(payload.uploadedDocs || {}).map((docName) => ({
                name: docName,
                file: payload.uploadedDocs[docName],
                valid: 'pending' as const
            }));

            onUpdatePress({
                section: 'root',
                id: 'documents',
                value: formattedDocsArray, 
            });
        }

        setBookingData((prev) => ({
            ...prev,
            ...payload,
            hikerDetails: normalizedHikerDetails,
        }));
        
        setSubmitPhase('ready_to_submit');
    };

    useEffect(() => {
        if (submitPhase === 'ready_to_submit') {
            const timer = setTimeout(async () => {
                let successFlag = false; 
                let capturedError: string | null = null;
                
                try {
                    successFlag = await completeOfferRef.current({
                        hikerDetails: bookingDataRef.current.hikerDetails || undefined,
                        uploadedDocs: bookingDataRef.current.uploadedDocs || undefined,
                    });
                } catch (backendError) {
                    console.error("Booking Error:", backendError);
                    successFlag = false;
                    capturedError = backendError instanceof Error ? backendError.message : String(backendError);
                }

                if (successFlag) {
                    setBookingStatusOutcome('success');
                    setBookingErrorMessage(null);
                } else {
                    const errLower = (capturedError || '').toLowerCase();
                    if (errLower.includes('already have an active booking') || errLower.includes('conflict') || errLower.includes('duplicate')) {
                        setBookingStatusOutcome('conflict');
                    } else {
                        setBookingStatusOutcome('error');
                    }
                    setBookingErrorMessage(capturedError);
                }

                setCurrentView(3);
                setIsSubmitting(false);
                setSubmitPhase('idle');
            }, 250);

            return () => clearTimeout(timer);
        }
    }, [submitPhase]); 
    
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomLoading
                visible={isSubmitting}
                message="Processing reservation..."
            />

            <CustomHeader
                title={currentView === 3 ? 'Booking Status' : 'Book Trail'}
                centerTitle={true}
                onBackPress={currentView === 3 ? undefined : handleHeaderBackPress}
            />

            <View style={styles.progressOuterBounds}>
                <View style={styles.progressWrapper}>
                    <View style={styles.progressContainer}>
                        <View style={styles.lineWrapper}>
                            <View style={styles.progressLineBackground} />
                            <View
                                style={[
                                    styles.progressLineActive,
                                    { width: `${lineFillPercentage}%` },
                                ]}
                            />
                        </View>

                        <View style={styles.progressRow}>
                            <ProgressStep
                                stepNum={1}
                                title="Offers"
                                libraryName="FontAwesome5"
                                iconName="tag"
                                currentView={currentView}
                                onStepPress={handleStepNavigation}
                            />
                            <ProgressStep
                                stepNum={2}
                                title="Details"
                                libraryName="Ionicons"
                                iconName="document-text"
                                currentView={currentView}
                                onStepPress={handleStepNavigation}
                            />
                            <ProgressStep
                                stepNum={3}
                                title="Status"
                                libraryName="MaterialCommunityIcons"
                                iconName="clock-check-outline"
                                currentView={currentView}
                                onStepPress={handleStepNavigation}
                            />
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                {currentView === 1 && (
                    <OffersScreen
                        offers={safeOffers}
                        selectedOfferId={bookingData.selectedOfferId}
                        bookedOfferIds={computedBookedOfferIds}
                        conflictOfferIds={computedConflictOfferIds}
                        userBookings={userBookings}
                        error={error}
                        onViewBookingDetails={onViewBookingDetails}
                        onContinue={(offerId) => {
                            const selectedOffer = safeOffers.find(
                                (o) => o.id === offerId
                            );

                            if (onSetOffer && selectedOffer) {
                                let properDate = new Date();
                                if (selectedOffer.date) {
                                    if (selectedOffer.date instanceof Date) {
                                        properDate = selectedOffer.date;
                                    } else if (typeof selectedOffer.date === 'object' && selectedOffer.date !== null && 'toDate' in selectedOffer.date && typeof (selectedOffer.date as { toDate: () => Date }).toDate === 'function') {
                                        properDate = (selectedOffer.date as { toDate: () => Date }).toDate();
                                    } else if (typeof selectedOffer.date === 'object' && selectedOffer.date !== null && 'seconds' in selectedOffer.date) {
                                        properDate = new Date(Number((selectedOffer.date as { seconds: number }).seconds) * 1000);
                                    } else {
                                        properDate = new Date(String(selectedOffer.date));
                                    }
                                }
                                onSetOffer({ ...selectedOffer, date: properDate });
                            }

                            setBookingData((prev) => ({
                                ...prev,
                                selectedOfferId: offerId,
                            }));
                            setCurrentView(2);
                        }}
                    />
                )}

                {currentView === 2 && (
                    <DetailsScreen
                        selectedOffer={safeOffers.find(
                            (o) => o.id === bookingData.selectedOfferId
                        )}
                        savedDetails={bookingData.hikerDetails}
                        savedDocs={bookingData.uploadedDocs}
                        isSubmitting={isSubmitting}
                        onContinue={handleReserve}
                        onProgressChange={setIsDetailsDirty}
                        onTermsPress={onTermsPress}
                        onPrivacyPress={onPrivacyPress}
                        onSearchUser={onSearchUser}
                    />
                )}

                {currentView === 3 && (
                    <StatusScreen
                        status={bookingStatusOutcome}
                        errorMessage={bookingErrorMessage || error}
                        bookingId={createdBookingId}
                        bookedOffer={safeOffers.find(
                            (o) => o.id === bookingData.selectedOfferId
                        )}
                        hikerDetails={bookingData.hikerDetails}
                        uploadedDocs={bookingData.uploadedDocs}
                        onReturn={resetStateAndGoBack}
                        onViewBooking={handleViewBooking}
                        onRetry={handleRetryBooking}
                        onChangeDate={handleChangeDate}
                    />
                )}
            </View>

            {/* Discard / Leave Progress Confirmation Modal */}
            <ConfirmationModal 
                visible={showDiscardModal}
                onClose={() => {
                    setShowDiscardModal(false);
                    pendingStepRef.current = null;
                }}
                onConfirm={handleConfirmDiscard}
                title="Leave Reservation?"
                message="You have entered reservation details and uploaded requirements. Are you sure you want to leave and discard your progress?"
                confirmText="Yes, Leave"
                cancelText="Stay Here"
                isDestructive={true}
                iconName="alert-triangle"
                iconLibrary="Feather"
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    progressOuterBounds: {
        width: '100%',
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    progressWrapper: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: Colors.BACKGROUND,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...GlobalStyles.dropShadow(3),
    },
    progressContainer: {
        position: 'relative',
        width: '100%',
        maxWidth: 450, 
        alignSelf: 'center',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    lineWrapper: {
        position: 'absolute',
        top: 19, 
        left: 35, 
        right: 35, 
        height: 2,
        zIndex: 1,
    },
    progressLineBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    progressLineActive: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: Colors.PRIMARY,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
});

export default BookingScreen;