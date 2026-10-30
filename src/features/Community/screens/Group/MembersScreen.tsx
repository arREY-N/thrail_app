/**
 * @file MembersScreen.tsx
 * @description Screen displaying group information, offer details (trail, itinerary,
 * reminders, things to bring, organizer), member & admin lists (deduplicated), and group metadata.
 */

import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import RoomHeader from './components/RoomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Offer } from '@/src/core/models/Offer/Offer';
import { IUser, IUserSummary } from '@/src/core/models/User/User';
import { GroupWithLegacyName } from '@/src/features/Community/screens/Group/ListScreen';
import { formatActivityTime, getInitials, safeParseDateString } from '@/src/utils/dateFormatter';

export interface MembersScreenProps {
    /** Group data containing members, admins, trail, business, etc. */
    group: GroupWithLegacyName;
    /** Associated offer details if available */
    offer?: Offer | null;
    /** Currently logged in user */
    currentUser?: IUser | null;
    /** Formatted title for the group */
    headerTitle?: string;
    /** Callback when header back button is tapped */
    onBackPress: () => void;
}

/**
 * Format a date timestamp into a human-readable format.
 */
const formatFriendlyDate = (dateValue: unknown): string => {
    if (!dateValue) return '';
    try {
        const d = safeParseDateString(dateValue as any);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        }
    } catch { }
    return '';
};

/**
 * Format group creation timestamp.
 */
const formatCreatedAt = (dateValue: unknown): string => {
    if (!dateValue) return 'Unknown';
    try {
        const d = safeParseDateString(dateValue as any);
        if (!isNaN(d.getTime())) {
            const dateStr = d.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} at ${timeStr}`;
        }
    } catch { }
    return String(dateValue);
};

export const MembersScreen: React.FC<MembersScreenProps> = ({
    group,
    offer,
    currentUser,
    headerTitle,
    onBackPress,
}) => {
    // ── Deduplicate Admins ──
    const admins = useMemo(() => {
        const seen = new Set<string>();
        return (group?.admins || []).filter(admin => {
            if (!admin?.id || seen.has(admin.id)) return false;
            seen.add(admin.id);
            return true;
        });
    }, [group?.admins]);

    // ── Deduplicate Regular Members (excluding admins so no duplicates appear) ──
    const members = useMemo(() => {
        const adminIds = new Set(admins.map(a => a.id));
        const seen = new Set<string>();
        return (group?.members || []).filter(member => {
            if (!member?.id || adminIds.has(member.id) || seen.has(member.id)) return false;
            seen.add(member.id);
            return true;
        });
    }, [group?.members, admins]);

    // ── Extract Offer Details ──
    const activeOffer = offer || (group?.offer as unknown as Offer);
    const trailName = activeOffer?.trail?.name || group?.trail?.name;
    const trailLocation = activeOffer?.trail?.location || group?.trail?.location;
    const organizerName = activeOffer?.business?.name || group?.business?.name;
    const schedule = activeOffer?.schedule || [];
    const reminders = activeOffer?.reminders || [];
    const thingsToBring = activeOffer?.thingsToBring || [];
    const hikeDate = activeOffer?.date || (group?.offer as any)?.date;
    const formattedHikeDate = formatFriendlyDate(hikeDate);

    // Offer section is visible if there are offer/hike details
    const hasOffer = Boolean(
        trailName ||
        organizerName ||
        schedule.length > 0 ||
        reminders.length > 0 ||
        thingsToBring.length > 0
    );

    // Group info details
    const createdDateText = formatCreatedAt(group?.createdAt);
    const totalMembersCount = admins.length + members.length;

    // Derive main title and subtitle for RoomHeader
    const { mainTitle, subtitle } = useMemo(() => {
        const parts = headerTitle ? headerTitle.split('•') : [];
        let finalSubtitle = parts[1]?.trim() || '';

        if (group?.type === 'chat' && currentUser?.emergencyContact?.userId) {
            const otherUser = group.members?.find(m => m.id !== currentUser.id);
            if (otherUser && otherUser.id === currentUser.emergencyContact.userId) {
                finalSubtitle = 'Emergency Contact';
            }
        }

        return {
            mainTitle: parts[0]?.trim() || group?.GroupName || 'Group Details',
            subtitle: finalSubtitle,
        };
    }, [headerTitle, group, currentUser]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <RoomHeader
                title={mainTitle}
                subtitle={subtitle}
                offerDate={activeOffer?.date || (group?.offer as any)?.endDate || (group?.offer as any)?.date}
                onBackPress={onBackPress}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* ──────────────────────────────────────────────────────────── */}
                {/* PART 1: OFFER (IF AVAILABLE)                                */}
                {/* ──────────────────────────────────────────────────────────── */}
                {hasOffer && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionIconBox}>
                                <CustomIcon library="Feather" name="compass" size={18} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Offer & Hike Details
                            </CustomText>
                            {formattedHikeDate ? (
                                <View style={styles.dateBadge}>
                                    <CustomIcon library="Feather" name="calendar" size={12} color={Colors.PRIMARY} />
                                    <CustomText variant="caption" style={styles.dateBadgeText}>
                                        {formattedHikeDate}
                                    </CustomText>
                                </View>
                            ) : null}
                        </View>

                        {/* 1. Trail Name */}
                        {trailName && (
                            <View style={styles.offerItem}>
                                <CustomText variant="caption" style={styles.fieldLabel}>
                                    Trail Name
                                </CustomText>
                                <View style={styles.trailRow}>
                                    <CustomIcon library="Feather" name="map-pin" size={16} color={Colors.PRIMARY} style={{ marginTop: 2 }} />
                                    <View style={{ flex: 1 }}>
                                        <CustomText variant="label" style={styles.trailTitle}>
                                            {trailName}
                                        </CustomText>
                                        {trailLocation ? (
                                            <CustomText variant="caption" style={styles.trailLocation}>
                                                {trailLocation}
                                            </CustomText>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* 2. Itinerary */}
                        <View style={styles.offerItem}>
                            <CustomText variant="caption" style={styles.fieldLabel}>
                                Itinerary
                            </CustomText>
                            {schedule && schedule.length > 0 ? (
                                <View style={styles.itineraryContainer}>
                                    {schedule.map((dayItem, dayIdx) => (
                                        <View key={dayIdx} style={styles.dayContainer}>
                                            <View style={styles.dayBadge}>
                                                <CustomText variant="caption" style={styles.dayBadgeText}>
                                                    Day {dayItem.day || dayIdx + 1}
                                                </CustomText>
                                            </View>
                                            <View style={styles.activitiesList}>
                                                {(dayItem.activities || []).map((activity, actIdx) => (
                                                    <View key={actIdx} style={styles.activityRow}>
                                                        <View style={styles.activityTimePill}>
                                                            <CustomText variant="caption" style={styles.activityTimeText}>
                                                                {formatActivityTime(activity.time)}
                                                            </CustomText>
                                                        </View>
                                                        <CustomText variant="body" style={styles.activityEventText}>
                                                            {activity.event}
                                                        </CustomText>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <CustomText variant="caption" style={styles.emptyNote}>
                                    No itinerary provided for this hike.
                                </CustomText>
                            )}
                        </View>

                        {/* 3. Important Reminders */}
                        <View style={styles.offerItem}>
                            <CustomText variant="caption" style={styles.fieldLabel}>
                                Important Reminders
                            </CustomText>
                            {reminders && reminders.length > 0 ? (
                                <View style={styles.remindersContainer}>
                                    {reminders.map((reminder, idx) => (
                                        <View key={idx} style={styles.reminderRow}>
                                            <CustomIcon
                                                library="Feather"
                                                name="alert-circle"
                                                size={15}
                                                color={Colors.WARNING || Colors.PRIMARY}
                                                style={{ marginTop: 2 }}
                                            />
                                            <CustomText variant="body" style={styles.reminderText}>
                                                {reminder}
                                            </CustomText>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <CustomText variant="caption" style={styles.emptyNote}>
                                    No specific reminders specified.
                                </CustomText>
                            )}
                        </View>

                        {/* 4. Things to Bring */}
                        <View style={styles.offerItem}>
                            <CustomText variant="caption" style={styles.fieldLabel}>
                                Things to Bring
                            </CustomText>
                            {thingsToBring && thingsToBring.length > 0 ? (
                                <View style={styles.thingsGrid}>
                                    {thingsToBring.map((item, idx) => (
                                        <View key={idx} style={styles.thingTag}>
                                            <CustomIcon library="Feather" name="check" size={13} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.thingText}>
                                                {item}
                                            </CustomText>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <CustomText variant="caption" style={styles.emptyNote}>
                                    Standard hiking gear recommended.
                                </CustomText>
                            )}
                        </View>

                        {/* 5. Organizer */}
                        <View style={[styles.offerItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <CustomText variant="caption" style={styles.fieldLabel}>
                                Organizer
                            </CustomText>
                            <View style={styles.organizerRow}>
                                <View style={styles.organizerIconBox}>
                                    <CustomIcon library="Feather" name="shield" size={18} color={Colors.PRIMARY} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <CustomText variant="label" style={styles.organizerName}>
                                        {organizerName || 'Thrail Verified Partner'}
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.organizerBadge}>
                                        Official Tour Operator
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* ──────────────────────────────────────────────────────────── */}
                {/* PART 2: MEMBER LIST                                          */}
                {/* ──────────────────────────────────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionIconBox}>
                            <CustomIcon library="Feather" name="users" size={18} color={Colors.PRIMARY} />
                        </View>
                        <CustomText variant="h3" style={styles.sectionTitle}>
                            Participants
                        </CustomText>
                        <View style={styles.countBadge}>
                            <CustomText variant="caption" style={styles.countBadgeText}>
                                {totalMembersCount} {totalMembersCount === 1 ? 'member' : 'members'}
                            </CustomText>
                        </View>
                    </View>

                    {/* 6. Admins List */}
                    <View style={styles.memberSubSection}>
                        <View style={styles.subSectionHeader}>
                            <CustomText variant="caption" style={styles.subSectionTitle}>
                                Admins ({admins.length})
                            </CustomText>
                        </View>

                        {admins.length > 0 ? (
                            admins.map(admin => renderUserRow(admin, true, currentUser?.id === admin.id))
                        ) : (
                            <CustomText variant="caption" style={styles.emptyNote}>
                                No administrators listed.
                            </CustomText>
                        )}
                    </View>

                    {/* 7. Members List (Deduplicated) */}
                    <View style={[styles.memberSubSection, { borderTopWidth: 1, borderTopColor: Colors.GRAY_ULTRALIGHT, paddingTop: 16 }]}>
                        <View style={styles.subSectionHeader}>
                            <CustomText variant="caption" style={styles.subSectionTitle}>
                                Members ({members.length})
                            </CustomText>
                        </View>

                        {members.length > 0 ? (
                            members.map(member => renderUserRow(member, false, currentUser?.id === member.id))
                        ) : (
                            <CustomText variant="caption" style={styles.emptyNote}>
                                No other members in this group.
                            </CustomText>
                        )}
                    </View>
                </View>

                {/* ──────────────────────────────────────────────────────────── */}
                {/* PART 3: GROUP INFO                                           */}
                {/* ──────────────────────────────────────────────────────────── */}
                <View style={styles.card}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionIconBox}>
                            <CustomIcon library="Feather" name="info" size={18} color={Colors.PRIMARY} />
                        </View>
                        <CustomText variant="h3" style={styles.sectionTitle}>
                            Group Info
                        </CustomText>
                    </View>

                    {/* Created At */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoRowLeft}>
                            <CustomIcon library="Feather" name="clock" size={16} color={Colors.TEXT_SECONDARY} />
                            <CustomText variant="body" style={styles.infoRowLabel}>
                                Created At
                            </CustomText>
                        </View>
                        <CustomText variant="label" style={styles.infoRowValue}>
                            {createdDateText}
                        </CustomText>
                    </View>

                    {/* Group Type */}
                    <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                        <View style={styles.infoRowLeft}>
                            <CustomIcon library="Feather" name="message-square" size={16} color={Colors.TEXT_SECONDARY} />
                            <CustomText variant="body" style={styles.infoRowLabel}>
                                Group Type
                            </CustomText>
                        </View>
                        <CustomText variant="label" style={styles.infoRowValue}>
                            {group.type === 'chat' ? 'Direct Conversation' : 'Hike Group Room'}
                        </CustomText>
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

/**
 * Render a single user row with avatar, name, handle, and role badge.
 */
const renderUserRow = (user: IUserSummary, isAdmin: boolean, isCurrentUser: boolean) => {
    const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || 'Hiker';
    const initials = getInitials(user.firstname, user.lastname) || getInitials(user.username);
    const avatarBg = isAdmin ? Colors.AVATAR_BG_Green : Colors.AVATAR_BG_Blue;

    return (
        <View key={user.id} style={styles.userRow}>
            {/* User Avatar */}
            <View style={[styles.userAvatar, { backgroundColor: avatarBg }]}>
                <CustomText variant="label" style={styles.avatarText}>
                    {initials}
                </CustomText>
            </View>

            {/* User Names */}
            <View style={styles.userInfo}>
                <View style={styles.userNameContainer}>
                    <CustomText variant="label" style={styles.userName} numberOfLines={1}>
                        {fullName}
                    </CustomText>
                    {isCurrentUser && (
                        <CustomText variant="caption" style={styles.youIndicator}>
                            (You)
                        </CustomText>
                    )}
                </View>
                {user.username ? (
                    <CustomText variant="caption" style={styles.userHandle} numberOfLines={1}>
                        @{user.username}
                    </CustomText>
                ) : null}
            </View>

            {/* Role Badge */}
            {isAdmin ? (
                <View style={styles.adminBadge}>
                    <CustomText variant="caption" style={styles.adminBadgeText}>
                        Admin
                    </CustomText>
                </View>
            ) : (
                <View style={styles.memberBadge}>
                    <CustomText variant="caption" style={styles.memberBadgeText}>
                        Hiker
                    </CustomText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
        gap: 16,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    dateBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    countBadge: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countBadgeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    offerItem: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        paddingBottom: 14,
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    trailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    trailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    trailLocation: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    itineraryContainer: {
        gap: 10,
        marginTop: 4,
    },
    dayContainer: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 10,
        gap: 8,
    },
    dayBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    dayBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.WHITE,
        textTransform: 'uppercase',
    },
    activitiesList: {
        gap: 6,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activityTimePill: {
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    activityTimeText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    activityEventText: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        flex: 1,
    },
    remindersContainer: {
        gap: 8,
        marginTop: 4,
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 10,
        borderRadius: 10,
    },
    reminderText: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        flex: 1,
        lineHeight: 18,
    },
    thingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    thingTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
    },
    thingText: {
        fontSize: 12,
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '600',
    },
    organizerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    organizerIconBox: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    organizerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    organizerBadge: {
        fontSize: 11,
        color: Colors.PRIMARY,
        fontWeight: '600',
        marginTop: 1,
    },
    memberSubSection: {
        marginBottom: 8,
    },
    subSectionHeader: {
        marginBottom: 10,
    },
    subSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    userInfo: {
        flex: 1,
    },
    userNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    youIndicator: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    userHandle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    adminBadge: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
        textTransform: 'uppercase',
    },
    memberBadge: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    memberBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
    },
    emptyNote: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoRowLabel: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    infoRowValue: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
});

export default MembersScreen;

