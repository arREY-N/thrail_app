import { View, Text, Pressable } from 'react-native'
import React from 'react'

const LandingScreen = ({onLogIn, onSignUp}) => {
    return (
        <View>
            <Text>landing</Text>
            <Pressable onPress={onLogIn}>
                <Text>Log in</Text>
            </Pressable>
            <Pressable onPress={onSignUp}>
                <Text>Sign up</Text>
            </Pressable>
        </View>
    )
}

export default LandingScreen