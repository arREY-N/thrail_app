/**
 * @file RoomHeader.tsx
 * @description Dedicated header component for the chat room screen.
 * Displays a back button on the left, centered chat name and offer date (if available),
 * and a group/members button on the right that navigates to the group members screen.
 */

import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

export interface RoomHeaderProps {
    /** Primary chat title or group/trail name */
    title: string;
    /** Subtitle text (e.g. date, emergency contact, business name) */
    subtitle?: string;
    /** Raw date object, string, or Firestore Timestamp to format if subtitle is omitted */
    offerDate?: unknown;
    /** Callback when back chevron is pressed */
    onBackPress?: () => void;
    /** Callback when group info / members button is pressed */
    onOpenMembers?: () => void;
    /** Whether to show the members button on the right (defaults to true if onOpenMembers is provided) */
    showMembersButton?: boolean;
    /** Optional right-side action element (e.g. Live Monitor button on web) */
    rightAction?: React.ReactNode;
    /** Optional container style override */
    style?: StyleProp<ViewStyle>;
}

/**
 * Formats an unknown date value (Date, Timestamp, string, number) into a friendly date string.
 */
const formatOfferDate = (dateValue: unknown): string | null => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string') {
        const trimmed = dateValue.trim();
        if (trimmed.length > 0) return trimmed;
    }
    try {
        const rawDate = dateValue as { toDate?: () => Date };
        const d = typeof rawDate?.toDate === 'function'
            ? rawDate.toDate()
            : new Date(dateValue as string | number | Date);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        }
    } catch {
        return null;
    }
    return null;
};

/**
 * Custom header built specifically for RoomScreen.
 * Follows the design style of the original CustomHeader while rendering only:
 * 1. Left back button
 * 2. Centered chat name and/or offer date
 * 3. Right group/members button
 */
export const RoomHeader: React.FC<RoomHeaderProps> = ({
    title,
    subtitle,
    offerDate,
    onBackPress,
    onOpenMembers,
    showMembersButton,
    rightAction,
    style,
}) => {
    const displaySubtitle = subtitle || formatOfferDate(offerDate);
    const shouldShowMembersButton = (showMembersButton ?? true) && Boolean(onOpenMembers);

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.masterContainer, styles.flatHeader, style]}>
                <View style={styles.titleRow}>
                    {/* === LEFT: Back Button === */}
                    <View style={styles.leftBox} pointerEvents="box-none">
                        {onBackPress && (
                            <TouchableOpacity
                                onPress={onBackPress}
                                style={styles.backButton}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityRole="button"
                                accessibilityLabel="Back"
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="chevron-left"
                                    size={24}
                                    color={Colors.PRIMARY}
                                    style={styles.backButtonIcon}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* === CENTER: Chat Name & Offer Date === */}
                    <View style={styles.centerBox} pointerEvents="box-none">
                        <TouchableOpacity
                            onPress={onOpenMembers}
                            disabled={!onOpenMembers}
                            activeOpacity={0.7}
                            style={styles.titleContainer}
                        >
                            <CustomText
                                variant="label"
                                style={styles.mainTitle}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {title}
                            </CustomText>
                            {displaySubtitle ? (
                                <CustomText
                                    variant="caption"
                                    style={styles.subtitle}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {displaySubtitle}
                                </CustomText>
                            ) : null}
                        </TouchableOpacity>
                    </View>

                    {/* === RIGHT: Group / Members Button & Custom Actions === */}
                    <View style={styles.rightBox} pointerEvents="box-none">
                        {rightAction}
                        {shouldShowMembersButton && onOpenMembers && (
                            <TouchableOpacity
                                onPress={onOpenMembers}
                                style={styles.actionIcon}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityRole="button"
                                accessibilityLabel="Group Members"
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="users"
                                    size={22}
                                    color={Colors.PRIMARY}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        zIndex: 100,
    },
    masterContainer: {
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
    },
    flatHeader: {
        ...GlobalStyles.dropShadow(0, 0),
        borderBottomWidth: 0,
    },
    titleRow: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    leftBox: {
        flex: 1,
        alignItems: 'flex-start',
        zIndex: 10,
    },
    centerBox: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        paddingHorizontal: 56,
    },
    rightBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        zIndex: 10,
    },
    backButton: {
        padding: 6,
        marginLeft: -6,
    },
    backButtonIcon: {},
    actionIcon: {
        padding: 6,
        marginRight: -6,
    },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        paddingHorizontal: 8,
    },
    mainTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 2,
    },
});

export default RoomHeader;

