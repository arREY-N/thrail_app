import type { Href } from "expo-router";
import { router, usePathname, useSegments } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import ConfirmationModal from "@/src/components/ConfirmationModal";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { SignOutFlow } from "@/src/core/flows/SignOutFlow";
import { useAuthStore } from "@/src/core/models/User/User";
import { IconLibrary } from "@/src/types/ui.types";
import { getInitials } from "@/src/utils/dateFormatter";
import { useState } from "react";

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
        route: "/(app)/(tabs)",
      },
      {
        id: "explore",
        label: "Explore Trails",
        icon: "compass",
        library: "Feather",
        route: "/(app)/(tabs)/explore",
      },
      {
        id: "community",
        label: "Community",
        icon: "users",
        library: "Feather",
        route: "/(app)/(tabs)/community",
      },
      {
        id: "profile",
        label: "Profile",
        icon: "user",
        library: "Feather",
        route: "/(app)/(tabs)/profile",
      },
      {
        id: "messages",
        label: "Messages",
        icon: "message-square",
        library: "Feather",
        route: "/(app)/(main)/group/list",
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
        route: "/(app)/(main)/settings",
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
        route: "/(app)/(main)/superadmin",
      },
      {
        id: "application",
        label: "Applications",
        icon: "file-text",
        library: "Feather",
        route: "/(app)/(main)/superadmin/application/list",
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
        route: "/(app)/(main)/superadmin/business/list",
      },
      {
        id: "trail",
        label: "Trails & Routes",
        icon: "map",
        library: "Feather",
        route: "/(app)/(main)/superadmin/trail/list",
      },
      {
        id: "mountain",
        label: "Mountains Database",
        icon: "mountain",
        library: "FontAwesome5",
        route: "/(app)/(main)/superadmin/mountain/list",
      },
      {
        id: "user",
        label: "User Accounts",
        icon: "users",
        library: "Feather",
        route: "/(app)/(main)/superadmin/user/list",
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
        route: "/(app)/(main)/admin/offer/list",
      },
      {
        id: "trail",
        label: "Trails & Routes",
        icon: "map",
        library: "Feather",
        route: "/(app)/(main)/superadmin/trail/list",
      },
      {
        id: "personnel",
        label: "Personnel",
        icon: "map",
        library: "Feather",
        route: "/(app)/(main)/admin/personnel/list",
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

    if (routeStr === "/(main)/superadmin") {
      return (
        currentPath === "/superadmin" ||
        currentPath === "/(main)/superadmin" ||
        (segs.includes("superadmin") && segs.length <= 2)
      );
    }

    const keyword = routeStr
      .replace("/(app)/", "")
      .replace("/(tabs)/", "")
      .replace("/(main)/", "")
      .replace("/superadmin/", "")
      .replace("/list", "")
      .replace("/", "");

    return currentPath.includes(keyword) || segs.includes(keyword);
  };

  const handleNavPress = (route: Href) => {
    router.push(route);
    onClose?.();
  };

  const { signOut } = SignOutFlow();
  const [showSignOutModal, setShowSignOutModal] = useState<boolean>(false);

  return (
    <View style={styles.sidebar}>
      {/* Top Header: User Info Header */}
      <View style={styles.topHeader}>
        <View style={styles.profileHeaderRow}>
          {/* Avatar Circle */}
          <View style={styles.avatarCircle}>
            <CustomText style={styles.avatarText}>{initials}</CustomText>
          </View>

          <View style={styles.profileTextWrapper}>
            <CustomText
              variant="body"
              style={styles.profileName}
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
        </View>

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

      {/* Log Out Section at bottom of Sidebar */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={() => setShowSignOutModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.navIconWrapper}>
            <CustomIcon
              library="Feather"
              name="log-out"
              size={18}
              color={Colors.ERROR}
            />
          </View>
          <CustomText variant="body" style={styles.logoutLabel}>
            Log Out
          </CustomText>
        </TouchableOpacity>
      </View>

      <ConfirmationModal
        visible={showSignOutModal}
        title="Log Out Confirmation"
        message="Are you sure you want to log out?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={() => {
          setShowSignOutModal(false);
          onClose?.();
          signOut();
        }}
        onClose={() => setShowSignOutModal(false)}
        isDestructive={true}
        iconName="log-out"
      />
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
  logoutSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAY_ULTRALIGHT,
    marginTop: 8,
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  logoutLabel: {
    fontSize: 13,
    color: Colors.ERROR,
    fontWeight: "bold",
  },
});

export default HomeSidebar;
