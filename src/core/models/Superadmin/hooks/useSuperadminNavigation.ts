import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import { router } from "expo-router";

/**
 * Custom hook providing navigation handlers for the Superadmin management panel dashboard.
 * 
 * @returns {object} Navigation callbacks.
 */
export function useSuperadminNavigation() {
    /**
     * Navigates to the main Superadmin Dashboard overview.
     */
    const onManageDashboardPress = () => {
        router.push({
            pathname: '/(main)/superadmin'
        });
    };

    /**
     * Navigates to the guide and partner applications list.
     */
    const onManageApplicationPress = () => {
        router.push({
            pathname: '/(main)/superadmin/application/list'
        });
    };

    const onManageBusinessPress = () => {
        router.push({
            pathname: '/(main)/superadmin/business/list'
        });
    };

    const onManageTrailsPress = () => {
        router.push({
            pathname: '/(main)/superadmin/trail/list'
        });
    };

    const onManageUsersPress = () => {
        router.push({
            pathname: '/(main)/superadmin/user/list'
        });
    };

    const onManageMountainPress = () => {
        router.push({
            pathname: '/(main)/superadmin/mountain/list'
        });
    };

    /**
     * Navigates explicitly to the Settings/Profile tab screen.
     */
    const onBackToSettingsPress = () => {
        router.push('/(main)/settings');
    };

    /**
     * Navigates to the trail creation or information editing screen.
     * 
     * @param {string | null} [trailId=null] - Optional ID of the trail to edit. If null, navigates to create a new trail.
     */
    function onWriteTrail(trailId: string | null = null) {
        console.log('to write', trailId);
        if (trailId) {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: { trailId }
            });
        } else {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
            });
        }
    }

    /**
     * Navigates to the standalone visual map editor (Map Pins editor) for a given trail.
     * 
     * @param {string} trailId - The ID of the trail to edit map pins for.
     */
    function onEditMapPins(trailId: string) {
        router.push({
            pathname: '/(main)/superadmin/trail/map-editor',
            params: { trailId }
        });
    }

    const onTabPress = (tab: SuperadminTab) => {
        if (tab === 'dashboard') onManageDashboardPress();
        else if (tab === 'application') onManageApplicationPress();
        else if (tab === 'business') onManageBusinessPress();
        else if (tab === 'trail') onManageTrailsPress();
        else if (tab === 'mountain') onManageMountainPress();
        else if (tab === 'user') onManageUsersPress();
    };

    return {
        onManageDashboardPress,
        onManageApplicationPress,
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress,
        onBackToSettingsPress,
        onWriteTrail,
        onEditMapPins,
        onTabPress,
    };
}