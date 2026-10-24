import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Hike } from "@/src/core/models/Hike/Hike";
import { IRecommendedTrailItem, Recommendation } from "@/src/core/models/Recommendation/interfaces/Recommendation.types";
import { RecommendationRepo } from "@/src/core/models/Recommendation/repositories/recommendationRepository";
import { Review } from "@/src/core/models/Review/Review";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import getRecoID from "@/src/core/utility/recommendation";
import { RecommendationFactors } from "@/src/recommendation/constants/RecommendationFactors";
import { Profile, UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";
import {
    BatchTrailProfile,
    GenerateUserProfile,
    HasMedicalCondition,
    MatchSurveyTrails
} from "@/src/recommendation/utilities/CreateProfile";
import { calculateTrailGain } from "@/src/recommendation/utilities/GetElevation";
import {
    buildTrailProfiles,
    calculateDatasetBounds,
    DatasetBounds,
    resolveTerrainFeatures,
} from "@/src/recommendation/utilities/NormalizeTrails";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<
        "all" | "with_profile" | "without_profile" | "medical" | "hiked" | "not_hiked" | "with_prefs"
    >("all");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);
    const [savedProfilesMap, setSavedProfilesMap] = useState<Record<string, UserProfiles>>({});
    const [isReady, setIsReady] = useState<boolean>(false);
    const [expandedFeatureKey, setExpandedFeatureKey] = useState<string | null>(null);

    // Embedded Recommendation State for Selected User
    const [userRecommendations, setUserRecommendations] = useState<Recommendation | null>(null);
    const [isLoadingRecos, setIsLoadingRecos] = useState<boolean>(false);
    const [recoMonth, setRecoMonth] = useState<string>(getRecoID());
    const [recoCategoryTab, setRecoCategoryTab] = useState<"all" | "easy" | "difficult">("all");
    const [recoSearchQuery, setRecoSearchQuery] = useState<string>("");
    const [modalSectionTab, setModalSectionTab] = useState<"both" | "profile" | "recos">("both");
    const [recoError, setRecoError] = useState<string | null>(null);
    const [expandedRecoId, setExpandedRecoId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedUser?.id) {
            setIsLoadingRecos(true);
            setRecoSearchQuery("");
            setModalSectionTab("both");
            setRecoError(null);
            RecommendationRepo.fetchByMonth(selectedUser.id, recoMonth)
                .then((data) => {
                    setUserRecommendations(data);
                    setRecoError(null);
                })
                .catch((err: any) => {
                    console.error("[UserDataset] Failed to load recommendations for user", selectedUser.id, err);
                    setRecoError(err?.message || "Failed to load user recommendations from Firestore.");
                    setUserRecommendations(null);
                })
                .finally(() => setIsLoadingRecos(false));
        } else {
            setUserRecommendations(null);
            setRecoError(null);
        }
    }, [selectedUser?.id, recoMonth]);

    const modalEasyTrails = useMemo(() => userRecommendations?.easy || [], [userRecommendations]);
    const modalDifficultTrails = useMemo(() => userRecommendations?.difficult || [], [userRecommendations]);

    const displayedModalTrails = useMemo(() => {
        let list: IRecommendedTrailItem[] = [];
        if (recoCategoryTab === "easy") {
            list = modalEasyTrails;
        } else if (recoCategoryTab === "difficult") {
            list = modalDifficultTrails;
        } else {
            list = [...modalEasyTrails, ...modalDifficultTrails];
        }

        if (recoSearchQuery.trim().length > 0) {
            const q = recoSearchQuery.toLowerCase();
            list = list.filter((t) => t.trailName.toLowerCase().includes(q));
        }
        return list;
    }, [modalEasyTrails, modalDifficultTrails, recoCategoryTab, recoSearchQuery]);

    const getScoreBadgeColor = (score: number) => {
        if (score <= 0.30) {
            return { bg: Palette.Green50, border: Palette.Green200, text: Palette.Green800, label: "Top Match" };
        }
        if (score <= 0.55) {
            return { bg: Palette.Amber50, border: Palette.Amber200, text: Palette.Amber800, label: "Moderate" };
        }
        return { bg: Palette.Slate100, border: Palette.Slate200, text: Palette.Slate700, label: "Lower Match" };
    };

    const getFormulaFullName = (code?: string) => {
        switch (code) {
            case "GD":
                return "Gower's Distance (GD)";
            case "ED":
                return "Normalized Euclidean (ED)";
            case "CS":
                return "Cosine Distance (CS)";
            default:
                return code || "Gower's Distance (GD)";
        }
    };

    const getRawCbfFormula = (code?: string) => {
        switch (code) {
            case "GD":
                return "dist = (1 / 28) * sum(|Anchor[i] - Trail[i]|)";
            case "ED":
                return "dist = sqrt( (1 / 28) * sum((Anchor[i] - Trail[i])^2) )";
            case "CS":
                return "dist = 1.0 - ( (Anchor · Trail) / (norm(Anchor) * norm(Trail)) )";
            default:
                return "dist = (1 / 28) * sum(|Anchor[i] - Trail[i]|)";
        }
    };

    const getRawCbfExplanation = (code?: string) => {
        switch (code) {
            case "GD":
                return "Computes normalized absolute difference |Anchor[i] - Trail[i]| for each of 28 feature dimensions, then averages them across all features.";
            case "ED":
                return "Calculates squared difference across 28 feature dimensions, divides by 28, and takes the square root (normalized distance in [0.0, 1.0]).";
            case "CS":
                return "Measures angular divergence by computing 1.0 - (dot product / (norm(Anchor) * norm(Trail))), evaluating directional alignment across 28 features.";
            default:
                return "Computes normalized feature distance across all 28 dimensions.";
        }
    };

    // Reset expanded feature dropdown and recommendation card when selected user changes
    useEffect(() => {
        setExpandedFeatureKey(null);
        setExpandedRecoId(null);
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

                        {/* Sub-navigation tabs: All Details vs Profile vs Recos */}
                        <View style={styles.modalSubNav}>
                            <TouchableOpacity
                                style={[styles.modalNavTab, modalSectionTab === "both" && styles.modalNavTabActive]}
                                onPress={() => setModalSectionTab("both")}
                            >
                                <Text style={[styles.modalNavTabText, modalSectionTab === "both" && styles.modalNavTabTextActive]}>
                                    All Info & Recommendations
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalNavTab, modalSectionTab === "profile" && styles.modalNavTabActive]}
                                onPress={() => setModalSectionTab("profile")}
                            >
                                <Text style={[styles.modalNavTabText, modalSectionTab === "profile" && styles.modalNavTabTextActive]}>
                                    Profile Info Only
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalNavTab, modalSectionTab === "recos" && styles.modalNavTabActive]}
                                onPress={() => setModalSectionTab("recos")}
                            >
                                <View style={styles.modalNavBadge}>
                                    <Text style={styles.modalNavBadgeText}>
                                        {modalEasyTrails.length + modalDifficultTrails.length}
                                    </Text>
                                </View>
                                <Text style={[styles.modalNavTabText, modalSectionTab === "recos" && styles.modalNavTabTextActive]}>
                                    Recommendations Only
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedUser && (() => {
                                const userModalProfiles = resolveProfiles(selectedUser);
                                const isSaved = !!selectedUser.profile || !!savedProfilesMap[selectedUser.id];
                                const surveyLocations = selectedUser.preferences?.location || [];
                                const matched = MatchSurveyTrails(surveyLocations, trails);

                                return (
                                    <View style={{ gap: 20 }}>
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

                                        {/* 1. USER PROFILE INFORMATION SECTION */}
                                        {(modalSectionTab === "both" || modalSectionTab === "profile") && (
                                            <View style={styles.detailSection}>

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
                                        )}

                                        {/* 2. USER RECOMMENDATIONS SECTION (Grouped by Easy/Difficult, with Match Scores & Hike Status) */}
                                        {(modalSectionTab === "both" || modalSectionTab === "recos") && (
                                            <View style={styles.recoSection}>
                                                {/* Header Strip */}
                                                <View style={styles.recoSectionHeader}>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                            <CustomIcon library="Feather" name="compass" size={16} color={Colors.PRIMARY} />
                                                            <Text style={styles.recoSectionTitle}>Monthly Recommended Trails</Text>
                                                            <View style={styles.recoMonthBadge}>
                                                                <Text style={styles.recoMonthBadgeText}>{recoMonth}</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.recoMetaSubText}>
                                                            {userRecommendations?.engineConfig
                                                                ? `Engine: CBF (${userRecommendations.engineConfig.cbf}) + CF (${userRecommendations.engineConfig.cf}) • alpha = ${userRecommendations.engineConfig.alpha}`
                                                                : "Stored in /users/{userId}/recommendations/" + recoMonth}
                                                        </Text>
                                                    </View>

                                                    <TouchableOpacity
                                                        style={styles.recoRefreshBtn}
                                                        onPress={() => {
                                                            if (selectedUser?.id) {
                                                                setIsLoadingRecos(true);
                                                                setRecoError(null);
                                                                RecommendationRepo.fetchByMonth(selectedUser.id, recoMonth)
                                                                    .then((data) => {
                                                                        setUserRecommendations(data);
                                                                        setRecoError(null);
                                                                    })
                                                                    .catch((err: any) => {
                                                                        console.error("[UserDataset] Failed to refresh recommendations for user", selectedUser.id, err);
                                                                        setRecoError(err?.message || "Failed to load user recommendations from Firestore.");
                                                                        setUserRecommendations(null);
                                                                    })
                                                                    .finally(() => setIsLoadingRecos(false));
                                                            }
                                                        }}
                                                        disabled={isLoadingRecos}
                                                    >
                                                        <CustomIcon
                                                            library="Feather"
                                                            name="rotate-cw"
                                                            size={12}
                                                            color={isLoadingRecos ? Colors.GRAY : Colors.PRIMARY}
                                                        />
                                                        <Text style={styles.recoRefreshBtnText}>
                                                            {isLoadingRecos ? "Loading..." : "Refresh"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>

                                                {/* Category Selector & Search Controls */}
                                                <View style={styles.recoControlsRow}>
                                                    <View style={styles.recoCategoryPills}>
                                                        <TouchableOpacity
                                                            style={[styles.recoPill, recoCategoryTab === "all" && styles.recoPillActive]}
                                                            onPress={() => setRecoCategoryTab("all")}
                                                        >
                                                            <Text style={[styles.recoPillText, recoCategoryTab === "all" && styles.recoPillTextActive]}>
                                                                All ({modalEasyTrails.length + modalDifficultTrails.length})
                                                            </Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[styles.recoPill, recoCategoryTab === "easy" && styles.recoPillActiveEasy]}
                                                            onPress={() => setRecoCategoryTab("easy")}
                                                        >
                                                            <Text style={[styles.recoPillText, recoCategoryTab === "easy" && styles.recoPillTextActiveEasy]}>
                                                                Easy ({modalEasyTrails.length})
                                                            </Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[styles.recoPill, recoCategoryTab === "difficult" && styles.recoPillActiveDiff]}
                                                            onPress={() => setRecoCategoryTab("difficult")}
                                                        >
                                                            <Text style={[styles.recoPillText, recoCategoryTab === "difficult" && styles.recoPillTextActiveDiff]}>
                                                                Difficult ({modalDifficultTrails.length})
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    <View style={styles.recoSearchRow}>
                                                        <CustomIcon library="Feather" name="search" size={13} color={Colors.TEXT_SECONDARY} />
                                                        <TextInput
                                                            style={styles.recoSearchInput}
                                                            placeholder="Filter recommended trails..."
                                                            placeholderTextColor={Colors.TEXT_SECONDARY}
                                                            value={recoSearchQuery}
                                                            onChangeText={setRecoSearchQuery}
                                                        />
                                                        {recoSearchQuery.length > 0 && (
                                                            <TouchableOpacity onPress={() => setRecoSearchQuery("")}>
                                                                <CustomIcon library="Feather" name="x" size={12} color={Colors.TEXT_SECONDARY} />
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Recommendations Content State */}
                                                {isLoadingRecos ? (
                                                    <View style={styles.recoCenterBox}>
                                                        <ActivityIndicator size="small" color={Colors.PRIMARY} />
                                                        <Text style={styles.recoLoadingText}>
                                                            Loading recommendations for {recoMonth}...
                                                        </Text>
                                                    </View>
                                                ) : recoError ? (
                                                    <View style={styles.recoErrorBox}>
                                                        <CustomIcon library="Feather" name="alert-triangle" size={24} color={Palette.Red700} />
                                                        <Text style={styles.recoErrorTitle}>Firestore Permission / Access Blocked</Text>
                                                        <Text style={styles.recoErrorDesc}>{recoError}</Text>
                                                        <Text style={styles.recoErrorHint}>
                                                            Deploy the updated firestore.rules to Firebase to grant Superadmin read access across all users' recommendation subcollections.
                                                        </Text>
                                                    </View>
                                                ) : !userRecommendations || (modalEasyTrails.length === 0 && modalDifficultTrails.length === 0) ? (
                                                    <View style={styles.recoEmptyBox}>
                                                        <CustomIcon library="Feather" name="inbox" size={32} color={Colors.TEXT_SECONDARY} />
                                                        <Text style={styles.recoEmptyTitle}>
                                                            No Recommendations for {recoMonth}
                                                        </Text>
                                                        <Text style={styles.recoEmptyDesc}>
                                                            {isSaved
                                                                ? "This user has a saved profile in Firestore, but recommendations haven't been run yet for this month."
                                                                : "Save this user's profile to Firestore first, then run the engine to generate recommendations."}
                                                        </Text>
                                                        {onRunEnginePress && (
                                                            <TouchableOpacity
                                                                style={styles.recoRunNowBtn}
                                                                onPress={() => {
                                                                    setSelectedUser(null);
                                                                    onRunEnginePress();
                                                                }}
                                                            >
                                                                <CustomIcon library="Feather" name="play" size={13} color={Colors.WHITE} />
                                                                <Text style={styles.recoRunNowText}>Run Engine Now</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                ) : displayedModalTrails.length === 0 ? (
                                                    <View style={styles.recoEmptyBox}>
                                                        <CustomIcon library="Feather" name="search" size={24} color={Colors.TEXT_SECONDARY} />
                                                        <Text style={styles.recoEmptyTitle}>No Trails Match Filter</Text>
                                                        <Text style={styles.recoEmptyDesc}>
                                                            Try adjusting your search query or switching categories.
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.recoGrid}>
                                                        {displayedModalTrails.map((trail, idx) => {
                                                            const badgeColor = getScoreBadgeColor(trail.score);
                                                            const isEasy = trail.category === "easy";
                                                            const cardKey = `${trail.category}-${trail.id}-${idx}`;
                                                            const isExpanded = expandedRecoId === cardKey;

                                                            const alpha = userRecommendations?.engineConfig?.alpha ?? 1.0;
                                                            const cbfCode = userRecommendations?.engineConfig?.cbf ?? "GD";
                                                            const cfCode = userRecommendations?.engineConfig?.cf ?? "GD";

                                                            // Use stored cbfScore/cfScore if present, or reconstruct with exact mathematical consistency
                                                            const cbfValue = trail.cbfScore != null
                                                                ? trail.cbfScore
                                                                : (alpha === 1.0 ? trail.score : trail.score / Math.max(alpha, 0.001));
                                                            const cfValue = trail.cfScore != null
                                                                ? trail.cfScore
                                                                : 0.0;

                                                            const cbfWeighted = alpha * cbfValue;
                                                            const cfWeighted = (1.0 - alpha) * cfValue;

                                                            const candidateTrail = trails.find((t) => t.id === trail.id);
                                                            const candidateProfile = trailProfilesMap.get(trail.id) || candidateTrail?.profile;
                                                            const candidateFeats = candidateProfile?.features;
                                                            const targetAnchorFeats = isEasy ? userModalProfiles.easy.features : userModalProfiles.difficult.features;
                                                            const userCount = userRecommendations?.engineConfig?.userCount ?? (filteredUsers.filter((u) => !!u.profile).length || 1);

                                                            return (
                                                                <View key={cardKey} style={[styles.recoCard, isExpanded && styles.recoCardExpanded]}>
                                                                    <TouchableOpacity
                                                                        activeOpacity={0.7}
                                                                        onPress={() => setExpandedRecoId(isExpanded ? null : cardKey)}
                                                                        style={styles.recoCardClickable}
                                                                    >
                                                                        <View style={styles.recoCardTop}>
                                                                            <View style={styles.recoRankBox}>
                                                                                <Text style={styles.recoRankNum}>#{idx + 1}</Text>
                                                                            </View>
                                                                            <View style={{ flex: 1 }}>
                                                                                <Text style={styles.recoTrailTitle} numberOfLines={1}>
                                                                                    {trail.trailName}
                                                                                </Text>
                                                                                <Text style={styles.recoTrailIdText}>ID: {trail.id}</Text>
                                                                            </View>
                                                                            <View
                                                                                style={[
                                                                                    styles.recoCategoryTag,
                                                                                    isEasy ? styles.tagEasy : styles.tagDiff,
                                                                                ]}
                                                                            >
                                                                                <Text
                                                                                    style={[
                                                                                        styles.recoCategoryTagText,
                                                                                        isEasy ? styles.tagTextEasy : styles.tagTextDiff,
                                                                                    ]}
                                                                                >
                                                                                    {isEasy ? "Easy Set" : "Difficult Set"}
                                                                                </Text>
                                                                            </View>
                                                                        </View>

                                                                        <View style={styles.recoCardBottom}>
                                                                            <View
                                                                                style={[
                                                                                    styles.recoScoreBadge,
                                                                                    {
                                                                                        backgroundColor: badgeColor.bg,
                                                                                        borderColor: badgeColor.border,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Text
                                                                                    style={[
                                                                                        styles.recoScoreText,
                                                                                        { color: badgeColor.text },
                                                                                    ]}
                                                                                >
                                                                                    Score: {trail.score.toFixed(4)}
                                                                                </Text>
                                                                                <View
                                                                                    style={[
                                                                                        styles.recoQualityChip,
                                                                                        { backgroundColor: badgeColor.border },
                                                                                    ]}
                                                                                >
                                                                                    <Text
                                                                                        style={[
                                                                                            styles.recoQualityChipText,
                                                                                            { color: badgeColor.text },
                                                                                        ]}
                                                                                    >
                                                                                        {badgeColor.label}
                                                                                    </Text>
                                                                                </View>
                                                                            </View>

                                                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                                                <View
                                                                                    style={[
                                                                                        styles.recoHikeTag,
                                                                                        trail.haveHiked ? styles.tagHiked : styles.tagUnhiked,
                                                                                    ]}
                                                                                >
                                                                                    <CustomIcon
                                                                                        library="Feather"
                                                                                        name={trail.haveHiked ? "check-circle" : "clock"}
                                                                                        size={11}
                                                                                        color={trail.haveHiked ? Palette.Green700 : Palette.Slate600}
                                                                                    />
                                                                                    <Text
                                                                                        style={[
                                                                                            styles.recoHikeTagText,
                                                                                            trail.haveHiked ? styles.tagHikedText : styles.tagUnhikedText,
                                                                                        ]}
                                                                                    >
                                                                                        {trail.haveHiked ? "Completed Hike" : "Not Yet Hiked"}
                                                                                    </Text>
                                                                                </View>

                                                                                <View style={styles.recoExpandHint}>
                                                                                    <Text style={styles.recoExpandHintText}>
                                                                                        {isExpanded ? "Hide calculation" : "Calculation breakdown"}
                                                                                    </Text>
                                                                                    <CustomIcon
                                                                                        library="Feather"
                                                                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                                                                        size={13}
                                                                                        color={Colors.PRIMARY}
                                                                                    />
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                    </TouchableOpacity>

                                                                    {/* Expanded Score Calculation Breakdown Card */}
                                                                    {isExpanded && (
                                                                        <View style={styles.recoBreakdownCard}>
                                                                            {/* Formula Definition Header */}
                                                                            <View style={styles.recoBreakdownTop}>
                                                                                <CustomIcon library="Feather" name="activity" size={14} color={Colors.PRIMARY} />
                                                                                <Text style={styles.recoBreakdownHeading}>
                                                                                    ThAReSys Hybrid Scoring Formula & Transparency Breakdown
                                                                                </Text>
                                                                            </View>
                                                                            <Text style={styles.recoFormulaCode}>
                                                                                Score = (alpha * CBF) + ((1 - alpha) * CF)
                                                                            </Text>

                                                                            {/* Metric & Weight Metadata Strip */}
                                                                            <View style={styles.recoConfigStrip}>
                                                                                <View style={styles.recoConfigItem}>
                                                                                    <Text style={styles.recoConfigKey}>CBF Formula:</Text>
                                                                                    <Text style={styles.recoConfigVal}>{getFormulaFullName(cbfCode)}</Text>
                                                                                </View>
                                                                                <View style={styles.recoConfigItem}>
                                                                                    <Text style={styles.recoConfigKey}>CF Formula:</Text>
                                                                                    <Text style={styles.recoConfigVal}>{getFormulaFullName(cfCode)}</Text>
                                                                                </View>
                                                                                <View style={styles.recoConfigItem}>
                                                                                    <Text style={styles.recoConfigKey}>Alpha Weight:</Text>
                                                                                    <Text style={[styles.recoConfigVal, { color: Colors.PRIMARY, fontWeight: "700" }]}>
                                                                                        {alpha.toFixed(3)} ({Math.round(alpha * 100)}% CBF / {Math.round((1 - alpha) * 100)}% CF)
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={styles.recoConfigItem}>
                                                                                    <Text style={styles.recoConfigKey}>Dynamic Alpha Formula:</Text>
                                                                                    <Text style={styles.recoConfigVal}>
                                                                                        1.0 - (0.5 * ({userCount} - 1) / 49) = {alpha.toFixed(3)}
                                                                                    </Text>
                                                                                </View>
                                                                            </View>

                                                                            {/* Two-Component Calculation Grid */}
                                                                            <View style={styles.recoCompGrid}>
                                                                                {/* CBF Box */}
                                                                                <View style={styles.recoCompBoxCbf}>
                                                                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                                                                        <Text style={styles.recoCompTitleCbf}>1. Content-Based (CBF)</Text>
                                                                                        <Text style={styles.recoCompWeightText}>{Math.round(alpha * 100)}% Weight</Text>
                                                                                    </View>

                                                                                    {/* Raw Metric Formula Display */}
                                                                                    <View style={styles.recoRawFormulaRow}>
                                                                                        <Text style={styles.recoRawFormulaLabel}>Raw Metric Formula ({cbfCode}):</Text>
                                                                                        <Text style={styles.recoRawFormulaCode}>{getRawCbfFormula(cbfCode)}</Text>
                                                                                    </View>

                                                                                    <Text style={styles.recoCompDesc}>
                                                                                        {getRawCbfExplanation(cbfCode)}
                                                                                    </Text>

                                                                                    {/* Individual Feature Comparison Table */}
                                                                                    {candidateFeats && targetAnchorFeats ? (
                                                                                        <View style={styles.recoFeatTable}>
                                                                                            <View style={styles.recoFeatHeaderRow}>
                                                                                                <Text style={[styles.recoFeatTh, { flex: 2 }]}>Key Feature</Text>
                                                                                                <Text style={[styles.recoFeatTh, { flex: 1.5, textAlign: "center" }]}>User Anchor</Text>
                                                                                                <Text style={[styles.recoFeatTh, { flex: 1.5, textAlign: "center" }]}>Trail Vector</Text>
                                                                                                <Text style={[styles.recoFeatTh, { flex: 1.2, textAlign: "right" }]}>|Diff|</Text>
                                                                                            </View>
                                                                                            {[
                                                                                                {
                                                                                                    label: "Length",
                                                                                                    anchor: targetAnchorFeats.length,
                                                                                                    trailVal: candidateFeats.length,
                                                                                                    rawTrail: candidateTrail?.difficulty?.length != null ? `${candidateTrail.difficulty.length} km` : undefined,
                                                                                                },
                                                                                                {
                                                                                                    label: "Elevation",
                                                                                                    anchor: targetAnchorFeats.elevation,
                                                                                                    trailVal: candidateFeats.elevation,
                                                                                                    rawTrail: candidateTrail?.difficulty?.elevation != null ? `${candidateTrail.difficulty.elevation} MASL` : undefined,
                                                                                                },
                                                                                                {
                                                                                                    label: "Gain",
                                                                                                    anchor: targetAnchorFeats.gain,
                                                                                                    trailVal: candidateFeats.gain,
                                                                                                    rawTrail: candidateTrail?.difficulty?.gain != null ? `+${candidateTrail.difficulty.gain} m` : undefined,
                                                                                                },
                                                                                                {
                                                                                                    label: "Slope",
                                                                                                    anchor: targetAnchorFeats.slope,
                                                                                                    trailVal: candidateFeats.slope,
                                                                                                    rawTrail: candidateTrail?.difficulty?.slope != null ? `${candidateTrail.difficulty.slope}%` : undefined,
                                                                                                },
                                                                                                {
                                                                                                    label: "Classification",
                                                                                                    anchor: targetAnchorFeats.classification,
                                                                                                    trailVal: candidateFeats.classification,
                                                                                                    rawTrail: candidateFeats.classification === 1 ? "Major" : "Minor",
                                                                                                },
                                                                                                {
                                                                                                    label: "Lasco / Easy",
                                                                                                    anchor: targetAnchorFeats.easy,
                                                                                                    trailVal: candidateFeats.easy,
                                                                                                },
                                                                                            ].map((fItem, fIdx) => {
                                                                                                const diff = Math.abs(fItem.anchor - fItem.trailVal);
                                                                                                const isClose = diff <= 0.08;
                                                                                                return (
                                                                                                    <View key={fIdx} style={styles.recoFeatRow}>
                                                                                                        <View style={{ flex: 2 }}>
                                                                                                            <Text style={styles.recoFeatTdName}>{fItem.label}</Text>
                                                                                                            {fItem.rawTrail && (
                                                                                                                <Text style={styles.recoFeatTdSub}>{fItem.rawTrail}</Text>
                                                                                                            )}
                                                                                                        </View>
                                                                                                        <Text style={[styles.recoFeatTdVal, { flex: 1.5, textAlign: "center", color: Palette.Green700 }]}>
                                                                                                            {fItem.anchor.toFixed(3)}
                                                                                                        </Text>
                                                                                                        <Text style={[styles.recoFeatTdVal, { flex: 1.5, textAlign: "center", color: Palette.Slate700 }]}>
                                                                                                            {fItem.trailVal.toFixed(3)}
                                                                                                        </Text>
                                                                                                        <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                                                                                                            <View style={[styles.recoFeatDiffBadge, { backgroundColor: isClose ? Palette.Green50 : Palette.Amber50, borderColor: isClose ? Palette.Green200 : Palette.Amber200 }]}>
                                                                                                                <Text style={[styles.recoFeatDiffText, { color: isClose ? Palette.Green800 : Palette.Amber800 }]}>
                                                                                                                    {diff.toFixed(3)}
                                                                                                                </Text>
                                                                                                            </View>
                                                                                                        </View>
                                                                                                    </View>
                                                                                                );
                                                                                            })}
                                                                                        </View>
                                                                                    ) : null}

                                                                                    <View style={styles.recoCompMathRow}>
                                                                                        <Text style={styles.recoCompMathLabel}>Aggregate Across All 28 Features:</Text>
                                                                                        <Text style={styles.recoCompMathVal}>{cbfValue.toFixed(4)}</Text>
                                                                                    </View>
                                                                                    <View style={styles.recoCompMathRow}>
                                                                                        <Text style={styles.recoCompMathLabel}>Weighted Term (alpha * Raw_CBF):</Text>
                                                                                        <Text style={[styles.recoCompMathVal, { color: Palette.Green800, fontWeight: "700" }]}>
                                                                                            {alpha.toFixed(2)} * {cbfValue.toFixed(4)} = {cbfWeighted.toFixed(4)}
                                                                                        </Text>
                                                                                    </View>
                                                                                </View>

                                                                                {/* CF Box */}
                                                                                <View style={styles.recoCompBoxCf}>
                                                                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                                                                        <Text style={styles.recoCompTitleCf}>2. Collaborative (CF)</Text>
                                                                                        <Text style={styles.recoCompWeightText}>{Math.round((1 - alpha) * 100)}% Weight</Text>
                                                                                    </View>

                                                                                    {/* Raw Metric Formula Display */}
                                                                                    <View style={styles.recoRawFormulaRow}>
                                                                                        <Text style={styles.recoRawFormulaLabel}>Raw Metric Formula ({cfCode}):</Text>
                                                                                        <Text style={styles.recoRawFormulaCode}>
                                                                                            dist = (1 / |Peers|) * sum( dist(User_A, Peer_B) * dist(Peer_B, Trail_T) )
                                                                                        </Text>
                                                                                    </View>

                                                                                    <Text style={styles.recoCompDesc}>
                                                                                        Evaluates similarity between this user and each peer hiker B who reviewed or completed trails, multiplied by the peer's affinity for Trail T.
                                                                                    </Text>

                                                                                    {cfValue === 0.0 ? (
                                                                                        <View style={styles.recoColdStartNotice}>
                                                                                            <CustomIcon library="Feather" name="info" size={13} color={Colors.PRIMARY} />
                                                                                            <Text style={styles.recoColdStartText}>
                                                                                                Cold-Start Active: 0 completed hike records on file for this user. Collaborative distance defaults to 0.0000, and dynamic alpha = 1.0 assigns 100% decision power to CBF feature matching.
                                                                                            </Text>
                                                                                        </View>
                                                                                    ) : (
                                                                                        <View style={styles.recoColdStartNotice}>
                                                                                            <CustomIcon library="Feather" name="check-circle" size={13} color={Palette.Green700} />
                                                                                            <Text style={[styles.recoColdStartText, { color: Palette.Green800 }]}>
                                                                                                Active Peer Collaborative History: Calculated across active peer hikers who reviewed or hiked trails in common.
                                                                                            </Text>
                                                                                        </View>
                                                                                    )}

                                                                                    <View style={styles.recoCompMathRow}>
                                                                                        <Text style={styles.recoCompMathLabel}>Raw CF Distance:</Text>
                                                                                        <Text style={styles.recoCompMathVal}>{cfValue.toFixed(4)}</Text>
                                                                                    </View>
                                                                                    <View style={styles.recoCompMathRow}>
                                                                                        <Text style={styles.recoCompMathLabel}>Weighted Term ((1 - alpha) * Raw_CF):</Text>
                                                                                        <Text style={[styles.recoCompMathVal, { color: Palette.Amber800, fontWeight: "700" }]}>
                                                                                            {(1.0 - alpha).toFixed(2)} * {cfValue.toFixed(4)} = {cfWeighted.toFixed(4)}
                                                                                        </Text>
                                                                                    </View>
                                                                                </View>
                                                                            </View>

                                                                            {/* Synthesis Summary */}
                                                                            <View style={styles.recoSynthesisBox}>
                                                                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                                                                                    <Text style={styles.recoSynthesisLabel}>
                                                                                        Final Blended Recommendation Score (R_tu):
                                                                                    </Text>
                                                                                    <Text style={styles.recoSynthesisFormula}>
                                                                                        {cbfWeighted.toFixed(4)} (CBF) + {cfWeighted.toFixed(4)} (CF) = {trail.score.toFixed(4)}
                                                                                    </Text>
                                                                                </View>
                                                                                <Text style={styles.recoSynthesisDesc}>
                                                                                    Calculation: ({alpha.toFixed(2)} * {cbfValue.toFixed(4)}) + ({(1.0 - alpha).toFixed(2)} * {cfValue.toFixed(4)}) = {cbfWeighted.toFixed(4)} + {cfWeighted.toFixed(4)} = {trail.score.toFixed(4)}.
                                                                                    {"\n"}Range is [0.000, 1.000], where 0.000 represents the closest mathematical match to the user's hiking profile.
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                )}
                                            </View>
                                        )}
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
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        paddingHorizontal: 6,
    },
    thSubCenter: {
        fontSize: 12,
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
        fontSize: 12,
        color: Palette.Neutral400,
        textAlign: "center",
    },
    nameCell: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    subUserText: {
        fontSize: 12,
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
        fontSize: 12,
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
        fontSize: 12,
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
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Red700,
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
    recosActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 5,
    },
    recosActionBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    // Embedded Recommendations Styles
    modalSubNav: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Slate100,
        padding: 4,
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 8,
        gap: 6,
    },
    modalNavTab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    modalNavTabActive: {
        backgroundColor: Colors.WHITE,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    modalNavTabText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    modalNavTabTextActive: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    modalNavBadge: {
        backgroundColor: Palette.Green100,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    modalNavBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
    },
    viewRecoHintText: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: "600",
    },
    recoSection: {
        gap: 12,
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
    },
    recoSectionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
    },
    recoSectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    recoMonthBadge: {
        backgroundColor: Palette.Green100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recoMonthBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
    },
    recoMetaSubText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    recoRefreshBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recoRefreshBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    recoControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
    },
    recoCategoryPills: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderRadius: 6,
        padding: 3,
        gap: 4,
    },
    recoPill: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    recoPillActive: {
        backgroundColor: Colors.WHITE,
    },
    recoPillActiveEasy: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green300,
    },
    recoPillActiveDiff: {
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber300,
    },
    recoPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    recoPillTextActive: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: "700",
    },
    recoPillTextActiveEasy: {
        color: Palette.Green800,
        fontWeight: "700",
    },
    recoPillTextActiveDiff: {
        color: Palette.Amber800,
        fontWeight: "700",
    },
    recoSearchRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
    },
    recoSearchInput: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },
    recoCenterBox: {
        padding: 30,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    recoLoadingText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    recoErrorBox: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Palette.Red50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Red200,
        gap: 6,
    },
    recoErrorTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Palette.Red800,
        marginTop: 4,
    },
    recoErrorDesc: {
        fontSize: 12,
        color: Palette.Red700,
        textAlign: "center",
        fontFamily: "monospace",
    },
    recoErrorHint: {
        fontSize: 12,
        color: Palette.Red900,
        textAlign: "center",
        marginTop: 4,
        fontWeight: "600",
    },
    recoEmptyBox: {
        padding: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Palette.Slate50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 6,
    },
    recoEmptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
    },
    recoEmptyDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
    recoRunNowBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 6,
    },
    recoRunNowText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    recoGrid: {
        gap: 8,
    },
    recoCard: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        padding: 10,
        gap: 8,
    },
    recoCardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    recoRankBox: {
        backgroundColor: Palette.Slate100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recoRankNum: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    recoTrailTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    recoTrailIdText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    recoCategoryTag: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    tagEasy: {
        backgroundColor: Palette.Green100,
    },
    tagDiff: {
        backgroundColor: Palette.Amber100,
    },
    recoCategoryTagText: {
        fontSize: 12,
        fontWeight: "700",
    },
    tagTextEasy: {
        color: Palette.Green800,
    },
    tagTextDiff: {
        color: Palette.Amber800,
    },
    recoCardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate100,
        flexWrap: "wrap",
        gap: 6,
    },
    recoScoreBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recoScoreText: {
        fontSize: 12,
        fontWeight: "700",
        fontFamily: "monospace",
    },
    recoQualityChip: {
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    recoQualityChipText: {
        fontSize: 12,
        fontWeight: "700",
    },
    recoHikeTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    tagHiked: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    tagUnhiked: {
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    recoHikeTagText: {
        fontSize: 12,
        fontWeight: "600",
    },
    tagHikedText: {
        color: Palette.Green800,
    },
    tagUnhikedText: {
        color: Palette.Slate600,
    },
    recoCardExpanded: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Palette.Slate50,
    },
    recoCardClickable: {
        gap: 8,
    },
    recoExpandHint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: Palette.Slate100,
    },
    recoExpandHintText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    recoBreakdownCard: {
        marginTop: 6,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
        gap: 8,
    },
    recoBreakdownTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    recoBreakdownHeading: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    recoFormulaCode: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
        fontFamily: "monospace",
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    recoConfigStrip: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        backgroundColor: Colors.WHITE,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 8,
    },
    recoConfigItem: {
        gap: 2,
    },
    recoConfigKey: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    recoConfigVal: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    recoCompGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    recoCompBoxCbf: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Green200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
    },
    recoCompBoxCf: {
        flex: 1,
        minWidth: 260,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Amber200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
    },
    recoCompTitleCbf: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green800,
        textTransform: "uppercase",
    },
    recoCompTitleCf: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber800,
        textTransform: "uppercase",
    },
    recoCompWeightText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    recoCompDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        marginVertical: 2,
    },
    recoCompMathRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: Palette.Slate100,
        paddingTop: 4,
        marginTop: 2,
    },
    recoCompMathLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    recoCompMathVal: {
        fontSize: 12,
        fontFamily: "monospace",
        color: Colors.TEXT_PRIMARY,
    },
    recoSynthesisBox: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 8,
        padding: 10,
        gap: 4,
    },
    recoSynthesisLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    recoSynthesisFormula: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
        fontFamily: "monospace",
    },
    recoSynthesisDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    recoRawFormulaRow: {
        backgroundColor: Palette.Slate50,
        padding: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        marginVertical: 4,
        gap: 2,
    },
    recoRawFormulaLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    recoRawFormulaCode: {
        fontSize: 12,
        fontWeight: "700",
        fontFamily: "monospace",
        color: Colors.PRIMARY,
    },
    recoFeatTable: {
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        overflow: "hidden",
        marginTop: 6,
        marginBottom: 6,
        backgroundColor: Colors.WHITE,
    },
    recoFeatHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        alignItems: "center",
    },
    recoFeatTh: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    recoFeatRow: {
        flexDirection: "row",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate100,
        alignItems: "center",
    },
    recoFeatTdName: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    recoFeatTdSub: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    recoFeatTdVal: {
        fontSize: 12,
        fontFamily: "monospace",
        fontWeight: "600",
    },
    recoFeatDiffBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        borderWidth: 1,
    },
    recoFeatDiffText: {
        fontSize: 12,
        fontWeight: "700",
        fontFamily: "monospace",
    },
    recoColdStartNotice: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 6,
        padding: 6,
        marginVertical: 4,
    },
    recoColdStartText: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
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
        maxHeight: "92%",
        width: "100%",
        maxWidth: 960,
        alignSelf: "center",
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
        fontSize: 12,
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
        fontSize: 12,
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
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    calcTd: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    tapInstructionText: {
        fontSize: 12,
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
        fontSize: 12,
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
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Red700,
    },
    breakdownSection: {
        gap: 2,
    },
    breakdownLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
    },
    breakdownValue: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
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
        fontSize: 12,
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
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Amber700,
        textTransform: "uppercase",
    },
    breakdownFormulaText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontFamily: "monospace",
        lineHeight: 16,
    },
    breakdownResultEasy: {
        fontSize: 12,
        fontWeight: "700",
        color: Palette.Green700,
        marginTop: 2,
    },
    breakdownResultDiff: {
        fontSize: 12,
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
