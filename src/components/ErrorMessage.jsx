import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../constants/colors';
import CustomText from './CustomText';

const ErrorMessage = ({ error, style }) => {
    
    if (!error) return null;

    return (
        <View style={[styles.container, style]}>
            <Feather name="alert-circle" size={18} color={Colors.ERROR} />
            <CustomText style={styles.text}>
                {error}
            </CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.ERROR_BG, 
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,    
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    text: {
        color: Colors.ERROR,
        fontSize: 14,
        flex: 1,      
        fontWeight: '500',
    },
});

export default ErrorMessage;