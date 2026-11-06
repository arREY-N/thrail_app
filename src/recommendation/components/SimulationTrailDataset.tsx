/**
 * @file SimulationTrailDataset.tsx
 * @description Dataset viewer for THARESYS Simulation Trails:
 *  - Real Trails (Cycle Simulation - 8 Trails)
 *  - Synthetic Catalog Trails (Trail Simulation - 40 Trails)
 * Provides comprehensive 32-dimensional normalized vector breakdown, raw physical metrics,
 * source catalog filtering, and detailed inspection modal.
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import React, { useMemo, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import cycleTrailsData from "../data/cycleSimulationTrails.json";
import catalogTrailsData from "../data/trailSimulationCatalog.json";

export interface ISimulationTrail {
    id: string;
    source: "real" | "synthetic";
    name: string;
    province: string;
    classification: string;
    lascoRating: number;
    tier?: string;
    raw: {
        length: number;
        elevation: number;
        gain: number;
        slope: number;
        lascoRating: number;
        classification?: string | number;
    };
    profile: {
        features: {
            classification: number;
            easy: number;
            length: number;
            elevation: number;
            gain: number;
            slope: number;
            province: Record<string, number>;
            terrain: Record<string, number>;
            circularity: Record<string, number>;
            waterforms: Record<string, number>;
            tourism: Record<string, number>;
        };
    };
}

const PROVINCES = ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"] as const;
const TERRAIN_KEYS = ["muddy", "rocky", "grassland", "ridges"] as const;
const CIRCULARITY_KEYS = ["out_and_back", "traverse", "circular"] as const;
const WATER_KEYS = ["fall", "river", "lake"] as const;
const TOURISM_KEYS = [
    { key: "shelter", label: "Shelter" },
    { key: "resting", label: "Resting" },
    { key: "information_board", label: "Info Board" },
    { key: "clean_water", label: "Clean Water" },
    { key: "monument", label: "Monument" },
    { key: "community", label: "Community" },
    { key: "viewpoint", label: "Viewpoint" },
    { key: "network_connection", label: "Network" },
] as const;

export default function SimulationTrailDataset() {
    const [sourceFilter, setSourceFilter] = useState<"ALL" | "real" | "synthetic">("ALL");
    const [selectedProvince, setSelectedProvince] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [inspectingTrail, setInspectingTrail] = useState<ISimulationTrail | null>(null);

    // Normalize and combine both datasets
    const allTrails: ISimulationTrail[] = useMemo(() => {
        const combined: ISimulationTrail[] = [];

        // 1. Real Trails (Cycle Simulation - 8 Trails)
        const realList = Array.isArray(cycleTrailsData) ? cycleTrailsData : [];
        realList.forEach((t: any) => {
            const rawDiff = t.difficulty || {};
            const rawGeo = t.geography || {};
            const feats = t.profile?.features || {};
            combined.push({
                id: t.id,
                source: "real",
                name: t.general?.name || t.name || t.id,
                province: rawGeo.province || "Calabarzon",
                classification: rawDiff.classification || "Minor",
                lascoRating: rawDiff.lascoRating || 3,
                tier: rawDiff.classification?.toLowerCase() === "major" ? "Tier 3 (Major)" : "Tier 1 (Minor)",
                raw: {
                    length: Number(rawDiff.length || 0),
                    elevation: Number(rawGeo.masl || rawDiff.elevation || 0),
                    gain: Number(rawDiff.gain || 0),
                    slope: Number(rawDiff.slope || 0),
                    lascoRating: Number(rawDiff.lascoRating || 3),
                    classification: rawDiff.classification || "Minor",
                },
                profile: {
                    features: {
                        classification: Number(feats.classification || 0),
                        easy: Number(feats.easy || 0),
                        length: Number(feats.length || 0),
                        elevation: Number(feats.elevation || 0),
                        gain: Number(feats.gain || 0),
                        slope: Number(feats.slope || 0),
                        province: feats.province || {},
                        terrain: feats.terrain || {},
                        circularity: feats.circularity || {},
                        waterforms: feats.waterforms || {},
                        tourism: feats.tourism || {},
                    },
                },
            });
        });

        // 2. Synthetic Catalog Trails (Trail Simulation)
        const catalogRaw = (catalogTrailsData as any)?.trails || catalogTrailsData;
        const catalogList = Array.isArray(catalogRaw) ? catalogRaw : [];
        const realIds = new Set(realList.map((r: any) => String(r.id)));
        catalogList.forEach((t: any) => {
            if (realIds.has(String(t.id)) || t.synthetic === false || t.source === 'real') {
                return;
            }
            const rawInfo = t.raw || {};
            const rawDiff = t.difficulty || {};
            const rawGeo = t.geography || {};
            const feats = t.profile?.features || {};
            combined.push({
                id: t.id,
                source: "synthetic",
                name: t.general?.name || t.name || t.id,
                province: rawGeo.province || "Calabarzon",
                classification: rawDiff.classification || (t.tier?.includes("Major") ? "Major" : "Minor"),
                lascoRating: Number(rawInfo.lascoRating || rawDiff.lascoRating || 4),
                tier: t.tier || "Synthetic",
                raw: {
                    length: Number(rawInfo.length || rawDiff.length || 0),
                    elevation: Number(rawInfo.elevation || rawGeo.masl || rawDiff.elevation || 0),
                    gain: Number(rawInfo.gain || rawDiff.gain || 0),
                    slope: Number(rawInfo.slope || rawDiff.slope || 0),
                    lascoRating: Number(rawInfo.lascoRating || rawDiff.lascoRating || 4),
                    classification: rawInfo.classification || rawDiff.classification || "Minor",
                },
                profile: {
                    features: {
                        classification: Number(feats.classification || 0),
                        easy: Number(feats.easy || 0),
                        length: Number(feats.length || 0),
                        elevation: Number(feats.elevation || 0),
                        gain: Number(feats.gain || 0),
                        slope: Number(feats.slope || 0),
                        province: feats.province || {},
                        terrain: feats.terrain || {},
                        circularity: feats.circularity || {},
                        waterforms: feats.waterforms || {},
                        tourism: feats.tourism || {},
                    },
                },
            });
        });

        return combined;
    }, []);

    const filteredTrails = useMemo(() => {
        return allTrails.filter((t) => {
            if (sourceFilter !== "ALL" && t.source !== sourceFilter) return false;
            if (selectedProvince !== "ALL" && t.province.toLowerCase() !== selectedProvince.toLowerCase()) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const mName = t.name.toLowerCase().includes(q);
                const mId = t.id.toLowerCase().includes(q);
                const mProv = t.province.toLowerCase().includes(q);
                const mClass = t.classification.toLowerCase().includes(q);
                if (!mName && !mId && !mProv && !mClass) return false;
            }

            return true;
        });
    }, [allTrails, sourceFilter, selectedProvince, searchQuery]);

    const realCount = allTrails.filter((t) => t.source === "real").length;
    const synthCount = allTrails.filter((t) => t.source === "synthetic").length;

    const formatVal = (v: any) => {
        const num = Number(v);
        if (isNaN(num)) return "0.00";
        return num.toFixed(2);
    };

    return (
        <View style={styles.container}>
            {/* Filter Controls Bar */}
            <View style={styles.filterBar}>
                {/* Search Box */}
                <View style={styles.searchBox}>
                    <CustomIcon library="Feather" name="search" size={16} color={Colors.GRAY} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search simulation trail name, ID, province, tier..."
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

                {/* Catalog Source Segmented Selector */}
                <View style={styles.sourceSegmentRow}>
                    <Text style={styles.filterLabel}>SIMULATION CATALOG:</Text>
                    <View style={styles.pillsContainer}>
                        <TouchableOpacity
                            style={[styles.filterPill, sourceFilter === "ALL" && styles.filterPillActive]}
                            onPress={() => setSourceFilter("ALL")}
                        >
                            <Text style={[styles.filterPillText, sourceFilter === "ALL" && styles.filterPillTextActive]}>
                                All Catalogs ({allTrails.length})
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterPill, sourceFilter === "real" && styles.filterPillActiveReal]}
                            onPress={() => setSourceFilter("real")}
                        >
                            <CustomIcon library="Feather" name="check-circle" size={13} color={sourceFilter === "real" ? Colors.WHITE : Palette.Blue800} />
                            <Text style={[styles.filterPillText, sourceFilter === "real" && styles.filterPillTextActive]}>
                                Real Trails (Cycle Sim) ({realCount})
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.filterPill, sourceFilter === "synthetic" && styles.filterPillActiveSynth]}
                            onPress={() => setSourceFilter("synthetic")}
                        >
                            <CustomIcon library="Feather" name="cpu" size={13} color={sourceFilter === "synthetic" ? Colors.WHITE : Palette.Purple600} />
                            <Text style={[styles.filterPillText, sourceFilter === "synthetic" && styles.filterPillTextActive]}>
                                Simulated Trails (Trail Sim) ({synthCount})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Province Filter */}
                <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>PROVINCE:</Text>
                    <View style={styles.pillsContainer}>
                        <TouchableOpacity
                            style={[styles.filterPill, selectedProvince === "ALL" && styles.filterPillActive]}
                            onPress={() => setSelectedProvince("ALL")}
                        >
                            <Text style={[styles.filterPillText, selectedProvince === "ALL" && styles.filterPillTextActive]}>
                                ALL
                            </Text>
                        </TouchableOpacity>
                        {PROVINCES.map((prov) => (
                            <TouchableOpacity
                                key={`prov-filter-${prov}`}
                                style={[styles.filterPill, selectedProvince.toLowerCase() === prov.toLowerCase() && styles.filterPillActive]}
                                onPress={() => setSelectedProvince(prov)}
                            >
                                <Text
                                    style={[
                                        styles.filterPillText,
                                        selectedProvince.toLowerCase() === prov.toLowerCase() && styles.filterPillTextActive,
                                    ]}
                                >
                                    {prov}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Catalog Info & Overview Strip */}
            <View style={styles.infoStrip}>
                <View style={styles.infoGroup}>
                    <CustomIcon library="Feather" name="layers" size={15} color={Colors.PRIMARY} />
                    <Text style={styles.infoTitle}>
                        Showing {filteredTrails.length} Trails
                    </Text>
                    <Text style={styles.infoSubtitle}>
                        {sourceFilter === "real"
                            ? "Calabarzon Real Trails (Cycle Simulation Reference Set)"
                            : sourceFilter === "synthetic"
                            ? "Synthetic Scaling Catalog ({synthCount} Trails Balanced Coordinate Space)"
                            : "Combined Simulation Trail Catalog ({realCount} Real Reference + {synthCount} Synthetic Scaled)"}
                    </Text>
                </View>
                <View style={styles.kpiPills}>
                    <View style={styles.kpiChip}>
                        <Text style={styles.kpiChipLabel}>REAL TRAILS</Text>
                        <Text style={[styles.kpiChipVal, { color: Palette.Blue800 }]}>{realCount}</Text>
                    </View>
                    <View style={styles.kpiChip}>
                        <Text style={styles.kpiChipLabel}>SIMULATED</Text>
                        <Text style={[styles.kpiChipVal, { color: Palette.Purple600 }]}>{synthCount}</Text>
                    </View>
                </View>
            </View>

            {/* Scrollable Trail Dataset Table */}
            <View style={styles.tableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableHorizontalScroll}>
                    <View>
                        {/* Table Header Row 1: Section Categories */}
                        <View style={styles.superHeaderRow}>
                            <View style={[styles.thSuper, styles.colIndex]}>
                                <Text style={styles.thSuperText}>#</Text>
                            </View>
                            <View style={[styles.thSuper, styles.colTrail]}>
                                <Text style={styles.thSuperText}>TRAIL IDENTIFIER</Text>
                            </View>
                            <View style={[styles.thSuper, styles.colProv]}>
                                <Text style={styles.thSuperText}>LOCATION</Text>
                            </View>
                            <View style={[styles.thSuper, styles.colTier]}>
                                <Text style={styles.thSuperText}>TIER / CLASS</Text>
                            </View>
                            <View style={[styles.thSuper, styles.superGroupPhysical]}>
                                <Text style={styles.thSuperText}>PHYSICAL EXERTION METRICS (NORM / RAW)</Text>
                            </View>
                            <View style={[styles.thSuper, styles.superGroupProvinces]}>
                                <Text style={styles.thSuperText}>PROVINCE AFFINITY</Text>
                            </View>
                            <View style={[styles.thSuper, styles.superGroupTerrains]}>
                                <Text style={styles.thSuperText}>TERRAINS</Text>
                            </View>
                            <View style={[styles.thSuper, styles.superGroupCirc]}>
                                <Text style={styles.thSuperText}>CIRCULARITY</Text>
                            </View>
                            <View style={[styles.thSuper, styles.superGroupWater]}>
                                <Text style={styles.thSuperText}>WATERFORMS</Text>
                            </View>
                            <View style={[styles.thSuper, styles.superGroupTourism]}>
                                <Text style={styles.thSuperText}>AMENITIES / TOURISM</Text>
                            </View>
                            <View style={[styles.thSuper, styles.colAction]}>
                                <Text style={styles.thSuperText}>ACTION</Text>
                            </View>
                        </View>

                        {/* Table Header Row 2: Sub-feature Columns */}
                        <View style={styles.tableHeaderRow}>
                            <View style={[styles.thCell, styles.colIndex]}>
                                <Text style={styles.thText}>No.</Text>
                            </View>
                            <View style={[styles.thCell, styles.colTrail]}>
                                <Text style={styles.thText}>Name & Source</Text>
                            </View>
                            <View style={[styles.thCell, styles.colProv]}>
                                <Text style={styles.thText}>Province</Text>
                            </View>
                            <View style={[styles.thCell, styles.colTier]}>
                                <Text style={styles.thText}>Difficulty</Text>
                            </View>

                            {/* Physical Sub-columns */}
                            <View style={[styles.thCell, styles.colNum]}><Text style={styles.thText}>Class</Text></View>
                            <View style={[styles.thCell, styles.colNum]}><Text style={styles.thText}>Lasco</Text></View>
                            <View style={[styles.thCell, styles.colNum]}><Text style={styles.thText}>Length</Text></View>
                            <View style={[styles.thCell, styles.colNum]}><Text style={styles.thText}>Peak</Text></View>
                            <View style={[styles.thCell, styles.colNum]}><Text style={styles.thText}>Gain</Text></View>
                            <View style={[styles.thCell, styles.colNum]}><Text style={styles.thText}>Slope</Text></View>

                            {/* Province Sub-columns */}
                            {PROVINCES.map((p) => (
                                <View key={`th-p-${p}`} style={[styles.thCell, styles.colProvItem]}>
                                    <Text style={styles.thText}>{p.slice(0, 3)}</Text>
                                </View>
                            ))}

                            {/* Terrains */}
                            {TERRAIN_KEYS.map((k) => (
                                <View key={`th-t-${k}`} style={[styles.thCell, styles.colTerrain]}>
                                    <Text style={styles.thText}>{k.charAt(0).toUpperCase() + k.slice(1, 4)}</Text>
                                </View>
                            ))}

                            {/* Circularity */}
                            <View style={[styles.thCell, styles.colCirc]}><Text style={styles.thText}>Out-Back</Text></View>
                            <View style={[styles.thCell, styles.colCirc]}><Text style={styles.thText}>Traverse</Text></View>
                            <View style={[styles.thCell, styles.colCirc]}><Text style={styles.thText}>Circular</Text></View>

                            {/* Water */}
                            {WATER_KEYS.map((w) => (
                                <View key={`th-w-${w}`} style={[styles.thCell, styles.colWater]}>
                                    <Text style={styles.thText}>{w.charAt(0).toUpperCase() + w.slice(1)}</Text>
                                </View>
                            ))}

                            {/* Tourism */}
                            {TOURISM_KEYS.map((tm) => (
                                <View key={`th-tm-${tm.key}`} style={[styles.thCell, styles.colTourism]}>
                                    <Text style={styles.thText}>{tm.label}</Text>
                                </View>
                            ))}

                            <View style={[styles.thCell, styles.colAction]}>
                                <Text style={styles.thText}>Inspect</Text>
                            </View>
                        </View>

                        {/* Table Body Rows */}
                        <View style={styles.tableRowsContainer}>
                            {filteredTrails.map((trail, idx) => {
                                const f = trail.profile.features;
                                const isReal = trail.source === "real";
                                const isEven = idx % 2 === 0;

                                return (
                                    <View
                                        key={`trail-row-${trail.id}-${idx}`}
                                        style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                                    >
                                        {/* Index */}
                                        <View style={[styles.tdCell, styles.colIndex, styles.centerCell]}>
                                            <Text style={styles.indexText}>{idx + 1}</Text>
                                        </View>

                                        {/* Trail Name & Source */}
                                        <View style={[styles.tdCell, styles.colTrail]}>
                                            <View style={styles.nameBadgeRow}>
                                                <View style={[styles.sourceBadge, isReal ? styles.sourceBadgeReal : styles.sourceBadgeSynth]}>
                                                    <Text style={[styles.sourceBadgeText, isReal ? styles.sourceTextReal : styles.sourceTextSynth]}>
                                                        {isReal ? "Real (Cycle Sim)" : "Synthetic"}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.trailNameText} numberOfLines={1}>
                                                {trail.name}
                                            </Text>
                                            <Text style={styles.trailIdSub}>{trail.id}</Text>
                                        </View>

                                        {/* Province */}
                                        <View style={[styles.tdCell, styles.colProv, styles.centerCell]}>
                                            <Text style={styles.provText}>{trail.province}</Text>
                                        </View>

                                        {/* Tier / Difficulty */}
                                        <View style={[styles.tdCell, styles.colTier, styles.centerCell]}>
                                            <View style={[styles.tierBadge, isReal ? styles.tierBadgeReal : styles.tierBadgeSynth]}>
                                                <Text style={styles.tierBadgeText}>{trail.classification}</Text>
                                            </View>
                                            <Text style={styles.lascoText}>Lasco {trail.lascoRating}/9</Text>
                                        </View>

                                        {/* Physical Features */}
                                        <View style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.classification)}</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.easy)}</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.length)}</Text>
                                            <Text style={styles.rawSub}>{trail.raw.length.toFixed(1)}km</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.elevation)}</Text>
                                            <Text style={styles.rawSub}>{Math.round(trail.raw.elevation)}m</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.gain)}</Text>
                                            <Text style={styles.rawSub}>{Math.round(trail.raw.gain)}m</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colNum, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.slope)}</Text>
                                            <Text style={styles.rawSub}>{trail.raw.slope.toFixed(1)}%</Text>
                                        </View>

                                        {/* Province Affinity */}
                                        {PROVINCES.map((p) => {
                                            const val = f.province?.[p.toLowerCase()] ?? 0;
                                            return (
                                                <View key={`prov-${trail.id}-${p}`} style={[styles.tdCell, styles.colProvItem, styles.centerCell]}>
                                                    <Text style={[styles.featVal, val > 0.5 && styles.featValActive]}>
                                                        {formatVal(val)}
                                                    </Text>
                                                </View>
                                            );
                                        })}

                                        {/* Terrains */}
                                        {TERRAIN_KEYS.map((k) => {
                                            const val = f.terrain?.[k] ?? 0;
                                            return (
                                                <View key={`terr-${trail.id}-${k}`} style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                                    <Text style={[styles.featVal, val > 0.4 && styles.featValActive]}>
                                                        {formatVal(val)}
                                                    </Text>
                                                </View>
                                            );
                                        })}

                                        {/* Circularity */}
                                        <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.circularity?.out_and_back)}</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.circularity?.traverse)}</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                            <Text style={styles.featVal}>{formatVal(f.circularity?.circular)}</Text>
                                        </View>

                                        {/* Waterforms */}
                                        {WATER_KEYS.map((w) => {
                                            const val = f.waterforms?.[w] ?? 0;
                                            return (
                                                <View key={`water-${trail.id}-${w}`} style={[styles.tdCell, styles.colWater, styles.centerCell]}>
                                                    <Text style={styles.featVal}>{formatVal(val)}</Text>
                                                </View>
                                            );
                                        })}

                                        {/* Tourism */}
                                        {TOURISM_KEYS.map((tm) => {
                                            const val = f.tourism?.[tm.key] ?? 0;
                                            return (
                                                <View key={`tourism-${trail.id}-${tm.key}`} style={[styles.tdCell, styles.colTourism, styles.centerCell]}>
                                                    <Text style={styles.featVal}>{formatVal(val)}</Text>
                                                </View>
                                            );
                                        })}

                                        {/* Action: Inspect */}
                                        <View style={[styles.tdCell, styles.colAction, styles.centerCell]}>
                                            <TouchableOpacity
                                                style={styles.inspectBtn}
                                                onPress={() => setInspectingTrail(trail)}
                                            >
                                                <CustomIcon library="Feather" name="eye" size={13} color={Colors.PRIMARY} />
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

            {/* Trail Inspection Modal */}
            {inspectingTrail && (
                <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setInspectingTrail(null)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <View style={[styles.sourceBadge, inspectingTrail.source === "real" ? styles.sourceBadgeReal : styles.sourceBadgeSynth]}>
                                            <Text style={[styles.sourceBadgeText, inspectingTrail.source === "real" ? styles.sourceTextReal : styles.sourceTextSynth]}>
                                                {inspectingTrail.source === "real" ? "Real Benchmark Trail (Cycle Sim)" : "Synthetic Catalog Trail (Trail Sim)"}
                                            </Text>
                                        </View>
                                        <Text style={styles.modalTrailProv}>{inspectingTrail.province}</Text>
                                    </View>
                                    <Text style={styles.modalTitle}>{inspectingTrail.name}</Text>
                                    <Text style={styles.modalIdSub}>Trail ID: {inspectingTrail.id} | {inspectingTrail.classification} (Lasco {inspectingTrail.lascoRating}/9)</Text>
                                </View>
                                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setInspectingTrail(null)}>
                                    <CustomIcon library="Feather" name="x" size={16} color={Colors.TEXT_PRIMARY} />
                                </TouchableOpacity>
                            </View>

                            {/* Modal Body */}
                            <ScrollView style={styles.modalBody}>
                                {/* Raw Physical Metrics Grid */}
                                <Text style={styles.sectionHeader}>Raw Physical Dimensions</Text>
                                <View style={styles.rawMetricsGrid}>
                                    <View style={styles.rawMetricCard}>
                                        <Text style={styles.rawMetricLabel}>Trail Length</Text>
                                        <Text style={styles.rawMetricVal}>{inspectingTrail.raw.length.toFixed(2)} km</Text>
                                        <Text style={styles.normScoreSub}>Normalized: {formatVal(inspectingTrail.profile.features.length)}</Text>
                                    </View>
                                    <View style={styles.rawMetricCard}>
                                        <Text style={styles.rawMetricLabel}>Peak Altitude</Text>
                                        <Text style={styles.rawMetricVal}>{Math.round(inspectingTrail.raw.elevation)} MASL</Text>
                                        <Text style={styles.normScoreSub}>Normalized: {formatVal(inspectingTrail.profile.features.elevation)}</Text>
                                    </View>
                                    <View style={styles.rawMetricCard}>
                                        <Text style={styles.rawMetricLabel}>Elevation Gain</Text>
                                        <Text style={styles.rawMetricVal}>+{Math.round(inspectingTrail.raw.gain)} m</Text>
                                        <Text style={styles.normScoreSub}>Normalized: {formatVal(inspectingTrail.profile.features.gain)}</Text>
                                    </View>
                                    <View style={styles.rawMetricCard}>
                                        <Text style={styles.rawMetricLabel}>Average Slope</Text>
                                        <Text style={styles.rawMetricVal}>{inspectingTrail.raw.slope.toFixed(2)}%</Text>
                                        <Text style={styles.normScoreSub}>Normalized: {formatVal(inspectingTrail.profile.features.slope)}</Text>
                                    </View>
                                    <View style={styles.rawMetricCard}>
                                        <Text style={styles.rawMetricLabel}>Lasco Difficulty</Text>
                                        <Text style={styles.rawMetricVal}>{inspectingTrail.raw.lascoRating} / 9</Text>
                                        <Text style={styles.normScoreSub}>Easy Score: {formatVal(inspectingTrail.profile.features.easy)}</Text>
                                    </View>
                                </View>

                                {/* Terrains & Environmental Dimensions */}
                                <Text style={styles.sectionHeader}>Terrain & Route Characteristics</Text>
                                <View style={styles.envGrid}>
                                    <View style={styles.envBox}>
                                        <Text style={styles.envBoxTitle}>Terrains Encountered</Text>
                                        {TERRAIN_KEYS.map((k) => (
                                            <View key={`m-terr-${k}`} style={styles.envRow}>
                                                <Text style={styles.envKey}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                                                <Text style={styles.envVal}>{formatVal(inspectingTrail.profile.features.terrain?.[k])}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.envBox}>
                                        <Text style={styles.envBoxTitle}>Circularity / Route Type</Text>
                                        {CIRCULARITY_KEYS.map((c) => (
                                            <View key={`m-circ-${c}`} style={styles.envRow}>
                                                <Text style={styles.envKey}>{c.replace(/_/g, " ")}</Text>
                                                <Text style={styles.envVal}>{formatVal(inspectingTrail.profile.features.circularity?.[c])}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.envBox}>
                                        <Text style={styles.envBoxTitle}>Waterforms Present</Text>
                                        {WATER_KEYS.map((w) => (
                                            <View key={`m-water-${w}`} style={styles.envRow}>
                                                <Text style={styles.envKey}>{w.charAt(0).toUpperCase() + w.slice(1)}</Text>
                                                <Text style={styles.envVal}>{formatVal(inspectingTrail.profile.features.waterforms?.[w])}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Tourism Amenities List */}
                                <Text style={styles.sectionHeader}>Tourism & Trail Facilities</Text>
                                <View style={styles.amenitiesCard}>
                                    <View style={styles.amenitiesWrap}>
                                        {TOURISM_KEYS.map((tm) => {
                                            const val = inspectingTrail.profile.features.tourism?.[tm.key] ?? 0;
                                            const isPresent = val > 0.3;
                                            return (
                                                <View
                                                    key={`m-tm-${tm.key}`}
                                                    style={[styles.amenityTag, isPresent && styles.amenityTagActive]}
                                                >
                                                    <CustomIcon
                                                        library="Feather"
                                                        name={isPresent ? "check" : "minus"}
                                                        size={12}
                                                        color={isPresent ? Palette.Green700 : Colors.TEXT_MUTED}
                                                    />
                                                    <Text style={[styles.amenityText, isPresent && styles.amenityTextActive]}>
                                                        {tm.label}: {formatVal(val)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Modal Footer */}
                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setInspectingTrail(null)}>
                                    <Text style={styles.modalDoneBtnText}>Done</Text>
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
        backgroundColor: Palette.Neutral50,
    },
    filterBar: {
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
        gap: 12,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Palette.Neutral25,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        padding: 0,
    },
    sourceSegmentRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
    },
    filterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
    },
    filterLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_MUTED,
        letterSpacing: 0.3,
        minWidth: 130,
    },
    pillsContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: Palette.Neutral50,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    filterPillActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    filterPillActiveReal: {
        backgroundColor: Palette.Blue800,
        borderColor: Palette.Blue800,
    },
    filterPillActiveSynth: {
        backgroundColor: Palette.Purple600,
        borderColor: Palette.Purple600,
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: "500",
        color: Colors.TEXT_SECONDARY,
    },
    filterPillTextActive: {
        color: Colors.WHITE,
        fontWeight: "700",
    },
    infoStrip: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Palette.Neutral25,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexWrap: "wrap",
        gap: 8,
    },
    infoGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    infoSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginLeft: 4,
    },
    kpiPills: {
        flexDirection: "row",
        gap: 8,
    },
    kpiChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    kpiChipLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.TEXT_MUTED,
    },
    kpiChipVal: {
        fontSize: 12,
        fontWeight: "800",
    },
    tableCard: {
        backgroundColor: Colors.WHITE,
        flex: 1,
    },
    tableHorizontalScroll: {
        flex: 1,
    },
    superHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Neutral50,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
    },
    thSuper: {
        paddingVertical: 6,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: Palette.Neutral100,
    },
    thSuperText: {
        fontSize: 10,
        fontWeight: "800",
        color: Colors.TEXT_MUTED,
        letterSpacing: 0.4,
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: Palette.Neutral25,
        borderBottomWidth: 2,
        borderBottomColor: Palette.Neutral100,
    },
    thCell: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: Palette.Neutral100,
    },
    thText: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        textAlign: "center",
    },
    tableRowsContainer: {
        flexDirection: "column",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
    },
    rowEven: {
        backgroundColor: Colors.WHITE,
    },
    rowOdd: {
        backgroundColor: "#FAFBFD",
    },
    tdCell: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: Palette.Neutral100,
    },
    centerCell: {
        alignItems: "center",
    },
    indexText: {
        fontSize: 11,
        color: Colors.TEXT_MUTED,
        fontWeight: "600",
    },
    nameBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2,
    },
    sourceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sourceBadgeReal: {
        backgroundColor: Palette.Blue50,
        borderWidth: 1,
        borderColor: Palette.Blue100,
    },
    sourceBadgeSynth: {
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#EDE9FE",
    },
    sourceBadgeText: {
        fontSize: 9,
        fontWeight: "700",
    },
    sourceTextReal: {
        color: Palette.Blue800,
    },
    sourceTextSynth: {
        color: Palette.Purple600,
    },
    trailNameText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    trailIdSub: {
        fontSize: 10,
        color: Colors.TEXT_MUTED,
        fontFamily: "monospace",
    },
    provText: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    tierBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 2,
    },
    tierBadgeReal: {
        backgroundColor: Palette.Neutral50,
    },
    tierBadgeSynth: {
        backgroundColor: Palette.Neutral50,
    },
    tierBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    lascoText: {
        fontSize: 10,
        color: Colors.TEXT_MUTED,
    },
    featVal: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        fontVariant: ["tabular-nums"],
    },
    featValActive: {
        color: Colors.PRIMARY,
        fontWeight: "700",
    },
    rawSub: {
        fontSize: 9,
        color: Colors.TEXT_MUTED,
        marginTop: 1,
    },
    inspectBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.PRIMARY_LIGHT,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 4,
    },
    inspectBtnText: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    // Column widths
    colIndex: { width: 40 },
    colTrail: { width: 200 },
    colProv: { width: 90 },
    colTier: { width: 90 },
    colNum: { width: 65 },
    colProvItem: { width: 45 },
    colTerrain: { width: 55 },
    colCirc: { width: 65 },
    colWater: { width: 55 },
    colTourism: { width: 75 },
    colAction: { width: 85 },
    // Super group widths
    superGroupPhysical: { width: 65 * 6 },
    superGroupProvinces: { width: 45 * 5 },
    superGroupTerrains: { width: 55 * 4 },
    superGroupCirc: { width: 65 * 3 },
    superGroupWater: { width: 55 * 3 },
    superGroupTourism: { width: 75 * 8 },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalCard: {
        width: "95%",
        maxWidth: 880,
        maxHeight: "90%",
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 16,
        backgroundColor: Palette.Neutral25,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
    },
    modalTrailProv: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: Colors.TEXT_PRIMARY,
    },
    modalIdSub: {
        fontSize: 11,
        color: Colors.TEXT_MUTED,
        marginTop: 2,
    },
    modalCloseBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: Palette.Neutral100,
    },
    modalBody: {
        padding: 16,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
        marginTop: 12,
    },
    rawMetricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    rawMetricCard: {
        flex: 1,
        minWidth: 140,
        backgroundColor: Palette.Neutral25,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    rawMetricLabel: {
        fontSize: 11,
        color: Colors.TEXT_MUTED,
        fontWeight: "600",
    },
    rawMetricVal: {
        fontSize: 16,
        fontWeight: "800",
        color: Colors.TEXT_PRIMARY,
        marginVertical: 2,
    },
    normScoreSub: {
        fontSize: 11,
        color: Colors.PRIMARY,
        fontWeight: "600",
    },
    envGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    envBox: {
        flex: 1,
        minWidth: 220,
        backgroundColor: Palette.Neutral25,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        padding: 12,
    },
    envBoxTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Neutral100,
        paddingBottom: 4,
    },
    envRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
    },
    envKey: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    envVal: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        fontVariant: ["tabular-nums"],
    },
    amenitiesCard: {
        backgroundColor: Palette.Neutral25,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        marginBottom: 16,
    },
    amenitiesWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    amenityTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    amenityTagActive: {
        borderColor: Palette.Green700,
        backgroundColor: Palette.Green50,
    },
    amenityText: {
        fontSize: 11,
        color: Colors.TEXT_MUTED,
    },
    amenityTextActive: {
        color: Palette.Green900,
        fontWeight: "600",
    },
    modalFooter: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: Palette.Neutral100,
        alignItems: "flex-end",
        backgroundColor: Palette.Neutral25,
    },
    modalDoneBtn: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    modalDoneBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: "700",
    },
});
