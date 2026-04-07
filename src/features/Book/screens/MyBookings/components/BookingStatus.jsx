import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const getStepIndex = (status) => {
    switch (status) {
        case 'for-reservation':
        case 'pending-docs':
        case 'for-reschedule':
            return 0; // Pending
        case 'for-payment':
        case 'approved-docs':
            return 1; // Approved
        case 'paid':
            return 2; // Paid
        case 'completed':
            return 3; // Confirmed Payment
        default:
            return -1; // Cancelled
    }
};

const BookingStatus = ({ status }) => {
    const currentStep = getStepIndex(status);

    if (currentStep === -1) return null;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <CustomIcon 
                    library="Feather" 
                    name="list" 
                    size={18} 
                    color={Colors.TEXT_PRIMARY} 
                />
                <CustomText variant="label" style={styles.title}>
                    Booking Status
                </CustomText>
            </View>

            <View style={styles.trackerContainer}>
                
                <View style={styles.stepWrapper}>
                    <View style={[styles.circle, currentStep >= 0 ? styles.activeCircle : styles.inactiveCircle]}>
                        <CustomIcon 
                            library="Feather" 
                            name="clock" 
                            size={16} 
                            color={currentStep >= 0 ? Colors.WHITE : Colors.TEXT_SECONDARY} 
                        />
                    </View>
                    <CustomText 
                        variant="caption" 
                        style={[styles.stepText, currentStep >= 0 && styles.activeText]}
                    >
                        Pending
                    </CustomText>
                </View>

                <View style={[styles.line, currentStep >= 1 ? styles.activeLine : styles.inactiveLine]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.circle, currentStep >= 1 ? styles.activeCircle : styles.inactiveCircle]}>
                        <CustomIcon 
                            library="Feather" 
                            name="check" 
                            size={16} 
                            color={currentStep >= 1 ? Colors.WHITE : Colors.TEXT_SECONDARY} 
                        />
                    </View>
                    <CustomText 
                        variant="caption" 
                        style={[styles.stepText, currentStep >= 1 && styles.activeText]}
                    >
                        Approved
                    </CustomText>
                </View>

                <View style={[styles.line, currentStep >= 2 ? styles.activeLine : styles.inactiveLine]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.circle, currentStep >= 2 ? styles.activeCircle : styles.inactiveCircle]}>
                        <CustomIcon 
                            library="FontAwesome5" 
                            name="money-bill-wave" 
                            size={14} 
                            color={currentStep >= 2 ? Colors.WHITE : Colors.TEXT_SECONDARY} 
                        />
                    </View>
                    <CustomText 
                        variant="caption" 
                        style={[styles.stepText, currentStep >= 2 && styles.activeText]}
                    >
                        Paid
                    </CustomText>
                </View>

                <View style={[styles.line, currentStep >= 3 ? styles.activeLine : styles.inactiveLine]} />

                <View style={styles.stepWrapper}>
                    <View style={[styles.circle, currentStep >= 3 ? styles.activeCircle : styles.inactiveCircle]}>
                        <CustomIcon 
                            library="Feather" 
                            name="check" 
                            size={16} 
                            color={currentStep >= 3 ? Colors.WHITE : Colors.TEXT_SECONDARY} 
                        />
                    </View>
                    <CustomText 
                        variant="caption" 
                        style={[styles.stepText, currentStep >= 3 && styles.activeText]}
                    >
                        Confirmed
                    </CustomText>
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { 
            width: 0, 
            height: 2 
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    trackerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    stepWrapper: {
        alignItems: 'center',
        width: 60,
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeCircle: {
        backgroundColor: Colors.PRIMARY,
    },
    inactiveCircle: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    line: {
        flex: 1,
        height: 2,
        marginTop: 18, 
        marginHorizontal: -10, 
    },
    activeLine: {
        backgroundColor: Colors.PRIMARY,
    },
    inactiveLine: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    stepText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    activeText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});

export default BookingStatus;