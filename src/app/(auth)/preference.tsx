import usePreference from "@/src/core/hook/user/usePreference";
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
