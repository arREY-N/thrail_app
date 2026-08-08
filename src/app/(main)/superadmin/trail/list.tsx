/**
 * @file list.tsx
 * @description Trail management list controller screen. Adapts shell layout dynamically between SuperadminShell and Admin CustomHeader based on user role.
 */

import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import useSuperadminNavigation from "@/src/core/hook/navigation/useSuperadminNavigation";
import useSuperadminDomain from "@/src/core/hook/superadmin/useSuperadminDomain";
import useTrail from "@/src/core/hook/trail/useTrail";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import TrailListScreen from "@/src/features/SuperAdmin/screens/tabs/TrailListScreen";
import React from "react";

export default function listTrail() {
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
        isLoading,
        error
    } = useTrail();

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

    if (isLoading) return <LoadingScreen />;

    return (
        <TrailListScreen
            trails={trails}
            isLoading={isLoading}
            error={error}
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