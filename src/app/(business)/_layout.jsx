import { AccountProvider } from '@/src/core/context/AccountProvider';
import { Stack } from "expo-router";

export default function AuthLayout(){
    return(     
        <AccountProvider>
            <Stack>
                <Stack.Screen
                    name = 'home'
                    options = {{
                        title: 'Admin Home',
                        headerShown: true,
                    }}
                />
            </Stack>
        </AccountProvider>
    )
}