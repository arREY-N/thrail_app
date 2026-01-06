import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';

const CustomTextInput = ({ 
    label, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry, 
    keyboardType,
    isPasswordVisible, 
    onTogglePassword,  
    ...props 
}) => {

    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const showPassword = onTogglePassword ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword ? onTogglePassword : () => setInternalShowPassword(!internalShowPassword);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <View style={[
                styles.inputContainer,
                { 
                    borderColor: isFocused ? Colors.PRIMARY : Colors.GRAY_LIGHT,
                    backgroundColor: isFocused ? Colors.WHITE : Colors.FAFAFA
                }
            ]}>
                
                <TextInput 
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.GRAY_MEDIUM}
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
                            color={Colors.GRAY_MEDIUM} 
                        />
                    </TouchableOpacity>
                )}
            </View>
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
        fontSize: 14,
        fontWeight: '600',
        color: Colors.BLACK,
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
        color: Colors.BLACK,
        height: '100%',
        outlineStyle: 'none', 
    },
    eyeIcon: {
        padding: 8,
    },
});

export default CustomTextInput;