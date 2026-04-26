
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import TermsScreen from "@/src/features/Legal/screens/TermsScreen";

export default function Terms() {
    const { onBackPress } = useAppNavigation();

    return (
        <TermsScreen 
            onBackPress={onBackPress}
        />
    );
}