import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Bubble,
    Composer,
    Day,
    GiftedChat,
    InputToolbar,
    MessageText,
    Time
} from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

const CustomComposer = (props) => {
    const [isFocused, setIsFocused] = useState(false);
    const currentHeight = !props.text ? 44 : props.composerHeight;

    return (
        <Composer
            {...props}
            placeholderTextColor={Colors.TEXT_PLACEHOLDER}
            textInputProps={{
                ...props.textInputProps,
                onFocus: () => setIsFocused(true),
                onBlur: () => setIsFocused(false),
                style: [
                    styles.composerTextInput,
                    isFocused && styles.composerTextInputFocused,
                    Platform.OS === 'web' && { outlineStyle: 'none' },
                    { 
                        height: currentHeight,
                        textAlignVertical: 'top' 
                    }
                ]
            }}
        />
    );
};

const GroupRoomScreen = ({ 
    roomId,
    messages, 
    currentGroup,
    currentUser, 
    sendMessage,
    onViewableItemsChanged,
    headerTitle,
    onBackPress,
    onAttachPress,
    onLocationPress
}) => {
    const insets = useSafeAreaInsets();

    const chatBottomPadding = insets.bottom + 8;
    
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
            readBy: m.readBy || [] 
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

    const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
    onViewableItemsChangedRef.current = onViewableItemsChanged;

    const handleViewableItemsChanged = useRef((info) => {
        if (!onViewableItemsChangedRef.current) return;

        const mappedChanged = info.changed.map(token => {
            const originalMsg = messagesRef.current.find(m => m.id === token.item._id);
            return { ...token, item: originalMsg };
        }).filter(token => token.item !== undefined); 

        if (mappedChanged.length > 0) {
            onViewableItemsChangedRef.current({ viewableItems: [], changed: mappedChanged });
        }
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 100 }).current;
    const listViewProps = useMemo(() => ({
        showsVerticalScrollIndicator: false,
        onViewableItemsChanged: handleViewableItemsChanged,
        viewabilityConfig: viewabilityConfig
    }), [handleViewableItemsChanged, viewabilityConfig]);

    useEffect(() => {
        if (Platform.OS === 'web' && messages && currentUser && onViewableItemsChanged) {
            const unreadMessages = messages.filter(m => 
                m.senderId !== currentUser.id && 
                !(m.readBy || []).some(u => u.id === currentUser.id)
            );

            if (unreadMessages.length > 0) {
                const simulatedChanged = unreadMessages.map(msg => ({
                    isViewable: true,
                    item: msg,
                    key: msg.id,
                    index: 0
                }));
                
                onViewableItemsChanged({
                    viewableItems: simulatedChanged,
                    changed: simulatedChanged
                });
            }
        }
    }, [messages, currentUser, onViewableItemsChanged]);

    const renderBubble = (props) => {
        const isLeft = props.position === 'left';
        const isRight = props.position === 'right';
        const senderId = props.currentMessage.user._id;
        const senderName = props.currentMessage.user.name;
        
        const isSameAsPrevious = 
            props.previousMessage && 
            props.previousMessage.user && 
            props.previousMessage.user._id === senderId;

        const isLastInCluster = !props.nextMessage || !props.nextMessage.user || props.nextMessage.user._id !== senderId;
        const showNameHeader = isLeft && !isSameAsPrevious;
        const isAdmin = currentGroup?.admins?.some(admin => admin.id === senderId);

        const readByUsers = (props.currentMessage.readBy || []).filter(u => u.id !== currentUser?.id);
        const hasReadReceipts = isRight && isLastInCluster && readByUsers.length > 0;
        const readByNames = readByUsers.map(u => u.username || u.firstname).join(', ');

        return (
            <View style={styles.bubbleWrapper}>
                {showNameHeader && (
                    <View style={styles.nameHeaderContainer}>
                        <CustomText variant="caption" style={styles.senderNameText}>
                            {senderName}
                        </CustomText>
                        
                        {isAdmin ? (
                            <View style={styles.adminBadge}>
                                <CustomText variant="caption" style={styles.adminBadgeText}>Admin</CustomText>
                            </View>
                        ) : (
                            <View style={styles.hikerBadge}>
                                <CustomText variant="caption" style={styles.hikerBadgeText}>Hiker</CustomText>
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

                {hasReadReceipts && (
                    <View style={styles.readReceiptContainer}>
                        <CustomIcon library="Ionicons" name="checkmark-done" size={14} color={Colors.PRIMARY} />
                        <CustomText variant="caption" style={styles.readReceiptText}>
                            Seen by {readByNames}
                        </CustomText>
                    </View>
                )}
            </View>
        );
    };

    const renderMessageText = (props) => {
        const { currentMessage, position } = props;
        
        if (currentMessage.text && currentMessage.text.startsWith('[Attachment]:')) {
            const url = currentMessage.text.replace('[Attachment]:', '').trim();
            const isRight = position === 'right';
            
            return (
                <TouchableOpacity 
                    style={styles.attachmentContainer}
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            window.open(url, '_blank');
                        } else {
                            Linking.openURL(url);
                        }
                    }}
                    activeOpacity={0.8}
                >
                    <View style={[styles.attachmentIconBox, isRight ? styles.attachmentIconBoxRight : styles.attachmentIconBoxLeft]}>
                        <CustomIcon 
                            library="Feather" 
                            name="paperclip" 
                            size={20} 
                            color={isRight ? Colors.PRIMARY : Colors.WHITE} 
                        />
                    </View>
                    <View style={styles.attachmentTextGroup}>
                        <CustomText style={[styles.attachmentTitle, isRight ? styles.attachmentTitleRight : styles.attachmentTitleLeft]}>
                            File Attachment
                        </CustomText>
                        <CustomText style={[styles.attachmentSubtitle, isRight ? styles.attachmentSubtitleRight : styles.attachmentSubtitleLeft]} numberOfLines={1}>
                            Click to view document
                        </CustomText>
                    </View>
                </TouchableOpacity>
            );
        }

        return <MessageText {...props} />;
    };

    const renderDay = (props) => (
        <Day {...props} wrapperStyle={styles.dayWrapper} textStyle={styles.dayText} />
    );

    const renderTime = (props) => (
        <Time {...props} timeTextStyle={{ right: styles.timeTextRight, left: styles.timeTextLeft }} />
    );

    const renderInputToolbar = (props) => (
        <InputToolbar 
            {...props} 
            containerStyle={[styles.inputToolbar, { paddingBottom: chatBottomPadding }]} 
            primaryStyle={styles.inputToolbarPrimary} 
        />
    );

    const renderActions = () => (
        <View style={styles.actionButtonContainer}>
            <TouchableOpacity onPress={onAttachPress} style={styles.actionButton} activeOpacity={0.7}>
                <CustomIcon library="Feather" name="plus" size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
        </View>
    );

    const renderComposer = (props) => <CustomComposer {...props} />;

    const renderSend = (props) => {
        const hasText = props.text && props.text.trim().length > 0;
        return (
            <TouchableOpacity 
                style={styles.sendContainer}
                disabled={!hasText}
                onPress={() => {
                    if (hasText && props.onSend) props.onSend({ text: props.text.trim() }, true);
                }}
                activeOpacity={0.7}
            >
                <View style={[styles.sendButton, hasText ? styles.sendButtonActive : styles.sendButtonInactive]}>
                    <CustomIcon library="Ionicons" name="send" size={16} color={hasText ? Colors.WHITE : Colors.GRAY_MEDIUM} style={styles.sendIcon} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={headerTitle}
                centerTitle={true}
                onBackPress={onBackPress} 
                rightActions={
                    <TouchableOpacity
                        style={styles.headerActionIcon}
                        onPress={onLocationPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon
                            library="FontAwesome6"
                            name="map-location-dot"
                            size={24}
                            color={Colors.PRIMARY}
                        />
                    </TouchableOpacity>
                }
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
                    renderMessageText={renderMessageText} 
                    renderInputToolbar={renderInputToolbar}
                    renderActions={renderActions}
                    renderComposer={renderComposer}
                    renderSend={renderSend}
                    renderDay={renderDay}
                    renderTime={renderTime}
                    
                    renderAvatarOnTop={true}
                    renderUsernameOnMessage={false} 
                    showAvatarForEveryMessage={false}
                    
                    bottomOffset={chatBottomPadding} 
                    placeholder="Type a message..."
                    alwaysShowSend={true}
                    
                    listViewProps={listViewProps}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND 
    },

    headerActionIcon: {
        padding: 4,
    },
    
    bubbleWrapper: { 
        marginBottom: 4, 
        flexShrink: 1, 
        maxWidth: '100%' 
    },
    nameHeaderContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginLeft: 4, 
        marginBottom: 2, 
        gap: 6 
    },
    senderNameText: { 
        fontSize: 12, 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold' 
    },
    
    adminBadge: { 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: Colors.STATUS_APPROVED_BORDER 
    },
    adminBadgeText: { 
        fontSize: 9, 
        color: Colors.STATUS_APPROVED_TEXT, 
        fontWeight: 'bold', 
        textTransform: 'uppercase' 
    },
    
    hikerBadge: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    hikerBadgeText: { 
        fontSize: 9, 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold', 
        textTransform: 'uppercase' 
    },

    bubbleRight: { 
        backgroundColor: Colors.PRIMARY, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        borderBottomLeftRadius: 16, 
        borderBottomRightRadius: 4, 
        padding: 2, 
        flexShrink: 1 
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
        flexShrink: 1 
    },
    
    textRight: { 
        color: Colors.WHITE, 
        fontSize: 15, 
        lineHeight: 22 
    },
    textLeft: { 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 15, 
        lineHeight: 22 
    },
    
    attachmentContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 12, 
        gap: 12, 
        minWidth: 200, 
        maxWidth: 250 
    },
    attachmentIconBox: { 
        width: 40, 
        height: 40, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    attachmentIconBoxRight: { 
        backgroundColor: Colors.WHITE 
    },
    attachmentIconBoxLeft: { 
        backgroundColor: Colors.PRIMARY 
    },
    attachmentTextGroup: { 
        flexShrink: 1 
    },
    attachmentTitle: { 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    attachmentTitleRight: { 
        color: Colors.WHITE 
    },
    attachmentTitleLeft: { 
        color: Colors.TEXT_PRIMARY 
    },
    attachmentSubtitle: { 
        fontSize: 12, 
        marginTop: 2 
    },
    attachmentSubtitleRight: { 
        color: 'rgba(255,255,255,0.8)' 
    },
    attachmentSubtitleLeft: { 
        color: Colors.TEXT_SECONDARY 
    },

    timeContainerRight: { 
        justifyContent: 'flex-end' 
    },
    timeContainerLeft: { 
        justifyContent: 'flex-end' 
    },
    timeTextRight: { 
        color: 'rgba(255, 255, 255, 0.7)', 
        fontSize: 10 
    },
    timeTextLeft: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 10 
    },

    readReceiptContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        marginTop: 2, 
        marginRight: 4, 
        gap: 4 
    },
    readReceiptText: { 
        fontSize: 10, 
        color: Colors.TEXT_SECONDARY 
    },

    dayWrapper: { 
        backgroundColor: Colors.GRAY_MEDIUM, 
        paddingHorizontal: 16, 
        paddingVertical: 6, 
        borderRadius: 16, 
        marginTop: 16, 
        marginBottom: 8 
    },
    dayText: { 
        color: Colors.WHITE, 
        fontSize: 12, 
        fontWeight: 'bold' 
    },

    inputToolbar: { 
        backgroundColor: Colors.BACKGROUND, 
        borderTopWidth: 0, 
        paddingHorizontal: 12, 
        paddingVertical: 8,
    },
    inputToolbarPrimary: { 
        alignItems: 'flex-end' 
    },
    
    actionButtonContainer: { 
        height: 44, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 8 
    },
    actionButton: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },

    composerTextInput: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 15, 
        lineHeight: 20, 
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'web' ? 10 : 12, 
        paddingBottom: Platform.OS === 'web' ? 10 : 12, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        minHeight: 44, 
        maxHeight: 120, 
        marginTop: 0, 
        marginBottom: 0, 
        marginRight: 8 
    },
    composerTextInputFocused: { 
        borderColor: Colors.PRIMARY, 
        backgroundColor: Colors.WHITE 
    },

    sendContainer: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 4, 
        marginRight: 4 
    },
    sendButton: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 1 
    },
    sendButtonActive: { 
        backgroundColor: Colors.PRIMARY, 
        borderColor: Colors.PRIMARY 
    },
    sendButtonInactive: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderColor: Colors.GRAY_LIGHT 
    },
    sendIcon: { 
        marginLeft: 2 
    }
});

export default GroupRoomScreen;