import React from "react";
import { StyleSheet, View } from "react-native";
import TrailMap from "../../Map/TrailMap";

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
