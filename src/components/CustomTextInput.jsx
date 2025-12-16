import { View, Text, TextInput, StyleSheet } from 'react-native'
import React from 'react'

const CustomTextInput = ({label, placeholder, value, onChangeText}) => {
    return (
        <View>
            <Text>{label || 'Input Text'}</Text>
            <TextInput 
                placeholder={placeholder || 'placeholder'}
                placeholderTextColor={'#00000050'}
                style={styles.input}
                value={value}
                onChangeText={onChangeText}/>
        </View>
    )
}

export default CustomTextInput

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginVertical: 10
    },
})