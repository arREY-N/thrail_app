import { Role } from "@/src/core/models/User/User.types";
import { router } from "expo-router";

export type UseAdminNavigationParams = {
    userId: string;
    businessId: string;
    role: Role;
}

export default function useAdminNavigation(params: UseAdminNavigationParams){
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

    const onWriteOffer = (id: string) => {
        router.push({
            pathname: '/(main)/admin/offer/write',
            params: { offerId: id }
        })
    }

    return {
        onManageAdminsPress,
        onManageOffersPress,
        onAddAdminPress,
    }
}