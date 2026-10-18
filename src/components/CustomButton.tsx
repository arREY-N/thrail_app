/**
 * @file CustomButton.tsx
 * @description Standardized customizable button component for the Thrail application, supporting icons, states, and custom variants.
 */

import React, { ReactNode, useContext, useRef } from 'react';
import {
    ActivityIndicator,
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
import { ToastContext, ToastType } from '@/src/components/Toast/Toast';
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
 * @param isLoading - Boolean indicating if the button is in a loading/processing state.
 * @param children - Optional custom sub-elements of the button.
 * @param icon - Name of the icon to render.
 * @param iconLibrary - Icon library name (e.g., 'Feather', 'Ionicons').
 * @param iconPosition - Position of the icon relative to the text label.
 * @param iconSize - Size of the icon to render.
 * @param iconColor - Color override for the icon.
 */
export type ButtonValidationState = 'valid' | 'idle' | 'error';

/**
 * Props for the CustomButton component.
 * 
 * @param title - Optional button label text.
 * @param onPress - Callback when the button is pressed.
 * @param variant - Visual style variant of the button.
 * @param style - Custom styles for the button container.
 * @param textStyle - Custom styles for the button text label.
 * @param disabled - Boolean indicating if the button is disabled.
 * @param isLoading - Boolean indicating if the button is in a loading/processing state.
 * @param children - Optional custom sub-elements of the button.
 * @param icon - Name of the icon to render.
 * @param iconLibrary - Icon library name (e.g., 'Feather', 'Ionicons').
 * @param iconPosition - Position of the icon relative to the text label.
 * @param iconSize - Size of the icon to render.
 * @param iconColor - Color override for the icon.
 * @param disabledToastMessage - Optional toast message to show when button is tapped while disabled.
 * @param disabledToastType - Semantic type of disabled toast notification.
 * @param validationState - Semantic tri-state validation ('valid' | 'idle' | 'error').
 * @param hasError - Convenience shorthand for validationState="error".
 * @param isIdleDisabled - Convenience shorthand for validationState="idle".
 */
export interface CustomButtonProps {
    title?: string;
    onPress?: (event: GestureResponderEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
    isLoading?: boolean;
    throttleMs?: number;
    children?: ReactNode;
    icon?: string;
    iconLibrary?: IconLibrary;
    iconPosition?: 'left' | 'right';
    iconSize?: number;
    iconColor?: string;
    disabledToastMessage?: string;
    disabledToastType?: ToastType;
    validationState?: ButtonValidationState;
    hasError?: boolean;
    isIdleDisabled?: boolean;
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
    isLoading = false,
    throttleMs = 500,
    children,
    icon,
    iconLibrary,
    iconPosition = 'left',
    iconSize = 18,
    iconColor,
    disabledToastMessage,
    disabledToastType = 'error',
    validationState,
    hasError = false,
    isIdleDisabled = false,
}) => {
    const toastContext = useContext(ToastContext);

    const resolvedValidationState: ButtonValidationState = hasError
        ? 'error'
        : (isIdleDisabled ? 'idle' : (validationState ?? 'valid'));
    
    let buttonStyle = styles.primary as StyleProp<ViewStyle>;
    let labelStyle = styles.textPrimary as StyleProp<TextStyle>;
    let useShadow: boolean = true;

    if (resolvedValidationState === 'error') {
        buttonStyle = styles.error as StyleProp<ViewStyle>;
        labelStyle = styles.textError as StyleProp<TextStyle>;
        useShadow = false;
    } else if (resolvedValidationState === 'idle') {
        buttonStyle = styles.idle as StyleProp<ViewStyle>;
        labelStyle = styles.textIdle as StyleProp<TextStyle>;
        useShadow = false;
    } else if (variant === 'secondary') {
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

    const defaultIconColor = iconColor ?? (
        resolvedValidationState === 'error'
            ? Colors.STATUS_CANCELLED_TEXT
            : resolvedValidationState === 'idle'
                ? Colors.TEXT_SECONDARY
                : (variant === 'primary' || variant === 'destructive' ? Colors.WHITE : Colors.PRIMARY)
    );
    const rippleColor = (variant === 'primary' || variant === 'destructive' || resolvedValidationState === 'error')
        ? Colors.BUTTON_RIPPLE_LIGHT
        : Colors.BUTTON_RIPPLE_DARK;
    const isStandardDisabled = (disabled || isLoading) && resolvedValidationState === 'valid';
    const isInteractionDisabled = (disabled || isLoading) && !disabledToastMessage;
    const isInteractive = !isLoading && (Boolean(onPress) || Boolean(disabledToastMessage));
    const lastPressTimeRef = useRef<number>(0);

    const handlePress = (event: GestureResponderEvent) => {
        if (isInteractionDisabled) {
            return;
        }

        if (disabled && disabledToastMessage && toastContext) {
            toastContext.showToast(disabledToastMessage, disabledToastType);
            return;
        }

        if (!onPress) return;

        const now = Date.now();
        if (throttleMs > 0 && now - lastPressTimeRef.current < throttleMs) {
            return;
        }
        lastPressTimeRef.current = now;
        onPress(event);
    };

    return (
        <Pressable 
            onPress={isInteractive ? handlePress : undefined}
            disabled={!isInteractive}
            android_ripple={isInteractionDisabled ? undefined : { color: rippleColor }}
            style={({ pressed }) => [
                styles.baseButton as StyleProp<ViewStyle>, 
                buttonStyle, 
                useShadow && !isInteractionDisabled && (styles.shadows as StyleProp<ViewStyle>),
                style,
                pressed && !isInteractionDisabled && (styles.pressed as StyleProp<ViewStyle>),
                isStandardDisabled && (styles.disabledState as StyleProp<ViewStyle>)
            ]}
        >
            {children ? (
                children
            ) : (
                <View style={styles.contentRow}>
                    {isLoading ? (
                        <ActivityIndicator 
                            size="small" 
                            color={defaultIconColor} 
                            style={styles.spinner}
                        />
                    ) : (
                        icon && iconLibrary && iconPosition === 'left' && (
                            <CustomIcon 
                                library={iconLibrary} 
                                name={icon} 
                                size={iconSize} 
                                color={defaultIconColor} 
                                style={styles.iconLeft}
                            />
                        )
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
                    {!isLoading && icon && iconLibrary && iconPosition === 'right' && (
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
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' } as unknown as ViewStyle,
        }),
    },
    shadows: GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 8 }) as unknown as ViewStyle,
    baseText: {
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    pressed: {
        transform: [{ scale: 0.98 }],
    },
    disabledState: {
        opacity: 0.5,
        ...Platform.select({
            web: { cursor: 'not-allowed' } as unknown as ViewStyle,
        }),
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
        backgroundColor: Colors.WHITE,
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

    error: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderWidth: 1.5,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
    },
    textError: {
        color: Colors.STATUS_CANCELLED_TEXT,
    },

    idle: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    textIdle: {
        color: Colors.TEXT_SECONDARY,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    spinner: {
        marginRight: 4,
    },
    iconLeft: {},
    iconRight: {}
});

export default CustomButton;