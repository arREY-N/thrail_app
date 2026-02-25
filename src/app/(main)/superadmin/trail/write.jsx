import LoadingScreen from "@/src/app/loading";
import TESTWRITETRAIL from "@/src/components/TESTCOMPONENTS/TestWriteTrail";
import useTrailWrite from "@/src/core/hook/useTrailWrite";
import { useLocalSearchParams } from "expo-router";

export default function write(){
    const { trailId } = useLocalSearchParams();
    
    const {
        information,
        trail,
        error,
        isLoading,
        options,
        onSubmitPress,
        onRemovePress,
        onEditProperty,
    } = useTrailWrite({id: trailId});
    
    if(!trail) return <LoadingScreen/>

    return (
        <TESTWRITETRAIL
            options={options}
            informationSet={information}
            trail={trail}
            system={error}
            isLoading={isLoading}
            onSubmitTrailPress={onSubmitPress}
            onRemoveTrailPress={onRemovePress}
            onEditProperty={onEditProperty}
        />
    )
}