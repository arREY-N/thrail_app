/**
 * @file _layout.web.tsx
 * @description Web-specific layout for all authenticated screens inside (app).
 * Provides the WebDrawerContext and sliding navigation drawer overlay for both (tabs) and (main) routes.
 */
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import LoadingScreen from "@/src/app/loading";
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { WebDrawerContext } from "@/src/core/context/WebDrawerContext";
import { useAppSubscriptions } from "@/src/core/hook/useAppSubscriptions";
import { useAuthHook, useRouteGuard } from "@/src/core/models/User/User";
import { HomeSidebar } from "@/src/features/Web/Home/HomePageNavBar";

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.8, 280);

export default function WebAppLayout() {
  const { isLoading } = useAuthHook();
  useRouteGuard();
  useAppSubscriptions();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const [slideAnim] = useState(() => new Animated.Value(-DRAWER_WIDTH));
  const [backdropAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (isDrawerOpen) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: false,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: false,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [backdropAnim, isDrawerOpen, slideAnim]);

  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  if (isLoading) return <LoadingScreen />;

  return (
    <WebDrawerContext.Provider value={{ toggleDrawer, isDrawerOpen }}>
      <View style={styles.webContainer}>
        {/* ── Main Screen Content ── */}
        <View style={styles.mainContent}>
          <Slot />
        </View>

        {/* ── Drawer Overlay (backdrop + sliding panel) ── */}
        {shouldRender && (
          <View style={styles.drawerOverlay}>
            {/* Backdrop */}
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer}>
              <Animated.View
                style={[
                  styles.backdrop,
                  {
                    opacity: backdropAnim,
                  },
                ]}
              />
            </Pressable>

            {/* Drawer Panel */}
            <Animated.View
              style={[
                styles.drawerPanel,
                {
                  width: DRAWER_WIDTH,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <HomeSidebar onClose={closeDrawer} />
            </Animated.View>
          </View>
        )}
      </View>
    </WebDrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: Colors.BACKGROUND,
  },
  mainContent: {
    flex: 1,
  },
  drawerOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawerPanel: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: Colors.WHITE,
    ...GlobalStyles.dropShadow(8),
    zIndex: 210,
  },
});
