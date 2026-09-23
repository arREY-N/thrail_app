/**
 * @file index.tsx
 * @description Route controller for the dedicated Test Screen under Settings.
 */

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { TestScreen } from "@/src/features/Settings/screens/TestScreen";
import { Redirect } from "expo-router";

/**
 * Controller for the TestScreen.
 */
export default function TestRoute() {
    const {
        onBackPress,
    } = useAppNavigation();

    if (!__DEV__) {
        return <Redirect href="/settings" />;
    }

    return (
        <TestScreen
            onBackPress={onBackPress}
        />
    );
}
