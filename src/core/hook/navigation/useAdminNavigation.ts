import { Role } from "@/src/core/models/User/interfaces/User.types";
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
export default function useAdminNavigation(params: UseAdminNavigationParams) {
    const { userId, businessId, role } = params;

    const onManageAdminsPress = () => {
        router.push('/(main)/admin/personnel/list');
    }

    const onManageOffersPress = () => {
        router.push({
            pathname: '/(main)/admin/offer/list',
            params: { businessId }
        });
    }

    const onAddAdminPress = () => {
        router.push('/(main)/admin/personnel/write');
    }

    const onWriteOffer = (id: string | null = null) => {
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