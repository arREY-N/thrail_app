import React from "react";
import { StyleSheet, Text, View } from "react-native";

const TrailMap: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ Map is not available on web.</Text>
      <Text style={styles.sub}>
        Please use the mobile app to access navigation.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  sub: { fontSize: 14, color: "#666" },
});

export default TrailMap;
