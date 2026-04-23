import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
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
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

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

const BUBBLE_H_PAD = 11;
const BUBBLE_V_PAD = 7;

const isImageUrl = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) != null || url.includes('alt=media');
};

const RoomScreen = ({ 
    roomId,
    messages, 
    currentGroup,
    currentUser, 
    sendMessage,
    onViewableItemsChanged,
    headerTitle,
    onBackPress,
    onAttachPress,
    onLocationPress,
    isUploading
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, width: screenWidth } = useBreakpoints();
    const [previewImage, setPreviewImage] = useState(null);

    const MAX_WEB_WIDTH = 800;
    const currentContainerWidth = isDesktop ? Math.min(screenWidth, MAX_WEB_WIDTH) : screenWidth;

    const maxBubbleWidth = currentContainerWidth * 0.72;

    const giftedChatMessages = useMemo(() => {
        if (!messages) return [];
        return messages.map(m => {
            let text = m.content;
            let image = undefined;
            let isDocument = false;
            let fileUrl = undefined;
            
            let isEmergency = text && text.includes('Send help!');

            if (text && text.startsWith('[Attachment]:')) {
                const url = text.replace('[Attachment]:', '').trim();
                if (isImageUrl(url)) {
                    image = url;
                    text = '';
                } else {
                    isDocument = true;
                    fileUrl = url;
                    text = '';
                }
            }

            else if (isImageUrl(text)) {
                image = text.trim();
                text = '';
            }

            return {
                _id: m.id,
                text: text,
                createdAt: m.timesent,
                user: {
                    _id: m.senderId,
                    name: m.senderName,
                },
                readBy: m.readBy || [],
                image: image,
                isDocument: isDocument,
                fileUrl: fileUrl,
                isEmergency: isEmergency 
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

    const viewabilityConfig = useRef({ 
        itemVisiblePercentThreshold: 10, 
        minimumViewTime: 10 
    }).current;
    
    const listViewProps = useMemo(() => ({
        showsVerticalScrollIndicator: false,
        onViewableItemsChanged: handleViewableItemsChanged,
        viewabilityConfig: viewabilityConfig
    }), [handleViewableItemsChanged, viewabilityConfig]);

    useEffect(() => {
        if (messages && currentUser && onViewableItemsChanged) {
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

        const rightBubbleStyle = props.currentMessage.isEmergency 
            ? [styles.bubbleRight, styles.emergencyBubble, { maxWidth: maxBubbleWidth }] 
            : [styles.bubbleRight, { maxWidth: maxBubbleWidth }];
            
        const leftBubbleStyle = props.currentMessage.isEmergency 
            ? [styles.bubbleLeft, styles.emergencyBubble, { maxWidth: maxBubbleWidth }] 
            : [styles.bubbleLeft, { maxWidth: maxBubbleWidth }];

        return (
            <View style={[styles.bubbleWrapper, isRight ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
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
                        right: rightBubbleStyle,
                        left: leftBubbleStyle,
                    }}
                    textStyle={{
                        right: props.currentMessage.isEmergency ? styles.emergencyText : styles.textRight,
                        left: props.currentMessage.isEmergency ? styles.emergencyText : styles.textLeft,
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
        const isEmergency = props.currentMessage.isEmergency;
        return (
            <MessageText
                {...props}
                containerStyle={{
                    left: styles.messageTextContainer,
                    right: styles.messageTextContainer,
                }}
                textStyle={{
                    right: isEmergency ? styles.emergencyText : styles.textRight,
                    left: isEmergency ? styles.emergencyText : styles.textLeft,
                }}
                customTextStyle={styles.messageTextCustom}
                linkStyle={{
                    right: isEmergency
                        ? { color: '#B71C1C', textDecorationLine: 'underline' }
                        : { color: 'rgba(255,255,255,0.9)', textDecorationLine: 'underline' },
                    left: isEmergency
                        ? { color: '#B71C1C', textDecorationLine: 'underline' }
                        : { color: Colors.PRIMARY, textDecorationLine: 'underline' },
                }}
            />
        );
    };

    const renderMessageImage = (props) => {
        const absoluteMaxImgWidth = isDesktop ? 350 : 260;
        const dynamicImageWidth = Math.min(
            currentContainerWidth * 0.65, 
            absoluteMaxImgWidth,
            maxBubbleWidth - (BUBBLE_H_PAD * 2)
        );
        const dynamicImageHeight = dynamicImageWidth * 0.75; 

        return (
            <View style={styles.imageWrapperContainer}>
                <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={() => setPreviewImage(props.currentMessage.image)}
                    style={styles.imageTouchable}
                >
                    <Image 
                        source={{ uri: props.currentMessage.image }} 
                        style={{
                            width: dynamicImageWidth,
                            height: dynamicImageHeight,
                            borderRadius: 12,
                            backgroundColor: Colors.GRAY_LIGHT,
                        }} 
                        resizeMode="cover" 
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const renderCustomView = (props) => {
        const { currentMessage, position } = props;
        
        if (currentMessage.isDocument && currentMessage.fileUrl) {
            const isRight = position === 'right';
            return (
                <TouchableOpacity 
                    style={styles.attachmentContainer}
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            window.open(currentMessage.fileUrl, '_blank');
                        } else {
                            Linking.openURL(currentMessage.fileUrl);
                        }
                    }}
                    activeOpacity={0.8}
                >
                    <View style={[
                        styles.attachmentIconBox, 
                        isRight ? styles.attachmentIconBoxRight : styles.attachmentIconBoxLeft
                    ]}>
                        <CustomIcon 
                            library="Feather" 
                            name="paperclip" 
                            size={20} 
                            color={isRight ? Colors.PRIMARY : Colors.WHITE} 
                        />
                    </View>
                    <View style={styles.attachmentTextGroup}>
                        <CustomText style={[
                            styles.attachmentTitle, 
                            isRight ? styles.attachmentTitleRight : styles.attachmentTitleLeft
                        ]}>
                            File Attachment
                        </CustomText>
                        <CustomText 
                            style={[
                                styles.attachmentSubtitle, 
                                isRight ? styles.attachmentSubtitleRight : styles.attachmentSubtitleLeft
                            ]} 
                            numberOfLines={1}
                        >
                            Click to view document
                        </CustomText>
                    </View>
                </TouchableOpacity>
            );
        }
        return null;
    };

    const renderDay = (props) => (
        <Day 
            {...props} 
            wrapperStyle={styles.dayWrapper} 
            textStyle={styles.dayText} 
        />
    );

    const renderTime = (props) => {
        const isEmergency = props.currentMessage.isEmergency;
        const isLeft = props.position === 'left';

        return (
            <View style={isLeft ? styles.timeWrapperLeft : styles.timeWrapperRight}>
                <Time 
                    {...props} 
                    containerStyle={{
                        left: styles.timeContainerLeft,
                        right: styles.timeContainerRight,
                    }}
                    timeTextStyle={{ 
                        right: [styles.timeTextRight, isEmergency && { color: '#B71C1C' }], 
                        left: [styles.timeTextLeft, isEmergency && { color: '#B71C1C' }],
                    }} 
                />
            </View>
        );
    };

    const renderInputToolbar = (props) => {
        return (
            <InputToolbar 
                {...props} 
                containerStyle={[styles.inputToolbar, { width: '100%' }]} 
                primaryStyle={styles.inputToolbarPrimary} 
            />
        );
    };

    const renderFooter = () => {
        if (!isUploading) return null;
        return (
            <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 16 }}>
                <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, marginRight: 8, fontStyle: 'italic' }}>
                    Uploading attachment...
                </CustomText>
            </View>
        );
    };

    const renderActions = () => (
        <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
                onPress={onAttachPress} 
                style={styles.actionButton} 
                activeOpacity={0.7}
            >
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
                <View style={[
                    styles.sendButton, 
                    hasText ? styles.sendButtonActive : styles.sendButtonInactive
                ]}>
                    <CustomIcon 
                        library="Ionicons" 
                        name="send" 
                        size={16} 
                        color={hasText ? Colors.WHITE : Colors.GRAY_MEDIUM} 
                        style={styles.sendIcon} 
                    />
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
            
            <View style={[styles.container, { 
                paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
                alignItems: 'center'
            }]}>
                <View style={{ flex: 1, width: '100%', maxWidth: MAX_WEB_WIDTH, position: 'relative' }}>
                    <KeyboardAvoidingView
                        style={styles.container}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    >
                        <GiftedChat
                            messages={giftedChatMessages}
                            onSend={messages => onSend(messages)}
                            user={{
                                _id: currentUser?.id || '',
                                name: currentUser?.username || 'User',
                            }}
                            renderBubble={renderBubble}
                            renderMessageText={renderMessageText}
                            renderMessageImage={renderMessageImage}
                            renderCustomView={renderCustomView} 
                            renderInputToolbar={renderInputToolbar}
                            renderActions={renderActions}
                            renderComposer={renderComposer}
                            renderSend={renderSend}
                            renderDay={renderDay}
                            renderTime={renderTime}
                            renderFooter={renderFooter}
                            
                            renderAvatarOnTop={true}
                            renderUsernameOnMessage={false} 
                            showAvatarForEveryMessage={false}
                            
                            bottomOffset={Platform.OS === 'ios' ? insets.bottom : 0} 
                            placeholder="Type a message..."
                            alwaysShowSend={true}
                            listViewProps={listViewProps}
                        />
                    </KeyboardAvoidingView>
                </View>
            </View>

            <ImagePreviewModal 
                visible={previewImage !== null}
                imageUrl={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND 
    },
    headerActionIcon: { 
        padding: 4 
    },
    bubbleWrapper: { 
        marginBottom: 4, 
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
        alignSelf: 'flex-end',
        overflow: 'hidden', 
    },
    bubbleLeft: { 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        borderBottomLeftRadius: 4, 
        borderBottomRightRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2, 
        elevation: 1, 
        alignSelf: 'flex-start',
        overflow: 'hidden', 
    },

    emergencyBubble: {
        backgroundColor: '#FFF5F5',
        borderWidth: 2,
        borderColor: '#D32F2F',
    },
    emergencyText: {
        color: '#B71C1C',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
    },

    bubbleWrapperRight: {
        alignItems: 'flex-end',
    },
    bubbleWrapperLeft: {
        alignItems: 'flex-start',
    },

    imageWrapperContainer: {
        paddingHorizontal: BUBBLE_H_PAD,
        paddingVertical: BUBBLE_V_PAD,
        paddingBottom: 2, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageTouchable: {
        overflow: 'hidden',
        borderRadius: 12,
    },

    messageTextContainer: {
        paddingHorizontal: BUBBLE_H_PAD,
        paddingVertical: BUBBLE_V_PAD,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
    },
    messageTextCustom: {
        flexShrink: 1,
        flexWrap: 'wrap',
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
        paddingHorizontal: BUBBLE_H_PAD,
        paddingVertical: BUBBLE_V_PAD,
        gap: 12, 
        minWidth: 200, 
        maxWidth: '100%', 
        overflow: 'hidden' 
    },
    attachmentIconBox: { 
        width: 40, 
        height: 40, 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    attachmentIconBoxRight: { backgroundColor: Colors.WHITE },
    attachmentIconBoxLeft: { backgroundColor: Colors.PRIMARY },
    attachmentTextGroup: { flexShrink: 1 },
    attachmentTitle: { fontWeight: 'bold', fontSize: 14 },
    attachmentTitleRight: { color: Colors.WHITE },
    attachmentTitleLeft: { color: Colors.TEXT_PRIMARY },
    attachmentSubtitle: { fontSize: 12, marginTop: 2 },
    attachmentSubtitleRight: { color: 'rgba(255,255,255,0.8)' },
    attachmentSubtitleLeft: { color: Colors.TEXT_SECONDARY },
    
    timeContainerRight: { 
        alignSelf: 'flex-end', 
        marginRight: 12,
        marginBottom: 8,
    },
    timeContainerLeft: { 
        alignSelf: 'flex-start', 
        marginLeft: 12,
        marginBottom: 8,
    },
    timeTextRight: { 
        color: 'rgba(255, 255, 255, 0.7)', 
        fontSize: 10 
    },
    timeTextLeft: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 10 
    },
    timeWrapperLeft: {
        alignSelf: 'flex-start',
        width: '100%',
    },
    timeWrapperRight: {
        alignSelf: 'flex-end',
        width: '100%',
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
        paddingTop: 8, 
        paddingBottom: 8, 
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

export default RoomScreen;