import LoadingScreen from "@/src/app/loading";
import TESTWRITETRAIL from "@/src/components/TESTCOMPONENTS/TestWriteTrail";
import useTrailWrite from "@/src/core/hook/trail/useTrailWrite";
import { useLocalSearchParams } from "expo-router";

export default function write(){
    const { trailId: rawTrailId } = useLocalSearchParams();
    
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

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

    console.log('edit: ', trail);
    
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