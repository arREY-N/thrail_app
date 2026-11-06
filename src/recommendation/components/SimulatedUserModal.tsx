import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

export interface ICycleTelemetry {
    cycle: number;
    month: string;
    profile: {
        easy: { metadata?: any; features: Record<string, any> };
        difficult: { metadata?: any; features: Record<string, any> };
    };
    distances: {
        easy: { gd: number; ed: number; cs: number };
        difficult: { gd: number; ed: number; cs: number };
        diff?: { gd: number; ed: number; cs: number };
        mean_gd: number;
        mean_ed: number;
        mean_cs: number;
    };
    rec_alignment_rate: number;
    recommendations: {
        easy: { id: string; trailName: string; score: number }[];
        difficult: { id: string; trailName: string; score: number }[];
    };
    alignment_checks?: any[];
    hiked?: {
        id?: string;
        trailId?: string;
        trailName: string;
        targetAnchor?: string;
        targetSlot?: string;
        score?: number;
        isMatch?: boolean;
    } | null;
    review?: {
        perceivedDifficulty: string;
        difficultyFactors: string[];
        primaryFactorKey?: string;
        rawExperience?: string;
        isMatch?: boolean;
        targetAnchor?: string;
    } | null;
}

export interface IUserConvergence {
    start_gd: number;
    end_gd: number;
    ctrl_end_gd: number;
    delta_gd: number;
    has_converged: boolean;
}

export interface ISimulatedUser {
    id: string;
    experience: string;
    medical: string;
    province_pattern: string;
    medicalProfile: {
        hasCondition: boolean;
        conditionType?: string;
    };
    preferences: {
        province: string[];
        location: string[];
    };
    profile: {
        easy: {
            metadata?: any;
            features: Record<string, any>;
        };
        difficult: {
            metadata?: any;
            features: Record<string, any>;
        };
    };
    groundTruth: {
        seed: [number, number];
        medical_scale_factor: number | null;
        attempts: number;
        easy: Record<string, number>;
        difficult: Record<string, number>;
    };
    startDistances?: {
        easy_gower: number;
        easy_euclidean: number;
        easy_cosine: number;
        diff_gower: number;
        diff_euclidean: number;
        diff_cosine: number;
    };
    cycleHistory?: ICycleTelemetry[];
    convergence?: IUserConvergence;
    versions?: {
        commit: string;
        trail_export_hash: string;
        normalization_bounds: Record<string, [number, number]>;
    };
}

export interface SimulatedUserModalProps {
    visible: boolean;
    user: ISimulatedUser | null;
    onClose: () => void;
    initialCycle?: number;
}

type ModalTab = "cycle_table" | "formulation" | "telemetry";

const PHYSICAL_COLS = [
    { key: "classification", label: "Class" },
    { key: "easy", label: "Lasco" },
    { key: "length", label: "Length (km)" },
    { key: "elevation", label: "Peak (MASL)" },
    { key: "gain", label: "Gain (m)" },
    { key: "slope", label: "Slope (%)" },
];

const TERRAIN_COLS = [
    { key: "muddy", label: "Muddy" },
    { key: "rocky", label: "Rocky" },
    { key: "grassland", label: "Grass" },
    { key: "ridges", label: "Ridge" },
];

const PROVINCES = ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"] as const;

export default function SimulatedUserModal({
    visible,
    user,
    onClose,
    initialCycle,
}: SimulatedUserModalProps) {
    const [activeTab, setActiveTab] = useState<ModalTab>("cycle_table");
    const [chartContainerWidth, setChartContainerWidth] = useState<number>(0);

    if (!user) return null;

    const gt = user.groundTruth;
    const history = user.cycleHistory || [];

    const formatVal = (v: any) => {
        const num = Number(v);
        if (isNaN(num)) return "0.00";
        return num.toFixed(2);
    };

    const getMedicalConditionName = (u: ISimulatedUser) => {
        if (!u.medicalProfile.hasCondition) return "None (Healthy Cohort)";
        const p = u.province_pattern;
        if (p === "P1") return "Asthma (Respiratory Management)";
        if (p === "P2") return "Hypertension (Cardiovascular Management)";
        if (p === "P3") return "Knee Injury (Orthopedic / Low-Impact)";
        return "Reported Physical Condition";
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.userBadge}>
                                <Text style={styles.userBadgeText}>{user.experience}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <Text style={styles.modalTitle}>Cohort {user.id} — Profile Evolution</Text>
                                    {user.convergence && (
                                        <View
                                            style={[
                                                styles.convPill,
                                                user.convergence.has_converged
                                                    ? styles.convPillConverged
                                                    : styles.convPillStable,
                                            ]}
                                        >
                                            <CustomIcon
                                                library="Feather"
                                                name={user.convergence.has_converged ? "trending-down" : "minus"}
                                                size={12}
                                                color={user.convergence.has_converged ? Palette.Green700 : Palette.Slate700}
                                            />
                                            <Text
                                                style={[
                                                    styles.convPillText,
                                                    user.convergence.has_converged
                                                        ? styles.convPillTextConverged
                                                        : styles.convPillTextStable,
                                                ]}
                                            >
                                                {user.convergence.has_converged
                                                    ? `Converged (ΔGD: ${user.convergence.delta_gd.toFixed(4)})`
                                                    : `ΔGD: +${user.convergence.delta_gd.toFixed(4)}`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.modalSubtitle}>
                                    Province {user.province_pattern} • {getMedicalConditionName(user)}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <CustomIcon library="Feather" name="x" size={20} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>

                        {/* Navigation Tabs */}
                        <View style={styles.tabBar}>
                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === "cycle_table" && styles.tabItemActive]}
                                onPress={() => setActiveTab("cycle_table")}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="activity"
                                    size={15}
                                    color={activeTab === "cycle_table" ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "cycle_table" && styles.tabTextActive,
                                    ]}
                                >
                                    Cycle Progression & Ground Truth Table
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === "formulation" && styles.tabItemActive]}
                                onPress={() => setActiveTab("formulation")}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="book-open"
                                    size={15}
                                    color={activeTab === "formulation" ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "formulation" && styles.tabTextActive,
                                    ]}
                                >
                                    Formulation & Story
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.tabItem, activeTab === "telemetry" && styles.tabItemActive]}
                                onPress={() => setActiveTab("telemetry")}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="cpu"
                                    size={15}
                                    color={activeTab === "telemetry" ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "telemetry" && styles.tabTextActive,
                                    ]}
                                >
                                    Ground Truth Telemetry & Seed
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Modal Body */}
                    <View style={styles.modalBody}>
                        {/* TAB 1: Unified Cycle Progression Table */}
                        {activeTab === "cycle_table" && (
                            <ScrollView
                                style={styles.tabScroll}
                                contentContainerStyle={styles.tabScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
                                <View style={styles.tableCard}>
                                    <View style={styles.tableLegendBar}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <CustomIcon library="Feather" name="trending-down" size={14} color={Colors.PRIMARY} />
                                            <Text style={styles.legendTitle}>
                                                Cycle-by-Cycle Evolution Table (Initial Profile → Cycles → Ground Truth Target)
                                            </Text>
                                        </View>
                                        <Text style={styles.legendSub}>
                                            Each row presents a simulation cycle with both Easy & Difficult anchors. The final pinned row shows the user&apos;s hidden Ground Truth.
                                        </Text>
                                    </View>

                                    {/* Horizontally Scrollable Unified Table */}
                                    <ScrollView horizontal={true} style={styles.tableScroll} showsHorizontalScrollIndicator={true}>
                                        <View style={styles.tableContainer}>
                                            {/* Table Header */}
                                            <View style={styles.tableHeaderRow}>
                                                <Text style={[styles.th, styles.colCycle]}>Simulation Cycle</Text>
                                                <Text style={[styles.th, styles.colAnchor, styles.centerText]}>Anchor</Text>
                                                <Text style={[styles.th, styles.colDist, styles.centerText]}>Dist to GT (GD)</Text>
                                                <Text style={[styles.th, styles.colHiked]}>Hiked Trail & Review Feedback</Text>
                                                <Text style={[styles.th, styles.colPredicted, styles.centerText]}>Predicted</Text>
                                                <Text style={[styles.th, styles.colActual, styles.centerText]}>Actual</Text>

                                                {/* Physical Feature Headers */}
                                                {PHYSICAL_COLS.map((col) => (
                                                    <Text key={col.key} style={[styles.th, styles.colNum, styles.centerText]}>
                                                        {col.label}
                                                    </Text>
                                                ))}

                                                {/* Province Headers */}
                                                {PROVINCES.map((prov) => (
                                                    <Text key={prov} style={[styles.th, styles.colProv, styles.centerText]}>
                                                        {prov}
                                                    </Text>
                                                ))}

                                                {/* Terrain Headers */}
                                                {TERRAIN_COLS.map((col) => (
                                                    <Text key={col.key} style={[styles.th, styles.colTerrain, styles.centerText]}>
                                                        {col.label}
                                                    </Text>
                                                ))}

                                                {/* Circularity Headers */}
                                                <Text style={[styles.th, styles.colCirc, styles.centerText]}>Out-Back</Text>
                                                <Text style={[styles.th, styles.colCirc, styles.centerText]}>Traverse</Text>
                                                <Text style={[styles.th, styles.colCirc, styles.centerText]}>Circular</Text>

                                                {/* Water Headers */}
                                                <Text style={[styles.th, styles.colWater, styles.centerText]}>Fall</Text>
                                                <Text style={[styles.th, styles.colWater, styles.centerText]}>River</Text>
                                                <Text style={[styles.th, styles.colWater, styles.centerText]}>Lake</Text>

                                                {/* Tourism Headers */}
                                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Shelter</Text>
                                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Rest</Text>
                                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Info</Text>
                                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Water</Text>
                                            </View>

                                            {/* Unrestricted Table Rows Container - Scrolls with Parent Modal */}
                                            <View style={styles.tableRowsContainer}>
                                                {/* 1. SUCESSIVE CYCLES */}
                                                {history.map((cData, cIdx) => {
                                                    const prof = cData.profile || (cData as any).profile_snapshot;
                                                    const easyFeat = prof?.easy?.features || {};
                                                    const diffFeat = prof?.difficult?.features || {};
                                                    const isEven = cIdx % 2 === 0;

                                                    const predictedDifficulty = cData.hiked
                                                        ? (((cData.hiked as any)?.targetSlot ||
                                                            (cData.hiked as any)?.targetAnchor ||
                                                            (cData.review as any)?.targetAnchor ||
                                                            (cData.recommendations?.easy?.some(
                                                                (r: any) => r.id === ((cData.hiked as any)?.trailId || (cData.hiked as any)?.id)
                                                            )
                                                                ? "easy"
                                                                : "difficult")) as "easy" | "difficult")
                                                        : null;

                                                    const actualExperience = cData.hiked
                                                        ? (((cData.review as any)?.rawExperience ||
                                                            (cData.review as any)?.perceivedDifficulty ||
                                                            "") as string)
                                                        : null;

                                                    const cycleName = `C${cIdx}`;

                                                    const isSelected = initialCycle !== undefined && cIdx === initialCycle;

                                                    return (
                                                        <View
                                                            key={`cycle-block-${cIdx}`}
                                                            style={[
                                                                styles.cycleBlock,
                                                                isEven ? styles.cycleBlockEven : styles.cycleBlockOdd,
                                                                isSelected && styles.cycleBlockSelected,
                                                            ]}
                                                        >
                                                            {/* Spanned Cycle Identifier Column */}
                                                            <View style={[styles.colCycle, styles.centerCell, { justifyContent: "center" }]}>
                                                                <View style={[styles.cycleBadge, isSelected && styles.cycleBadgeSelected]}>
                                                                    <Text style={[styles.cycleBadgeText, isSelected && styles.cycleBadgeTextSelected]}>
                                                                        {cycleName}
                                                                    </Text>
                                                                </View>
                                                                <Text style={[styles.cycleMonthText, isSelected && styles.cycleMonthTextSelected]}>
                                                                    {cData.month}
                                                                </Text>
                                                            </View>

                                                            {/* Stacked Sub-rows in Column */}
                                                            <View style={{ flexDirection: "column" }}>
                                                                {/* SUB-ROW 1: EASY ANCHOR */}
                                                                <View style={styles.subTableRow}>
                                                                    {/* Anchor */}
                                                                    <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                                        <View style={styles.easyBadge}>
                                                                            <Text style={styles.easyBadgeText}>Easy</Text>
                                                                        </View>
                                                                    </View>

                                                                    {/* Dist to GT */}
                                                                    <View style={[styles.tdCell, styles.colDist, styles.centerCell]}>
                                                                        <Text style={styles.distValueText}>
                                                                            {(cData.distances?.easy?.gd ?? (cData.distances as any)?.easy_gd ?? 0).toFixed(4)}
                                                                        </Text>
                                                                    </View>

                                                                    {/* Hiked Trail & Review (Rendered on Easy row for this cycle) */}
                                                                    <View style={[styles.tdCell, styles.colHiked]}>
                                                                        {cData.hiked ? (
                                                                            <View style={{ gap: 3 }}>
                                                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                                                    <Text style={styles.hikedNameText} numberOfLines={1}>
                                                                                        {cData.hiked.trailName}
                                                                                    </Text>
                                                                                    {cData.review && typeof cData.review.isMatch === "boolean" && (
                                                                                        <View
                                                                                            style={[
                                                                                                styles.matchBadge,
                                                                                                cData.review.isMatch
                                                                                                    ? styles.matchBadgeSuccess
                                                                                                    : styles.mismatchBadge,
                                                                                            ]}
                                                                                        >
                                                                                            <Text
                                                                                                style={[
                                                                                                    styles.matchBadgeText,
                                                                                                    cData.review.isMatch
                                                                                                        ? styles.matchBadgeSuccessText
                                                                                                        : styles.mismatchBadgeText,
                                                                                                ]}
                                                                                            >
                                                                                                {cData.review.isMatch ? "Match" : "Mismatch"}
                                                                                            </Text>
                                                                                        </View>
                                                                                    )}
                                                                                </View>
                                                                                <Text style={styles.hikedReviewText} numberOfLines={1}>
                                                                                    &quot;{cData.review?.difficultyFactors?.[0] || cData.review?.rawExperience || "Review logged"}&quot;
                                                                                </Text>
                                                                            </View>
                                                                        ) : (
                                                                            <Text style={styles.noHikeText}>Terminal state (Evaluation)</Text>
                                                                        )}
                                                                    </View>

                                                                    {/* Predicted Difficulty */}
                                                                    <View style={[styles.tdCell, styles.colPredicted, styles.centerCell]}>
                                                                        {predictedDifficulty ? (
                                                                            <View style={[styles.difficultyTag, predictedDifficulty === "easy" ? styles.difficultyTagEasy : styles.difficultyTagDiff]}>
                                                                                <Text style={[styles.difficultyTagText, predictedDifficulty === "easy" ? styles.difficultyTagTextEasy : styles.difficultyTagTextDiff]}>
                                                                                    {predictedDifficulty === "easy" ? "Easy" : "Difficult"}
                                                                                </Text>
                                                                            </View>
                                                                        ) : (
                                                                            <Text style={styles.dashText}>—</Text>
                                                                        )}
                                                                    </View>

                                                                    {/* Actual Difficulty */}
                                                                    <View style={[styles.tdCell, styles.colActual, styles.centerCell]}>
                                                                        {actualExperience ? (
                                                                            <View
                                                                                style={[
                                                                                    styles.difficultyTag,
                                                                                    actualExperience.toLowerCase() === "easy"
                                                                                        ? styles.difficultyTagEasy
                                                                                        : actualExperience.toLowerCase() === "exhausting"
                                                                                            ? styles.difficultyTagExhausting
                                                                                            : styles.difficultyTagDiff,
                                                                                ]}
                                                                            >
                                                                                <Text
                                                                                    style={[
                                                                                        styles.difficultyTagText,
                                                                                        actualExperience.toLowerCase() === "easy"
                                                                                            ? styles.difficultyTagTextEasy
                                                                                            : actualExperience.toLowerCase() === "exhausting"
                                                                                                ? styles.difficultyTagTextExhausting
                                                                                                : styles.difficultyTagTextDiff,
                                                                                    ]}
                                                                                >
                                                                                    {actualExperience.toLowerCase() === "exhausting"
                                                                                        ? "Exhausting"
                                                                                        : actualExperience.toLowerCase() === "easy"
                                                                                            ? "Easy"
                                                                                            : "Difficult"}
                                                                                </Text>
                                                                            </View>
                                                                        ) : (
                                                                            <Text style={styles.dashText}>—</Text>
                                                                        )}
                                                                    </View>

                                                                    {/* Physical Features */}
                                                                    {PHYSICAL_COLS.map((col) => (
                                                                        <View key={`easy-${col.key}`} style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                                                            <Text style={styles.featValueText}>
                                                                                {formatVal(easyFeat[col.key])}
                                                                            </Text>
                                                                        </View>
                                                                    ))}

                                                                    {/* Provinces */}
                                                                    {PROVINCES.map((p) => (
                                                                        <View key={`easy-prov-${p}`} style={[styles.tdCell, styles.colProv, styles.centerCell]}>
                                                                            <Text style={styles.featValueText}>
                                                                                {formatVal(easyFeat.province?.[p.toLowerCase()])}
                                                                            </Text>
                                                                        </View>
                                                                    ))}

                                                                    {/* Terrains */}
                                                                    {TERRAIN_COLS.map((col) => (
                                                                        <View key={`easy-terr-${col.key}`} style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                                            <Text style={styles.featValueText}>
                                                                                {formatVal(easyFeat.terrain?.[col.key])}
                                                                            </Text>
                                                                        </View>
                                                                    ))}

                                                                    {/* Circularity */}
                                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.circularity?.out_and_back)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.circularity?.traverse)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.circularity?.circular)}</Text>
                                                                    </View>

                                                                    {/* Water */}
                                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.waterforms?.fall)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.waterforms?.river)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.waterforms?.lake)}</Text>
                                                                    </View>

                                                                    {/* Tourism */}
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.tourism?.shelter)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.tourism?.resting)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.tourism?.information_board)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(easyFeat.tourism?.clean_water)}</Text>
                                                                    </View>
                                                                </View>

                                                                {/* SUB-ROW 2: DIFFICULT ANCHOR */}
                                                                <View style={[styles.subTableRow, styles.subTableRowDivider]}>
                                                                    {/* Anchor */}
                                                                    <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                                        <View style={styles.difficultBadge}>
                                                                            <Text style={styles.difficultBadgeText}>Difficult</Text>
                                                                        </View>
                                                                    </View>

                                                                    {/* Dist to GT */}
                                                                    <View style={[styles.tdCell, styles.colDist, styles.centerCell]}>
                                                                        <Text style={styles.distValueText}>
                                                                            {(cData.distances?.difficult?.gd ?? cData.distances?.diff?.gd ?? (cData.distances as any)?.diff_gd ?? 0).toFixed(4)}
                                                                        </Text>
                                                                    </View>

                                                                    {/* Spacer for Hiked Column */}
                                                                    <View style={[styles.tdCell, styles.colHiked]}>
                                                                        <Text style={styles.meanSummaryText}>
                                                                            Mean Cycle GD: {(cData.distances?.mean_gd ?? 0).toFixed(4)}
                                                                        </Text>
                                                                    </View>

                                                                    {/* Spacer for Predicted Column */}
                                                                    <View style={[styles.tdCell, styles.colPredicted, styles.centerCell]}>
                                                                        <Text style={styles.dashText}>—</Text>
                                                                    </View>

                                                                    {/* Spacer for Actual Column */}
                                                                    <View style={[styles.tdCell, styles.colActual, styles.centerCell]}>
                                                                        <Text style={styles.dashText}>—</Text>
                                                                    </View>

                                                                    {/* Physical Features */}
                                                                    {PHYSICAL_COLS.map((col) => (
                                                                        <View key={`diff-${col.key}`} style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                                                            <Text style={styles.featValueText}>
                                                                                {formatVal(diffFeat[col.key])}
                                                                            </Text>
                                                                        </View>
                                                                    ))}

                                                                    {/* Provinces */}
                                                                    {PROVINCES.map((p) => (
                                                                        <View key={`diff-prov-${p}`} style={[styles.tdCell, styles.colProv, styles.centerCell]}>
                                                                            <Text style={styles.featValueText}>
                                                                                {formatVal(diffFeat.province?.[p.toLowerCase()])}
                                                                            </Text>
                                                                        </View>
                                                                    ))}

                                                                    {/* Terrains */}
                                                                    {TERRAIN_COLS.map((col) => (
                                                                        <View key={`diff-terr-${col.key}`} style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                                            <Text style={styles.featValueText}>
                                                                                {formatVal(diffFeat.terrain?.[col.key])}
                                                                            </Text>
                                                                        </View>
                                                                    ))}

                                                                    {/* Circularity */}
                                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.circularity?.out_and_back)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.circularity?.traverse)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.circularity?.circular)}</Text>
                                                                    </View>

                                                                    {/* Water */}
                                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.waterforms?.fall)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.waterforms?.river)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.waterforms?.lake)}</Text>
                                                                    </View>

                                                                    {/* Tourism */}
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.tourism?.shelter)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.tourism?.resting)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.tourism?.information_board)}</Text>
                                                                    </View>
                                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                                        <Text style={styles.featValueText}>{formatVal(diffFeat.tourism?.clean_water)}</Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    );
                                                })}

                                                {/* 2. GROUND TRUTH PROFILE (PINNED AT THE BOTTOM) */}
                                                <View style={[styles.cycleBlock, styles.gtCycleBlock]}>
                                                    {/* Ground Truth Spanned Identifier */}
                                                    <View style={[styles.colCycle, styles.centerCell, { justifyContent: "center" }]}>
                                                        <View style={styles.gtBadge}>
                                                            <CustomIcon library="Feather" name="target" size={13} color={Palette.Green700} />
                                                            <Text style={styles.gtBadgeText}>Ground Truth</Text>
                                                        </View>
                                                        <Text style={styles.gtTargetSub}>Latent Target Profile</Text>
                                                    </View>

                                                    {/* Stacked Sub-rows in Column for Ground Truth */}
                                                    <View style={{ flexDirection: "column" }}>
                                                        {/* GROUND TRUTH EASY */}
                                                        <View style={styles.subTableRow}>
                                                            <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                                <View style={styles.easyGtBadge}>
                                                                    <Text style={styles.easyGtBadgeText}>Easy GT</Text>
                                                                </View>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colDist, styles.centerCell]}>
                                                                <Text style={styles.gtZeroDistText}>0.0000</Text>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colHiked]}>
                                                                <Text style={styles.gtTargetDescription}>
                                                                    Latent capability target ({gt?.seed ? `RNG Seed [${gt.seed[0]}, ${gt.seed[1]}]` : "Deterministic Standard"})
                                                                </Text>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colPredicted, styles.centerCell]}>
                                                                <Text style={styles.gtUncoveredText}>—</Text>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colActual, styles.centerCell]}>
                                                                <Text style={styles.gtUncoveredText}>—</Text>
                                                            </View>

                                                            {/* Physical GT values */}
                                                            {PHYSICAL_COLS.map((col) => (
                                                                <View key={`gt-easy-${col.key}`} style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                                                    <Text style={styles.gtFeatText}>
                                                                        {formatVal(gt.easy[col.key])}
                                                                    </Text>
                                                                </View>
                                                            ))}

                                                            {/* Provinces (uncovered by GT, dash) */}
                                                            {PROVINCES.map((p) => (
                                                                <View key={`gt-easy-p-${p}`} style={[styles.tdCell, styles.colProv, styles.centerCell]}>
                                                                    <Text style={styles.gtUncoveredText}>—</Text>
                                                                </View>
                                                            ))}

                                                            {/* Terrain GT values */}
                                                            {TERRAIN_COLS.map((col) => (
                                                                <View key={`gt-easy-terr-${col.key}`} style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                                    <Text style={styles.gtFeatText}>
                                                                        {formatVal(gt.easy[col.key])}
                                                                    </Text>
                                                                </View>
                                                            ))}

                                                            {/* Routes (uncovered) */}
                                                            <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>

                                                            {/* Water (uncovered) */}
                                                            <View style={[styles.tdCell, styles.colWater, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colWater, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colWater, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>

                                                            {/* Tourism (uncovered) */}
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                        </View>

                                                        {/* GROUND TRUTH DIFFICULT */}
                                                        <View style={[styles.subTableRow, styles.subTableRowDivider]}>
                                                            <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                                <View style={styles.diffGtBadge}>
                                                                    <Text style={styles.diffGtBadgeText}>Diff GT</Text>
                                                                </View>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colDist, styles.centerCell]}>
                                                                <Text style={styles.gtZeroDistText}>0.0000</Text>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colHiked]}>
                                                                <Text style={styles.gtTargetDescription}>
                                                                    Aspirational challenge target ({gt.medical_scale_factor ? `m = ${gt.medical_scale_factor.toFixed(2)}` : "unscaled"})
                                                                </Text>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colPredicted, styles.centerCell]}>
                                                                <Text style={styles.gtUncoveredText}>—</Text>
                                                            </View>

                                                            <View style={[styles.tdCell, styles.colActual, styles.centerCell]}>
                                                                <Text style={styles.gtUncoveredText}>—</Text>
                                                            </View>

                                                            {/* Physical GT values */}
                                                            {PHYSICAL_COLS.map((col) => (
                                                                <View key={`gt-diff-${col.key}`} style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                                                    <Text style={styles.gtFeatText}>
                                                                        {formatVal(gt.difficult[col.key])}
                                                                    </Text>
                                                                </View>
                                                            ))}

                                                            {/* Provinces (uncovered) */}
                                                            {PROVINCES.map((p) => (
                                                                <View key={`gt-diff-p-${p}`} style={[styles.tdCell, styles.colProv, styles.centerCell]}>
                                                                    <Text style={styles.gtUncoveredText}>—</Text>
                                                                </View>
                                                            ))}

                                                            {/* Terrain GT values */}
                                                            {TERRAIN_COLS.map((col) => (
                                                                <View key={`gt-diff-terr-${col.key}`} style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                                    <Text style={styles.gtFeatText}>
                                                                        {formatVal(gt.difficult[col.key])}
                                                                    </Text>
                                                                </View>
                                                            ))}

                                                            {/* Routes (uncovered) */}
                                                            <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>

                                                            {/* Water (uncovered) */}
                                                            <View style={[styles.tdCell, styles.colWater, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colWater, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colWater, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>

                                                            {/* Tourism (uncovered) */}
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                            <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}><Text style={styles.gtUncoveredText}>—</Text></View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </ScrollView>

                                    {/* Graphical Representation of Distance to Ground Truth across Cycles */}
                                    <View
                                        style={styles.chartSection}
                                        onLayout={(e) => {
                                            const w = e.nativeEvent.layout.width;
                                            if (w > 0 && Math.abs(w - chartContainerWidth) > 1) {
                                                setChartContainerWidth(w);
                                            }
                                        }}
                                    >
                                        <View style={styles.chartHeader}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <CustomIcon library="Feather" name="trending-down" size={14} color={Colors.PRIMARY} />
                                                <Text style={styles.chartTitle}>Gower Distance to Ground Truth Trajectory (Cycle 0 → Cycle {history.length - 1})</Text>
                                            </View>
                                            <View style={styles.chartLegend}>
                                                <View style={styles.legendItem}>
                                                    <View style={[styles.legendDot, { backgroundColor: Palette.Green700 }]} />
                                                    <Text style={styles.legendLabel}>Easy Anchor GD</Text>
                                                </View>
                                                <View style={styles.legendItem}>
                                                    <View style={[styles.legendDot, { backgroundColor: "#B45309" }]} />
                                                    <Text style={styles.legendLabel}>Difficult Anchor GD</Text>
                                                </View>
                                                <View style={styles.legendItem}>
                                                    <View style={[styles.legendDot, { backgroundColor: "#6366F1" }]} />
                                                    <Text style={styles.legendLabel}>Mean Cycle GD</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {(() => {
                                            const cyclesCount = history.length;
                                            if (cyclesCount === 0) return null;

                                            // Match parent width without side scrolling; default to 800 before layout measurement
                                            const availableWidth = Math.max(300, (chartContainerWidth > 0 ? chartContainerWidth - 32 : 800));
                                            const svgWidth = availableWidth;
                                            // Same height as the main screen chart (360px)
                                            const svgHeight = 360;
                                            const padLeft = 60;
                                            const padRight = 60;
                                            const padTop = 40;
                                            const padBottom = 50;
                                            const plotWidth = svgWidth - padLeft - padRight;
                                            const plotHeight = svgHeight - padTop - padBottom;

                                            // Collect all values to determine Y-axis scale (full Y-axis from origin to 0.250)
                                            const easyVals = history.map((c) => c.distances?.easy?.gd ?? (c.distances as any)?.easy_gd ?? 0);
                                            const diffVals = history.map((c) => c.distances?.difficult?.gd ?? (c.distances as any)?.diff_gd ?? 0);
                                            const meanVals = history.map((c) => c.distances?.mean_gd ?? 0);
                                            const allVals = [...easyVals, ...diffVals, ...meanVals];

                                            const rawMax = Math.max(...allVals, 0.250);
                                            const minVal = 0.0;
                                            const maxVal = Math.max(0.250, Math.ceil(rawMax * 20) / 20);
                                            const valRange = maxVal - minVal || 0.25;

                                            const getX = (idx: number) => {
                                                if (cyclesCount === 1) return padLeft + plotWidth / 2;
                                                return padLeft + (idx / (cyclesCount - 1)) * plotWidth;
                                            };

                                            const getY = (val: number) => {
                                                return padTop + plotHeight - ((val - minVal) / valRange) * plotHeight;
                                            };

                                            const easyPoints = history.map((_, i) => `${getX(i)},${getY(easyVals[i])}`).join(" ");
                                            const diffPoints = history.map((_, i) => `${getX(i)},${getY(diffVals[i])}`).join(" ");
                                            const meanPoints = history.map((_, i) => `${getX(i)},${getY(meanVals[i])}`).join(" ");

                                            // Y-axis grid ticks (steps of 0.050 from 0.000 to 0.250)
                                            const yTicks = [0.000, 0.050, 0.100, 0.150, 0.200, 0.250];
                                            if (maxVal > 0.250 && !yTicks.includes(maxVal)) {
                                                yTicks.push(maxVal);
                                            }

                                            return (
                                                <View style={{ width: "100%", alignItems: "center" }}>
                                                    <Svg width={svgWidth} height={svgHeight}>
                                                        {/* Background Grid Lines & Y-Axis Labels */}
                                                        {yTicks.map((tick, tIdx) => {
                                                            const yPos = getY(tick);
                                                            return (
                                                                <React.Fragment key={`ytick-${tIdx}`}>
                                                                    <Line
                                                                        x1={padLeft}
                                                                        y1={yPos}
                                                                        x2={svgWidth - padRight}
                                                                        y2={yPos}
                                                                        stroke={Palette.Neutral100}
                                                                        strokeWidth={1}
                                                                        strokeDasharray={tIdx === 0 ? undefined : "4,4"}
                                                                    />
                                                                    <SvgText
                                                                        x={padLeft - 8}
                                                                        y={yPos + 4}
                                                                        fontSize={10}
                                                                        fill={Colors.TEXT_MUTED}
                                                                        textAnchor="end"
                                                                    >
                                                                        {tick.toFixed(3)}
                                                                    </SvgText>
                                                                </React.Fragment>
                                                            );
                                                        })}

                                                        {/* X-Axis Vertical Reference Lines & Cycle Labels */}
                                                        {history.map((c, i) => {
                                                            const xPos = getX(i);
                                                            return (
                                                                <React.Fragment key={`xtick-${i}`}>
                                                                    <Line
                                                                        x1={xPos}
                                                                        y1={padTop}
                                                                        x2={xPos}
                                                                        y2={padTop + plotHeight}
                                                                        stroke={Palette.Neutral100}
                                                                        strokeWidth={1}
                                                                    />
                                                                    <SvgText
                                                                        x={xPos}
                                                                        y={padTop + plotHeight + 18}
                                                                        fontSize={10}
                                                                        fontWeight="bold"
                                                                        fill={Colors.TEXT_PRIMARY}
                                                                        textAnchor="middle"
                                                                    >
                                                                        {i === 0 ? "C0" : i === cyclesCount - 1 ? `C${i} (Final)` : `C${i}`}
                                                                    </SvgText>
                                                                    <SvgText
                                                                        x={xPos}
                                                                        y={padTop + plotHeight + 32}
                                                                        fontSize={9}
                                                                        fill={Colors.TEXT_MUTED}
                                                                        textAnchor="middle"
                                                                    >
                                                                        {c.month}
                                                                    </SvgText>
                                                                </React.Fragment>
                                                            );
                                                        })}

                                                        {/* Difficult Line */}
                                                        <Polyline
                                                            points={diffPoints}
                                                            fill="none"
                                                            stroke="#D97706"
                                                            strokeWidth={2.5}
                                                            strokeDasharray="5,4"
                                                        />

                                                        {/* Mean Line */}
                                                        <Polyline
                                                            points={meanPoints}
                                                            fill="none"
                                                            stroke="#6366F1"
                                                            strokeWidth={2}
                                                            strokeDasharray="2,2"
                                                        />

                                                        {/* Easy Line */}
                                                        <Polyline
                                                            points={easyPoints}
                                                            fill="none"
                                                            stroke={Palette.Green700}
                                                            strokeWidth={3}
                                                        />

                                                        {/* Plot Nodes & Value Callouts */}
                                                        {history.map((_, i) => {
                                                            const x = getX(i);
                                                            const yEasy = getY(easyVals[i]);
                                                            const yDiff = getY(diffVals[i]);
                                                            const yMean = getY(meanVals[i]);

                                                            return (
                                                                <React.Fragment key={`nodes-${i}`}>
                                                                    {/* Difficult Node */}
                                                                    <Circle cx={x} cy={yDiff} r={4} fill="#B45309" stroke={Colors.WHITE} strokeWidth={1.5} />
                                                                    <SvgText
                                                                        x={x}
                                                                        y={yDiff - 8}
                                                                        fontSize={10}
                                                                        fontWeight="bold"
                                                                        fill="#B45309"
                                                                        textAnchor="middle"
                                                                    >
                                                                        {diffVals[i].toFixed(4)}
                                                                    </SvgText>

                                                                    {/* Mean Node */}
                                                                    <Circle cx={x} cy={yMean} r={3.5} fill="#6366F1" stroke={Colors.WHITE} strokeWidth={1} />

                                                                    {/* Easy Node */}
                                                                    <Circle cx={x} cy={yEasy} r={5} fill={Palette.Green700} stroke={Colors.WHITE} strokeWidth={2} />
                                                                    <SvgText
                                                                        x={x}
                                                                        y={yEasy + 14}
                                                                        fontSize={11}
                                                                        fontWeight="bold"
                                                                        fill={Palette.Green700}
                                                                        textAnchor="middle"
                                                                    >
                                                                        {easyVals[i].toFixed(4)}
                                                                    </SvgText>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </Svg>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        {/* TAB 2: Formulation & Methodology Narrative */}
                        {activeTab === "formulation" && (
                            <ScrollView style={{ flex: 1, padding: 16 }}>
                                <View style={styles.narrativeCard}>
                                    <View style={styles.narrativeHeader}>
                                        <CustomIcon library="Feather" name="compass" size={18} color={Colors.PRIMARY} />
                                        <Text style={styles.cardBoxTitle}>Algorithmic Formulation Narrative</Text>
                                    </View>
                                    <Text style={styles.narrativeBody}>
                                        Cohort {user.id} belongs to experience tier {user.experience} ({user.experience === "E1" ? "Beginner Novice" : user.experience === "E2" ? "Experienced Gentle" : user.experience === "E3" ? "Intermediate Mixed" : "Advanced High-Altitude"}).
                                    </Text>
                                    <Text style={styles.narrativeBody}>
                                        {user.medicalProfile.hasCondition
                                            ? `• Medical Constraint Applied: User reports ${getMedicalConditionName(user)}. Under Decision D1, physical features (length, peak, gain, slope, Lasco) and terrains are scaled down by 0.80 to protect physiological safety. Route types, water forms, and tourism amenities remain unscaled.`
                                            : "• Healthy Baseline: No physiological conditions reported. Features use full unscaled calibrated anchors based purely on survey trail experience."}
                                    </Text>
                                    <Text style={styles.narrativeBody}>
                                        • Ticked Trails in Survey: {user.preferences.location.length > 0 ? user.preferences.location.join(", ") : "None (pure cold-start priors applied)."}.
                                    </Text>
                                    <Text style={styles.narrativeBody}>
                                        • Geographic Prior: Preferred province is {user.preferences.province.join(", ")}, which initializes preferred province dimensions to 0.85 and other provinces to 0.15.
                                    </Text>
                                </View>
                            </ScrollView>
                        )}

                        {/* TAB 3: Telemetry & Seed Metadata */}
                        {activeTab === "telemetry" && (
                            <ScrollView style={{ flex: 1, padding: 16 }}>
                                <View style={styles.telemetryCard}>
                                    <View style={styles.telemetryHeaderRow}>
                                        <CustomIcon library="Feather" name="cpu" size={16} color={Colors.PRIMARY} />
                                        <Text style={styles.telemetryHeaderTitle}>Ground Truth Sampling Telemetry</Text>
                                    </View>
                                    <View style={styles.telemetryGrid}>
                                        <View style={styles.telemetryItem}>
                                            <Text style={styles.telemetryLabel}>Deterministic RNG Seed</Text>
                                            <Text style={styles.telemetryVal}>
                                                {gt?.seed ? `[${gt.seed[0]}, ${gt.seed[1]}]` : "Standard Calibrated"}
                                            </Text>
                                        </View>
                                        <View style={styles.telemetryItem}>
                                            <Text style={styles.telemetryLabel}>Rejection Attempts</Text>
                                            <Text style={styles.telemetryVal}>{gt?.attempts ?? 1} try (passed gap ≥ 0.15)</Text>
                                        </View>
                                        <View style={styles.telemetryItem}>
                                            <Text style={styles.telemetryLabel}>Medical Scale Multiplier (m)</Text>
                                            <Text style={styles.telemetryVal}>
                                                {gt?.medical_scale_factor !== null && gt?.medical_scale_factor !== undefined
                                                    ? `m = ${gt.medical_scale_factor.toFixed(4)}`
                                                    : "Unscaled (1.000)"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>

                    {/* Modal Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.footerDoneBtn} onPress={onClose}>
                            <Text style={styles.footerDoneBtnText}>Close Inspection</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalContainer: {
        width: "98%",
        maxWidth: 1280,
        height: "92%",
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    modalHeader: {
        backgroundColor: Palette.Neutral25,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
        paddingTop: 16,
        paddingHorizontal: 20,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    userBadge: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    userBadgeText: {
        color: Colors.WHITE,
        fontWeight: "700",
        fontSize: 13,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    modalSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    convPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    convPillConverged: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green700,
    },
    convPillStable: {
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate300,
    },
    convPillText: {
        fontSize: 12,
        fontWeight: "600",
    },
    convPillTextConverged: {
        color: Palette.Green700,
    },
    convPillTextStable: {
        color: Palette.Slate700,
    },
    closeBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: Palette.Neutral100,
    },
    tabBar: {
        flexDirection: "row",
        gap: 6,
    },
    tabItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabItemActive: {
        borderBottomColor: Colors.PRIMARY,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "500",
        color: Colors.TEXT_SECONDARY,
    },
    tabTextActive: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    modalBody: {
        flex: 1,
        backgroundColor: Palette.Neutral50,
    },
    tabScroll: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    tabScrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    tableCard: {
        backgroundColor: Colors.WHITE,
    },
    tableLegendBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Palette.Neutral25,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
        gap: 2,
    },
    legendTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    legendSub: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    tableScroll: {},
    tableContainer: {
        flexDirection: "column",
        minWidth: 2400,
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Neutral50,
        borderBottomWidth: 2,
        borderBottomColor: Palette.Neutral100,
        paddingVertical: 10,
        alignItems: "center",
    },
    tableRowsContainer: {
        flexDirection: "column",
    },
    th: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        paddingHorizontal: 4,
    },
    centerText: {
        textAlign: "center",
    },
    centerCell: {
        alignItems: "center",
        justifyContent: "center",
    },
    cycleBlock: {
        flexDirection: "row",
        alignItems: "stretch",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
    },
    cycleBlockEven: {
        backgroundColor: Colors.WHITE,
    },
    cycleBlockOdd: {
        backgroundColor: Palette.Neutral25,
    },
    cycleBlockSelected: {
        backgroundColor: Palette.Blue50,
        borderLeftWidth: 4,
        borderLeftColor: Colors.PRIMARY,
    },
    gtCycleBlock: {
        backgroundColor: Palette.Green50,
        borderTopWidth: 2,
        borderTopColor: Palette.Green700,
        borderBottomWidth: 2,
        borderBottomColor: Palette.Green700,
    },
    subTableRow: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 38,
    },
    subTableRowDivider: {
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.04)",
    },
    tdCell: {
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    cycleBadge: {
        backgroundColor: Palette.Blue50,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 2,
    },
    cycleBadgeSelected: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    cycleBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    cycleBadgeTextSelected: {
        color: Colors.WHITE,
    },
    cycleMonthText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    cycleMonthTextSelected: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    gtBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Palette.Green100,
        borderWidth: 1,
        borderColor: Palette.Green700,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 2,
    },
    gtBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: Palette.Green700,
    },
    gtTargetSub: {
        fontSize: 12,
        color: Palette.Green800,
        fontWeight: "600",
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
        color: Palette.Amber900,
    },
    easyGtBadge: {
        backgroundColor: Palette.Green200,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: Palette.Green700,
    },
    easyGtBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: Palette.Green900,
    },
    diffGtBadge: {
        backgroundColor: Palette.Green200,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: Palette.Green700,
    },
    diffGtBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: Palette.Green900,
    },
    distValueText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
        fontVariant: ["tabular-nums"],
    },
    meanSummaryText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        fontStyle: "italic",
    },
    gtZeroDistText: {
        fontSize: 12,
        fontWeight: "800",
        color: Palette.Green800,
    },
    hikedNameText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    hikedReviewText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    noHikeText: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
        fontStyle: "italic",
    },
    gtTargetDescription: {
        fontSize: 12,
        fontWeight: "600",
        color: Palette.Green900,
    },
    featValueText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontVariant: ["tabular-nums"],
        textAlign: "center",
    },
    gtFeatText: {
        fontSize: 12,
        fontWeight: "800",
        color: Palette.Green900,
        fontVariant: ["tabular-nums"],
        textAlign: "center",
    },
    gtUncoveredText: {
        fontSize: 12,
        color: Palette.Neutral400,
        textAlign: "center",
    },
    narrativeCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        padding: 16,
    },
    narrativeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    cardBoxTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    narrativeBody: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 10,
    },
    telemetryCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        padding: 16,
    },
    telemetryHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    telemetryHeaderTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    telemetryGrid: {
        flexDirection: "row",
        gap: 12,
    },
    telemetryItem: {
        flex: 1,
        backgroundColor: Palette.Neutral25,
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    telemetryLabel: {
        fontSize: 12,
        color: Colors.TEXT_MUTED,
    },
    telemetryVal: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
    },
    modalFooter: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: Palette.Neutral100,
        backgroundColor: Palette.Neutral25,
        alignItems: "flex-end",
    },
    footerDoneBtn: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    footerDoneBtnText: {
        color: Colors.WHITE,
        fontWeight: "700",
        fontSize: 13,
    },
    // Chart Styles
    chartSection: {
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Palette.Neutral100,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        marginTop: 12,
    },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "wrap",
        gap: 8,
    },
    chartTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    chartLegend: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },
    legendLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    // Difficulty Tag Styles (Predicted & Actual)
    difficultyTag: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    difficultyTagEasy: {
        backgroundColor: Palette.Green100,
    },
    difficultyTagDiff: {
        backgroundColor: Palette.Amber100,
    },
    difficultyTagExhausting: {
        backgroundColor: Palette.Red100,
    },
    difficultyTagText: {
        fontSize: 10,
        fontWeight: "700",
    },
    difficultyTagTextEasy: {
        color: Palette.Green700,
    },
    difficultyTagTextDiff: {
        color: Palette.Amber900,
    },
    difficultyTagTextExhausting: {
        color: Palette.Red800,
    },
    // Match / Mismatch Inline Badges
    matchBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
    },
    matchBadgeText: {
        fontSize: 9,
        fontWeight: "700",
    },
    matchBadgeSuccess: {
        backgroundColor: Palette.Green100,
    },
    matchBadgeSuccessText: {
        fontSize: 9,
        fontWeight: "700",
        color: Palette.Green800,
    },
    mismatchBadge: {
        backgroundColor: Palette.Red100,
    },
    mismatchBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: Palette.Red800,
    },
    dashText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    // Column Widths
    colCycle: { width: 175, paddingHorizontal: 6 },
    colAnchor: { width: 90, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
    colDist: { width: 105, textAlign: "center" },
    colHiked: { width: 240, paddingHorizontal: 6 },
    colPredicted: { width: 85, textAlign: "center" },
    colActual: { width: 85, textAlign: "center" },
    colNum: { width: 85, textAlign: "center" },
    colProv: { width: 70, textAlign: "center" },
    colTerrain: { width: 70, textAlign: "center" },
    colCirc: { width: 75, textAlign: "center" },
    colWater: { width: 65, textAlign: "center" },
    colTourism: { width: 75, textAlign: "center" },
});
