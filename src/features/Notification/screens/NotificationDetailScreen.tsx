/**
 * @file NotificationDetailScreen.tsx
 * @description Dedicated notification detail screen featuring a tight header hero,
 * full message body typography, a clean single-surface metadata container with key-value pairs,
 * domain-specific contextual action CTAs, and responsive Web centering.
 */

import { Href, useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Notification } from '@/src/core/models/Notification/Notification';
import { useTrailStore } from '@/src/core/models/Trail/Trail';
import { getWeatherIcon } from '@/src/core/utility/weatherHelpers';
import { stripEmojis } from '@/src/features/Notification/components/NotificationCard';
import { IconLibrary } from '@/src/types/ui.types';
import {
    formatDateToStandard,
    formatTime,
    getShortTimeElapsed,
    safeParseDateString,
} from '@/src/utils/dateFormatter';

/**
 * Props for NotificationDetailScreen component.
 * @param notification - Notification entity to view, or null if not found
 * @param onBackPress - Callback fired when back button is pressed
 */
export interface NotificationDetailScreenProps {
    notification: Notification | null;
    onBackPress: () => void;
}

interface ResolvedDetailIcon {
    name: string;
    lib: IconLibrary;
}

interface MetadataRowItem {
    id: string;
    label: string;
    value: string;
    badge?: {
        text: string;
        variant: 'safe' | 'caution' | 'danger' | 'info';
    };
}

interface ContextualAction {
    label: string;
    icon: string;
    lib: IconLibrary;
    onPress: () => void;
}

/**
 * Resolves the icon for the detail screen hero.
 * @param item - Canonical Notification entity
 * @returns {ResolvedDetailIcon} Resolved icon and icon library
 */
const resolveDetailIcon = (item: Notification): ResolvedDetailIcon => {
    const type = item.metadata?.type as string | undefined;
    const severity = typeof item.metadata?.severity === 'string' ? item.metadata.severity.toUpperCase() : undefined;
    const weatherCode = typeof item.metadata?.weatherCode === 'number' ? item.metadata.weatherCode : undefined;
    const t = (item.title || '').toLowerCase();

    // 1. Weather Alerts
    if (type === 'weather_alert' || t.includes('weather') || t.includes('forecast') || t.includes('rain') || t.includes('storm')) {
        if (weatherCode !== undefined) {
            return {
                name: getWeatherIcon(weatherCode),
                lib: 'MaterialCommunityIcons',
            };
        }
        if (severity === 'DANGER' || t.includes('warning') || t.includes('danger') || t.includes('severe')) {
            return {
                name: 'weather-lightning',
                lib: 'MaterialCommunityIcons',
            };
        }
        if (severity === 'SAFE' || t.includes('clear') || t.includes('optimal')) {
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
    if (type === 'booking_reminder' || type === 'booking_status' || t.includes('booking') || t.includes('reservation') || t.includes('hike')) {
        return {
            name: 'calendar-check',
            lib: 'MaterialCommunityIcons',
        };
    }

    // 3. Payment
    if (type === 'payment' || t.includes('payment') || t.includes('paid') || t.includes('refund')) {
        return {
            name: 'credit-card',
            lib: 'Feather',
        };
    }

    // 4. Review
    if (type === 'review' || t.includes('review') || t.includes('rating')) {
        return {
            name: 'star',
            lib: 'Feather',
        };
    }

    // 5. Community & Groups
    if (type === 'community' || t.includes('group') || t.includes('community')) {
        return {
            name: 'account-group',
            lib: 'MaterialCommunityIcons',
        };
    }

    return {
        name: 'bell',
        lib: 'Feather',
    };
};

/**
 * Detailed notification view displaying full message body, a clean metadata table,
 * and direct routing CTAs to relevant features.
 */
export const NotificationDetailScreen = ({
    notification,
    onBackPress,
}: NotificationDetailScreenProps): React.JSX.Element => {
    const router = useRouter();
    const isWeb = Platform.OS === 'web';

    if (!notification) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title="Notification"
                    centerTitle={true}
                    onBackPress={onBackPress}
                    showDefaultIcons={isWeb}
                />
                <View style={styles.constrainer}>
                    <View style={styles.notFoundContainer}>
                        <CustomIcon
                            library="Feather"
                            name="bell-off"
                            size={56}
                            color={Colors.GRAY_MEDIUM}
                        />
                        <CustomText variant="subtitle" style={styles.notFoundTitle}>
                            Notification Not Found
                        </CustomText>
                        <CustomText variant="body" style={styles.notFoundSubtitle}>
                            This notification may have expired or been removed.
                        </CustomText>
                        <CustomButton
                            title="Back to Notifications"
                            variant="primary"
                            onPress={onBackPress}
                            style={styles.backButton}
                        />
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    const iconData = resolveDetailIcon(notification);
    const parsedDate = notification.createdAt instanceof Date
        ? notification.createdAt
        : safeParseDateString(notification.createdAt);
    const formattedDate = formatDateToStandard(parsedDate);
    const formattedTime = formatTime(parsedDate);
    const relativeTime = getShortTimeElapsed(parsedDate);

    // Extract metadata
    const metadata = notification.metadata ?? {};
    const notifType = (metadata.type as string | undefined) || 'general';

    // Build clean metadata list
    const metadataRows: MetadataRowItem[] = [];
    let contextualAction: ContextualAction | null = null;

    if (notifType === 'weather_alert') {
        const trailName = typeof metadata.trailName === 'string' ? metadata.trailName : 'Scheduled Mountain';
        const trailId = typeof metadata.trailId === 'string' ? metadata.trailId : undefined;
        const severity = typeof metadata.severity === 'string' ? metadata.severity.toUpperCase() : 'SAFE';
        const precip = typeof metadata.precipitationProbability === 'number' ? metadata.precipitationProbability : undefined;
        const temp = typeof metadata.temperature === 'number' ? metadata.temperature : undefined;
        const wind = typeof metadata.windSpeed === 'number' ? metadata.windSpeed : undefined;

        metadataRows.push({
            id: 'trail',
            label: 'Trail Location',
            value: trailName,
        });

        metadataRows.push({
            id: 'hazard',
            label: 'Hazard Severity',
            value: severity === 'DANGER' ? 'Severe Hazard (T-24 Alert)' : severity === 'CAUTION' ? 'Caution Active' : 'Optimal Path',
            badge: {
                text: severity === 'DANGER' ? 'DANGER' : severity === 'CAUTION' ? 'CAUTION' : 'SAFE',
                variant: severity === 'DANGER' ? 'danger' : severity === 'CAUTION' ? 'caution' : 'safe',
            },
        });

        if (precip !== undefined) {
            metadataRows.push({
                id: 'precip',
                label: 'Precipitation',
                value: `${precip}% Rain Chance`,
            });
        }

        if (temp !== undefined || wind !== undefined) {
            const atmosphericInfo = [
                temp !== undefined ? `${temp}°C` : null,
                wind !== undefined ? `Winds up to ${wind} km/h` : null,
            ].filter(Boolean).join(' • ');

            metadataRows.push({
                id: 'atmosphere',
                label: 'Temperature & Wind',
                value: atmosphericInfo || 'Normal atmospheric conditions',
            });
        }

        contextualAction = {
            label: 'View Mountain Weather Guide',
            icon: 'cloud-rain',
            lib: 'Feather',
            onPress: () => {
                let targetTrailId = trailId;
                if (!targetTrailId && trailName) {
                    const trails = useTrailStore.getState().data;
                    const nameLower = trailName.toLowerCase();
                    const matched = trails.find((t) => {
                        const tName = t.general?.name?.toLowerCase() || '';
                        const rawMountain: unknown = t.general?.mountain;
                        const tMountain = Array.isArray(rawMountain)
                            ? rawMountain.map((m) => String(m).toLowerCase()).join(' ')
                            : typeof rawMountain === 'string'
                                ? rawMountain.toLowerCase()
                                : '';
                        return tName.includes(nameLower) || nameLower.includes(tName) || tMountain.includes(nameLower);
                    });
                    if (matched?.id) {
                        targetTrailId = matched.id;
                    }
                }

                if (targetTrailId) {
                    router.push(`/(app)/(main)/trail/view?trailId=${encodeURIComponent(targetTrailId)}&tab=Weather` as Href);
                } else {
                    router.push('/(app)/(main)/home/weather' as Href);
                }
            },
        };
    } else if (notifType === 'booking_reminder' || notifType === 'booking_status') {
        const trailName = typeof metadata.trailName === 'string' ? metadata.trailName : 'Upcoming Hike';
        const bookingId = typeof metadata.bookingId === 'string' ? metadata.bookingId : 'RESERVATION';
        const dateStr = (typeof metadata.reminderDate === 'string' ? metadata.reminderDate : typeof metadata.dateStr === 'string' ? metadata.dateStr : undefined) || 'Confirmed Date';
        const status = typeof metadata.status === 'string' ? metadata.status.toLowerCase() : 'active';

        metadataRows.push({
            id: 'destination',
            label: 'Destination',
            value: trailName,
        });

        metadataRows.push({
            id: 'schedule',
            label: 'Scheduled Date',
            value: dateStr,
        });

        metadataRows.push({
            id: 'bookingCode',
            label: 'Booking Code',
            value: `#${bookingId}`,
        });

        metadataRows.push({
            id: 'status',
            label: 'Reservation Status',
            value: status.toUpperCase(),
            badge: {
                text: status === 'paid' ? 'Confirmed' : status === 'for-payment' ? 'Action Required' : status === 'cancelled' ? 'Cancelled' : 'Approaching',
                variant: status === 'paid' ? 'safe' : status === 'for-payment' ? 'caution' : status === 'cancelled' ? 'danger' : 'info',
            },
        });

        contextualAction = {
            label: 'View Booking Details',
            icon: 'calendar',
            lib: 'Feather',
            onPress: () => {
                router.push(`/(app)/(main)/book/list?bookingId=${encodeURIComponent(bookingId)}&view=overview` as Href);
            },
        };
    } else if (notifType === 'payment') {
        const amount = typeof metadata.amount === 'number' ? metadata.amount : undefined;
        const method = typeof metadata.method === 'string' ? metadata.method.toUpperCase() : 'GCASH';
        const refCode = typeof metadata.referenceCode === 'string' ? metadata.referenceCode : 'PAY-REF';
        const bookingId = typeof metadata.bookingId === 'string' ? metadata.bookingId : undefined;
        const status = typeof metadata.status === 'string' ? metadata.status.toLowerCase() : 'captured';

        metadataRows.push({
            id: 'amount',
            label: 'Settlement Amount',
            value: amount !== undefined ? `₱${amount.toLocaleString()}` : '₱0.00',
        });

        metadataRows.push({
            id: 'channel',
            label: 'Payment Method',
            value: method,
        });

        metadataRows.push({
            id: 'reference',
            label: 'Reference Code',
            value: refCode,
        });

        metadataRows.push({
            id: 'state',
            label: 'Payment State',
            value: status.toUpperCase(),
            badge: {
                text: status === 'captured' ? 'Captured' : status === 'downpayment' ? 'Deposit Paid' : status === 'refunded' ? 'Refunded' : 'Processed',
                variant: status === 'captured' ? 'safe' : status === 'downpayment' ? 'info' : status === 'refunded' ? 'caution' : 'info',
            },
        });

        contextualAction = {
            label: 'View Payment Receipt',
            icon: 'file-text',
            lib: 'Feather',
            onPress: () => {
                router.push(`/(app)/(main)/book/list?bookingId=${encodeURIComponent(bookingId || '')}&view=receipt` as Href);
            },
        };
    } else if (notifType === 'community' || notifType === 'review') {
        const sender = typeof metadata.senderName === 'string' ? metadata.senderName : 'Hike Coordinator';
        const trail = typeof metadata.trailName === 'string' ? metadata.trailName : 'Scheduled Mountain';
        const rating = typeof metadata.rating === 'number' ? metadata.rating : undefined;
        const groupId = typeof metadata.groupId === 'string' ? metadata.groupId : undefined;

        metadataRows.push({
            id: 'sender',
            label: 'Sender / Coordinator',
            value: sender,
        });

        metadataRows.push({
            id: 'trail',
            label: 'Trail Corridor',
            value: trail,
        });

        if (rating !== undefined) {
            metadataRows.push({
                id: 'rating',
                label: 'User Rating',
                value: `${rating} / 5 Stars`,
            });
        }

        contextualAction = {
            label: 'Open Group Chat',
            icon: 'message-circle',
            lib: 'Feather',
            onPress: () => {
                if (groupId) {
                    router.push(`/(app)/(main)/group/room?groupId=${encodeURIComponent(groupId)}` as Href);
                } else {
                    router.push('/(app)/(main)/group/list' as Href);
                }
            },
        };
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Notification"
                centerTitle={true}
                onBackPress={onBackPress}
                showDefaultIcons={isWeb}
            />

            <View style={styles.constrainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.detailCard}>
                        {/* Header Hero Section: Icon + Title + Timestamp Lockup */}
                        <View style={styles.heroRow}>
                            <View style={styles.iconSquircle}>
                                <CustomIcon
                                    library={iconData.lib}
                                    name={iconData.name}
                                    size={22}
                                    color={Colors.PRIMARY}
                                />
                            </View>

                            <View style={styles.heroTextCol}>
                                <CustomText variant="h2" style={styles.titleText}>
                                    {stripEmojis(notification.title)}
                                </CustomText>

                                <View style={styles.timestampRow}>
                                    <CustomIcon
                                        library="Feather"
                                        name="clock"
                                        size={14}
                                        color={Colors.TEXT_PLACEHOLDER}
                                    />
                                    <CustomText variant="caption" style={styles.timestampText}>
                                        {formattedDate} • {formattedTime} ({relativeTime} ago)
                                    </CustomText>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Full Message Body */}
                        <CustomText variant="body" style={styles.messageText}>
                            {notification.message}
                        </CustomText>

                        {/* Metadata Container (Clean Key-Value Rows) */}
                        {metadataRows.length > 0 && (
                            <View style={styles.metadataSection}>
                                <CustomText variant="caption" style={styles.metadataSectionHeading}>
                                    ADVISORY & RESERVATION DETAILS
                                </CustomText>

                                <View style={styles.metadataCard}>
                                    {metadataRows.map((row, index) => (
                                        <View
                                            key={row.id}
                                            style={[
                                                styles.metadataRow,
                                                index > 0 && styles.metadataRowBorder,
                                            ]}
                                        >
                                            <CustomText variant="caption" style={styles.metadataLabel}>
                                                {row.label}
                                            </CustomText>

                                            <View style={styles.metadataValueContainer}>
                                                <CustomText
                                                    variant="caption"
                                                    style={styles.metadataValue}
                                                    numberOfLines={2}
                                                >
                                                    {row.value}
                                                </CustomText>
                                                {row.badge && (
                                                    <View
                                                        style={[
                                                            styles.badge,
                                                            row.badge.variant === 'danger' && styles.badgeDanger,
                                                            row.badge.variant === 'caution' && styles.badgeCaution,
                                                            row.badge.variant === 'safe' && styles.badgeSafe,
                                                            row.badge.variant === 'info' && styles.badgeInfo,
                                                        ]}
                                                    >
                                                        <CustomText
                                                            variant="caption"
                                                            style={[
                                                                styles.badgeText,
                                                                row.badge.variant === 'danger' && styles.badgeTextDanger,
                                                                row.badge.variant === 'caution' && styles.badgeTextCaution,
                                                                row.badge.variant === 'safe' && styles.badgeTextSafe,
                                                                row.badge.variant === 'info' && styles.badgeTextInfo,
                                                            ]}
                                                        >
                                                            {row.badge.text}
                                                        </CustomText>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Contextual Action CTA (Domain Specific) */}
                        {contextualAction && (
                            <CustomButton
                                title={contextualAction.label}
                                variant="primary"
                                icon={contextualAction.icon}
                                iconLibrary={contextualAction.lib}
                                iconSize={18}
                                iconColor={Colors.WHITE}
                                onPress={contextualAction.onPress}
                                style={styles.primaryActionButton}
                            />
                        )}

                        {/* Desktop Web in-flow return navigation */}
                        {isWeb && (
                            <CustomButton
                                title="Back to Notifications"
                                variant="outline"
                                onPress={onBackPress}
                                style={styles.backButtonWeb}
                            />
                        )}
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        flex: 1,
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    detailCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2, 0.04, Colors.SHADOW, { radius: 8 }),
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconSquircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        borderWidth: 1,
        borderColor: Colors.CHIP_PRIMARY_BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTextCol: {
        flex: 1,
        gap: 2,
    },
    titleText: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    timestampRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timestampText: {
        fontSize: 13,
        color: Colors.TEXT_PLACEHOLDER,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 18,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 24,
        color: Colors.TEXT_PRIMARY,
    },
    metadataSection: {
        marginTop: 22,
        gap: 8,
    },
    metadataSectionHeading: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.6,
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
    },
    metadataCard: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        gap: 8,
    },
    metadataRowBorder: {
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
    },
    metadataLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        maxWidth: '42%',
        flexShrink: 0,
    },
    metadataValueContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 6,
    },
    metadataValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'right',
        flexShrink: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeSafe: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    badgeCaution: {
        backgroundColor: Colors.STATUS_WARNING_BG,
    },
    badgeDanger: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    badgeInfo: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    badgeTextSafe: {
        color: Colors.STATUS_APPROVED_TEXT,
    },
    badgeTextCaution: {
        color: Colors.STATUS_WARNING_TEXT,
    },
    badgeTextDanger: {
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    badgeTextInfo: {
        color: Colors.TEXT_SECONDARY,
    },
    primaryActionButton: {
        marginTop: 22,
    },
    backButtonWeb: {
        marginTop: 12,
    },
    notFoundContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 80,
        gap: 12,
    },
    notFoundTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginTop: 8,
    },
    notFoundSubtitle: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        marginTop: 16,
        minWidth: 200,
    },
});

export default NotificationDetailScreen;
