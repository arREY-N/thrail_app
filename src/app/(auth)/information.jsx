import { useAuthStore } from "@/src/core/stores/authStore";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";
import { useRouter } from "expo-router";


export default function information(){
    const error = useAuthStore(s => s.error);
    const router = useRouter();
    const validateInfo = useAuthStore(s => s.validateInfo);
    const editAccount = useAuthStore(s => s.editAccount);

    const onContinuePress = (number,firstname, lastname, birthday, address) => {
        editAccount({number,firstname, lastname, birthday, address});
        validateInfo();
        router.push('/(auth)/tac');
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