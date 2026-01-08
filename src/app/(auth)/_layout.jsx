import { AccountProvider } from '@/src/core/context/AccountProvider';
import { useAuthStore } from '@/src/core/stores/authStore';
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from 'react';

export default function AuthLayout(){
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);
    const profile = useAuthStore((state) => state.profile);
    const router = useRouter();
    const isLoading = useAuthStore((state) => state.isLoading);
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        if(!rootNavigationState?.key) return;

        if(user && role){
            if(role === 'superadmin') router.replace('/(superadmin)/home');
            else if(role === 'admin') router.replace('/(admin)/home');
            else if(role === 'user'){
                if(!profile) return;

                if(!profile.onBoardingComplete) router.replace('/(auth)/preference');
                else router.replace('/(tabs)/home')
            }
        }
    }, [user, role, profile, isLoading]);

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