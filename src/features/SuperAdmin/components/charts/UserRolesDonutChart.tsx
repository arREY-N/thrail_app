/**
 * @file UserRolesDonutChart.tsx
 * @description SVG Donut Chart with solid flat arc segments (`strokeLinecap="butt"`),
 * crisp white radial separators, centered layout, web mouse hover, and mobile touch tap selection.
 */

import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * Props for the UserRolesDonutChart component.
 * 
 * @param hikerCount - Total count of registered hiker users.
 * @param adminCount - Total count of business admin users.
 * @param superadminCount - Total count of superadmin users.
 */
interface Props {
    hikerCount: number;
    adminCount: number;
    superadminCount: number;
}

/**
 * Calculates an SVG arc path segment for a donut ring.
 */
function describeArc(
    cx: number,
    cy: number,
    radius: number,
    startDeg: number,
    endDeg: number,
): string {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(toRad(startDeg));
    const y1 = cy + radius * Math.sin(toRad(startDeg));
    const x2 = cx + radius * Math.cos(toRad(endDeg));
    const y2 = cy + radius * Math.sin(toRad(endDeg));

    const largeArc = endDeg - startDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/**
 * Converts degree to radian relative to 12 o'clock (-90 deg offset).
 */
const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

const SEGMENT_COLORS = {
    hikers: Colors.CHART_PRIMARY,       // Blue600 (Hiker role color from ProfileInfoScreen)
    guides: Colors.CHART_SECONDARY,     // Green700 (Admin/Guide role color from ProfileInfoScreen)
    superadmin: Colors.CHART_TERTIARY,  // Red650 (Superadmin role color from ProfileInfoScreen)
};

const CX = 90;
const CY = 90;
const RADIUS = 64;
const STROKE_W = 22;
const SVG_SIZE = 180;

/**
 * UserRolesDonutChart component displaying user role distribution with web hover and mobile tap selection.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered user roles donut chart component.
 */
const UserRolesDonutChart = ({
    hikerCount,
    adminCount,
    superadminCount,
}: Props): React.JSX.Element => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = hikerCount + adminCount + superadminCount;

    const rawSegments = [
        { label: 'Hikers', count: hikerCount, color: SEGMENT_COLORS.hikers },
        { label: 'Guides', count: adminCount, color: SEGMENT_COLORS.guides },
        { label: 'Superadmin', count: superadminCount, color: SEGMENT_COLORS.superadmin },
    ].filter(s => s.count > 0);

    let cursor = 0;
    const boundaryAngles: number[] = [];
    const arcs = rawSegments.map((seg) => {
        const angle = total > 0 ? (seg.count / total) * 360 : 0;
        const start = cursor;
        const end = cursor + angle;
        cursor = end;
        boundaryAngles.push(start);
        return { ...seg, startAngle: start, endAngle: end };
    });

    const innerR = RADIUS - STROKE_W / 2 - 1;
    const outerR = RADIUS + STROKE_W / 2 + 1;

    const activeArc = hoveredIndex !== null ? arcs[hoveredIndex] : null;
    const activePct = activeArc && total > 0 ? Math.round((activeArc.count / total) * 100) : 0;

    const handleSelectSegment = (idx: number) => {
        setHoveredIndex(prev => (prev === idx ? null : idx));
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <CustomText variant="h3" style={styles.cardTitle}>
                    User Account Roles
                </CustomText>
                <CustomText variant="caption" style={styles.cardSubtitle}>
                    Distribution of platform users ({total} Accounts)
                </CustomText>
            </View>

            {/* Center Donut SVG Canvas */}
            <View style={styles.donutCanvasWrapper}>
                <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                    {/* Background track ring */}
                    <Circle
                        cx={CX}
                        cy={CY}
                        r={RADIUS}
                        fill="none"
                        stroke={Colors.GRAY_ULTRALIGHT}
                        strokeWidth={STROKE_W}
                    />

                    {/* Solid arc segments with web mouse hover & mobile tap handlers */}
                    {arcs.map((arc, idx) => {
                        const isHovered = hoveredIndex === idx;
                        const isDimmed = hoveredIndex !== null && !isHovered;
                        return (
                            <G
                                key={idx}
                                onPress={() => handleSelectSegment(idx)}
                                {...({
                                    onMouseEnter: () => Platform.OS === 'web' && setHoveredIndex(idx),
                                    onMouseLeave: () => Platform.OS === 'web' && setHoveredIndex(null),
                                })}
                            >
                                <Path
                                    d={describeArc(CX, CY, RADIUS, arc.startAngle, arc.endAngle)}
                                    fill="none"
                                    stroke={arc.color}
                                    strokeWidth={isHovered ? STROKE_W + 5 : STROKE_W}
                                    strokeLinecap="butt"
                                    opacity={isDimmed ? 0.35 : 1}
                                />
                            </G>
                        );
                    })}

                    {/* Crisp White Radial Separator Lines */}
                    {arcs.length > 1 && boundaryAngles.map((angleDeg, idx) => {
                        const rad = toRad(angleDeg);
                        const x1 = CX + innerR * Math.cos(rad);
                        const y1 = CY + innerR * Math.sin(rad);
                        const x2 = CX + outerR * Math.cos(rad);
                        const y2 = CY + outerR * Math.sin(rad);
                        return (
                            <Line
                                key={`sep-${idx}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={Colors.WHITE}
                                strokeWidth="2.5"
                            />
                        );
                    })}

                    {/* Dynamic Center Ring Text */}
                    <SvgText
                        x={CX}
                        y={CY - 2}
                        fill={activeArc ? activeArc.color : Colors.TEXT_PRIMARY}
                        fontSize="26"
                        fontWeight="bold"
                        textAnchor="middle"
                    >
                        {activeArc ? activeArc.count : total}
                    </SvgText>
                    <SvgText
                        x={CX}
                        y={CY + 15}
                        fill={Colors.TEXT_SECONDARY}
                        fontSize="11"
                        fontWeight={activeArc ? "bold" : "normal"}
                        textAnchor="middle"
                    >
                        {activeArc ? `${activeArc.label} (${activePct}%)` : 'Accounts'}
                    </SvgText>
                </Svg>
            </View>

            {/* Bottom Legend Badges Bar (Matching HikerAreaChart Legend Style) */}
            <View style={styles.legendContainer}>
                {rawSegments.map((seg, idx) => {
                    const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
                    const isHovered = hoveredIndex === idx;

                    return (
                        <Pressable
                            key={idx}
                            style={({ hovered }) => [
                                styles.legendItem,
                                (hovered || isHovered) && [
                                    styles.legendItemHovered,
                                    { borderColor: seg.color },
                                ],
                            ]}
                            onPress={() => handleSelectSegment(idx)}
                            onHoverIn={() => Platform.OS === 'web' && setHoveredIndex(idx)}
                            onHoverOut={() => Platform.OS === 'web' && setHoveredIndex(null)}
                        >
                            <View style={[styles.legendBox, { backgroundColor: seg.color }]} />
                            <CustomText
                                variant="caption"
                                style={[styles.legendText, isHovered && { color: seg.color, fontWeight: 'bold' }]}
                            >
                                {seg.label}
                            </CustomText>
                            <CustomText
                                variant="caption"
                                style={[styles.legendCount, isHovered && { color: seg.color }]}
                            >
                                {seg.count} ({pct}%)
                            </CustomText>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        flex: 1,
        minWidth: 280,
        justifyContent: 'space-between',
        alignItems: 'stretch',
        ...GlobalStyles.dropShadow(2),
    },
    cardHeader: {
        marginBottom: 8,
    },
    cardTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        marginBottom: 2,
    },
    cardSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    donutCanvasWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        paddingVertical: 12,
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
        marginTop: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    legendItemHovered: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(1),
    },
    legendBox: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    legendCount: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
});

export default UserRolesDonutChart;
