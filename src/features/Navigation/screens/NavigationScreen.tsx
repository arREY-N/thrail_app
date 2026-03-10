import TrailMap from "@/src/features/Map/TrailMap";
import React from "react";
import { StyleSheet, View } from "react-native";

const NavigationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <TrailMap />
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
