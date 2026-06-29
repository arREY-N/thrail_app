import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Platform, StyleSheet } from 'react-native';

export const BUBBLE_H_PAD: number = 11;
export const BUBBLE_V_PAD: number = 7;

export const dropShadow = GlobalStyles.dropShadow(3);

export const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND 
    },
    headerActionIcon: { 
        padding: 4 
    },
    bubbleWrapper: { 
        marginBottom: 4 
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
        backgroundColor: Colors.CHAT_BUBBLE_RIGHT_BG, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        borderBottomLeftRadius: 16, 
        borderBottomRightRadius: 4, 
        alignSelf: 'flex-end', 
        overflow: 'hidden', 
        marginRight: 0 
    },
    bubbleLeft: { 
        backgroundColor: Colors.CHAT_BUBBLE_LEFT_BG, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        borderBottomLeftRadius: 4, 
        borderBottomRightRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
         
         
         
         
        ...dropShadow, 
        alignSelf: 'flex-start', 
        overflow: 'hidden', 
        marginLeft: 0 
    },
    emergencyBubble: { 
        backgroundColor: Colors.CHAT_EMERGENCY_BG, 
        borderWidth: 2, 
        borderColor: Colors.CHAT_EMERGENCY_BORDER 
    },
    emergencyText: { 
        color: Colors.CHAT_EMERGENCY_TEXT, 
        fontSize: 15, 
        fontWeight: '600', 
        lineHeight: 22 
    },
    bubbleWrapperRight: { 
        alignItems: 'flex-end' 
    },
    bubbleWrapperLeft: { 
        alignItems: 'flex-start' 
    },
    imageWrapperContainer: { 
        paddingHorizontal: BUBBLE_H_PAD, 
        paddingVertical: BUBBLE_V_PAD, 
        paddingBottom: 2, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    imageTouchable: { 
        overflow: 'hidden', 
        borderRadius: 12 
    },
    messageTextContainer: { 
        paddingHorizontal: BUBBLE_H_PAD, 
        paddingVertical: BUBBLE_V_PAD, 
        marginTop: 0, 
        marginBottom: 0, 
        marginLeft: 0, 
        marginRight: 0 
    },
    messageTextCustom: { 
        flexShrink: 1, 
        flexWrap: 'wrap' 
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
        color: Colors.CHAT_ATTACHMENT_SUBTITLE_RIGHT 
    },
    attachmentSubtitleLeft: { 
        color: Colors.TEXT_SECONDARY 
    },
    timeContainerRight: { 
        alignSelf: 'flex-end', 
        marginRight: 12, 
        marginBottom: 8 
    },
    timeContainerLeft: { 
        alignSelf: 'flex-start', 
        marginLeft: 12, 
        marginBottom: 8 
    },
    timeTextRight: { 
        color: Colors.CHAT_TIME_TEXT_RIGHT, 
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
        paddingTop: 8, 
        paddingBottom: 8 
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
    },
    mediaIconButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    headerMainTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 2,
    },
    systemMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
        paddingHorizontal: 24,
    },
    systemMessageDivider: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    systemMessageWrapper: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    systemMessageText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    systemMessageDate: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 4,
        fontStyle: 'italic',
    },
});