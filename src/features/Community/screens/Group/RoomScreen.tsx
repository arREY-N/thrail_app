import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import {
    Bubble,
    BubbleProps,
    Composer,
    ComposerProps,
    Day,
    DayProps,
    GiftedChat,
    IMessage as IGiftedMessage,
    InputToolbar,
    InputToolbarProps,
    MessageImageProps,
    MessageText,
    MessageTextProps,
    SendProps,
    Time,
    TimeProps
} from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import { BUBBLE_H_PAD, styles } from '@/src/features/Community/screens/Group/Styles/RoomStyles';

import { IMessageBase } from '@/src/core/models/Message/Message.types';
import { IUser } from '@/src/core/models/User/User.types';
import { GroupWithLegacyName } from '@/src/features/Community/screens/Group/ListScreen';

export interface CustomMessage extends IGiftedMessage {
    readBy?: { id: string; username?: string; firstname?: string }[];
    isDocument?: boolean;
    fileUrl?: string;
    isEmergency?: boolean;
    isError?: boolean;
}

interface ImageWithSpinnerProps {
    currentMessage: CustomMessage;
    dynamicWidth: number;
    dynamicHeight: number;
    onPress: () => void;
}

const ImageWithSpinner: React.FC<ImageWithSpinnerProps> = ({ currentMessage, dynamicWidth, dynamicHeight, onPress }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false); 

    return (
        <View style={styles.imageWrapperContainer}>
            <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={hasError ? undefined : onPress} 
                style={styles.imageTouchable}
            >
                {isLoading && !hasError && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                        <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    </View>
                )}
                
                {hasError ? (
                    <View style={{ width: dynamicWidth, height: dynamicHeight, borderRadius: 12, backgroundColor: Colors.GRAY_ULTRALIGHT, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.GRAY_LIGHT }}>
                        <CustomIcon library="Feather" name="image" size={32} color={Colors.GRAY_MEDIUM} />
                        <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, marginTop: 8 }}>
                            Failed to load image
                        </CustomText>
                    </View>
                ) : (
                    <Image 
                        source={{ uri: currentMessage.image }} 
                        style={{ width: dynamicWidth, height: dynamicHeight, borderRadius: 12, backgroundColor: Colors.GRAY_LIGHT }} 
                        resizeMode="cover"
                        onLoadEnd={() => setIsLoading(false)}
                        onError={() => { 
                            setIsLoading(false); 
                            setHasError(true); 
                        }}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

const CustomComposer: React.FC<ComposerProps> = (props) => {
    const [isFocused, setIsFocused] = useState(false);
    const currentHeight = !props.text ? 44 : props.composerHeight;
    return (
        <Composer
            {...props}
            textInputProps={{
                ...props.textInputProps,
                placeholderTextColor: Colors.TEXT_PLACEHOLDER,
                onFocus: () => setIsFocused(true),
                onBlur: () => setIsFocused(false),
                style: [
                    styles.composerTextInput,
                    isFocused && styles.composerTextInputFocused,
                    Platform.OS === 'web' && { outlineStyle: 'none' } as any,
                    { height: currentHeight, textAlignVertical: 'top' }
                ]
            }}
        />
    );
};

const isImageUrl = (url?: string): boolean => !!url && (url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) != null || url.includes('alt=media'));

export interface RoomScreenProps {
    messages: IMessageBase<any>[] | null;
    currentGroup: GroupWithLegacyName | null;
    currentUser: IUser | null;
    sendMessage: (text: string) => Promise<void>;
    markAsRead: (msg: IMessageBase<any>) => void;
    loadMoreMessages: () => void;
    headerTitle: string;
    onBackPress: () => void;
    onAttachPress: () => void;
    onLocationPress: () => void;
    isUploading: boolean;
}

const RoomScreen: React.FC<RoomScreenProps> = ({ 
    messages, 
    currentGroup,
    currentUser, 
    sendMessage,
    markAsRead, 
    loadMoreMessages, 
    headerTitle,
    onBackPress,
    onAttachPress,
    onLocationPress,
    isUploading
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, width: screenWidth } = useBreakpoints();
    const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    const MAX_WEB_WIDTH = 800;
    const currentContainerWidth = isDesktop ? Math.min(screenWidth, MAX_WEB_WIDTH) : screenWidth;
    const maxBubbleWidth = currentContainerWidth * 0.72;

    const [pendingMessages, setPendingMessages] = useState<CustomMessage[]>([]);

    const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
    const [hasReachedEnd, setHasReachedEnd] = useState(false);
    const previousMessageCount = useRef(0);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    useEffect(() => {
        if (!messages || !currentUser) return;
        const unreadMessages = messages.filter(m => 
            m.senderId !== currentUser.id && !(m.readBy || []).some(u => u.id === currentUser.id)
        );
        if (unreadMessages.length > 0) unreadMessages.forEach(rawMsg => markAsRead(rawMsg));
    }, [messages, currentUser, markAsRead]);

    const formattedFirebaseMessages = useMemo(() => {
        if (!messages) return [];
        return messages.map(m => {
            let text = m.content;
            let image: string | undefined = undefined;
            let isDocument = false;
            let fileUrl: string | undefined = undefined;
            let isEmergency = !!text && text.includes('Send help!');

            if (text && text.startsWith('[Attachment]:')) {
                const url = text.replace('[Attachment]:', '').trim();
                if (isImageUrl(url)) { image = url; text = ''; } 
                else { isDocument = true; fileUrl = url; text = ''; }
            } else if (isImageUrl(text)) { image = text.trim(); text = ''; }

            const timeSent = typeof m.timesent === 'object' && m.timesent !== null && 'toDate' in m.timesent
                ? (m.timesent as any).toDate()
                : new Date(m.timesent as string | number);

            return {
                _id: m.id,
                text: text,
                createdAt: timeSent,
                user: { _id: m.senderId, name: m.senderName },
                readBy: m.readBy || [],
                image: image,
                isDocument: isDocument,
                fileUrl: fileUrl,
                isEmergency: isEmergency 
            } as CustomMessage;
        }).sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime());
    }, [messages]);

    useEffect(() => {
        if (!formattedFirebaseMessages) return;
        setIsLoadingEarlier(false); 
        
        if (formattedFirebaseMessages.length > 0 && formattedFirebaseMessages.length === previousMessageCount.current) {
            setHasReachedEnd(true);
        }
        previousMessageCount.current = formattedFirebaseMessages.length;
    }, [formattedFirebaseMessages]);

    useEffect(() => {
        if (formattedFirebaseMessages.length > 0 && pendingMessages.length > 0) {
            setPendingMessages(prev => prev.filter(pendingMsg => {
                const isNowInFirebase = formattedFirebaseMessages.some(fbMsg => 
                    fbMsg.text === pendingMsg.text && fbMsg.user._id === pendingMsg.user._id
                );
                return !isNowInFirebase;
            }));
        }
    }, [formattedFirebaseMessages, pendingMessages.length]);

    const displayMessages = useMemo(() => {
        const combined = [...pendingMessages, ...formattedFirebaseMessages].sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime());
        
        if (hasReachedEnd && combined.length > 0) {
            if (!combined.some(m => m._id === 'system-beginning-of-chat')) {
                const oldestMessageDate = combined[combined.length - 1].createdAt as Date;

                combined.push({
                    _id: 'system-beginning-of-chat',
                    text: '— Beginning of conversation —',
                    createdAt: new Date(new Date(oldestMessageDate).getTime() - 1), 
                    system: true,
                    user: { _id: 'system' }
                });
            }
        }
        return combined;
    }, [pendingMessages, formattedFirebaseMessages, hasReachedEnd]);

    const handleLoadEarlier = useCallback(() => {
        if (hasReachedEnd || isLoadingEarlier) return;
        setIsLoadingEarlier(true);
        if (loadMoreMessages) loadMoreMessages();
    }, [hasReachedEnd, isLoadingEarlier, loadMoreMessages]);

    const onSend = useCallback(async (newMessages: CustomMessage[] = []) => {
        if (newMessages.length > 0) {
            const msgToSend = newMessages[0];
            const pendingId = `pending-${Date.now()}`;
            
            const pendingMsg: CustomMessage = {
                ...msgToSend,
                _id: pendingId,
                pending: true,
                isError: false, 
            };
            setPendingMessages(prev => [pendingMsg, ...prev]);

            try {
                await sendMessage(msgToSend.text);
            } catch {
                setPendingMessages(prev => prev.map(m => m._id === pendingId ? { ...m, isError: true } : m));
            }
        }
    }, [sendMessage]);

    const retrySend = useCallback(async (failedMsg: CustomMessage) => {
        setPendingMessages(prev => prev.map(m => m._id === failedMsg._id ? { ...m, isError: false } : m));
        try {
            await sendMessage(failedMsg.text);
        } catch {
            setPendingMessages(prev => prev.map(m => m._id === failedMsg._id ? { ...m, isError: true } : m));
        }
    }, [sendMessage]);

    const listViewProps = useMemo(() => ({
        showsVerticalScrollIndicator: false,
        initialNumToRender: 15,
        maxToRenderPerBatch: 10,
        windowSize: 10,
        removeClippedSubviews: Platform.OS === 'android',
    }), []);

    const renderBubble = useCallback((props: BubbleProps<CustomMessage>) => {
        const isLeft = props.position === 'left';
        const isRight = props.position === 'right';
        const senderId = props.currentMessage?.user?._id;
        const senderName = props.currentMessage?.user?.name;
        
        const isPending = props.currentMessage?.pending;
        const isError = props.currentMessage?.isError;
        
        const isSameAsPrevious = props.previousMessage && props.previousMessage.user && props.previousMessage.user._id === senderId;
        const isLastInCluster = !props.nextMessage || !props.nextMessage.user || props.nextMessage.user._id !== senderId;
        const showNameHeader = isLeft && !isSameAsPrevious;
        const isAdmin = currentGroup?.admins?.some(admin => admin.id === senderId);

        const readByUsers = (props.currentMessage?.readBy || []).filter(u => u.id !== currentUser?.id);
        const hasReadReceipts = isRight && isLastInCluster && readByUsers.length > 0 && !isPending && !isError;
        const readByNames = readByUsers.map(u => u.username || u.firstname).join(', ');

        const rightBubbleStyle: ViewStyle[] = props.currentMessage?.isEmergency ? [styles.bubbleRight, styles.emergencyBubble, { maxWidth: maxBubbleWidth }] : [styles.bubbleRight, { maxWidth: maxBubbleWidth }];
        const leftBubbleStyle: ViewStyle[] = props.currentMessage?.isEmergency ? [styles.bubbleLeft, styles.emergencyBubble, { maxWidth: maxBubbleWidth }] : [styles.bubbleLeft, { maxWidth: maxBubbleWidth }];

        if (isPending && !isError) rightBubbleStyle.push({ opacity: 0.7 });
        if (isError) rightBubbleStyle.push({ borderWidth: 1, borderColor: Colors.ERROR }); 

        return (
            <View style={[styles.bubbleWrapper, isRight ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
                {showNameHeader && (
                    <View style={styles.nameHeaderContainer}>
                        <CustomText variant="caption" style={styles.senderNameText}>{senderName}</CustomText>
                        {isAdmin ? <View style={styles.adminBadge}><CustomText variant="caption" style={styles.adminBadgeText}>Admin</CustomText></View>
                                 : <View style={styles.hikerBadge}><CustomText variant="caption" style={styles.hikerBadgeText}>Hiker</CustomText></View>}
                    </View>
                )}
                
                <Bubble
                    {...props}
                    wrapperStyle={{ right: rightBubbleStyle, left: leftBubbleStyle }}
                    textStyle={{
                        right: props.currentMessage?.isEmergency ? styles.emergencyText : styles.textRight,
                        left: props.currentMessage?.isEmergency ? styles.emergencyText : styles.textLeft,
                    }}
                />

                {isError && isRight && props.currentMessage ? (
                    <TouchableOpacity onPress={() => retrySend(props.currentMessage!)} style={styles.readReceiptContainer}>
                        <CustomIcon library="Feather" name="alert-circle" size={14} color={Colors.ERROR} />
                        <CustomText variant="caption" style={[styles.readReceiptText, { color: Colors.ERROR, fontWeight: 'bold' }]}>
                            Failed to send. Tap to retry.
                        </CustomText>
                    </TouchableOpacity>
                ) : isPending && isRight ? (
                    <View style={styles.readReceiptContainer}>
                        <ActivityIndicator size="small" color={Colors.GRAY_MEDIUM} style={{ transform: [{ scale: 0.6 }] }} />
                        <CustomText variant="caption" style={[styles.readReceiptText, { fontStyle: 'italic' }]}>
                            Sending...
                        </CustomText>
                    </View>
                ) : hasReadReceipts ? (
                    <View style={styles.readReceiptContainer}>
                        <CustomIcon library="Ionicons" name="checkmark-done" size={14} color={Colors.PRIMARY} />
                        <CustomText variant="caption" style={styles.readReceiptText}>
                            Seen by {readByNames}
                        </CustomText>
                    </View>
                ) : null}
            </View>
        );
    }, [currentGroup, currentUser, maxBubbleWidth, retrySend]);

    const renderMessageText = useCallback((props: MessageTextProps<CustomMessage>) => {
        const isEmergency = props.currentMessage?.isEmergency;
        return (
            <MessageText
                {...props}
                containerStyle={{ left: styles.messageTextContainer, right: styles.messageTextContainer }}
                textStyle={{ right: isEmergency ? styles.emergencyText : styles.textRight, left: isEmergency ? styles.emergencyText : styles.textLeft }}
                customTextStyle={styles.messageTextCustom}
                linkStyle={{
                    right: isEmergency ? { color: '#B71C1C', textDecorationLine: 'underline' } : { color: 'rgba(255,255,255,0.9)', textDecorationLine: 'underline' },
                    left: isEmergency ? { color: '#B71C1C', textDecorationLine: 'underline' } : { color: Colors.PRIMARY, textDecorationLine: 'underline' },
                }}
            />
        );
    }, []);

    const renderMessageImage = useCallback((props: MessageImageProps<CustomMessage>) => {
        const absoluteMaxImgWidth = isDesktop ? 350 : 260;
        const dynamicImageWidth = Math.min(currentContainerWidth * 0.65, absoluteMaxImgWidth, maxBubbleWidth - (BUBBLE_H_PAD * 2));
        const dynamicImageHeight = dynamicImageWidth * 0.75; 
        
        if (!props.currentMessage) return null;

        return (
            <ImageWithSpinner 
                currentMessage={props.currentMessage as CustomMessage}
                dynamicWidth={dynamicImageWidth}
                dynamicHeight={dynamicImageHeight}
                onPress={() => setPreviewImage(props.currentMessage?.image)}
            />
        );
    }, [currentContainerWidth, isDesktop, maxBubbleWidth]);

    const renderCustomView = useCallback((props: BubbleProps<CustomMessage>) => {
        const { currentMessage, position } = props;
        if (currentMessage?.isDocument && currentMessage.fileUrl) {
            const isRight = position === 'right';
            return (
                <TouchableOpacity 
                    style={styles.attachmentContainer}
                    onPress={() => Platform.OS === 'web' ? window.open(currentMessage.fileUrl, '_blank') : Linking.openURL(currentMessage.fileUrl!)}
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
    }, []);

    const renderDay = useCallback((props: DayProps) => 
        <Day 
            {...props} 
            wrapperStyle={styles.dayWrapper} 
            textProps={{ style: styles.dayText }} 
        />, []);

    const renderTime = useCallback((props: TimeProps<CustomMessage>) => {
        const isEmergency = props.currentMessage?.isEmergency;
        return (
            <Time 
                {...props} 
                containerStyle={{ left: styles.timeContainerLeft, right: styles.timeContainerRight }}
                timeTextStyle={{ right: [styles.timeTextRight, isEmergency && { color: '#B71C1C' }], left: [styles.timeTextLeft, isEmergency && { color: '#B71C1C' }] }} 
            />
        );
    }, []);

    const renderInputToolbar = useCallback((props: InputToolbarProps<CustomMessage>) => 
        <InputToolbar 
            {...props} 
            containerStyle={[styles.inputToolbar, { width: '100%' }]} 
            primaryStyle={styles.inputToolbarPrimary} 
        />, []);

    const renderFooter = useCallback(() => {
        if (!isUploading) return null;
        return (
            <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: 16 }}>
                <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, marginRight: 8, fontStyle: 'italic' }}>Uploading attachment...</CustomText>
            </View>
        );
    }, [isUploading]);

    const renderActions = useCallback(() => (
        <View style={styles.actionButtonContainer}>
            <TouchableOpacity onPress={onAttachPress} style={styles.actionButton} activeOpacity={0.7}>
                <CustomIcon library="Feather" name="plus" size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
        </View>
    ), [onAttachPress]);

    const renderComposer = useCallback((props: ComposerProps) => <CustomComposer {...props} />, []);

    const renderSend = useCallback((props: SendProps<CustomMessage>) => {
        const hasText = props.text && props.text.trim().length > 0;
        return (
            <TouchableOpacity 
                style={styles.sendContainer} disabled={!hasText} activeOpacity={0.7}
                onPress={() => hasText && props.onSend && props.onSend({ text: props.text!.trim() }, true)}
            >
                <View style={[styles.sendButton, hasText ? styles.sendButtonActive : styles.sendButtonInactive]}>
                    <CustomIcon library="Ionicons" name="send" size={16} color={hasText ? Colors.WHITE : Colors.GRAY_MEDIUM} style={styles.sendIcon} />
                </View>
            </TouchableOpacity>
        );
    }, []);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={headerTitle?.length > 28 ? `${headerTitle.substring(0, 28)}...` : headerTitle}
                centerTitle={true}
                onBackPress={onBackPress} 
            />
            
            <View style={[styles.container, { paddingBottom: Platform.OS === 'android' && !isKeyboardVisible ? insets.bottom : 0, alignItems: 'center' }]}>
                <View style={{ flex: 1, width: '100%', maxWidth: MAX_WEB_WIDTH, position: 'relative' }}>
                    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                        <GiftedChat
                            messages={displayMessages} 
                            onSend={messages => onSend(messages)}
                            user={{ _id: currentUser?.id || '', name: currentUser?.username || 'User' }}
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
                            // @ts-expect-error: GiftedChat types missing renderAvatarOnTop
                            renderAvatarOnTop={true}
                            renderUsernameOnMessage={false} 
                            showAvatarForEveryMessage={false}

                            loadEarlier={!hasReachedEnd}
                            onLoadEarlier={handleLoadEarlier}
                            isLoadingEarlier={isLoadingEarlier}
                            renderLoadEarlier={(props) => (
                                <TouchableOpacity style={{ padding: 10, alignItems: 'center' }} onPress={(props as unknown as { onLoadEarlier?: () => void }).onLoadEarlier} activeOpacity={0.7}>
                                    <CustomText variant="caption" style={{ color: Colors.PRIMARY, fontWeight: 'bold' }}>
                                        Load older messages
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                            infiniteScroll={true}
                            
                            bottomOffset={Platform.OS === 'ios' ? insets.bottom : 0} 
                            placeholder="Type a message..."
                            alwaysShowSend={true}
                            listViewProps={listViewProps}
                        />
                    </KeyboardAvoidingView>
                </View>
            </View>

            <ImagePreviewModal 
                visible={previewImage !== undefined}
                imageUrl={previewImage}
                onClose={() => setPreviewImage(undefined)}
            />
        </ScreenWrapper>
    );
};

export default RoomScreen;