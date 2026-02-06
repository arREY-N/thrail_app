import useTrailHook from '@/src/core/hook/useTrailHook';
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

import TESTTRAIL from '@/src/components/TESTCOMPONENTS/TestTrail';
import LoadingScreen from '../../loading';

export default function viewTrail(){
    const { trailId } = useLocalSearchParams();

    const { 
        trail, 
        onDownloadPress, 
        onBookPress, 
        onHikePress, 
        loading, 
    } = useTrailHook({ trailId, mode: 'view' });

    if(loading) return <LoadingScreen/>

    if(!loading && !trail) return <Text>Trail {trailId} not found</Text>
    
    return(
        <TESTTRAIL 
            trail={trail}
            onDownloadPress={onDownloadPress}
            onBookPress={onBookPress}
            onHikePress={onHikePress}
        />
    )    
}

