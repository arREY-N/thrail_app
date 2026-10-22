import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import TermsSignature from '@/src/features/Book/components/TermsSignature';
import { IconLibrary } from '@/src/types/ui.types';
import React, { useCallback, useEffect, useRef } from 'react';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
} from '@/src/components/Tutorial/Tutorial';

export interface PaymentMethodOption {
    id: string;
    name: string;
    icon: string;
    library: IconLibrary;
}

const paymentMethods: PaymentMethodOption[] = [
    { 
        id: 'gcash', 
        name: 'GCash', 
        icon: 'smartphone', 
        library: 'Feather' 
    },
    { 
        id: 'maya', 
        name: 'Maya', 
        icon: 'smartphone', 
        library: 'Feather' 
    },
];

export interface MethodScreenProps {
    amountToPay: number;
    paymentType: 'full' | 'downpayment' | string;
    setPaymentType: (type: 'full' | 'downpayment') => void;
    selectedMethod: string | null;
    setSelectedMethod: (method: string) => void;
    profileFullName: string;
    setIsSignatureValid: (isValid: boolean) => void;
    paymentError?: string | null;
    isPayingBalance: boolean;
    isMinor: boolean;
    minorName?: string;
    activeTutorialStep?: string;
    isTutorialVisible?: boolean;
}

const MethodScreen = ({
    amountToPay,
    paymentType,
    setPaymentType,
    selectedMethod,
    setSelectedMethod,
    profileFullName,
    setIsSignatureValid,
    paymentError,
    isPayingBalance,
    isMinor,
    minorName,
    activeTutorialStep,
    isTutorialVisible,
}: MethodScreenProps) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const optionsRef = useRef<View>(null);
    const walletRef = useRef<View>(null);
    const termsRef = useRef<View>(null);
    const walletOffsetY = useRef<number>(0);
    const termsOffsetY = useRef<number>(0);

    const measureOptionsNow = useCallback(() => {
        optionsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_options', { x, y, width, height });
            }
        });
    }, []);

    const measureWalletNow = useCallback(() => {
        walletRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_wallet', { x, y, width, height });
            }
        });
    }, []);

    const measureTermsNow = useCallback(() => {
        termsRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_terms', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const unsub1 = registerMeasureCallback('payment_options', measureOptionsNow);
        const unsub2 = registerMeasureCallback('payment_wallet', measureWalletNow);
        const unsub3 = registerMeasureCallback('payment_terms', measureTermsNow);
        return () => {
            unsub1();
            unsub2();
            unsub3();
        };
    }, [measureOptionsNow, measureWalletNow, measureTermsNow]);

    const prevTutorialVisible = useRef(isTutorialVisible);
    useEffect(() => {
        if (prevTutorialVisible.current && !isTutorialVisible) {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
        prevTutorialVisible.current = isTutorialVisible;
    }, [isTutorialVisible]);

    useEffect(() => {
        if (!isTutorialVisible) return;
        if (activeTutorialStep === 'payment_options' || activeTutorialStep === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            requestTargetMeasurement(activeTutorialStep);
        } else if (activeTutorialStep === 'payment_wallet') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, walletOffsetY.current - 24),
                animated: true,
            });
            requestTargetMeasurement('payment_wallet');
        } else if (activeTutorialStep === 'payment_terms') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, termsOffsetY.current - 40),
                animated: true,
            });
            requestTargetMeasurement('payment_terms');
        }
    }, [isTutorialVisible, activeTutorialStep]);

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.constrainer}>
                <View style={styles.section}>
                    
                    <View
                        ref={isPayingBalance ? optionsRef : undefined}
                        collapsable={false}
                        onLayout={() => {
                            if (isPayingBalance && isTutorialMeasurementActive()) measureOptionsNow();
                        }}
                        style={styles.amountDisplayCard}
                    >
                        <CustomText variant="caption" style={styles.amountDisplayLabel}>
                            Amount to Pay
                        </CustomText>
                        <CustomText variant="h1" style={styles.amountDisplayText}>
                            ₱{amountToPay.toFixed(2)}
                        </CustomText>
                    </View>

                    {!isPayingBalance && (
                        <>
                            <CustomText variant="h2" style={styles.sectionTitle}>
                                Payment Options
                            </CustomText>
                            
                            <View
                                ref={!isPayingBalance ? optionsRef : undefined}
                                collapsable={false}
                                onLayout={() => {
                                    if (!isPayingBalance && isTutorialMeasurementActive()) measureOptionsNow();
                                }}
                                style={styles.toggleContainer}
                            >
                                <TouchableOpacity 
                                    style={[
                                        styles.toggleBtn, 
                                        paymentType === 'full' && styles.toggleBtnActive
                                    ]}
                                    onPress={() => setPaymentType('full')} 
                                    activeOpacity={0.8}
                                >
                                    <CustomText 
                                        style={[
                                            styles.toggleText, 
                                            paymentType === 'full' && styles.toggleTextActive
                                        ]}
                                    >
                                        Pay in Full
                                    </CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[
                                        styles.toggleBtn, 
                                        paymentType === 'downpayment' && styles.toggleBtnActive
                                    ]}
                                    onPress={() => setPaymentType('downpayment')} 
                                    activeOpacity={0.8}
                                >
                                    <CustomText 
                                        style={[
                                            styles.toggleText, 
                                            paymentType === 'downpayment' && styles.toggleTextActive
                                        ]}
                                    >
                                        50% Downpayment
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            {paymentType === 'downpayment' && (
                                <View style={styles.infoWarningContainer}>
                                    <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.WARNING} />
                                    <CustomText variant="caption" style={styles.infoWarningText}>
                                        The remaining balance must be paid directly to the guide on or before the hike date.
                                    </CustomText>
                                </View>
                            )}
                        </>
                    )}

                    {paymentError && (
                        <View style={styles.errorBanner}>
                            <CustomIcon library="Feather" name="x-circle" size={18} color={Colors.ERROR} />
                            <CustomText variant="caption" style={styles.errorBannerText}>
                                {paymentError}
                            </CustomText>
                        </View>
                    )}

                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Select Wallet
                    </CustomText>

                    <View
                        ref={walletRef}
                        collapsable={false}
                        style={styles.walletContainer}
                        onLayout={(e) => {
                            walletOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) measureWalletNow();
                        }}
                    >
                    {paymentMethods.map((method, index) => {
                        const isSelected = selectedMethod === method.id;
                        const isLast = index === paymentMethods.length - 1;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                style={[styles.methodCard, isSelected && styles.selectedMethodCard, isLast && styles.methodCardLast]}
                                activeOpacity={0.7}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.methodIconWrapper}>
                                    <CustomIcon library={method.library} name={method.icon} size={20} color={isSelected ? Colors.PRIMARY : Colors.TEXT_PLACEHOLDER} />
                                </View>
                                <CustomText variant="body" style={styles.methodName}>
                                    {method.name}
                                </CustomText>
                                <View style={styles.radioOuter}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    </View>
                    <View
                        ref={termsRef}
                        collapsable={false}
                        style={styles.termsWrapper}
                        onLayout={(e) => {
                            termsOffsetY.current = e.nativeEvent.layout.y;
                            if (isTutorialMeasurementActive()) measureTermsNow();
                        }}
                    >
                        <TermsSignature 
                            expectedName={profileFullName}
                            isMinor={isMinor}
                            minorName={minorName}
                            requireReadToAgree={false}
                            onValidChange={setIsSignatureValid}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16
    },
    scrollContent: { 
        paddingBottom: 120
    },
    section: { 
        paddingTop: 24 
    },
    sectionTitle: { 
        marginBottom: 16, 
        color: Colors.TEXT_PRIMARY 
    },
    amountDisplayCard: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        padding: 24, 
        borderRadius: 16, 
        marginBottom: 24, 
        borderWidth: 1, 
        borderColor: Colors.STATUS_APPROVED_BORDER 
    },
    amountDisplayLabel: { 
        color: Colors.TEXT_SECONDARY, 
        textTransform: 'uppercase', 
        letterSpacing: 1, 
        marginBottom: 8 
    },
    amountDisplayText: { 
        color: Colors.PRIMARY 
    },
    toggleContainer: { 
        flexDirection: 'row', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderRadius: 12, 
        padding: 4, 
        marginBottom: 20 
    },
    toggleBtn: { 
        flex: 1, 
        paddingVertical: 12, 
        alignItems: 'center', 
        borderRadius: 8 
    },
    toggleBtnActive: { 
        backgroundColor: Colors.WHITE, 
         
         
         
         
        ...GlobalStyles.dropShadow(3), 
    },
    toggleText: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_SECONDARY 
    },
    toggleTextActive: { 
        color: Colors.PRIMARY 
    },
    infoWarningContainer: { 
        backgroundColor: Colors.STATUS_WARNING_BG, 
        padding: 12, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: Colors.STATUS_WARNING_BORDER, 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 8, 
        marginBottom: 24 
    },
    infoWarningText: { 
        flex: 1, 
        color: Colors.STATUS_WARNING_TEXT, 
        lineHeight: 18 
    },
    errorBanner: { 
        backgroundColor: Colors.ERROR_BG, 
        padding: 12, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 24 
    },
    errorBannerText: { 
        flex: 1, 
        color: Colors.ERROR, 
        lineHeight: 18, 
        fontWeight: '500' 
    },
    walletContainer: {
        width: '100%',
        marginBottom: 24,
    },
    methodCardLast: {
        marginBottom: 0,
    },
    methodCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    selectedMethodCard: { 
        borderColor: Colors.PRIMARY, 
        borderWidth: 2, 
        backgroundColor: Colors.BACKGROUND 
    },
    methodIconWrapper: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 16 
    },
    methodName: { 
        flex: 1, 
        fontWeight: '600', 
        color: Colors.TEXT_PRIMARY 
    },
    radioOuter: { 
        width: 20, 
        height: 20, 
        borderRadius: 10, 
        borderWidth: 2, 
        borderColor: Colors.GRAY_LIGHT, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    radioInner: { 
        width: 10, 
        height: 10, 
        borderRadius: 5, 
        backgroundColor: Colors.PRIMARY 
    },
    termsWrapper: { 
        marginTop: 16 
    }
});

export default MethodScreen;
