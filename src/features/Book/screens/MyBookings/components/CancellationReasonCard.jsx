import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const CancellationReasonCard = ({ reason }) => {
    if (!reason) return null;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <CustomIcon 
                    library="Feather" 
                    name="info" 
                    size={20} 
                    color={Colors.ERROR} 
                />
                <CustomText variant="label" style={styles.title}>
                    Cancellation Reason
                </CustomText>
            </View>
            <CustomText variant="body" style={styles.reasonText}>
                {reason}
            </CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.ERROR_BG,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    title: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 16,
    },
    reasonText: {
        color: Colors.ERROR,
        lineHeight: 22,
    },
});

export default CancellationReasonCard;