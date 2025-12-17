import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/colors';

const CustomButton = ({ title, onPress, variant = 'primary', style }) => {
    
    const buttonStyle = variant === 'primary' ? styles.primary : styles.secondary;
    const textStyle = variant === 'primary' ? styles.textPrimary : styles.textSecondary;

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
            <Text style={[styles.baseText, textStyle]}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    baseButton: {
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
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
        backgroundColor: Colors.PrimaryColor,
    },
    textPrimary: {
        color: Colors.WHITE,
    },

    secondary: {
        backgroundColor: Colors.SecondaryColor, 
    },
    textSecondary: {
        color: Colors.BLACK, 
    },
});

export default CustomButton;