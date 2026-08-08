/**
 * @file RoomScreen.tsx
 * @description Pure UI layout screen displaying active conversation messages inside a group chat room.
 */

import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    StyleSheet,
    TextStyle,
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
    SystemMessage,
    SystemMessageProps,
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
import { BUBBLE_H_PAD, styles } from '@/src/features/Community/screens/Group/Styles/RoomStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import { IMessage } from '@/src/core/models/Message/Message.types';
import { IUser } from '@/src/core/models/User/User.types';
import { GroupWithLegacyName } from '@/src/features/Community/screens/Group/ListScreen';
import { useRoomScreen } from './hooks/useRoomScreen';

/**
 * Custom extension of GiftedChat's message type to support extra custom properties.
 */
export interface CustomMessage extends IGiftedMessage {
    readBy?: { id: string; username?: string; firstname?: string }[];
    isDocument?: boolean;
    fileUrl?: string;
    isEmergency?: boolean;
    isError?: boolean;
}

/**
 * Props for ImageWithSpinner.
 * 
 * @param currentMessage - The custom message containing the image URL
 * @param dynamicWidth - Computed width for the image layout
 * @param dynamicHeight - Computed height for the image layout
 * @param onPress - Callback when the image is tapped
 */
interface ImageWithSpinnerProps {
    currentMessage: CustomMessage;
    dynamicWidth: number;
    dynamicHeight: number;
    onPress: () => void;
}

/**
 * Component to render messages containing images with loading spinners and error fallbacks.
 */
const ImageWithSpinner: React.FC<ImageWithSpinnerProps> = ({ currentMessage, dynamicWidth, dynamicHeight, onPress }) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false); 
    const [showSpinner, setShowSpinner] = React.useState(false);

    React.useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (isLoading) {
            /* Delay spinner to prevent flash on cached images */
            timeout = setTimeout(() => setShowSpinner(true), 150); 
        } else {
            setShowSpinner(false);
        }
        return () => clearTimeout(timeout);
    }, [isLoading]);

    return (
        <View style={styles.imageWrapperContainer}>
            <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={hasError ? undefined : onPress} 
                style={styles.imageTouchable}
            >
                {showSpinner && !hasError && (
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

/**
 * Custom text input field wrapper for GiftedChat.
 */
const CustomComposer: React.FC<ComposerProps & { onFocusInput?: () => void }> = (props) => {
    const [isFocused, setIsFocused] = React.useState<boolean>(false);
    const text = props.text ?? '';
    const lines = text.split('\n').length;
    const currentHeight = Math.min(Math.max(40, lines * 20), 120);

    return (
        <Composer
            {...props}
            textInputProps={{
                ...props.textInputProps,
                onFocus: () => {
                    setIsFocused(true);
                    props.onFocusInput && props.onFocusInput();
                },
                onBlur: () => setIsFocused(false),
                style: [
                    styles.composerTextInput,
                    isFocused && styles.composerTextInputFocused,
                    Platform.OS === 'web' && ({ outlineStyle: 'none' } as unknown as TextStyle),
                    { height: currentHeight, textAlignVertical: 'top' }
                ]
            }}
        />
    );
};

/**
 * Props for the RoomScreen component.
 * 
 * @param messages - Loaded room messages
 * @param currentGroup - The current group metadata
 * @param currentUser - Currently logged in user
 * @param sendMessage - Action to send a text message
 * @param markAsRead - Action to mark messages as read
 * @param loadMoreMessages - Action to request older messages
 * @param hasReachedEnd - True when all historical messages have been loaded
 * @param headerTitle - Formatted header display title containing group information
 * @param onBackPress - Callback for back action
 * @param onAttachPhotoPress - Callback to choose a photo from the phone gallery
 * @param onCapturePhotoPress - Callback to capture a photo with the camera
 * @param isUploading - Indicates whether an attachment upload is ongoing
 */
export interface RoomScreenProps {
    messages: IMessage[] | null;
    currentGroup: GroupWithLegacyName | null;
    currentUser: IUser | null;
    sendMessage: (text: string) => Promise<void>;
    markAsRead: (msg: IMessage) => void;
    loadMoreMessages: () => void;
    hasReachedEnd: boolean;
    headerTitle: string;
    onBackPress: () => void;
    onAttachPhotoPress: () => void;
    onCapturePhotoPress: () => void;
    isUploading: boolean;
}

/**
 * Group Room Screen containing GiftedChat message feeds and customized attachment capabilities.
 */
const RoomScreen: React.FC<RoomScreenProps> = ({ 
    messages, 
    currentGroup,
    currentUser, 
    sendMessage,
    markAsRead, 
    loadMoreMessages,
    hasReachedEnd,
    headerTitle,
    onBackPress,
    onAttachPhotoPress,
    onCapturePhotoPress,
    isUploading
}) => {
    const insets = useSafeAreaInsets();
    const { isDesktop, width: screenWidth } = useBreakpoints();
    const MAX_WEB_WIDTH = 800;

    const {
        previewImage,
        setPreviewImage,
        isKeyboardVisible,
        isLoadingEarlier,
        mainTitle,
        subtitle,
        displayMessages,
        handleLoadEarlier,
        onSend,
        retrySend,
        listViewProps,
    } = useRoomScreen({
        messages,
        currentGroup,
        currentUser,
        sendMessage,
        markAsRead,
        loadMoreMessages,
        hasReachedEnd,
        headerTitle,
    });

    const currentContainerWidth = isDesktop ? Math.min(screenWidth, MAX_WEB_WIDTH) : screenWidth;
    const maxBubbleWidth = currentContainerWidth * 0.72;

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
                    renderTicks={() => null}
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
                    right: isEmergency ? { color: Colors.CHAT_LINK_RIGHT_EMERGENCY, textDecorationLine: 'underline' } : { color: Colors.CHAT_LINK_RIGHT_NORMAL, textDecorationLine: 'underline' },
                    left: isEmergency ? { color: Colors.CHAT_LINK_LEFT_EMERGENCY, textDecorationLine: 'underline' } : { color: Colors.CHAT_LINK_LEFT_NORMAL, textDecorationLine: 'underline' },
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
                currentMessage={props.currentMessage}
                dynamicWidth={dynamicImageWidth}
                dynamicHeight={dynamicImageHeight}
                onPress={() => setPreviewImage(props.currentMessage?.image)}
            />
        );
    }, [currentContainerWidth, isDesktop, maxBubbleWidth, setPreviewImage]);

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
                timeTextStyle={{ right: [styles.timeTextRight, isEmergency && { color: Colors.CHAT_EMERGENCY_TEXT }], left: [styles.timeTextLeft, isEmergency && { color: Colors.CHAT_EMERGENCY_TEXT }] }} 
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
            <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={Colors.PRIMARY} style={{ marginRight: 8 }} />
                <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, fontStyle: 'italic' }}>Uploading attachment...</CustomText>
            </View>
        );
    }, [isUploading]);

    const renderActions = useCallback((props: any) => {
        return (
            <View style={styles.actionButtonContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={onAttachPhotoPress} style={styles.mediaIconButton}>
                        <CustomIcon library="Ionicons" name="images" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                    {Platform.OS !== 'web' && (
                        <TouchableOpacity onPress={onCapturePhotoPress} style={styles.mediaIconButton}>
                            <CustomIcon library="Ionicons" name="camera" size={26} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }, [onAttachPhotoPress, onCapturePhotoPress]);

    const renderComposer = useCallback((props: ComposerProps) => (
        <CustomComposer 
            {...props} 
            onFocusInput={() => {}}
        />
    ), []);

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

    const renderChatEmpty = useCallback(() => {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', transform: [{ scaleY: -1 }] }}>
                <CustomIcon library="Ionicons" name="chatbubbles-outline" size={64} color={Colors.GRAY_MEDIUM} />
                <CustomText variant="body" style={{ color: Colors.TEXT_SECONDARY, marginTop: 16, textAlign: 'center' }}>
                    No messages yet.{"\n"}Send a message to start the conversation!
                </CustomText>
            </View>
        );
    }, []);

    const renderBeginningOfChat = useCallback(() => {
        if (!currentGroup) return null;
        let dateString = '';
        let timeString = '';
        if (currentGroup.createdAt) {
            const d = typeof currentGroup.createdAt === 'object' && 'toDate' in currentGroup.createdAt 
                ? (currentGroup.createdAt as any).toDate() 
                : new Date(currentGroup.createdAt as any);
            dateString = d.toLocaleDateString();
            timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        return (
            <View style={{ alignItems: 'center', marginVertical: 32 }}>
                <View style={{ backgroundColor: Colors.GRAY_ULTRALIGHT, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 }}>
                    <CustomText variant="caption" style={{ color: Colors.PRIMARY, fontWeight: 'bold' }}>
                        Beginning of conversation
                    </CustomText>
                </View>
                <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, marginTop: 8 }} dataDetectorType="none">
                    Created on {dateString} at {timeString}
                </CustomText>
            </View>
        );
    }, [currentGroup]);

    const renderSystemMessage = useCallback((props: SystemMessageProps<CustomMessage>) => {
        if (props.currentMessage?._id === 'system-beginning-of-chat') {
            return renderBeginningOfChat();
        }

        return (
            <SystemMessage
                {...props}
                textStyle={{
                    color: Colors.TEXT_SECONDARY,
                    fontSize: 12,
                    fontWeight: '600',
                    textAlign: 'center',
                    lineHeight: 18,
                }}
                containerStyle={{
                    marginVertical: 16,
                    paddingHorizontal: 24,
                }}
            />
        );
    }, [renderBeginningOfChat]);




    const renderLoading = useCallback(() => (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
            <ActivityIndicator size="large" color={Colors.WHITE} />
        </View>
    ), []);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                centerTitle={true}
                onBackPress={onBackPress} 
            >
                <View style={[styles.headerTitleContainer, { maxWidth: screenWidth - 120 }]}>
                    <CustomText 
                        variant="label" 
                        style={styles.headerMainTitle} 
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {mainTitle}
                    </CustomText>
                    {subtitle ? (
                        <CustomText 
                            variant="caption" 
                            style={styles.headerSubtitle} 
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {subtitle}
                        </CustomText>
                    ) : null}
                </View>
            </CustomHeader>
            
            <View style={[styles.container, { alignItems: 'center' }]}>
                <View style={{ flex: 1, width: '100%', maxWidth: MAX_WEB_WIDTH, position: 'relative' }}>
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
                        renderSystemMessage={renderSystemMessage}
                        renderLoading={renderLoading}
                        renderChatEmpty={renderChatEmpty}
                        loadEarlierMessagesProps={{
                            isAvailable: !hasReachedEnd,
                            isLoading: isLoadingEarlier,
                            onPress: handleLoadEarlier,
                            isInfiniteScrollEnabled: true,
                            label: 'Load older messages',
                            activityIndicatorColor: Colors.WHITE,
                            textStyle: { color: Colors.WHITE, fontWeight: '600', fontSize: 13 },
                            containerStyle: { marginVertical: 8 },
                        }}
                        listProps={{
                            ...listViewProps,
                            contentContainerStyle: { flexGrow: 1 }
                        }}
                    />
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