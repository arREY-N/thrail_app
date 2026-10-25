/**
 * @file [userId].tsx
 * @description Orchestrator screen for inspecting a specific user in THARESYS recommendation engine.
 * Coordinates user identity header, Firestore profile synchronization,
 * section navigation, and 4 modular sub-sections:
 * 1. UserProfileInfoSection
 * 2. UserHikingRecordsSection
 * 3. UserProfileUpdateSection
 * 4. UserRecommendationsSection
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Recommendation, RecommendationRepo } from "@/src/core/models/Recommendation/Recommendation";
import { useSuperadminDomain, useSuperadminNavigation } from "@/src/core/models/Superadmin/Superadmin";
import getRecoID from "@/src/core/utility/recommendation";
import SuperadminShell from "@/src/features/SuperAdmin/components/SuperadminShell";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { ConfigureEngineModal } from "@/src/recommendation/components";
import {
    UserHikingRecordsSection,
    UserProfileInfoSection,
    UserProfileUpdateSection,
    UserRecommendationsSection,
} from "@/src/recommendation/components/user-sections";
import core from "@/src/recommendation/core";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import { GenerateUserProfile } from "@/src/recommendation/utilities/CreateProfile";
import {
    calculateDatasetBounds,
    DatasetBounds,
} from "@/src/recommendation/utilities/NormalizeTrails";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

type SectionTab = "profile" | "hikes" | "update" | "recos";

export default function UserRecommendationDetailScreen() {
    const { isMobile } = useBreakpoints();
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const router = useRouter();

    const {
        users,
        trails,
        startElevations,
        reviewsByUser,
        isLoading: isCoreLoading,
        refresh: refreshCore,
        saveUserProfile,
    } = core();

    const { pendingApplication } = useSuperadminDomain(null);
    const { onTabPress, onBackToSettingsPress } = useSuperadminNavigation();
    const pendingCount = pendingApplication?.length || 0;

    // Active Section Tab
    const [activeSection, setActiveSection] = useState<SectionTab>("profile");

    // Monthly recommendation state
    const recoMonth = useMemo(() => getRecoID(), []);
    const [userRecommendations, setUserRecommendations] = useState<Recommendation | null>(null);
    const [isLoadingRecos, setIsLoadingRecos] = useState<boolean>(false);
    const [recoError, setRecoError] = useState<string | null>(null);

    // Profile Saving state
    const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
    const [isResettingProfile, setIsResettingProfile] = useState<boolean>(false);
    const [savedProfileOverride, setSavedProfileOverride] = useState<UserProfiles | null>(null);
    const [stagedUpdatedProfile, setStagedUpdatedProfile] = useState<UserProfiles | null>(null);

    // THARESYS Engine Modal state
    const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

    // Find the target user
    const user = useMemo(() => {
        return users.find((u) => u.id === userId) || null;
    }, [users, userId]);

    // Pre-calculate trail profiles map
    const trailProfilesMap = useMemo(() => {
        const map = new Map<string, Profile>();
        for (const t of trails) {
            if (t.profile) {
                map.set(t.id, t.profile);
            }
        }
        return map;
    }, [trails]);

    // Dataset bounds for profile calculation formulas
    const bounds: DatasetBounds = useMemo(() => {
        return calculateDatasetBounds(trails, startElevations);
    }, [trails, startElevations]);

    // Resolve user's twin anchor profiles (easy & difficult)
    const userProfiles: UserProfiles = useMemo(() => {
        if (savedProfileOverride) return savedProfileOverride;
        if (user?.profile) return user.profile;
        if (!user) {
            return {
                easy: { features: {} } as Profile,
                difficult: { features: {} } as Profile,
            };
        }
        return GenerateUserProfile(user, trails, startElevations, trailProfilesMap);
    }, [user, savedProfileOverride, trails, startElevations, trailProfilesMap]);

    const isSaved = Boolean(user?.profile || savedProfileOverride);

    // Fetch user recommendations
    const loadRecommendations = useCallback(() => {
        if (!userId) return;
        setIsLoadingRecos(true);
        setRecoError(null);
        RecommendationRepo.fetchByMonth(userId, recoMonth)
            .then((data) => {
                setUserRecommendations(data);
                setRecoError(null);
            })
            .catch((err: any) => {
                console.error("[UserRecommendationScreen] Failed to load recommendations for user", userId, err);
                setRecoError(err?.message || "Failed to load user recommendations from Firestore.");
                setUserRecommendations(null);
            })
            .finally(() => setIsLoadingRecos(false));
    }, [userId, recoMonth]);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    // Save or update profile in Firestore
    const handleSaveProfile = async (customProfile?: UserProfiles) => {
        if (!user || !saveUserProfile) {
            Alert.alert("Error", "Save function is not available.");
            return;
        }

        const targetProfile = customProfile || stagedUpdatedProfile || userProfiles;

        setIsSavingProfile(true);
        try {
            const success = await saveUserProfile(user.id, targetProfile);
            if (success) {
                setSavedProfileOverride(targetProfile);
                setStagedUpdatedProfile(null);
                Alert.alert(
                    "Profile Saved",
                    `Twin anchor profile (Easy & Difficult) for ${fullName} was successfully saved to Firestore!`
                );
                refreshCore();
            }
        } catch (err: unknown) {
            console.error("Failed to save user profile:", err);
            const msg = err instanceof Error ? err.message : "Failed to update user profile in Firestore.";
            Alert.alert("Save Failed", msg);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Reset profile back to initial survey & preference formulation
    const confirmResetToInitialProfile = async () => {
        if (!user || !saveUserProfile) {
            Alert.alert("Error", "Save function is not available.");
            return;
        }

        setIsResettingProfile(true);
        try {
            const initialProfiles = GenerateUserProfile(user, trails, startElevations, trailProfilesMap);
            const success = await saveUserProfile(user.id, initialProfiles);
            if (success) {
                setSavedProfileOverride(initialProfiles);
                setStagedUpdatedProfile(null);
                refreshCore();
                Alert.alert(
                    "Profile Reset",
                    `Twin anchor profile for ${fullName} has been reset to the initial survey & preference formulation and saved to Firestore.`
                );
            }
        } catch (err: unknown) {
            console.error("Failed to reset user profile:", err);
            const msg = err instanceof Error ? err.message : "Failed to reset profile to initial values.";
            Alert.alert("Reset Failed", msg);
        } finally {
            setIsResettingProfile(false);
        }
    };

    const handlePromptResetToInitial = () => {
        const promptMsg = `This will reset ${fullName}'s Easy and Difficult anchor vectors back to the initial baseline calculated from their survey & preference inputs, clearing any applied hike updates.\n\nAre you sure you want to proceed?`;
        if (Platform.OS === "web" && typeof window !== "undefined") {
            if (window.confirm(promptMsg)) {
                confirmResetToInitialProfile();
            }
        } else {
            Alert.alert("Reset to Initial Profile?", promptMsg, [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset Profile",
                    style: "destructive",
                    onPress: confirmResetToInitialProfile,
                },
            ]);
        }
    };

    // User reviews
    const userReviews = useMemo(() => {
        return userId && reviewsByUser ? reviewsByUser[userId] || [] : [];
    }, [reviewsByUser, userId]);

    // User full name / display label
    const fullName = user ? `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username || "User" : "User";
    const initials = user
        ? ((user.firstname?.[0] || "") + (user.lastname?.[0] || "")).toUpperCase() || (user.username?.[0] || "U").toUpperCase()
        : "U";

    // Easy & difficult trail recommendation counts
    const easyCount = userRecommendations?.easy?.length || 0;
    const diffCount = userRecommendations?.difficult?.length || 0;
    const totalRecoCount = easyCount + diffCount;

    return (
        <SuperadminShell
            activeTab="recommendation"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
            noScroll={true}
            rightActions={
                <View style={styles.rightActionsRow}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.push("/superadmin/recommendation")}
                        accessibilityLabel="Return to recommendation datasets"
                    >
                        <CustomIcon library="Feather" name="arrow-left" size={14} color={Colors.TEXT_PRIMARY} />
                        <Text style={styles.backBtnText}>{isMobile ? "Back" : "Back to Datasets"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.runEngineBtn, isMobile && styles.iconOnlyBtn]}
                        onPress={() => setIsConfigModalOpen(true)}
                        accessibilityLabel="Run THARESYS recommendation engine"
                    >
                        <CustomIcon library="Feather" name="cpu" size={14} color={Colors.WHITE} />
                        {!isMobile && <Text style={styles.runEngineBtnText}>Run Engine</Text>}
                    </TouchableOpacity>
                </View>
            }
        >
            <View style={styles.container}>
                {/* User Identity Header Card */}
                <View style={styles.userHeaderCard}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{initials}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <View style={styles.userNameRow}>
                            <Text style={styles.userNameText}>{fullName}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>
                                    {(user?.role || "user").toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.userMetaText}>
                            @{user?.username || user?.email?.split("@")[0] || "user"} • {user?.email || "No email on record"}
                        </Text>
                        <Text style={styles.userIdText}>User ID: {userId}</Text>
                    </View>

                    {/* Firestore Profile Status Banner & Sync Buttons */}
                    <View style={styles.syncStatusBox}>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.syncStatusLabel}>Profile Status</Text>
                            {stagedUpdatedProfile ? (
                                <Text style={styles.stagedStatusText}>⚡ Preview Ready to Save</Text>
                            ) : isSaved ? (
                                <Text style={styles.savedStatusText}>✓ Saved in Firestore</Text>
                            ) : (
                                <Text style={styles.unsavedStatusText}>⚠ Unsaved Formulation</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.resetBtn}
                            onPress={handlePromptResetToInitial}
                            disabled={isSavingProfile || isResettingProfile}
                            accessibilityLabel="Reset profile to initial survey preferences"
                        >
                            {isResettingProfile ? (
                                <ActivityIndicator size="small" color={Palette.Slate700} />
                            ) : (
                                <CustomIcon library="Feather" name="rotate-ccw" size={13} color={Palette.Slate700} />
                            )}
                            <Text style={styles.resetBtnText}>Reset to Initial</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.saveBtn,
                                stagedUpdatedProfile
                                    ? styles.saveUpdatedBtn
                                    : isSaved
                                        ? styles.savedBtn
                                        : styles.saveBtn,
                            ]}
                            onPress={() => handleSaveProfile()}
                            disabled={isSavingProfile || isResettingProfile}
                        >
                            {isSavingProfile ? (
                                <ActivityIndicator size="small" color={Colors.WHITE} />
                            ) : (
                                <>
                                    <CustomIcon
                                        library="Feather"
                                        name={stagedUpdatedProfile ? "check-circle" : isSaved ? "refresh-cw" : "save"}
                                        size={13}
                                        color={Colors.WHITE}
                                    />
                                    <Text style={styles.saveBtnText}>
                                        {stagedUpdatedProfile
                                            ? "Save Updated Profile"
                                            : isSaved
                                                ? "Update Profile"
                                                : "Save to DB"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section Navigation Tabs */}
                <View style={styles.sectionNavRow}>

                    <TouchableOpacity
                        style={[styles.sectionTab, activeSection === "profile" && styles.sectionTabActive]}
                        onPress={() => setActiveSection("profile")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="user"
                            size={14}
                            color={activeSection === "profile" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text style={[styles.sectionTabText, activeSection === "profile" && styles.sectionTabTextActive]}>
                            Profile Info
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sectionTab, activeSection === "hikes" && styles.sectionTabActive]}
                        onPress={() => setActiveSection("hikes")}
                    >
                        <View style={[styles.tabBadge, { backgroundColor: Palette.Blue100 }]}>
                            <Text style={[styles.tabBadgeText, { color: Palette.Blue800 }]}>
                                {userReviews.length}
                            </Text>
                        </View>
                        <Text style={[styles.sectionTabText, activeSection === "hikes" && styles.sectionTabTextActive]}>
                            Hiking Records
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sectionTab, activeSection === "update" && styles.sectionTabActive]}
                        onPress={() => setActiveSection("update")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="trending-up"
                            size={14}
                            color={activeSection === "update" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text style={[styles.sectionTabText, activeSection === "update" && styles.sectionTabTextActive]}>
                            Profile Update
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.sectionTab, activeSection === "recos" && styles.sectionTabActive]}
                        onPress={() => setActiveSection("recos")}
                    >
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{totalRecoCount}</Text>
                        </View>
                        <Text style={[styles.sectionTabText, activeSection === "recos" && styles.sectionTabTextActive]}>
                            Recommendations
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Main Scrollable Content Area */}
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {!user ? (
                        <View style={styles.emptyContainer}>
                            <CustomIcon library="Feather" name="alert-triangle" size={32} color={Palette.Amber600} />
                            <Text style={styles.emptyTitle}>User Not Found</Text>
                            <Text style={styles.emptyDesc}>
                                No user found matching ID "{userId}". Please return to the datasets list.
                            </Text>
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => router.push("/superadmin/recommendation")}
                            >
                                <Text style={styles.backBtnText}>Return to Users List</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.sectionsWrapper}>
                            {/* SECTION 1: PROFILE INFO */}
                            {activeSection === "profile" && (
                                <UserProfileInfoSection
                                    user={user}
                                    userProfiles={userProfiles}
                                    trails={trails}
                                    startElevations={startElevations}
                                    bounds={bounds}
                                    onResetToInitial={handlePromptResetToInitial}
                                    isResettingProfile={isResettingProfile}
                                />
                            )}

                            {/* SECTION 2: HIKING RECORDS */}
                            {activeSection === "hikes" && (
                                <UserHikingRecordsSection
                                    userReviews={userReviews}
                                    trails={trails}
                                    userRecommendations={userRecommendations}
                                />
                            )}

                            {/* SECTION 3: PROFILE UPDATE (ADAPTIVE SIMULATION) */}
                            {activeSection === "update" && (
                                <UserProfileUpdateSection
                                    user={user}
                                    userProfiles={userProfiles}
                                    userReviews={userReviews}
                                    trails={trails}
                                    userRecommendations={userRecommendations}
                                    onSaveProfile={handleSaveProfile}
                                    onResetToInitial={handlePromptResetToInitial}
                                    isSavingProfile={isSavingProfile}
                                    isResettingProfile={isResettingProfile}
                                    stagedUpdatedProfile={stagedUpdatedProfile}
                                    onStagedUpdateChange={setStagedUpdatedProfile}
                                />
                            )}

                            {/* SECTION 4: RECOMMENDATIONS */}
                            {activeSection === "recos" && (
                                <UserRecommendationsSection
                                    user={user}
                                    userProfiles={userProfiles}
                                    trails={trails}
                                    userRecommendations={userRecommendations}
                                    isLoadingRecos={isLoadingRecos}
                                    recoError={recoError}
                                    recoMonth={recoMonth}
                                    onRefreshRecos={loadRecommendations}
                                    onRunEnginePress={() => setIsConfigModalOpen(true)}
                                    isSaved={isSaved}
                                    totalUserCount={users.length}
                                />
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Modal: THARESYS Engine Configuration & Execution */}
            <ConfigureEngineModal
                visible={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                userCount={users.filter((u) => !!u.profile).length}
                trailCount={trails.length}
                onSuccess={() => {
                    refreshCore();
                    loadRecommendations();
                }}
            />
        </SuperadminShell>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
    },
    rightActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 6,
    },
    backBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    runEngineBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 6,
    },
    runEngineBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    iconOnlyBtn: {
        width: 32,
        height: 32,
        paddingHorizontal: 0,
        paddingVertical: 0,
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
    },
    userHeaderCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 14,
        flexWrap: "wrap",
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Palette.Emerald100,
        alignItems: "center",
        justifyContent: "center",
    },
    userAvatarText: {
        fontSize: 16,
        fontWeight: "800",
        color: Palette.Emerald800,
    },
    userNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    userNameText: {
        fontSize: 16,
        fontWeight: "800",
        color: Colors.TEXT_PRIMARY,
    },
    roleBadge: {
        backgroundColor: Palette.Slate100,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    userMetaText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    userIdText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        fontFamily: "monospace",
        marginTop: 2,
    },
    syncStatusBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    syncStatusLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    savedStatusText: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Green700,
    },
    unsavedStatusText: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Amber700,
    },
    stagedStatusText: {
        fontSize: 13,
        fontWeight: "700",
        color: Palette.Amber800,
    },
    resetBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate300,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 6,
    },
    resetBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: Palette.Slate700,
    },
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 6,
    },
    savedBtn: {
        backgroundColor: Palette.Green600,
    },
    saveUpdatedBtn: {
        backgroundColor: Palette.Green700,
    },
    saveBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    sectionNavRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Slate100,
        padding: 4,
        borderRadius: 8,
        gap: 4,
        flexWrap: "wrap",
    },
    sectionTab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    sectionTabActive: {
        backgroundColor: Colors.PRIMARY,
    },
    sectionTabText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    sectionTabTextActive: {
        color: Colors.WHITE,
        fontWeight: "700",
    },
    tabBadge: {
        backgroundColor: Palette.Slate200,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    tabBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionsWrapper: {
        gap: 16,
    },

    emptyContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    emptyDesc: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
        maxWidth: 400,
    },
});
