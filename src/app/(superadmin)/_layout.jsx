import { AccountProvider } from '@/src/core/context/AccountProvider';
import { SuperAdminProvider } from '@/src/core/context/SuperAdminProvider';
import { Stack } from "expo-router";

export default function AuthLayout(){
    return(     
        <AccountProvider>
            <SuperAdminProvider>
                <Stack>
                    <Stack.Screen
                        name = 'home'
                        options = {{
                            title: 'Superadmin Home',
                            headerShown: true,
                        }}
                    />
                </Stack>
            </SuperAdminProvider>
        </AccountProvider>
    )
}