/**
 * @file SimulationDataset.tsx
 * @description Dataset table viewer for THARESYS 24 simulated user cohorts.
 * Adheres strictly to the identical table architecture, column layout, and styling as UserDataset.tsx:
 *  - Spanned # column and Spanned User column as direct flex children of userBlock.
 *  - Vertical column containing two sub-rows: Easy Anchor & Difficult Anchor.
 *  - Spanned Action column as direct flex child of userBlock with Inspect button.
 *  - Interactive simulation cycle progression selector (dynamically generated from simulated dataset history).
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import React, { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import simulatedUsersData from "../data/simulatedUsers.json";
import SimulationConvergenceChart from "./SimulationConvergenceChart";
import SimulatedUserModal, { ISimulatedUser } from "./SimulatedUserModal";
import SimulationTrailDataset from "./SimulationTrailDataset";
import cycleTrailsData from "../data/cycleSimulationTrails.json";
import catalogTrailsData from "../data/trailSimulationCatalog.json";

const PROVINCES = ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"] as const;

export interface ICycleInfo {
    idx: number;
    label: string;
    month: string;
    desc: string;
}

export default function SimulationDataset() {
    const allUsers: ISimulatedUser[] = (simulatedUsersData as unknown) as ISimulatedUser[];

    // Dynamically derive cycle steps from the dataset history (scales automatically to 3, 5, or N cycles)
    const cycles: ICycleInfo[] = useMemo(() => {
        const firstUser = allUsers[0];
        if (firstUser?.cycleHistory && firstUser.cycleHistory.length > 0) {
            const total = firstUser.cycleHistory.length;
            return firstUser.cycleHistory.map((h, idx) => ({
                idx: h.cycle ?? idx,
                month: h.month || "",
                label: `C${idx}`,
                desc:
                    idx === 0
                        ? "Cold-Start Survey Baseline"
                        : idx === total - 1
                            ? "Terminal Converged State"
                            : `After Month ${idx} Review`,
            }));
        }
        return [
            { idx: 0, label: "C0", month: "2026-10", desc: "Cold-Start Survey Baseline" },
        ];
    }, [allUsers]);

    const [viewMode, setViewMode] = useState<"users" | "trails">("users");
    const [selectedCycle, setSelectedCycle] = useState<number>(0);
    const safeSelectedCycle = Math.min(selectedCycle, Math.max(0, cycles.length - 1));
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExp, setSelectedExp] = useState<string>("ALL");
    const [selectedMed, setSelectedMed] = useState<string>("ALL");
    const [selectedProv, setSelectedProv] = useState<string>("ALL");
    const [inspectingUser, setInspectingUser] = useState<ISimulatedUser | null>(null);

    const totalSimTrailsCount = useMemo(() => {
        const rLen = Array.isArray(cycleTrailsData) ? cycleTrailsData.length : 8;
        const cRaw = (catalogTrailsData as any)?.trails || catalogTrailsData;
        const cList = Array.isArray(cRaw) ? cRaw : [];
        const synthOnly = cList.filter((t: any) => t.synthetic !== false && t.source !== 'real');
        return rLen + synthOnly.length;
    }, []);

    const filteredUsers = useMemo(() => {
        return allUsers.filter((u) => {
            if (selectedExp !== "ALL" && u.experience !== selectedExp) return false;
            if (selectedMed !== "ALL" && u.medical !== selectedMed) return false;
            if (selectedProv !== "ALL" && u.province_pattern !== selectedProv) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchId = u.id.toLowerCase().includes(q);
                const matchExp = u.experience.toLowerCase().includes(q);
                const matchProv = u.preferences.province.some((p) => p.toLowerCase().includes(q));
                const matchLoc = u.preferences.location.some((l) => l.toLowerCase().includes(q));
                if (!matchId && !matchExp && !matchProv && !matchLoc) return false;
            }

            return true;
        });
    }, [allUsers, selectedExp, selectedMed, selectedProv, searchQuery]);

    const formatVal = (val: any): string => {
        const num = Number(val);
        if (isNaN(num)) return "0.00";
        return num.toFixed(2);
    };

    const activeCycleInfo = cycles[safeSelectedCycle] || cycles[0];

    return (
        <View style={styles.container}>
            {/* Top View Mode Switcher: Simulated Users vs Simulation Trail Database */}
            <View style={styles.viewModeHeader}>
                <View style={styles.viewModeSwitcher}>
                    <TouchableOpacity
                        style={[
                            styles.viewModeTab,
                            viewMode === "users" && styles.viewModeTabActive,
                        ]}
                        onPress={() => setViewMode("users")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="users"
                            size={15}
                            color={viewMode === "users" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text
                            style={[
                                styles.viewModeLabel,
                                viewMode === "users" && styles.viewModeLabelActive,
                            ]}
                        >
                            Simulated Users
                        </Text>
                        <View
                            style={[
                                styles.viewModeBadge,
                                viewMode === "users" && styles.viewModeBadgeActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.viewModeBadgeText,
                                    viewMode === "users" && styles.viewModeBadgeTextActive,
                                ]}
                            >
                                {allUsers.length}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.viewModeTab,
                            viewMode === "trails" && styles.viewModeTabActive,
                        ]}
                        onPress={() => setViewMode("trails")}
                    >
                        <CustomIcon
                            library="Feather"
                            name="map"
                            size={15}
                            color={viewMode === "trails" ? Colors.WHITE : Colors.TEXT_SECONDARY}
                        />
                        <Text
                            style={[
                                styles.viewModeLabel,
                                viewMode === "trails" && styles.viewModeLabelActive,
                            ]}
                        >
                            Simulation Trail Database
                        </Text>
                        <View
                            style={[
                                styles.viewModeBadge,
                                viewMode === "trails" && styles.viewModeBadgeActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.viewModeBadgeText,
                                    viewMode === "trails" && styles.viewModeBadgeTextActive,
                                ]}
                            >
                                {totalSimTrailsCount}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === "trails" ? (
                <SimulationTrailDataset />
            ) : (
                <ScrollView
                    style={styles.usersScrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {/* Filter & Cycle Selection Controls */}
                    <View style={styles.filterBar}>
                        {/* Search Box */}
                        <View style={styles.searchBox}>
                            <CustomIcon library="Feather" name="search" size={16} color={Colors.GRAY} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search simulated cohort (e.g. E2-M-P1), trail name, province..."
                                placeholderTextColor={Colors.TEXT_MUTED}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <CustomIcon library="Feather" name="x" size={14} color={Colors.GRAY} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Simulation Cycle Progression Selector Strip */}
                        <View style={styles.cycleSelectorRow}>
                                <Text style={styles.cycleSelectorLabel}>CYCLE:</Text>
                                <ScrollView
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={true}
                                    style={styles.cycleScrollView}
                                    contentContainerStyle={styles.cyclePillsContainer}
                                >
                                    {cycles.map((c) => (
                                        <TouchableOpacity
                                            key={`cycle-btn-${c.idx}`}
                                            style={[
                                                styles.cycleSelectPill,
                                                safeSelectedCycle === c.idx && styles.cycleSelectPillActive,
                                            ]}
                                            onPress={() => setSelectedCycle(c.idx)}
                                        >
                                            <CustomIcon
                                                library="Feather"
                                                name={
                                                    c.idx === 0
                                                        ? "play-circle"
                                                        : c.idx === cycles.length - 1
                                                            ? "check-circle"
                                                            : "arrow-right-circle"
                                                }
                                                size={12}
                                                color={safeSelectedCycle === c.idx ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                            />
                                            <Text
                                                style={[
                                                    styles.cycleSelectPillText,
                                                    safeSelectedCycle === c.idx && styles.cycleSelectPillTextActive,
                                                ]}
                                            >
                                                C{c.idx}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                        </ScrollView>
                    </View>

                    {/* Filter Pills */}
                    <View style={styles.filterPillsRow}>
                        <Text style={styles.filterRowLabel}>Experience:</Text>
                        {["ALL", "E1", "E2", "E3", "E4"].map((tier) => (
                            <TouchableOpacity
                                key={tier}
                                style={[styles.filterPill, selectedExp === tier && styles.filterPillActive]}
                                onPress={() => setSelectedExp(tier)}
                            >
                                <Text
                                    style={[
                                        styles.filterPillText,
                                        selectedExp === tier && styles.filterPillTextActive,
                                    ]}
                                >
                                    {tier}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.filterPillDivider} />
                        <Text style={styles.filterRowLabel}>Medical:</Text>
                        {["ALL", "M", "N"].map((med) => (
                            <TouchableOpacity
                                key={med}
                                style={[styles.filterPill, selectedMed === med && styles.filterPillActive]}
                                onPress={() => setSelectedMed(med)}
                            >
                                <Text
                                    style={[
                                        styles.filterPillText,
                                        selectedMed === med && styles.filterPillTextActive,
                                    ]}
                                >
                                    {med === "ALL" ? "ALL" : med === "M" ? "Condition (M)" : "Healthy (N)"}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.filterPillDivider} />
                        <Text style={styles.filterRowLabel}>Province:</Text>
                        {["ALL", "P1", "P2", "P3"].map((prov) => (
                            <TouchableOpacity
                                key={prov}
                                style={[styles.filterPill, selectedProv === prov && styles.filterPillActive]}
                                onPress={() => setSelectedProv(prov)}
                            >
                                <Text
                                    style={[
                                        styles.filterPillText,
                                        selectedProv === prov && styles.filterPillTextActive,
                                    ]}
                                >
                                    {prov}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            {/* Cycle Status Banner */}
            <View style={styles.cycleBanner}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <CustomIcon library="Feather" name="activity" size={16} color={Colors.PRIMARY} />
                    <Text style={styles.cycleBannerTitle}>
                        Viewing Profile States at {activeCycleInfo.label} — {activeCycleInfo.desc} ({activeCycleInfo.month})
                    </Text>
                </View>
                <Text style={styles.cycleBannerSub}>
                    Showing vectors as updated by the monthly profile update engine. Tapping any cohort inspects the full cycle-by-cycle trajectory.
                </Text>
            </View>

            {/* Global Convergence Chart Across All 24 Profiles */}
            <SimulationConvergenceChart
                users={allUsers}
                cycles={cycles}
                selectedCycle={safeSelectedCycle}
                onSelectCycle={(cIdx) => setSelectedCycle(cIdx)}
            />

            {/* Table Card strictly matching UserDataset.tsx architecture */}
            {filteredUsers.length === 0 ? (
                <View style={styles.centerContainer}>
                    <CustomIcon library="Feather" name="users" size={36} color={Colors.TEXT_SECONDARY} />
                    <Text style={styles.emptyTitle}>No Simulated Users Found</Text>
                    <Text style={styles.emptySubtitle}>
                        {searchQuery ? `No cohorts matching "${searchQuery}"` : "No cohorts match this filter"}
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
                                <Text style={[styles.th, styles.colUser]}>Simulated User</Text>
                                <Text style={[styles.th, styles.colAnchor, styles.centerText]}>Anchor</Text>
                                <Text style={[styles.th, styles.colClass, styles.centerText]}>Class</Text>
                                <Text style={[styles.th, styles.colLasco, styles.centerText]}>Lasco / Easy</Text>
                                <Text style={[styles.th, styles.colNumber, styles.centerText]}>Length (km)</Text>
                                <Text style={[styles.th, styles.colNumber, styles.centerText]}>Peak (MASL)</Text>
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
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Rest</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Info</Text>
                                <Text style={[styles.th, styles.colTourism, styles.centerText]}>Clean Water</Text>

                                <Text style={[styles.th, styles.colAction, styles.centerText]}>Action</Text>
                            </View>

                            {/* Table Rows Body Container */}
                            <View style={styles.tableRowsContainer}>
                                {/* User Blocks matching UserDataset.tsx structure */}
                                {filteredUsers.map((user, uIdx) => {
                                    const cycleData = user.cycleHistory?.[safeSelectedCycle];
                                    const activeProfile = cycleData?.profile || user.profile;

                                    const easyFeat = activeProfile.easy?.features || {};
                                    const diffFeat = activeProfile.difficult?.features || {};

                                    const isEven = uIdx % 2 === 0;

                                    return (
                                        <View key={user.id} style={[styles.userBlock, isEven ? styles.rowEven : styles.rowOdd]}>
                                            {/* 1. Spanned Index Column */}
                                            <View style={[styles.colIndex, styles.centerCell, { justifyContent: "center" }]}>
                                                <Text style={styles.tdText}>{uIdx + 1}</Text>
                                            </View>

                                            {/* 2. Spanned User Column */}
                                            <TouchableOpacity
                                                style={[styles.colUser, { justifyContent: "center" }]}
                                                activeOpacity={0.7}
                                                onPress={() => setInspectingUser(user)}
                                            >
                                                <View style={styles.userInfoRow}>
                                                    <View style={styles.userAvatar}>
                                                        <CustomIcon library="Feather" name="user" size={13} color={Colors.PRIMARY} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.nameCell} numberOfLines={1}>
                                                            {user.id}
                                                        </Text>
                                                        <View style={styles.badgeRow}>
                                                            <View style={styles.expPill}>
                                                                <Text style={styles.expPillText}>{user.experience}</Text>
                                                            </View>
                                                            <View
                                                                style={[
                                                                    styles.medPill,
                                                                    user.medicalProfile.hasCondition ? styles.medPillHas : styles.medPillNone,
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.medPillText,
                                                                        user.medicalProfile.hasCondition
                                                                            ? styles.medPillTextHas
                                                                            : styles.medPillTextNone,
                                                                    ]}
                                                                >
                                                                    {user.medicalProfile.hasCondition ? "MED" : "HLT"}
                                                                </Text>
                                                            </View>
                                                            {user.convergence && (
                                                                <View
                                                                    style={[
                                                                        styles.convergencePill,
                                                                        user.convergence.has_converged
                                                                            ? styles.convergencePillConv
                                                                            : styles.convergencePillStable,
                                                                    ]}
                                                                >
                                                                    <Text
                                                                        style={[
                                                                            styles.convergencePillText,
                                                                            user.convergence.has_converged
                                                                                ? styles.convergencePillTextConv
                                                                                : styles.convergencePillTextStable,
                                                                        ]}
                                                                    >
                                                                        {user.convergence.has_converged
                                                                            ? `ΔGD: ${user.convergence.delta_gd.toFixed(3)}`
                                                                            : `ΔGD: +${user.convergence.delta_gd.toFixed(3)}`}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            {/* 3. Stacked Sub-Rows Column (Easy Anchor & Difficult Anchor) */}
                                            <View style={{ flexDirection: "column" }}>
                                                {/* SUB-ROW 1: EASY ANCHOR */}
                                                <View style={styles.subTableRow}>
                                                    {/* Anchor Column */}
                                                    <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                        <View style={styles.easyBadge}>
                                                            <Text style={styles.easyBadgeText}>Easy</Text>
                                                        </View>
                                                    </View>

                                                    {/* Classification */}
                                                    <View style={[styles.tdCell, styles.colClass, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.classification)}</Text>
                                                    </View>

                                                    {/* Lasco / Easy */}
                                                    <View style={[styles.tdCell, styles.colLasco, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.easy)}</Text>
                                                    </View>

                                                    {/* Length */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.length)}</Text>
                                                    </View>

                                                    {/* Peak MASL */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.elevation)}</Text>
                                                    </View>

                                                    {/* Gain */}
                                                    <View style={[styles.tdCell, styles.colGain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.gain)}</Text>
                                                    </View>

                                                    {/* Slope */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.slope)}</Text>
                                                    </View>

                                                    {/* Provinces */}
                                                    {PROVINCES.map((p) => (
                                                        <View key={`easy-p-${p}`} style={[styles.tdCell, styles.colProvince, styles.centerCell]}>
                                                            <Text style={styles.tdValueText}>{formatVal(easyFeat.province?.[p.toLowerCase()])}</Text>
                                                        </View>
                                                    ))}

                                                    {/* Terrains */}
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.terrain?.muddy)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.terrain?.rocky)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.terrain?.grassland)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.terrain?.ridges)}</Text>
                                                    </View>

                                                    {/* Circularity */}
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.circularity?.out_and_back)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.circularity?.traverse)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.circularity?.circular)}</Text>
                                                    </View>

                                                    {/* Waterforms */}
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.waterforms?.fall)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.waterforms?.river)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.waterforms?.lake)}</Text>
                                                    </View>

                                                    {/* Tourism */}
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.tourism?.shelter)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.tourism?.resting)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.tourism?.information_board)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(easyFeat.tourism?.clean_water)}</Text>
                                                    </View>
                                                </View>

                                                {/* SUB-ROW 2: DIFFICULT ANCHOR */}
                                                <View style={[styles.subTableRow, styles.subTableRowDivider]}>
                                                    {/* Anchor Column */}
                                                    <View style={[styles.colAnchor, styles.centerCell, { justifyContent: "center" }]}>
                                                        <View style={styles.difficultBadge}>
                                                            <Text style={styles.difficultBadgeText}>Difficult</Text>
                                                        </View>
                                                    </View>

                                                    {/* Classification */}
                                                    <View style={[styles.tdCell, styles.colClass, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.classification)}</Text>
                                                    </View>

                                                    {/* Lasco / Easy */}
                                                    <View style={[styles.tdCell, styles.colLasco, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.easy)}</Text>
                                                    </View>

                                                    {/* Length */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.length)}</Text>
                                                    </View>

                                                    {/* Peak MASL */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.elevation)}</Text>
                                                    </View>

                                                    {/* Gain */}
                                                    <View style={[styles.tdCell, styles.colGain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.gain)}</Text>
                                                    </View>

                                                    {/* Slope */}
                                                    <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.slope)}</Text>
                                                    </View>

                                                    {/* Provinces */}
                                                    {PROVINCES.map((p) => (
                                                        <View key={`diff-p-${p}`} style={[styles.tdCell, styles.colProvince, styles.centerCell]}>
                                                            <Text style={styles.tdValueText}>{formatVal(diffFeat.province?.[p.toLowerCase()])}</Text>
                                                        </View>
                                                    ))}

                                                    {/* Terrains */}
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.terrain?.muddy)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.terrain?.rocky)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.terrain?.grassland)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.terrain?.ridges)}</Text>
                                                    </View>

                                                    {/* Circularity */}
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.circularity?.out_and_back)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.circularity?.traverse)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.circularity?.circular)}</Text>
                                                    </View>

                                                    {/* Waterforms */}
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.waterforms?.fall)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.waterforms?.river)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.waterforms?.lake)}</Text>
                                                    </View>

                                                    {/* Tourism */}
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.tourism?.shelter)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.tourism?.resting)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.tourism?.information_board)}</Text>
                                                    </View>
                                                    <View style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                        <Text style={styles.tdValueText}>{formatVal(diffFeat.tourism?.clean_water)}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* 4. Spanned Action Column */}
                                            <View style={[styles.colAction, styles.centerCell, { justifyContent: "center" }]}>
                                                <TouchableOpacity
                                                    style={styles.inspectBtn}
                                                    onPress={() => setInspectingUser(user)}
                                                >
                                                    <CustomIcon library="Feather" name="eye" size={13} color={Colors.WHITE} />
                                                    <Text style={styles.inspectBtnText}>Inspect</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    )
}

{/* Modal for Simulated User Deep-Dive */ }
{
    inspectingUser && (
        <SimulatedUserModal
            visible={!!inspectingUser}
            user={inspectingUser}
            initialCycle={safeSelectedCycle}
            onClose={() => setInspectingUser(null)}
        />
    )
}
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    viewModeHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
    },
    viewModeSwitcher: {
        flexDirection: "row",
        backgroundColor: Palette.Slate100,
        borderRadius: 10,
        padding: 4,
        gap: 6,
    },
    viewModeTab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    viewModeTabActive: {
        backgroundColor: Colors.PRIMARY,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    viewModeLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    viewModeLabelActive: {
        color: Colors.WHITE,
        fontWeight: "700",
    },
    viewModeBadge: {
        backgroundColor: Palette.Slate200,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    viewModeBadgeActive: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    viewModeBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_SECONDARY,
    },
    viewModeBadgeTextActive: {
        color: Colors.WHITE,
    },
    usersScrollContainer: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 60,
    },
    filterBar: {
        padding: 16,
        backgroundColor: Palette.Neutral25,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
        gap: 12,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        paddingVertical: 0,
    },
    cycleSelectorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        width: "100%",
    },
    cycleSelectorLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        letterSpacing: 0.3,
    },
    cycleScrollView: {
        flex: 1,
    },
    cyclePillsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 4,
    },
    cycleSelectPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    cycleSelectPillActive: {
        backgroundColor: Palette.Blue50,
        borderColor: Colors.PRIMARY,
    },
    cycleSelectPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    cycleSelectPillTextActive: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    filterPillsRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
    },
    filterRowLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
        marginRight: 2,
    },
    filterPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    filterPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: "500",
        color: Colors.TEXT_PRIMARY,
    },
    filterPillTextActive: {
        color: Colors.WHITE,
        fontWeight: "600",
    },
    filterPillDivider: {
        width: 1,
        height: 18,
        backgroundColor: Palette.Neutral100,
        marginHorizontal: 4,
    },
    cycleBanner: {
        backgroundColor: Palette.Blue50,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Blue100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 4,
    },
    cycleBannerTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    cycleBannerSub: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
    },
    tableCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        marginHorizontal: 16,
        marginBottom: 32,
        overflow: "hidden",
    },
    tableScroll: {
        width: "100%",
    },
    table: {
        flexDirection: "column",
        minWidth: 2600,
    },
    tableRowsContainer: {
        flexDirection: "column",
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Neutral50,
        borderBottomWidth: 2,
        borderBottomColor: Palette.Neutral100,
        paddingVertical: 10,
        alignItems: "center",
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
    userBlock: {
        flexDirection: "row",
        alignItems: "stretch",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
    },
    rowEven: {
        backgroundColor: Colors.WHITE,
    },
    rowOdd: {
        backgroundColor: Palette.Neutral25,
    },
    subTableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    subTableRowDivider: {
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.04)",
    },
    tdCell: {
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    tdText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    tdValueText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontVariant: ["tabular-nums"],
    },
    userInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 4,
    },
    userAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Palette.Blue50,
        alignItems: "center",
        justifyContent: "center",
    },
    nameCell: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    badgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
        flexWrap: "wrap",
    },
    expPill: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
    },
    expPillText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: "700",
    },
    medPill: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
    },
    medPillHas: {
        backgroundColor: Palette.Red50,
    },
    medPillNone: {
        backgroundColor: Palette.Green50,
    },
    medPillText: {
        fontSize: 12,
        fontWeight: "700",
    },
    medPillTextHas: {
        color: Colors.ERROR,
    },
    medPillTextNone: {
        color: Palette.Green700,
    },
    convergencePill: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
    },
    convergencePillConv: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green700,
    },
    convergencePillStable: {
        backgroundColor: Palette.Slate100,
    },
    convergencePillText: {
        fontSize: 12,
        fontWeight: "700",
    },
    convergencePillTextConv: {
        color: Palette.Green700,
    },
    convergencePillTextStable: {
        color: Palette.Slate700,
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
    inspectBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    inspectBtnText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: "600",
    },
    // Column Widths strictly aligned with UserDataset.tsx
    colIndex: { width: 45, textAlign: "center" },
    colUser: { width: 230, paddingHorizontal: 6 },
    colAnchor: { width: 115, paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
    colClass: { width: 90 },
    colLasco: { width: 85 },
    colNumber: { width: 105 },
    colGain: { width: 135 },
    colProvince: { width: 75 },
    colTerrain: { width: 70 },
    colCirc: { width: 80 },
    colWater: { width: 65 },
    colTourism: { width: 85 },
    colAction: { width: 120, alignItems: "center", justifyContent: "center" },
});
