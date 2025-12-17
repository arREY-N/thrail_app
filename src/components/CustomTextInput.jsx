import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../constants/colors';

const CustomTextInput = ({ label, placeholder, value, onChangeText, secureTextEntry, }) => {

    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <TextInput 
                style={[
                    styles.input,
                    { borderColor: isFocused ? Colors.PrimaryColor : Colors.GRAY_MEDIUM }
                ]}
                placeholder={placeholder || 'Placeholder'}
                placeholderTextColor={Colors.GRAY_MEDIUM}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}

                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
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
    input: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: Colors.BLACK,
        
        outlineStyle: 'none', 
    },
});

export default CustomTextInput;