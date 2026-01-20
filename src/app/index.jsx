import LandingScreen from '@/src/features/Auth/screens/LandingScreen';
import { Redirect, useRouter } from "expo-router";
import { useAuthStore } from "../core/stores/authStore";

export default function index() {
    const router = useRouter();
    const user = useAuthStore(s => s.user);
    const role = useAuthStore(s => s.role);

    const onLogIn = () => {
        router.push('/(auth)/login');
    }

    const onSignUp = () => {
        router.push('/(auth)/signup');
    }
    
    const onPrivacy = () => {
        router.push('/(auth)/privacy');
    }

    const onTerms = () => {
        router.push('/(auth)/terms')
    }

    if(user){
        if(role === 'user') return <Redirect href={'/(tabs)'}/>
    
        if(role === 'admin') return <Redirect href={'/(admin)'}/>
    
        if(role === 'superadmin') return <Redirect href={'/(superadmin)'}/>
    }
    
    return (
        <LandingScreen 
            onLogInPress={onLogIn} 
            onSignUpPress={onSignUp}
            onPrivacyPress={onPrivacy}
            onTermsPress={onTerms}/>
    )
}
