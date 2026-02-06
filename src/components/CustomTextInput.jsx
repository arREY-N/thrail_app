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
    ...props
}) => {

    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const showPassword = onTogglePassword ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword ? onTogglePassword : () => setInternalShowPassword(!internalShowPassword);

    const handleTextChange = (text) => {
        if (type === 'phone') {
            const cleaned = text.replace(/\D/g, '');

            if (cleaned.length === 0) {
                onChangeText('');
                return;
            }

            if (cleaned.length === 1) {
                if (cleaned !== '0' && cleaned !== '6') return; 
            }
            if (cleaned.length === 2) {
                if (cleaned !== '09' && cleaned !== '63') return;
            }
            if (cleaned.length > 2) {
                if (!cleaned.startsWith('09') && !cleaned.startsWith('63')) return;
            }

            let formatted = cleaned;

            if (cleaned.startsWith('09')) {
                if (cleaned.length > 4) {
                    formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)}`;
                }
                if (cleaned.length > 7) {
                    formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
                }
            } else if (cleaned.startsWith('63')) {
                if (cleaned.length > 2) {
                    formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}`;
                }
                if (cleaned.length > 5) {
                    formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)}`;
                }
                if (cleaned.length > 8) {
                    formatted = `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
                }
            }

            onChangeText(formatted);
        } else {
            onChangeText(text);
        }
    };

    const inputProps = type === 'phone' ? {
        keyboardType: 'phone-pad',
        maxLength: value?.startsWith('63') ? 15 : 13, 
    } : {};

    return (
        <View style={[styles.container, style]}>
            {type === 'date' ? (
                <CustomDateInput 
                    value={value} 
                    onChangeText={onChangeText}
                    label={label}
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
                            {...inputProps}
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
        marginRight: 8,
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