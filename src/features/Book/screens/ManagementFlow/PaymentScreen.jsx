import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import StickyFooter from '@/src/features/Book/components/StickyFooter';

import { Colors } from '@/src/constants/colors';

const PaymentScreen = ({ selectedOffer, savedMethod, onContinue }) => {
    
    const [selectedMethod, setSelectedMethod] = useState(savedMethod || null);

    const paymentMethods = [
        { id: 'gcash', name: 'GCash', icon: 'smartphone', library: 'Feather' },
        { id: 'maya', name: 'Maya', icon: 'smartphone', library: 'Feather' },
    ];

    const totalPrice = selectedOffer?.price || 0;

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.summarySection}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Payment Summary
                    </CustomText>
                    
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <CustomText variant="body" color={Colors.TEXT_SECONDARY}>
                                Tour Package
                            </CustomText>
                            <CustomText variant="label">
                                ₱{totalPrice.toFixed(2)}
                            </CustomText>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.summaryRow}>
                            <CustomText variant="h2" color={Colors.TEXT_PRIMARY}>
                                Total
                            </CustomText>
                            <CustomText variant="h2" color={Colors.PRIMARY}>
                                ₱{totalPrice.toFixed(2)}
                            </CustomText>
                        </View>
                    </View>
                </View>

                <View style={styles.methodsSection}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Select Payment Method
                    </CustomText>

                    {paymentMethods.map((method) => {
                        const isSelected = selectedMethod === method.id;

                        return (
                            <TouchableOpacity 
                                key={method.id}
                                style={[
                                    styles.methodCard,
                                    isSelected && styles.selectedMethodCard
                                ]}
                                activeOpacity={0.8}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.methodIconWrapper}>
                                    <CustomIcon 
                                        library={method.library}
                                        name={method.icon}
                                        size={24}
                                        color={isSelected ? Colors.PRIMARY : Colors.GRAY_MEDIUM}
                                    />
                                </View>
                                
                                <CustomText 
                                    variant="label" 
                                    style={styles.methodName}
                                >
                                    {method.name}
                                </CustomText>

                                <View style={styles.radioOuter}>
                                    {isSelected && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <StickyFooter 
                title={`Pay ₱${(totalPrice).toFixed(2)}`} 
                onPress={() => onContinue({ paymentMethod: selectedMethod })} 
                isDisabled={!selectedMethod}
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
    sectionTitle: {
        paddingTop: 16,
        paddingHorizontal: 0,
        marginBottom: 16,
    },
    summarySection: {
        marginBottom: 24,
    },
    summaryCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 12,
    },
    methodsSection: {
        marginBottom: 24,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedMethodCard: {
        borderColor: Colors.PRIMARY,
        borderWidth: 2,
        backgroundColor: Colors.BACKGROUND,
    },
    methodIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodName: {
        flex: 1,
        fontSize: 16,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.GRAY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.PRIMARY,
    },
});

export default PaymentScreen;