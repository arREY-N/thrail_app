import React, { useEffect, useState } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '@/src/constants/colors';

import CustomCalendarInput from '@/src/components/CustomCalendarInput';
import CustomDateInput from '@/src/components/CustomDateInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

export const formatLocalPhoneNumber = (text) => {
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

export const cleanPhoneNumber = (formattedText) => {
    if (!formattedText) return '';
    let cleanNumber = formattedText.replace(/\s+/g, '');
    
    if (cleanNumber.length === 10) {
        cleanNumber = '0' + cleanNumber;
    }
    
    return cleanNumber;
};

export const formatCoordinate = (text) => {
    if (!text) return '';
    let cleaned = text.replace(/[^0-9.,-]/g, ''); 
    return cleaned;
};

const CustomTextInput = ({ 
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
    prefix, 
    children,
    showTodayButton,
    allowFutureDates,
    defaultMode,
    multiline,
    ...props
}) => {

    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const [localValue, setLocalValue] = useState(value !== null && value !== undefined ? String(value) : '');

    useEffect(() => {
        if (type === 'coordinate' || type === 'numerical') {
            const parsedParent = parseFloat(value);
            const parsedLocal = parseFloat(localValue);
            if (parsedParent !== parsedLocal && !(isNaN(parsedParent) && isNaN(parsedLocal))) {
                setLocalValue(value !== null && value !== undefined ? String(value) : '');
            }
        } else {
            setLocalValue(value !== null && value !== undefined ? String(value) : '');
        }
    }, [value, type]);

    const showPassword = onTogglePassword ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword ? onTogglePassword : () => setInternalShowPassword(!internalShowPassword);

    const handleTextChange = (text) => {
        if (type === 'phone') {
            const formatted = formatLocalPhoneNumber(text);
            setLocalValue(formatted);
            onChangeText(formatted);
        } else if (type === 'coordinate') {
            const formatted = formatCoordinate(text);
            setLocalValue(formatted);
            onChangeText(formatted);
        } else if (type === 'numerical') {
            let cleaned = text.replace(/[^0-9.]/g, '');
            setLocalValue(cleaned);
            onChangeText(cleaned);
        } else {
            setLocalValue(text);
            onChangeText(text);
        }
    };

    let finalKeyboardType = keyboardType || 'default';
    
    if (type === 'phone') {
        finalKeyboardType = 'number-pad';
    } else if (type === 'coordinate' || type === 'numerical') {
        finalKeyboardType = 'numbers-and-punctuation'; 
    } else if (secureTextEntry && showPassword && Platform.OS === 'android') {
        finalKeyboardType = 'visible-password';
    }

    return (
        <View style={[styles.container, style]}>
            {type === 'date' ? (
                <CustomDateInput 
                    value={value} 
                    onChangeText={onChangeText}
                    label={label}
                > 
                    {children}
                </CustomDateInput>
            ) : type === 'calendar' ? (
                <CustomCalendarInput 
                    value={value} 
                    onChangeText={onChangeText}
                    label={label}
                    placeholder={placeholder}
                    showTodayButton={showTodayButton}
                    allowFutureDates={allowFutureDates}
                    defaultMode={defaultMode}
                />
            ) : (
                <>
                    {label && (
                        <CustomText variant="label" style={styles.label}>
                            {label}
                        </CustomText>
                    )}
                    
                    <View style={[
                        styles.inputContainer,
                        { 
                            borderColor: isFocused ? Colors.PRIMARY : Colors.GRAY_LIGHT,
                            backgroundColor: isFocused ? Colors.WHITE : Colors.BACKGROUND,
                        },
                        multiline && { height: 'auto', alignItems: 'flex-start' },
                        
                        inputStyle 
                    ]}>
                        
                        {icon && (
                            <View style={styles.iconContainer}>
                                <CustomIcon 
                                    name={icon} 
                                    library={iconLibrary} 
                                    size={20} 
                                    color={Colors.TEXT_SECONDARY} 
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
                                multiline && { height: 'auto', textAlignVertical: 'top' } 
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

                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        marginBottom: 8,
        marginLeft: 2,
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
            web: { outlineStyle: 'none' }
        })
    },
    eyeIcon: {
        padding: 8,
    },
});

export default CustomTextInput;