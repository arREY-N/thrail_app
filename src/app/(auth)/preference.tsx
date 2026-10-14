/**
 * @file preference.tsx
 * @description Route controller for user onboarding preferences and health declarations.
 */

import { StyleSheet, View } from 'react-native';

import { usePreference } from '@/src/core/models/User/User';
import PreferenceScreen from '@/src/features/Auth/screens/PreferenceScreen';

/**
 * Controller managing hiker trail preferences, experience level, and medical clearance submissions.
 *
 * @returns {React.JSX.Element} The rendered preferences controller view.
 */
export default function Preference() {
    const {
        questions,
        setAnswer,
        setMedicalDetails,
        setMedicalClearance,
        onFinishedPreference,
        error,
    } = usePreference();

    return (
        <View style={styles.container}>
            <PreferenceScreen
                questions={questions}
                setAnswer={setAnswer}
                setMedicalDetails={setMedicalDetails}
                setMedicalClearance={setMedicalClearance}
                onFinish={onFinishedPreference}
                error={error}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
