import { useAccount } from "@/src/core/context/AccountProvider";
import { onSignUp } from "@/src/core/domain/authDomain";
import { useRouter } from "expo-router";
import { useState } from "react";

import TermsScreen from "../../../src/features/Auth/screens/TermsScreen";

export default function tac(){
    const router = useRouter();
    const [error, setError] = useState();
    const { account } = useAccount(); 
    
    const onAcceptPress = async () => {
        try {
            await onSignUp(account);
        } catch (err) {
            setError(err.message);
        }
    }

    const onDeclinePress = async () => {
        console.log('Alert user that this will cancel the whole process');
        router.replace('/(auth)/landing');
    }

    const onBackPress = () => {
        router.back();
    }

    return(
        <TermsScreen 
            onAcceptPress={onAcceptPress}
            onDeclinePress={onDeclinePress}
            onBackPress={onBackPress}
            error={error}
        />
    )
}
