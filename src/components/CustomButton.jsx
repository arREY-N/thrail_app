import React from 'react';
import {
    Platform,
    Pressable,
    StyleSheet
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const CustomButton = ({ 
    title, 
    onPress, 
    variant = 'primary',
    style,
    textStyle,
    disabled,
    children
}) => {
    
    let buttonStyle = styles.primary;
    let labelStyle = styles.textPrimary;
    let useShadow = true;

    if (variant === 'secondary') {
        buttonStyle = styles.secondary;
        labelStyle = styles.textSecondary;
    } else if (variant === 'outline') {
        buttonStyle = styles.outline;
        labelStyle = styles.textOutline;
        useShadow = false;
    }

    return (
        <Pressable 
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.baseButton, 
                buttonStyle, 
                useShadow && !disabled && styles.shadows,
                style,
                pressed && !disabled && styles.pressed,
                disabled && styles.disabledState
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
    },
    shadows: Platform.select({
        ios: {
            shadowColor: Colors.SHADOW,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        android: {
            elevation: 4,
        },
        web: {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)', 
        }
    }),
    baseText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    pressed: {
        opacity: 0.75, 
        transform: [{ scale: 0.98 }] 
    },
    disabledState: {
        opacity: 0.5,
        ...Platform.select({
            web: { cursor: 'not-allowed' }
        })
    },

    primary: {
        backgroundColor: Colors.PRIMARY,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
    },
    textPrimary: {
        color: Colors.WHITE,
    },

    secondary: {
        backgroundColor: Colors.WHITE, 
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
    },
    textSecondary: {
        color: Colors.TEXT_PRIMARY, 
    },

    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY, 
    },
    textOutline: {
        color: Colors.PRIMARY,
    },
});

export default CustomButton;