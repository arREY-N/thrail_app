import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useSignUp } from "@/src/core/models/User/User";
import InformationScreen from "@/src/features/Auth/screens/InformationScreen";

export default function Information() {
    const { onBackPress } = useAppNavigation();

    const {
        error,
        onContinuePress
    } = useSignUp();

    return (
        <InformationScreen
            onContinuePress={onContinuePress}
            onBackPress={onBackPress}
            error={error}
        />
    );
}
