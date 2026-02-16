import { useRouter } from "expo-router";

import TermsScreen from "../../features/Auth/screens/TermsScreen";

export default function Terms() {
    const router = useRouter();

    const onBackPress = () => {
        router.back();
    }

    return (
        <TermsScreen 
            onBackPress={onBackPress}
        />
    );
}