import TrailMap from "@/src/features/Map/TrailMap";
import React from "react";
import { StyleSheet, View } from "react-native";

const NavigationScreen = ({ lon, lat }: any) => {
  return (
    <View style={styles.container}>
      <TrailMap initialLon={lon} initialLat={lat} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default NavigationScreen;
