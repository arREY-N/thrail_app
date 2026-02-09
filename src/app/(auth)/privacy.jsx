import { useRouter } from "expo-router";

import PrivacyScreen from "@/src/features/Auth/screens/PrivacyScreen";

export default function Privacy() {
    const router = useRouter();

    const onBackPress = () => {
        router.back();
    }

    return (
        <PrivacyScreen 
            onBackPress={onBackPress}
        />
    );
}