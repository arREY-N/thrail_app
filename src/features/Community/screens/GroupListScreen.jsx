import React, { useCallback, useMemo } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const formatGroupName = (group) => {
    if (group?.trail?.name && group?.business?.name) {
        return `${group.trail.name} • ${group.business.name}`;
    }
    return group?.GroupName || "Unnamed Group";
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
};

const GroupListScreen = ({ groups, currentUser, onEnterRoom, onBackPress }) => {
    
    const sortedGroups = useMemo(() => {
        if (!groups) return [];
        return [...groups].sort((a, b) => {
            const timeA = a.lastMessage?.timesent ? new Date(a.lastMessage.timesent).getTime() : 0;
            const timeB = b.lastMessage?.timesent ? new Date(b.lastMessage.timesent).getTime() : 0;
            return timeB - timeA;
        });
    }, [groups]);

    const renderGroupCard = useCallback(({ item }) => {
        const lastMsg = item.lastMessage;
        const timeString = lastMsg?.timesent ? formatDate(lastMsg.timesent) : '';
        
        const isUnread = lastMsg && 
                         currentUser && 
                         lastMsg.senderId !== currentUser.id && 
                         !(lastMsg.readBy || []).some(u => u.id === currentUser.id);

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => onEnterRoom(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <CustomText variant="h3" style={styles.avatarText}>
                        {getInitials(item.trail?.name || item.GroupName)}
                    </CustomText>
                </View>
                
                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <CustomText variant="label" style={styles.groupName} numberOfLines={1}>
                            {formatGroupName(item)}
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
                <FlatList
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
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
        fontWeight: 'bold',
        marginBottom: 0,
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

export default GroupListScreen;