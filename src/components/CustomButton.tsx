/**
 * @file CustomButton.tsx
 * @description Standardized customizable button component for the Thrail application, supporting icons, states, and custom variants.
 */

import React, { ReactNode } from 'react';
import {
    GestureResponderEvent,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for the CustomButton component.
 * 
 * @param title - Optional button label text.
 * @param onPress - Callback when the button is pressed.
 * @param variant - Visual style variant of the button.
 * @param style - Custom styles for the button container.
 * @param textStyle - Custom styles for the button text label.
 * @param disabled - Boolean indicating if the button is disabled.
 * @param children - Optional custom sub-elements of the button.
 * @param icon - Name of the icon to render.
 * @param iconLibrary - Icon library name (e.g., 'Feather', 'Ionicons').
 * @param iconPosition - Position of the icon relative to the text label.
 * @param iconSize - Size of the icon to render.
 * @param iconColor - Color override for the icon.
 */
interface CustomButtonProps {
    title?: string;
    onPress?: (event: GestureResponderEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    children?: ReactNode;
    icon?: string;
    iconLibrary?: IconLibrary;
    iconPosition?: 'left' | 'right';
    iconSize?: number;
    iconColor?: string;
}

/**
 * CustomButton — A premium, reusable action button.
 */
const CustomButton: React.FC<CustomButtonProps> = ({ 
    title, 
    onPress, 
    variant = 'primary',
    style,
    textStyle,
    disabled,
    children,
    icon,
    iconLibrary,
    iconPosition = 'left',
    iconSize = 18,
    iconColor
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

    const defaultIconColor = iconColor ?? (variant === 'primary' || variant === 'destructive' ? Colors.WHITE : Colors.PRIMARY);

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
                <View style={styles.contentRow}>
                    {icon && iconLibrary && iconPosition === 'left' && (
                        <CustomIcon 
                            library={iconLibrary} 
                            name={icon} 
                            size={iconSize} 
                            color={defaultIconColor} 
                            style={styles.iconLeft}
                        />
                    )}
                    <CustomText 
                        style={[
                            styles.baseText as StyleProp<TextStyle>, 
                            labelStyle, 
                            textStyle
                        ]}
                    >
                        {title}
                    </CustomText>
                    {icon && iconLibrary && iconPosition === 'right' && (
                        <CustomIcon 
                            library={iconLibrary} 
                            name={icon} 
                            size={iconSize} 
                            color={defaultIconColor} 
                            style={styles.iconRight}
                        />
                    )}
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    baseButton: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadows: GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 8 }) as any,
    baseText: {
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
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
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    iconLeft: {},
    iconRight: {}
});

export default CustomButton;