import { useAppNavigation } from "@/src/core/hook/useAppNavigation";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "react-native";

import TESTTRAIL from '@/src/components/TESTCOMPONENTS/TestTrail';

export default function trail(){
    const { trailId } = useLocalSearchParams();
    const trails = useTrailsStore((state) => state.trails);
    const { onDownloadPress } = useAppNavigation();
    const router = useRouter();

    const trail = trails.find((t) => t.id === trailId ? t : null);

    const onBookPress = (trailId) => {
        router.push({
            pathname: '/offer/view',
            params: {trailId} 
        })
    }

    const onHikePress = (trailId) => {
        router.replace({
            pathname: '/hike/view',
            params: { trailId } 
        })
    }

    if(!trail) return <Text>Trail {trailId} not found</Text>
    
    return(
        <TESTTRAIL 
            trail={trail}
            onDownloadPress={onDownloadPress}
            onBookPress={onBookPress}
            onHikePress={onHikePress}
        />
    )    
}

