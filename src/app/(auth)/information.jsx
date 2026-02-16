import { useAuthStore } from "@/src/core/stores/authStore";

import { useRouter } from "expo-router";

import InformationScreen from "@/src/features/Auth/screens/InformationScreen";

export default function information(){
    const error = useAuthStore(s => s.error);
    const router = useRouter();
    const validateInfo = useAuthStore(s => s.validateInfo);
    const editAccount = useAuthStore(s => s.editAccount);

    const onContinuePress = (phoneNumber, firstname, lastname, birthday, address) => {
        let clean = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';

        if (clean.startsWith('63')) {
            clean = '0' + clean.substring(2);
        }

        console.log("Original Input:", phoneNumber);
        console.log("Sent to Backend:", clean);
        
        editAccount({
            phoneNumber: clean,
            firstname, 
            lastname, 
            birthday,
            address
        });

        if(validateInfo()) {
            router.push('/(auth)/tac');
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