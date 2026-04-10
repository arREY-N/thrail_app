import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
    Bubble,
    Composer,
    Day,
    GiftedChat,
    InputToolbar,
    Send,
    Time
} from 'react-native-gifted-chat';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

const GroupRoomScreen = ({ 
    roomId,
    messages, 
    currentGroup,
    currentUser, 
    sendMessage,
    onViewableItemsChanged,
    headerTitle,
    onBackPress
}) => {
    
    const giftedChatMessages = useMemo(() => {
        if (!messages) return [];
        return messages.map(m => ({
            _id: m.id,
            text: m.content,
            createdAt: m.timesent,
            user: {
                _id: m.senderId,
                name: m.senderName,
            },
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [messages]);

    const onSend = useCallback((newMessages = []) => {
        if (newMessages.length > 0) {
            sendMessage(newMessages[0].text);
        }
    }, [sendMessage]);

    const messagesRef = useRef(messages);
    
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100 
    }).current;

    const handleViewableItemsChanged = useCallback((info) => {
        if (!onViewableItemsChanged) return;

        const mappedChanged = info.changed.map(token => {
            const originalMsg = messagesRef.current.find(m => m.id === token.item._id);
            return { ...token, item: originalMsg };
        }).filter(token => token.item);

        if (mappedChanged.length > 0) {
            onViewableItemsChanged({ viewableItems: [], changed: mappedChanged });
        }
    }, [onViewableItemsChanged]);

    const renderBubble = (props) => {
        const isLeft = props.position === 'left';
        const senderId = props.currentMessage.user._id;
        const senderName = props.currentMessage.user.name;
        
        const isSameAsPrevious = 
            props.previousMessage && 
            props.previousMessage.user && 
            props.previousMessage.user._id === senderId;

        const showNameHeader = isLeft && !isSameAsPrevious;
        const isAdmin = currentGroup?.admins?.some(admin => admin.id === senderId);

        return (
            <View style={styles.bubbleWrapper}>
                {showNameHeader && (
                    <View style={styles.nameHeaderContainer}>
                        <CustomText variant="caption" style={styles.senderNameText}>
                            {senderName}
                        </CustomText>
                        {isAdmin && (
                            <View style={styles.adminBadge}>
                                <CustomText variant="caption" style={styles.adminBadgeText}>
                                    Admin
                                </CustomText>
                            </View>
                        )}
                    </View>
                )}
                
                <Bubble
                    {...props}
                    wrapperStyle={{
                        right: styles.bubbleRight,
                        left: styles.bubbleLeft,
                    }}
                    textStyle={{
                        right: styles.textRight,
                        left: styles.textLeft,
                    }}
                    bottomContainerStyle={{
                        right: styles.timeContainerRight,
                        left: styles.timeContainerLeft,
                    }}
                />
            </View>
        );
    };

    const renderDay = (props) => {
        return (
            <Day
                {...props}
                wrapperStyle={styles.dayWrapper}
                textStyle={styles.dayText}
            />
        );
    };

    const renderTime = (props) => {
        return (
            <Time
                {...props}
                timeTextStyle={{
                    right: styles.timeTextRight,
                    left: styles.timeTextLeft,
                }}
            />
        );
    };

    const renderInputToolbar = (props) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={styles.inputToolbar}
                primaryStyle={styles.inputToolbarPrimary}
            />
        );
    };

    const renderComposer = (props) => {
        return (
            <Composer
                {...props}
                textInputStyle={styles.composerTextInput}
                placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                textInputProps={{
                    ...props.textInputProps,
                    style: [
                        styles.composerTextInput, 
                        Platform.OS === 'web' && { outlineStyle: 'none' }
                    ]
                }}
            />
        );
    };

    const renderSend = (props) => {
        return (
            <Send {...props} containerStyle={styles.sendContainer}>
                <View style={styles.sendButton}>
                    <CustomIcon 
                        library="Ionicons" 
                        name="send" 
                        size={16} 
                        color={Colors.WHITE} 
                        style={styles.sendIcon} 
                    />
                </View>
            </Send>
        );
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={headerTitle}
                onBackPress={onBackPress}
            />
            <View style={styles.container}>
                <GiftedChat
                    messages={giftedChatMessages}
                    onSend={messages => onSend(messages)}
                    user={{
                        _id: currentUser?.id || '',
                        name: currentUser?.username || 'User',
                    }}
                    renderBubble={renderBubble}
                    renderInputToolbar={renderInputToolbar}
                    renderComposer={renderComposer}
                    renderSend={renderSend}
                    renderDay={renderDay}
                    renderTime={renderTime}
                    
                    renderAvatarOnTop={true}
                    renderUsernameOnMessage={false} 
                    showAvatarForEveryMessage={false}
                    
                    bottomOffset={0} 
                    placeholder="Type a message..."
                    alwaysShowSend
                    
                    listViewProps={{
                        showsVerticalScrollIndicator: false,
                        onViewableItemsChanged: handleViewableItemsChanged,
                        viewabilityConfig: viewabilityConfig
                    }}
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
    
    bubbleWrapper: {
        marginBottom: 4,
    },
    nameHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        marginBottom: 2,
        gap: 6,
    },
    senderNameText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    adminBadge: {
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    adminBadgeText: {
        fontSize: 9,
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    bubbleRight: {
        backgroundColor: Colors.PRIMARY,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4, 
        padding: 2,
    },
    bubbleLeft: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 4, 
        borderBottomRightRadius: 16,
        padding: 2,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    textRight: {
        color: Colors.WHITE,
        fontSize: 15,
        lineHeight: 22,
    },
    textLeft: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        lineHeight: 22,
    },
    
    timeContainerRight: { justifyContent: 'flex-end' },
    timeContainerLeft: { justifyContent: 'flex-end' },
    timeTextRight: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10 },
    timeTextLeft: { color: Colors.TEXT_SECONDARY, fontSize: 10 },

    dayWrapper: {
        backgroundColor: Colors.GRAY_MEDIUM,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    dayText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },

    inputToolbar: {
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        paddingTop: 6,
        paddingBottom: 6,
    },
    inputToolbarPrimary: {
        alignItems: 'center',
    },
    
    composerTextInput: {
        backgroundColor: Colors.WHITE,
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        lineHeight: 20,
        paddingHorizontal: 12,
        paddingTop: Platform.OS === 'web' ? 10 : 8,
        minHeight: 40,
        marginTop: 0,
        marginBottom: 0,
    },

    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginLeft: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        marginLeft: 2, 
        marginTop: 2,
    }
});

export default GroupRoomScreen;