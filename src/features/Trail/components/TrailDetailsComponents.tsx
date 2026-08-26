import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { ITrail } from '@/src/core/models/Trail/interfaces/Trail.types';
import { STAT_GLOSSARY, getFeatureIcon } from '@/src/features/Trail/utils/TrailDetailsHelpers';
import { IconLibrary } from '@/src/types/ui.types';

export interface SectionHeaderProps {
    iconLib: IconLibrary;
    iconName: string;
    title: string;
    color?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ iconLib, iconName, title, color = Colors.PRIMARY }) => (
    <View style={styles.sectionHeader}>
        <CustomIcon library={iconLib} name={iconName} size={20} color={color} />
        <CustomText variant="h3" style={styles.sectionTitle}>{title}</CustomText>
    </View>
);

export interface StatItemProps {
    id: string;
    iconLib: IconLibrary;
    icon: string;
    label: string;
    value: string | number;
    color: string;
    isActive: boolean;
    onPress: (id: string) => void;
}

export const StatItem: React.FC<StatItemProps> = ({ id, iconLib, icon, label, value, color, isActive, onPress }) => (
    <TouchableOpacity
        style={[styles.statItem, isActive && styles.statItemActive]}
        onPress={() => onPress(id)}
        activeOpacity={0.6}
    >
        <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
            <CustomIcon library={iconLib} name={icon} size={20} color={color} />
        </View>
        <CustomText variant="body" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</CustomText>
        <CustomText variant="caption" style={styles.statLabel}>{label}</CustomText>
    </TouchableOpacity>
);

export interface GlossaryTooltipProps {
    activeStat: string | null;
    trail?: ITrail | null;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ activeStat, trail }) => {
    if (!activeStat) return null;

    let pointerPosition: import('react-native').ViewStyle = { left: '50%', marginLeft: -8 };
    const baseData = STAT_GLOSSARY[activeStat];

    if (baseData.col === 0) pointerPosition = { left: '16.6%', marginLeft: -8 };
    if (baseData.col === 2) pointerPosition = { left: '83.3%', marginLeft: -8 };

    let descriptionText: string | null = null;
    if (activeStat === 'class' && trail?.description?.classificationDescription) {
        descriptionText = trail.description.classificationDescription;
    } else if (activeStat === 'difficulty' && trail?.description?.lascoRatingDescription) {
        descriptionText = trail.description.lascoRatingDescription;
    }

    return (
        <View style={styles.tooltipWrapper}>
            <View style={[styles.tooltipPointer, pointerPosition]} />
            <View style={styles.tooltipBody}>
                <CustomText variant="label" style={styles.tooltipTitle}>{baseData.title}</CustomText>

                {descriptionText ? (
                    <CustomText style={styles.tooltipText}>{descriptionText}</CustomText>
                ) : (
                    baseData.points.map((point, i) => (
                        <View key={i} style={styles.tooltipPointRow}>
                            <CustomText style={styles.tooltipPointLabel}>{point.label}: </CustomText>
                            <CustomText style={styles.tooltipPointText}>{point.text}</CustomText>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
};

export interface TagProps {
    label: string;
}

export const Tag: React.FC<TagProps> = ({ label }) => {
    const iconData = getFeatureIcon(label);
    return (
        <View style={styles.tag}>
            <View style={styles.tagIcon}>
                <CustomIcon library={iconData.library as IconLibrary} name={iconData.name} size={14} color={Colors.TRAIL_TAG_TEXT} />
            </View>
            <CustomText variant="caption" style={styles.tagText}>
                {label}
            </CustomText>
        </View>
    );
};

export interface StyledListItemProps {
    text: string;
    index: number;
    type: 'safety' | 'lgu' | 'guide';
}

export const StyledListItem: React.FC<StyledListItemProps> = ({ text, index, type }) => {
    let bgStyle, borderStyle, bulletBg, bulletText;

    if (type === 'safety') {
        bgStyle = { backgroundColor: Colors.TRAIL_SAFETY_BG };
        borderStyle = { borderColor: Colors.TRAIL_SAFETY_BORDER };
        bulletBg = { backgroundColor: Colors.TRAIL_SAFETY_BULLET_BG };
        bulletText = { color: Colors.TRAIL_SAFETY_BULLET_TEXT };
    } else if (type === 'lgu') {
        bgStyle = { backgroundColor: Colors.TRAIL_LGU_BG };
        borderStyle = { borderColor: Colors.TRAIL_LGU_BORDER };
        bulletBg = { backgroundColor: Colors.TRAIL_LGU_BULLET_BG };
        bulletText = { color: Colors.TRAIL_LGU_BULLET_TEXT };
    } else { // guide
        bgStyle = { backgroundColor: Colors.TRAIL_RULES_BG };
        borderStyle = { borderColor: Colors.TRAIL_RULES_BORDER };
        bulletBg = { backgroundColor: Colors.TRAIL_RULES_BULLET_BG };
        bulletText = { color: Colors.TRAIL_RULES_BULLET_TEXT };
    }

    return (
        <View style={[styles.listItemContainer, bgStyle, borderStyle]}>
            <View style={[styles.listBullet, bulletBg]}>
                <CustomText style={[styles.listBulletText, bulletText]}>{index + 1}</CustomText>
            </View>
            <CustomText style={styles.listText}>{text}</CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    // Header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.TEXT_PRIMARY, marginBottom: 0 },

    // Stats
    statItem: { alignItems: 'center', flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12 },
    statItemActive: { backgroundColor: Colors.TRAIL_ACTIVE_STAT_BG },
    iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontWeight: '900', fontSize: 15, color: Colors.TEXT_PRIMARY, marginBottom: 2 },
    statLabel: { color: Colors.TEXT_SECONDARY, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Tooltip
    tooltipWrapper: { marginTop: -4, paddingHorizontal: 12, position: 'relative', zIndex: 1 },
    tooltipPointer: { position: 'absolute', top: -7, width: 14, height: 14, backgroundColor: Colors.TRAIL_TOOLTIP_BG, transform: [{ rotate: '45deg' }], borderTopWidth: 1, borderLeftWidth: 1, borderColor: Colors.TRAIL_TOOLTIP_BORDER, zIndex: 2 },
    tooltipBody: { backgroundColor: Colors.TRAIL_TOOLTIP_BG, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.TRAIL_TOOLTIP_BORDER, zIndex: 1 },
    tooltipTitle: { fontWeight: 'bold', color: Colors.PRIMARY, marginBottom: 8 },
    tooltipText: { color: Colors.TEXT_SECONDARY, lineHeight: 26, fontSize: 14, textAlign: 'justify', letterSpacing: 0.2 },
    tooltipPointRow: { flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap' },
    tooltipPointLabel: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY, fontSize: 14 },
    tooltipPointText: { color: Colors.TEXT_SECONDARY, fontSize: 14 },

    // Tags
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.TRAIL_TAG_BG, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: Colors.TRAIL_TAG_BORDER },
    tagIcon: { marginRight: 6 },
    tagText: { color: Colors.TRAIL_TAG_TEXT, fontSize: 13, fontWeight: '600' },

    // Lists
    listItemContainer: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'flex-start' },
    listBullet: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14, marginTop: 0 },
    listBulletText: { fontSize: 12, fontWeight: '900' },
    listText: { flex: 1, color: Colors.TEXT_PRIMARY, fontSize: 14, lineHeight: 22, opacity: 0.85 },
});