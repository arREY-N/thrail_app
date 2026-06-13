import React, { useCallback, useMemo } from 'react';
import { Platform, 
    FlatList,
    ListRenderItemInfo,
    StyleSheet,
    TouchableOpacity,
    View,
 } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { formatDate } from '@/src/core/utility/date';

import { IGroup } from '@/src/core/models/Group/Group.types';
import { IUser } from '@/src/core/models/User/User.types';

/**
 * Extended IGroup to support legacy GroupName if it exists dynamically.
 */
export type GroupWithLegacyName = IGroup & { GroupName?: string };

/**
 * Props for the ListScreen component.
 */
export interface ListScreenProps {
    groups: GroupWithLegacyName[];
    currentUser: IUser | null;
    onEnterRoom: (id: string) => void;
    onBackPress: () => void;
}

/**
 * Formats the display name for a group based on its type and members.
 * 
 * @param group The group object containing trail, business, or member data
 * @param currentUser The current logged-in user
 * @returns A formatted string representing the group name
 */
export const formatGroupName = (group: GroupWithLegacyName, currentUser?: IUser | null): string => {
    if (group?.type === 'chat') {
        const participants = group.members || [];
        const otherUser = participants.find(p => p.id !== currentUser?.id) || participants[0];
        
        return otherUser ? `${otherUser.firstname} ${otherUser.lastname}` : 'Unknown User';
    }

    if (group?.trail?.name && group?.offer?.date) {
        try {
            const offerDate = group.offer.date as unknown as { toDate?: () => Date };
            const dateObj = typeof offerDate.toDate === 'function' 
                ? offerDate.toDate() 
                : new Date(group.offer.date as unknown as string | number);
            
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            return `${group.trail.name} • ${formattedDate}`;
        } catch (error) {
            console.warn("Date formatting error in formatGroupName:", error);
        }
    }

    if (group?.trail?.name && group?.business?.name) {
        return `${group.trail.name} • ${group.business.name}`;
    }
    return group?.GroupName || "Unnamed Group";
};

/**
 * Extracts initials from a given name string.
 * 
 * @param name The name to extract initials from
 * @returns The first two letters capitalized, or '?'
 */
const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
};

/**
 * Screen displaying a user's active group chats and conversations.
 */
const ListScreen: React.FC<ListScreenProps> = ({ groups, currentUser, onEnterRoom, onBackPress }) => {
    
    const sortedGroups = useMemo(() => {
        if (!groups) return [];
        return [...groups].sort((a, b) => {
            const timeA = a.lastMessage?.timesent ? new Date(a.lastMessage.timesent as unknown as string | number).getTime() : 0;
            const timeB = b.lastMessage?.timesent ? new Date(b.lastMessage.timesent as unknown as string | number).getTime() : 0;
            return timeB - timeA;
        });
    }, [groups]);

    const renderGroupCard = useCallback(({ item }: ListRenderItemInfo<GroupWithLegacyName>) => {
        const lastMsg = item.lastMessage;
        const timeString = lastMsg?.timesent ? formatDate(lastMsg.timesent as Parameters<typeof formatDate>[0]) : '';
        
        const isUnread = !!lastMsg && 
                         !!currentUser && 
                         lastMsg.senderId !== currentUser.id && 
                         !(lastMsg.readBy || []).some(u => u.id === currentUser.id);

        const isEmergency = item?.type === 'chat';
        const avatarBgColor = isEmergency ? Colors.AVATAR_BG_Red : Colors.AVATAR_BG_Green;
        
        let initials = '?';
        if (isEmergency) {
            const participants = item.members || [];
            const otherUser = participants.find(p => p.id !== currentUser?.id) || participants[0];
            initials = getInitials(otherUser ? `${otherUser.firstname} ${otherUser.lastname}` : 'EM');
        } else {
            initials = getInitials(item.trail?.name || item.GroupName);
        }

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => onEnterRoom(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarContainer, { backgroundColor: avatarBgColor }]}>
                    <CustomText variant="h3" style={styles.avatarText}>
                        {initials}
                    </CustomText>
                </View>
                
                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <CustomText numberOfLines={1} style={styles.groupName} variant="label">
                            {formatGroupName(item, currentUser)}
                        </CustomText>
                    </View>
                    
                    <View style={styles.messageRow}>
                        <CustomText 
                            variant="caption" 
                            style={[styles.lastMessage, isUnread && styles.unreadText]} 
                            numberOfLines={1}
                        >
                            {lastMsg?.content 
                                ? `${lastMsg.senderName}: ${lastMsg.content}` 
                                : "No messages yet."}
                        </CustomText>
                        
                        {timeString ? (
                            <CustomText 
                                variant="caption" 
                                style={[styles.timeText, isUnread && styles.unreadTimeText]}
                            >
                                {timeString}
                            </CustomText>
                        ) : null}
                    </View>
                </View>

                <View style={styles.rightActionContainer}>
                    {isUnread && <View style={styles.unreadDot} />}
                    <CustomIcon library="Feather" name="chevron-right" size={18} color={Colors.GRAY_MEDIUM} />
                </View>
            </TouchableOpacity>
        );
    }, [currentUser, onEnterRoom]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Your Groups"
                centerTitle={true}
                onBackPress={onBackPress}
            />
            <View style={styles.container}>
                <FlatList<GroupWithLegacyName>
                    data={sortedGroups}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGroupCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <CustomIcon library="Ionicons" name="chatbubbles-outline" size={48} color={Colors.GRAY_MEDIUM} />
                            <CustomText variant="body" style={styles.emptyText}>
                                You have no active group chats.
                            </CustomText>
                        </View>
                    }
                />
            </View>
        </ScreenWrapper>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 12,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        
        
        
        
        
        ...dropShadow,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: '700',
        marginBottom: 2,
        fontSize: 16,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    groupName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginRight: 8,
    },
    timeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    unreadText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    unreadTimeText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    rightActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.PRIMARY,
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    }
});

export default ListScreen;