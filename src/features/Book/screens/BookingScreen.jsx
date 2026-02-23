import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

import OffersView from '@/src/features/Book/components/OffersView';

const BookingScreen = ({ offers = [], onBackPress }) => {
    
    const [currentView, setCurrentView] = useState(1);
    
    const [bookingData, setBookingData] = useState({
        selectedOfferId: null,
        hikerDetails: null,
        medicalCertUrl: null,
    });

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Book" 
                onBackPress={onBackPress} 
            />
            
            <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                    <View style={styles.progressLine} />
                    
                    <View style={styles.progressRow}>
                        <ProgressStep 
                            stepNum={1} 
                            title="Offers" 
                            libraryName="FontAwesome5"
                            iconName="tag" 
                            currentView={currentView}
                        />

                        <ProgressStep 
                            stepNum={2} 
                            title="Details" 
                            libraryName="Ionicons"
                            iconName="person" 
                            currentView={currentView}
                        />

                        <ProgressStep 
                            stepNum={3} 
                            title="Payment"
                            libraryName="FontAwesome5" 
                            iconName="wallet" 
                            currentView={currentView}
                        />
                        <ProgressStep 
                            stepNum={4} 
                            title="Receipt" 
                            libraryName="Ionicons"
                            iconName="receipt" 
                            currentView={currentView}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                {currentView === 1 && (
                    <OffersView 
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
                    <View style={styles.placeholderView}>
                        <CustomText variant="h2">
                            Step 2: Details
                        </CustomText>
                        <CustomText color={Colors.TEXT_SECONDARY}>
                            We will build the Form here next!
                        </CustomText>
                    </View>
                )}
            </View>

        </ScreenWrapper>
    );
};

const ProgressStep = ({ stepNum, title, libraryName, iconName, currentView }) => {
    const isActive = currentView >= stepNum;
    
    return (
        <View style={styles.stepContainer}>
            <View 
                style={[
                    styles.iconCircle, 
                    isActive ? styles.activeIconCircle : styles.inactiveIconCircle
                ]}
            >
                <CustomIcon 
                    library={libraryName}
                    name={iconName} 
                    size={20} 
                    color={isActive ? Colors.WHITE : Colors.GRAY_MEDIUM} 
                />
            </View>

            <CustomText 
                variant="caption" 
                style={[
                    styles.stepText, 
                    isActive ? styles.activeStepText : styles.inactiveStepText
                ]}
            >
                {title}
            </CustomText>
        </View>
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
    progressLine: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: Colors.GRAY_LIGHT,
        zIndex: 1,
    },
    stepContainer: {
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 4,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
    },
    activeIconCircle: {
        backgroundColor: Colors.PRIMARY,
        borderWidth: 0,
    },
    inactiveIconCircle: {
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    stepText: {
        fontSize: 12,
    },
    activeStepText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    inactiveStepText: {
        color: Colors.GRAY_MEDIUM,
        fontWeight: '500',
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