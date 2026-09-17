/**
 * @file list.tsx
 * @description Trail management list controller screen. Adapts shell layout dynamically between SuperadminShell and Admin CustomHeader based on user role.
 */

import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useSuperadminDomain, useSuperadminNavigation } from "@/src/core/models/Superadmin/Superadmin";
import { useTrailList } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";
import TrailListScreen from "@/src/features/SuperAdmin/screens/tabs/TrailListScreen";

export default function ListTrail() {
    const { isSuperadmin } = useAuthHook();

    const {
        onTrailPress,
        onBackPress
    } = useAppNavigation();

    const {
        onWriteTrail,
        onEditMapPins,
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const {
        trails,
        trailLoading,
        trailError
    } = useTrailList();

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

    if (trailLoading) return <LoadingScreen />;

    return (
        <TrailListScreen
            trails={trails}
            isLoading={trailLoading}
            error={trailError}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={isSuperadmin ? onBackToSettingsPress : onBackPress}
            onViewTrail={onTrailPress}
            onWriteTrail={onWriteTrail}
            onEditMapPins={onEditMapPins}
            isSuperadminShell={isSuperadmin}
        />
    );
}