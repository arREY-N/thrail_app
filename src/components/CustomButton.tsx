import React, { ReactNode } from 'react';
import {
    GestureResponderEvent,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    TextStyle,
    ViewStyle
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * A custom button component that supports various styles, sizes, and states.
 */
interface CustomButtonProps {
    title?: string;
    onPress?: (event: GestureResponderEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    children?: ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
    title, 
    onPress, 
    variant = 'primary',
    style,
    textStyle,
    disabled,
    children
}) => {
    
    let buttonStyle = styles.primary as StyleProp<ViewStyle>;
    let labelStyle = styles.textPrimary as StyleProp<TextStyle>;
    let useShadow: boolean = true;

    if (variant === 'secondary') {
        buttonStyle = styles.secondary as StyleProp<ViewStyle>;
        labelStyle = styles.textSecondary as StyleProp<TextStyle>;
    } else if (variant === 'outline') {
        buttonStyle = styles.outline as StyleProp<ViewStyle>;
        labelStyle = styles.textOutline as StyleProp<TextStyle>;
        useShadow = false;
    } else if (variant === 'destructive') {
        buttonStyle = styles.destructive as StyleProp<ViewStyle>;
        labelStyle = styles.textDestructive as StyleProp<TextStyle>;
    }

    return (
        <Pressable 
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.baseButton as StyleProp<ViewStyle>, 
                buttonStyle, 
                useShadow && !disabled && (styles.shadows as StyleProp<ViewStyle>),
                style,
                pressed && !disabled && (styles.pressed as StyleProp<ViewStyle>),
                disabled && (styles.disabledState as StyleProp<ViewStyle>)
            ]}
        >
            {children ? (
                children
            ) : (
                <CustomText 
                    style={[
                        styles.baseText as StyleProp<TextStyle>, 
                        labelStyle, 
                        textStyle
                    ]}
                >
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
    shadows: GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 8 }) as any,
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
            web: { cursor: 'not-allowed' } as any
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
        borderColor: Colors.PRIMARY,
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

    destructive: {
        backgroundColor: Colors.ERROR,
        borderWidth: 1.5,
        borderColor: Colors.ERROR,
    },
    textDestructive: {
        color: Colors.WHITE,
    }
});

export default CustomButton;