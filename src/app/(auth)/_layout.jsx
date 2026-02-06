import { AccountProvider } from '@/src/core/context/AccountProvider';
import { Stack } from "expo-router";

export default function AuthLayout(){
    return(     
        <AccountProvider>
            <Stack screenOptions={{headerShown: false}}/>
        </AccountProvider>
    )
}