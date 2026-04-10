import React from 'react';
import {
    Platform,
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
    disabled,
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
            disabled={disabled}
            style={({ pressed }) => [
                styles.baseButton, 
                buttonStyle, 
                style,
                pressed && !disabled && styles.pressed,
                disabled && { opacity: 0.5 }
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

        ...Platform.select({
            ios: {
                shadowColor: Colors.SHADOW,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', 
            }
        })
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

        ...Platform.select({
            ios: {
                shadowOpacity: 0,
            },
            android: {
                elevation: 0,
            },
            web: {
                boxShadow: 'none',
            }
        })
    },
    textOutline: {
        color: Colors.TEXT_SECONDARY,
    },
});

export default CustomButton;