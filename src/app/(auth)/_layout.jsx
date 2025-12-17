import { Stack } from "expo-router";

export default function AuthLayout(){
    return(
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
        </Stack>
    )
}