/**
 * @file SuperadminCard.tsx
 * @description Master reusable presentation card component for Superadmin entity listings (Tour Businesses, User Accounts, Applications, Mountains, Trails). Supports flexible headers (avatar initials or icons), status badges, rounded action button containers, icon-text metadata rows, tag chips with header prefixes, custom body nodes, action footers, and content-driven responsive 1/2/3-column grid layouts.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IconLibrary } from '@/src/types/ui.types';

export interface SuperadminCardInfoRow {
    icon: string;
    library?: IconLibrary;
    label?: string;
    value: string;
}

export interface SuperadminCardTag {
    label: string;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
}

interface Props {
    // Header Props
    avatarText?: string;
    avatarBgColor?: string;
    avatarTextColor?: string;
    iconName?: string;
    iconLibrary?: IconLibrary;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    subtitle?: string;
    statusBadge?: {
        label: string;
        bgColor: string;
        textColor: string;
    };
    headerAction?: {
        icon: string;
        library?: IconLibrary;
        color?: string;
        onPress: () => void;
    };

    // Body Props
    infoRows?: SuperadminCardInfoRow[];
    tagsHeader?: {
        icon: string;
        library?: IconLibrary;
        label: string;
    };
    tags?: SuperadminCardTag[];
    customBody?: React.ReactNode;

    // Footer Props
    footerAction?: {
        label: string;
        icon?: string;
        library?: IconLibrary;
        color?: string;
        hoverBgColor?: string;
        onPress: () => void;
    };

    // Layout Props
    isTablet?: boolean;
    isDesktop?: boolean;
}

/**
 * Master Superadmin presentation card component.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered card element.
 */
const SuperadminCard = ({
    avatarText,
    avatarBgColor = Colors.ROLE_AVATAR_BG,
    avatarTextColor = Colors.ROLE_AVATAR_TEXT,
    iconName,
    iconLibrary = 'Feather',
    iconColor = Colors.PRIMARY,
    iconBgColor = Colors.BACKGROUND,
    title,
    subtitle,
    statusBadge,
    headerAction,
    infoRows = [],
    tagsHeader,
    tags = [],
    customBody,
    footerAction,
    isTablet = false,
    isDesktop = false,
}: Props): React.JSX.Element => {
    return (
        <View
            style={[
                styles.card,
                isTablet ? styles.cardTablet : null,
                isDesktop ? styles.cardDesktop : null,
            ]}
        >
            {/* Header Row */}
            <View style={styles.cardHeader}>
                {avatarText ? (
                    <View style={[styles.avatarCircle, { backgroundColor: avatarBgColor }]}>
                        <CustomText style={[styles.avatarText, { color: avatarTextColor }]}>
                            {avatarText}
                        </CustomText>
                    </View>
                ) : iconName ? (
                    <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                        <CustomIcon library={iconLibrary} name={iconName} size={16} color={iconColor} />
                    </View>
                ) : null}

                <View style={styles.titleCol}>
                    <CustomText variant="body" style={styles.titleText} numberOfLines={1}>
                        {title}
                    </CustomText>
                    {subtitle ? (
                        <CustomText variant="caption" style={styles.subtitleText} numberOfLines={1}>
                            {subtitle}
                        </CustomText>
                    ) : null}
                </View>

                {statusBadge ? (
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
                        <CustomText
                            variant="caption"
                            style={[styles.statusBadgeText, { color: statusBadge.textColor }]}
                        >
                            {statusBadge.label}
                        </CustomText>
                    </View>
                ) : headerAction ? (
                    <Pressable
                        onPress={headerAction.onPress}
                        style={({ hovered }: { hovered?: boolean }) => [
                            styles.headerActionBtn,
                            hovered ? styles.headerActionBtnHovered : null,
                        ]}
                    >
                        <CustomIcon
                            library={headerAction.library || 'Feather'}
                            name={headerAction.icon}
                            size={16}
                            color={headerAction.color || Colors.PRIMARY}
                        />
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.divider} />

            {/* Card Body */}
            <View style={styles.cardBody}>
                {infoRows.map((row, index) => (
                    <View key={index} style={styles.infoRow}>
                        <CustomIcon
                            library={row.library || 'Feather'}
                            name={row.icon}
                            size={14}
                            color={Colors.TEXT_SECONDARY}
                        />
                        <CustomText variant="caption" style={styles.infoText} numberOfLines={1}>
                            {row.label ? (
                                <CustomText variant="caption" style={styles.infoLabel}>
                                    {row.label}{' '}
                                </CustomText>
                            ) : null}
                            {row.value}
                        </CustomText>
                    </View>
                ))}

                {tags.length > 0 ? (
                    <View style={styles.tagsWrapRow}>
                        {tagsHeader ? (
                            <View style={styles.tagsHeaderInline}>
                                <CustomIcon
                                    library={tagsHeader.library || 'Feather'}
                                    name={tagsHeader.icon}
                                    size={13}
                                    color={Colors.TEXT_SECONDARY}
                                />
                                <CustomText variant="caption" style={styles.tagsHeaderLabel}>
                                    {tagsHeader.label}
                                </CustomText>
                            </View>
                        ) : null}

                        {tags.map((tag, index) => {
                            const bg = tag.bgColor || Colors.STATUS_APPROVED_BG;
                            const textClr = tag.textColor || Colors.STATUS_APPROVED_TEXT;
                            const borderClr = tag.borderColor || Colors.STATUS_APPROVED_BORDER;

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.tagBadge,
                                        { backgroundColor: bg, borderColor: borderClr },
                                    ]}
                                >
                                    <CustomText
                                        variant="caption"
                                        style={[styles.tagBadgeText, { color: textClr }]}
                                    >
                                        {tag.label}
                                    </CustomText>
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                {customBody}
            </View>

            {/* Card Footer Action */}
            {footerAction ? (
                <View style={styles.cardFooter}>
                    <Pressable
                        onPress={footerAction.onPress}
                        style={({ hovered }: { hovered?: boolean }) => [
                            styles.footerBtn,
                            hovered ? { backgroundColor: footerAction.hoverBgColor || Colors.ERROR_BG } : null,
                        ]}
                    >
                        {footerAction.icon ? (
                            <CustomIcon
                                library={footerAction.library || 'Feather'}
                                name={footerAction.icon}
                                size={14}
                                color={footerAction.color || Colors.ERROR}
                            />
                        ) : null}
                        <CustomText
                            variant="caption"
                            style={[styles.footerBtnText, { color: footerAction.color || Colors.ERROR }]}
                        >
                            {footerAction.label}
                        </CustomText>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 12,
        ...GlobalStyles.dropShadow(2),
    },
    cardTablet: {
        width: 'calc(50% - 8px)' as unknown as number,
    },
    cardDesktop: {
        width: 'calc(33.333% - 11px)' as unknown as number,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleCol: {
        flex: 1,
    },
    titleText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
    },
    subtitleText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontWeight: 'bold',
        fontSize: 11,
    },
    headerActionBtn: {
        padding: 8,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionBtnHovered: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: Colors.TEXT_SECONDARY,
        flexShrink: 1,
    },
    infoLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    tagsContainer: {
        gap: 6,
        marginTop: 2,
    },
    tagsHeaderInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginRight: 2,
    },
    tagsHeaderLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    tagsWrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    tagBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    tagBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardFooter: {
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        alignItems: 'flex-end',
    },
    footerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    footerBtnText: {
        fontWeight: 'bold',
    },
});

export default SuperadminCard;
