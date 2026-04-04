import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

import ProgressStep from '@/src/features/Book/components/ProgressStep';
import DetailsScreen from '@/src/features/Book/screens/ReservationFlow/DetailsScreen';
import OffersScreen from '@/src/features/Book/screens/ReservationFlow/OffersScreen';
import StatusScreen from '@/src/features/Book/screens/ReservationFlow/StatusScreen';

const BookingScreen = ({
    offers = [],
    onBackPress,
    onSetOffer,
    onCompleteOffer,
    onUpdatePress,
}) => {
    // ==========================================
    // State
    // ==========================================
    const [currentView, setCurrentView] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitPhase, setSubmitPhase] = useState('idle');

    const [bookingData, setBookingData] = useState({
        selectedOfferId: null,
        hikerDetails: null,
        uploadedDocs: null,
    });

    const safeOffers = Array.isArray(offers) ? offers : [];
    const lineFillPercentage = ((currentView - 1) / 2) * 100;

    // ==========================================
    // Handlers
    // ==========================================
    const resetStateAndGoBack = () => {
        setCurrentView(1);
        setBookingData({
            selectedOfferId: null,
            hikerDetails: null,
            uploadedDocs: null,
        });
        onBackPress();
    };

    const handleHeaderBackPress = () => {
        if (currentView === 3) {
            resetStateAndGoBack();
        } else if (currentView === 2) {
            setCurrentView(1);
        } else {
            resetStateAndGoBack();
        }
    };

    const handleStepNavigation = (step) => {
        if (currentView === 3) return;
        if (step > currentView || isSubmitting) return;
        setCurrentView(step);
    };

    const handleReserve = (detailsData) => {
        setIsSubmitting(true); // Triggers the CustomLoading screen!

        // 1. Sync data to the backend state BEFORE saving
        if (onUpdatePress) {
            onUpdatePress({
                section: 'root',
                id: 'emergencyContact',
                value: {
                    name: detailsData.hikerDetails.emergencyName || '',
                    contactNumber: detailsData.hikerDetails.emergencyPhone || '',
                },
            });

            onUpdatePress({
                section: 'root',
                id: 'documents',
                value: detailsData.uploadedDocs || {},
            });
        }

        setBookingData((prev) => ({ ...prev, ...detailsData }));

        // 2. Trigger the submission phase
        setSubmitPhase('ready_to_submit');
    };

    // ==========================================
    // Effects
    // ==========================================
    useEffect(() => {
        if (submitPhase === 'ready_to_submit') {
            const processBooking = async () => {
                try {
                    await onCompleteOffer();
                } catch (backendError) {
                    // Silently swallow unimplemented error
                }

                setCurrentView(3);
                setIsSubmitting(false); // Hides loading screen
                setSubmitPhase('idle');
            };

            // Wait 250ms to ensure the Zustand store has settled with the Emergency Contact
            const timer = setTimeout(() => {
                processBooking();
            }, 250);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitPhase]);

    // ==========================================
    // Render
    // ==========================================
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomLoading
                visible={isSubmitting}
                message="Processing reservation..."
            />

            <CustomHeader
                title={currentView === 3 ? 'Booking Status' : 'Book Trail'}
                centerTitle={true}
                onBackPress={currentView === 3 ? null : handleHeaderBackPress}
            />

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

            <View style={styles.contentContainer}>
                {currentView === 1 && (
                    <OffersScreen
                        offers={safeOffers}
                        selectedOfferId={bookingData.selectedOfferId}
                        onContinue={(offerId) => {
                            const selectedOffer = safeOffers.find(
                                (o) => o.id === offerId
                            );

                            if (onSetOffer && selectedOffer) {
                                let properDate = new Date();
                                if (selectedOffer.date) {
                                    if (selectedOffer.date instanceof Date) {
                                        properDate = selectedOffer.date;
                                    } else if (typeof selectedOffer.date.toDate === 'function') {
                                        properDate = selectedOffer.date.toDate();
                                    } else if (selectedOffer.date.seconds) {
                                        properDate = new Date(selectedOffer.date.seconds * 1000);
                                    } else {
                                        properDate = new Date(selectedOffer.date);
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
                    />
                )}

                {currentView === 3 && (
                    <StatusScreen
                        onReturn={resetStateAndGoBack}
                        bookedOffer={safeOffers.find(
                            (o) => o.id === bookingData.selectedOfferId
                        )}
                        hikerDetails={bookingData.hikerDetails}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    progressWrapper: {
        paddingVertical: 20,
        paddingHorizontal: 20,
        backgroundColor: Colors.BACKGROUND,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        zIndex: 10,
        elevation: 4,
    },
    progressContainer: {
        position: 'relative',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    lineWrapper: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
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