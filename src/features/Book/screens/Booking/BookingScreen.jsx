import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

import ProgressStep from '@/src/features/Book/components/ProgressStep';
import DetailsScreen from '@/src/features/Book/screens/Booking/DetailsScreen';
import OffersScreen from '@/src/features/Book/screens/Booking/OffersScreen';
import StatusScreen from '@/src/features/Book/screens/Booking/StatusScreen';

const BookingScreen = ({
    offers = [],
    onBackPress,
    onSetOffer,
    onCompleteOffer,
    onUpdatePress
}) => {

    const [currentView, setCurrentView] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitPhase, setSubmitPhase] = useState('idle');

    const [isBookingSuccess, setIsBookingSuccess] = useState(false); 

    const [bookingData, setBookingData] = useState({
        selectedOfferId: null,
        hikerDetails: null,
        uploadedDocs: null,
    });

    const safeOffers = Array.isArray(offers) ? offers : [];
    const lineFillPercentage = ((currentView - 1) / 2) * 100;

    const resetStateAndGoBack = () => {
        setCurrentView(1);
        setBookingData({
            selectedOfferId: null,
            hikerDetails: null,
            uploadedDocs: null,
        });
        setIsBookingSuccess(false);
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
        setIsSubmitting(true);

        if (onUpdatePress) {
            onUpdatePress({
                section: 'root',
                id: 'emergencyContact',
                value: {
                    name: detailsData.hikerDetails.emergencyName || '',
                    contactNumber: detailsData.hikerDetails.emergencyPhone || '',
                },
            });

            const formattedDocsArray = Object.keys(detailsData.uploadedDocs || {}).map((docName) => ({
                name: docName,
                file: detailsData.uploadedDocs[docName],
                valid: 'pending' 
            }));

            onUpdatePress({
                section: 'root',
                id: 'documents',
                value: formattedDocsArray, 
            });
        }

        setBookingData((prev) => ({ ...prev, ...detailsData }));
        setSubmitPhase('ready_to_submit');
    };

    useEffect(() => {
        if (submitPhase === 'ready_to_submit') {
            const processBooking = async () => {
                let successFlag = false; 
                
                try {
                    successFlag = await onCompleteOffer();
                } catch (backendError) {
                    console.error("Booking Error:", backendError);
                    successFlag = false;
                }

                setIsBookingSuccess(successFlag);
                setCurrentView(3);
                setIsSubmitting(false);
                setSubmitPhase('idle');
            };

            const timer = setTimeout(() => {
                processBooking();
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
                        onReturn={() => {
                            resetStateAndGoBack();
                        }}
                        bookedOffer={safeOffers.find(
                            (o) => o.id === bookingData.selectedOfferId
                        )}
                        hikerDetails={bookingData.hikerDetails}
                        isSuccess={isBookingSuccess} 
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