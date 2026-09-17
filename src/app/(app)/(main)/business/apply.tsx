import LoadingScreen from '@/src/app/loading';
import useApplyWrite from '@/src/core/hook/apply/useApplyWrite';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import ApplyScreen from '@/src/features/Profile/screens/ApplyScreen';

export default function ApplyBusiness() {
    const { onBackPress } = useAppNavigation();
    const {
        object: application,
        options,
        information,
        error,
        onSubmitPress,
        onUpdatePress,
    } = useApplyWrite();

    if (!application) return <LoadingScreen />

    return (
        <ApplyScreen
            {...{
                information: information,
                application: application as any,
                options: options,
                system: error as any,
                onUpdatePress: onUpdatePress,
                onSubmitPress: onSubmitPress,
                onBackPress: onBackPress,
            } as any}
        />
    )
}
