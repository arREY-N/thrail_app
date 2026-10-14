import { router, usePathname, useSegments } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Palette } from "@/src/constants/colors";

type TabKey = "home" | "explore" | "community" | "profile";

interface NavItem {
  key: TabKey;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/(tabs)" },
  { key: "explore", label: "Explore", href: "/(tabs)/explore" },
  { key: "community", label: "Community", href: "/(tabs)/community" },
  { key: "profile", label: "Profile", href: "/(tabs)/profile" },
];

const WebTab = () => {
  const pathname = usePathname();
  const segments = useSegments();

  // Robust check that works with web URLs (like /explore, /profile, /)
  const isTabActive = (key: TabKey) => {
    const path = (pathname || "").toLowerCase();
    const segs = (segments as string[]).map((s) => s.toLowerCase());

    switch (key) {
      case "home":
        return (
          path === "/" ||
          path === "/(tabs)" ||
          path === "/(tabs)/index" ||
          path === "" ||
          (!path.includes("explore") &&
            !path.includes("community") &&
            !path.includes("profile") &&
            !path.includes("hike"))
        );
      case "explore":
        return path.includes("explore") || segs.includes("explore");
      case "community":
        return path.includes("community") || segs.includes("community");
      case "profile":
        return path.includes("profile") || segs.includes("profile");
      default:
        return false;
    }
  };

  return (
    <View style={styles.navBar}>
      {/* Brand Title */}
      <Text style={styles.brandTitle}>Thrail</Text>

      {/* Navigation Links */}
      <View style={styles.navLinks}>
        {NAV_ITEMS.map((item) => {
          const active = isTabActive(item.key);

          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as any)}
              style={({ hovered }) => [
                styles.navItem,
                active && styles.navItemActive,
                hovered && !active && styles.navItemHovered,
              ]}
            >
              {({ hovered }) => (
                <Text
                  style={[
                    styles.linkText,
                    active && styles.linkTextActive,
                    hovered && !active && styles.linkTextHovered,
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.PRIMARY, // Palette.Green700 (#2E7D32)
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      } as any,
    }),
  },
  navItemActive: {
    backgroundColor: Palette.Green50, // Light green pill background (#E8F5E9)
    borderColor: Palette.Green200, // Subtle green border (#A5D6A7)
  },
  navItemHovered: {
    backgroundColor: Palette.Neutral75, // Light gray on hover
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.TEXT_SECONDARY, // Gray (#686868)
    ...Platform.select({
      web: {
        transition: "color 0.2s ease-in-out",
      } as any,
    }),
  },
  linkTextActive: {
    color: Colors.PRIMARY, // Primary Green (#2E7D32)
    fontWeight: "700",
  },
  linkTextHovered: {
    color: Colors.PRIMARY,
  },
});

export default WebTab;
