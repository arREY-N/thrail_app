import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';

const CustomTextInput = ({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, ...props }) => {

    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <View style={[
                styles.inputContainer,
                { borderColor: isFocused ? Colors.BLACK : Colors.GRAY_MEDIUM }
            ]}>
                
                <TextInput 
                    style={styles.input}
                    placeholder={placeholder || 'Placeholder'}
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
                        onPress={() => setShowPassword(!showPassword)}
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
    },
    
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderRadius: 8,
        height: 54,
        paddingHorizontal: 12,
    },
    
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.BLACK,
        height: '100%',
        outlineStyle: 'none', 
        minWidth: 0,
    },
    
    eyeIcon: {
        padding: 8,
    },
});

export default CustomTextInput;