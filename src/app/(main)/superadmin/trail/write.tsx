import LoadingScreen from "@/src/app/loading";
import TESTWRITETRAIL from "@/src/components/TESTCOMPONENTS/TestWriteTrail";
import useTrailWrite from "@/src/core/hook/trail/useTrailWrite";
import { useLocalSearchParams } from "expo-router";

import CustomHeader from "@/src/components/CustomHeader";
import ScreenWrapper from "@/src/components/ScreenWrapper";
import { Colors } from "@/src/constants/colors";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

/**
 * Trail write/editor screen.
 * Provides the interface to create a new trail or edit general info for an existing trail.
 * Renders the TestWriteTrail form component.
 * 
 * @returns {React.ReactElement} The trail edit form wrapper.
 */
export default function write() {
  const { trailId: rawTrailId } = useLocalSearchParams();

  const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

  const { onBackPress } = useAppNavigation();
  const controller = useTrailWrite({ trailId });

  if (!controller.object) return <LoadingScreen />;

  return (
    <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
      <CustomHeader
        title={trailId ? "Edit Trail" : "New Trail"}
        centerTitle={true}
        onBackPress={onBackPress}
      />

      <TESTWRITETRAIL {...controller} />
    </ScreenWrapper>
  );
}
