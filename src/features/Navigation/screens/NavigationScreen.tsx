import TrailMap from "@/src/features/Map/TrailMap";
import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";

const NavigationScreen: React.FC = () => {
  // Pull live data from the teammate's global store to verify it works
  const currentHike = useHikesStore((state: any) => state.currentHike);
  const liveCoordinatesCount = currentHike?.coordinates?.length || 0;

  return (
    <View style={styles.container}>
      <TrailMap />

      {/* Floating debug overlay to prove the global store is updating */}
      <View
        style={{
          position: "absolute",
          top: 100,
          left: 20,
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Live Store Points: {liveCoordinatesCount}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 500, // Forces the map to render when wrapped in a ScrollView!
    backgroundColor: "#fff",
    overflow: 'hidden',
    borderRadius: 16,
    marginVertical: 10,
  },
});

export default NavigationScreen;
