/**
 * @file information.tsx
 * @description Route controller for the user personal information input step during registration.
 */

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useSignUp } from '@/src/core/models/User/User';
import InformationScreen from '@/src/features/Auth/screens/InformationScreen';

/**
 * Controller managing personal information fields (name, phone, birthday, address) during sign-up.
 *
 * @returns {React.JSX.Element} The rendered information controller view.
 */
export default function Information() {
    const { onBackPress } = useAppNavigation();

    const {
        error,
        onContinuePress,
    } = useSignUp();

    return (
        <InformationScreen
            onContinuePress={onContinuePress}
            onBackPress={onBackPress}
            error={error}
        />
    );
}
