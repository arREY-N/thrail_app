import type { Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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
import { GlobalStyles } from '@/src/constants/globalStyles';
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

function parseDateToMs(dateVal: unknown): number | null {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        return !isNaN(dateVal.getTime()) ? dateVal.getTime() : null;
    }
    if (typeof dateVal === 'number') {
        return dateVal;
    }
    if (typeof dateVal === 'string') {
        const parsed = new Date(dateVal).getTime();
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

function checkIsAlertExpired(targetHikeDate: unknown, alertCreatedAt: unknown, alertPhase: string): boolean {
    const now = Date.now();
    if (targetHikeDate) {
        const hikeMs = parseDateToMs(targetHikeDate);
        if (hikeMs != null) {
            const diffHours = (hikeMs - now) / (1000 * 60 * 60);
            if (diffHours < -24) {
                return true;
            }
        }
    } else if (alertCreatedAt) {
        const createdMs = parseDateToMs(alertCreatedAt);
        if (createdMs != null) {
            const hoursSinceAlert = (now - createdMs) / (1000 * 60 * 60);
            if (alertPhase === 'T-3' && hoursSinceAlert > 27) {
                return true;
            }
        }
    }
    return false;
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

export const GroupWeatherAlertBanner: React.FC<GroupWeatherAlertBannerProps> = ({ groupId, hikeDate }) => {
    const { latestAlert, isLoading } = useGroupWeatherAlert(groupId);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isExpired, setIsExpired] = useState<boolean>(false);

    const resolvedHikeDate = hikeDate ?? latestAlert?.hikeDate;
    const alertCreatedAt = latestAlert?.createdAt;
    const alertPhase = latestAlert?.phase ?? '';

    // Expiration Defense-in-Depth: Run time calculation inside useEffect to maintain render purity
    useEffect(() => {
        setIsExpired(checkIsAlertExpired(resolvedHikeDate, alertCreatedAt, alertPhase));
    }, [resolvedHikeDate, alertCreatedAt, alertPhase]);

    if (isLoading || !latestAlert || isExpired) {
        return null;
    }

    const isDanger = latestAlert.status === 'DANGER';
    const isCaution = latestAlert.status === 'CAUTION';

    const theme = isDanger
        ? {
            bg: '#FEF2F2',
            border: '#FCA5A5',
            badgeBg: '#FEE2E2',
            badgeText: '#DC2626',
            iconColor: '#DC2626',
            icon: 'alert-triangle' as const,
            library: 'Feather' as IconLibrary,
        }
        : isCaution
            ? {
                bg: '#FFFBEB',
                border: '#FCD34D',
                badgeBg: '#FEF3C7',
                badgeText: '#D97706',
                iconColor: '#D97706',
                icon: 'cloud-rain' as const,
                library: 'Feather' as IconLibrary,
            }
            : {
                bg: '#F0FDF4',
                border: '#86EFAC',
                badgeBg: '#DCFCE7',
                badgeText: '#15803D',
                iconColor: '#16A34A',
                icon: 'check-circle' as const,
                library: 'Feather' as IconLibrary,
            };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(prev => !prev);
    };

    const phaseTitle = getPhaseLabel(latestAlert.phase);

    return (
        <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            {/* Header / Summary Row */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleExpand}
                style={styles.headerRow}
            >
                <View style={[styles.iconCircle, { backgroundColor: theme.badgeBg }]}>
                    <CustomIcon
                        library={theme.library}
                        name={theme.icon}
                        size={18}
                        color={theme.iconColor}
                    />
                </View>

                <View style={styles.titleColumn}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.phaseBadge, { backgroundColor: theme.badgeBg }]}>
                            <CustomText variant="caption" style={[styles.phaseBadgeText, { color: theme.badgeText }]}>
                                {phaseTitle}
                            </CustomText>
                        </View>
                        {latestAlert.metrics?.precipitationProbability > 0 && (
                            <CustomText variant="caption" style={styles.metaMetric}>
                                {`🌧️ ${latestAlert.metrics.precipitationProbability}% Rain`}
                            </CustomText>
                        )}
                        {latestAlert.metrics?.temperature > 0 && (
                            <CustomText variant="caption" style={styles.metaMetric}>
                                {`🌡️ ${latestAlert.metrics.temperature}°C`}
                            </CustomText>
                        )}
                    </View>

                    <CustomText variant="label" style={styles.headlineText} numberOfLines={isExpanded ? undefined : 1}>
                        {latestAlert.headline}
                    </CustomText>

                    {!isExpanded && (
                        <CustomText variant="caption" style={styles.previewMessage} numberOfLines={1}>
                            {latestAlert.message}
                        </CustomText>
                    )}
                </View>

                <View style={styles.chevronWrapper}>
                    <CustomIcon
                        library="Feather"
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.TEXT_SECONDARY}
                    />
                </View>
            </TouchableOpacity>

            {/* Expandable Details */}
            {isExpanded && (
                <View style={styles.expandedContent}>
                    <CustomText variant="body" style={styles.fullMessage}>
                        {latestAlert.message}
                    </CustomText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1,
        marginVertical: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        ...GlobalStyles.dropShadow(2, 0.06),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    titleColumn: {
        flex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
    },
    phaseBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    phaseBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.4,
    },
    metaMetric: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    headlineText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    previewMessage: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    chevronWrapper: {
        paddingLeft: 8,
    },
    expandedContent: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    fullMessage: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.TEXT_PRIMARY,
    },
});

export default GroupWeatherAlertBanner;
