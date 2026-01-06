import { AccountProvider } from '@/src/core/context/AccountProvider';
import { Stack } from "expo-router";

export default function AuthLayout(){
    return(     
        <AccountProvider>
            <Stack>
                <Stack.Screen
                    name = 'login'
                    options = {{
                        title: 'Log in',
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name = 'signup'
                    options = {{
                        title: 'Sign up',
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name = 'landing'
                    options = {{
                        title: 'Landing',
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name = 'preference'
                    options = {{
                        title: 'Preference',
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name = 'privacy'
                    options = {{
                        title: 'Privacy Policy',
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name = 'terms'
                    options = {{
                        title: 'Terms and Conditions',
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name = 'information'
                    options = {{
                        title: 'User Information',
                        headerShown: false,
                    }}
                />

                <Stack.Screen 
                    name = 'tac'
                    options={{
                        title: 'Terms and Conditions',
                        headerShown: false,
                    }}
                />
            </Stack>
        </AccountProvider>
    )
}