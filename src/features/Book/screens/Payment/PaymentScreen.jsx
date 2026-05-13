import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/core/stores/authStore';
import ProgressStep from '@/src/features/Book/components/ProgressStep';
import { checkIfMinor } from '@/src/utils/dateFormatter';

import MethodScreen from '@/src/features/Book/screens/Payment/MethodScreen';
import StatusScreen from '@/src/features/Book/screens/Payment/StatusScreen';

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
    
    // ✅ Safely construct the hiker's full name
    const hikerFirstName = bookingData?.user?.firstname || profile?.firstname || '';
    const hikerLastName = bookingData?.user?.lastname || profile?.lastname || '';
    const hikerFullName = `${hikerFirstName} ${hikerLastName}`.trim();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isWaitingForVerification, setIsWaitingForVerification] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    
    const [paymentType, setPaymentType] = useState('full');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [isSignatureValid, setIsSignatureValid] = useState(false);

    const payments = Array.isArray(bookingData?.payment) ? bookingData.payment : [];
    const latestPayment = payments[payments.length - 1];

    const totalPrice = bookingData?.offer?.price || 0;
    const amountPaidAlready = payments.reduce((sum, p) => {
        if (p.status === 'captured') return sum + (p.amount || 0);
        return sum;
    }, 0);
    const remainingBalance = totalPrice - amountPaidAlready;
    
    const isPayingBalance = amountPaidAlready > 0;
    const effectivePaymentType = isPayingBalance ? 'full' : paymentType;
    const amountToPay = isPayingBalance 
        ? remainingBalance 
        : (effectivePaymentType === 'full' ? totalPrice : totalPrice / 2);

    // ✅ FIXED: Pass the raw date directly to your utility function
    const rawBirthday = bookingData?.user?.birthday || profile?.birthday;
    const isUserMinor = checkIfMinor(rawBirthday);
    
    const expectedSignatureName = isUserMinor && bookingData?.emergencyContact?.name 
        ? bookingData.emergencyContact.name.trim() 
        : hikerFullName;

    useEffect(() => {
        if (!isWaitingForVerification || !latestPayment) return;

        if (latestPayment?.status === 'failed') {
            setIsWaitingForVerification(false);
            setPaymentError("Your payment failed or was declined by the provider. Please check your balance and try again.");
            return;
        }

        if (latestPayment?.status === 'expired') {
            setIsWaitingForVerification(false);
            setPaymentError("Your payment session expired because it took too long. Please initiate a new payment.");
            return;
        }

        const isNowPaid = 
            bookingData.status === 'paid' || 
            bookingData.status === 'completed' || 
            (bookingData.status === 'downpayment' && effectivePaymentType === 'downpayment');

        if (isNowPaid || latestPayment?.status === 'captured') {
            setIsWaitingForVerification(false);
            setCurrentStep(2); 
        }
    }, [bookingData, isWaitingForVerification, effectivePaymentType, latestPayment]);

    const handleHeaderBackPress = () => {
        if (isWaitingForVerification) {
            setIsWaitingForVerification(false); 
            return;
        }
        if (currentStep === 2) {
            handleNextStep(); 
        } else {
            onBackPress();
        }
    };

    const handleStepNavigation = (step) => {
        if (currentStep === 2) return; 
        if (step > currentStep || isSubmitting || isWaitingForVerification) return; 
        setCurrentStep(step);
    };

    const handleNextStep = async () => {
        if (currentStep === 1) {
            setPaymentError(null);

            if (['gcash', 'maya'].includes(selectedMethod)) {
                let popup = null;
                if (Platform.OS === 'web') {
                    const width = 450;
                    const height = 750;
                    const left = (window.screen.width / 2) - (width / 2);
                    const top = (window.screen.height / 2) - (height / 2);
                    popup = window.open(
                        '', 
                        'PayMongoCheckout', 
                        `toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${width}, height=${height}, top=${top}, left=${left}`
                    );
                }

                setIsSubmitting(true);
                try {
                    const urlParams = { 
                        queryParams: { 
                            bookingId: bookingData?.id, 
                            view: 'overview' 
                        } 
                    };
                    const rawUrl = Linking.createURL('book/list', urlParams);
                    const appUrl = Platform.OS === 'web' 
                        ? rawUrl 
                        : Linking.createURL('book/list', { scheme: 'thrailapp', ...urlParams });
                    
                    const projectId = app.options.projectId || 'thrail';
                    const redirectFunctionUrl = `https://us-central1-${projectId}.cloudfunctions.net/paymongoRedirect`;
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
                            setIsWaitingForVerification(true);
                            
                            const pollTimer = setInterval(() => {
                                if (popup.closed) {
                                    clearInterval(pollTimer);
                                    setTimeout(() => {
                                        setIsWaitingForVerification(prev => {
                                            if (prev) {
                                                setPaymentError("You closed the payment window. If you didn't complete the payment, please try again. If you already paid, your booking will automatically update shortly.");
                                                return false;
                                            }
                                            return prev;
                                        });
                                    }, 2000); 
                                }
                            }, 1000);

                        } else {
                            window.location.href = checkoutUrl;
                            setIsWaitingForVerification(true);
                        }
                    } else {
                        const browserResult = await WebBrowser.openAuthSessionAsync(
                            checkoutUrl, 
                            appUrl
                        );
                        
                        if (browserResult.type === 'cancel') {
                            setIsWaitingForVerification(true); 
                            setTimeout(() => {
                                setIsWaitingForVerification(prev => {
                                    if (prev) {
                                        setPaymentError("The payment browser was closed. If you didn't complete the payment, please try again. If you already paid, your booking will automatically update shortly.");
                                        return false;
                                    }
                                    return prev;
                                });
                            }, 3000);
                        } else {
                            setIsWaitingForVerification(true);
                        }
                    }

                } catch (error) {
                    if (popup) popup.close();
                    console.error("Payment Error:", error);
                    setPaymentError(
                        error.message || "Failed to initialize payment gateway. Please try again."
                    );
                } finally {
                    setIsSubmitting(false);
                }
            } 
        } else if (currentStep === 2) {
            onContinue({
                paymentType: effectivePaymentType,
                paymentMethod: selectedMethod,
                amountPaid: latestPayment?.amount || amountToPay,
            });
        }
    };

    const getFooterConfig = () => {
        if (isWaitingForVerification) return { 
            title: "Cancel Verification", 
            onPress: () => setIsWaitingForVerification(false), 
            variant: "outline" 
        };
        if (currentStep === 1) return { 
            title: "Continue to Payment", 
            disabled: !(selectedMethod && isSignatureValid) 
        };
        if (currentStep === 2) return { 
            title: "Return to Bookings", 
            disabled: false 
        }; 
        return { 
            title: "Continue", 
            disabled: false 
        };
    };

    const footerConfig = getFooterConfig();
    const lineFillPercentage = ((currentStep - 1) / 1) * 100;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomLoading 
                visible={isSubmitting || isWaitingForVerification} 
                message={
                    isWaitingForVerification 
                        ? "Verifying Payment with Gateway..." 
                        : "Opening Secure Gateway..."
                } 
            />

            <CustomHeader 
                title={currentStep === 2 ? "Payment Status" : "Setup Payment"} 
                centerTitle={true} 
                onBackPress={currentStep === 2 ? null : handleHeaderBackPress} 
            />

            <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                    <View style={styles.lineWrapper}>
                        <View style={styles.progressLineBackground} />
                        <View 
                            style={[
                                styles.progressLineActive, 
                                { width: `${lineFillPercentage}%` }
                            ]} 
                        />
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
                        profileFullName={expectedSignatureName}
                        setIsSignatureValid={setIsSignatureValid}
                        paymentError={paymentError}
                        isPayingBalance={isPayingBalance}
                        // ✅ Pass the Minor props down
                        isMinor={isUserMinor}
                        minorName={hikerFullName}
                    />
                )}
                {currentStep === 2 && (
                    <StatusScreen 
                        selectedMethod={latestPayment?.gateway || selectedMethod} 
                        amountToPay={latestPayment?.amount || amountToPay} 
                        bookingId={bookingData?.id}
                        referenceCode={latestPayment?.referenceCode || latestPayment?.sessionId}
                    />
                )}
            </View>

            <CustomStickyFooter
                primaryButton={{
                    title: footerConfig.title,
                    onPress: footerConfig.onPress || handleNextStep,
                    disabled: footerConfig.disabled,
                    variant: footerConfig.variant || "primary"
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
        shadowOffset: { 
            width: 0, 
            height: 4 
        },
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