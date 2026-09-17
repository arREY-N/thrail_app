import { View } from 'react-native';

import CustomLoading from "@/src/components/CustomLoading";
import { useSignUp } from "@/src/core/models/User/User";
import TACScreen from "@/src/features/Auth/screens/TACScreen";

export default function Tac() {
    const {
        onAcceptPress,
        onDeclinePress,
        error,
        isLoading,
    } = useSignUp();

    return (
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <CustomLoading
                visible={isLoading}
                message="Creating account..."
            />

            <TACScreen
                onAcceptPress={onAcceptPress}
                onDeclinePress={onDeclinePress}
                error={error}
            />
        </View>
    );
}
