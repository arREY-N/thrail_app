import { useAuth } from "@/src/core/context/AuthProvider";
import { onUpdateUserProfile } from "@/src/core/domain/authDomain";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";
import { useState } from "react";

export default function information(){
    const { user } = useAuth(); 
    const [error, setError] = useState(null);

    const onContinuePress = async () => {
        setError(null);

        try {
            await onUpdateUserProfile(
                user.uid, 
                firstname,
                lastname,
                number,
                birthday,
                address
            )
        } catch (err) {
            console.log(err.message);
            setError(err.message);
        }
    }

    const onBackPress = () => {
        // onBackPress
    }

    return(
        <InformationScreen
            onContinuePress={onContinuePress}
            onBackPress={onBackPress}
        />
    )
}