import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

import ProgressStep from '@/src/features/Book/components/ProgressStep';
import DetailsScreen from '@/src/features/Book/screens/DetailsScreen';
import OffersScreen from '@/src/features/Book/screens/OffersScreen';
import PaymentScreen from '@/src/features/Book/screens/PaymentScreen';
import ReceiptScreen from '@/src/features/Book/screens/ReceiptScreen';

const BookingScreen = ({ offers = [], onBackPress }) => {
    
    const [currentView, setCurrentView] = useState(1);
    
    const [bookingData, setBookingData] = useState({
        selectedOfferId: null,
        hikerDetails: null,
        uploadedDocs: null,
        medicalCertUrl: null,
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingStep, setPendingStep] = useState(null);
    const [pendingHeaderBack, setPendingHeaderBack] = useState(false);

    const lineFillPercentage = ((currentView - 1) / 3) * 100;

    const handleHeaderBackPress = () => {
        if (currentView === 4) {
            onBackPress();
            return;
        }

        const hasProgress = currentView > 1 || bookingData.selectedOfferId !== null;

        if (hasProgress) {
            setPendingHeaderBack(true);
            setShowConfirmModal(true);
        } else {
            onBackPress();
        }
    };

    const handleStepNavigation = (step) => {
        if ((currentView === 2 || currentView === 3) && step < currentView) {
            setPendingStep(step);
            setShowConfirmModal(true);
        } else {
            setCurrentView(step);
        }
    };

    const confirmNavigation = () => {
        if (pendingHeaderBack) {
            setShowConfirmModal(false);

            setTimeout(() => {
                onBackPress(); 
                setPendingHeaderBack(false);
            }, 300);
            return;
        }

        if (pendingStep !== null) {
            setBookingData(prev => {
                let clearedData = { ...prev };
                
                if (pendingStep === 1) {
                    clearedData.hikerDetails = null;
                    clearedData.uploadedDocs = null;
                    clearedData.paymentMethod = null;
                } else if (pendingStep === 2) {
                    clearedData.paymentMethod = null;
                }
                
                return clearedData;
            });

            setCurrentView(pendingStep);
        }
        
        setShowConfirmModal(false);
        
        setTimeout(() => {
            setPendingStep(null);
            setPendingHeaderBack(false);
        }, 300);
    };

    const cancelNavigation = () => {
        setShowConfirmModal(false);
        
        setTimeout(() => {
            setPendingStep(null);
            setPendingHeaderBack(false);
        }, 300);
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Book" 
                onBackPress={handleHeaderBackPress}
            />
            
            <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                    
                    <View style={styles.lineWrapper}>
                        <View style={styles.progressLineBackground} />
                        <View style={[
                            styles.progressLineActive, 
                            { width: `${lineFillPercentage}%` }
                        ]} />
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
                            iconName="person" 
                            currentView={currentView}
                            onStepPress={handleStepNavigation}
                        />

                        <ProgressStep 
                            stepNum={3} 
                            title="Payment"
                            libraryName="FontAwesome5" 
                            iconName="wallet" 
                            currentView={currentView}
                            onStepPress={handleStepNavigation}
                        />

                        <ProgressStep 
                            stepNum={4} 
                            title="Receipt" 
                            libraryName="Ionicons"
                            iconName="receipt" 
                            currentView={currentView}
                            onStepPress={handleStepNavigation}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                {currentView === 1 && (
                    <OffersScreen 
                        offers={offers}
                        selectedOfferId={bookingData.selectedOfferId}
                        onContinue={(offerId) => {
                            setBookingData({ 
                                ...bookingData, 
                                selectedOfferId: offerId 
                            });
                            setCurrentView(2); 
                        }}
                    />
                )}
                
                {currentView === 2 && (
                    <DetailsScreen 
                        selectedOffer={offers.find(o => o.id === bookingData.selectedOfferId)}
                        savedDetails={bookingData.hikerDetails}
                        savedDocs={bookingData.uploadedDocs}
                        
                        onContinue={(detailsData) => {
                            setBookingData({ 
                                ...bookingData, 
                                ...detailsData 
                            });
                            setCurrentView(3); 
                        }}
                    />
                )}

                {currentView === 3 && (
                    <PaymentScreen 
                        selectedOffer={offers.find(o => o.id === bookingData.selectedOfferId)}
                        savedMethod={bookingData.paymentMethod}

                        onContinue={(paymentData) => {
                            setBookingData({ 
                                ...bookingData, 
                                ...paymentData 
                            });
                            setCurrentView(4);
                        }}
                    />
                )}

                {currentView === 4 && (
                    <ReceiptScreen 
                        bookingData={bookingData}
                        selectedOffer={offers.find(o => o.id === bookingData.selectedOfferId)}
                        onFinish={() => {
                            onBackPress(); 
                        }}
                    />
                )}
            </View>

            <ConfirmationModal 
                visible={showConfirmModal}
                onClose={cancelNavigation}
                onConfirm={confirmNavigation}
                title={pendingHeaderBack ? "Cancel Booking?" : "Discard Changes?"}
                message={
                    pendingHeaderBack 
                    ? "Are you sure you want to leave the booking process? All your progress will be lost." 
                    : "If you go back now, you will lose the details you just entered."
                }
                confirmText={pendingHeaderBack ? "Leave" : "Discard"}
                cancelText="Keep Editing"
            />

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
    placeholderView: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
    }
});

export default BookingScreen;