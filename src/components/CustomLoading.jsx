import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const CustomLoading = ({ visible = true, message = "Loading..." }) => {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.PRIMARY || Colors.BLACK} />
                
                <CustomText variant="body" style={styles.text}>
                    {message}
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        elevation: 10,
    },
    container: {
        backgroundColor: Colors.WHITE,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        
        shadowColor: Colors.SHADOW || '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        minWidth: 150,
    },
    text: {
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY || '#000',
    }
});

export default CustomLoading;