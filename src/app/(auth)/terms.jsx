import { useRouter } from "expo-router";

import TermsReadOnlyScreen from "../../features/Auth/screens/TermsReadOnlyScreen";

export default function Terms() {
    const router = useRouter();

    const onBackPress = () => {
        router.back();
    }

    return (
        <TermsReadOnlyScreen 
            onBackPress={onBackPress}
        />
    );
}