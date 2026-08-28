import LoadingScreen from "@/src/app/loading";
import useApply from "@/src/core/hook/apply/useApply";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { Application } from "@/src/core/models/Application/Application";
import { useManageApplication, useSuperadminNavigation } from "@/src/core/models/Superadmin/Superadmin";
import { useAuthHook } from "@/src/core/models/User/User";
import getSearchParam from "@/src/core/utility/getSearchParam";
import ApplicationViewScreen from "@/src/features/SuperAdmin/screens/tabs/ApplicationViewScreen";
import { useLocalSearchParams } from "expo-router";

export default function ViewApplication() {
    const { applicationId } = useLocalSearchParams();
    const appId = getSearchParam(applicationId);

    const { role } = useAuthHook();
    const { applications } = useApply({ role } as any);
    const pendingCount = applications.filter((a: any) => a.status === 'pending').length;

    const controller = useManageApplication({ applicationId: appId, role });

    const {
        onBackPress
    } = useAppNavigation();
    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    if (controller.isLoading) return <LoadingScreen />

    return (
        <ApplicationViewScreen
            application={controller.application as Application}
            onApprove={controller.onApproveApplication}
            onReject={controller.onRejectApplication}
            rejectionReason={controller.application?.message || ''}
            onRejectionReasonChange={controller.setRejectionLetter}
            error={controller.error}
            onBack={onBackPress}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
        />
    )
}