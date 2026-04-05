import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const QuickInfoCard = ({ booking }) => {
    const formattedDate = formatBookingDate(booking?.offer?.date) || 'TBA';
    const guideName = booking?.business?.name || 'N/A';

    const rawDuration = booking?.offer?.duration || 'N/A';
    const duration = rawDuration.replace(', ', '\n');

    return (
        <View style={styles.cardContainer}>
            
            <View style={styles.column}>
                <View style={styles.iconCircle}>
                    <CustomIcon library="Feather" name="calendar" size={20} color={Colors.PRIMARY} />
                </View>
                <CustomText variant="label" style={styles.valueText} numberOfLines={2}>
                    {formattedDate}
                </CustomText>
                <CustomText variant="caption" style={styles.labelText}>
                    DATE
                </CustomText>
            </View>

            <View style={styles.column}>
                <View style={styles.iconCircle}>
                    <CustomIcon library="Feather" name="clock" size={20} color={Colors.PRIMARY} />
                </View>
                <CustomText variant="label" style={styles.valueText} numberOfLines={2}>
                    {duration}
                </CustomText>
                <CustomText variant="caption" style={styles.labelText}>
                    DURATION
                </CustomText>
            </View>

            <View style={styles.column}>
                <View style={styles.iconCircle}>
                    <CustomIcon library="Feather" name="user" size={20} color={Colors.PRIMARY} />
                </View>
                <CustomText variant="label" style={styles.valueText} numberOfLines={2}>
                    {guideName}
                </CustomText>
                <CustomText variant="caption" style={styles.labelText}>
                    TOUR GUIDE
                </CustomText>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 12,
        marginHorizontal: 20,
        marginBottom: 16, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    column: { 
        flex: 1, 
        alignItems: 'center', 
        paddingHorizontal: 4,
    },
    iconCircle: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: '#F0F8F1', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 8,
    },
    valueText: { 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 2, 
        fontSize: 13,
    },
    labelText: { 
        fontSize: 10, 
        color: Colors.TEXT_SECONDARY, 
        textTransform: 'uppercase', 
        letterSpacing: 0.5,
    },
});

export default QuickInfoCard;