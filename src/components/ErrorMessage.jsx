import Feather from '@expo/vector-icons/Feather';

import React from 'react';
import {
    StyleSheet,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const ErrorMessage = ({ 
    error, 
    style,
    children
}) => {
    
    if (!error && !children) return null;

    return (
        <View style={[styles.container, style]}>
            <Feather 
                name="alert-circle" 
                size={18} 
                color={Colors.ERROR} 
                style={styles.icon}
            />
            
            <View style={styles.textContainer}>
                {children ? (
                    children
                ) : (
                    <CustomText variant="caption" style={styles.text}>
                        {error}
                    </CustomText>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.ERROR_BG, 
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,    
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    icon: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        color: Colors.ERROR,
        fontWeight: '500',
        lineHeight: 20,
    },
});

export default ErrorMessage;