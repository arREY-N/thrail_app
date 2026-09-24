/**
 * @file tac.tsx
 * @description Route controller for the Terms and Conditions agreement step during user registration.
 */

import { StyleSheet, View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { useSignUp } from '@/src/core/models/User/User';
import TACScreen from '@/src/features/Auth/screens/TACScreen';

/**
 * Controller managing Terms and Conditions acceptance and dispatching account creation.
 *
 * @returns {React.JSX.Element} The rendered terms and conditions controller view.
 */
export default function Tac() {
    const {
        onAcceptPress,
        onDeclinePress,
        error,
        isLoading,
    } = useSignUp();

    return (
        <View style={styles.container}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
