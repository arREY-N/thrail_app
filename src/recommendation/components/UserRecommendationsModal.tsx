import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { IRecommendedTrailItem, Recommendation } from "@/src/core/models/Recommendation/interfaces/Recommendation.types";
import { RecommendationRepo } from "@/src/core/models/Recommendation/repositories/recommendationRepository";
import { User } from "@/src/core/models/User/User";
import getRecoID from "@/src/core/utility/recommendation";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface UserRecommendationsModalProps {
    visible: boolean;
    user: User | null;
    onClose: () => void;
    onRunEnginePress?: () => void;
}

type CategoryTab = "all" | "easy" | "difficult";

export default function UserRecommendationsModal({
    visible,
    user,
    onClose,
    onRunEnginePress,
}: UserRecommendationsModalProps) {
    const [monthId, setMonthId] = useState<string>(getRecoID());
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<CategoryTab>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        if (visible && user?.id) {
            loadUserRecommendation(user.id, monthId);
        } else if (!visible) {
            setRecommendation(null);
            setError(null);
            setSearchQuery("");
        }
    }, [visible, user?.id, monthId]);

    const loadUserRecommendation = async (uid: string, month: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await RecommendationRepo.fetchByMonth(uid, month);
            setRecommendation(data);
        } catch (err: any) {
            setError(err.message || "Failed to load recommendation document.");
            setRecommendation(null);
        } finally {
            setLoading(false);
        }
    };

    const easyTrails = useMemo(() => recommendation?.easy || [], [recommendation]);
    const difficultTrails = useMemo(() => recommendation?.difficult || [], [recommendation]);

    // Filter trails based on search and active tab
    const filteredTrails = useMemo(() => {
        let list: IRecommendedTrailItem[] = [];

        if (activeTab === "easy") {
            list = easyTrails;
        } else if (activeTab === "difficult") {
            list = difficultTrails;
        } else {
            // Group both with easy first, or combined
            list = [...easyTrails, ...difficultTrails];
        }

        if (searchQuery.trim().length > 0) {
            const q = searchQuery.toLowerCase();
            list = list.filter((t) => t.trailName.toLowerCase().includes(q));
        }

        return list;
    }, [activeTab, easyTrails, difficultTrails, searchQuery]);

    const fullName = user
        ? `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.username || "User"
        : "User";

    const getScoreBadgeColor = (score: number) => {
        if (score <= 0.30) {
            return { bg: Palette.Green50, border: Palette.Green200, text: Palette.Green800, label: "Top Match" };
        }
        if (score <= 0.55) {
            return { bg: Palette.Amber50, border: Palette.Amber200, text: Palette.Amber800, label: "Moderate" };
        }
        return { bg: Palette.Slate100, border: Palette.Slate200, text: Palette.Slate700, label: "Lower Match" };
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.userTitleRow}>
                                <CustomIcon library="Feather" name="compass" size={18} color={Colors.PRIMARY} />
                                <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
                                <View style={styles.monthBadge}>
                                    <Text style={styles.monthBadgeText}>{monthId}</Text>
                                </View>
                            </View>
                            <Text style={styles.userSubText} numberOfLines={1}>
                                @{user?.username || user?.email?.split("@")[0] || "user"} • ID: {user?.id}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <CustomIcon library="Feather" name="x" size={18} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    </View>

                    {/* Metadata Strip */}
                    {recommendation?.engineConfig && (
                        <View style={styles.metaStrip}>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>CBF Engine:</Text>
                                <Text style={styles.metaVal}>{recommendation.engineConfig.cbf}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>CF Engine:</Text>
                                <Text style={styles.metaVal}>{recommendation.engineConfig.cf}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>Alpha:</Text>
                                <Text style={[styles.metaVal, { color: Colors.PRIMARY }]}>
                                    {recommendation.engineConfig.alpha}
                                </Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaLabel}>User Base:</Text>
                                <Text style={styles.metaVal}>{recommendation.engineConfig.userCount}</Text>
                            </View>
                        </View>
                    )}

                    {/* Filter & Category Switcher */}
                    <View style={styles.controlsBar}>
                        <View style={styles.tabGroup}>
                            <TouchableOpacity
                                style={[styles.tabBtn, activeTab === "all" && styles.tabBtnActive]}
                                onPress={() => setActiveTab("all")}
                            >
                                <Text style={[styles.tabBtnText, activeTab === "all" && styles.tabBtnTextActive]}>
                                    All ({easyTrails.length + difficultTrails.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.tabBtn, activeTab === "easy" && styles.tabBtnActiveEasy]}
                                onPress={() => setActiveTab("easy")}
                            >
                                <View style={styles.tabBadgeEasy}>
                                    <Text style={styles.tabBadgeTextEasy}>Easy</Text>
                                </View>
                                <Text style={[styles.tabBtnText, activeTab === "easy" && styles.tabBtnTextActiveEasy]}>
                                    ({easyTrails.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.tabBtn, activeTab === "difficult" && styles.tabBtnActiveDiff]}
                                onPress={() => setActiveTab("difficult")}
                            >
                                <View style={styles.tabBadgeDiff}>
                                    <Text style={styles.tabBadgeTextDiff}>Difficult</Text>
                                </View>
                                <Text style={[styles.tabBtnText, activeTab === "difficult" && styles.tabBtnTextActiveDiff]}>
                                    ({difficultTrails.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={styles.searchBox}>
                            <CustomIcon library="Feather" name="search" size={14} color={Colors.TEXT_SECONDARY} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Filter trails by name..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                clearButtonMode="while-editing"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <CustomIcon library="Feather" name="x" size={14} color={Colors.GRAY_MEDIUM} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Content Section */}
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={Colors.PRIMARY} />
                            <Text style={styles.loadingText}>Loading recommendations for {monthId}...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContainer}>
                            <CustomIcon library="Feather" name="alert-circle" size={36} color={Palette.Red600} />
                            <Text style={styles.errorTitle}>Error Loading Recommendations</Text>
                            <Text style={styles.errorSubtitle}>{error}</Text>
                        </View>
                    ) : !recommendation ? (
                        <View style={styles.centerContainer}>
                            <CustomIcon library="Feather" name="inbox" size={44} color={Colors.GRAY_MEDIUM} />
                            <Text style={styles.emptyTitle}>No Recommendations Available</Text>
                            <Text style={styles.emptySubtitle}>
                                Recommendations have not been generated yet for {fullName} in {monthId}.
                            </Text>
                            {onRunEnginePress && (
                                <TouchableOpacity
                                    style={styles.runEngineBtn}
                                    onPress={() => {
                                        onClose();
                                        onRunEnginePress();
                                    }}
                                >
                                    <CustomIcon library="Feather" name="play" size={14} color={Colors.WHITE} />
                                    <Text style={styles.runEngineBtnText}>Run Engine Now</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <ScrollView style={styles.trailList} contentContainerStyle={styles.trailListContent}>
                            {filteredTrails.length === 0 ? (
                                <View style={styles.emptySearchContainer}>
                                    <Text style={styles.emptySearchText}>
                                        No trails matching "{searchQuery}"
                                    </Text>
                                </View>
                            ) : (
                                filteredTrails.map((trail, index) => {
                                    const badge = getScoreBadgeColor(trail.score);
                                    const isEasy = trail.category === "easy";

                                    return (
                                        <View key={`${trail.category}-${trail.id}-${index}`} style={styles.trailCard}>
                                            <View style={styles.cardHeader}>
                                                <View style={styles.rankBadge}>
                                                    <Text style={styles.rankText}>#{index + 1}</Text>
                                                </View>

                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.trailName} numberOfLines={1}>
                                                        {trail.trailName}
                                                    </Text>
                                                    <Text style={styles.trailIdText} numberOfLines={1}>
                                                        ID: {trail.id}
                                                    </Text>
                                                </View>

                                                {/* Category Badge */}
                                                <View
                                                    style={[
                                                        styles.categoryBadge,
                                                        isEasy ? styles.categoryBadgeEasy : styles.categoryBadgeDiff,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.categoryBadgeText,
                                                            isEasy ? styles.categoryBadgeTextEasy : styles.categoryBadgeTextDiff,
                                                        ]}
                                                    >
                                                        {isEasy ? "Easy Profile" : "Difficult Profile"}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.cardFooter}>
                                                {/* Recommendation Score Chip */}
                                                <View style={[styles.scoreChip, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                                                    <CustomIcon library="Feather" name="target" size={12} color={badge.text} />
                                                    <Text style={[styles.scoreChipLabel, { color: badge.text }]}>
                                                        Score: {trail.score.toFixed(4)}
                                                    </Text>
                                                    <View style={[styles.scoreQualityPill, { backgroundColor: badge.border }]}>
                                                        <Text style={[styles.scoreQualityText, { color: badge.text }]}>
                                                            {badge.label}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Hiked Status Badge */}
                                                <View
                                                    style={[
                                                        styles.hikedBadge,
                                                        trail.haveHiked ? styles.hikedBadgeYes : styles.hikedBadgeNo,
                                                    ]}
                                                >
                                                    <CustomIcon
                                                        library="Feather"
                                                        name={trail.haveHiked ? "check-circle" : "circle"}
                                                        size={12}
                                                        color={trail.haveHiked ? Palette.Green700 : Palette.Slate500}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.hikedBadgeText,
                                                            trail.haveHiked ? styles.hikedBadgeTextYes : styles.hikedBadgeTextNo,
                                                        ]}
                                                    >
                                                        {trail.haveHiked ? "Completed Hike" : "Unhiked"}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                            <Text style={styles.doneBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
        width: "100%",
        maxWidth: 720,
        height: "85%",
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        backgroundColor: Palette.Slate50,
    },
    userTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    monthBadge: {
        backgroundColor: Palette.Green100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    monthBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: Palette.Green800,
    },
    userSubText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: Palette.Slate200,
    },
    metaStrip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Palette.Slate100,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    metaVal: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    controlsBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate200,
        flexWrap: "wrap",
    },
    tabGroup: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderRadius: 8,
        padding: 3,
        gap: 4,
    },
    tabBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    tabBtnActive: {
        backgroundColor: Colors.WHITE,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    tabBtnActiveEasy: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    tabBtnActiveDiff: {
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber200,
    },
    tabBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    tabBtnTextActive: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: "700",
    },
    tabBtnTextActiveEasy: {
        color: Palette.Green800,
        fontWeight: "700",
    },
    tabBtnTextActiveDiff: {
        color: Palette.Amber800,
        fontWeight: "700",
    },
    tabBadgeEasy: {
        backgroundColor: Palette.Green600,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    tabBadgeTextEasy: {
        fontSize: 9,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    tabBadgeDiff: {
        backgroundColor: Palette.Amber600,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    tabBadgeTextDiff: {
        fontSize: 9,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    searchBox: {
        flex: 1,
        minWidth: 180,
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
    searchInput: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 10,
    },
    loadingText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    errorTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Palette.Red700,
    },
    errorSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    emptySubtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
        maxWidth: 320,
    },
    runEngineBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 6,
    },
    runEngineBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.WHITE,
    },
    trailList: {
        flex: 1,
    },
    trailListContent: {
        padding: 16,
        gap: 10,
    },
    emptySearchContainer: {
        padding: 30,
        alignItems: "center",
    },
    emptySearchText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    trailCard: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    rankBadge: {
        backgroundColor: Palette.Slate100,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    rankText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    trailName: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    trailIdText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },
    categoryBadge: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    categoryBadgeEasy: {
        backgroundColor: Palette.Green100,
    },
    categoryBadgeDiff: {
        backgroundColor: Palette.Amber100,
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    categoryBadgeTextEasy: {
        color: Palette.Green800,
    },
    categoryBadgeTextDiff: {
        color: Palette.Amber800,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate100,
        flexWrap: "wrap",
        gap: 8,
    },
    scoreChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    scoreChipLabel: {
        fontSize: 11,
        fontWeight: "700",
        fontFamily: "monospace",
    },
    scoreQualityPill: {
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    scoreQualityText: {
        fontSize: 9,
        fontWeight: "700",
    },
    hikedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    hikedBadgeYes: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    hikedBadgeNo: {
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    hikedBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    hikedBadgeTextYes: {
        color: Palette.Green800,
    },
    hikedBadgeTextNo: {
        color: Palette.Slate600,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: Palette.Slate200,
        backgroundColor: Palette.Slate50,
    },
    doneBtn: {
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    doneBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
});
