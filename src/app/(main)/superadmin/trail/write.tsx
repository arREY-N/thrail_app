import LoadingScreen from "@/src/app/loading";
import TESTWRITETRAIL from "@/src/components/TESTCOMPONENTS/TestWriteTrail";
import useTrailWrite from "@/src/core/hook/trail/useTrailWrite";
import { useLocalSearchParams } from "expo-router";

export default function write(){
    const { trailId: rawTrailId } = useLocalSearchParams();
    
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const controller = useTrailWrite({ trailId });
    
    if(!controller.object) return <LoadingScreen/>

    return (
        <TESTWRITETRAIL { ...controller }/>
    )
}