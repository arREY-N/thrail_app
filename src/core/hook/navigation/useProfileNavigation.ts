import { router } from "expo-router";

export function useProfileNavigation(){
    /** Navigate to Admin Dashboard */
    const onAdminPress = () => {
        router.push('/(main)/admin')
    }
    
    /** Navigate to Superadmin Dashboard */
    const onSuperadminPress = () => {
        router.push('/(main)/superadmin');
    }

    /** Navigate to User Profile */
    const onViewAccountPress = (userId: string) => {
        router.push({
            pathname: '/(main)/user/view',
            params: { userId }
        })
    }

    /** Navigate to Business Application Screen */
    const onApplyPress = () => {
        router.push('/(main)/business/apply')
    }

    return {
        onAdminPress, 
        onSuperadminPress,
        onViewAccountPress,
        onApplyPress
    }
}