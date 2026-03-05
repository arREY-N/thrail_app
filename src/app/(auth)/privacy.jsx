
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import PrivacyScreen from "@/src/features/Auth/screens/PrivacyScreen";

export default function Privacy() {
    const { onBackPress } = useAppNavigation();

    return (
        <PrivacyScreen 
            onBackPress={onBackPress}
        />
    );
}