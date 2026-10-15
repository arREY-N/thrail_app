/**
 * @file NotificationCard.tsx
 * @description Standalone 3-column notification card featuring dynamic icon mapping,
 * redundant prefix headline sanitization, relative elapsed time below the icon squircle,
 * and high-contrast unread (Forest Green border/squircle + dot) vs. read states.
 */

import React from 'react';
import {
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Notification } from '@/src/core/models/Notification/Notification';
import { getWeatherIcon } from '@/src/core/utility/weatherHelpers';
import { IconLibrary } from '@/src/types/ui.types';
import { getShortTimeElapsed, safeParseDateString } from '@/src/utils/dateFormatter';

/**
 * Props for NotificationCard component.
 * @param item - Canonical Notification entity
 * @param onPress - Callback invoked with notification ID upon press
 */
export interface NotificationCardProps {
    item: Notification;
    onPress: (id: string) => void;
}

interface ResolvedNotificationIcon {
    name: string;
    lib: IconLibrary;
}

/**
 * Resolves the icon using backend metadata or title fallbacks.
 * Uses core weatherHelpers (getWeatherIcon) for WMO-compliant weather alerts.
 * @param item - Notification entity
 * @returns {ResolvedNotificationIcon} Resolved icon name and icon library
 */
const resolveNotificationIcon = (item: Notification): ResolvedNotificationIcon => {
    const type = item.metadata?.type as string | undefined;
    const severity = typeof item.metadata?.severity === 'string' ? item.metadata.severity.toUpperCase() : undefined;
    const weatherCode = typeof item.metadata?.weatherCode === 'number' ? item.metadata.weatherCode : undefined;
    const t = (item.title || '').toLowerCase();

    // 1. Weather Alerts
    if (type === 'weather_alert' || t.includes('weather') || t.includes('forecast') || t.includes('rain') || t.includes('cyclone') || t.includes('storm')) {
        if (weatherCode !== undefined) {
            return {
                name: getWeatherIcon(weatherCode),
                lib: 'MaterialCommunityIcons',
            };
        }
        if (severity === 'DANGER' || t.includes('warning') || t.includes('danger') || t.includes('hazard') || t.includes('severe')) {
            return {
                name: 'weather-lightning',
                lib: 'MaterialCommunityIcons',
            };
        }
        if (severity === 'SAFE' || t.includes('optimal') || t.includes('clear')) {
            return {
                name: 'weather-sunny',
                lib: 'MaterialCommunityIcons',
            };
        }
        return {
            name: 'weather-pouring',
            lib: 'MaterialCommunityIcons',
        };
    }

    // 2. Booking Reminders
    if (type === 'booking_reminder' || type === 'booking_status' || t.includes('booking') || t.includes('reservation') || t.includes('schedule') || t.includes('hike')) {
        return {
            name: 'calendar-check',
            lib: 'MaterialCommunityIcons',
        };
    }

    // 3. Payment
    if (type === 'payment' || t.includes('payment') || t.includes('paid') || t.includes('refund') || t.includes('transaction')) {
        return {
            name: 'credit-card',
            lib: 'Feather',
        };
    }

    // 4. Review
    if (type === 'review' || t.includes('review') || t.includes('rating') || t.includes('feedback')) {
        return {
            name: 'star',
            lib: 'Feather',
        };
    }

    // 5. Community & Groups
    if (type === 'community' || t.includes('group') || t.includes('community') || t.includes('chat') || t.includes('room')) {
        return {
            name: 'account-group',
            lib: 'MaterialCommunityIcons',
        };
    }

    // 6. System Updates
    if (type === 'system_update' || t.includes('update') || t.includes('download')) {
        return {
            name: 'download-cloud',
            lib: 'Feather',
        };
    }

    return {
        name: 'bell',
        lib: 'Feather',
    };
};

/**
 * Strips all Unicode emojis, pictographs, and variation selectors from a string,
 * leaving pure clean text.
 * @param text - Raw text possibly containing emojis
 * @returns {string} Sanitized text free of emojis
 */
export const stripEmojis = (text: string): string => {
    return text
        .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u20E3\u25B6\u25C0\u2600-\u27BF]/gu, '')
        .replace(/^\s+/, '')
        .trim();
};

/**
 * 3-Column Notification Card component (Option A).
 * Layout:
 * - Left column: Top-aligned icon squircle (40x40 chip green).
 * - Middle column: Authentic clean notification title + 2-line message snippet.
 * - Trailing column: Relative elapsed time + optional emerald unread dot + chevron [ time • > ].
 */
export const NotificationCard = ({
    item,
    onPress,
}: NotificationCardProps): React.JSX.Element => {
    const isUnread = !item.read;
    const iconData = resolveNotificationIcon(item);
    const parsedDate = item.createdAt instanceof Date
        ? item.createdAt
        : safeParseDateString(item.createdAt);
    const timeText = getShortTimeElapsed(parsedDate);

    return (
        <Pressable
            onPress={() => onPress(item.id)}
            style={({ pressed }) => [
                styles.card,
                isUnread ? styles.unreadCard : styles.readCard,
                pressed && styles.pressedCard,
            ]}
        >
            {/* Left Column: Icon Squircle (Top-Aligned) */}
            <View style={styles.leftColumn}>
                <View
                    style={[
                        styles.iconSquircle,
                        isUnread ? styles.unreadIconSquircle : styles.readIconSquircle,
                    ]}
                >
                    <CustomIcon
                        library={iconData.lib}
                        name={iconData.name}
                        size={20}
                        color={isUnread ? Colors.PRIMARY : Colors.GRAY_MEDIUM}
                    />
                </View>
            </View>

            {/* Middle Column: Title + Message Snippet */}
            <View style={styles.middleColumn}>
                <CustomText
                    variant="subtitle"
                    style={[
                        styles.headlineText,
                        isUnread ? styles.unreadHeadlineText : styles.readHeadlineText,
                    ]}
                    numberOfLines={1}
                >
                    {stripEmojis(item.title)}
                </CustomText>

                <CustomText
                    variant="body"
                    style={styles.messageSnippet}
                    numberOfLines={2}
                >
                    {item.message}
                </CustomText>
            </View>

            {/* Trailing Column: Time + (Unread Dot) + Chevron */}
            <View style={styles.trailingColumn}>
                <CustomText variant="caption" style={styles.relativeTimeText}>
                    {timeText}
                </CustomText>
                {isUnread && <View style={styles.unreadDot} />}
                <CustomIcon
                    library="Feather"
                    name="chevron-right"
                    size={16}
                    color={isUnread ? Colors.PRIMARY : Colors.GRAY_MEDIUM}
                />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 24,
        padding: 16,
        gap: 12,
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(2, 0.04, Colors.SHADOW, { radius: 6 }),
        ...Platform.select({
            web: {
                cursor: 'pointer' as const,
            },
        }),
    },
    unreadCard: {
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
    },
    readCard: {
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    pressedCard: {
        opacity: 0.85,
    },
    leftColumn: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    iconSquircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadIconSquircle: {
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        borderWidth: 1,
        borderColor: Colors.CHIP_PRIMARY_BORDER,
    },
    readIconSquircle: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    middleColumn: {
        flex: 1,
        gap: 2,
    },
    headlineText: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 0,
    },
    unreadHeadlineText: {
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    readHeadlineText: {
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    messageSnippet: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.TEXT_SECONDARY,
    },
    trailingColumn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 4,
        paddingTop: 2,
    },
    relativeTimeText: {
        fontSize: 11,
        color: Colors.TEXT_PLACEHOLDER,
        fontWeight: '500',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.PRIMARY,
    },
});

export default NotificationCard;
