import React, { ReactNode, useState } from 'react';
import {
    Platform,
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

import CustomCalendarInput from '@/src/components/CustomCalendarInput';
import CustomDateInput from '@/src/components/CustomDateInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

export const formatLocalPhoneNumber = (text?: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('63')) {
        cleaned = cleaned.substring(2);
    }

    while (cleaned.length > 0 && cleaned[0] !== '9') {
        cleaned = cleaned.substring(1);
    }

    if (cleaned.length > 10) {
        cleaned = cleaned.substring(0, 10);
    }

    let formatted = cleaned;
    if (cleaned.length > 3) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    if (cleaned.length > 6) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }

    return formatted;
};

export const cleanPhoneNumber = (formattedText?: string): string => {
    if (!formattedText) return '';
    let digits = formattedText.replace(/\D/g, '');

    if (digits.startsWith('63')) {
        digits = digits.substring(2);
    } else if (digits.startsWith('0')) {
        digits = digits.substring(1);
    }

    if (digits.length === 10) {
        return '0' + digits;
    }

    return digits;
};

export const formatCoordinate = (text?: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/[^0-9.,-]/g, ''); 
    return cleaned;
};

/**
 * A highly customizable text input component that supports passwords, numbers, coordinates, dates, and calendars.
 */
interface CustomTextInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
    label?: string;
    placeholder?: string;
    value?: string | Date | null | number;
    onChangeText?: ((text: string) => void) | ((date: Date) => void) | ((date: Date | null) => void) | ((value: string | Date | null) => void);
    secureTextEntry?: boolean;
    keyboardType?: TextInputProps['keyboardType'];
    isPasswordVisible?: boolean;
    onTogglePassword?: () => void;
    type?: 'text' | 'phone' | 'coordinate' | 'numerical' | 'date' | 'calendar';
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    icon?: string;
    iconLibrary?: IconLibrary;
    iconColor?: string;
    prefix?: string;
    children?: ReactNode;
    showTodayButton?: boolean;
    allowFutureDates?: boolean;
    defaultMode?: 'date' | 'month' | 'year';
    multiline?: boolean;
    maximumDate?: Date | null;
    dateFormat?: string;
    iconPosition?: 'left' | 'right';
    rightElement?: ReactNode;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ 
    label, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry, 
    keyboardType,
    isPasswordVisible, 
    onTogglePassword,
    type = 'text',
    style,
    inputStyle,
    icon, 
    iconLibrary = 'Feather', 
    iconColor,
    prefix, 
    children,
    showTodayButton,
    allowFutureDates,
    defaultMode,
    multiline,
    maximumDate,
    dateFormat = 'MM/DD/YYYY',
    iconPosition,
    rightElement,
    ...props
}) => {

    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const [localValue, setLocalValue] = useState(value !== null && value !== undefined ? String(value) : '');
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        if (type === 'coordinate' || type === 'numerical') {
            const parsedParent = parseFloat(value as string);
            const parsedLocal = parseFloat(localValue);
            if (isNaN(parsedParent) && isNaN(parsedLocal)) {
                // both are NaN, consider them equal
            } else if (parsedParent !== parsedLocal) {
                setLocalValue(value !== null && value !== undefined ? String(value) : '');
            }
        } else {
            setLocalValue(value !== null && value !== undefined ? String(value) : '');
        }
    }

    const handleTextChange = (text: string) => {
        let processedText = text;

        if (type === 'phone') {
            processedText = formatLocalPhoneNumber(text);
        } else if (type === 'coordinate') {
            processedText = formatCoordinate(text);
        } else if (type === 'numerical') {
            processedText = text.replace(/[^0-9]/g, '');
        }

        setLocalValue(processedText);
        if (onChangeText) {
            (onChangeText as (val: string) => void)(processedText);
        }
    };

    const finalKeyboardType = keyboardType 
        || (type === 'phone' ? 'phone-pad' : (type === 'coordinate' ? 'decimal-pad' : (type === 'numerical' ? 'numeric' : 'default')));

    const showPassword = isPasswordVisible !== undefined ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword || (() => setInternalShowPassword(!internalShowPassword));

    if (type === 'date') {
        return (
            <CustomDateInput 
                value={value as Date | null | undefined} 
                onChangeText={(date: Date) => {
                    if (onChangeText) {
                        (onChangeText as (val: Date | string) => void)(date);
                    }
                }}
                label={label}
            > 
                {children}
            </CustomDateInput>
        );
    }

    if (type === 'calendar') {
        return (
            <CustomCalendarInput 
                value={value as Date | null | undefined} 
                onChangeText={(date: string | Date) => {
                    if (onChangeText) {
                        (onChangeText as (val: string | Date) => void)(date);
                    }
                }}
                label={label}
                placeholder={placeholder}
                showTodayButton={showTodayButton}
                allowFutureDates={allowFutureDates}
                defaultMode={defaultMode}
                maximumDate={maximumDate}
                dateFormat={dateFormat}
                style={style}
                iconPosition={iconPosition}
            />
        );
    }

    return (
        <View style={[styles.container, style]}>
            {label && (
                <View style={styles.labelRow}>
                    <CustomText variant="label" style={styles.label}>
                        {label}
                    </CustomText>
                    {rightElement}
                </View>
            )}
            
            <View style={[
                styles.inputContainer,
                { 
                    borderColor: isFocused ? Colors.PRIMARY : Colors.GRAY_LIGHT,
                    backgroundColor: isFocused ? Colors.WHITE : Colors.BACKGROUND,
                },
                multiline && { height: 'auto', alignItems: 'flex-start' }
            ]}>
                
                {icon && (
                    <View style={styles.iconContainer}>
                        <CustomIcon 
                            name={icon} 
                            library={iconLibrary} 
                            size={20} 
                            color={iconColor || (isFocused ? Colors.PRIMARY : Colors.TEXT_SECONDARY)} 
                        />
                    </View>
                )}

                {prefix && (
                    <View style={styles.prefixContainer}>
                        <CustomText style={styles.prefixText}>
                            {prefix}
                        </CustomText>
                        <View style={styles.prefixSeparator} />
                    </View>
                )}

                <TextInput 
                    style={[
                        styles.input,
                        multiline && { height: 'auto', textAlignVertical: 'top' },
                        inputStyle
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                    value={localValue}
                    onChangeText={handleTextChange} 
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={finalKeyboardType} 
                    autoCorrect={secureTextEntry ? false : undefined}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    multiline={multiline}
                    {...props} 
                />

                {secureTextEntry && (
                    <TouchableOpacity 
                        onPress={togglePassword}
                        style={styles.eyeIcon}
                    >
                        <CustomIcon 
                            library="Feather"
                            name={showPassword ? "eye" : "eye-off"} 
                            size={20} 
                            color={Colors.TEXT_SECONDARY} 
                        />
                    </TouchableOpacity>
                )}
            </View>
            
            {children}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        marginLeft: 2,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderRadius: 12,
        height: 54,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 12,
    },

    prefixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    prefixText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    prefixSeparator: {
        width: 1,
        height: 20,
        backgroundColor: Colors.GRAY_LIGHT,
        marginLeft: 8,
    },

    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        height: '100%',
        ...Platform.select({
            web: { outlineStyle: 'none' as unknown as TextStyle['outlineStyle'] }
        })
    },
    eyeIcon: {
        padding: 8,
    },
});

export default CustomTextInput;
