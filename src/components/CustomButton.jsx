import React from 'react';
import {
    Pressable,
    StyleSheet
} from 'react-native';

import { Colors } from '@/src/constants/colors';

import CustomText from '@/src/components/CustomText';


const CustomButton = ({ 
    title, 
    onPress, 
    variant = 'primary',
    style,
    textStyle,
    children
}) => {
    
    let buttonStyle = styles.primary;
    let labelStyle = styles.textPrimary;

    if (variant === 'secondary') {
        buttonStyle = styles.secondary;
        labelStyle = styles.textSecondary;
    } else if (variant === 'outline') {
        buttonStyle = styles.outline;
        labelStyle = styles.textOutline;
    }

    return (
        <Pressable 
            onPress={onPress}
            style={({ pressed }) => [
                styles.baseButton, 
                buttonStyle, 
                style,
                pressed && styles.pressed
            ]}
        >
            {children ? (
                children
            ) : (
                <CustomText style={[styles.baseText, labelStyle, textStyle]}>
                    {title}
                </CustomText>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    baseButton: {
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    baseText: {
        fontWeight: 'bold',
    },
    pressed: {
        opacity: 0.75, 
        transform: [{ scale: 0.98 }] 
    },

    primary: {
        backgroundColor: Colors.PRIMARY,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    textPrimary: {
        color: Colors.TEXT_INVERSE,
    },

    secondary: {
        backgroundColor: Colors.WHITE, 
    },
    textSecondary: {
        color: Colors.TEXT_PRIMARY, 
    },

    outline: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT, 
        elevation: 0, 
    },
    textOutline: {
        color: Colors.TEXT_SECONDARY,
    },
});

export default CustomButton;