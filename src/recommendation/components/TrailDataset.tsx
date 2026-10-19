import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import { Trail } from "@/src/core/models/Trail/Trail";
import { Profile } from "@/src/recommendation/interfaces/Profile";
import {
    calculateTrailGain,
    getTrailStartElevations,
} from "@/src/recommendation/utilities/GetElevation";
import {
    buildTrailProfiles,
    calculateDatasetBounds,
    DatasetBounds,
} from "@/src/recommendation/utilities/NormalizeTrails";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PROVINCES = ["Cavite", "Laguna", "Batangas", "Rizal", "Quezon"] as const;

function renderNullableFeatureCell(
    val: number | null | undefined,
    rawVal: unknown,
    colStyle: object,
    key?: string
) {
    let rawText = "null";
    if (rawVal === true) rawText = "yes";
    else if (rawVal === false) rawText = "no";
    else if (Array.isArray(rawVal)) rawText = rawVal.length > 0 ? "yes" : "no";

    const normText = val !== null && val !== undefined ? String(val) : "null";
    const isPositive = val === 1;
    const isNull = val === null || val === undefined;

    return (
        <View key={key} style={[styles.tdCell, colStyle, styles.centerCell]}>
            <Text
                style={[
                    styles.valNormalized,
                    isPositive ? styles.textPrimary : isNull ? styles.textNull : styles.textMuted,
                ]}
            >
                {normText}
            </Text>
            <Text style={styles.valRaw}>({rawText})</Text>
        </View>
    );
}

export interface TrailDatasetProps {
    trails?: Trail[];
    trailProfiles?: Profile[];
    startElevations?: Record<string, number>;
    isLoading?: boolean;
    error?: Error | null;
    refresh?: () => Promise<void> | void;
}

export default function TrailDataset({
    trails = [],
    trailProfiles = [],
    startElevations: propStartElevations,
    isLoading = false,
    error = null,
    refresh,
}: TrailDatasetProps) {
    const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

    const [localStartElevations, setLocalStartElevations] = useState<Record<string, number>>({});
    const [isElevationsLoading, setIsElevationsLoading] = useState<boolean>(false);

    // Fetch start elevations using the batch Open-Meteo utility if not passed from props
    useEffect(() => {
        if (!trails || trails.length === 0) return;
        if (propStartElevations && Object.keys(propStartElevations).length >= trails.length) return;

        let isMounted = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsElevationsLoading(true);

        getTrailStartElevations(trails)
            .then((elevMap) => {
                if (isMounted) {
                    setLocalStartElevations(elevMap);
                }
            })
            .catch((err) => {
                console.warn("⚠️ Failed fetching start elevations for trails:", err);
            })
            .finally(() => {
                if (isMounted) {
                    setIsElevationsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [trails, propStartElevations]);

    const startElevations = useMemo(() => {
        return {
            ...localStartElevations,
            ...(propStartElevations || {}),
        };
    }, [localStartElevations, propStartElevations]);

    // Dataset bounds for verification
    const bounds: DatasetBounds = useMemo(() => {
        return calculateDatasetBounds(trails, startElevations);
    }, [trails, startElevations]);

    // Computed profiles fallback if not passed directly from core
    const computedProfiles: Profile[] = useMemo(() => {
        if (trailProfiles && trailProfiles.length > 0) {
            return trailProfiles;
        }
        return buildTrailProfiles(trails, startElevations);
    }, [trails, trailProfiles, startElevations]);

    // Fast lookup map for profile vectors by trail id
    const profileMap: Map<string, Profile> = useMemo(() => {
        return new Map(computedProfiles.map((p) => [p.metadata.id, p]));
    }, [computedProfiles]);

    return (
        <View style={styles.container}>
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

            {/* Data Grid Table View */}
            <ScrollView
                style={styles.verticalScroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={refresh ? <RefreshControl refreshing={isLoading} onRefresh={refresh} /> : undefined}
            >
                {isLoading && trails.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.PRIMARY} />
                        <Text style={styles.loadingText}>Fetching all trails from repository...</Text>
                    </View>
                ) : trails.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <CustomIcon library="Feather" name="inbox" size={42} color={Colors.GRAY_MEDIUM} />
                        <Text style={styles.emptyTitle}>No trails found</Text>
                        <Text style={styles.emptySubtitle}>No trail documents exist in the repository</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={styles.tableHeaderRow}>
                                <Text style={[styles.th, styles.colIndex]}>#</Text>
                                <Text style={[styles.th, styles.colName, styles.centerText]}>Trail Name</Text>

                                <View style={styles.colClass}>
                                    <Text style={[styles.th, styles.centerText]}>Class</Text>
                                    <Text style={styles.thSubCenter}>0=min, 1=maj</Text>
                                </View>

                                <View style={styles.colLasco}>
                                    <Text style={[styles.th, styles.centerText]}>Lasco / Easy</Text>
                                    <Text style={styles.thSubCenter}>lasco / 9</Text>
                                </View>

                                <View style={styles.colNumber}>
                                    <Text style={[styles.th, styles.centerText]}>Length</Text>
                                    <Text style={styles.thSubCenter}>
                                        {isFinite(bounds.length.min)
                                            ? `${bounds.length.min.toFixed(1)}-${bounds.length.max.toFixed(1)} km`
                                            : ""}
                                    </Text>
                                </View>

                                <View style={styles.colNumber}>
                                    <Text style={[styles.th, styles.centerText]}>Peak (MASL)</Text>
                                    <Text style={styles.thSubCenter}>
                                        {isFinite(bounds.elevation.min)
                                            ? `${Math.round(bounds.elevation.min)}-${Math.round(bounds.elevation.max)} m`
                                            : ""}
                                    </Text>
                                </View>

                                <View style={styles.colElev}>
                                    <Text style={[styles.th, styles.centerText]}>Start Elev</Text>
                                    <Text style={styles.thSubCenter}>Open-Meteo</Text>
                                </View>

                                <View style={styles.colGain}>
                                    <Text style={[styles.th, styles.centerText]}>Gain (MASL-Start)</Text>
                                    <Text style={styles.thSubCenter}>
                                        {isFinite(bounds.gain.min)
                                            ? `${Math.round(bounds.gain.min)}-${Math.round(bounds.gain.max)} m`
                                            : ""}
                                    </Text>
                                </View>

                                <View style={styles.colNumber}>
                                    <Text style={[styles.th, styles.centerText]}>Slope</Text>
                                    <Text style={styles.thSubCenter}>
                                        {isFinite(bounds.slope.min)
                                            ? `${bounds.slope.min.toFixed(1)}-${bounds.slope.max.toFixed(1)}%`
                                            : ""}
                                    </Text>
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
                            </View>

                            {/* Table Body */}
                            {trails.map((trail, index) => {
                                const profile = profileMap.get(trail.id);
                                const isEven = index % 2 === 0;

                                const startElev = startElevations[trail.id];
                                const rawGain = calculateTrailGain(trail, startElev);
                                const rawMasl = trail.geography?.masl || trail.difficulty?.elevation || 0;
                                const isMajor = trail.difficulty?.classification?.toLowerCase() === "major";
                                const rawClass = trail.difficulty?.classification || (isMajor ? "major" : "minor");
                                const rawLasco = trail.difficulty?.lascoRating ?? 0;
                                const rawLength = trail.difficulty?.length ?? 0;
                                const rawSlope = trail.difficulty?.slope ?? 0;

                                return (
                                    <View
                                        key={trail.id || index}
                                        style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                                    >
                                        <Text style={[styles.td, styles.colIndex, styles.textMuted]}>{index + 1}</Text>
                                        
                                        <TouchableOpacity
                                            style={styles.colName}
                                            activeOpacity={0.7}
                                            onPress={() => setSelectedTrail(trail)}
                                        >
                                            <Text style={styles.nameCell} numberOfLines={2}>
                                                {trail.general?.name || "Unnamed Trail"}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Classification: Normalized (0/1) on top, Raw below */}
                                        <View style={[styles.tdCell, styles.colClass, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {profile?.features.classification ?? (isMajor ? 1 : 0)}
                                            </Text>
                                            <Text style={styles.valRaw}>({rawClass})</Text>
                                        </View>

                                        {/* Lasco / Easy: Normalized on top, Raw below */}
                                        <View style={[styles.tdCell, styles.colLasco, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {profile ? profile.features.easy.toFixed(3) : "-"}
                                            </Text>
                                            <Text style={styles.valRaw}>({rawLasco ? `${rawLasco}/9` : "-"})</Text>
                                        </View>

                                        {/* Length: Normalized on top, Raw below */}
                                        <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {profile ? profile.features.length.toFixed(3) : "-"}
                                            </Text>
                                            <Text style={styles.valRaw}>({rawLength ? `${rawLength} km` : "-"})</Text>
                                        </View>

                                        {/* Peak MASL: Normalized on top, Raw below */}
                                        <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {profile ? profile.features.elevation.toFixed(3) : "-"}
                                            </Text>
                                            <Text style={styles.valRaw}>({rawMasl ? `${rawMasl} m` : "-"})</Text>
                                        </View>

                                        {/* Start Elev (Open-Meteo) */}
                                        <View style={[styles.tdCell, styles.colElev, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {isElevationsLoading && startElev === undefined
                                                    ? "..."
                                                    : startElev != null
                                                    ? `${Math.round(startElev)} m`
                                                    : "-"}
                                            </Text>
                                            <Text style={styles.valRaw}>(Open-Meteo)</Text>
                                        </View>

                                        {/* Gain (MASL - Start): Normalized on top, Raw below */}
                                        <View style={[styles.tdCell, styles.colGain, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {profile ? profile.features.gain.toFixed(3) : "-"}
                                            </Text>
                                            <Text style={styles.valRaw}>({`${rawGain} m`})</Text>
                                        </View>

                                        {/* Slope: Normalized on top, Raw below */}
                                        <View style={[styles.tdCell, styles.colNumber, styles.centerCell]}>
                                            <Text style={styles.valNormalized}>
                                                {profile ? profile.features.slope.toFixed(3) : "-"}
                                            </Text>
                                            <Text style={styles.valRaw}>({`${rawSlope}%`})</Text>
                                        </View>

                                        {/* Provinces */}
                                        {PROVINCES.map((prov) => {
                                            const isPresent = trail.general?.province?.some(
                                                (p) => typeof p === "string" && p.toLowerCase().includes(prov.toLowerCase())
                                            );
                                            const pVal = profile?.features.province[prov.toLowerCase() as keyof Profile['features']['province']] ?? (isPresent ? 1 : 0);
                                            return (
                                                <View key={prov} style={[styles.tdCell, styles.colProvince, styles.centerCell]}>
                                                    <Text style={[styles.valNormalized, pVal ? styles.textPrimary : styles.textMuted]}>
                                                        {pVal}
                                                    </Text>
                                                    <Text style={styles.valRaw}>({isPresent ? "yes" : "no"})</Text>
                                                </View>
                                            );
                                        })}

                                        {/* Terrain: Muddy, Rocky, Grass, Ridge */}
                                        <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.terrain.muddy ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.terrain.muddy ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({(profile?.features.terrain.muddy ?? 0) > 0 ? "yes" : "no"})</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.terrain.rocky ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.terrain.rocky ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({(profile?.features.terrain.rocky ?? 0) > 0 ? "yes" : "no"})</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.terrain.grassland ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.terrain.grassland ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({(profile?.features.terrain.grassland ?? 0) > 0 ? "yes" : "no"})</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colTerrain, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.terrain.ridges ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.terrain.ridges ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({(profile?.features.terrain.ridges ?? 0) > 0 ? "yes" : "no"})</Text>
                                        </View>

                                        {/* Circularity */}
                                        <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.circularity.out_and_back ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.circularity.out_and_back ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({profile?.features.circularity.out_and_back ? "yes" : "no"})</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.circularity.traverse ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.circularity.traverse ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({profile?.features.circularity.traverse ? "yes" : "no"})</Text>
                                        </View>
                                        <View style={[styles.tdCell, styles.colCirc, styles.centerCell]}>
                                            <Text style={[styles.valNormalized, profile?.features.circularity.circular ? styles.textPrimary : styles.textMuted]}>
                                                {profile?.features.circularity.circular ?? 0}
                                            </Text>
                                            <Text style={styles.valRaw}>({profile?.features.circularity.circular ? "yes" : "no"})</Text>
                                        </View>

                                        {/* Waterforms */}
                                        {renderNullableFeatureCell(profile?.features.waterforms.fall, trail.tourism?.waterfall, styles.colWater)}
                                        {renderNullableFeatureCell(profile?.features.waterforms.river, trail.tourism?.river, styles.colWater)}
                                        {renderNullableFeatureCell(profile?.features.waterforms.lake, trail.tourism?.lake, styles.colWater)}

                                        {/* Tourism Amenities (ITourism) */}
                                        {renderNullableFeatureCell(profile?.features.tourism?.shelter, trail.tourism?.shelter, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.resting, trail.tourism?.resting, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.information_board, trail.tourism?.information_board, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.clean_water, trail.tourism?.clean_water, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.monument, trail.tourism?.monument, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.community, trail.tourism?.community, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.viewpoint, trail.tourism?.viewpoint, styles.colTourism)}
                                        {renderNullableFeatureCell(profile?.features.tourism?.network_connection, trail.tourism?.network_connection, styles.colTourism)}
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}
            </ScrollView>

            {/* Trail Detail & Verification Modal */}
            <Modal
                visible={!!selectedTrail}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedTrail(null)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setSelectedTrail(null)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>
                                    {selectedTrail?.general?.name || "Trail Detail"}
                                </Text>
                                <Text style={styles.modalSubId}>ID: {selectedTrail?.id}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setSelectedTrail(null)}
                            >
                                <CustomIcon library="Feather" name="x" size={20} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedTrail && (
                                <View style={styles.detailSection}>
                                    {/* Verification Matrix */}
                                    <Text style={styles.detailSectionTitle}>
                                        Phase 1 Normalization & Calculation Verification
                                    </Text>
                                    <View style={styles.calcTable}>
                                        <View style={styles.calcTableRowHeader}>
                                            <Text style={[styles.calcTh, { flex: 1.2 }]}>Feature</Text>
                                            <Text style={[styles.calcTh, { flex: 1.4 }]}>Raw Value</Text>
                                            <Text style={[styles.calcTh, { flex: 2 }]}>Formula Applied</Text>
                                            <Text style={[styles.calcTh, { flex: 1, textAlign: "right" }]}>Vector [0, 1]</Text>
                                        </View>

                                        {(() => {
                                            const p = profileMap.get(selectedTrail.id);
                                            const sElev = startElevations[selectedTrail.id];
                                            const masl = selectedTrail.geography?.masl || selectedTrail.difficulty?.elevation || 0;
                                            const gain = calculateTrailGain(selectedTrail, sElev);

                                            return (
                                                <>
                                                    <View style={styles.calcTableRow}>
                                                        <Text style={[styles.calcTdBold, { flex: 1.2 }]}>Classification</Text>
                                                        <Text style={[styles.calcTd, { flex: 1.4 }]}>
                                                            {selectedTrail.difficulty?.classification || "-"}
                                                        </Text>
                                                        <Text style={[styles.calcTdMuted, { flex: 2 }]}>Major = 1, Minor = 0</Text>
                                                        <Text style={[styles.calcTdValue, { flex: 1, textAlign: "right" }]}>
                                                            {p?.features.classification ?? 0}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.calcTableRow}>
                                                        <Text style={[styles.calcTdBold, { flex: 1.2 }]}>Lasco / Easy</Text>
                                                        <Text style={[styles.calcTd, { flex: 1.4 }]}>
                                                            {selectedTrail.difficulty?.lascoRating ? `${selectedTrail.difficulty.lascoRating} / 9` : "-"}
                                                        </Text>
                                                        <Text style={[styles.calcTdMuted, { flex: 2 }]}>lascoRating / 9</Text>
                                                        <Text style={[styles.calcTdValue, { flex: 1, textAlign: "right" }]}>
                                                            {p?.features.easy.toFixed(3) ?? "-"}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.calcTableRow}>
                                                        <Text style={[styles.calcTdBold, { flex: 1.2 }]}>Length</Text>
                                                        <Text style={[styles.calcTd, { flex: 1.4 }]}>
                                                            {selectedTrail.difficulty?.length ? `${selectedTrail.difficulty.length} km` : "-"}
                                                        </Text>
                                                        <Text style={[styles.calcTdMuted, { flex: 2 }]}>
                                                            (val - {bounds.length.min.toFixed(1)}) / ({bounds.length.max.toFixed(1)} - {bounds.length.min.toFixed(1)})
                                                        </Text>
                                                        <Text style={[styles.calcTdValue, { flex: 1, textAlign: "right" }]}>
                                                            {p?.features.length.toFixed(3) ?? "-"}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.calcTableRow}>
                                                        <Text style={[styles.calcTdBold, { flex: 1.2 }]}>Peak Elevation</Text>
                                                        <Text style={[styles.calcTd, { flex: 1.4 }]}>
                                                            {masl ? `${masl} m` : "-"}
                                                        </Text>
                                                        <Text style={[styles.calcTdMuted, { flex: 2 }]}>
                                                            (masl - {Math.round(bounds.elevation.min)}) / ({Math.round(bounds.elevation.max)} - {Math.round(bounds.elevation.min)})
                                                        </Text>
                                                        <Text style={[styles.calcTdValue, { flex: 1, textAlign: "right" }]}>
                                                            {p?.features.elevation.toFixed(3) ?? "-"}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.calcTableRow}>
                                                        <Text style={[styles.calcTdBold, { flex: 1.2 }]}>Elevation Gain</Text>
                                                        <Text style={[styles.calcTd, { flex: 1.4 }]}>
                                                            {`${gain} m (masl ${masl}m - start ${sElev != null ? Math.round(sElev) : 0}m)`}
                                                        </Text>
                                                        <Text style={[styles.calcTdMuted, { flex: 2 }]}>
                                                            (gain - {Math.round(bounds.gain.min)}) / ({Math.round(bounds.gain.max)} - {Math.round(bounds.gain.min)})
                                                        </Text>
                                                        <Text style={[styles.calcTdValue, { flex: 1, textAlign: "right" }]}>
                                                            {p?.features.gain.toFixed(3) ?? "-"}
                                                        </Text>
                                                    </View>

                                                    <View style={styles.calcTableRow}>
                                                        <Text style={[styles.calcTdBold, { flex: 1.2 }]}>Slope</Text>
                                                        <Text style={[styles.calcTd, { flex: 1.4 }]}>
                                                            {selectedTrail.difficulty?.slope !== undefined ? `${selectedTrail.difficulty.slope}%` : "-"}
                                                        </Text>
                                                        <Text style={[styles.calcTdMuted, { flex: 2 }]}>
                                                            (slope - {bounds.slope.min.toFixed(1)}) / ({bounds.slope.max.toFixed(1)} - {bounds.slope.min.toFixed(1)})
                                                        </Text>
                                                        <Text style={[styles.calcTdValue, { flex: 1, textAlign: "right" }]}>
                                                            {p?.features.slope.toFixed(3) ?? "-"}
                                                        </Text>
                                                    </View>
                                                </>
                                            );
                                        })()}
                                    </View>

                                    <Text style={[styles.detailSectionTitle, { marginTop: 18 }]}>
                                        General & Technical Information
                                    </Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Address:</Text>
                                        <Text style={styles.detailVal}>{selectedTrail.general?.address || "-"}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Provinces:</Text>
                                        <Text style={styles.detailVal}>
                                            {selectedTrail.general?.province?.join(", ") || "-"}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Mountains:</Text>
                                        <Text style={styles.detailVal}>
                                            {selectedTrail.general?.mountain?.join(", ") || "-"}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Trail Qualities:</Text>
                                        <Text style={styles.detailVal}>
                                            {[
                                                ...(selectedTrail.difficulty?.quality || []),
                                                ...(selectedTrail.difficulty?.difficulty_points || []),
                                            ].join("; ") || "None"}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Start Coordinates:</Text>
                                        <Text style={styles.detailVal}>
                                            {selectedTrail.geography?.startLat && selectedTrail.geography?.startLong
                                                ? `${selectedTrail.geography.startLat.toFixed(5)}, ${selectedTrail.geography.startLong.toFixed(5)}`
                                                : "No GPS coordinates"}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailKey}>Start Elevation (Open-Meteo):</Text>
                                        <Text style={styles.detailVal}>
                                            {startElevations[selectedTrail.id] != null
                                                ? `${Math.round(startElevations[selectedTrail.id])} m`
                                                : "-"}
                                        </Text>
                                    </View>

                                    <Text style={[styles.detailSectionTitle, { marginTop: 18 }]}>
                                        Tourism Amenities (ITourism)
                                    </Text>
                                    {(() => {
                                        const p = profileMap.get(selectedTrail.id);
                                        const tour = selectedTrail.tourism;
                                        const tourFeatures = p?.features.tourism;

                                        const items: Array<{ label: string; raw: unknown; vec: number | null | undefined }> = [
                                            { label: "Shelter", raw: tour?.shelter, vec: tourFeatures?.shelter },
                                            { label: "Resting Area", raw: tour?.resting, vec: tourFeatures?.resting },
                                            { label: "Information Board", raw: tour?.information_board, vec: tourFeatures?.information_board },
                                            { label: "Clean Water", raw: tour?.clean_water, vec: tourFeatures?.clean_water },
                                            { label: "River", raw: tour?.river, vec: tourFeatures?.river },
                                            { label: "Lake", raw: tour?.lake, vec: tourFeatures?.lake },
                                            { label: "Waterfall", raw: tour?.waterfall, vec: tourFeatures?.waterfall },
                                            { label: "Monument", raw: tour?.monument, vec: tourFeatures?.monument },
                                            { label: "Community", raw: tour?.community, vec: tourFeatures?.community },
                                            { label: "Viewpoint", raw: tour?.viewpoint, vec: tourFeatures?.viewpoint },
                                            { label: "Network Connection", raw: tour?.network_connection, vec: tourFeatures?.network_connection },
                                        ];

                                        return (
                                            <View style={{ gap: 6 }}>
                                                {items.map((item) => (
                                                    <View key={item.label} style={styles.detailRow}>
                                                        <Text style={styles.detailKey}>{item.label}:</Text>
                                                        <Text style={styles.detailVal}>
                                                            Raw:{" "}
                                                            <Text style={{ fontWeight: "700" }}>
                                                                {item.raw === true
                                                                    ? "true"
                                                                    : item.raw === false
                                                                    ? "false"
                                                                    : item.raw === null
                                                                    ? "null"
                                                                    : Array.isArray(item.raw)
                                                                    ? item.raw.length > 0 ? `[${item.raw.join(", ")}]` : "[]"
                                                                    : String(item.raw ?? "null")}
                                                            </Text>
                                                            {"  |  "}Vector:{" "}
                                                            <Text style={{ fontWeight: "700", color: item.vec === 1 ? Colors.PRIMARY : item.vec === null ? Palette.Amber500 : Colors.TEXT_SECONDARY }}>
                                                                {item.vec !== null && item.vec !== undefined ? item.vec : "null"}
                                                            </Text>
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })()}
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
export { TrailDataset as TrailSection, TrailDataset as TrailTable };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 12,
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
        paddingBottom: 24,
    },
    tableScroll: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        backgroundColor: Colors.WHITE,
        overflow: "hidden",
    },
    table: {
        minWidth: 2650,
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
        paddingHorizontal: 6,
        textAlign: "center",
    },
    thSub: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.PRIMARY,
        letterSpacing: 0,
        textTransform: "none",
        paddingHorizontal: 6,
        marginTop: 2,
    },
    thSubCenter: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.PRIMARY,
        letterSpacing: 0,
        textTransform: "none",
        textAlign: "center",
        paddingHorizontal: 4,
        marginTop: 2,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        paddingVertical: 8,
        alignItems: "center",
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
        paddingHorizontal: 6,
    },
    tdCell: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        justifyContent: "center",
    },
    valNormalized: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    valRaw: {
        fontSize: 10,
        fontWeight: "500",
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
        lineHeight: 12,
    },
    valPrimary: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.PRIMARY,
        lineHeight: 16,
    },
    textPrimary: {
        color: Colors.PRIMARY,
    },
    nameCell: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.PRIMARY,
    },
    highlightCell: {
        backgroundColor: "rgba(16, 185, 129, 0.05)",
    },
    textMuted: {
        color: Palette.Neutral400,
    },
    textNull: {
        color: Palette.Amber500,
        fontStyle: "italic",
    },
    centerCell: {
        alignItems: "center",
    },
    rightCell: {
        alignItems: "flex-end",
    },
    centerText: {
        textAlign: "center",
    },
    rightText: {
        textAlign: "right",
    },

    // Column Widths
    colIndex: { width: 45, textAlign: "center" },
    colName: { width: 190, paddingHorizontal: 8 },
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
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    detailKey: {
        width: 170,
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
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate150,
        alignItems: "center",
    },
    calcTd: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
    },
    calcTdBold: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_PRIMARY,
    },
    calcTdMuted: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
    },
    calcTdValue: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
});
