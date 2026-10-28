import { router } from "expo-router";

export function useProfileNavigation(){
    /** Navigate to Admin Dashboard */
    const onAdminPress = () => {
        router.push('/admin');
    }
    
    /** Navigate to Superadmin Dashboard */
    const onSuperadminPress = () => {
        router.push('/superadmin');
    }

    /** Navigate to User Profile */
    const onViewAccountPress = (userId: string) => {
        router.push({
            pathname: '/user/view',
            params: { userId }
        });
    }

    /** Navigate to Business Application Screen */
    const onApplyPress = () => {
        router.push('/business/apply');
    }

    return {
        onAdminPress, 
        onSuperadminPress,
        onViewAccountPress,
        onApplyPress
    }
}