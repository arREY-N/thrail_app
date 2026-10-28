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
    size?: 'sm' | 'md' | 'lg';
    autoWidth?: boolean;
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
    numberOfLines?: number;
    adjustsFontSizeToFit?: boolean;
    minimumFontScale?: number;
}

/**
 * CustomButton — A premium, reusable action button.
 */
const CustomButton: React.FC<CustomButtonProps> = ({ 
    title, 
    onPress, 
    variant = 'primary',
    size = 'lg',
    autoWidth = false,
    style,
    textStyle,
    disabled,
    isLoading = false,
    throttleMs = 500,
    children,
    icon,
    iconLibrary,
    iconPosition = 'left',
    iconSize,
    iconColor,
    disabledToastMessage,
    disabledToastType = 'error',
    validationState,
    hasError = false,
    isIdleDisabled = false,
    numberOfLines = 1,
    adjustsFontSizeToFit = true,
    minimumFontScale = 0.75,
}) => {
    const toastContext = useContext(ToastContext);

    const resolvedIconSize = iconSize ?? (size === 'sm' ? 14 : size === 'md' ? 16 : 18);

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
    let disabledVariantStyle: StyleProp<ViewStyle> = null;
    let disabledTextStyle: StyleProp<TextStyle> = null;

    if (isStandardDisabled) {
        useShadow = false;
        if (variant === 'primary') {
            disabledVariantStyle = styles.disabledPrimary;
            disabledTextStyle = styles.textDisabledPrimary;
        } else if (variant === 'outline') {
            disabledVariantStyle = styles.disabledOutline;
            disabledTextStyle = styles.textDisabledOutline;
        } else if (variant === 'secondary') {
            disabledVariantStyle = styles.disabledSecondary;
            disabledTextStyle = styles.textDisabledSecondary;
        } else if (variant === 'destructive') {
            disabledVariantStyle = styles.disabledDestructive;
            disabledTextStyle = styles.textDisabledDestructive;
        }
    }

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
                styles[`size_${size}`] as StyleProp<ViewStyle>,
                (autoWidth || size === 'sm') && (styles.autoWidth as StyleProp<ViewStyle>),
                buttonStyle, 
                useShadow && size === 'lg' && !isInteractionDisabled && (styles.shadows as StyleProp<ViewStyle>),
                isStandardDisabled && disabledVariantStyle,
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
                                size={resolvedIconSize} 
                                color={defaultIconColor} 
                                style={styles.iconLeft}
                            />
                        )
                    )}
                    <CustomText 
                        numberOfLines={numberOfLines}
                        adjustsFontSizeToFit={adjustsFontSizeToFit}
                        minimumFontScale={minimumFontScale}
                        style={[
                            styles.baseText as StyleProp<TextStyle>, 
                            styles[`text_${size}`] as StyleProp<TextStyle>,
                            labelStyle, 
                            isStandardDisabled && disabledTextStyle,
                            textStyle
                        ]}
                    >
                        {title}
                    </CustomText>
                    {!isLoading && icon && iconLibrary && iconPosition === 'right' && (
                        <CustomIcon 
                            library={iconLibrary} 
                            name={icon} 
                            size={resolvedIconSize} 
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
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { cursor: 'pointer', userSelect: 'none' } as unknown as ViewStyle,
        }),
    },
    size_sm: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        minHeight: 32,
    },
    size_md: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        minHeight: 42,
    },
    size_lg: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        minHeight: 52,
    },
    autoWidth: {
        width: 'auto',
    },
    shadows: GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 8 }) as unknown as ViewStyle,
    baseText: {
        textAlign: 'center',
    },
    text_sm: {
        fontSize: 12,
        fontWeight: '600',
    },
    text_md: {
        fontSize: 14,
        fontWeight: '700',
    },
    text_lg: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    pressed: {
        transform: [{ scale: 0.98 }],
    },
    disabledState: {
        opacity: 1,
        ...Platform.select({
            web: { cursor: 'not-allowed' } as unknown as ViewStyle,
        }),
    },
    disabledPrimary: {
        backgroundColor: '#95C595',
        borderWidth: 1.5,
        borderColor: '#95C595',
    },
    textDisabledPrimary: {
        color: Colors.WHITE,
    },
    disabledSecondary: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    textDisabledSecondary: {
        color: Colors.GRAY_MEDIUM,
    },
    disabledOutline: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    textDisabledOutline: {
        color: Colors.GRAY_MEDIUM,
    },
    disabledDestructive: {
        backgroundColor: '#FCA5A5',
        borderWidth: 1.5,
        borderColor: '#FCA5A5',
    },
    textDisabledDestructive: {
        color: Colors.WHITE,
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