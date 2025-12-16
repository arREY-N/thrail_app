import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import CustomTextInput from '@/src/components/CustomTextInput';

const SignUpScreen = ({onSignUp}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View>
            <Text>Sign Up Screen</Text>

            <CustomTextInput label={'Email'} placeholder={'Enter email'} value={email} onChangeText={setEmail}/>
            <CustomTextInput label={'Password'} placeholder={'Enter password'} value={password} onChangeText={setPassword}/>
            <Pressable onPress={() => onSignUp(email, password)}>
                <Text>Sign up</Text>
            </Pressable>
        </View>
    )
}

export default SignUpScreen