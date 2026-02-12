import LoadingScreen from "@/src/app/loading";
import TESTWRITETRAIL from "@/src/components/TESTCOMPONENTS/TestWriteTrail";
import useTrailHook from "@/src/core/hook/useTrailHook";
import { useLocalSearchParams } from "expo-router";

export default function write(){
    const { trailId } = useLocalSearchParams();
    
    const {
        information,
        trail,
        error,
        loading,
        onSubmitPress,
        onRemovePress,
        onEditProperty
    } = useTrailHook({ trailId, mode: 'write' })
    
    if(!trail) return <LoadingScreen/>

    return (
        <TESTWRITETRAIL
            informationSet={information}
            trail={trail}
            system={error}
            isLoading={loading}
            onSubmitTrailPress={onSubmitPress}
            onRemoveTrailPress={onRemovePress}
            onEditProperty={onEditProperty}
        />
    )
}