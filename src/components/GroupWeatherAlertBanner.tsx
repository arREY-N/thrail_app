import React, { useState } from 'react';
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

export interface GroupWeatherAlertBannerProps {
    groupId?: string | null;
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

export const GroupWeatherAlertBanner: React.FC<GroupWeatherAlertBannerProps> = ({ groupId }) => {
    const { latestAlert, isLoading } = useGroupWeatherAlert(groupId);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    if (isLoading || !latestAlert) {
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

    const toggleCheck = (id: string) => {
        setCheckedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
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

            {/* Expandable Details & Checklist */}
            {isExpanded && (
                <View style={styles.expandedContent}>
                    <CustomText variant="body" style={styles.fullMessage}>
                        {latestAlert.message}
                    </CustomText>

                    {latestAlert.checklist && latestAlert.checklist.length > 0 && (
                        <View style={styles.checklistSection}>
                            <CustomText variant="label" style={styles.checklistHeader}>
                                {'Recommended Trail Preparation:'}
                            </CustomText>

                            {latestAlert.checklist.map((item) => {
                                const isChecked = checkedItems.has(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        activeOpacity={0.7}
                                        onPress={() => toggleCheck(item.id)}
                                        style={[
                                            styles.checkItemRow,
                                            isChecked && styles.checkItemRowChecked,
                                        ]}
                                    >
                                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                            {isChecked && (
                                                <CustomIcon
                                                    library="Ionicons"
                                                    name="checkmark"
                                                    size={14}
                                                    color={Colors.WHITE}
                                                />
                                            )}
                                        </View>

                                        <CustomText
                                            variant="caption"
                                            style={[
                                                styles.checkItemLabel,
                                                isChecked && styles.checkItemLabelChecked,
                                            ]}
                                        >
                                            {item.label}
                                        </CustomText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
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
        marginBottom: 10,
    },
    checklistSection: {
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    checklistHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    checkItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: 8,
        marginBottom: 4,
    },
    checkItemRowChecked: {
        backgroundColor: '#F8FAFC',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_MEDIUM,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    checkItemLabel: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
    },
    checkItemLabelChecked: {
        color: Colors.TEXT_SECONDARY,
        textDecorationLine: 'line-through',
    },
});

export default GroupWeatherAlertBanner;
