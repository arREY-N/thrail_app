import type { Href } from "expo-router";
import { router, usePathname, useSegments } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { useAuthStore } from "@/src/core/models/User/User";
import { IconLibrary } from "@/src/types/ui.types";
import { getInitials } from "@/src/utils/dateFormatter";

interface NavItemConfig {
  id: string;
  label: string;
  icon: string;
  library: IconLibrary;
  route: Href;
}

interface NavSection {
  title?: string;
  items: NavItemConfig[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "MENU",
    items: [
      {
        id: "home",
        label: "Home",
        icon: "home",
        library: "Feather",
        route: "/(tabs)",
      },
      {
        id: "explore",
        label: "Explore Trails",
        icon: "compass",
        library: "Feather",
        route: "/(tabs)/explore",
      },
      {
        id: "hikes",
        label: "My Hikes",
        icon: "map-pin",
        library: "Feather",
        route: "/(tabs)/hike",
      },
    ],
  },
  {
    title: "SOCIAL",
    items: [
      {
        id: "community",
        label: "Community",
        icon: "users",
        library: "Feather",
        route: "/(tabs)/community",
      },
      {
        id: "messages",
        label: "Messages",
        icon: "message-square",
        library: "Feather",
        route: "/(main)/group/list",
      },
    ],
  },
];

export const HomeSidebar = () => {
  const pathname = usePathname();
  const segments = useSegments();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const profile = useAuthStore((s) => s.profile);
  const fullName = profile
    ? `${profile.firstname || ""} ${profile.lastname || ""}`.trim()
    : "";
  const displayName = fullName || profile?.username || "Hiker";
  const initials = getInitials(displayName !== "Hiker" ? displayName : "TH");

  const isItemActive = (route: Href) => {
    const routeStr = String(route);
    const currentPath = (pathname || "").toLowerCase();
    const segs = (segments as string[]).map((s) => s.toLowerCase());

    if (routeStr === "/(tabs)") {
      return (
        currentPath === "/" ||
        currentPath === "" ||
        currentPath === "/(tabs)" ||
        currentPath === "/home" ||
        (segs.includes("(tabs)") && (!segs[1] || segs[1] === "index"))
      );
    }

    const keyword = routeStr
      .replace("/(tabs)/", "")
      .replace("/(main)/", "")
      .replace("/", "");
    return currentPath.includes(keyword) || segs.includes(keyword);
  };

  const isProfileActive = (pathname || "").toLowerCase().includes("profile");

  return (
    <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
      {/* Top Header: Explorer Profile Card + Minimize Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={[
            styles.profileHeaderRow,
            isProfileActive && styles.profileHeaderRowActive,
            isCollapsed && styles.profileHeaderRowCollapsed,
          ]}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          {/* Avatar Circle ("ZO") */}
          <View style={styles.avatarCircle}>
            <CustomText style={styles.avatarText}>{initials}</CustomText>
          </View>

          {!isCollapsed && (
            <View style={styles.profileTextWrapper}>
              <CustomText
                variant="body"
                style={[
                  styles.profileName,
                  isProfileActive && styles.profileNameActive,
                ]}
                numberOfLines={1}
              >
                {displayName}
              </CustomText>
              <CustomText
                variant="caption"
                style={styles.profileRole}
                numberOfLines={1}
              >
                Explorer
              </CustomText>
            </View>
          )}
        </TouchableOpacity>

        {/* Desktop Minimize Toggle Button (Expanded state) */}
        {!isCollapsed && (
          <TouchableOpacity
            style={styles.minimizeBtn}
            onPress={() => setIsCollapsed(!isCollapsed)}
            activeOpacity={0.7}
          >
            <CustomIcon
              library="Feather"
              name="sidebar"
              size={16}
              color={Colors.PRIMARY}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Minimize Toggle Button (Collapsed state) */}
      {isCollapsed && (
        <View style={styles.minimizeCollapsedWrapper}>
          <TouchableOpacity
            style={styles.minimizeBtn}
            onPress={() => setIsCollapsed(!isCollapsed)}
            activeOpacity={0.7}
          >
            <CustomIcon
              library="Feather"
              name="sidebar"
              size={16}
              color={Colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Links */}
      <View style={styles.navList}>
        {NAV_SECTIONS.map((section, sIndex) => (
          <View key={section.title || sIndex} style={styles.sectionGroup}>
            {!isCollapsed && section.title && (
              <View style={styles.sectionHeaderContainer}>
                <CustomText variant="caption" style={styles.sectionTitleText}>
                  {section.title}
                </CustomText>
              </View>
            )}

            {section.items.map((item) => {
              const isActive = isItemActive(item.route);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                    isCollapsed && styles.navItemCollapsed,
                  ]}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.navIconWrapper}>
                    <CustomIcon
                      library={item.library}
                      name={item.icon}
                      size={18}
                      color={isActive ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                    />
                  </View>

                  {!isCollapsed && (
                    <CustomText
                      variant="body"
                      style={[
                        styles.navLabel,
                        isActive && styles.navLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </CustomText>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    height: "100%",
    backgroundColor: Colors.WHITE,
    borderRightWidth: 1,
    borderRightColor: Colors.GRAY_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 16,
    ...GlobalStyles.dropShadow(1),
  },
  sidebarCollapsed: {
    width: 68,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.GRAY_ULTRALIGHT,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  profileHeaderRowActive: {
    backgroundColor: Colors.CHIP_PRIMARY_BG,
  },
  profileHeaderRowCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.WHITE,
    fontWeight: "bold",
    fontSize: 13,
  },
  profileTextWrapper: {
    flex: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.TEXT_PRIMARY,
  },
  profileNameActive: {
    color: Colors.PRIMARY,
  },
  profileRole: {
    fontSize: 11,
    color: Colors.TEXT_SECONDARY,
  },
  minimizeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.BACKGROUND,
  },
  minimizeCollapsedWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  navList: {
    flex: 1,
    gap: 12,
  },
  sectionGroup: {
    gap: 4,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitleText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.TEXT_SECONDARY,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  navItemCollapsed: {
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  navItemActive: {
    backgroundColor: Colors.CHIP_PRIMARY_BG,
  },
  navIconWrapper: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 13,
    color: Colors.TEXT_SECONDARY,
    fontWeight: "500",
  },
  navLabelActive: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
});

export default HomeSidebar;
