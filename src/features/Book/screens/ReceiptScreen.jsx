import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import StickyFooter from '@/src/features/Book/components/StickyFooter';

import { Colors } from '@/src/constants/colors';

const ReceiptScreen = ({ bookingData, selectedOffer, onFinish }) => {
    
    const finalAmount = selectedOffer?.price || 0;

    const transactionId = `TRX-${Math.floor(Math.random() * 1000000000)}`;

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.successHeader}>
                    <View style={styles.iconCircle}>
                        <CustomIcon 
                            library="Feather" 
                            name="check" 
                            size={48} 
                            color={Colors.WHITE} 
                        />
                    </View>
                    <CustomText variant="h1" style={styles.successTitle}>
                        Booking Successful!
                    </CustomText>
                    <CustomText variant="body" style={styles.successSubtitle}>
                        Your reservation has been confirmed.
                    </CustomText>
                </View>

                <View style={styles.receiptCard}>
                    
                    <CustomText variant="h2" style={styles.receiptTitle}>
                        Booking Details
                    </CustomText>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                            Transaction ID
                        </CustomText>
                        <CustomText variant="label">
                            {transactionId}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                            Date
                        </CustomText>
                        <CustomText variant="label">
                            {selectedOffer?.date || "TBA"}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                            Guide / Package
                        </CustomText>
                        <CustomText variant="label">
                            {selectedOffer?.business?.name || "Independent Guide"}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                            Hiker Name
                        </CustomText>
                        <CustomText variant="label">
                            {bookingData.hikerDetails?.fullName || "N/A"}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                            Payment Method
                        </CustomText>
                        <CustomText variant="label" style={styles.capitalize}>
                            {bookingData.paymentMethod || "N/A"}
                        </CustomText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <CustomText variant="h2" color={Colors.TEXT_PRIMARY}>
                            Total Paid
                        </CustomText>
                        <CustomText variant="h2" color={Colors.PRIMARY}>
                            ₱{finalAmount.toFixed(2)}
                        </CustomText>
                    </View>

                </View>

            </ScrollView>

            <StickyFooter 
                title="Return to Trail" 
                onPress={onFinish} 
                isDisabled={false} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 16,
    },
    scrollContent: {
        paddingBottom: 100, 
    },
    
    successHeader: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.SUCCESS,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        
        shadowColor: Colors.SUCCESS,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    successTitle: {
        color: Colors.SUCCESS,
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },

    receiptCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    receiptTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    capitalize: {
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default ReceiptScreen;