import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const CancelWarningBox = () => {
    return (
        <View style={styles.cancelWarningBox}>
            <CustomIcon 
                library="Feather" 
                name="alert-triangle" 
                size={20} 
                color={Colors.ERROR} 
            />
            <View style={styles.warningTextWrapper}>
                <CustomText style={styles.warningTextBold}>
                    Are you sure you want to cancel?
                </CustomText>
                <CustomText style={styles.warningText}>
                    This action cannot be undone. Refunds (if applicable) may take 3-7 business days to process.
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cancelWarningBox: { 
        marginTop: 8, 
        backgroundColor: Colors.ERROR_BG, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER, 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 12, 
    },
    warningTextWrapper: { 
        flex: 1, 
    },
    warningTextBold: { 
        color: Colors.ERROR, 
        fontWeight: 'bold', 
        marginBottom: 4, 
    },
    warningText: { 
        color: Colors.ERROR, 
        lineHeight: 20, 
    },
});

export default CancelWarningBox;