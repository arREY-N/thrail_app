import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/core/stores/authStore';
import ProgressStep from '@/src/features/Book/components/ProgressStep';

import MethodScreen from '@/src/features/Book/screens/Payment/MethodScreen';
import StatusScreen from '@/src/features/Book/screens/Payment/StatusScreen';
import UploadScreen from '@/src/features/Book/screens/Payment/UploadScreen';

import { app } from '@/src/core/config/Firebase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const PaymentScreen = ({
    bookingData,
    onBackPress,
    onContinue,
    onPayOffer,
}) => {
    const { profile } = useAuthStore();
    const profileFullName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    
    const [paymentType, setPaymentType] = useState('full');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [isSignatureValid, setIsSignatureValid] = useState(false);
    
    const [receiptImage, setReceiptImage] = useState(null); 

    const totalPrice = bookingData?.offer?.price || 0;
    const amountPaidAlready = bookingData?.payment?.reduce((sum, p) => {
        if (p.status === 'captured') return sum + (p.amount || 0);
        return sum;
    }, 0) || 0;
    const remainingBalance = totalPrice - amountPaidAlready;
    
    const isPayingBalance = amountPaidAlready > 0;
    const effectivePaymentType = isPayingBalance ? 'full' : paymentType;
    const amountToPay = isPayingBalance 
        ? remainingBalance 
        : (effectivePaymentType === 'full' ? totalPrice : totalPrice / 2);

    const handleHeaderBackPress = () => {
        if (currentStep === 3) {
            handleNextStep(); 
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else {
            onBackPress();
        }
    };

    const handleStepNavigation = (step) => {
        if (currentStep === 3) return; 
        if (step > currentStep || isSubmitting) return; 
        setCurrentStep(step);
    };

    const handleNextStep = async () => {
        if (currentStep === 1) {
            setPaymentError(null);

            if (['gcash', 'maya'].includes(selectedMethod)) {
                
                // Synchronously open a blank popup on web to avoid popup blockers
                let popup = null;
                if (Platform.OS === 'web') {
                    popup = window.open('', '_blank');
                }

                setIsSubmitting(true);
                try {
                    
                    // Create return URL automatically based on the environment
                    const rawUrl = Linking.createURL('payment-result');
                    const appUrl = Platform.OS === 'web' ? rawUrl : Linking.createURL('payment-result', { scheme: 'thrailapp' });
                    
                    // Always use the production HTTPS cloud function even in DEV. 
                    const projectId = app.options.projectId || 'thrail';
                    const redirectFunctionUrl = `https://us-central1-${projectId}.cloudfunctions.net/paymongoRedirect`;

                    // Wrap the deep link in our custom Firebase HTTP function
                    const secureReturnUrl = `${redirectFunctionUrl}?url=${encodeURIComponent(appUrl)}`;
                    
                    const response = await onPayOffer(
                        amountToPay,
                        bookingData?.id,
                        selectedMethod,
                        secureReturnUrl
                    );
                    
                    const checkoutUrl = response.checkout_url;
                    
                    if (Platform.OS === 'web') {
                        if (popup) {
                            popup.location.href = checkoutUrl;
                        } else {
                            // If popup was blocked entirely, redirect the current window
                            window.location.href = checkoutUrl;
                            return; 
                        }
                    } else {
                        // Use the in-app browser for a seamless experience on mobile
                        await WebBrowser.openBrowserAsync(checkoutUrl, {
                            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
                            toolbarColor: Colors.PRIMARY,
                            enableBarCollapsing: true,
                            showTitle: true,
                        });
                    }

                    // Proceed to Status, passing PayMongo sessionId as the "receipt" 
                    // before going to the status tab
                    setReceiptImage({ uri: 'paymongo_source', id: response.sessionId });
                    setCurrentStep(3);

                } catch (error) {
                    if (popup) popup.close();
                    console.error("Payment Error:", error);
                    setPaymentError(error.message || "Failed to initialize payment gateway. Please try again or use another method.");
                } finally {
                    setIsSubmitting(false);
                }
            } else {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            setIsSubmitting(true);
            setTimeout(() => {
                setIsSubmitting(false);
                setCurrentStep(3); 
            }, 1200);
        } else if (currentStep === 3) {
            onContinue({
                paymentType,
                paymentMethod: selectedMethod,
                amountPaid: amountToPay,
                proofUploaded: receiptImage 
            });
        }
    };

    const getFooterConfig = () => {
        if (currentStep === 1) return { title: "Continue", disabled: !(selectedMethod && isSignatureValid) };
        if (currentStep === 2) return { title: "Submit Payment", disabled: !receiptImage };
        if (currentStep === 3) return { title: "View Status", disabled: false }; 
        return { title: "Continue", disabled: false };
    };

    const footerConfig = getFooterConfig();
    const lineFillPercentage = ((currentStep - 1) / 2) * 100; 

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomLoading 
                visible={isSubmitting} 
                message="Loading..." 
            />

            <CustomHeader 
                title={currentStep === 3 ? "Payment Status" : "Setup Payment"} 
                centerTitle={true} 
                onBackPress={currentStep === 3 ? null : handleHeaderBackPress} 
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
                            title="Method"
                            libraryName="Feather"
                            iconName="credit-card"
                            currentView={currentStep}
                            onStepPress={handleStepNavigation}
                        />
                        <ProgressStep
                            stepNum={2}
                            title="Upload"
                            libraryName="Feather"
                            iconName="upload"
                            currentView={currentStep}
                            onStepPress={handleStepNavigation}
                        />
                        <ProgressStep
                            stepNum={3}
                            title="Status"
                            libraryName="Feather"
                            iconName="check-circle"
                            currentView={currentStep}
                            onStepPress={handleStepNavigation}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.contentArea}>
                {currentStep === 1 && (
                    <MethodScreen 
                        amountToPay={amountToPay}
                        paymentType={effectivePaymentType}
                        setPaymentType={setPaymentType}
                        selectedMethod={selectedMethod}
                        setSelectedMethod={setSelectedMethod}
                        profileFullName={profileFullName}
                        setIsSignatureValid={setIsSignatureValid}
                        paymentError={paymentError}
                        isPayingBalance={isPayingBalance}
                    />
                )}
                {currentStep === 2 && (
                    <UploadScreen 
                        amountToPay={amountToPay}
                        selectedMethod={selectedMethod}
                        businessName={bookingData?.business?.name || 'Tour Provider'}
                        receiptImage={receiptImage}
                        setReceiptImage={setReceiptImage}
                    />
                )}
                {currentStep === 3 && (
                    <StatusScreen 
                        selectedMethod={selectedMethod} 
                        amountToPay={amountToPay} 
                        bookingId={bookingData?.id}
                        receiptImage={receiptImage}
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