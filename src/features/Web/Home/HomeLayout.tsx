import type { Href } from "expo-router";
import { router, usePathname, useSegments } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import CustomImage from "@/src/components/CustomImage";
import CustomText from "@/src/components/CustomText";
import { BRAND } from "@/src/constants/branding";
import { Colors, Palette } from "@/src/constants/colors";

type TabKey = "home" | "explore" | "community" | "profile";

interface NavItem {
  key: TabKey;
  label: string;
  href: Href;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/(tabs)" as Href },
  { key: "explore", label: "Explore", href: "/(tabs)/explore" as Href },
  { key: "community", label: "Community", href: "/(tabs)/community" as Href },
  { key: "profile", label: "Profile", href: "/(tabs)/profile" as Href },
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
      {/* Brand Title Row with Emblem */}
      <View style={styles.brandLockup}>
        <CustomImage
          source={BRAND.ASSETS.GLYPH_GREEN}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <CustomText variant="h2" style={styles.brandTitle}>
          Thrail
        </CustomText>
      </View>

      {/* Navigation Links */}
      <View style={styles.navLinks}>
        {NAV_ITEMS.map((item) => {
          const active = isTabActive(item.key);

          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href)}
              style={({ hovered }) => [
                styles.navItem,
                active && styles.navItemActive,
                hovered && !active && styles.navItemHovered,
              ]}
            >
              {({ hovered }) => (
                <CustomText
                  variant="body"
                  style={[
                    styles.linkText,
                    active && styles.linkTextActive,
                    hovered && !active && styles.linkTextHovered,
                  ]}
                >
                  {item.label}
                </CustomText>
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
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandLogo: {
    width: 26,
    height: 26,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.PRIMARY,
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
  },
  navItemActive: {
    backgroundColor: Palette.Green50,
    borderColor: Palette.Green200,
  },
  navItemHovered: {
    backgroundColor: Palette.Neutral75,
  },
  linkText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.TEXT_SECONDARY,
  },
  linkTextActive: {
    color: Colors.PRIMARY,
    fontWeight: "700",
  },
  linkTextHovered: {
    color: Colors.PRIMARY,
  },
});

export default WebTab;
