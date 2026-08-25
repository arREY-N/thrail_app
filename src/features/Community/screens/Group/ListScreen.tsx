/**
 * @file ListScreen.tsx
 * @description Screen displaying a list of active group chats and conversations.
 */

import { useCallback } from 'react';
import {
    FlatList,
    ListRenderItemInfo,
    Platform,
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
import { Layout } from '@/src/constants/layout';
import { getInitials, getShortTimeElapsed } from '@/src/utils/dateFormatter';

import { IGroup } from '@/src/core/models/Group/Group';
import { IUser } from '@/src/core/models/User/User';
import { useListScreen } from './hooks/useListScreen';

/**
 * Extended IGroup to support legacy GroupName if it exists dynamically.
 */
export type GroupWithLegacyName = IGroup & { GroupName?: string };

/**
 * Props for the ListScreen component.
 * 
 * @param groups - The list of active groups to display
 * @param currentUser - The currently logged-in user profile
 * @param onEnterRoom - Callback function when entering a group room
 * @param onBackPress - Callback function for going back to the previous screen
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
 * @param group - The group object containing trail, business, or member data
 * @param currentUser - The current logged-in user
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
 * Screen displaying a user's active group chats and conversations.
 */
const ListScreen = ({ 
    groups, 
    currentUser, 
    onEnterRoom, 
    onBackPress 
}: ListScreenProps) => {
    
    const { sortedGroups } = useListScreen({ groups });

    /**
     * Renders a single group chat card with avatar, name/date, and last message snippet.
     * 
     * @param item - The group item to render
     */
    const renderGroupCard = useCallback(({ item }: ListRenderItemInfo<GroupWithLegacyName>) => {
        const lastMsg = item.lastMessage;
        const timeReference = lastMsg?.timesent || item.createdAt;
        const timeString = timeReference ? getShortTimeElapsed(timeReference as string | number | Date) : '';
        
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

        const fullGroupName = formatGroupName(item, currentUser);
        const lastIndex = fullGroupName.lastIndexOf(' • ');
        let mainName = fullGroupName;
        let dateSub = '';
        if (lastIndex !== -1) {
            mainName = fullGroupName.substring(0, lastIndex);
            dateSub = fullGroupName.substring(lastIndex); // includes " • "
        }

        const messagePrefix = lastMsg?.content ? `${lastMsg.senderName}: ${lastMsg.content}` : "No messages yet.";

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
                        <CustomText numberOfLines={1} style={[styles.groupName, { flexShrink: 1 }]} variant="label">
                            {mainName}
                        </CustomText>
                        {dateSub ? (
                            <CustomText numberOfLines={1} style={[styles.groupName, { flexShrink: 0 }]} variant="label">
                                {dateSub}
                            </CustomText>
                        ) : null}
                    </View>
                    
                    <View style={styles.messageRow}>
                        <CustomText 
                            variant="caption" 
                            style={[styles.lastMessage, isUnread && { fontWeight: 'bold', color: Colors.TEXT_PRIMARY }]} 
                            numberOfLines={1}
                        >
                            {messagePrefix}
                        </CustomText>
                        {timeString ? (
                            <CustomText 
                                variant="caption" 
                                style={[styles.timeText, isUnread && { fontWeight: 'bold', color: Colors.TEXT_PRIMARY }, { flexShrink: 0 }]} 
                                numberOfLines={1}
                            >
                                {timeString}
                            </CustomText>
                        ) : null}
                    </View>
                </View>

                <View style={styles.rightActionContainer}>
                    {isUnread && <View style={styles.unreadDot} />}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        padding: 12,
        marginBottom: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(3),
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
        marginRight: 12,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
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
        justifyContent: 'flex-start',
    },
    lastMessage: {
        flexShrink: 1,
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