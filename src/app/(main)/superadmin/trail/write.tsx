import LoadingScreen from "@/src/app/loading";
import TESTWRITETRAIL from "@/src/components/TESTCOMPONENTS/TestWriteTrail";
import useTrailWrite from "@/src/core/hook/trail/useTrailWrite";
import { useLocalSearchParams } from "expo-router";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

export default function write(){
    const { trailId: rawTrailId } = useLocalSearchParams();
    
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const controller = useTrailWrite({ trailId });
    
    if(!controller.object) return <LoadingScreen/>

    const { onBackPress } = useAppNavigation();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Applications" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <TESTWRITETRAIL { ...controller }/>
        </ScreenWrapper>
    )
}