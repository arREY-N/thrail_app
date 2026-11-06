/**
 * @file SimulationConvergenceChart.tsx
 * @description Interactive SVG chart showing the global profile evolution and convergence
 * across all cycles using the averaged mean cycle Gower's Distance (GD) of all 24 simulated user cohorts.
 */

import CustomIcon from "@/src/components/CustomIcon";
import { Colors, Palette } from "@/src/constants/colors";
import React, { useMemo, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { ISimulatedUser } from "./SimulatedUserModal";
import { ICycleInfo } from "./SimulationDataset";

export interface SimulationConvergenceChartProps {
    users: ISimulatedUser[];
    cycles: ICycleInfo[];
    selectedCycle: number;
    onSelectCycle?: (cycleIdx: number) => void;
}

interface IAggregatedCyclePoint {
    cycle: number;
    label: string;
    month: string;
    avgMeanGd: number;
    avgEasyGd: number;
    avgDiffGd: number;
    deltaFromStart: number;
    percentReduction: number;
    activeUsersCount: number;
}

export default function SimulationConvergenceChart({
    users,
    cycles,
    selectedCycle,
    onSelectCycle,
}: SimulationConvergenceChartProps) {
    const [hoveredCycle, setHoveredCycle] = useState<number | null>(null);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(true);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    // Compute averaged cycle metrics across all profiles for each cycle
    const dataPoints: IAggregatedCyclePoint[] = useMemo(() => {
        if (!users || users.length === 0) return [];

        const totalCycles = cycles.length;
        const points: IAggregatedCyclePoint[] = [];

        for (let cIdx = 0; cIdx < totalCycles; cIdx++) {
            let sumMean = 0;
            let sumEasy = 0;
            let sumDiff = 0;
            let count = 0;

            users.forEach((u) => {
                const historyItem = u.cycleHistory?.[cIdx];
                if (historyItem?.distances) {
                    const m = Number(historyItem.distances.mean_gd ?? 0);
                    const e = Number(historyItem.distances.easy?.gd ?? (historyItem.distances as any)?.easy_gd ?? 0);
                    const d = Number(
                        historyItem.distances.difficult?.gd ??
                        (historyItem.distances as any).diff?.gd ??
                        (historyItem.distances as any)?.diff_gd ??
                        0
                    );

                    if (!isNaN(m)) sumMean += m;
                    if (!isNaN(e)) sumEasy += e;
                    if (!isNaN(d)) sumDiff += d;
                    count++;
                }
            });

            const avgMean = count > 0 ? sumMean / count : 0;
            const avgEasy = count > 0 ? sumEasy / count : 0;
            const avgDiff = count > 0 ? sumDiff / count : 0;

            const cInfo = cycles[cIdx] || { label: `Cycle ${cIdx}`, month: "" };

            points.push({
                cycle: cIdx,
                label: cInfo.label,
                month: cInfo.month,
                avgMeanGd: avgMean,
                avgEasyGd: avgEasy,
                avgDiffGd: avgDiff,
                deltaFromStart: 0,
                percentReduction: 0,
                activeUsersCount: count,
            });
        }

        // Calculate delta and percentage reduction relative to Cycle 0
        const startMean = points[0]?.avgMeanGd || 1;
        points.forEach((p) => {
            p.deltaFromStart = p.avgMeanGd - startMean;
            p.percentReduction = startMean > 0 ? ((startMean - p.avgMeanGd) / startMean) * 100 : 0;
        });

        return points;
    }, [users, cycles]);

    if (dataPoints.length === 0) return null;

    const startVal = dataPoints[0]?.avgMeanGd ?? 0;
    const finalVal = dataPoints[dataPoints.length - 1]?.avgMeanGd ?? 0;
    const totalDelta = finalVal - startVal;
    const totalPct = startVal > 0 ? ((startVal - finalVal) / startVal) * 100 : 0;

    const activePoint =
        (hoveredCycle !== null && hoveredCycle >= 0 && hoveredCycle < dataPoints.length
            ? dataPoints[hoveredCycle]
            : null) ||
        dataPoints[selectedCycle] ||
        dataPoints[0] || {
            cycle: 0,
            label: "Cycle 0",
            month: "",
            avgMeanGd: 0,
            avgEasyGd: 0,
            avgDiffGd: 0,
            deltaFromStart: 0,
            percentReduction: 0,
            activeUsersCount: 0,
        };

    // SVG Chart Geometry
    const cyclesCount = dataPoints.length;
    const svgWidth = Math.max(900, cyclesCount * 90);
    const svgHeight = 360;
    const padLeft = 60;
    const padRight = 60;
    const padTop = 40;
    const padBottom = 50;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    // Collect all displayed values for Y-axis scaling
    const rawVals = showBreakdown
        ? [
              ...dataPoints.map((d) => d.avgMeanGd),
              ...dataPoints.map((d) => d.avgEasyGd),
              ...dataPoints.map((d) => d.avgDiffGd),
          ]
        : dataPoints.map((d) => d.avgMeanGd);
    const allVals = rawVals.filter((v) => !isNaN(v) && isFinite(v));

    const rawMax = allVals.length > 0 ? Math.max(...allVals, 0.250) : 0.250;
    // User requested full Y-axis from origin (0.000) to 0.250
    const minVal = 0.0;
    const maxVal = Math.max(0.250, isNaN(rawMax) ? 0.250 : Math.ceil(rawMax * 20) / 20);
    const valRange = maxVal - minVal > 0 ? maxVal - minVal : 0.25;

    const getX = (idx: number) => {
        if (cyclesCount <= 1) return padLeft + plotWidth / 2;
        const x = padLeft + (idx / Math.max(1, cyclesCount - 1)) * plotWidth;
        return isNaN(x) ? padLeft : x;
    };

    const getY = (val: number) => {
        const safeVal = isNaN(val) ? 0 : Math.max(minVal, Math.min(maxVal, val));
        const y = padTop + plotHeight - ((safeVal - minVal) / valRange) * plotHeight;
        return isNaN(y) ? padTop + plotHeight : y;
    };

    const meanPointsStr = dataPoints.map((d, i) => `${getX(i)},${getY(d.avgMeanGd ?? 0)}`).join(" ");
    const easyPointsStr = dataPoints.map((d, i) => `${getX(i)},${getY(d.avgEasyGd ?? 0)}`).join(" ");
    const diffPointsStr = dataPoints.map((d, i) => `${getX(i)},${getY(d.avgDiffGd ?? 0)}`).join(" ");

    // Y-axis horizontal grid lines from origin (0.000) to 0.250 (steps of 0.050)
    const yTicks = [0.000, 0.050, 0.100, 0.150, 0.200, 0.250];
    if (maxVal > 0.250 && !yTicks.includes(maxVal)) {
        yTicks.push(maxVal);
    }

    return (
        <View style={styles.chartCard}>
            {/* Header & Metrics Strip */}
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <View style={styles.titleBadgeRow}>
                        <View style={styles.iconBadge}>
                            <CustomIcon library="Feather" name="trending-down" size={16} color={Colors.PRIMARY} />
                        </View>
                        <Text style={styles.title}>All Profiles Convergence Trajectory</Text>
                        <View style={styles.cohortsPill}>
                            <Text style={styles.cohortsPillText}>{users.length} Cohorts Averaged</Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle}>
                        Averaged Mean Cycle Gower&apos;s Distance (GD) across all {cyclesCount} simulation cycles relative to Ground Truth.
                    </Text>
                </View>

                {/* Key Summary KPI Chips & Collapse Toggle */}
                <View style={styles.kpiRow}>
                    <View style={styles.kpiChip}>
                        <Text style={styles.kpiLabel}>Baseline (C0)</Text>
                        <Text style={styles.kpiVal}>{(startVal ?? 0).toFixed(4)}</Text>
                    </View>
                    <View style={styles.kpiChip}>
                        <Text style={styles.kpiLabel}>Terminal ({dataPoints[dataPoints.length - 1]?.label ?? "Final"})</Text>
                        <Text style={[styles.kpiVal, { color: Colors.PRIMARY }]}>{(finalVal ?? 0).toFixed(4)}</Text>
                    </View>
                    <View style={[styles.kpiChip, styles.kpiChipHighlight]}>
                        <Text style={styles.kpiLabel}>Net Convergence (Δ)</Text>
                        <Text style={styles.kpiValHighlight}>
                            {(totalDelta ?? 0).toFixed(4)} ({(totalPct ?? 0) > 0 ? `-${(totalPct ?? 0).toFixed(1)}%` : `+${Math.abs(totalPct ?? 0).toFixed(1)}%`})
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.collapseToggleBtn}
                        onPress={() => setIsCollapsed((prev) => !prev)}
                    >
                        <CustomIcon
                            library="Feather"
                            name={isCollapsed ? "chevron-down" : "chevron-up"}
                            size={16}
                            color={Colors.TEXT_SECONDARY}
                        />
                        <Text style={styles.collapseToggleBtnText}>
                            {isCollapsed ? "Expand Chart" : "Collapse"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Collapsible Chart Body */}
            {!isCollapsed && (
                <>
                    {/* Interactive Legend and View Toggles */}
                    <View style={styles.controlsRow}>
                <View style={styles.legendGroup}>
                    {/* Mean GD Line */}
                    <View style={styles.legendItem}>
                        <View style={[styles.legendLine, { backgroundColor: "#4F46E5", height: 3 }]} />
                        <Text style={styles.legendText}>Averaged Mean GD (Primary)</Text>
                    </View>

                    {showBreakdown && (
                        <>
                            {/* Easy Anchor Line */}
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { backgroundColor: Palette.Green700, height: 2 }]} />
                                <Text style={styles.legendText}>Easy Anchor Avg</Text>
                            </View>

                            {/* Difficult Anchor Line */}
                            <View style={styles.legendItem}>
                                <View style={[styles.legendLine, { backgroundColor: "#D97706", height: 2 }]} />
                                <Text style={styles.legendText}>Difficult Anchor Avg</Text>
                            </View>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={() => setShowBreakdown((prev) => !prev)}
                >
                    <CustomIcon
                        library="Feather"
                        name={showBreakdown ? "eye-off" : "eye"}
                        size={13}
                        color={Colors.TEXT_SECONDARY}
                    />
                    <Text style={styles.toggleBtnText}>
                        {showBreakdown ? "Hide Anchor Curves" : "Show Anchor Curves"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable SVG Canvas */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollCanvas}>
                <Svg width={svgWidth} height={svgHeight}>
                    {/* Horizontal Reference Grid Lines & Y-Axis Scale */}
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

                    {/* Vertical Cycle Grid Lines */}
                    {dataPoints.map((d, i) => {
                        const xPos = getX(i);
                        const isCurrentSelected = selectedCycle === i;

                        return (
                            <React.Fragment key={`vgrid-${i}`}>
                                <Line
                                    x1={xPos}
                                    y1={padTop}
                                    x2={xPos}
                                    y2={padTop + plotHeight}
                                    stroke={isCurrentSelected ? Colors.PRIMARY_LIGHT : Palette.Neutral100}
                                    strokeWidth={isCurrentSelected ? 2 : 1}
                                    strokeDasharray={isCurrentSelected ? undefined : "3,3"}
                                />
                            </React.Fragment>
                        );
                    })}

                    {/* Breakdown Curves (If Enabled) */}
                    {showBreakdown && (
                        <>
                            {/* Difficult Anchor Curve */}
                            <Polyline
                                points={diffPointsStr}
                                fill="none"
                                stroke="#D97706"
                                strokeWidth={2}
                                strokeDasharray="5,4"
                            />

                            {/* Easy Anchor Curve */}
                            <Polyline
                                points={easyPointsStr}
                                fill="none"
                                stroke={Palette.Green700}
                                strokeWidth={2}
                                strokeDasharray="3,3"
                            />
                        </>
                    )}

                    {/* Primary Curve: Averaged Mean Cycle GD */}
                    <Polyline
                        points={meanPointsStr}
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth={3.5}
                    />

                    {/* Active Selected Cycle Highlight Column Marker */}
                    {selectedCycle >= 0 && selectedCycle < cyclesCount && dataPoints[selectedCycle] && (
                        <G>
                            <Line
                                x1={getX(selectedCycle)}
                                y1={padTop - 8}
                                x2={getX(selectedCycle)}
                                y2={padTop + plotHeight}
                                stroke={Colors.PRIMARY}
                                strokeWidth={1.5}
                            />
                            <Circle
                                cx={getX(selectedCycle)}
                                cy={getY(dataPoints[selectedCycle]?.avgMeanGd ?? 0)}
                                r={7}
                                fill={Colors.PRIMARY}
                                stroke={Colors.WHITE}
                                strokeWidth={2.5}
                            />
                        </G>
                    )}

                    {/* Node Circles and Labels */}
                    {dataPoints.map((d, i) => {
                        const x = getX(i);
                        const yMean = getY(d.avgMeanGd ?? 0);
                        const yEasy = getY(d.avgEasyGd ?? 0);
                        const yDiff = getY(d.avgDiffGd ?? 0);
                        const isSelected = selectedCycle === i;
                        const isWeb = Platform.OS === "web";
                        const clickProps = isWeb
                            ? { onClick: () => onSelectCycle?.(i) }
                            : { onPress: () => onSelectCycle?.(i) };

                        return (
                            <G
                                key={`point-node-${i}`}
                                {...(clickProps as any)}
                                style={isWeb ? ({ cursor: "pointer" } as any) : undefined}
                            >
                                {/* Difficult Anchor Point (Small) */}
                                {showBreakdown && (
                                    <>
                                        <Circle cx={x} cy={yDiff} r={3.5} fill="#B45309" stroke={Colors.WHITE} strokeWidth={1} />
                                        <SvgText
                                            x={x}
                                            y={yDiff - 7}
                                            fontSize={9}
                                            fontWeight="600"
                                            fill="#B45309"
                                            textAnchor="middle"
                                        >
                                            {(d.avgDiffGd ?? 0).toFixed(3)}
                                        </SvgText>
                                    </>
                                )}

                                {/* Easy Anchor Point (Small) */}
                                {showBreakdown && (
                                    <>
                                        <Circle cx={x} cy={yEasy} r={3.5} fill={Palette.Green700} stroke={Colors.WHITE} strokeWidth={1} />
                                        <SvgText
                                            x={x}
                                            y={yEasy + 13}
                                            fontSize={9}
                                            fontWeight="600"
                                            fill={Palette.Green700}
                                            textAnchor="middle"
                                        >
                                            {(d.avgEasyGd ?? 0).toFixed(3)}
                                        </SvgText>
                                    </>
                                )}

                                {/* Primary Mean Point */}
                                <Circle
                                    cx={x}
                                    cy={yMean}
                                    r={isSelected ? 6 : 4.5}
                                    fill="#4F46E5"
                                    stroke={Colors.WHITE}
                                    strokeWidth={isSelected ? 2.5 : 1.5}
                                />
                                <SvgText
                                    x={x}
                                    y={yMean - 10}
                                    fontSize={10}
                                    fontWeight="bold"
                                    fill="#4F46E5"
                                    textAnchor="middle"
                                >
                                    {(d.avgMeanGd ?? 0).toFixed(4)}
                                </SvgText>

                                {/* X-Axis Cycle & Month Label */}
                                <SvgText
                                    x={x}
                                    y={padTop + plotHeight + 18}
                                    fontSize={10}
                                    fontWeight={isSelected ? "bold" : "600"}
                                    fill={isSelected ? Colors.PRIMARY : Colors.TEXT_PRIMARY}
                                    textAnchor="middle"
                                >
                                    {i === 0 ? "C0" : i === cyclesCount - 1 ? `C${i} (Final)` : `C${i}`}
                                </SvgText>
                                <SvgText
                                    x={x}
                                    y={padTop + plotHeight + 32}
                                    fontSize={9}
                                    fill={isSelected ? Colors.PRIMARY : Colors.TEXT_MUTED}
                                    textAnchor="middle"
                                >
                                    {d.month}
                                </SvgText>
                            </G>
                        );
                    })}
                </Svg>
            </ScrollView>

                    {/* Interactive Cycle Detail Footer */}
                    <View style={styles.footerBar}>
                        <View style={styles.footerLeft}>
                            <Text style={styles.footerCycleTitle}>
                                {activePoint.label || `Cycle ${activePoint.cycle}`} ({activePoint.month || ""})
                            </Text>
                            <Text style={styles.footerCycleSub}>
                                Mean GD: <Text style={{ fontWeight: "700", color: "#4F46E5" }}>{(activePoint.avgMeanGd ?? 0).toFixed(4)}</Text>
                                {"  •  "}
                                Easy Anchor: <Text style={{ fontWeight: "600", color: Palette.Green700 }}>{(activePoint.avgEasyGd ?? 0).toFixed(4)}</Text>
                                {"  •  "}
                                Diff Anchor: <Text style={{ fontWeight: "600", color: "#D97706" }}>{(activePoint.avgDiffGd ?? 0).toFixed(4)}</Text>
                            </Text>
                        </View>

                        <View style={styles.footerRight}>
                            <Text style={styles.footerChangeLabel}>
                                Net Reduction from Baseline:
                            </Text>
                            <Text
                                style={[
                                    styles.footerChangeVal,
                                    { color: (activePoint.deltaFromStart ?? 0) <= 0 ? Colors.PRIMARY : Palette.Amber700 },
                                ]}
                            >
                                {(activePoint.deltaFromStart ?? 0) <= 0 ? "" : "+"}
                                {(activePoint.deltaFromStart ?? 0).toFixed(4)} ({(activePoint.percentReduction ?? 0) >= 0 ? `-${(activePoint.percentReduction ?? 0).toFixed(2)}%` : `+${Math.abs(activePoint.percentReduction ?? 0).toFixed(2)}%`})
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    chartCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 16,
        paddingTop: 16,
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 12,
    },
    titleGroup: {
        flex: 1,
        minWidth: 280,
    },
    titleBadgeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    iconBadge: {
        backgroundColor: Colors.PRIMARY_LIGHT,
        padding: 5,
        borderRadius: 6,
    },
    title: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    cohortsPill: {
        backgroundColor: Palette.Neutral50,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    cohortsPillText: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 17,
    },
    kpiRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    kpiChip: {
        backgroundColor: Palette.Neutral50,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
        alignItems: "center",
    },
    kpiChipHighlight: {
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderColor: Colors.PRIMARY,
    },
    kpiLabel: {
        fontSize: 10,
        color: Colors.TEXT_MUTED,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    kpiVal: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
    },
    kpiValHighlight: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    collapseToggleBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: Palette.Neutral50,
        borderWidth: 1,
        borderColor: Palette.Neutral100,
    },
    collapseToggleBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.TEXT_SECONDARY,
    },
    controlsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: Palette.Neutral50,
        paddingTop: 8,
        paddingBottom: 4,
        marginBottom: 4,
        flexWrap: "wrap",
        gap: 8,
    },
    legendGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendLine: {
        width: 16,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 11,
        fontWeight: "500",
        color: Colors.TEXT_SECONDARY,
    },
    toggleBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: Palette.Neutral50,
    },
    toggleBtnText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: "500",
    },
    scrollCanvas: {
        marginVertical: 4,
    },
    footerBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: Palette.Neutral50,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 6,
        flexWrap: "wrap",
        gap: 8,
    },
    footerLeft: {
        flex: 1,
        minWidth: 240,
    },
    footerCycleTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    footerCycleSub: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    footerRight: {
        alignItems: "flex-end",
    },
    footerChangeLabel: {
        fontSize: 10,
        color: Colors.TEXT_MUTED,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    footerChangeVal: {
        fontSize: 13,
        fontWeight: "700",
    },
});

