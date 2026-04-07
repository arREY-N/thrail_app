import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const PaymentStatusScreen = ({ 
    bookingData, 
    onBackPress, 
    onViewDetails,
    submittedAmount
}) => {
    const businessName = bookingData?.business?.name || "Tour Provider";
    const databasePaid = bookingData?.payment?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const displayAmount = databasePaid > 0 ? databasePaid : (submittedAmount || bookingData?.offer?.price || 0);

    const steps = [
        { 
            id: 1, 
            label: 'Proof Uploaded', 
            desc: `Your payment receipt for ₱${displayAmount.toFixed(2)} was received.`,
            isDone: true 
        },
        { 
            id: 2, 
            label: 'Payment Verification', 
            desc: `${businessName} is confirming the transaction with their bank/wallet.`,
            isDone: false 
        },
        { 
            id: 3, 
            label: 'Booking Confirmed', 
            desc: 'Your official E-Ticket and itinerary will be unlocked.',
            isDone: false 
        },
    ];

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Payment Status" 
                centerTitle={true} 
                onBackPress={onBackPress} 
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.headerSection}>
                    <View style={styles.iconCircle}>
                        <CustomIcon 
                            library="Feather" 
                            name="shield" 
                            size={36} 
                            color={Colors.WHITE} 
                        />
                    </View>
                    <CustomText variant="h1" style={styles.title}>
                        Verifying Payment
                    </CustomText>
                    <CustomText variant="body" style={styles.subtitle}>
                        Please wait while <CustomText style={styles.boldText}>{businessName}</CustomText> verifies your transaction reference.
                    </CustomText>
                </View>

                <View style={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <View key={step.id} style={styles.stepRow}>
                            <View style={styles.indicatorColumn}>
                                <View style={[
                                    styles.dot, 
                                    step.isDone ? styles.dotDone : styles.dotPending
                                ]}>
                                    {step.isDone && (
                                        <CustomIcon 
                                            library="Feather" 
                                            name="check" 
                                            size={12} 
                                            color={Colors.WHITE} 
                                        />
                                    )}
                                </View>
                                {index !== steps.length - 1 && (
                                    <View style={[
                                        styles.line, 
                                        step.isDone ? styles.lineDone : styles.linePending
                                    ]} />
                                )}
                            </View>
                            
                            <View style={styles.textColumn}>
                                <CustomText 
                                    variant="label" 
                                    style={[
                                        styles.stepLabel, 
                                        step.isDone ? styles.textDone : styles.textPending
                                    ]}
                                >
                                    {step.label}
                                </CustomText>
                                <CustomText variant="caption" style={styles.stepDesc}>
                                    {step.desc}
                                </CustomText>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.infoBox}>
                    <CustomIcon 
                        library="Feather" 
                        name="clock" 
                        size={20} 
                        color={Colors.PRIMARY} 
                    />
                    <CustomText variant="caption" style={styles.infoText}>
                        Payment verification usually takes a few hours. We will notify you the moment your booking is officially confirmed.
                    </CustomText>
                </View>
            </ScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: "View Booking Details",
                    onPress: onViewDetails
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingHorizontal: 24, 
        paddingTop: 32, 
        paddingBottom: 120,
    },
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 40,
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    title: { 
        marginBottom: 12, 
        textAlign: 'center',
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    boldText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    stepsContainer: {
        width: '100%',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 16,
    },
    indicatorColumn: {
        alignItems: 'center',
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    dotDone: {
        backgroundColor: Colors.SUCCESS,
    },
    dotPending: {
        backgroundColor: Colors.GRAY_LIGHT,
        borderWidth: 2,
        borderColor: Colors.WHITE,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    lineDone: {
        backgroundColor: Colors.SUCCESS,
    },
    linePending: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    textColumn: {
        flex: 1,
        paddingBottom: 28,
    },
    stepLabel: {
        fontSize: 15,
        marginBottom: 4,
    },
    textDone: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    textPending: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    stepDesc: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'flex-start',
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
});

export default PaymentStatusScreen;