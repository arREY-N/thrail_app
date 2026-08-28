import { Slot } from "expo-router";
import { StyleSheet, View } from "react-native";

import HomeSidebar from "@/src/features/Web/Home/HomePageNavBar";

export default function WebTabLayout() {
  return (
    <View style={styles.webContainer}>
      {/* Left Sidebar Navigation */}
      <HomeSidebar />

      <View style={styles.mainContent}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    height: "100vh" as any,
    overflow: "hidden",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#166534",
  },
  navLinks: {
    flexDirection: "row",
    gap: 24,
  },
  link: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    textDecorationLine: "none",
  },
  mainContent: {
    flex: 1,
    padding: 3,
    height: "100%",
    width: "100%",
    maxWidth: "100%",
    marginHorizontal: "auto",
  },
});
