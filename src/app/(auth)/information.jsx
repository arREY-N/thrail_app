import useSignUp from "@/src/core/hook/auth/useSignUp";
import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";


export default function information(){
    const { onBackPress } = useAppNavigation();

    const { 
        error, 
        onContinuePress 
    } = useSignUp();

    return(
        <InformationScreen
            onContinuePress={onContinuePress}
            onBackPress={onBackPress}
            error={error}/>
    )
}