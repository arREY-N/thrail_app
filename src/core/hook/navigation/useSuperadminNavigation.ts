import { router } from "expo-router"

export default function useSuperadminNavigation(){
    const onManageBusinessPress = () => {
        router.push({
            pathname: '/(main)/superadmin/business/list'
        })
    }

    const onManageTrailsPress = () => {
        router.push({
            pathname: '/(main)/superadmin/trail/list'
        })
    }
    
    const onManageUsersPress = () => {
        router.push({
            pathname: '/(main)/superadmin/user/list'
        })
    }
    
    const onManageMountainPress = () => {
        router.push({
            pathname: '/(main)/superadmin/mountain/list'
        })
    }

    function onWriteTrail(trailId: string | null = null){
        console.log('to write', trailId);
        if(trailId){
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: {trailId}
            });
        } else {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
            });
        }
    }

    
    return {
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress,
        onWriteTrail,
    }
}