import { AccountProvider } from '@/src/core/context/AccountProvider';
import { Stack } from "expo-router";

import { Colors } from '@/src/constants/colors';

export default function AuthLayout(){
    return(     
        <AccountProvider>
            <Stack 
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: Colors.BACKGROUND } 
                }}
            >
                <Stack.Screen 
                    name="tac" 
                    options={{
                        presentation: 'transparentModal',
                        animation: 'fade',
                        contentStyle: { backgroundColor: 'transparent' } 
                    }}
                />
                <Stack.Screen name="signup" />
                <Stack.Screen name="information" />
                <Stack.Screen name="login" />
            </Stack>
        </AccountProvider>
    )
}