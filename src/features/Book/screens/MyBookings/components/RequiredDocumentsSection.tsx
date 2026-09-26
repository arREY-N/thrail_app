/**
 * @file RequiredDocumentsSection.tsx
 * @description Renders the Required Documents accordion section in BookingDetailsScreen,
 * supporting replacement of rejected documents via DocumentUploadCard and document previews.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { BookingStatus, Requirements } from '@/src/core/models/Booking/Booking';
import DocumentUploadCard, { getStrictDocKey } from '@/src/components/DocumentUploadCard';
import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';

export interface RequiredDocumentsSectionProps {
    /** The documents to display */
    localDocs: Requirements[];
    /** Indices of documents that were rejected originally */
    originalRejectedIndices: number[];
    /** Staged replacement URLs keyed by index */
    stagedReplacements: Record<number, string>;
    /** Current booking display status */
    displayStatus?: BookingStatus;
    /** Whether booking is cancelled */
    isCancelled: boolean;
    /** Callback when a document is successfully uploaded */
    onUploadSuccess: (idx: number, url: string, docName: string) => void;
    /** Callback to preview a document */
    onPreviewDoc: (url: string) => void;
}


/**
 * RequiredDocumentsSection component for displaying and managing document uploads.
 *
 * @param props - Component properties
 * @returns Rendered JSX element or null if no documents exist
 */
const RequiredDocumentsSection = ({
    localDocs,
    originalRejectedIndices,
    stagedReplacements,
    displayStatus,
    isCancelled,
    onUploadSuccess,
    onPreviewDoc,
}: RequiredDocumentsSectionProps): React.JSX.Element | null => {
    if (!localDocs || localDocs.length === 0) {
        return null;
    }

    const isAccordionDefaultOpen =
        displayStatus === 'for-reservation' ||
        displayStatus === 'reservation-rejected';

    const renderDocumentRow = (docObj: Requirements, idx: number): React.JSX.Element => {
        const docName = docObj.name || 'Document';
        const rawValid = docObj.valid;

        let validState = 'pending';
        if (rawValid === 'approved') validState = 'approved';
        if (rawValid === 'rejected') validState = 'rejected';

        const isApproved = validState === 'approved';
        const isRejected = validState === 'rejected';
        const isOriginallyRejected = originalRejectedIndices.includes(idx);

        if (isOriginallyRejected && !isCancelled && displayStatus === 'reservation-rejected') {
            const stagedFileUrl = stagedReplacements[idx];
            const effectiveFileUrl = stagedFileUrl || docObj.file;
            const isStillRejected = !stagedFileUrl;

            return (
                <DocumentUploadCard
                    key={idx}
                    docName={docName}
                    docKey={getStrictDocKey(docName)}
                    variant="row"
                    showDivider={idx < localDocs.length - 1}
                    isUploaded={effectiveFileUrl}
                    isRejected={isStillRejected}
                    onUploadSuccess={(url: string) => {
                        onUploadSuccess(idx, url, docName);
                    }}
                />
            );
        }

        const iconName = isApproved ? 'check-circle' : isRejected ? 'x-circle' : 'clock';
        const iconColor = isApproved ? Colors.SUCCESS : isRejected ? Colors.ERROR : Colors.STATUS_PENDING_TEXT;
        const statusText = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review';

        const hasFile = Boolean(docObj.file);

        return (
            <View key={idx} style={[styles.approvedRowWrapper, idx < localDocs.length - 1 && styles.rowDivider]}>
                <View style={styles.approvedUploadRow}>
                    <View style={styles.uploadInfo}>
                        <View
                            style={[
                                styles.iconWrapper,
                                isApproved
                                    ? styles.iconWrapperSuccess
                                    : isRejected
                                      ? styles.iconWrapperError
                                      : styles.iconWrapperPending,
                            ]}
                        >
                            <CustomIcon
                                library="Feather"
                                name={iconName}
                                size={18}
                                color={iconColor}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <CustomText variant="body" style={styles.docName} numberOfLines={2} ellipsizeMode="tail">
                                {docName}
                            </CustomText>
                        </View>
                    </View>
                    <View style={styles.actionContainer}>
                        {hasFile ? (
                            <TouchableOpacity
                                style={styles.docViewBtn}
                                onPress={() => onPreviewDoc(docObj.file || '')}
                                activeOpacity={0.7}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                                <CustomText variant="caption" style={styles.docViewBtnText}>
                                    View
                                </CustomText>
                            </TouchableOpacity>
                        ) : null}
                        <View style={isApproved ? styles.approvedPill : isRejected ? styles.rejectedPill : styles.pendingPill}>
                            <CustomText
                                variant="caption"
                                style={
                                    isApproved
                                        ? styles.approvedPillText
                                        : isRejected
                                          ? styles.rejectedPillText
                                          : styles.pendingPillText
                                }
                            >
                                {statusText}
                            </CustomText>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <AccordionItem
            title="Required Documents"
            icon="file-text"
            defaultOpen={isAccordionDefaultOpen}
        >
            <View style={styles.documentsContainerCard}>
                {localDocs.map((doc: Requirements, idx: number) => renderDocumentRow(doc, idx))}
            </View>
        </AccordionItem>
    );
};

const styles = StyleSheet.create({
    documentsContainerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
    },
    approvedRowWrapper: {
        width: '100%',
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    approvedUploadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: Colors.WHITE,
    },
    uploadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    iconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconWrapperSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    iconWrapperPending: {
        backgroundColor: Colors.STATUS_PENDING_BG,
    },
    iconWrapperError: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    docName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    docViewBtn: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.SUCCESS,
    },
    docViewBtnText: {
        color: Colors.SUCCESS,
        fontWeight: 'bold',
    },
    approvedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    approvedPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    rejectedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_BORDER,
    },
    rejectedPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    pendingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_PENDING_BG,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.STATUS_PENDING_BORDER,
    },
    pendingPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_PENDING_TEXT,
    },
});

export default RequiredDocumentsSection;
