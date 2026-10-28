import React, { useCallback, useEffect, useRef } from "react";
import {
    GestureResponderEvent,
    Platform,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

import CustomIcon from "@/src/components/CustomIcon";
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
} from "@/src/components/Tutorial/Tutorial";
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { IconLibrary } from "@/src/types/ui.types";

/**
 * A floating action button (FAB) component placed at the bottom right.
 */
interface CustomFABProps {
  onPress?: (event: GestureResponderEvent) => void;
  iconLibrary?: IconLibrary;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

const CustomFAB: React.FC<CustomFABProps> = ({
  onPress,
  iconLibrary = "Ionicons",
  iconName = "chatbubbles",
  iconSize = 28,
  iconColor = Colors.WHITE,
  backgroundColor = Colors.PRIMARY,
  style,
}) => {
  const fabRef = useRef<View>(null);

  const measureFabNow = useCallback(() => {
    fabRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        registerTutorialLayout("fab_messages", { x, y, width, height });
      }
    });
  }, []);

  const handleLayout = useCallback(() => {
    if (!isTutorialMeasurementActive()) return;
    measureFabNow();
  }, [measureFabNow]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    return registerMeasureCallback("fab_messages", measureFabNow);
  }, [measureFabNow]);

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <View
      ref={fabRef}
      onLayout={handleLayout}
      collapsable={false}
      style={[styles.fab, { backgroundColor: backgroundColor }, style]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel="Messages and group chats"
      >
        <CustomIcon
          library={iconLibrary}
          name={iconName}
          size={iconSize}
          color={iconColor}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...GlobalStyles.dropShadow(6, 0.3, Colors.SHADOW, {
      offset: { width: 0, height: 4 },
      radius: 6,
    }),
    zIndex: 1000,
  },
  touchable: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CustomFAB;
