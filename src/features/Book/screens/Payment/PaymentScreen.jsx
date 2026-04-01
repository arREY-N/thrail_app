import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/core/stores/authStore';
import ProgressStep from '@/src/features/Book/components/ProgressStep';

import MethodScreen from '@/src/features/Book/screens/Payment/MethodScreen';
import SummaryScreen from '@/src/features/Book/screens/Payment/SummaryScreen';
import UploadScreen from '@/src/features/Book/screens/Payment/UploadScreen';

const PaymentScreen = ({
    bookingData,
    onBackPress,
    onContinue,
}) => {
    const { profile } = useAuthStore();
    const profileFullName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim();

    const [currentStep, setCurrentStep] = useState(1);
    
    const [paymentType, setPaymentType] = useState('full');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [isSignatureValid, setIsSignatureValid] = useState(false);
    
    const [receiptImage, setReceiptImage] = useState(null); 

    const totalPrice = bookingData?.offer?.price || 0;
    const amountToPay = paymentType === 'full' ? totalPrice : totalPrice / 2;

    const handleHeaderBackPress = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            onBackPress();
        }
    };

    const handleStepNavigation = (step) => {
        if (step > currentStep) return; 
        setCurrentStep(step);
    };

    const handleNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            onContinue({
                paymentType,
                paymentMethod: selectedMethod,
                amountPaid: amountToPay,
                proofUploaded: receiptImage 
            });
        }
    };

    const getFooterConfig = () => {
        if (currentStep === 1) return { title: "Continue", disabled: false };
        if (currentStep === 2) return { title: "Continue", disabled: !(selectedMethod && isSignatureValid) };
        if (currentStep === 3) return { title: "Submit Payment", disabled: !receiptImage };
        return { title: "Continue", disabled: false };
    };

    const footerConfig = getFooterConfig();
    const lineFillPercentage = ((currentStep - 1) / 2) * 100;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Setup Payment" 
                centerTitle={true} 
                onBackPress={handleHeaderBackPress} 
            />

            <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                    <View style={styles.lineWrapper}>
                        <View style={styles.progressLineBackground} />
                        <View style={[styles.progressLineActive, { width: `${lineFillPercentage}%` }]} />
                    </View>

                    <View style={styles.progressRow}>
                        <ProgressStep
                            stepNum={1}
                            title="Summary"
                            libraryName="Feather"
                            iconName="file-text"
                            currentView={currentStep}
                            onStepPress={handleStepNavigation}
                        />
                        <ProgressStep
                            stepNum={2}
                            title="Method"
                            libraryName="Feather"
                            iconName="credit-card"
                            currentView={currentStep}
                            onStepPress={handleStepNavigation}
                        />
                        <ProgressStep
                            stepNum={3}
                            title="Upload"
                            libraryName="Feather"
                            iconName="upload"
                            currentView={currentStep}
                            onStepPress={handleStepNavigation}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.contentArea}>
                {currentStep === 1 && (
                    <SummaryScreen 
                        bookingData={bookingData} 
                        profileFullName={profileFullName} 
                    />
                )}
                {currentStep === 2 && (
                    <MethodScreen 
                        amountToPay={amountToPay}
                        paymentType={paymentType}
                        setPaymentType={setPaymentType}
                        selectedMethod={selectedMethod}
                        setSelectedMethod={setSelectedMethod}
                        profileFullName={profileFullName}
                        setIsSignatureValid={setIsSignatureValid}
                    />
                )}
                {currentStep === 3 && (
                    <UploadScreen 
                        amountToPay={amountToPay}
                        selectedMethod={selectedMethod}
                        businessName={bookingData?.business?.name || 'Tour Provider'}
                        receiptImage={receiptImage}
                        setReceiptImage={setReceiptImage}
                    />
                )}
            </View>

            <CustomStickyFooter
                primaryButton={{
                    title: footerConfig.title,
                    onPress: handleNextStep,
                    disabled: footerConfig.disabled
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    contentArea: { 
        flex: 1 
    },
    progressWrapper: {
        paddingVertical: 20, 
        paddingHorizontal: 20, 
        backgroundColor: Colors.BACKGROUND,
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT, 
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24, 
        zIndex: 10, 
        elevation: 4,
    },
    progressContainer: { 
        position: 'relative' 
    },
    progressRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        zIndex: 2 
    },
    lineWrapper: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        right: 20, 
        height: 2, 
        zIndex: 1 
    },
    progressLineBackground: { 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        top: 0, 
        bottom: 0, 
        backgroundColor: Colors.GRAY_LIGHT 
    },
    progressLineActive: { 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        backgroundColor: Colors.PRIMARY 
    },
});

export default PaymentScreen;