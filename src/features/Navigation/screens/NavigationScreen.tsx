import TrailMap from "@/src/features/Map/TrailMap";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Platform, Animated, Dimensions } from "react-native";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
import { Colors } from "@/src/constants/colors";

const { height: screenHeight } = Dimensions.get("window");

const NavigationScreen = ({ lon, lat }: any) => {
  // Pull live data from the teammate's global store to verify it works
  const currentHike = useHikesStore((state: any) => state.currentHike);
  const gpsError = useHikesStore((state: any) => state.gpsError);
  const liveCoordinatesCount = currentHike?.coordinates?.length || 0;

  // Normalize lon/lat in case they come in as arrays from useLocalSearchParams
  const normalizedLon = Array.isArray(lon) ? lon[0] : lon;
  const normalizedLat = Array.isArray(lat) ? lat[0] : lat;

  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <TrailMap initialLon={normalizedLon} initialLat={normalizedLat} />

      {gpsError && (
        <View style={styles.errorIndicatorPill}>
          <Text style={styles.errorText}>{gpsError}</Text>
        </View>
      )}

      <View style={styles.liveIndicatorPill}>
        <Animated.View style={[styles.pulsingDot, { opacity }]} />
        <Text style={styles.debugText}>Tracking</Text>
        {liveCoordinatesCount > 0 && (
          <Text style={styles.liveCoordText}> • {liveCoordinatesCount} pts</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: screenHeight * 0.75, // Deep expansive map feel
    backgroundColor: Colors.BACKGROUND,
    width: "100%",
    // Edge-to-edge layout, no margins or borders
  },
  errorIndicatorPill: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "#FF3B30", // Crisp danger red
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
      },
    }),
  },
  errorText: {
    color: Colors.WHITE,
    fontWeight: "bold",
    fontSize: 14,
  },
  liveIndicatorPill: {
    position: "absolute",
    bottom: 40, // safely tucked in the bottom left, clear of top pills and bottom right controls
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30, // Fully rounded Google UI pill
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6, // Crisp distinct shadow
      },
      web: {
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
      },
    }),
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.PRIMARY, // A solid active color
    marginRight: 8,
  },
  debugText: {
    color: "#202124", // Google's primary dark text color
    fontWeight: "600",
    fontSize: 14,
  },
  liveCoordText: {
    color: "#5F6368", // Google's secondary gray text color
    fontWeight: "500",
    fontSize: 13,
  },
});

export default NavigationScreen;
