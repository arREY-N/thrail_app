import { router } from "expo-router"

/**
 * Custom hook providing navigation handlers for the Superadmin management panel dashboard.
 * 
 * @returns {object} Navigation callbacks.
 */
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

    /**
     * Navigates to the trail creation or information editing screen.
     * 
     * @param {string | null} [trailId=null] - Optional ID of the trail to edit. If null, navigates to create a new trail.
     */
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

    
    return {
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress,
        onWriteTrail,
        onEditMapPins,
    }
}