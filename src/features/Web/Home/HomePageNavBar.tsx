import type { Href } from "expo-router";
import { router, usePathname, useSegments } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
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

// ── Base Navigation Sections (Available for all users) ──
const BASE_NAV_SECTIONS: NavSection[] = [
  {
    title: "MENU",
    items: [
      {
        id: "home",
        label: "Home",
        icon: "home",
        library: "Feather",
        route: "/",
      },
      {
        id: "explore",
        label: "Explore Trails",
        icon: "compass",
        library: "Feather",
        route: "/explore",
      },
      {
        id: "hikes",
        label: "My Hikes",
        icon: "map-pin",
        library: "Feather",
        route: "/hike",
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
        route: "/community",
      },
      {
        id: "messages",
        label: "Messages",
        icon: "message-square",
        library: "Feather",
        route: "/group/list",
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: "settings",
        library: "Feather",
        route: "/settings",
      },
    ],
  },
];

// ── Superadmin Navigation Sections ──
const SUPERADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "ADMIN MAIN",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "grid",
        library: "Feather",
        route: "/superadmin",
      },
      {
        id: "application",
        label: "Applications",
        icon: "file-text",
        library: "Feather",
        route: "/superadmin/application/list",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        id: "business",
        label: "Tour Businesses",
        icon: "briefcase",
        library: "Feather",
        route: "/superadmin/business/list",
      },
      {
        id: "trail",
        label: "Trails & Routes",
        icon: "map",
        library: "Feather",
        route: "/superadmin/trail/list",
      },
      {
        id: "mountain",
        label: "Mountains Database",
        icon: "mountain",
        library: "FontAwesome5",
        route: "/superadmin/mountain/list",
      },
      {
        id: "user",
        label: "User Accounts",
        icon: "users",
        library: "Feather",
        route: "/superadmin/user/list",
      },
    ],
  },
];

// ── Admin (Business Admin) Navigation Sections ──
const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "MANAGEMENT",
    items: [
      {
        id: "business",
        label: "Offers",
        icon: "briefcase",
        library: "Feather",
        route: "/admin/offer/list",
      },
      {
        id: "trail",
        label: "Trails & Routes",
        icon: "map",
        library: "Feather",
        route: "/admin/trail/list",
      },
      {
        id: "personnel",
        label: "Personnel",
        icon: "map",
        library: "Feather",
        route: "/admin/personnel/list",
      },
    ],
  },
];

interface HomeSidebarProps {
  /** Callback to close the drawer when a nav item is pressed */
  onClose?: () => void;
}

export const HomeSidebar = ({ onClose }: HomeSidebarProps) => {
  const pathname = usePathname();
  const segments = useSegments();

  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);

  const fullName = profile
    ? `${profile.firstname || ""} ${profile.lastname || ""}`.trim()
    : "";
  const displayName = fullName || profile?.username || "Hiker";
  const initials = getInitials(displayName !== "Hiker" ? displayName : "TH");

  const roleTitle =
    role === "superadmin"
      ? "System Administrator"
      : role === "admin"
        ? "Business Admin"
        : "Explorer";

  // Combine menu sections dynamically based on user role
  const navSections = [
    ...BASE_NAV_SECTIONS,
    ...(role === "superadmin"
      ? SUPERADMIN_NAV_SECTIONS
      : role === "admin"
        ? ADMIN_NAV_SECTIONS
        : []),
  ];

  const isItemActive = (route: Href) => {
    const routeStr = typeof route === "string" ? route : (route as { pathname?: string }).pathname || "";
    const currentPath = (pathname || "").toLowerCase();
    const segs = (segments as string[]).map((s) => s.toLowerCase());

    if (routeStr === "/" || routeStr === "/(tabs)") {
      return (
        currentPath === "/" ||
        currentPath === "" ||
        currentPath === "/(tabs)" ||
        currentPath === "/home" ||
        (segs.includes("(tabs)") && (!segs[1] || segs[1] === "index"))
      );
    }

    if (routeStr === "/superadmin" || routeStr === "/(main)/superadmin") {
      return (
        currentPath === "/superadmin" ||
        currentPath === "/(main)/superadmin" ||
        (segs.includes("superadmin") && segs.length <= 2)
      );
    }

    const keyword = routeStr
      .replace("/(tabs)/", "")
      .replace("/(main)/", "")
      .replace("/superadmin/", "")
      .replace("/admin/", "")
      .replace("/list", "")
      .replace("/", "");

    return currentPath.includes(keyword) || segs.includes(keyword);
  };

  const isProfileActive = (pathname || "").toLowerCase().includes("profile");

  const handleNavPress = (route: Href) => {
    router.push(route);
    onClose?.();
  };

  return (
    <View style={styles.sidebar}>
      {/* Top Header: User Profile Card */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={[
            styles.profileHeaderRow,
            isProfileActive && styles.profileHeaderRowActive,
          ]}
          onPress={() => handleNavPress("/profile")}
          activeOpacity={0.7}
        >
          {/* Avatar Circle */}
          <View style={styles.avatarCircle}>
            <CustomText style={styles.avatarText}>{initials}</CustomText>
          </View>

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
              {roleTitle}
            </CustomText>
          </View>
        </TouchableOpacity>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <CustomIcon
            library="Feather"
            name="x"
            size={20}
            color={Colors.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Navigation Links */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.navListContainer}
        showsVerticalScrollIndicator={false}
      >
        {navSections.map((section, sIndex) => (
          <View key={section.title || sIndex} style={styles.sectionGroup}>
            {section.title && (
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
                  ]}
                  onPress={() => handleNavPress(item.route)}
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
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.BACKGROUND,
  },
  scrollList: {
    flex: 1,
  },
  navListContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  sectionGroup: {
    gap: 4,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
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
