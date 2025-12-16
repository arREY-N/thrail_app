import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import CustomTextInput from '@/src/components/CustomTextInput'

const LogInScreen = ({onLogIn}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View>
            <Text>login</Text>

            <CustomTextInput label={'Email'} placeholder={'Enter email'} value={email} onChangeText={setEmail}/>
            <CustomTextInput label={'Password'} placeholder={'Enter password'} value={password} onChangeText={setPassword}/>
            <Pressable onPress={() => onLogIn(email, password)}>
                <Text>Log in</Text>
            </Pressable>
        </View>
    )
}

export default LogInScreen