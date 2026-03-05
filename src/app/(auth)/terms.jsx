
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import TermsReadOnlyScreen from "@/src/features/Auth/screens/TermsReadOnlyScreen";

export default function Terms() {
    const { onBackPress } = useAppNavigation();

    return (
        <TermsReadOnlyScreen 
            onBackPress={onBackPress}
        />
    );
}