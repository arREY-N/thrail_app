import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { formatDate } from "@/src/core/utility/date";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";
import {
    BatchTrailProfile,
    GenerateUserProfile,
    HasMedicalCondition,
    MatchSurveyTrails,
    MEDICAL_CONDITION_FACTOR,
} from "@/src/recommendation/utilities/CreateProfile";
import { calculateTrailGain } from "@/src/recommendation/utilities/GetElevation";
import {
    buildTrailProfiles,
    calculateDatasetBounds,
    DatasetBounds,
    resolveTerrainFeatures,
} from "@/src/recommendation/utilities/NormalizeTrails";
import { RecommendationFactors } from "@/src/recommendation/constants/RecommendationFactors";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
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
    hikes,
    hikesByUser,
    reviews,
    reviewsByUser,
    isLoading = false,
    error = null,
    refresh,
}: UserDatasetProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<
        "all" | "with_profile" | "without_profile" | "medical" | "hiked" | "not_hiked" | "with_prefs"
    >("all");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);
    const [savedProfilesMap, setSavedProfilesMap] = useState<Record<string, UserProfiles>>({});
    const [isReady, setIsReady] = useState<boolean>(false);
    const [expandedFeatureKey, setExpandedFeatureKey] = useState<string | null>(null);

    // Reset expanded feature dropdown when selected user changes
    useEffect(() => {
        setExpandedFeatureKey(null);
    }, [selectedUser]);

    // Dataset bounds for verification
    const bounds: DatasetBounds = useMemo(() => {
        return calculateDatasetBounds(trails, startElevations);
    }, [trails, startElevations]);

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

    // Index reviews by user ID
    const computedReviewsByUser = useMemo(() => {
        if (reviewsByUser) return reviewsByUser;
        const map: Record<string, Review[]> = {};
        for (const r of effectiveReviews) {
            const uid = r.user?.id;
            if (uid) {
                if (!map[uid]) map[uid] = [];
                map[uid].push(r);
            }
        }
        return map;
    }, [effectiveReviews, reviewsByUser]);

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
    React.useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredUsers.slice(start, start + PAGE_SIZE);
    }, [filteredUsers, page]);

    // Memoize generated profiles strictly for the current page (20 users max) using standard React useMemo
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

    // Save individual user profile
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
                // Update local state immediately for both the table and modal
                setSavedProfilesMap((prev) => ({
                    ...prev,
                    [user.id]: profiles,
                }));

                setSelectedUser((prev) => {
                    if (prev && prev.id === user.id) {
                        return {
                            ...prev,
                            profile: profiles,
                        };
                    }
                    return prev;
                });

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
            {/* Search and Filters */}
            <View style={styles.controlsRow}>
                <View style={styles.searchBar}>
                    <CustomIcon library="Feather" name="search" size={16} color={Colors.GRAY_MEDIUM} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, email, experience, location..."
                        placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <CustomIcon library="Feather" name="x" size={16} color={Colors.GRAY_MEDIUM} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {(
                        [
                            ["all", "ALL"],
                            ["with_profile", "SAVED IN DB"],
                            ["without_profile", "UNSAVED"],
                            ["medical", "MEDICAL (0.80x)"],
                            ["hiked", "HIKED (YES)"],
                            ["not_hiked", "HIKED (NO)"],
                            ["with_prefs", "WITH PREFS"],
                        ] as const
                    ).map(([filter, label]) => {
                        const isSelected = selectedFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                                onPress={() => setSelectedFilter(filter as any)}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        isSelected && styles.filterTabTextActive,
                                    ]}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorBanner}>
                    <CustomIcon library="Feather" name="alert-circle" size={18} color={Palette.Red700} />
                    <Text style={styles.errorText}>{error.message}</Text>
                    {refresh && (
                        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Tabular Profile Dataset Grid with Fixed Header on Top */}
            {isLoading && users.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                    <Text style={styles.loadingText}>Fetching users and profile records...</Text>
                </View>
            ) : filteredUsers.length === 0 ? (
                <View style={styles.centerContainer}>
                    <CustomIcon library="Feather" name="user-x" size={42} color={Colors.GRAY_MEDIUM} />
                    <Text style={styles.emptyTitle}>No users found</Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery ? "Try refining your search filter" : "No user documents match this criteria"}
                    </Text>
                </View>
            ) : (
                <View style={styles.tableCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
                        <View style={styles.table}>
                            {/* Fixed Table Header on Top */}
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.th, styles.colIndex]}>#</Text>
                                <Text style={[styles.th, styles.colUser]}>User</Text>
                                <Text style={[styles.th, styles.colAnchor, styles.centerText]}>Anchor</Text>

                                <View style={styles.colClass}>
                                    <Text style={[styles.th, styles.centerText]}>Class</Text>
                                    <Text style={styles.thSubCenter}>0=min, 1=maj</Text>
                                </View>

                                <View style={styles.colLasco}>
                                    <Text style={[styles.th, styles.centerText]}>Lasco / Easy</Text>
                                    <Text style={styles.thSubCenter}>rating / 9</Text>
                                </View>

                                <View style={styles.colNumber}>
                                    <Text style={[styles.th, styles.centerText]}>Length</Text>
                                    <Text style={styles.thSubCenter}>Normalized</Text>
                                </View>

                                <View style={styles.colNumber}>
                                    <Text style={[styles.th, styles.centerText]}>Peak (MASL)</Text>
                                    <Text style={styles.thSubCenter}>Normalized</Text>
                                </View>

                                <View style={styles.colElev}>
                                    <Text style={[styles.th, styles.centerText]}>Start Elev</Text>
                                    <Text style={styles.thSubCenter}>Normalized</Text>
                                </View>

                                <View style={styles.colGain}>
                                    <Text style={[styles.th, styles.centerText]}>Gain</Text>
                                    <Text style={styles.thSubCenter}>MASL-Start</Text>
                                </View>

                                <View style={styles.colNumber}>
                                    <Text style={[styles.th, styles.centerText]}>Slope</Text>
                                    <Text style={styles.thSubCenter}>Normalized</Text>
                                </View>

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
                                            onPress={() => setSelectedUser(user)}
                                        >
                                            <Text style={styles.nameCell} numberOfLines={1}>
                                                {fullName}
                                            </Text>
                                            <Text style={styles.subUserText} numberOfLines={1}>
                                                @{user.username || user.email?.split("@")[0] || "user"}
                                            </Text>
                                            <View style={{ marginTop: 2 }}>
                                                {isSavedInDb ? (
                                                    <Text style={styles.savedBadgeText}>● Saved in DB</Text>
                                                ) : (
                                                    <Text style={styles.unsavedBadgeText}>● Unsaved preview</Text>
                                                )}
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

                                                {/* Terrain: Muddy, Rocky, Grass, Ridge */}
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
                                                            <Text style={styles.valRaw}>({isHigh ? "High" : "Low"})</Text>
                                                        </View>
                                                    );
                                                })}

                                                {/* Terrain: Muddy, Rocky, Grass, Ridge */}
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
                                                        onPress={() => setSelectedUser(user)}
                                                    >
                                                        <CustomIcon library="Feather" name="eye" size={12} color={Colors.TEXT_PRIMARY} />
                                                        <Text style={styles.inspectBtnText}>Inspect</Text>
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

            {/* User Inspection & Manual Profile Save Modal */}
            <Modal
                visible={!!selectedUser}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedUser(null)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setSelectedUser(null)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>
                                    {selectedUser
                                        ? `${selectedUser.firstname || ""} ${selectedUser.lastname || ""}`.trim() || selectedUser.username || "User Profile"
                                        : "User Profile"}
                                </Text>
                                <Text style={styles.modalSubId}>User ID: {selectedUser?.id}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setSelectedUser(null)}
                            >
                                <CustomIcon library="Feather" name="x" size={20} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedUser && (() => {
                                const userModalProfiles = resolveProfiles(selectedUser);
                                const isSaved = !!selectedUser.profile || !!savedProfilesMap[selectedUser.id];
                                const surveyLocations = selectedUser.preferences?.location || [];
                                const matched = MatchSurveyTrails(surveyLocations, trails);

                                return (
                                    <View style={styles.detailSection}>
                                        {/* Profile Status & Firestore Sync Button */}
                                        <View style={styles.modalSyncBanner}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.modalSyncTitle}>Firestore Profile Status</Text>
                                                <Text style={isSaved ? styles.savedBadgeText : styles.unsavedBadgeText}>
                                                    {isSaved
                                                        ? "✓ Saved in Firestore"
                                                        : "⚠ Unsaved Preview (Calculated dynamically)"}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.modalSaveBtn, isSaved && styles.modalSavedBtn]}
                                                onPress={() => handleSaveProfile(selectedUser, userModalProfiles)}
                                                disabled={savingUserId === selectedUser.id}
                                            >
                                                {savingUserId === selectedUser.id ? (
                                                    <ActivityIndicator size="small" color={Colors.WHITE} />
                                                ) : (
                                                    <>
                                                        <CustomIcon
                                                            library="Feather"
                                                            name={isSaved ? "refresh-cw" : "save"}
                                                            size={14}
                                                            color={Colors.WHITE}
                                                        />
                                                        <Text style={styles.modalSaveBtnText}>
                                                            {isSaved ? "Update Profile" : "Save to Firestore"}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        {/* Survey Preferences Summary */}
                                        <Text style={[styles.detailSectionTitle, { marginTop: 12 }]}>
                                            Survey & Preference Inputs
                                        </Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailKey}>Medical Concerns:</Text>
                                            <Text
                                                style={[
                                                    styles.detailVal,
                                                    {
                                                        color: HasMedicalCondition(selectedUser) ? Palette.Red700 : Colors.TEXT_SECONDARY,
                                                        fontWeight: HasMedicalCondition(selectedUser) ? "600" : "400",
                                                    },
                                                ]}
                                            >
                                                {HasMedicalCondition(selectedUser)
                                                    ? `Yes (${(Array.isArray(selectedUser.medicalProfile?.details) ? selectedUser.medicalProfile.details.join(", ") : selectedUser.medicalProfile?.details) || "Active condition"}) • 0.80x downshift applied`
                                                    : "None reported (Standard difficulty)"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailKey}>Experience Level:</Text>
                                            <Text style={styles.detailVal}>
                                                {selectedUser.preferences?.experience || "Not set"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailKey}>Hiked Before:</Text>
                                            <Text style={styles.detailVal}>
                                                {selectedUser.preferences?.hiked ? "Yes" : "No"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailKey}>Survey Locations:</Text>
                                            <Text style={styles.detailVal}>
                                                {surveyLocations.length > 0
                                                    ? surveyLocations.join(", ")
                                                    : "None selected"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailKey}>Matched Trails in DB:</Text>
                                            <Text style={[styles.detailVal, { color: matched.length > 0 ? Colors.PRIMARY : Colors.TEXT_SECONDARY }]}>
                                                {matched.length > 0
                                                    ? `${matched.map((m) => m.general?.name || m.id).join(", ")} (${matched.length} matched)`
                                                    : "None (Defaults to Beginner formulation)"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailKey}>Preferred Provinces:</Text>
                                            <Text style={styles.detailVal}>
                                                {selectedUser.preferences?.province?.length
                                                    ? selectedUser.preferences.province.join(", ")
                                                    : "None"}
                                            </Text>
                                        </View>

                                        {/* Twin Anchors Comparison Table with Interactive Feature Breakdown */}
                                        <View style={{ marginTop: 16, marginBottom: 4 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                                                <Text style={styles.detailSectionTitle}>
                                                    Generated Two-Anchor Vectors
                                                </Text>
                                                <Text style={styles.tapInstructionText}>
                                                    Tap a feature to view score breakdown
                                                </Text>
                                            </View>
                                        </View>

                                        {(() => {
                                            const hasMed = HasMedicalCondition(selectedUser);
                                            const isExp = matched.length > 0;

                                            // Calculate centroid average vector across matched survey trails
                                            let avgVector: Profile['features'] | null = null;
                                            if (isExp) {
                                                const matchedProfiles: Profile[] = [];
                                                const missingTrails: Trail[] = [];
                                                for (const t of matched) {
                                                    const p = trailProfilesMap.get(t.id) || t.profile;
                                                    if (p) {
                                                        matchedProfiles.push(p);
                                                    } else {
                                                        missingTrails.push(t);
                                                    }
                                                }
                                                if (missingTrails.length > 0) {
                                                    matchedProfiles.push(...buildTrailProfiles(missingTrails, startElevations));
                                                }
                                                avgVector = BatchTrailProfile(matchedProfiles);
                                            }

                                            const easyFeats = userModalProfiles.easy.features;
                                            const diffFeats = userModalProfiles.difficult.features;

                                            const easyFactorStr = RecommendationFactors.EXPERIENCED.EASY_FACTOR.toFixed(2);
                                            const diffFactorStr = RecommendationFactors.EXPERIENCED.DIFFICULT_FACTOR.toFixed(2);
                                            const medFactorStr = RecommendationFactors.MEDICAL_CONDITION_FACTOR.toFixed(2);
                                            const begEasyStr = RecommendationFactors.BEGINNER.EASY_BASE.toFixed(3);
                                            const begDiffStr = RecommendationFactors.BEGINNER.DIFFICULT_BASE.toFixed(3);
                                            const prefWeightStr = RecommendationFactors.PROVINCE.PREFERRED_WEIGHT.toFixed(3);
                                            const unselectedWeightStr = RecommendationFactors.PROVINCE.UNSELECTED_WEIGHT.toFixed(3);

                                            const featureItems = [
                                                {
                                                    id: "classification",
                                                    label: "Classification",
                                                    category: "Classification",
                                                    easyDisplay: easyFeats.classification === 1 ? "1 (Major)" : "0 (Minor)",
                                                    diffDisplay: diffFeats.classification === 1 ? "1 (Major)" : "0 (Minor)",
                                                    rawScore: isExp
                                                        ? matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.classification || "minor"}`).join(", ")
                                                        : "Beginner formulation defaults (Minor = 0, Major = 1)",
                                                    normFormula: "Classification values: Major = 1.0, Minor = 0.0",
                                                    easyFormula: "Fixed anchor target: 0 (Minor trails only - suitable for leisurely hikes)",
                                                    diffFormula: "Fixed anchor target: 1 (Major trails only - demanding technical summit hikes)",
                                                },
                                                {
                                                    id: "easy",
                                                    label: "Lasco / Easy",
                                                    category: "Physical Exertion",
                                                    easyDisplay: easyFeats.easy.toFixed(3),
                                                    diffDisplay: diffFeats.easy.toFixed(3),
                                                    rawScore: isExp
                                                        ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.lascoRating ?? 0}/9`).join(", ")} (Average: ${(matched.reduce((acc, t) => acc + (t.difficulty?.lascoRating ?? 0), 0) / matched.length).toFixed(2)}/9)`
                                                        : "No survey trails. Calibrated baseline: ~2.25/9 (Easy) vs ~6.75/9 (Difficult)",
                                                    normFormula: isExp && avgVector
                                                        ? `lascoRating / 9 -> Average Normalized Vector: ${avgVector.easy.toFixed(3)}`
                                                        : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                                                    easyFormula: isExp && avgVector
                                                        ? `avg (${avgVector.easy.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.easy.toFixed(3)}`
                                                        : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.easy.toFixed(3)}`,
                                                    diffFormula: isExp && avgVector
                                                        ? `clamp(avg (${avgVector.easy.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.easy.toFixed(3)}`
                                                        : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.easy.toFixed(3)}`,
                                                },
                                                {
                                                    id: "length",
                                                    label: "Length",
                                                    category: "Physical Exertion",
                                                    easyDisplay: easyFeats.length.toFixed(3),
                                                    diffDisplay: diffFeats.length.toFixed(3),
                                                    rawScore: isExp
                                                        ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.length ?? 0} km`).join(", ")} (Average: ${(matched.reduce((acc, t) => acc + (t.difficulty?.length ?? 0), 0) / matched.length).toFixed(2)} km)`
                                                        : `Calibrated baseline (Dataset bounds: ${bounds.length.min.toFixed(1)} km to ${bounds.length.max.toFixed(1)} km)`,
                                                    boundsText: `Dataset Bounds: ${bounds.length.min.toFixed(1)} km to ${bounds.length.max.toFixed(1)} km`,
                                                    normFormula: isExp && avgVector
                                                        ? `(length - min) / (max - min) -> Average Normalized Vector: ${avgVector.length.toFixed(3)}`
                                                        : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                                                    easyFormula: isExp && avgVector
                                                        ? `avg (${avgVector.length.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.length.toFixed(3)}`
                                                        : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.length.toFixed(3)}`,
                                                    diffFormula: isExp && avgVector
                                                        ? `clamp(avg (${avgVector.length.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.length.toFixed(3)}`
                                                        : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.length.toFixed(3)}`,
                                                },
                                                {
                                                    id: "elevation",
                                                    label: "Peak (MASL)",
                                                    category: "Physical Exertion",
                                                    easyDisplay: easyFeats.elevation.toFixed(3),
                                                    diffDisplay: diffFeats.elevation.toFixed(3),
                                                    rawScore: isExp
                                                        ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.geography?.masl || t.difficulty?.elevation || 0} m`).join(", ")} (Average: ${Math.round(matched.reduce((acc, t) => acc + (t.geography?.masl || t.difficulty?.elevation || 0), 0) / matched.length)} m)`
                                                        : `Calibrated baseline (Dataset bounds: ${Math.round(bounds.elevation.min)} m to ${Math.round(bounds.elevation.max)} m)`,
                                                    boundsText: `Dataset Bounds: ${Math.round(bounds.elevation.min)} m to ${Math.round(bounds.elevation.max)} m`,
                                                    normFormula: isExp && avgVector
                                                        ? `(masl - min) / (max - min) -> Average Normalized Vector: ${avgVector.elevation.toFixed(3)}`
                                                        : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                                                    easyFormula: isExp && avgVector
                                                        ? `avg (${avgVector.elevation.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.elevation.toFixed(3)}`
                                                        : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.elevation.toFixed(3)}`,
                                                    diffFormula: isExp && avgVector
                                                        ? `clamp(avg (${avgVector.elevation.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.elevation.toFixed(3)}`
                                                        : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.elevation.toFixed(3)}`,
                                                },
                                                {
                                                    id: "gain",
                                                    label: "Gain",
                                                    category: "Physical Exertion",
                                                    easyDisplay: easyFeats.gain.toFixed(3),
                                                    diffDisplay: diffFeats.gain.toFixed(3),
                                                    rawScore: isExp
                                                        ? `${matched.map((t) => `${t.general?.name || t.id}: ${calculateTrailGain(t, startElevations[t.id])} m`).join(", ")} (Average: ${Math.round(matched.reduce((acc, t) => acc + calculateTrailGain(t, startElevations[t.id]), 0) / matched.length)} m)`
                                                        : `Calibrated baseline (Dataset bounds: ${Math.round(bounds.gain.min)} m to ${Math.round(bounds.gain.max)} m)`,
                                                    boundsText: `Dataset Bounds: ${Math.round(bounds.gain.min)} m to ${Math.round(bounds.gain.max)} m (Peak MASL - Start Elevation)`,
                                                    normFormula: isExp && avgVector
                                                        ? `(gain - min) / (max - min) -> Average Normalized Vector: ${avgVector.gain.toFixed(3)}`
                                                        : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                                                    easyFormula: isExp && avgVector
                                                        ? `avg (${avgVector.gain.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.gain.toFixed(3)}`
                                                        : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.gain.toFixed(3)}`,
                                                    diffFormula: isExp && avgVector
                                                        ? `clamp(avg (${avgVector.gain.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.gain.toFixed(3)}`
                                                        : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.gain.toFixed(3)}`,
                                                },
                                                {
                                                    id: "slope",
                                                    label: "Slope",
                                                    category: "Physical Exertion",
                                                    easyDisplay: easyFeats.slope.toFixed(3),
                                                    diffDisplay: diffFeats.slope.toFixed(3),
                                                    rawScore: isExp
                                                        ? `${matched.map((t) => `${t.general?.name || t.id}: ${t.difficulty?.slope ?? 0}%`).join(", ")} (Average: ${(matched.reduce((acc, t) => acc + (t.difficulty?.slope ?? 0), 0) / matched.length).toFixed(1)}%)`
                                                        : `Calibrated baseline (Dataset bounds: ${bounds.slope.min.toFixed(1)}% to ${bounds.slope.max.toFixed(1)}%)`,
                                                    boundsText: `Dataset Bounds: ${bounds.slope.min.toFixed(1)}% to ${bounds.slope.max.toFixed(1)}%`,
                                                    normFormula: isExp && avgVector
                                                        ? `(slope - min) / (max - min) -> Average Normalized Vector: ${avgVector.slope.toFixed(3)}`
                                                        : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                                                    easyFormula: isExp && avgVector
                                                        ? `avg (${avgVector.slope.toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.slope.toFixed(3)}`
                                                        : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.slope.toFixed(3)}`,
                                                    diffFormula: isExp && avgVector
                                                        ? `clamp(avg (${avgVector.slope.toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.slope.toFixed(3)}`
                                                        : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.slope.toFixed(3)}`,
                                                },
                                                ...PROVINCES.map((prov) => {
                                                    const pKey = prov.toLowerCase() as keyof Profile['features']['province'];
                                                    const isPref = selectedUser.preferences?.province?.some(
                                                        (p) => typeof p === "string" && p.toLowerCase().includes(pKey)
                                                    );
                                                    const mInProv = matched.filter((t) =>
                                                        t.general?.province?.some((p) => typeof p === "string" && p.toLowerCase().includes(pKey))
                                                    );

                                                    return {
                                                        id: `prov_${pKey}`,
                                                        label: prov,
                                                        category: "Province Preference" as const,
                                                        easyDisplay: easyFeats.province[pKey].toFixed(3),
                                                        diffDisplay: diffFeats.province[pKey].toFixed(3),
                                                        rawScore: isExp
                                                            ? mInProv.length > 0
                                                                ? `${mInProv.map((t) => t.general?.name || t.id).join(", ")} (${mInProv.length} of ${matched.length} matched trails, ${((mInProv.length / matched.length) * 100).toFixed(0)}%)`
                                                                : `0 of ${matched.length} matched trails located in ${prov}`
                                                            : isPref
                                                                ? "Selected in survey preferences (Preferred Province)"
                                                                : "Not selected in survey preferences",
                                                        normFormula: isExp && avgVector
                                                            ? mInProv.length > 0
                                                                ? `Direct Geographic Preservation: historical affinity vector (${avgVector.province[pKey].toFixed(3)})`
                                                                : "Unobserved in trail history (0.000) -> Softened via survey preference prior"
                                                            : `Preferred = ${prefWeightStr} (comfort), Unselected = ${unselectedWeightStr} (baseline)`,
                                                        easyFormula: isExp
                                                            ? mInProv.length > 0
                                                                ? `Preserved raw affinity: Easy = ${easyFeats.province[pKey].toFixed(3)}`
                                                                : isPref
                                                                    ? `Survey preferred prior (comfort) = ${prefWeightStr}`
                                                                    : `Unselected baseline prior = ${unselectedWeightStr}`
                                                            : isPref
                                                                ? `High preference affinity weight = ${prefWeightStr}`
                                                                : `Unselected baseline = ${unselectedWeightStr}`,
                                                        diffFormula: isExp
                                                            ? mInProv.length > 0
                                                                ? `Preserved raw affinity: Difficult = ${diffFeats.province[pKey].toFixed(3)}`
                                                                : isPref
                                                                    ? `Exploration downweight = ${unselectedWeightStr}`
                                                                    : `Exploration discovery incentive prior = ${prefWeightStr}`
                                                            : isPref
                                                                ? `Exploration downweight = ${unselectedWeightStr}`
                                                                : `Exploration discovery incentive = ${prefWeightStr}`,
                                                    };
                                                }),
                                                ...([
                                                    ["muddy", "Muddy Terrain"],
                                                    ["rocky", "Rocky Terrain"],
                                                    ["grassland", "Grassland"],
                                                    ["ridges", "Ridges"],
                                                ] as const).map(([tKey, tLabel]) => {
                                                    const mWithTerrain = matched.filter((t) => {
                                                        const resolved = resolveTerrainFeatures([
                                                            ...(t.difficulty?.quality || []),
                                                            ...(t.difficulty?.difficulty_points || []),
                                                        ]);
                                                        return resolved[tKey] > 0;
                                                    });

                                                    return {
                                                        id: `terrain_${tKey}`,
                                                        label: tLabel,
                                                        category: "Terrain Feature" as const,
                                                        easyDisplay: easyFeats.terrain[tKey].toFixed(3),
                                                        diffDisplay: diffFeats.terrain[tKey].toFixed(3),
                                                        rawScore: isExp
                                                            ? mWithTerrain.length > 0
                                                                ? `${mWithTerrain.map((t) => t.general?.name || t.id).join(", ")} (${mWithTerrain.length} of ${matched.length} trails)`
                                                                : `Not present in any matched survey trails`
                                                            : "Default beginner baseline (no historical terrain encounters)",
                                                        normFormula: isExp && avgVector
                                                            ? mWithTerrain.length > 0
                                                                ? `Average Normalized Vector across matched trails: ${avgVector.terrain[tKey].toFixed(3)}`
                                                                : "Unobserved in trail history (0.000) -> Softened to beginner baseline prior"
                                                            : `Calibrated normalized base: ${begEasyStr} (Easy) / ${begDiffStr} (Difficult)`,
                                                        easyFormula: isExp && avgVector
                                                            ? mWithTerrain.length > 0
                                                                ? `avg (${avgVector.terrain[tKey].toFixed(3)}) * ${easyFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.terrain[tKey].toFixed(3)}`
                                                                : `Unobserved baseline: ${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.terrain[tKey].toFixed(3)}`
                                                            : `${begEasyStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${easyFeats.terrain[tKey].toFixed(3)}`,
                                                        diffFormula: isExp && avgVector
                                                            ? mWithTerrain.length > 0
                                                                ? `clamp(avg (${avgVector.terrain[tKey].toFixed(3)}) * ${diffFactorStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""}) = ${diffFeats.terrain[tKey].toFixed(3)}`
                                                                : `Unobserved baseline: ${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.terrain[tKey].toFixed(3)}`
                                                            : `${begDiffStr} ${hasMed ? `* ${medFactorStr} (medical)` : ""} = ${diffFeats.terrain[tKey].toFixed(3)}`,
                                                    };
                                                }),
                                            ];

                                            return (
                                                <View style={styles.calcTable}>
                                                    <View style={styles.calcTableRowHeader}>
                                                        <Text style={[styles.calcTh, { flex: 2 }]}>Feature</Text>
                                                        <Text style={[styles.calcTh, { flex: 1.5, textAlign: "center", color: Palette.Green700 }]}>
                                                            Easy Anchor
                                                        </Text>
                                                        <Text style={[styles.calcTh, { flex: 1.5, textAlign: "center", color: Palette.Amber700 }]}>
                                                            Difficult Anchor
                                                        </Text>
                                                    </View>

                                                    {featureItems.map((feat) => {
                                                        const isExpanded = expandedFeatureKey === feat.id;

                                                        return (
                                                            <React.Fragment key={feat.id}>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.7}
                                                                    onPress={() => setExpandedFeatureKey(isExpanded ? null : feat.id)}
                                                                    style={[
                                                                        styles.calcTableRow,
                                                                        isExpanded && styles.calcTableRowActive,
                                                                    ]}
                                                                >
                                                                    <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                                        <CustomIcon
                                                                            library="Feather"
                                                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                                                            size={12}
                                                                            color={isExpanded ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                                                        />
                                                                        <Text style={[styles.calcTdBold, isExpanded && { color: Colors.PRIMARY }]}>
                                                                            {feat.label}
                                                                        </Text>
                                                                    </View>
                                                                    <Text style={[styles.calcTd, { flex: 1.5, textAlign: "center", color: Palette.Green700, fontWeight: "600" }]}>
                                                                        {feat.easyDisplay}
                                                                    </Text>
                                                                    <Text style={[styles.calcTd, { flex: 1.5, textAlign: "center", color: Palette.Amber700, fontWeight: "600" }]}>
                                                                        {feat.diffDisplay}
                                                                    </Text>
                                                                </TouchableOpacity>

                                                                {/* Expanded Dropdown Breakdown */}
                                                                {isExpanded && (
                                                                    <View style={styles.breakdownCard}>
                                                                        <View style={styles.breakdownHeader}>
                                                                            <View style={styles.breakdownBadge}>
                                                                                <Text style={styles.breakdownBadgeText}>{feat.category}</Text>
                                                                            </View>
                                                                            {hasMed && (feat.category === "Physical Exertion" || feat.category === "Terrain Feature") && (
                                                                                <View style={styles.breakdownMedBadge}>
                                                                                    <Text style={styles.breakdownMedBadgeText}>{medFactorStr}x Medical Downshift</Text>
                                                                                </View>
                                                                            )}
                                                                        </View>

                                                                        {/* Raw Score Breakdown */}
                                                                        <View style={styles.breakdownSection}>
                                                                            <Text style={styles.breakdownLabel}>Raw Score / Data Source:</Text>
                                                                            <Text style={styles.breakdownValue}>{feat.rawScore}</Text>
                                                                        </View>

                                                                        {/* Bounds / Range if applicable */}
                                                                        {"boundsText" in feat && feat.boundsText ? (
                                                                            <View style={styles.breakdownSection}>
                                                                                <Text style={styles.breakdownLabel}>Dataset Normalization Range:</Text>
                                                                                <Text style={styles.breakdownValue}>{feat.boundsText}</Text>
                                                                            </View>
                                                                        ) : null}

                                                                        {/* Normalized Base Formula */}
                                                                        <View style={styles.breakdownSection}>
                                                                            <Text style={styles.breakdownLabel}>Normalized Base Formula:</Text>
                                                                            <Text style={styles.breakdownValue}>{feat.normFormula}</Text>
                                                                        </View>

                                                                        {/* Two-Anchor Computation */}
                                                                        <View style={styles.breakdownTwinGrid}>
                                                                            <View style={styles.breakdownAnchorBoxEasy}>
                                                                                <Text style={styles.breakdownAnchorTitleEasy}>Easy Anchor Computation</Text>
                                                                                <Text style={styles.breakdownFormulaText}>{feat.easyFormula}</Text>
                                                                                <Text style={styles.breakdownResultEasy}>Final Vector: {feat.easyDisplay}</Text>
                                                                            </View>
                                                                            <View style={styles.breakdownAnchorBoxDiff}>
                                                                                <Text style={styles.breakdownAnchorTitleDiff}>Difficult Anchor Computation</Text>
                                                                                <Text style={styles.breakdownFormulaText}>{feat.diffFormula}</Text>
                                                                                <Text style={styles.breakdownResultDiff}>Final Vector: {feat.diffDisplay}</Text>
                                                                            </View>
                                                                        </View>
                                                                    </View>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </View>
                                            );
                                        })()}
                                    </View>
                                );
                            })()}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        fontSize: 11,
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
        borderColor: Palette.Red200,
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
        paddingVertical: 10,
        alignItems: "center",
    },
    tableBodyVerticalScroll: {
        flex: 1,
    },
    tableBodyScrollContent: {
        paddingBottom: 16,
    },
    th: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        paddingHorizontal: 6,
    },
    thSubCenter: {
        fontSize: 9,
        fontWeight: "500",
        color: Palette.Neutral400,
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        paddingVertical: 8,
        alignItems: "center",
    },
    userBlock: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        alignItems: "stretch",
    },
    subTableRow: {
        flexDirection: "row",
        paddingVertical: 8,
        alignItems: "center",
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
    rowEvenSub: {
        backgroundColor: "rgba(248, 250, 252, 0.6)",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    rowOddSub: {
        backgroundColor: "rgba(241, 245, 249, 0.6)",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    td: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        paddingHorizontal: 6,
    },
    tdCell: {
        paddingHorizontal: 4,
        justifyContent: "center",
    },
    valNormalized: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
        textAlign: "center",
    },
    valRaw: {
        fontSize: 10,
        color: Palette.Neutral400,
        textAlign: "center",
    },
    nameCell: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    subUserText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },
    anchorBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 2,
    },
    easyBadge: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green200,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    easyBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Green700,
    },
    difficultBadge: {
        backgroundColor: Palette.Amber50,
        borderColor: Palette.Amber200,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    difficultBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Amber700,
    },
    medBadge: {
        backgroundColor: Palette.Red50,
        borderColor: Palette.Red100,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    medBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Red700,
    },
    savedBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: Palette.Green700,
    },
    unsavedBadgeText: {
        fontSize: 10,
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

    // Column Widths (matching TrailDataset)
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
    colAction: { width: 120 },

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
        fontSize: 11,
        fontWeight: "600",
        color: Colors.WHITE,
    },
    inspectBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    inspectBtnText: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
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
    loadingText: {
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: "85%",
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    modalSubId: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    modalCloseButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: Palette.Slate100,
    },
    modalBody: {
        padding: 20,
    },
    modalSyncBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    modalSyncTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    modalSaveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    modalSavedBtn: {
        backgroundColor: Palette.Green600,
    },
    modalSaveBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.WHITE,
    },
    detailSection: {
        gap: 8,
    },
    detailSectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingBottom: 4,
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        paddingVertical: 2,
    },
    detailKey: {
        width: 150,
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    detailVal: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    calcTable: {
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        overflow: "hidden",
        marginTop: 6,
        marginBottom: 10,
    },
    calcTableRowHeader: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    calcTh: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    calcTableRow: {
        flexDirection: "row",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        alignItems: "center",
    },
    calcTdBold: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    calcTd: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
    },
    tapInstructionText: {
        fontSize: 11,
        fontStyle: "italic",
        color: Colors.PRIMARY,
        fontWeight: "500",
    },
    calcTableRowActive: {
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        borderBottomColor: Palette.Emerald200,
    },
    breakdownCard: {
        backgroundColor: Palette.Slate50,
        padding: 10,
        marginHorizontal: 4,
        marginBottom: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 6,
    },
    breakdownHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
    breakdownBadge: {
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    breakdownBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    breakdownMedBadge: {
        backgroundColor: Palette.Red50,
        borderWidth: 1,
        borderColor: Palette.Red200,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    breakdownMedBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Red700,
    },
    breakdownSection: {
        gap: 2,
    },
    breakdownLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    breakdownValue: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 15,
    },
    breakdownTwinGrid: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    breakdownAnchorBoxEasy: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Green200,
        borderRadius: 6,
        padding: 8,
        gap: 4,
    },
    breakdownAnchorTitleEasy: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Green700,
        textTransform: "uppercase",
    },
    breakdownAnchorBoxDiff: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        borderRadius: 6,
        padding: 8,
        gap: 4,
    },
    breakdownAnchorTitleDiff: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Amber700,
        textTransform: "uppercase",
    },
    breakdownFormulaText: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        fontFamily: "monospace",
        lineHeight: 15,
    },
    breakdownResultEasy: {
        fontSize: 11,
        fontWeight: "700",
        color: Palette.Green700,
        marginTop: 2,
    },
    breakdownResultDiff: {
        fontSize: 11,
        fontWeight: "700",
        color: Palette.Amber700,
        marginTop: 2,
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
