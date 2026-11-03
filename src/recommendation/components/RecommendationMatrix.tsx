/**
 * @file RecommendationMatrix.tsx
 * @description Tabular matrix viewer presenting THARESYS recommendation results.
 * Columns: Trails
 * Rows: Users
 * Cell: Recommendation score (0.0000 = closest match) + Category badge (Easy / Difficult).
 * Features fast filtering, search, pagination, cell inspector modal, and month selector.
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Trail } from "@/src/core/models/Trail/Trail";
import { User } from "@/src/core/models/User/User";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface TrailScoreCellData {
    trailId: string;
    trailName: string;
    category: "easy" | "difficult";
    score: number;
    easyScore?: number;
    diffScore?: number;
    cbfScore?: number;
    cfScore?: number;
    haveHiked?: boolean;
}

export interface RecommendationMatrixProps {
    trails?: Trail[];
    users?: User[];
    recommendationsMap?: Record<string, any>;
    isLoading?: boolean;
    activeMonth?: string;
    onMonthChange?: (month: string) => void;
    availableMonths?: string[];
    onRefresh?: () => void;
    onRunEnginePress?: () => void;
}

export default function RecommendationMatrix({
    trails = [],
    users = [],
    recommendationsMap = {},
    isLoading = false,
    activeMonth = "2026-11",
    onMonthChange,
    availableMonths = ["2026-11", "2026-10", "2026-09"],
    onRefresh,
    onRunEnginePress,
}: RecommendationMatrixProps) {
    const router = useRouter();

    const [userQuery, setUserQuery] = useState("");
    const [trailQuery, setTrailQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<"all" | "easy" | "difficult">("all");
    const [selectedCell, setSelectedCell] = useState<{
        user: User;
        trail: Trail;
        entry: TrailScoreCellData | null;
    } | null>(null);

    // Parent container width measurement for 100% full-width column distribution
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const userColWidth = 180;

    // Fast O(1) indexed lookup map: Map<userId, Map<trailId, TrailScoreCellData>>
    const userTrailMatrixMap = useMemo(() => {
        const matrix = new Map<string, Map<string, TrailScoreCellData>>();
        for (const [uid, reco] of Object.entries(recommendationsMap || {})) {
            if (!reco) continue;
            const trailMap = new Map<string, TrailScoreCellData>();

            const easyList = Array.isArray(reco.easy) ? reco.easy : [];
            for (const item of easyList) {
                const tid = String(item.id || item.trailId || "");
                if (tid) {
                    trailMap.set(tid, {
                        trailId: tid,
                        trailName: item.trailName || "",
                        category: "easy",
                        score: typeof item.score === "number" ? item.score : parseFloat(item.score) || 0,
                        easyScore: item.easyScore != null ? Number(item.easyScore) : undefined,
                        diffScore: item.diffScore != null ? Number(item.diffScore) : undefined,
                        cbfScore: item.cbfScore != null ? Number(item.cbfScore) : undefined,
                        cfScore: item.cfScore != null ? Number(item.cfScore) : undefined,
                        haveHiked: Boolean(item.haveHiked),
                    });
                }
            }

            const diffList = Array.isArray(reco.difficult) ? reco.difficult : [];
            for (const item of diffList) {
                const tid = String(item.id || item.trailId || "");
                if (tid) {
                    trailMap.set(tid, {
                        trailId: tid,
                        trailName: item.trailName || "",
                        category: "difficult",
                        score: typeof item.score === "number" ? item.score : parseFloat(item.score) || 0,
                        easyScore: item.easyScore != null ? Number(item.easyScore) : undefined,
                        diffScore: item.diffScore != null ? Number(item.diffScore) : undefined,
                        cbfScore: item.cbfScore != null ? Number(item.cbfScore) : undefined,
                        cfScore: item.cfScore != null ? Number(item.cfScore) : undefined,
                        haveHiked: Boolean(item.haveHiked),
                    });
                }
            }

            matrix.set(uid, trailMap);
        }
        return matrix;
    }, [recommendationsMap]);

    // Users with recommendation records for the active month
    const usersWithRecommendations = useMemo(() => {
        return users.filter((u) => userTrailMatrixMap.has(u.id));
    }, [users, userTrailMatrixMap]);

    // Filtered users for rows
    const filteredUsers = useMemo(() => {
        const query = userQuery.trim().toLowerCase();
        return usersWithRecommendations.filter((u) => {
            const fullName = `${u.firstname || ""} ${u.lastname || ""}`.trim();
            const matchesQuery =
                !query ||
                fullName.toLowerCase().includes(query) ||
                u.username?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query) ||
                u.id.toLowerCase().includes(query);

            if (!matchesQuery) return false;

            if (categoryFilter !== "all") {
                const userMap = userTrailMatrixMap.get(u.id);
                if (!userMap) return false;
                const hasMatchingCategory = Array.from(userMap.values()).some(
                    (entry) => entry.category === categoryFilter
                );
                if (!hasMatchingCategory) return false;
            }

            return true;
        });
    }, [usersWithRecommendations, userQuery, categoryFilter, userTrailMatrixMap]);

    // Filtered trails for columns
    const filteredTrails = useMemo(() => {
        const query = trailQuery.trim().toLowerCase();
        return trails.filter((t) => {
            const name = t.general?.name || "";
            const address = t.general?.address || "";
            const prov = Array.isArray(t.general?.province)
                ? t.general.province.join(" ")
                : String(t.general?.province || "");
            return (
                !query ||
                name.toLowerCase().includes(query) ||
                address.toLowerCase().includes(query) ||
                prov.toLowerCase().includes(query) ||
                t.id.toLowerCase().includes(query)
            );
        });
    }, [trails, trailQuery]);

    // Distribute available space across all trail columns (accounting for 2px outer borders)
    const trailColWidth = useMemo(() => {
        if (!containerWidth || filteredTrails.length === 0) return 125;
        const available = containerWidth - userColWidth - 2;
        const calculated = available / filteredTrails.length;
        return Math.max(95, calculated);
    }, [containerWidth, filteredTrails.length, userColWidth]);

    // Pagination for users (rows)
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredUsers.slice(start, start + PAGE_SIZE);
    }, [filteredUsers, page]);

    // Overall stats
    const totalAssignedEasy = useMemo(() => {
        let count = 0;
        for (const userMap of userTrailMatrixMap.values()) {
            for (const entry of userMap.values()) {
                if (entry.category === "easy") count++;
            }
        }
        return count;
    }, [userTrailMatrixMap]);

    const totalAssignedDifficult = useMemo(() => {
        let count = 0;
        for (const userMap of userTrailMatrixMap.values()) {
            for (const entry of userMap.values()) {
                if (entry.category === "difficult") count++;
            }
        }
        return count;
    }, [userTrailMatrixMap]);

    const handleInspectUser = (userId: string) => {
        router.push(`/superadmin/recommendation/${userId}` as any);
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingTitle}>Loading Recommendation Matrix...</Text>
                <Text style={styles.loadingSubtitle}>
                    Fetching raw recommendation scores for {activeMonth}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top Toolbar: Month Picker & Quick Stats */}
            <View style={styles.topToolbar}>
                {/* Month Selector Pills */}
                <View style={styles.monthSelectorRow}>
                    <Text style={styles.toolbarLabel}>Batch Month:</Text>
                    <View style={styles.monthPills}>
                        {availableMonths.map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.monthPill, activeMonth === m && styles.monthPillActive]}
                                onPress={() => onMonthChange?.(m)}
                            >
                                <Text
                                    style={[
                                        styles.monthPillText,
                                        activeMonth === m && styles.monthPillTextActive,
                                    ]}
                                >
                                    {m}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.toolbarActions}>
                    {onRefresh && (
                        <TouchableOpacity style={styles.actionBtnSecondary} onPress={onRefresh}>
                            <CustomIcon library="Feather" name="rotate-cw" size={13} color={Colors.PRIMARY} />
                            <Text style={styles.actionBtnSecondaryText}>Refresh Results</Text>
                        </TouchableOpacity>
                    )}
                    {onRunEnginePress && (
                        <TouchableOpacity style={styles.actionBtnPrimary} onPress={onRunEnginePress}>
                            <CustomIcon library="Feather" name="cpu" size={13} color={Colors.WHITE} />
                            <Text style={styles.actionBtnPrimaryText}>Run Engine Batch</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{usersWithRecommendations.length}</Text>
                    <Text style={styles.statLabel}>Users Evaluated</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{trails.length}</Text>
                    <Text style={styles.statLabel}>Trails Matrix Columns</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={styles.dotEasy} />
                        <Text style={[styles.statValue, { color: Palette.Green700 }]}>
                            {totalAssignedEasy}
                        </Text>
                    </View>
                    <Text style={styles.statLabel}>Easy Matches</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={styles.dotDifficult} />
                        <Text style={[styles.statValue, { color: Palette.Amber700 }]}>
                            {totalAssignedDifficult}
                        </Text>
                    </View>
                    <Text style={styles.statLabel}>Difficult Matches</Text>
                </View>
            </View>

            {/* Search and Category Filters */}
            <View style={styles.filterRow}>
                <View style={styles.searchBar}>
                    <CustomIcon library="Feather" name="user" size={14} color={Colors.TEXT_SECONDARY} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor={Colors.TEXT_SECONDARY}
                        value={userQuery}
                        onChangeText={(txt) => {
                            setUserQuery(txt);
                            setPage(1);
                        }}
                    />
                    {userQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setUserQuery("")}>
                            <CustomIcon library="Feather" name="x" size={13} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.searchBar}>
                    <CustomIcon library="Feather" name="map-pin" size={14} color={Colors.TEXT_SECONDARY} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Filter trails columns..."
                        placeholderTextColor={Colors.TEXT_SECONDARY}
                        value={trailQuery}
                        onChangeText={setTrailQuery}
                    />
                    {trailQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setTrailQuery("")}>
                            <CustomIcon library="Feather" name="x" size={13} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Category Pills */}
                <View style={styles.categoryFilters}>
                    <TouchableOpacity
                        style={[styles.catFilterPill, categoryFilter === "all" && styles.catFilterPillActive]}
                        onPress={() => setCategoryFilter("all")}
                    >
                        <Text
                            style={[
                                styles.catFilterText,
                                categoryFilter === "all" && styles.catFilterTextActive,
                            ]}
                        >
                            All Categories
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.catFilterPill,
                            categoryFilter === "easy" && styles.catFilterPillActiveEasy,
                        ]}
                        onPress={() => setCategoryFilter("easy")}
                    >
                        <View style={styles.dotEasy} />
                        <Text
                            style={[
                                styles.catFilterText,
                                categoryFilter === "easy" && styles.catFilterTextActiveEasy,
                            ]}
                        >
                            Easy Matches Only
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.catFilterPill,
                            categoryFilter === "difficult" && styles.catFilterPillActiveDiff,
                        ]}
                        onPress={() => setCategoryFilter("difficult")}
                    >
                        <View style={styles.dotDifficult} />
                        <Text
                            style={[
                                styles.catFilterText,
                                categoryFilter === "difficult" && styles.catFilterTextActiveDiff,
                            ]}
                        >
                            Difficult Matches Only
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Matrix Table or Empty State */}
            {usersWithRecommendations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <CustomIcon library="Feather" name="inbox" size={44} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.emptyTitle}>No Recommendations for {activeMonth}</Text>
                    <Text style={styles.emptySubtitle}>
                        No recommendation document was found in Firestore for month &ldquo;{activeMonth}&rdquo;.
                        Run the engine to generate recommendations for this cycle.
                    </Text>
                    {onRunEnginePress && (
                        <TouchableOpacity style={styles.runEngineEmptyBtn} onPress={onRunEnginePress}>
                            <CustomIcon library="Feather" name="cpu" size={14} color={Colors.WHITE} />
                            <Text style={styles.runEngineEmptyBtnText}>Run THARESYS Engine Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <CustomIcon library="Feather" name="search" size={36} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.emptyTitle}>No Users Match Your Filters</Text>
                    <Text style={styles.emptySubtitle}>
                        Try adjusting your user search or category match filters.
                    </Text>
                </View>
            ) : (
                <View
                    style={styles.matrixCard}
                    onLayout={(e) => {
                        const w = e.nativeEvent.layout.width;
                        if (w > 0 && Math.abs(w - containerWidth) > 1) {
                            setContainerWidth(w);
                        }
                    }}
                >
                    {/* Synchronized 2D Scrollable Matrix */}
                    <ScrollView
                        horizontal={true}
                        style={styles.horizontalScroll}
                        contentContainerStyle={{ minWidth: "100%", flexGrow: 1 }}
                        showsHorizontalScrollIndicator={true}
                    >
                        <View style={styles.tableInner}>
                            {/* Sticky Header Row: Columns = Trails */}
                            <View style={styles.headerRow}>
                                {/* Fixed User Info Column Header */}
                                <View style={[styles.userColumnHeader, { width: userColWidth }]}>
                                    <Text style={styles.userColumnHeaderText}>User (Row)</Text>
                                    <Text style={styles.userColumnHeaderSub}>Easy / Diff Count</Text>
                                </View>

                                {/* Trail Columns */}
                                {filteredTrails.map((trail, tIndex) => {
                                    const tname = trail.general?.name || `Trail #${tIndex + 1}`;
                                    const prov = Array.isArray(trail.general?.province)
                                        ? trail.general.province[0]
                                        : trail.general?.province || "";

                                    return (
                                        <View
                                            key={trail.id || tIndex}
                                            style={[styles.trailColumnHeader, { width: trailColWidth }]}
                                        >
                                            <Text style={styles.trailNameHeader} numberOfLines={2}>
                                                {tname}
                                            </Text>
                                            {prov ? (
                                                <View style={styles.trailMetaRow}>
                                                    <View style={styles.provBadge}>
                                                        <Text style={styles.provBadgeText}>{prov}</Text>
                                                    </View>
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Table Body: Rows = Users */}
                            <ScrollView
                                style={styles.verticalScroll}
                                showsVerticalScrollIndicator={true}
                            >
                                {paginatedUsers.map((user, uIndex) => {
                                    const fullName =
                                        `${user.firstname || ""} ${user.lastname || ""}`.trim() ||
                                        user.username ||
                                        user.id;
                                    const userMap = userTrailMatrixMap.get(user.id);
                                    const isEven = uIndex % 2 === 0;

                                    // Count easy vs difficult for this user
                                    let userEasyCount = 0;
                                    let userDiffCount = 0;
                                    if (userMap) {
                                        for (const entry of userMap.values()) {
                                            if (entry.category === "easy") userEasyCount++;
                                            else if (entry.category === "difficult") userDiffCount++;
                                        }
                                    }

                                    return (
                                        <View
                                            key={user.id || uIndex}
                                            style={[styles.matrixRow, isEven ? styles.rowEven : styles.rowOdd]}
                                        >
                                            {/* Left Sticky User Cell */}
                                            <TouchableOpacity
                                                style={[styles.userRowCell, { width: userColWidth }]}
                                                onPress={() => handleInspectUser(user.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.userNameText} numberOfLines={1}>
                                                        {fullName}
                                                    </Text>
                                                    <Text style={styles.userHandleText} numberOfLines={1}>
                                                        @{user.username || user.email?.split("@")[0] || "user"}
                                                    </Text>
                                                    <View style={styles.userCountsRow}>
                                                        <View style={styles.miniEasyBadge}>
                                                            <Text style={styles.miniEasyBadgeText}>
                                                                E: {userEasyCount}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.miniDiffBadge}>
                                                            <Text style={styles.miniDiffBadgeText}>
                                                                D: {userDiffCount}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.inspectHint}>• Inspect</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {/* Trail Cells for this User */}
                                            {filteredTrails.map((trail) => {
                                                const entry = userMap ? userMap.get(trail.id) || null : null;
                                                const isEasy = entry?.category === "easy";
                                                const isDiff = entry?.category === "difficult";

                                                return (
                                                    <TouchableOpacity
                                                        key={trail.id}
                                                        style={[
                                                            styles.scoreCell,
                                                            { width: trailColWidth },
                                                            isEasy && styles.scoreCellEasy,
                                                            isDiff && styles.scoreCellDiff,
                                                        ]}
                                                        onPress={() =>
                                                            setSelectedCell({
                                                                user,
                                                                trail,
                                                                entry,
                                                            })
                                                        }
                                                        activeOpacity={0.7}
                                                    >
                                                        {entry ? (
                                                            <>
                                                                {/* Score formatted to 4 decimals */}
                                                                <Text
                                                                    style={[
                                                                        styles.scoreNumber,
                                                                        isEasy && styles.scoreNumberEasy,
                                                                        isDiff && styles.scoreNumberDiff,
                                                                    ]}
                                                                >
                                                                    {entry.score.toFixed(4)}
                                                                </Text>

                                                                {/* Category Badge */}
                                                                <View
                                                                    style={[
                                                                        styles.cellBadge,
                                                                        isEasy && styles.cellBadgeEasy,
                                                                        isDiff && styles.cellBadgeDiff,
                                                                    ]}
                                                                >
                                                                    <Text
                                                                        style={[
                                                                            styles.cellBadgeText,
                                                                            isEasy && styles.cellBadgeTextEasy,
                                                                            isDiff && styles.cellBadgeTextDiff,
                                                                        ]}
                                                                    >
                                                                        {isEasy ? "Easy" : "Difficult"}
                                                                    </Text>
                                                                    {entry.haveHiked && (
                                                                        <CustomIcon
                                                                            library="Feather"
                                                                            name="check"
                                                                            size={9}
                                                                            color={
                                                                                isEasy
                                                                                    ? Palette.Green700
                                                                                    : Palette.Amber700
                                                                            }
                                                                            style={{ marginLeft: 2 }}
                                                                        />
                                                                    )}
                                                                </View>
                                                            </>
                                                        ) : (
                                                            <Text style={styles.scoreEmpty}>—</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Pagination Row */}
            {filteredUsers.length > 0 && (
                <View style={styles.paginationRow}>
                    <Text style={styles.paginationText}>
                        Showing {(page - 1) * PAGE_SIZE + 1} -{" "}
                        {Math.min(page * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} evaluated users
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
                            <Text
                                style={[
                                    styles.pageBtnText,
                                    page >= totalPages && styles.pageBtnTextDisabled,
                                ]}
                            >
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

            {/* Cell Score Detail Modal */}
            {selectedCell && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modalTitle}>Recommendation Score Detail</Text>
                                    <Text style={styles.modalSubtitle}>
                                        {selectedCell.user.firstname || selectedCell.user.username} &times;{" "}
                                        {selectedCell.trail.general?.name || "Trail"}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedCell(null)}>
                                    <CustomIcon library="Feather" name="x" size={18} color={Colors.TEXT_SECONDARY} />
                                </TouchableOpacity>
                            </View>

                            {/* Modal Body */}
                            {selectedCell.entry ? (
                                <View style={styles.modalBody}>
                                    {/* Main Result Card */}
                                    <View
                                        style={[
                                            styles.scoreDetailHero,
                                            selectedCell.entry.category === "easy"
                                                ? styles.scoreHeroEasy
                                                : styles.scoreHeroDiff,
                                        ]}
                                    >
                                        <View>
                                            <Text style={styles.scoreHeroLabel}>Assigned Category</Text>
                                            <Text
                                                style={[
                                                    styles.scoreHeroCategory,
                                                    selectedCell.entry.category === "easy"
                                                        ? { color: Palette.Green700 }
                                                        : { color: Palette.Amber700 },
                                                ]}
                                            >
                                                {selectedCell.entry.category === "easy"
                                                    ? "Easy Anchor Match"
                                                    : "Difficult Anchor Match"}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={styles.scoreHeroLabel}>Hybrid Distance ($R_{"{tu}"}$)</Text>
                                            <Text style={styles.scoreHeroScore}>
                                                {selectedCell.entry.score.toFixed(4)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Distance Components Grid */}
                                    <View style={styles.detailGrid}>
                                        <View style={styles.detailGridItem}>
                                            <Text style={styles.detailGridLabel}>Distance to Easy Anchor</Text>
                                            <Text style={styles.detailGridValue}>
                                                {selectedCell.entry.easyScore != null
                                                    ? selectedCell.entry.easyScore.toFixed(4)
                                                    : "—"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailGridItem}>
                                            <Text style={styles.detailGridLabel}>Distance to Difficult Anchor</Text>
                                            <Text style={styles.detailGridValue}>
                                                {selectedCell.entry.diffScore != null
                                                    ? selectedCell.entry.diffScore.toFixed(4)
                                                    : "—"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailGridItem}>
                                            <Text style={styles.detailGridLabel}>CBF Component Distance</Text>
                                            <Text style={styles.detailGridValue}>
                                                {selectedCell.entry.cbfScore != null
                                                    ? selectedCell.entry.cbfScore.toFixed(4)
                                                    : "—"}
                                            </Text>
                                        </View>
                                        <View style={styles.detailGridItem}>
                                            <Text style={styles.detailGridLabel}>CF Component Distance</Text>
                                            <Text style={styles.detailGridValue}>
                                                {selectedCell.entry.cfScore != null
                                                    ? selectedCell.entry.cfScore.toFixed(4)
                                                    : "—"}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.modalNote}>
                                        <CustomIcon library="Feather" name="info" size={13} color={Colors.TEXT_SECONDARY} />
                                        <Text style={styles.modalNoteText}>
                                            Assigned via disjoint partitioning: The trail is exclusively categorized under{" "}
                                            {selectedCell.entry.category === "easy" ? "Easy" : "Difficult"} because its
                                            distance to that profile anchor was lower.
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.modalBody}>
                                    <Text style={styles.modalEmptyText}>
                                        No recommendation score recorded for this user and trail combination in month{" "}
                                        {activeMonth}.
                                    </Text>
                                </View>
                            )}

                            {/* Modal Footer */}
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.modalInspectBtn}
                                    onPress={() => {
                                        const uid = selectedCell.user.id;
                                        setSelectedCell(null);
                                        handleInspectUser(uid);
                                    }}
                                >
                                    <CustomIcon library="Feather" name="eye" size={14} color={Colors.WHITE} />
                                    <Text style={styles.modalInspectBtnText}>
                                        Inspect {selectedCell.user.firstname || "User"}&apos;s Full Profile
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 10,
    },
    topToolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    monthSelectorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    toolbarLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    monthPills: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    monthPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    monthPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    monthPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    monthPillTextActive: {
        color: Colors.WHITE,
    },
    toolbarActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionBtnSecondary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
    },
    actionBtnSecondaryText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    actionBtnPrimary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: Colors.PRIMARY,
    },
    actionBtnPrimaryText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },

    statsBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingVertical: 8,
        paddingHorizontal: 14,
        gap: 16,
    },
    statItem: {
        alignItems: "flex-start",
    },
    statValue: {
        fontSize: 15,
        fontWeight: "800",
        color: Colors.TEXT_PRIMARY,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: Palette.Slate200,
    },
    dotEasy: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Palette.Green600,
    },
    dotDifficult: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Palette.Amber600,
    },

    filterRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.WHITE,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
        minWidth: 180,
        flex: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },
    categoryFilters: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    catFilterPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    catFilterPillActive: {
        backgroundColor: Palette.Slate800,
        borderColor: Palette.Slate800,
    },
    catFilterPillActiveEasy: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green600,
    },
    catFilterPillActiveDiff: {
        backgroundColor: Palette.Amber50,
        borderColor: Palette.Amber600,
    },
    catFilterText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    catFilterTextActive: {
        color: Colors.WHITE,
    },
    catFilterTextActiveEasy: {
        color: Palette.Green700,
    },
    catFilterTextActiveDiff: {
        color: Palette.Amber700,
    },

    matrixCard: {
        flex: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
    },
    horizontalScroll: {
        flex: 1,
    },
    tableInner: {
        flexDirection: "column",
        minWidth: "100%",
        width: "100%",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: Palette.Slate100,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        minWidth: "100%",
    },
    userColumnHeader: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRightWidth: 1,
        borderRightColor: Palette.Slate200,
        backgroundColor: Palette.Slate100,
        justifyContent: "center",
    },
    userColumnHeaderText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    userColumnHeaderSub: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    trailColumnHeader: {
        paddingHorizontal: 6,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderRightColor: Palette.Slate200,
        alignItems: "center",
        justifyContent: "center",
    },
    trailNameHeader: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        textAlign: "center",
    },
    trailMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    provBadge: {
        backgroundColor: Palette.Slate200,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    provBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    trailSubText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },

    verticalScroll: {
        flex: 1,
    },
    matrixRow: {
        flexDirection: "row",
        alignItems: "stretch",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    rowEven: {
        backgroundColor: Colors.WHITE,
    },
    rowOdd: {
        backgroundColor: Palette.Slate50,
    },
    userRowCell: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderRightColor: Palette.Slate200,
        justifyContent: "center",
    },
    userNameText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    userHandleText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    userCountsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 3,
    },
    miniEasyBadge: {
        backgroundColor: Palette.Green50,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    miniEasyBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Green700,
    },
    miniDiffBadge: {
        backgroundColor: Palette.Amber50,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderWidth: 1,
        borderColor: Palette.Amber200,
    },
    miniDiffBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Palette.Amber700,
    },
    inspectHint: {
        fontSize: 10,
        color: Colors.PRIMARY,
        fontWeight: "600",
    },

    scoreCell: {
        paddingHorizontal: 4,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderRightColor: Palette.Slate200,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    scoreCellEasy: {
        backgroundColor: "rgba(16, 185, 129, 0.03)",
    },
    scoreCellDiff: {
        backgroundColor: "rgba(245, 158, 11, 0.03)",
    },
    scoreNumber: {
        fontSize: 12,
        fontFamily: "monospace",
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    scoreNumberEasy: {
        color: Palette.Green700,
    },
    scoreNumberDiff: {
        color: Palette.Amber700,
    },
    scoreEmpty: {
        fontSize: 12,
        color: Palette.Slate400,
    },
    cellBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
        borderWidth: 1,
    },
    cellBadgeEasy: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green200,
    },
    cellBadgeDiff: {
        backgroundColor: Palette.Amber50,
        borderColor: Palette.Amber200,
    },
    cellBadgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    cellBadgeTextEasy: {
        color: Palette.Green700,
    },
    cellBadgeTextDiff: {
        color: Palette.Amber700,
    },

    paginationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexWrap: "wrap",
        gap: 8,
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
    },
    pageBtnDisabled: {
        opacity: 0.4,
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

    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 10,
    },
    loadingTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    loadingSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 6,
    },
    emptySubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
        maxWidth: 420,
    },
    runEngineEmptyBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    runEngineEmptyBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.WHITE,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        width: "100%",
        maxWidth: 480,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        backgroundColor: Palette.Slate50,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    modalSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    modalBody: {
        padding: 16,
        gap: 12,
    },
    scoreDetailHero: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    scoreHeroEasy: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green200,
    },
    scoreHeroDiff: {
        backgroundColor: Palette.Amber50,
        borderColor: Palette.Amber200,
    },
    scoreHeroLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    scoreHeroCategory: {
        fontSize: 14,
        fontWeight: "800",
        marginTop: 2,
    },
    scoreHeroScore: {
        fontSize: 18,
        fontFamily: "monospace",
        fontWeight: "800",
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },
    detailGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    detailGridItem: {
        flex: 1,
        minWidth: 190,
        padding: 10,
        backgroundColor: Palette.Slate50,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    detailGridLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    detailGridValue: {
        fontSize: 14,
        fontFamily: "monospace",
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },
    modalNote: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        backgroundColor: Palette.Slate50,
        padding: 10,
        borderRadius: 6,
    },
    modalNoteText: {
        flex: 1,
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    modalEmptyText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
        paddingVertical: 20,
    },
    modalFooter: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
        backgroundColor: Palette.Slate50,
    },
    modalInspectBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        borderRadius: 6,
    },
    modalInspectBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.WHITE,
    },
});

