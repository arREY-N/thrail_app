
import TermsScreen from "../../features/Auth/screens/TermsScreen";

export default function Terms() {
    const { onBackPress } = useAppNavigation();

    return (
        <TermsScreen 
            onBackPress={onBackPress}
        />
    );
}