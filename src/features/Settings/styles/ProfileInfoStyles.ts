/**
 * @file ProfileInfoStyles.ts
 * @description Stylesheet declaration for the ProfileInfoScreen view.
 */

import { StyleSheet } from 'react-native';
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from "@/src/constants/layout";

export const styles = StyleSheet.create({
    contentArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        gap: 20,
    },
    scrollContentWide: {
        maxWidth: Layout.MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
    },
    headerActionButton: {
        padding: 8,
    },
    desktopColumns: {
        flexDirection: 'row',
        gap: 20,
    },
    mobileStack: {
        flexDirection: 'column',
        gap: 20,
    },
    column: {
        gap: 20,
    },
    columnWide: {
        flex: 1,
    },
    profileHeaderBanner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    nameContainer: {
        alignItems: 'center',
        gap: 2,
    },
    avatarCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(3),
    },
    avatarInitial: {
        color: Colors.WHITE,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    profileName: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 0,
        fontSize: 20,
        textAlign: 'center',
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: -16,
        borderWidth: 2,
        borderColor: Colors.WHITE,
        zIndex: 10,
        ...GlobalStyles.dropShadow(2),
    },
    roleText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    memberSinceText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        textAlign: 'center',
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    editIconBtn: {
        padding: 4,
    },
    cardTitle: {
        marginBottom: 0,
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardBody: {
        flexDirection: 'column',
    },
    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        flexWrap: 'wrap',
    },
    inlineLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
    },
    inlineValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
    },
    stackedRow: {
        flexDirection: 'column',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    stackedLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stackedValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '700',
    },
    noMargin: {
        marginBottom: 0,
        paddingBottom: 0,
        borderBottomWidth: 0,
    },
    largeImageWrapper: {
        position: 'relative',
        height: 180,
        width: '100%',
        borderRadius: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(2),
    },
    largeImage: {
        width: '100%',
        height: '100%',
    },
    largeImageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 12,
    },
    imageCountBadge: {
        backgroundColor: `${Colors.BLACK}A6`,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 12,
    },
    imageMaximizeBadge: {
        backgroundColor: `${Colors.BLACK}A6`,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expBarContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        marginBottom: 24,
        ...GlobalStyles.dropShadow(1),
    },
    expBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    expBarTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    expBarLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
        marginBottom: 6,
    },
    expBarTitle: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    expBarValue: {
        fontSize: 20,
        marginBottom: 0,
    },
    expBarIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    segmentsContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    segment: {
        alignSelf: 'stretch',
        height: 10,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 8,
        borderRadius: 2,
    },
    emptyEmergencyContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    emptyEmergencyIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.STATUS_WARNING_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyEmergencyText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    setupEmergencyBtn: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        ...GlobalStyles.dropShadow(1),
    },
    setupEmergencyBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    segmentFirst: {
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    segmentLast: {
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    segmentLabelText: {
        fontSize: 10,
        color: Colors.TEXT_PLACEHOLDER,
        fontWeight: '600',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    preferenceEditGroup: {
        marginBottom: 20,
    },
    preferencesSection: {
        marginBottom: 24,
    },
    gamifiedChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gamifiedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexShrink: 1,
        maxWidth: '100%',
    },
    gamifiedChipIcon: {
        marginRight: 6,
    },
    gamifiedChipText: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '700',
        fontSize: 12,
        flexShrink: 1,
    },
    emptyGamifiedChip: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    emptyGamifiedChipText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
        fontSize: 12,
    },
    experienceBadge: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    experienceBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    editForm: {
        flexDirection: 'column',
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    headerCancelButton: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    headerSaveButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    headerSaveButtonDisabled: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    cancelText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveTextDisabled: {
        color: Colors.GRAY_MEDIUM,
    },
    bottomSpacer: {
        height: 40,
    },
    medicalToggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    medicalToggleOption: {
        flex: 1,
        marginBottom: 0,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    toggleChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    toggleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    toggleChipActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.WHITE,
    },
    toggleChipText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    toggleChipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});
