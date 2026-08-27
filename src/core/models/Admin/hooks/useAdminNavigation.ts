import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Role } from "@/src/core/models/User/User";
import { router } from "expo-router";

export type UseAdminNavigationParams = {
    userId?: string;
    businessId?: string;
    role?: Role;
}

/**
 * Custom hook providing navigation handlers for the Admin panel dashboard.
 * 
 * @param {UseAdminNavigationParams} params - Navigation parameters.
 * @param {string} [params.userId] - The ID of the current logged-in user.
 * @param {string} [params.businessId] - The associated business entity ID.
 * @param {Role} [params.role] - The role of the current user.
 * @returns {object} Navigation callback handlers.
 */
export function useAdminNavigation() {
    const { profile, businessId, role } = useAuthHook();

    const isAllowed = () => {
        if (!profile?.id || role !== 'admin' || !businessId) return false;
        return true;
    }

    const onManageAdminsPress = () => {
        if (!isAllowed()) return;
        router.push('/(main)/admin/personnel/list');
    }

    const onManageOffersPress = () => {
        if (!isAllowed()) return;
        router.push({
            pathname: '/(main)/admin/offer/list',
            params: { businessId }
        });
    }

    const onAddAdminPress = () => {
        if (!isAllowed()) return;
        router.push('/(main)/admin/personnel/write');
    }

    const onWriteOffer = (id: string | null = null) => {
        if (!isAllowed()) return;
        router.push({
            pathname: '/(main)/admin/offer/write',
            params: { offerId: id }
        })
    }

    /**
     * Navigates to the trail list/management screen.
     * Accessible by both admins and superadmins.
     */
    const onManageTrailsPress = () => {
        if (!isAllowed()) return;
        router.push('/(main)/superadmin/trail/list');
    }

    return {
        onManageAdminsPress,
        onManageOffersPress,
        onAddAdminPress,
        onWriteOffer,
        onManageTrailsPress,
    }
}