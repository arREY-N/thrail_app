import { useAuth } from "@/src/core/context/AuthProvider";
import { onUpdateUserProfile } from "@/src/core/domain/authDomain";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function information(){
    const { user } = useAuth(); 
    const [error, setError] = useState(null);
    const router = useRouter();

    const onContinuePress = async () => {
        setError(null);

        try {
            await onUpdateUserProfile(
                user.uid, 
                number,
                firstname,
                lastname,
                birthday,
                address
            )
        } catch (err) {
            console.log(err.message);
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