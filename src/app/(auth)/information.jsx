import { useAccount } from "@/src/core/context/AccountProvider";
import { onSignUp } from "@/src/core/domain/authDomain";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function information(){
    const [error, setError] = useState(null);
    const router = useRouter();
    const { account } = useAccount();

    const onContinuePress = async (phoneNumber, firstname, lastname, birthday, address) => {
        setError(null);
        try {
            await onSignUp(
                account.email, 
                account.username, 
                account.password,
                phoneNumber,
                firstname,
                lastname,
                birthday,
                address
            );
        } catch (err) {
            setError(err.message);
        }
    }

    const onBackPress = () => {
        router.back();    
    }

    return(
        <InformationScreen
            onContinuePress={onContinuePress}
            onBackPress={onBackPress}
            error={error}/>
    )
}