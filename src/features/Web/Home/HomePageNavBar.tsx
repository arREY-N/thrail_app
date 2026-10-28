import type { Href } from "expo-router";
import { router, usePathname, useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import ConfirmationModal from "@/src/components/ConfirmationModal";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import {
  isDrawerMeasurementActive,
  registerDrawerItemLayout,
  registerDrawerMeasureCallback,
  subscribeDrawerScroll,
} from "@/src/components/Tutorial/utils/webDrawerLayoutRegistry";
import { Colors } from "@/src/constants/colors";
import { SignOutFlow } from "@/src/core/flows/SignOutFlow";
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

// â”€â”€ Base Navigation Sections (Available for all users) â”€â”€
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
        id: "navigate",
        label: "Navigate",
        icon: "map",
        library: "Feather",
        route: "/(app)/(tabs)/hike",
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

// â”€â”€ Superadmin Navigation Sections â”€â”€
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
      {
        id: "recommendation",
        label: "Recommendations",
        icon: "sliders",
        library: "Feather",
        route: "/(app)/(main)/superadmin/recommendation",
      },
    ],
  },
];

// â”€â”€ Admin (Business Admin) Navigation Sections â”€â”€
const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "ADMIN MAIN",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "grid",
        library: "Feather",
        route: "/(app)/(main)/admin",
      },
    ],
  },
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
        route: "/(app)/(main)/admin/trail/list",
      },
      {
        id: "personnel",
        label: "Personnel",
        icon: "users",
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

  const scrollViewRef = useRef<ScrollView>(null);
  const itemRefs = useRef<Record<string, View | null>>({});
  const sectionOffsets = useRef<Record<number, number>>({});
  const itemOffsets = useRef<Record<string, number>>({});

  const measureAllItemsNow = useCallback(() => {
    Object.entries(itemRefs.current).forEach(([id, node]) => {
      node?.measureInWindow?.((_x, y, _w, h) => {
        if (h > 0) {
          registerDrawerItemLayout(id, { y, height: h });
        }
      });
    });
  }, []);

  useEffect(() => {
    if (isDrawerMeasurementActive()) {
      measureAllItemsNow();
    }
    return registerDrawerMeasureCallback(measureAllItemsNow);
  }, [measureAllItemsNow]);

  // Synchronize drawer scroll position whenever tutorial focuses on a drawer item
  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = subscribeDrawerScroll((targetId) => {
      if (!targetId) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }

      // 1. Calculate target offset from registered layout measurements
      const targetOffset = itemOffsets.current[targetId];
      if (typeof targetOffset === "number") {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, targetOffset - 60),
          animated: true,
        });
      }

      // 2. Extra safeguard for native Web DOM elements
      const domNode = itemRefs.current[targetId] as unknown as HTMLElement | undefined;
      if (domNode && typeof domNode.scrollIntoView === "function") {
        domNode.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      // 3. Post-scroll re-measurement after scroll animation settles
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        measureAllItemsNow();
      }, 180);
    });

    return () => {
      unsub();
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [measureAllItemsNow]);

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

  const isItemActive = (route: Href, id?: string) => {
    const routeStr = String(route).toLowerCase();
    const currentPath = (pathname || "").toLowerCase();
    const segs = (segments as string[]).map((s) => s.toLowerCase());

    // 1. Home Tab (id === 'home' or route points to tab root)
    if (id === "home" || routeStr.endsWith("/(tabs)") || routeStr.endsWith("/(tabs)/index")) {
      const isHomeSegment = segs.includes("(tabs)") && (!segs[2] || segs[2] === "index" || segs[2] === "");
      return currentPath === "/" || currentPath === "" || currentPath === "/home" || isHomeSegment;
    }

    // 2. Superadmin Dashboard
    if (id === "dashboard" || routeStr.endsWith("/superadmin")) {
      const isSuperadminRoot = segs.includes("superadmin") && (segs.length <= 3 || segs[segs.length - 1] === "superadmin");
      return currentPath === "/superadmin" || isSuperadminRoot;
    }

    // 3. Extract target keyword from route or id
    const cleanRoute = routeStr
      .replace("/(app)", "")
      .replace("/(tabs)", "")
      .replace("/(main)", "")
      .replace("/list", "");

    const segmentsList = cleanRoute.split("/").filter(Boolean);
    const targetKey = segmentsList[segmentsList.length - 1] || id || "";

    if (!targetKey) return false;

    return segs.includes(targetKey) || currentPath.includes(targetKey);
  };

  const handleNavPress = (route: Href, id?: string) => {
    if (isItemActive(route, id)) {
      onClose?.();
      return;
    }
    onClose?.();
    router.push(route);
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
        ref={scrollViewRef}
        style={styles.scrollList}
        contentContainerStyle={styles.navListContainer}
        showsVerticalScrollIndicator={false}
      >
        {navSections.map((section, sIndex) => (
          <View
            key={section.title || sIndex}
            style={styles.sectionGroup}
            onLayout={(e) => {
              sectionOffsets.current[sIndex] = e.nativeEvent.layout.y;
            }}
          >
            {section.title && (
              <View style={styles.sectionHeaderContainer}>
                <CustomText variant="caption" style={styles.sectionTitleText}>
                  {section.title}
                </CustomText>
              </View>
            )}

            {section.items.map((item) => {
              const isActive = isItemActive(item.route, item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  ref={(node) => {
                    itemRefs.current[item.id] = node;
                  }}
                  onLayout={(e) => {
                    const secY = sectionOffsets.current[sIndex] ?? 0;
                    itemOffsets.current[item.id] = secY + e.nativeEvent.layout.y;
                  }}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                  ]}
                  onPress={() => handleNavPress(item.route, item.id)}
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
