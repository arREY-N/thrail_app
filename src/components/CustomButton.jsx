import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../../src/constants/colors';

const CustomButton = ({ 
    title, 
    onPress, 
    variant = 'primary',
    style,
    textStyle 
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
            <Text style={[styles.baseText, labelStyle, textStyle]}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    baseButton: {
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    baseText: {
        fontSize: 16,
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
        color: Colors.WHITE,
    },

    secondary: {
        backgroundColor: Colors.SECONDARY, 
    },
    textSecondary: {
        color: Colors.BLACK, 
    },

    outline: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT, 
        elevation: 0, 
    },
    textOutline: {
        color: Colors.Gray,
    },
});

export default CustomButton;