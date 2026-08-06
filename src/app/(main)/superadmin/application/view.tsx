import LoadingScreen from "@/src/app/loading";
import useApply from "@/src/core/hook/apply/useApply";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useSuperadminNavigation from "@/src/core/hook/navigation/useSuperadminNavigation";
import useManageApplication from "@/src/core/hook/superadmin/useManageApplication";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Application } from "@/src/core/models/Application/Application";
import getSearchParam from "@/src/core/utility/getSearchParam";
import ApplicationViewScreen from "@/src/features/SuperAdmin/screens/tabs/ApplicationViewScreen";
import { useLocalSearchParams } from "expo-router";

export default function viewApplication(){
    const { applicationId } = useLocalSearchParams();
    const appId = getSearchParam(applicationId);
    
    const { role } = useAuthHook();
    const { applications } = useApply({ role } as any);
    const pendingCount = applications.filter((a: any) => a.status === 'pending').length;

    const controller = useManageApplication({ applicationId: appId, role });

    if(controller.isLoading) return <LoadingScreen/>

    const {
        onBackPress
    } = useAppNavigation();
    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    return(
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