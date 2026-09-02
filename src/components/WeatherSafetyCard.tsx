import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { DetailedWeatherSafetyReport, ProcessedWeatherData } from '@/src/core/types/weather';
import { getDetailedWeatherSafety } from '@/src/core/utility/weatherHelpers';
import { IconLibrary } from '@/src/types/ui.types';

export interface WeatherSafetyCardProps {
    report?: DetailedWeatherSafetyReport;
    weatherData?: ProcessedWeatherData | null;
    trailName?: string;
    compact?: boolean;
    showChecklist?: boolean;
    onPress?: () => void;
}

const WeatherSafetyCard: React.FC<WeatherSafetyCardProps> = ({
    report: propReport,
    weatherData,
    trailName,
    compact = false,
    showChecklist = true,
    onPress,
}) => {
    const report = propReport ?? getDetailedWeatherSafety(weatherData, trailName);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const isDanger = report.status === 'DANGER';
    const isCaution = report.status === 'CAUTION';

    const theme = isDanger
        ? {
            bg: Colors.WEATHER_DANGER_BG,
            border: Colors.WEATHER_DANGER_MAIN + '40',
            text: Colors.WEATHER_DANGER_MAIN,
            icon: 'alert-octagon',
            iconLib: 'Feather',
        }
        : isCaution
        ? {
            bg: Colors.WEATHER_CAUTION_BG,
            border: Colors.WEATHER_CAUTION_MAIN + '40',
            text: Colors.WEATHER_CAUTION_MAIN,
            icon: 'alert-triangle',
            iconLib: 'Feather',
        }
        : {
            bg: Colors.WEATHER_SAFE_BG,
            border: Colors.WEATHER_SAFE_MAIN + '40',
            text: Colors.WEATHER_SAFE_MAIN,
            icon: 'check-circle',
            iconLib: 'Feather',
        };

    if (compact) {
        return (
            <TouchableOpacity
                activeOpacity={onPress ? 0.7 : 1}
                onPress={onPress}
                style={[
                    styles.compactContainer,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                ]}
            >
                <View style={styles.compactRow}>
                    <View style={[styles.compactIconWrapper, { backgroundColor: theme.text + '20' }]}>
                        <CustomIcon
                            library={theme.iconLib as IconLibrary}
                            name={theme.icon}
                            size={20}
                            color={theme.text}
                        />
                    </View>
                    <View style={styles.compactTextWrapper}>
                        <CustomText variant="label" style={[styles.compactHeadline, { color: theme.text }]}>
                            {report.headline}
                        </CustomText>
                        <CustomText variant="caption" style={styles.compactDesc} numberOfLines={2}>
                            {report.description}
                        </CustomText>
                    </View>
                    {onPress && (
                        <CustomIcon
                            library="Feather"
                            name="chevron-right"
                            size={18}
                            color={theme.text}
                        />
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            {/* Header / Severity Badge */}
            <View style={styles.headerRow}>
                <View style={[styles.badge, { backgroundColor: theme.text }]}>
                    <CustomIcon
                        library={theme.iconLib as IconLibrary}
                        name={theme.icon}
                        size={14}
                        color={Colors.WHITE}
                    />
                    <CustomText variant="caption" style={styles.badgeText}>
                        {report.badgeText}
                    </CustomText>
                </View>
                {report.precipitationChance > 0 && (
                    <View style={styles.metricPill}>
                        <CustomIcon library="Ionicons" name="rainy-outline" size={14} color={Colors.TEXT_SECONDARY} />
                        <CustomText variant="caption" style={styles.metricText}>
                            {report.precipitationChance}% rain
                        </CustomText>
                    </View>
                )}
            </View>

            {/* Title & Description */}
            <CustomText variant="h3" style={[styles.headline, { color: isDanger ? theme.text : Colors.TEXT_PRIMARY }]}>
                {report.headline}
            </CustomText>
            <CustomText variant="body" style={styles.description}>
                {report.description}
            </CustomText>

            {/* Key Risks Chips */}
            {report.keyRisks.length > 0 && (
                <View style={styles.risksContainer}>
                    {report.keyRisks.map((risk, index) => (
                        <View key={index} style={[styles.riskChip, { borderColor: theme.border }]}>
                            <CustomIcon
                                library="Ionicons"
                                name="warning-outline"
                                size={14}
                                color={theme.text}
                            />
                            <CustomText variant="caption" style={[styles.riskText, { color: theme.text }]}>
                                {risk}
                            </CustomText>
                        </View>
                    ))}
                </View>
            )}

            {/* Actionable Gear & Safety Checklist */}
            {showChecklist && report.checklist.length > 0 && (
                <View style={styles.checklistSection}>
                    <View style={styles.checklistHeader}>
                        <CustomIcon library="Ionicons" name="checkbox-outline" size={18} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.checklistTitle}>
                            {'Recommended Gear & Safety Checklist'}
                        </CustomText>
                    </View>

                    <View style={styles.checklistItems}>
                        {report.checklist.map((item) => {
                            const isChecked = checkedIds.has(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.checklistItem, isChecked && styles.checklistItemChecked]}
                                    activeOpacity={0.7}
                                    onPress={() => toggleItem(item.id)}
                                >
                                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                                        {isChecked && (
                                            <CustomIcon library="Feather" name="check" size={14} color={Colors.WHITE} />
                                        )}
                                    </View>
                                    <CustomText
                                        variant="caption"
                                        style={[styles.checklistLabel, isChecked && styles.checklistLabelChecked]}
                                    >
                                        {item.label}
                                    </CustomText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 16,
        gap: 12,
        ...GlobalStyles.dropShadow(2, 0.08),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        color: Colors.WHITE,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    metricPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    metricText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    headline: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 24,
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
        lineHeight: 20,
    },
    risksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 2,
    },
    riskChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        gap: 6,
    },
    riskText: {
        fontWeight: '600',
        fontSize: 12,
    },
    checklistSection: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 14,
        gap: 10,
        marginTop: 4,
    },
    checklistHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checklistTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    checklistItems: {
        gap: 8,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: Colors.BACKGROUND,
        gap: 10,
    },
    checklistItemChecked: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
    },
    checkboxChecked: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    checklistLabel: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        lineHeight: 18,
    },
    checklistLabelChecked: {
        color: Colors.TEXT_SECONDARY,
        textDecorationLine: 'line-through',
    },
    compactContainer: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compactIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    compactTextWrapper: {
        flex: 1,
        gap: 2,
    },
    compactHeadline: {
        fontSize: 14,
        fontWeight: '700',
    },
    compactDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
    },
});

export { WeatherSafetyCard };
export default WeatherSafetyCard;
