import Feather from '@expo/vector-icons/Feather';

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
    ...props 
}) => {

    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const showPassword = onTogglePassword ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword ? onTogglePassword : () => setInternalShowPassword(!internalShowPassword);

    return (
        <View style={styles.container}>
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
                        <TextInput 
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                            value={value}
                            onChangeText={onChangeText}
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
                                <Feather 
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