import { SignUp } from "@/src/core/models/User/SignUp";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { router } from "expo-router";
import { useEffect } from "react";

export default function useSignUp(isNew: boolean = false){
    const error = useAuthStore(s => s.error);
    const isChecking = useAuthStore(s => s.isChecking);
    const isStoreLoading = useAuthStore(s => s.isLoading);
    const account = useAuthStore(s => s.account);
    const isLoading = isChecking || isStoreLoading;

    const validateInfo = useAuthStore(s => s.validateInfo);
    const validateSignUp = useAuthStore(s => s.validateSignUp);
    const editAccount = useAuthStore(s => s.editAccount);
    const reset = useAuthStore(s => s.reset);
    const resetSignUp = useAuthStore(s => s.resetSignUp);
    const onGmailSignUp = useAuthStore(s => s.gmailSignUp);
    const signUp = useAuthStore(s => s.signUp);

    const onContinuePress = (
        phoneNumber: string, 
        firstname: string, 
        lastname: string, 
        birthday: Date, 
        address: string
    ) => {
        const cleanPhoneNumber = phoneNumber ? phoneNumber.replace(/\s/g, '') : '';
        
        editAccount(new SignUp({
            phoneNumber: cleanPhoneNumber,
            firstname, 
            lastname, 
            birthday,
            address
        }));

        if(validateInfo()) {
            router.push('/(auth)/tac');
        }
    }
    
    // TODO change parameters to SignUp object
    const onSignUpPress = async (
        email: string, 
        password: string, 
        username: string, 
        confirmPassword: string
    ) => {
        if(!account) resetSignUp();

        editAccount(new SignUp({
            email, 
            password, 
            username, 
            confirmPassword
        }));    
        
        const validated = await validateSignUp();
        if(validated) router.push('/(auth)/information');
    }

    const onAcceptPress = async () => {
        try {
            await signUp();
            router.replace('/(auth)/preference');
        } catch (error) {
            console.error("Sign up error:", error);
        }
    }

    const onDeclinePress = async () => {
        console.log('Alert user that this will cancel the whole process');
        router.replace('/(auth)/landing');
    }

    useEffect(() => {
        if(isNew) reset()
    },[])

    return {
        error,
        isLoading,
        onGmailSignUp,
        onSignUpPress,
        onAcceptPress,
        onDeclinePress,
        onContinuePress,
    }
}