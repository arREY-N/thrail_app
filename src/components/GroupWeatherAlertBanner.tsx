import type { Timestamp } from 'firebase/firestore';
import React, { useState, useSyncExternalStore } from 'react';
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { useGroupWeatherAlert } from '@/src/core/models/Group/Group';
import { IconLibrary } from '@/src/types/ui.types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type HikeDateValue = Date | Timestamp | string | number | null | undefined;

export interface GroupWeatherAlertBannerProps {
    groupId?: string | null;
    hikeDate?: HikeDateValue;
}

let cachedCurrentTime = Date.now();
const timeSubscribers = new Set<() => void>();
let timeIntervalId: ReturnType<typeof setInterval> | null = null;

function subscribeToCurrentTime(callback: () => void): () => void {
    timeSubscribers.add(callback);
    if (!timeIntervalId && typeof setInterval !== 'undefined') {
        timeIntervalId = setInterval(() => {
            cachedCurrentTime = Date.now();
            timeSubscribers.forEach(cb => cb());
        }, 60000);
    }
    return () => {
        timeSubscribers.delete(callback);
        if (timeSubscribers.size === 0 && timeIntervalId) {
            clearInterval(timeIntervalId);
            timeIntervalId = null;
        }
    };
}

function getCurrentTimeSnapshot(): number {
    return cachedCurrentTime;
}

function useCurrentTime(): number {
    return useSyncExternalStore(subscribeToCurrentTime, getCurrentTimeSnapshot, getCurrentTimeSnapshot);
}

function parseDateToMs(dateVal: unknown): number | null {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        return !isNaN(dateVal.getTime()) ? dateVal.getTime() : null;
    }
    if (typeof dateVal === 'number') {
        return dateVal;
    }
    if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const parts = trimmed.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2], 5, 0, 0, 0).getTime();
        }
        const parsed = new Date(trimmed).getTime();
        return isNaN(parsed) ? null : parsed;
    }
    if (
        typeof dateVal === 'object' &&
        dateVal !== null &&
        'toDate' in dateVal &&
        typeof (dateVal as { toDate: () => unknown }).toDate === 'function'
    ) {
        const d = (dateVal as { toDate: () => unknown }).toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d.getTime() : null;
    }
    if (
        typeof dateVal === 'object' &&
        dateVal !== null &&
        'seconds' in dateVal &&
        typeof (dateVal as { seconds: unknown }).seconds === 'number'
    ) {
        return (dateVal as { seconds: number }).seconds * 1000;
    }
    return null;
}

/**
 * Resolves the timestamp in milliseconds when the hike is considered concluded.
 * - Date-only strings (YYYY-MM-DD) or midnight timestamps expire at 23:59:59 of that hike day.
 * - Explicit timestamp/times expire 4 hours after the scheduled hike time (buffer for hike completion).
 */
function resolveHikeExpirationMs(dateVal: unknown): number | null {
    if (!dateVal) return null;
    let d: Date | null = null;

    if (dateVal instanceof Date) {
        d = !isNaN(dateVal.getTime()) ? dateVal : null;
    } else if (typeof dateVal === 'number') {
        d = new Date(dateVal);
    } else if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const parts = trimmed.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
        }
        const parsed = new Date(trimmed);
        d = !isNaN(parsed.getTime()) ? parsed : null;
    } else if (
        typeof dateVal === 'object' &&
        dateVal !== null &&
        'toDate' in dateVal &&
        typeof (dateVal as { toDate: () => unknown }).toDate === 'function'
    ) {
        const res = (dateVal as { toDate: () => unknown }).toDate();
        d = res instanceof Date && !isNaN(res.getTime()) ? res : null;
    } else if (
        typeof dateVal === 'object' &&
        dateVal !== null &&
        'seconds' in dateVal &&
        typeof (dateVal as { seconds: unknown }).seconds === 'number'
    ) {
        d = new Date((dateVal as { seconds: number }).seconds * 1000);
    }

    if (!d || isNaN(d.getTime())) return null;

    // If date has midnight time (00:00:00), treat as full calendar day expiring at 23:59:59.999
    if (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
    }

    // Explicit timestamp: 4 hours grace buffer past scheduled hike time
    return d.getTime() + (4 * 60 * 60 * 1000);
}

function getPhaseLabel(phase: string): string {
    switch (phase) {
        case 'T-168':
            return '7-DAY FORECAST';
        case 'T-72':
            return '3-DAY ADVISORY';
        case 'T-24':
            return 'EVE-OF-HIKE UPDATE';
        case 'T-3':
            return 'FINAL DEPARTURE ALERT';
        default:
            return phase;
    }
}

/**
 * Calculates a dynamic countdown badge label based on the target hike date.
 * E.g. "5-DAY FORECAST", "4-DAY FORECAST", "TOMORROW • EVE-OF-HIKE", "TODAY • FINAL DEPARTURE".
 */
function getDynamicPhaseLabel(
    hikeDateVal: unknown,
    currentTime: number,
    fallbackPhase: string
): string {
    const hikeMs = parseDateToMs(hikeDateVal);
    if (hikeMs == null) {
        return getPhaseLabel(fallbackPhase);
    }

    const hikeDateObj = new Date(hikeMs);
    const currentDateObj = new Date(currentTime);

    // Calculate calendar days difference (ignoring time-of-day offsets)
    const startOfToday = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), currentDateObj.getDate()).getTime();
    const startOfHikeDay = new Date(hikeDateObj.getFullYear(), hikeDateObj.getMonth(), hikeDateObj.getDate()).getTime();
    const calendarDaysLeft = Math.round((startOfHikeDay - startOfToday) / (1000 * 60 * 60 * 24));

    if (calendarDaysLeft <= 0) {
        return 'TODAY • FINAL DEPARTURE';
    }
    if (calendarDaysLeft === 1) {
        return 'TOMORROW • EVE-OF-HIKE';
    }
    if (calendarDaysLeft === 2) {
        return '2-DAY ADVISORY';
    }
    if (calendarDaysLeft === 3) {
        return '3-DAY ADVISORY';
    }
    if (calendarDaysLeft >= 4) {
        return `${calendarDaysLeft}-DAY FORECAST`;
    }

    return getPhaseLabel(fallbackPhase);
}

/**
 * Formats target hike date as a readable short string, e.g. "Sun, Oct 19".
 */
function formatHikeDate(dateVal: unknown): string | null {
    const ms = parseDateToMs(dateVal);
    if (!ms) return null;
    const d = new Date(ms);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Strips redundant phase descriptions (e.g. "(7-Day Forecast)") from the alert headline.
 */
function cleanHeadline(headline?: string): string {
    if (!headline) return 'Weather Advisory';
    return headline
        .replace(/\s*\([^)]*(?:forecast|advisory|alert|update|day)[^)]*\)/gi, '')
        .trim();
}

/**
 * Produces a concise summary string for the collapsed second row, e.g. "27°C • 💨 18 km/h".
 */
function getQuickStats(metrics?: { temperature?: number; precipitationProbability?: number; windSpeed?: number }): string | null {
    if (!metrics) return null;
    const parts: string[] = [];
    if (typeof metrics.temperature === 'number' && metrics.temperature > 0) {
        parts.push(`${Math.round(metrics.temperature)}°C`);
    }
    if (typeof metrics.windSpeed === 'number' && metrics.windSpeed > 0) {
        parts.push(`💨 ${Math.round(metrics.windSpeed)} km/h`);
    } else if (typeof metrics.precipitationProbability === 'number' && metrics.precipitationProbability > 0) {
        parts.push(`🌧️ ${metrics.precipitationProbability}%`);
    }
    return parts.length > 0 ? parts.join(' • ') : null;
}

/**
 * Formats UV Index with standard WHO rating labels.
 */
function formatUvIndex(uv?: number): string {
    if (uv == null || isNaN(uv)) return 'N/A';
    if (uv <= 2) return `${uv} (Low)`;
    if (uv <= 5) return `${uv} (Mod)`;
    if (uv <= 7) return `${uv} (High)`;
    if (uv <= 10) return `${uv} (V.High)`;
    return `${uv} (Ext)`;
}

export const GroupWeatherAlertBanner: React.FC<GroupWeatherAlertBannerProps> = ({ groupId, hikeDate }) => {
    const { latestAlert, isLoading } = useGroupWeatherAlert(groupId);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const currentTime = useCurrentTime();

    if (isLoading || !latestAlert) {
        return null;
    }

    // Expiration Guard:
    // 1. If explicit hike date (or latestAlert.hikeDate) is available, hide banner immediately once hike concludes
    const resolvedHikeDate = hikeDate ?? latestAlert.hikeDate;
    if (resolvedHikeDate) {
        const expirationMs = resolveHikeExpirationMs(resolvedHikeDate);
        if (expirationMs != null && currentTime > expirationMs) {
            return null;
        }
    } else if (latestAlert.createdAt) {
        // Fallback: If no explicit hike date is available, expire based on document createdAt age across all phases
        const createdMs = parseDateToMs(latestAlert.createdAt);
        if (createdMs != null) {
            const hoursSinceAlert = (currentTime - createdMs) / (1000 * 60 * 60);
            const maxAlertValidityHours = latestAlert.phase === 'T-3'
                ? 8
                : latestAlert.phase === 'T-24'
                    ? 36
                    : latestAlert.phase === 'T-72'
                        ? 84
                        : 180;
            if (hoursSinceAlert > maxAlertValidityHours) {
                return null;
            }
        }
    }

    const isDanger = latestAlert.status === 'DANGER';
    const isCaution = latestAlert.status === 'CAUTION';

    // Translucent seamless styling: no solid backgrounds or harsh borders to avoid white halo
    const theme = isDanger
        ? {
            bg: 'rgba(239, 68, 68, 0.08)',
            border: 'rgba(239, 68, 68, 0.25)',
            badgeBg: 'rgba(239, 68, 68, 0.16)',
            badgeText: '#B91C1C',
            accent: '#B91C1C',
            iconColor: '#DC2626',
            dotColor: '#DC2626',
            icon: 'alert-triangle' as const,
            library: 'Feather' as IconLibrary,
            statusLabel: 'DANGER',
            chipBg: 'rgba(239, 68, 68, 0.06)',
            chipBorder: 'rgba(239, 68, 68, 0.18)',
        }
        : isCaution
            ? {
                bg: 'rgba(245, 158, 11, 0.08)',
                border: 'rgba(245, 158, 11, 0.25)',
                badgeBg: 'rgba(245, 158, 11, 0.16)',
                badgeText: '#B45309',
                accent: '#B45309',
                iconColor: '#D97706',
                dotColor: '#D97706',
                icon: 'cloud-rain' as const,
                library: 'Feather' as IconLibrary,
                statusLabel: 'CAUTION',
                chipBg: 'rgba(245, 158, 11, 0.06)',
                chipBorder: 'rgba(245, 158, 11, 0.18)',
            }
            : {
                bg: 'rgba(34, 197, 94, 0.08)',
                border: 'rgba(34, 197, 94, 0.25)',
                badgeBg: 'rgba(34, 197, 94, 0.16)',
                badgeText: '#15803D',
                accent: '#15803D',
                iconColor: '#16A34A',
                dotColor: '#16A34A',
                icon: 'check-circle' as const,
                library: 'Feather' as IconLibrary,
                statusLabel: 'SAFE',
                chipBg: 'rgba(34, 197, 94, 0.06)',
                chipBorder: 'rgba(34, 197, 94, 0.18)',
            };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(prev => !prev);
    };

    const dynamicPhase = getDynamicPhaseLabel(resolvedHikeDate, currentTime, latestAlert.phase);
    const targetDateFormatted = formatHikeDate(resolvedHikeDate);
    const cleanedHeadline = cleanHeadline(latestAlert.headline);
    const quickStatsText = getQuickStats(latestAlert.metrics);

    return (
        <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            {/* Collapsed Header / Summary */}
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={toggleExpand}
                style={styles.headerPressable}
            >
                {/* Row 1: Status Pill + Dynamic Countdown on left, Target Hike Date + Chevron on right */}
                <View style={styles.topRow}>
                    <View style={styles.badgeCluster}>
                        <View style={[styles.statusBadge, { backgroundColor: theme.badgeBg }]}>
                            <View style={[styles.statusDot, { backgroundColor: theme.dotColor }]} />
                            <CustomText variant="caption" style={[styles.statusBadgeText, { color: theme.badgeText }]}>
                                {theme.statusLabel}
                            </CustomText>
                        </View>
                        <CustomText variant="caption" style={[styles.countdownText, { color: theme.accent }]}>
                            {dynamicPhase}
                        </CustomText>
                    </View>

                    <View style={styles.rightCluster}>
                        {targetDateFormatted ? (
                            <View style={styles.dateTag}>
                                <CustomIcon
                                    library="Feather"
                                    name="calendar"
                                    size={11}
                                    color={Colors.TEXT_SECONDARY}
                                    style={styles.dateIcon}
                                />
                                <CustomText variant="caption" style={styles.dateText}>
                                    {targetDateFormatted}
                                </CustomText>
                            </View>
                        ) : null}
                        <CustomIcon
                            library="Feather"
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={Colors.TEXT_SECONDARY}
                        />
                    </View>
                </View>

                {/* Row 2: Direct trail condition summary on left, Compact weather metrics on right */}
                <View style={styles.bottomRow}>
                    <CustomText
                        variant="label"
                        style={styles.headlineText}
                        numberOfLines={isExpanded ? 2 : 1}
                    >
                        {cleanedHeadline}
                    </CustomText>

                    {quickStatsText ? (
                        <View style={[styles.quickStatsPill, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                            <CustomText variant="caption" style={[styles.quickStatsText, { color: theme.accent }]}>
                                {quickStatsText}
                            </CustomText>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>

            {/* Expandable Bento Metrics & Safety Advisory */}
            {isExpanded && (
                <View style={styles.expandedContent}>
                    <CustomText variant="caption" style={styles.sectionHeaderTitle}>
                        METRICS BREAKDOWN
                    </CustomText>

                    <View style={styles.bentoGrid}>
                        {/* Rain */}
                        <View style={[styles.bentoChip, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                            <View style={styles.bentoChipTop}>
                                <CustomIcon library="Feather" name="cloud-rain" size={12} color={theme.iconColor} />
                                <CustomText variant="caption" style={styles.bentoChipLabel}>Rain</CustomText>
                            </View>
                            <CustomText variant="label" style={styles.bentoChipValue}>
                                {latestAlert.metrics?.precipitationProbability != null ? `${latestAlert.metrics.precipitationProbability}%` : '0%'}
                            </CustomText>
                        </View>

                        {/* Temp */}
                        <View style={[styles.bentoChip, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                            <View style={styles.bentoChipTop}>
                                <CustomIcon library="Feather" name="thermometer" size={12} color={theme.iconColor} />
                                <CustomText variant="caption" style={styles.bentoChipLabel}>Temp</CustomText>
                            </View>
                            <CustomText variant="label" style={styles.bentoChipValue}>
                                {latestAlert.metrics?.temperature != null && latestAlert.metrics.temperature > 0 ? `${Math.round(latestAlert.metrics.temperature)}°C` : 'N/A'}
                            </CustomText>
                        </View>

                        {/* Wind */}
                        <View style={[styles.bentoChip, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                            <View style={styles.bentoChipTop}>
                                <CustomIcon library="Feather" name="wind" size={12} color={theme.iconColor} />
                                <CustomText variant="caption" style={styles.bentoChipLabel}>Wind</CustomText>
                            </View>
                            <CustomText variant="label" style={styles.bentoChipValue}>
                                {latestAlert.metrics?.windSpeed != null && latestAlert.metrics.windSpeed > 0 ? `${Math.round(latestAlert.metrics.windSpeed)} km/h` : 'N/A'}
                            </CustomText>
                        </View>

                        {/* UV Index */}
                        <View style={[styles.bentoChip, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                            <View style={styles.bentoChipTop}>
                                <CustomIcon library="Feather" name="sun" size={12} color={theme.iconColor} />
                                <CustomText variant="caption" style={styles.bentoChipLabel}>UV Index</CustomText>
                            </View>
                            <CustomText variant="label" style={styles.bentoChipValue}>
                                {formatUvIndex(latestAlert.metrics?.uvIndex)}
                            </CustomText>
                        </View>
                    </View>

                    {/* Trail Safety Advisory */}
                    {latestAlert.message ? (
                        <View style={[styles.advisoryBox, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                            <View style={styles.advisoryHeaderRow}>
                                <CustomIcon
                                    library="Feather"
                                    name="info"
                                    size={12}
                                    color={theme.iconColor}
                                    style={styles.advisoryIcon}
                                />
                                <CustomText variant="caption" style={[styles.advisoryTitle, { color: theme.accent }]}>
                                    TRAIL SAFETY ADVISORY
                                </CustomText>
                            </View>
                            <CustomText variant="body" style={styles.advisoryMessage}>
                                {latestAlert.message}
                            </CustomText>
                        </View>
                    ) : null}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 12,
        marginTop: 6,
        marginBottom: 4,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    headerPressable: {
        width: '100%',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badgeCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.4,
    },
    countdownText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    rightCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
    },
    dateIcon: {
        marginRight: 3,
    },
    dateText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    headlineText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        marginRight: 8,
    },
    quickStatsPill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: StyleSheet.hairlineWidth,
        flexShrink: 0,
    },
    quickStatsText: {
        fontSize: 10,
        fontWeight: '600',
    },
    expandedContent: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0, 0, 0, 0.06)',
    },
    sectionHeaderTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    bentoGrid: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    bentoChip: {
        flex: 1,
        minWidth: 64,
        paddingVertical: 7,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
    },
    bentoChipTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 3,
    },
    bentoChipLabel: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    bentoChipValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    advisoryBox: {
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    advisoryHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    advisoryIcon: {
        marginRight: 2,
    },
    advisoryTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.4,
    },
    advisoryMessage: {
        fontSize: 11,
        lineHeight: 16,
        color: Colors.TEXT_PRIMARY,
    },
});

export default GroupWeatherAlertBanner;
