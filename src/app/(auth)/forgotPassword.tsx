import CustomTextInput from "@/src/components/CustomTextInput";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function forgotPassword() {
    
    const { 
        error,
        forgotPassword,
    } = useAuthHook();    

    return(
        <TESTFORGOT
            onForgotPassword={forgotPassword}
        />
    )
}   
interface params {
    onForgotPassword: (email: string) => void
}

const TESTFORGOT = (params: params) => {
    const [email, setEmail] = useState("");

    return(
        <View>
            <CustomTextInput 
                label={'Email'} 
                placeholder={'Enter email here'} 
                value={email} 
                onChangeText={setEmail} 
                secureTextEntry={undefined} 
                keyboardType={undefined} 
                isPasswordVisible={undefined} 
                onTogglePassword={undefined} 
                style={undefined} 
                inputStyle={undefined} 
                icon={undefined} 
                prefix={undefined} 
                children={undefined} 
                showTodayButton={undefined} 
                allowFutureDates={undefined} 
                defaultMode={undefined} 
                multiline={undefined} 
                maximumDate={undefined}
            />

            <Pressable onPress={() => params.onForgotPassword(email)}>
                <View>
                    <Text>Forgot Password</Text>
                </View>
            </Pressable>
        </View>
    )
}