import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';

export interface StatusScreenProps {
    selectedMethod?: string | null;
    amountToPay?: number | string;
    bookingId?: string;
    referenceCode?: string;
}

const StatusScreen = ({ selectedMethod, amountToPay = 0, bookingId, referenceCode }: StatusScreenProps) => {
    const displayRef = referenceCode || `TRX-${bookingId?.substring(0, 8).toUpperCase() || '102938A'}`;

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.constrainer}>
                <View style={styles.headerSection}>
                    <View style={styles.iconCircle}>
                        <CustomIcon library="Feather" name="check" size={40} color={Colors.WHITE} />
                    </View>
                    
                    <CustomText variant="h1" style={styles.title}>
                        Payment Submitted!
                    </CustomText>
                    
                    <CustomText variant="body" style={styles.subtitle}>
                        Your payment receipt has been successfully sent to the 
                        tour provider for verification.
                    </CustomText>
                </View>

                <View style={styles.summaryCard}>
                    <CustomText variant="h3" style={styles.summaryTitle}>
                        Transaction Summary
                    </CustomText>
                    
                    <View style={styles.divider} />

                    <View style={styles.dataColumn}>
                        <CustomText variant="caption" style={styles.detailLabel}>
                            Reference No.
                        </CustomText>
                        <CustomText variant="body" style={styles.longValue} selectable={true}>
                            {displayRef}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" style={styles.detailLabel}>
                            Method
                        </CustomText>
                        <CustomText variant="body" style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                            {selectedMethod || 'N/A'}
                        </CustomText>
                    </View>

                    <View style={styles.detailRow}>
                        <CustomText variant="caption" style={styles.detailLabel}>
                            Amount Sent
                        </CustomText>
                        <CustomText variant="h3" style={styles.totalValue}>
                            ₱{Number(amountToPay).toFixed(2)}
                        </CustomText>
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
        paddingHorizontal: 16,
        alignItems: 'center'
    },
    scrollContent: { 
        paddingTop: 40, 
        paddingBottom: 120,
        alignItems: 'center'
    },
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 32 
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: Colors.SUCCESS, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 

        ...GlobalStyles.dropShadow(3), 
    },
    title: { 
        marginBottom: 12, 
        color: Colors.TEXT_PRIMARY 
    },
    subtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        paddingHorizontal: 20, 
        lineHeight: 22 
    },
    summaryCard: { 
        backgroundColor: Colors.WHITE, 
        width: '100%', 
        borderRadius: 20, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
         
         
         
         
        ...GlobalStyles.dropShadow(3), 
    },
    summaryTitle: { 
        marginBottom: 16, 
        fontWeight: '700', 
        color: Colors.TEXT_PRIMARY 
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginBottom: 16 
    },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    dataColumn: { 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        marginBottom: 16 
    },
    detailLabel: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 4 
    },
    detailValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        flex: 1, 
        textAlign: 'right', 
        marginLeft: 20 
    },
    longValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        textAlign: 'left' 
    },
    totalValue: { 
        color: Colors.PRIMARY 
    }
});

export default StatusScreen;
