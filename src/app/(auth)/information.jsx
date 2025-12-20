import { useAccount } from "@/src/core/context/AccountProvider";
import { validateInfo } from "@/src/core/domain/authDomain";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";
import { useRouter } from "expo-router";
import { useState } from "react";


export default function information(){
    const [error, setError] = useState(null);
    const router = useRouter();
    const { account, updateAccount } = useAccount();

    const onContinuePress = (phoneNumber, firstname, lastname, birthday, address) => {
        setError(null);
        try {
            validateInfo(phoneNumber, firstname, lastname, birthday, address);
            
            updateAccount({
                phoneNumber,
                firstname,
                lastname,
                birthday,
                address
            });

            router.push('/(auth)/tac');
        } catch (err) {
            setError(err.message);
        }
    }

    const onBackPress = () => {
        router.back();    
    }

    return(
        // account={account} add account props to handle auto fill
        <InformationScreen
            onContinuePress={onContinuePress}
            onBackPress={onBackPress}
            error={error}/>
    )
}