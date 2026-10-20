import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { User } from "@/src/core/models/User/User";
import { formatDate } from "@/src/core/utility/date";
import MetricCard from "@/src/features/SuperAdmin/components/MetricCard";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
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

type SubViewType = "hike" | "review";

function isUserInProvince(user: User, provinceName: string): number {
    const provinces = user.preferences?.province;
    if (!provinces || !Array.isArray(provinces)) return 0;
    return provinces.some(
        (p) => typeof p === "string" && p.trim().toLowerCase().includes(provinceName.toLowerCase())
    ) ? 1 : 0;
}

function formatHikeDistance(dist?: number): string {
    if (!dist || dist <= 0) return "-";
    if (dist >= 1000) {
        return `${(dist / 1000).toFixed(2)} km`;
    }
    return `${Math.round(dist)} m`;
}

function formatHikeDuration(duration?: number): string {
    if (!duration || duration <= 0) return "-";
    const totalSecs = duration > 100000 ? Math.round(duration / 1000) : Math.round(duration);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

function formatHikeElevation(elev?: number): string {
    if (!elev || elev <= 0) return "-";
    return `${Math.round(elev)} m`;
}

function formatHikeDate(date?: unknown): string {
    if (!date) return "-";
    return formatDate(date, "short");
}

function formatRating(rating?: number): string {
    if (typeof rating !== "number" || rating <= 0) return "0.0";
    return rating.toFixed(1);
}

function getStatusBadge(status?: string) {
    const s = status?.toLowerCase();
    switch (s) {
        case "completed":
            return {
                bg: Palette.Green50,
                border: Palette.Green200,
                text: Palette.Green700,
            };
        case "started":
            return {
                bg: Palette.Blue50,
                border: Palette.Blue600,
                text: Palette.Blue600,
            };
        case "paused":
            return {
                bg: Palette.Amber500,
                border: Palette.Amber500,
                text: Palette.Amber500,
            };
        case "unhiked":
        default:
            return {
                bg: Palette.Slate100,
                border: Palette.Slate200,
                text: Colors.TEXT_SECONDARY,
            };
    }
}

function getDifficultyBadge(diff?: string) {
    const d = diff?.toLowerCase();
    switch (d) {
        case "easy":
            return {
                bg: Palette.Green50,
                border: Palette.Green200,
                text: Palette.Green700,
            };
        case "just right":
            return {
                bg: Palette.Blue50,
                border: Palette.Blue100,
                text: Palette.Blue600,
            };
        case "moderate":
            return {
                bg: Palette.Yellow50,
                border: Palette.Amber100,
                text: Palette.Amber500,
            };
        case "hard":
            return {
                bg: Palette.Orange50,
                border: Palette.Amber100,
                text: Palette.Orange800,
            };
        case "extreme":
            return {
                bg: Palette.Red50,
                border: Palette.Red100,
                text: Palette.Red700,
            };
        default:
            return {
                bg: Palette.Slate100,
                border: Palette.Slate200,
                text: Colors.TEXT_SECONDARY,
            };
    }
}

export interface UserDatasetProps {
    users?: User[];
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
    hikes,
    hikesByUser,
    reviews,
    reviewsByUser,
    isLoading = false,
    error = null,
    refresh,
}: UserDatasetProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<"all" | "hiked" | "not_hiked" | "with_prefs">("all");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());

    // Track active sub-view ("hike" | "review") per user row
    const [userSubViews, setUserSubViews] = useState<Record<string, SubViewType>>({});

    // Fallback to recommendation stores if not provided directly via props
    const storeHikes = useRecommendationHikeStore((s) => s.data);
    const effectiveHikes = hikes ?? storeHikes;

    const storeReviews = useRecommendationReviewStore((s) => s.data);
    const effectiveReviews = reviews ?? storeReviews;

    // Index hikes by user ID for instant O(1) row access
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

    // Index reviews by user ID for instant O(1) row access
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

    const toggleUserExpanded = (userId: string) => {
        if (!userId) return;
        setExpandedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const selectSubView = (userId: string, subView: SubViewType) => {
        setUserSubViews((prev) => ({ ...prev, [userId]: subView }));
    };

    // Filtered users based on search (including matching trails in their recorded hikes and reviews)
    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return users.filter((u) => {
            const fullName = `${u.firstname || ""} ${u.lastname || ""}`.trim();
            const userHikes = computedHikesByUser[u.id] || [];
            const userReviews = computedReviewsByUser[u.id] || [];

            const matchesSearch =
                !query ||
                fullName.toLowerCase().includes(query) ||
                u.username?.toLowerCase().includes(query) ||
                u.preferences?.experience?.toLowerCase().includes(query) ||
                u.preferences?.location?.some((l) => l.toLowerCase().includes(query)) ||
                u.preferences?.province?.some((p) => p.toLowerCase().includes(query)) ||
                u.id?.toLowerCase().includes(query) ||
                userHikes.some(
                    (h) =>
                        h.trail?.name?.toLowerCase().includes(query) ||
                        h.trail?.location?.toLowerCase().includes(query)
                ) ||
                userReviews.some(
                    (r) =>
                        r.trail?.name?.toLowerCase().includes(query) ||
                        r.trail?.location?.toLowerCase().includes(query) ||
                        r.review?.toLowerCase().includes(query)
                );

            if (!matchesSearch) return false;

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
    }, [users, searchQuery, selectedFilter, computedHikesByUser, computedReviewsByUser]);

    // Quick preference metrics
    const stats = useMemo(() => {
        const total = users.length;
        const hiked = users.filter((u) => u.preferences?.hiked === true).length;
        const notHiked = users.filter((u) => u.preferences?.hiked === false).length;
        const withPrefs = users.filter(
            (u) =>
                !!u.preferences?.experience ||
                (u.preferences?.province && u.preferences.province.length > 0) ||
                (u.preferences?.location && u.preferences.location.length > 0)
        ).length;
        const totalHikes = effectiveHikes.length;
        const totalReviews = effectiveReviews.length;
        return { total, hiked, notHiked, withPrefs, totalHikes, totalReviews };
    }, [users, effectiveHikes, effectiveReviews]);

    return (
        <View style={styles.container}>
            {/* User Preferences & Hike Metric Cards */}
            <MetricCard
                metrics={[
                    {
                        title: "Total Users",
                        count: stats.total,
                        icon: "users",
                        library: "Feather",
                        color: Colors.PRIMARY,
                    },
                    {
                        title: "Has Preferences",
                        count: stats.withPrefs,
                        icon: "sliders",
                        library: "Feather",
                        color: Colors.PRIMARY,
                    },
                    {
                        title: "Total User Hikes",
                        count: stats.totalHikes,
                        icon: "compass",
                        library: "Feather",
                        color: Palette.Blue600,
                    },
                    {
                        title: "Hiked Before",
                        count: stats.hiked,
                        icon: "check-circle",
                        library: "Feather",
                        color: Palette.Amber500,
                    },
                ]}
            />

            {/* Search and Preference Filters */}
            <View style={styles.controlsRow}>
                <View style={styles.searchBar}>
                    <CustomIcon library="Feather" name="search" size={16} color={Colors.GRAY_MEDIUM} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, experience, location, province, or trail..."
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
                    {(["all", "hiked", "not_hiked", "with_prefs"] as const).map((filter) => {
                        const isSelected = selectedFilter === filter;
                        const label =
                            filter === "all"
                                ? "ALL"
                                : filter === "hiked"
                                    ? "HIKED (YES)"
                                    : filter === "not_hiked"
                                        ? "HIKED (NO)"
                                        : "HAS PREFERENCES";
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                                onPress={() => setSelectedFilter(filter)}
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

            {/* Tabular Preferences & Hikes Data Grid */}
            <ScrollView
                style={styles.verticalScroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={refresh ? <RefreshControl refreshing={isLoading} onRefresh={refresh} /> : undefined}
            >
                {isLoading && users.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.PRIMARY} />
                        <Text style={styles.loadingText}>Fetching users and hike records from repository...</Text>
                    </View>
                ) : filteredUsers.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <CustomIcon library="Feather" name="user-x" size={42} color={Colors.GRAY_MEDIUM} />
                        <Text style={styles.emptyTitle}>No users found</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery ? "Try refining your search filter" : "No user documents exist in the repository"}
                        </Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.th, styles.colIndex]}>#</Text>
                                <Text style={[styles.th, styles.colName]}>User</Text>
                                <Text style={[styles.th, styles.colExp]}>Experience</Text>
                                <Text style={[styles.th, styles.colLength]}>Hike Length</Text>
                                <Text style={[styles.th, styles.colHiked]}>Hiked</Text>
                                <Text style={[styles.th, styles.colLocation]}>Location</Text>
                                {PROVINCES.map((prov) => (
                                    <Text key={prov} style={[styles.th, styles.colProvince]}>
                                        {prov}
                                    </Text>
                                ))}
                                <Text style={[styles.th, styles.colHikesCount]}>Hikes</Text>
                                <Text style={[styles.th, styles.colReviewsCount]}>Reviews</Text>
                                <Text style={[styles.th, styles.colAction]}>Action</Text>
                            </View>

                            {/* Table Body */}
                            {filteredUsers.map((user, index) => {
                                const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim() || "Unnamed User";
                                const hasHiked = user.preferences?.hiked;
                                const isEven = index % 2 === 0;
                                const isExpanded = expandedUserIds.has(user.id);
                                const userHikes = computedHikesByUser[user.id] || [];
                                const userReviews = computedReviewsByUser[user.id] || [];
                                const currentSubView = userSubViews[user.id] || "hike";

                                return (
                                    <React.Fragment key={user.id || index}>
                                        {/* Clickable User Row */}
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => toggleUserExpanded(user.id)}
                                            style={[
                                                styles.tableRow,
                                                isEven ? styles.rowEven : styles.rowOdd,
                                                isExpanded && styles.rowExpanded,
                                            ]}
                                        >
                                            <View style={[styles.td, styles.colIndex, styles.centerCell, { flexDirection: "row", gap: 3 }]}>
                                                <Text style={styles.textMuted}>{index + 1}</Text>
                                                <CustomIcon
                                                    library="Feather"
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={12}
                                                    color={isExpanded ? Colors.PRIMARY : Colors.GRAY_MEDIUM}
                                                />
                                            </View>
                                            <View style={[styles.td, styles.colName]}>
                                                <Text style={styles.nameCell} numberOfLines={1}>
                                                    {fullName}
                                                </Text>
                                                <Text style={styles.subUserText} numberOfLines={1}>
                                                    @{user.username || user.id.slice(0, 8)}
                                                </Text>
                                            </View>
                                            <View style={[styles.td, styles.colExp, styles.centerCell]}>
                                                <View style={styles.expBadge}>
                                                    <Text style={styles.expBadgeText}>
                                                        {user.preferences?.experience || "-"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.td, styles.colLength]} numberOfLines={1}>
                                                {user.preferences?.hike_length?.length
                                                    ? user.preferences.hike_length.join(", ")
                                                    : "-"}
                                            </Text>
                                            <View style={[styles.td, styles.colHiked, styles.centerCell]}>
                                                <Text
                                                    style={[
                                                        styles.hikedText,
                                                        hasHiked ? styles.hikedYes : styles.hikedNo,
                                                    ]}
                                                >
                                                    {hasHiked ? "Yes" : "No"}
                                                </Text>
                                            </View>
                                            <Text style={[styles.td, styles.colLocation]} numberOfLines={1}>
                                                {user.preferences?.location?.length
                                                    ? `[ ${user.preferences.location.join(", ")} ]`
                                                    : "[]"}
                                            </Text>
                                            {PROVINCES.map((prov) => {
                                                const isPresent = isUserInProvince(user, prov) === 1;
                                                return (
                                                    <Text
                                                        key={prov}
                                                        style={[
                                                            styles.td,
                                                            styles.colProvince,
                                                            styles.centerText,
                                                            isPresent ? styles.provincePresent : styles.provinceAbsent,
                                                        ]}
                                                    >
                                                        {isPresent ? "1" : "0"}
                                                    </Text>
                                                );
                                            })}
                                            <View style={[styles.td, styles.colHikesCount, styles.centerCell]}>
                                                <View style={[styles.hikesCountPill, userHikes.length > 0 && styles.hikesCountPillActive]}>
                                                    <CustomIcon
                                                        library="Feather"
                                                        name="compass"
                                                        size={11}
                                                        color={userHikes.length > 0 ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                                    />
                                                    <Text style={[styles.hikesCountPillText, userHikes.length > 0 && styles.hikesCountPillTextActive]}>
                                                        {userHikes.length}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.td, styles.colReviewsCount, styles.centerCell]}>
                                                <View style={[styles.reviewsCountPill, userReviews.length > 0 && styles.reviewsCountPillActive]}>
                                                    <CustomIcon
                                                        library="Feather"
                                                        name="star"
                                                        size={11}
                                                        color={userReviews.length > 0 ? Palette.Amber500 : Colors.TEXT_SECONDARY}
                                                    />
                                                    <Text style={[styles.reviewsCountPillText, userReviews.length > 0 && styles.reviewsCountPillTextActive]}>
                                                        {userReviews.length}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.td, styles.colAction, styles.centerCell]}>
                                                <TouchableOpacity
                                                    style={styles.detailButton}
                                                    onPress={(e) => {
                                                        e.stopPropagation?.();
                                                        setSelectedUser(user);
                                                    }}
                                                >
                                                    <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                                                    <Text style={styles.detailButtonText}>View</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Expanded User Sub-Dataset View */}
                                        {isExpanded && (
                                            <View style={styles.expandedContainer}>
                                                {/* Expanded Header Bar with Selector in the Leftmost */}
                                                <View style={styles.expandedHeader}>
                                                    {/* Leftmost: Selector Controls */}
                                                    <View style={styles.expandedHeaderLeft}>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.subViewBtn,
                                                                currentSubView === "hike" ? styles.subViewBtnActiveHike : styles.subViewBtnInactive,
                                                            ]}
                                                            onPress={(e) => {
                                                                e.stopPropagation?.();
                                                                selectSubView(user.id, "hike");
                                                            }}
                                                        >
                                                            <CustomIcon
                                                                library="Feather"
                                                                name="compass"
                                                                size={12}
                                                                color={currentSubView === "hike" ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                                            />
                                                            <Text
                                                                style={[
                                                                    styles.subViewBtnText,
                                                                    currentSubView === "hike" && styles.subViewBtnTextActiveHike,
                                                                ]}
                                                            >
                                                                Hike ({userHikes.length})
                                                            </Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[
                                                                styles.subViewBtn,
                                                                currentSubView === "review" ? styles.subViewBtnActiveReview : styles.subViewBtnInactive,
                                                            ]}
                                                            onPress={(e) => {
                                                                e.stopPropagation?.();
                                                                selectSubView(user.id, "review");
                                                            }}
                                                        >
                                                            <CustomIcon
                                                                library="Feather"
                                                                name="star"
                                                                size={12}
                                                                color={currentSubView === "review" ? Palette.Amber500 : Colors.TEXT_SECONDARY}
                                                            />
                                                            <Text
                                                                style={[
                                                                    styles.subViewBtnText,
                                                                    currentSubView === "review" && styles.subViewBtnTextActiveReview,
                                                                ]}
                                                            >
                                                                Review ({userReviews.length})
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    {/* Rightmost: User Name & Collapse Hint */}
                                                    <View style={styles.expandedHeaderRight}>
                                                        <Text style={styles.expandedUserNameTag}>
                                                            {fullName} <Text style={styles.expandedUserTag}>@{user.username || user.id.slice(0, 8)}</Text>
                                                        </Text>
                                                        <Text style={styles.collapseHint}>Tap row to collapse</Text>
                                                    </View>
                                                </View>

                                                {/* Content Table: Hike vs Review */}
                                                {currentSubView === "hike" ? (
                                                    userHikes.length === 0 ? (
                                                        <View style={styles.hikesEmptyState}>
                                                            <CustomIcon library="Feather" name="inbox" size={24} color={Colors.GRAY_MEDIUM} />
                                                            <View style={{ gap: 2 }}>
                                                                <Text style={styles.hikesEmptyTitle}>No recorded hike sessions</Text>
                                                                <Text style={styles.hikesEmptySubtitle}>
                                                                    This user has not yet recorded or completed any hikes in Firestore.
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.hikeTable}>
                                                            {/* Hike Sub-Table Header */}
                                                            <View style={styles.hikeTableHeaderRow}>
                                                                <Text style={[styles.hikeTh, styles.hikeColIndex]}>#</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColTrail]}>Trail / Location</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColDate]}>Hike Date</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColStatus]}>Status</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColMode]}>Mode</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColMetric]}>Distance</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColMetric]}>Duration</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColMetric]}>Elevation Gain</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColBooking]}>Booking ID</Text>
                                                                <Text style={[styles.hikeTh, styles.hikeColHikeId]}>Hike ID</Text>
                                                            </View>

                                                            {/* Hike Sub-Table Body */}
                                                            {userHikes.map((hike, hIndex) => {
                                                                const statusBadge = getStatusBadge(hike.status);
                                                                return (
                                                                    <View
                                                                        key={hike.id || hIndex}
                                                                        style={[
                                                                            styles.hikeTableRow,
                                                                            hIndex % 2 === 0 ? styles.hikeRowEven : styles.hikeRowOdd,
                                                                        ]}
                                                                    >
                                                                        <Text style={[styles.hikeTd, styles.hikeColIndex, styles.textMuted]}>
                                                                            {hIndex + 1}
                                                                        </Text>
                                                                        <View style={[styles.hikeTd, styles.hikeColTrail]}>
                                                                            <Text style={styles.hikeTrailName} numberOfLines={1}>
                                                                                {hike.trail?.name || "DIY Hike / Custom Route"}
                                                                            </Text>
                                                                            <Text style={styles.hikeTrailLocation} numberOfLines={1}>
                                                                                {hike.trail?.location || "-"}
                                                                            </Text>
                                                                        </View>
                                                                        <Text style={[styles.hikeTd, styles.hikeColDate]}>
                                                                            {formatHikeDate(hike.hikeDate || hike.startTime || hike.createdAt)}
                                                                        </Text>
                                                                        <View style={[styles.hikeTd, styles.hikeColStatus, styles.centerCell]}>
                                                                            <View
                                                                                style={[
                                                                                    styles.hikeStatusBadge,
                                                                                    {
                                                                                        backgroundColor: statusBadge.bg,
                                                                                        borderColor: statusBadge.border,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Text style={[styles.hikeStatusText, { color: statusBadge.text }]}>
                                                                                    {hike.status || "unhiked"}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={[styles.hikeTd, styles.hikeColMode, styles.centerCell]}>
                                                                            <Text style={styles.hikeModeText}>
                                                                                {hike.mode || "direct"}
                                                                            </Text>
                                                                        </View>
                                                                        <Text style={[styles.hikeTd, styles.hikeColMetric, styles.rightText]}>
                                                                            {formatHikeDistance(hike.distance)}
                                                                        </Text>
                                                                        <Text style={[styles.hikeTd, styles.hikeColMetric, styles.rightText]}>
                                                                            {formatHikeDuration(hike.duration)}
                                                                        </Text>
                                                                        <Text style={[styles.hikeTd, styles.hikeColMetric, styles.rightText]}>
                                                                            {formatHikeElevation(hike.elevation)}
                                                                        </Text>
                                                                        <Text style={[styles.hikeTd, styles.hikeColBooking, styles.monoText]} numberOfLines={1}>
                                                                            {hike.bookingId || "-"}
                                                                        </Text>
                                                                        <Text style={[styles.hikeTd, styles.hikeColHikeId, styles.monoText]} numberOfLines={1}>
                                                                            {hike.id ? `#${hike.id.slice(0, 8)}` : "-"}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    )
                                                ) : (
                                                    userReviews.length === 0 ? (
                                                        <View style={styles.hikesEmptyState}>
                                                            <CustomIcon library="Feather" name="message-square" size={24} color={Colors.GRAY_MEDIUM} />
                                                            <View style={{ gap: 2 }}>
                                                                <Text style={styles.hikesEmptyTitle}>No recorded reviews</Text>
                                                                <Text style={styles.hikesEmptySubtitle}>
                                                                    This user has not yet submitted any trail reviews or ratings in Firestore.
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.reviewTable}>
                                                            {/* Review Sub-Table Header */}
                                                            <View style={styles.reviewTableHeaderRow}>
                                                                <Text style={[styles.reviewTh, styles.reviewColIndex]}>#</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColTrail]}>Trail / Location</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColRating]}>Overall Rating</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColText]}>Review Feedback</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColPerceived]}>Perceived Diff.</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColMaintenance]}>Maintenance</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColPredicted]}>Predicted Diff.</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColMetric]}>Distance</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColMetric]}>Duration</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColMetric]}>Elevation Gain</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColLikes]}>Likes</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColDate]}>Hike Date</Text>
                                                                <Text style={[styles.reviewTh, styles.reviewColId]}>Review ID</Text>
                                                            </View>

                                                            {/* Review Sub-Table Body */}
                                                            {userReviews.map((rev, rIndex) => {
                                                                const percBadge = getDifficultyBadge(rev.perceivedDifficulty);
                                                                const maintBadge = getDifficultyBadge(rev.trailMaintenance);
                                                                const predBadge = getDifficultyBadge(rev.predictedDifficulty);

                                                                return (
                                                                    <View
                                                                        key={rev.id || rIndex}
                                                                        style={[
                                                                            styles.reviewTableRow,
                                                                            rIndex % 2 === 0 ? styles.reviewRowEven : styles.reviewRowOdd,
                                                                        ]}
                                                                    >
                                                                        <Text style={[styles.reviewTd, styles.reviewColIndex, styles.textMuted]}>
                                                                            {rIndex + 1}
                                                                        </Text>
                                                                        <View style={[styles.reviewTd, styles.reviewColTrail]}>
                                                                            <Text style={styles.hikeTrailName} numberOfLines={1}>
                                                                                {rev.trail?.name || "Unnamed Trail"}
                                                                            </Text>
                                                                            <Text style={styles.hikeTrailLocation} numberOfLines={1}>
                                                                                {rev.trail?.location || "-"}
                                                                            </Text>
                                                                        </View>
                                                                        <View style={[styles.reviewTd, styles.reviewColRating, styles.centerCell]}>
                                                                            <View style={styles.ratingBadge}>
                                                                                <CustomIcon library="Feather" name="star" size={11} color={Palette.Amber500} />
                                                                                <Text style={styles.ratingBadgeText}>
                                                                                    {formatRating(rev.overallRating)} / 5
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={[styles.reviewTd, styles.reviewColText]}>
                                                                            <Text style={styles.reviewFeedbackText} numberOfLines={2}>
                                                                                {rev.review ? `"${rev.review}"` : <Text style={styles.noReviewText}>No written review</Text>}
                                                                            </Text>
                                                                        </View>
                                                                        <View style={[styles.reviewTd, styles.reviewColPerceived, styles.centerCell]}>
                                                                            <View
                                                                                style={[
                                                                                    styles.diffBadge,
                                                                                    {
                                                                                        backgroundColor: percBadge.bg,
                                                                                        borderColor: percBadge.border,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Text style={[styles.diffBadgeText, { color: percBadge.text }]}>
                                                                                    {rev.perceivedDifficulty || "undefined"}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={[styles.reviewTd, styles.reviewColMaintenance, styles.centerCell]}>
                                                                            <View
                                                                                style={[
                                                                                    styles.diffBadge,
                                                                                    {
                                                                                        backgroundColor: maintBadge.bg,
                                                                                        borderColor: maintBadge.border,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Text style={[styles.diffBadgeText, { color: maintBadge.text }]}>
                                                                                    {rev.trailMaintenance || "undefined"}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={[styles.reviewTd, styles.reviewColPredicted, styles.centerCell]}>
                                                                            <View
                                                                                style={[
                                                                                    styles.diffBadge,
                                                                                    {
                                                                                        backgroundColor: predBadge.bg,
                                                                                        borderColor: predBadge.border,
                                                                                    },
                                                                                ]}
                                                                            >
                                                                                <Text style={[styles.diffBadgeText, { color: predBadge.text }]}>
                                                                                    {rev.predictedDifficulty || "undefined"}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                        <Text style={[styles.reviewTd, styles.reviewColMetric, styles.rightText]}>
                                                                            {formatHikeDistance(rev.distance)}
                                                                        </Text>
                                                                        <Text style={[styles.reviewTd, styles.reviewColMetric, styles.rightText]}>
                                                                            {formatHikeDuration(rev.duration)}
                                                                        </Text>
                                                                        <Text style={[styles.reviewTd, styles.reviewColMetric, styles.rightText]}>
                                                                            {formatHikeElevation(rev.elevation)}
                                                                        </Text>
                                                                        <View style={[styles.reviewTd, styles.reviewColLikes, styles.centerCell]}>
                                                                            <View style={styles.likesPill}>
                                                                                <CustomIcon library="Feather" name="heart" size={10} color={Palette.Red500} />
                                                                                <Text style={styles.likesPillText}>
                                                                                    {Array.isArray(rev.likes) ? rev.likes.length : 0}
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                        <Text style={[styles.reviewTd, styles.reviewColDate]}>
                                                                            {formatHikeDate(rev.hikeDate || rev.createdAt)}
                                                                        </Text>
                                                                        <Text style={[styles.reviewTd, styles.reviewColId, styles.monoText]} numberOfLines={1}>
                                                                            {rev.id ? `#${rev.id.slice(0, 8)}` : "-"}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    )
                                                )}
                                            </View>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}
            </ScrollView>

            {/* User Preferences Detail Modal */}
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
                                    {`${selectedUser?.firstname || ""} ${selectedUser?.lastname || ""}`.trim() || "User Preferences"}
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
                            {selectedUser && (
                                <View style={styles.detailSection}>
                                    <Text style={styles.detailSectionTitle}>Hiking Preferences</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Experience:</Text>
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
                                        <Text style={styles.detailKey}>Hike Length:</Text>
                                        <Text style={styles.detailVal}>
                                            {selectedUser.preferences?.hike_length?.length
                                                ? `[ ${selectedUser.preferences.hike_length.join(", ")} ]`
                                                : "[]"}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Location (Array):</Text>
                                        <Text style={styles.detailVal}>
                                            {selectedUser.preferences?.location?.length
                                                ? `[ ${selectedUser.preferences.location.join(", ")} ]`
                                                : "[]"}
                                        </Text>
                                    </View>

                                    <Text style={[styles.detailSectionTitle, { marginTop: 16 }]}>
                                        Provinces (CALABARZON)
                                    </Text>
                                    {PROVINCES.map((prov) => {
                                        const isPresent = isUserInProvince(selectedUser, prov) === 1;
                                        return (
                                            <View key={prov} style={styles.detailRow}>
                                                <Text style={styles.detailKey}>{prov}:</Text>
                                                <Text
                                                    style={[
                                                        styles.detailVal,
                                                        isPresent ? styles.provincePresent : styles.provinceAbsent,
                                                    ]}
                                                >
                                                    {isPresent ? "1 (Preferred)" : "0 (Not selected)"}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Aliases for convenient importing
export { UserDataset as UserSection, UserDataset as UserTable };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
    },
    controlsRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Slate100,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        paddingVertical: 0,
    },
    filterTabs: {
        flexDirection: "row",
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
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
        borderColor: Palette.Red100,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: Palette.Red700,
    },
    retryBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: Palette.Red700,
        borderRadius: 4,
    },
    retryText: {
        color: Colors.WHITE,
        fontSize: 11,
        fontWeight: "600",
    },
    verticalScroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    tableScroll: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
    },
    table: {
        minWidth: 1420,
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingVertical: 12,
        alignItems: "center",
    },
    th: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 10,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        paddingVertical: 11,
        alignItems: "center",
    },
    rowEven: {
        backgroundColor: Colors.WHITE,
    },
    rowOdd: {
        backgroundColor: Palette.Slate50,
    },
    rowExpanded: {
        backgroundColor: Palette.Green50,
        borderBottomColor: Palette.Green200,
    },
    td: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        paddingHorizontal: 10,
    },
    nameCell: {
        fontWeight: "600",
        color: Colors.PRIMARY,
        fontSize: 12,
    },
    subUserText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },
    textMuted: {
        color: Colors.TEXT_SECONDARY,
    },
    rightText: {
        textAlign: "right",
    },
    monoText: {
        fontFamily: "monospace",
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    hikedText: {
        fontSize: 12,
        fontWeight: "600",
    },
    hikedYes: {
        color: Palette.Blue600,
    },
    hikedNo: {
        color: Palette.Neutral500,
    },
    expBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    expBadgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
        textTransform: "capitalize",
    },
    centerCell: {
        alignItems: "center",
        justifyContent: "center",
    },
    centerText: {
        textAlign: "center",
    },

    // Main Table Column Widths
    colIndex: { width: 55, textAlign: "center" },
    colName: { width: 170 },
    colExp: { width: 120 },
    colLength: { width: 140 },
    colHiked: { width: 85, textAlign: "center" },
    colLocation: { width: 220 },
    colProvince: { width: 85, textAlign: "center" },
    provincePresent: {
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    provinceAbsent: {
        color: Palette.Neutral400,
    },
    colHikesCount: { width: 80, textAlign: "center" },
    colReviewsCount: { width: 85, textAlign: "center" },
    colAction: { width: 85 },

    hikesCountPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: Palette.Slate150,
    },
    hikesCountPillActive: {
        backgroundColor: Palette.Green100,
    },
    hikesCountPillText: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    hikesCountPillTextActive: {
        color: Colors.PRIMARY,
    },

    reviewsCountPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: Palette.Slate150,
    },
    reviewsCountPillActive: {
        backgroundColor: Palette.Amber100,
    },
    reviewsCountPillText: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    reviewsCountPillTextActive: {
        color: Palette.Amber500,
    },

    detailButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    detailButtonText: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },

    // Expanded Sub-Card & Sub-Table Styles
    expandedContainer: {
        backgroundColor: "#F9FBFC",
        borderBottomWidth: 2,
        borderBottomColor: Palette.Slate200,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 10,
    },
    expandedHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingBottom: 8,
    },
    expandedHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    subViewBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
    },
    subViewBtnInactive: {
        backgroundColor: Palette.Slate100,
        borderColor: Palette.Slate200,
    },
    subViewBtnActiveHike: {
        backgroundColor: Palette.Green100,
        borderColor: Palette.Green400,
    },
    subViewBtnActiveReview: {
        backgroundColor: Palette.Amber100,
        borderColor: Palette.Amber500,
    },
    subViewBtnText: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    subViewBtnTextActiveHike: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    subViewBtnTextActiveReview: {
        color: Palette.Amber500,
        fontWeight: "700",
    },
    expandedHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    expandedUserNameTag: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    expandedUserTag: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    collapseHint: {
        fontSize: 11,
        fontWeight: "500",
        color: Colors.PRIMARY,
    },
    hikesEmptyState: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        padding: 16,
    },
    hikesEmptyTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    hikesEmptySubtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },

    // Hike Sub-Table Styles
    hikeTable: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
    },
    hikeTableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingVertical: 8,
        alignItems: "center",
    },
    hikeTh: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        paddingHorizontal: 8,
    },
    hikeTableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        paddingVertical: 8,
        alignItems: "center",
    },
    hikeRowEven: {
        backgroundColor: Colors.WHITE,
    },
    hikeRowOdd: {
        backgroundColor: Palette.Slate50,
    },
    hikeTd: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        paddingHorizontal: 8,
    },
    hikeColIndex: { width: 40, textAlign: "center" },
    hikeColTrail: { width: 240 },
    hikeColDate: { width: 130 },
    hikeColStatus: { width: 100 },
    hikeColMode: { width: 90, textAlign: "center" },
    hikeColMetric: { width: 105 },
    hikeColBooking: { width: 140 },
    hikeColHikeId: { width: 110 },

    hikeTrailName: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    hikeTrailLocation: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },
    hikeStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    hikeStatusText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "capitalize",
    },
    hikeModeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        textTransform: "capitalize",
    },

    // Review Sub-Table Styles
    reviewTable: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
    },
    reviewTableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        paddingVertical: 8,
        alignItems: "center",
    },
    reviewTh: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        paddingHorizontal: 8,
    },
    reviewTableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        paddingVertical: 8,
        alignItems: "center",
    },
    reviewRowEven: {
        backgroundColor: Colors.WHITE,
    },
    reviewRowOdd: {
        backgroundColor: Palette.Slate50,
    },
    reviewTd: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        paddingHorizontal: 8,
    },
    reviewColIndex: { width: 40, textAlign: "center" },
    reviewColTrail: { width: 240 },
    reviewColRating: { width: 110 },
    reviewColText: { width: 260 },
    reviewColPerceived: { width: 130 },
    reviewColMaintenance: { width: 130 },
    reviewColPredicted: { width: 130 },
    reviewColMetric: { width: 105 },
    reviewColLikes: { width: 80 },
    reviewColDate: { width: 120 },
    reviewColId: { width: 110 },

    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Yellow50,
        borderColor: Palette.Amber100,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ratingBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: Palette.Amber500,
    },
    reviewFeedbackText: {
        fontSize: 11,
        fontStyle: "italic",
        color: Colors.TEXT_PRIMARY,
        lineHeight: 15,
    },
    noReviewText: {
        fontSize: 11,
        fontStyle: "italic",
        color: Colors.GRAY_MEDIUM,
    },
    diffBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    diffBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "capitalize",
    },
    likesPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        backgroundColor: Palette.Red50,
        borderColor: Palette.Red100,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    likesPillText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Red600,
    },

    centerContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
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
    },
    detailKey: {
        width: 160,
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    detailVal: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
});
