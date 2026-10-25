/**
 * @file UserDataset.tsx
 * @description Dataset table viewer for THARESYS user recommendation profiles.
 * Displays normalized user anchors (Easy & Difficult), survey preferences, and physical features.
 * Tapping a user or the inspect button routes directly to the dedicated user screen at /superadmin/recommendation/[userId].
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";
import {
    GenerateUserProfile,
    HasMedicalCondition,
} from "@/src/recommendation/utilities/CreateProfile";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PROVINCES = ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"] as const;

export interface UserDatasetProps {
    users?: User[];
    trails?: Trail[];
    startElevations?: Record<string, number>;
    generateUserProfile?: (user: User) => UserProfiles;
    saveUserProfile?: (id: string, profile: UserProfiles) => Promise<boolean>;
    onRunEnginePress?: () => void;
    hikes?: Hike[];
    hikesByUser?: Record<string, Hike[]>;
    reviews?: Review[];
    reviewsByUser?: Record<string, Review[]>;
    isLoading?: boolean;
    error?: Error | null;
    refresh?: () => Promise<void> | void;
}

export default function UserDataset({
    users = [],
    trails = [],
    startElevations = {},
    generateUserProfile,
    saveUserProfile,
    onRunEnginePress,
    hikes,
    hikesByUser,
    reviews,
    reviewsByUser,
    isLoading = false,
    error = null,
    refresh,
}: UserDatasetProps) {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<
        "all" | "with_profile" | "without_profile" | "medical" | "hiked" | "not_hiked" | "with_prefs"
    >("all");
    const [savingUserId, setSavingUserId] = useState<string | null>(null);
    const [savedProfilesMap, setSavedProfilesMap] = useState<Record<string, UserProfiles>>({});
    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 30);
        return () => clearTimeout(timer);
    }, []);

    // Fallback to recommendation stores if not provided directly via props
    const storeHikes = useRecommendationHikeStore((s) => s.data);
    const effectiveHikes = hikes ?? storeHikes;

    const storeReviews = useRecommendationReviewStore((s) => s.data);
    const effectiveReviews = reviews ?? storeReviews;

    // Index hikes by user ID
    const computedHikesByUser = useMemo(() => {
        if (hikesByUser) return hikesByUser;
        const map: Record<string, Hike[]> = {};
        for (const h of effectiveHikes) {
            const uid = h.user?.id;
            if (uid) {
                if (!map[uid]) map[uid] = [];
                map[uid].push(h);
            }
        }
        return map;
    }, [effectiveHikes, hikesByUser]);

    // Pre-calculate trail profiles map once
    const trailProfilesMap = useMemo(() => {
        const map = new Map<string, Profile>();
        for (const t of trails) {
            if (t.profile) {
                map.set(t.id, t.profile);
            }
        }
        return map;
    }, [trails]);

    // Filtered users
    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return users.filter((u) => {
            const fullName = `${u.firstname || ""} ${u.lastname || ""}`.trim();
            const userHikes = computedHikesByUser[u.id] || [];

            const matchesSearch =
                !query ||
                fullName.toLowerCase().includes(query) ||
                u.username?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.preferences?.experience?.toLowerCase().includes(query) ||
                u.preferences?.location?.some((l) => l.toLowerCase().includes(query)) ||
                u.preferences?.province?.some((p) => p.toLowerCase().includes(query)) ||
                u.id?.toLowerCase().includes(query);

            if (!matchesSearch) return false;

            if (selectedFilter === "with_profile") {
                return !!u.profile;
            }
            if (selectedFilter === "without_profile") {
                return !u.profile;
            }
            if (selectedFilter === "medical") {
                return HasMedicalCondition(u);
            }
            if (selectedFilter === "hiked") {
                return u.preferences?.hiked === true || userHikes.length > 0;
            }
            if (selectedFilter === "not_hiked") {
                return u.preferences?.hiked === false && userHikes.length === 0;
            }
            if (selectedFilter === "with_prefs") {
                return (
                    !!u.preferences?.experience ||
                    (u.preferences?.province && u.preferences.province.length > 0) ||
                    (u.preferences?.location && u.preferences.location.length > 0)
                );
            }

            return true;
        });
    }, [users, searchQuery, selectedFilter, computedHikesByUser]);

    // Pagination for instant 60 FPS table rendering without layout freezing
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Reset page when filter or search changes
    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredUsers.slice(start, start + PAGE_SIZE);
    }, [filteredUsers, page]);

    // Memoize generated profiles strictly for the current page (20 users max)
    const pageUserProfiles = useMemo(() => {
        const map = new Map<string, UserProfiles>();
        for (const u of paginatedUsers) {
            if (u.profile) {
                map.set(u.id, u.profile);
            } else {
                map.set(u.id, GenerateUserProfile(u, trails, startElevations, trailProfilesMap));
            }
        }
        return map;
    }, [paginatedUsers, trails, startElevations, trailProfilesMap]);

    // Fast profile resolver for a user (O(1))
    const resolveProfiles = useCallback(
        (user: User): UserProfiles => {
            if (savedProfilesMap[user.id]) return savedProfilesMap[user.id];
            if (user.profile) return user.profile;
            const cached = pageUserProfiles.get(user.id);
            if (cached) return cached;
            return GenerateUserProfile(user, trails, startElevations, trailProfilesMap);
        },
        [savedProfilesMap, pageUserProfiles, trails, startElevations, trailProfilesMap]
    );

    // Save individual user profile to Firestore
    const handleSaveProfile = async (user: User, profilesToSave?: UserProfiles) => {
        if (!saveUserProfile) {
            Alert.alert("Error", "Save function is not available.");
            return;
        }

        const profiles = profilesToSave || resolveProfiles(user);
        setSavingUserId(user.id);

        try {
            const success = await saveUserProfile(user.id, profiles);
            if (success) {
                setSavedProfilesMap((prev) => ({
                    ...prev,
                    [user.id]: profiles,
                }));

                Alert.alert(
                    "Profile Saved",
                    `Twin anchor profile (Easy & Difficult) for ${user.firstname || user.username || user.id} was successfully saved to Firestore!`
                );
            }
        } catch (err: unknown) {
            console.error("Failed to save user profile:", err);
            const msg = err instanceof Error ? err.message : "Failed to update user profile in Firestore.";
            Alert.alert("Save Failed", msg);
        } finally {
            setSavingUserId(null);
        }
    };

    const handleInspectUser = (user: User) => {
        router.push(`/superadmin/recommendation/${user.id}` as any);
    };

    if (!isReady) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                    <Text style={styles.loadingTitle}>Loading Users Dataset...</Text>
                    <Text style={styles.loadingSubtitle}>Preparing profile anchors and vectors</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search & Filter Bar */}
            <View style={styles.controlsRow}>
                <View style={styles.searchBar}>
                    <CustomIcon library="Feather" name="search" size={16} color={Colors.TEXT_SECONDARY} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users by name, username, email, experience, or ID..."
                        placeholderTextColor={Colors.TEXT_SECONDARY}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <CustomIcon library="Feather" name="x" size={14} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {[
                        { key: "all", label: `All Users (${users.length})` },
                        { key: "with_profile", label: "Saved in DB" },
                        { key: "without_profile", label: "Unsaved Previews" },
                        { key: "medical", label: "Medical Condition (0.80x)" },
                        { key: "hiked", label: "Has Hiked" },
                        { key: "not_hiked", label: "No Hikes Yet" },
                        { key: "with_prefs", label: "Survey Completed" },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.filterTab, selectedFilter === tab.key && styles.filterTabActive]}
                            onPress={() => setSelectedFilter(tab.key as any)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    selectedFilter === tab.key && styles.filterTabTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Error Banner */}
            {error && (
                <View style={styles.errorBanner}>
                    <CustomIcon library="Feather" name="alert-triangle" size={16} color={Palette.Red700} />
                    <Text style={styles.errorText}>{error.message || "Failed to load users"}</Text>
                    {refresh && (
                        <TouchableOpacity style={styles.retryBtn} onPress={() => refresh()}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Main Interactive Dataset Table */}
            {filteredUsers.length === 0 ? (
                <View style={styles.centerContainer}>
                    <CustomIcon library="Feather" name="users" size={36} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.emptyTitle}>No Users Found</Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery ? `No users matching "${searchQuery}"` : "No users match this filter"}
                    </Text>
                </View>
            ) : (
                <View style={styles.tableCard}>
                    {/* Synchronized Bidirectional Scrollable Container */}
                    <ScrollView horizontal={true} style={styles.tableScroll} showsHorizontalScrollIndicator={true}>
                        <View style={styles.table}>
                            {/* Sticky Table Header */}
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.th, styles.colIndex, styles.centerText]}>#</Text>
                                <Text style={[styles.th, styles.colUser]}>User</Text>
                                <Text style={[styles.th, styles.colAnchor, styles.centerText]}>Anchor</Text>
                                <Text style={[styles.th, styles.colClass, styles.centerText]}>Class</Text>
                                <Text style={[styles.th, styles.colLasco, styles.centerText]}>Lasco / Easy</Text>
                                <Text style={[styles.th, styles.colNumber, styles.centerText]}>Length (km)</Text>
                                <Text style={[styles.th, styles.colNumber, styles.centerText]}>Peak (MASL)</Text>
                                <Text style={[styles.th, styles.colElev, styles.centerText]}>Start (m)</Text>
                                <Text style={[styles.th, styles.colGain, styles.centerText]}>Gain (m)</Text>
                                <Text style={[styles.th, styles.colNumber, styles.centerText]}>Slope (%)</Text>

                                {PROVINCES.map((prov) => (
                                    <Text key={prov} style={[styles.th, styles.colProvince, styles.centerText]}>
                                        {prov}
                                    </Text>
                                ))}

                                <Text style={[styles.th, styles.colTerrain, styles.centerText]}>Muddy</Text>
                                <Text style={[styles.th, styles.colTerrain, styles.centerText]}>Rocky</Text>
                                <Text style={[styles.th, styles.colTerrain, styles.centerText]}>Grass</Text>
                                <Text style={[styles.th, styles.colTerrain, styles.centerText]}>Ridge</Text>

                                <Text style={[styles.th, styles.colCirc, styles.centerText]}>Out-Back</Text>
                                <Text style={[styles.th, styles.colCirc, styles.centerText]}>Traverse</Text>
                                <Text style={[styles.th, styles.colCirc, styles.centerText]}>Circular</Text>

                                <Text style={[styles.th, styles.colWater, styles.centerText]}>Fall</Text>
                                <Text style={[styles.th, styles.colWater, styles.centerText]}>River</Text>
                                <Text style={[styles.th, styles.colWater, styles.centerText]}>Lake</Text>

                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Shelter</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Resting</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Info Board</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Water</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Monument</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Community</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Viewpoint</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Network</Text>

                                <Text style={[styles.th, styles.colAction, styles.centerText]}>Action</Text>
                            </View>

                            {/* Scrollable Table Body Beneath Fixed Header */}
                            <ScrollView
                                style={styles.tableBodyVerticalScroll}
                                contentContainerStyle={styles.tableBodyScrollContent}
                                showsVerticalScrollIndicator={true}
                                refreshControl={refresh ? <RefreshControl refreshing={isLoading} onRefresh={refresh} /> : undefined}
                            >
                                {/* Table Body (Two rows per user: Easy Anchor and Difficult Anchor) */}
                                {paginatedUsers.map((user, index) => {
                                    const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username || "Unnamed User";
                                    const profiles = resolveProfiles(user);
                                    const isSavedInDb = !!user.profile || !!savedProfilesMap[user.id];
                                    const isSaving = savingUserId === user.id;
                                    const isEven = index % 2 === 0;
                                    const globalIndex = (page - 1) * PAGE_SIZE + index + 1;
                                    const hasMed = HasMedicalCondition(user);

                                    const easy = profiles.easy.features;
                                    const diff = profiles.difficult.features;

                                    return (
                                        <View key={user.id || index} style={[styles.userBlock, isEven ? styles.rowEven : styles.rowOdd]}>
                                            {/* Spanned Index Column */}
                                            <View style={[styles.colIndex, styles.centerCell, { justifyContent: "center" }]}>
                                                <Text style={[styles.td, styles.textMuted]}>
                                                    {globalIndex}
                                                </Text>
                                            </View>

                                            {/* Spanned User Column */}
                                            <TouchableOpacity
                                                style={[styles.colUser, { justifyContent: "center" }]}
                                                activeOpacity={0.7}
                                                onPress={() => handleInspectUser(user)}
                                            >
                                                <Text style={styles.nameCell} numberOfLines={1}>
                                                    {fullName}
                                                </Text>
                                                <Text style={styles.subUserText} numberOfLines={1}>
                                                    @{user.username || user.email?.split("@")[0] || "user"}
                                                </Text>
                                                <View style={{ marginTop: 2, flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                    {isSavedInDb ? (
                                                        <Text style={styles.savedBadgeText}>● Saved in DB</Text>
                                                    ) : (
                                                        <Text style={styles.unsavedBadgeText}>● Unsaved preview</Text>
                                                    )}
                                                    <Text style={styles.viewRecoHintText}>• Tap to inspect</Text>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Two Anchor Sub-Rows Stacked Vertically */}
                                            <View style={{ flexDirection: "column" }}>
                                                {/* SUB-ROW 1: EASY ANCHOR */}
                                                <View style={styles.subTableRow}>
                                                    {/* Anchor Column */}
                                                    <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                        <View style={styles.easyBadge}>
                                                            <Text style={styles.easyBadgeText}>Easy Anchor</Text>
                                                        </View>
                                                        {hasMed && (
                                                            <View style={[styles.medBadge, { marginTop: 2 }]}>
                                                                <Text style={styles.medBadgeText}>Med 0.80x</Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* Classification */}
                                                    <View style={[styles.tdCell, styles.colClass, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.classification}</Text>
                                                        <Text style={styles.valRaw}>(Minor)</Text>
                                                    </View>

                                                    {/* Lasco / Easy */}
                                                    <View style={[styles.tdCell, styles.colLasco, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.easy.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Anchor)</Text>
                                                    </View>

                                                    {/* Length */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.length.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Peak MASL */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.elevation.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Start Elev */}
                                                    <View style={[styles.tdCell, styles.colElev, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.elevation.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Base)</Text>
                                                    </View>

                                                    {/* Gain */}
                                                    <View style={[styles.tdCell, styles.colGain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.gain.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Slope */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.slope.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Provinces */}
                                                    {PROVINCES.map((prov) => {
                                                        const pVal = easy.province[prov.toLowerCase() as keyof Profile['features']['province']];
                                                        const isHigh = pVal > 0.5;
                                                        return (
                                                            <View key={prov} style={[styles.tdCell, styles.colProvince, styles.centerCell]}>
                                                                <Text style={[styles.valNormalized, isHigh ? styles.textPrimary : styles.textMuted]}>
                                                                    {pVal.toFixed(3)}
                                                                </Text>
                                                                <Text style={styles.valRaw}>({isHigh ? "Pref" : "Low"})</Text>
                                                            </View>
                                                        );
                                                    })}

                                                    {/* Terrain: Muddy, Rocky, Grassland, Ridges */}
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.terrain.muddy.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.terrain.rocky.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.terrain.grassland.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.terrain.ridges.toFixed(3)}</Text>
                                                    </View>

                                                    {/* Circularity: Out-Back, Traverse, Circular */}
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.circularity.out_and_back.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.circularity.traverse.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.circularity.circular.toFixed(3)}</Text>
                                                    </View>

                                                    {/* Waterforms: Fall, River, Lake */}
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.waterforms.fall != null ? easy.waterforms.fall.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.waterforms.river != null ? easy.waterforms.river.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.waterforms.lake != null ? easy.waterforms.lake.toFixed(3) : "-"}</Text>
                                                    </View>

                                                    {/* Tourism Amenities */}
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.shelter != null ? easy.tourism.shelter.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.resting != null ? easy.tourism.resting.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.information_board != null ? easy.tourism.information_board.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.clean_water != null ? easy.tourism.clean_water.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.monument != null ? easy.tourism.monument.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.community != null ? easy.tourism.community.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.viewpoint != null ? easy.tourism.viewpoint.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{easy.tourism.network_connection != null ? easy.tourism.network_connection.toFixed(3) : "-"}</Text>
                                                    </View>

                                                    {/* Action Button: Save to Firestore */}
                                                    <View style={[styles.tdCell, styles.colAction, styles.centerCell]}>
                                                        <TouchableOpacity
                                                            style={[styles.saveBtn, isSavedInDb && styles.savedBtn]}
                                                            onPress={() => handleSaveProfile(user, profiles)}
                                                            disabled={isSaving}
                                                            accessibilityLabel={`Save profile for ${fullName}`}
                                                        >
                                                            {isSaving ? (
                                                                <ActivityIndicator size="small" color={Colors.WHITE} />
                                                            ) : (
                                                                <>
                                                                    <CustomIcon
                                                                        library="Feather"
                                                                        name={isSavedInDb ? "refresh-cw" : "save"}
                                                                        size={12}
                                                                        color={Colors.WHITE}
                                                                    />
                                                                    <Text style={styles.saveBtnText}>
                                                                        {isSavedInDb ? "Update Profile" : "Save to DB"}
                                                                    </Text>
                                                                </>
                                                            )}
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                {/* SUB-ROW 2: DIFFICULT ANCHOR */}
                                                <View style={[styles.subTableRow, styles.subTableRowDivider]}>
                                                    {/* Anchor Column */}
                                                    <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                        <View style={styles.difficultBadge}>
                                                            <Text style={styles.difficultBadgeText}>Difficult Anchor</Text>
                                                        </View>
                                                        {hasMed && (
                                                            <View style={[styles.medBadge, { marginTop: 2 }]}>
                                                                <Text style={styles.medBadgeText}>Med 0.80x</Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    {/* Classification */}
                                                    <View style={[styles.tdCell, styles.colClass, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.classification}</Text>
                                                        <Text style={styles.valRaw}>(Major)</Text>
                                                    </View>

                                                    {/* Lasco / Easy */}
                                                    <View style={[styles.tdCell, styles.colLasco, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.easy.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Anchor)</Text>
                                                    </View>

                                                    {/* Length */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.length.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Peak MASL */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.elevation.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Start Elev */}
                                                    <View style={[styles.tdCell, styles.colElev, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.elevation.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Base)</Text>
                                                    </View>

                                                    {/* Gain */}
                                                    <View style={[styles.tdCell, styles.colGain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.gain.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Slope */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.slope.toFixed(3)}</Text>
                                                        <Text style={styles.valRaw}>(Norm)</Text>
                                                    </View>

                                                    {/* Provinces */}
                                                    {PROVINCES.map((prov) => {
                                                        const pVal = diff.province[prov.toLowerCase() as keyof Profile['features']['province']];
                                                        const isHigh = pVal > 0.5;
                                                        return (
                                                            <View key={prov} style={[styles.tdCell, styles.colProvince, styles.centerCell]}>
                                                                <Text style={[styles.valNormalized, isHigh ? styles.textPrimary : styles.textMuted]}>
                                                                    {pVal.toFixed(3)}
                                                                </Text>
                                                                <Text style={styles.valRaw}>({isHigh ? "Pref" : "Low"})</Text>
                                                            </View>
                                                        );
                                                    })}

                                                    {/* Terrain: Muddy, Rocky, Grassland, Ridges */}
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.terrain.muddy.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.terrain.rocky.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.terrain.grassland.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.terrain.ridges.toFixed(3)}</Text>
                                                    </View>

                                                    {/* Circularity: Out-Back, Traverse, Circular */}
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.circularity.out_and_back.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.circularity.traverse.toFixed(3)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.circularity.circular.toFixed(3)}</Text>
                                                    </View>

                                                    {/* Waterforms: Fall, River, Lake */}
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.waterforms.fall != null ? diff.waterforms.fall.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.waterforms.river != null ? diff.waterforms.river.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.waterforms.lake != null ? diff.waterforms.lake.toFixed(3) : "-"}</Text>
                                                    </View>

                                                    {/* Tourism Amenities */}
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.shelter != null ? diff.tourism.shelter.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.resting != null ? diff.tourism.resting.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.information_board != null ? diff.tourism.information_board.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.clean_water != null ? diff.tourism.clean_water.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.monument != null ? diff.tourism.monument.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.community != null ? diff.tourism.community.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.viewpoint != null ? diff.tourism.viewpoint.toFixed(3) : "-"}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.valNormalized}>{diff.tourism.network_connection != null ? diff.tourism.network_connection.toFixed(3) : "-"}</Text>
                                                    </View>

                                                    {/* Action Column: Inspect Button */}
                                                    <View style={[styles.tdCell, styles.colAction, styles.centerCell]}>
                                                        <TouchableOpacity
                                                            style={styles.inspectBtn}
                                                            onPress={() => handleInspectUser(user)}
                                                        >
                                                            <CustomIcon library="Feather" name="eye" size={12} color={Colors.TEXT_PRIMARY} />
                                                            <Text style={styles.inspectBtnText}>Inspect & Recos</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Pagination Controls Pinned Outside Scroll */}
            {filteredUsers.length > 0 && (
                <View style={styles.paginationRow}>
                    <Text style={styles.paginationText}>
                        Showing {(page - 1) * PAGE_SIZE + 1} -{" "}
                        {Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                    </Text>
                    <View style={styles.paginationButtons}>
                        <TouchableOpacity
                            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                            disabled={page === 1}
                            onPress={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            <CustomIcon
                                library="Feather"
                                name="chevron-left"
                                size={14}
                                color={page === 1 ? Colors.TEXT_SECONDARY : Colors.PRIMARY}
                            />
                            <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>
                                Prev
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.pageNumberBadge}>
                            <Text style={styles.pageNumberText}>
                                {page} / {totalPages}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                            disabled={page >= totalPages}
                            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>
                                Next
                            </Text>
                            <CustomIcon
                                library="Feather"
                                name="chevron-right"
                                size={14}
                                color={page >= totalPages ? Colors.TEXT_SECONDARY : Colors.PRIMARY}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
    },
    controlsRow: {
        gap: 8,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },
    filterTabs: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    filterTabActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    filterTabTextActive: {
        color: Colors.WHITE,
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Red50,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Red100,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: Palette.Red700,
    },
    retryBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: Palette.Red100,
        borderRadius: 4,
    },
    retryText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Red700,
    },
    tableCard: {
        flex: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
    },
    tableScroll: {
        flex: 1,
    },
    table: {
        flex: 1,
        flexDirection: "column",
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        alignItems: "center",
        paddingVertical: 10,
    },
    tableBodyVerticalScroll: {
        flex: 1,
    },
    tableBodyScrollContent: {
        flexGrow: 1,
    },
    th: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    userBlock: {
        flexDirection: "row",
        alignItems: "stretch",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    subTableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    subTableRowDivider: {
        borderTopWidth: 1,
        borderTopColor: Palette.Slate150,
    },
    rowEven: {
        backgroundColor: Colors.WHITE,
    },
    rowOdd: {
        backgroundColor: Palette.Slate50,
    },
    td: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    tdCell: {
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    nameCell: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    subUserText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    easyBadge: {
        backgroundColor: Palette.Green100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    easyBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green700,
    },
    difficultBadge: {
        backgroundColor: Palette.Amber100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    difficultBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber700,
    },
    medBadge: {
        backgroundColor: Palette.Red50,
        borderWidth: 1,
        borderColor: Palette.Red100,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    medBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Red700,
    },
    valNormalized: {
        fontSize: 13,
        fontFamily: "monospace",
        color: Colors.TEXT_PRIMARY,
        fontWeight: "600",
        textAlign: "center",
    },
    valRaw: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
    savedBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Green700,
    },
    unsavedBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Amber700,
    },
    textPrimary: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    textMuted: {
        color: Palette.Neutral400,
    },
    centerCell: {
        alignItems: "center",
    },
    centerText: {
        textAlign: "center",
    },

    // Column Widths
    colIndex: { width: 45, textAlign: "center" },
    colName: { width: 195, paddingHorizontal: 8 },
    colUser: { width: 175, paddingHorizontal: 8 },
    colAnchor: { width: 115, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
    colClass: { width: 90 },
    colLasco: { width: 85 },
    colNumber: { width: 105 },
    colElev: { width: 100 },
    colGain: { width: 135 },
    colProvince: { width: 75 },
    colTerrain: { width: 70 },
    colCirc: { width: 80 },
    colWater: { width: 65 },
    colTourism: { width: 85 },
    colAction: { width: 145 },

    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    savedBtn: {
        backgroundColor: Palette.Green600,
    },
    saveBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.WHITE,
    },
    inspectBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 5,
    },
    inspectBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    viewRecoHintText: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: "600",
    },

    centerContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 8,
    },
    loadingSubtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },

    paginationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    paginationText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    paginationButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    pageBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    pageBtnDisabled: {
        opacity: 0.4,
        borderColor: Palette.Slate150,
    },
    pageBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    pageBtnTextDisabled: {
        color: Colors.TEXT_SECONDARY,
    },
    pageNumberBadge: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: Palette.Slate100,
    },
    pageNumberText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
});
