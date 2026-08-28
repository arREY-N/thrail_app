import { usePreference } from "@/src/core/models/User/User";
import PreferenceScreen from "@/src/features/Auth/screens/PreferenceScreen";

export default function Preference() {

    const {
        questions,
        setAnswer,
        setMedicalDetails,
        setMedicalClearance,
        onFinishedPreference,
        error
    } = usePreference();

    return (
        <PreferenceScreen
            questions={questions}
            setAnswer={setAnswer as any}
            setMedicalDetails={setMedicalDetails}
            setMedicalClearance={setMedicalClearance}
            onFinish={onFinishedPreference}
            error={error}
        />
    );
}
