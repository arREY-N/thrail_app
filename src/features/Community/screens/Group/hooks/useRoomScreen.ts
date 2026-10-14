/**
 * @file useRoomScreen.ts
 * @description Custom hook containing the state logic, keyboard listeners, message mapping, and handler callbacks for the chat RoomScreen.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

import { safeParseDateString } from '@/src/utils/dateFormatter';

import { IMessage } from '@/src/core/models/Message/Message';
import { IUser } from '@/src/core/models/User/User';
import { GroupWithLegacyName } from '@/src/features/Community/screens/Group/ListScreen';
import { CustomMessage } from '@/src/features/Community/screens/Group/RoomScreen';

/**
 * Checks if a string is a valid image URL.
 * 
 * @param url - The URL string to verify
 */
const isImageUrl = (url?: string): boolean => !!url && (url.match(/\.(jpeg|jpg|gif|png|webp|heic)$/i) != null || url.includes('alt=media'));

export interface UseRoomScreenProps {
    messages: IMessage[] | null;
    currentGroup: GroupWithLegacyName | null;
    currentUser: IUser | null;
    sendMessage: (text: string) => Promise<void>;
    markAsRead: (msg: IMessage) => void;
    loadMoreMessages: () => void;
    hasReachedEnd: boolean;
    headerTitle: string;
}

/**
 * Hook to manage states and events inside RoomScreen.
 * 
 * @param props - Configurations and store actions
 */
export const useRoomScreen = ({
    messages,
    currentGroup,
    currentUser,
    sendMessage,
    markAsRead,
    loadMoreMessages,
    hasReachedEnd,
    headerTitle,
}: UseRoomScreenProps) => {
    const [previewImage, setPreviewImage] = useState<string | undefined>(undefined);
    const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [pendingMessages, setPendingMessages] = useState<CustomMessage[]>([]);
    const [isLoadingEarlier, setIsLoadingEarlier] = useState<boolean>(false);

    // Use a ref so onEndReached callback always sees the latest values without remounting
    const loadMoreRef = useRef<{ hasReachedEnd: boolean; isLoadingEarlier: boolean; fn: (() => void) | undefined }>({
        hasReachedEnd,
        isLoadingEarlier,
        fn: loadMoreMessages,
    });

    useEffect(() => {
        loadMoreRef.current.hasReachedEnd = hasReachedEnd;
        loadMoreRef.current.isLoadingEarlier = isLoadingEarlier;
        loadMoreRef.current.fn = loadMoreMessages;
    });

    /**
     * Parses the headerTitle to split the mountain/trail name from the date/business information.
     */
    const { mainTitle, subtitle } = useMemo(() => {
        const parts = headerTitle ? headerTitle.split('•') : [];
        let finalSubtitle = parts[1]?.trim() || '';

        if (currentGroup?.type === 'chat' && currentUser?.emergencyContact?.userId) {
            const otherUser = currentGroup.members?.find(m => m.id !== currentUser.id);
            if (otherUser && otherUser.id === currentUser.emergencyContact.userId) {
                finalSubtitle = 'Emergency Contact';
            }
        }

        return {
            mainTitle: parts[0]?.trim() || 'Chat Room',
            subtitle: finalSubtitle,
        };
    }, [headerTitle, currentGroup, currentUser]);

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

    /**
     * Map raw database messages into Chat compatible CustomMessage format.
     */
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

            const timeSent = safeParseDateString(m.timesent);

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

        // Add a visual delay so the user gets clear feedback that more messages are being fetched
        const timer = setTimeout(() => {
            setIsLoadingEarlier(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [formattedFirebaseMessages]);

    /**
     * Combines pending messages with fetched Firebase messages, prepending system message if at the beginning.
     */
    const displayMessages = useMemo(() => {
        const activePending = pendingMessages.filter(pendingMsg => {
            return !formattedFirebaseMessages.some(fbMsg => 
                fbMsg.text === pendingMsg.text && fbMsg.user._id === pendingMsg.user._id
            );
        });
        const combined = [...activePending, ...formattedFirebaseMessages];

        if (hasReachedEnd && combined.length > 0) {
            if (!combined.some(m => m._id === 'system-beginning-of-chat')) {
                const groupCreatedAt = currentGroup?.createdAt
                    ? safeParseDateString(currentGroup.createdAt)
                    : new Date(0);

                combined.push({
                    _id: 'system-beginning-of-chat',
                    text: `This is the beginning of the conversation.`,
                    createdAt: new Date(groupCreatedAt.getTime() - 1000), // 1 second older
                    system: true,
                    user: { _id: 'system' }
                } as CustomMessage);
            }
        }

        // Sort the entire array descending (newest first) after combining all messages
        return combined.sort((a, b) => new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime());
    }, [pendingMessages, formattedFirebaseMessages, hasReachedEnd, currentGroup]);

    /**
     * Triggers loading of earlier messages. Uses a ref so the FlatList onEndReached
     * callback never closes over stale state.
     */
    const handleLoadEarlier = useCallback(() => {
        const { hasReachedEnd: atEnd, isLoadingEarlier: loading, fn } = loadMoreRef.current;
        if (atEnd || loading) return;
        setIsLoadingEarlier(true);
        // 600ms visual delay so the spinner is visible before messages appear
        setTimeout(() => {
            fn?.();
        }, 600);
    }, []); // stable — never remounts

    /**
     * Appends a temporary pending message and attempts to write to Firebase database.
     */
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

    /**
     * Retries sending a previously failed message.
     */
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
        onEndReachedThreshold: 0.2,
        removeClippedSubviews: Platform.OS === 'android',
    }), []);

    return {
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
    };
};
