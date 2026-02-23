import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '@/src/constants/colors';

import CustomDateInput from '@/src/components/CustomDateInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';



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
    icon, 
    iconLibrary = 'Feather', 
    prefix, 
    children,
    ...props
}) => {

    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const showPassword = onTogglePassword ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword ? onTogglePassword : () => setInternalShowPassword(!internalShowPassword);

    const handleTextChange = (text) => {
        if (type === 'phone') {
            const formatted = formatLocalPhoneNumber(text);
            onChangeText(formatted);
        } else {
            onChangeText(text);
        }
    };

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
                            backgroundColor: isFocused ? Colors.WHITE : Colors.BACKGROUND
                        }
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
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                            value={value}
                            onChangeText={handleTextChange} 
                            secureTextEntry={secureTextEntry && !showPassword}
                            keyboardType={keyboardType || 'default'} 
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
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

const formatLocalPhoneNumber = (text) => {
    let cleaned = text.replace(/\D/g, '');

    if (cleaned.startsWith('09')) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('63')) {
        cleaned = cleaned.substring(2);
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