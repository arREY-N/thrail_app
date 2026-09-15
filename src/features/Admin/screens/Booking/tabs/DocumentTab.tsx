/**
 * @file DocumentTab.tsx
 * @description Displays list of required files/documents for a booking and handles document validation decisions.
 */

import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import DocumentReviewCard from '@/src/features/Admin/screens/Booking/components/DocumentReviewCard';

import { Booking } from '@/src/core/models/Booking/Booking';
import { 
    DOCUMENT_REJECTION_REASONS, 
    PHONE_REJECTION_REASONS 
} from '@/src/features/Admin/utils/reviewMessages';

export type DocValidState = 'pending' | 'approved' | 'rejected';

export interface DocState {
    name: string;
    file: string;
    valid: DocValidState;
}

export const REJECTION_SUGGESTIONS: string[] = [
    ...DOCUMENT_REJECTION_REASONS,
    ...PHONE_REJECTION_REASONS,
];

/**
 * Props for DocumentTab component.
 * @param booking - The booking details object.
 * @param docStates - List of document validation states.
 * @param setDocStates - Callback to update document validation states.
 * @param viewedDocs - Record of viewed status per document index.
 * @param isReviewComplete - Flag indicating if review is complete.
 * @param isRejectedStatus - Flag indicating if booking was rejected.
 * @param isCancelledStatus - Flag indicating if booking was cancelled.
 * @param hasRejections - Flag indicating if any document is rejected.
 * @param showRejectionReason - Optional flag to force displaying rejection reason box.
 * @param rejectionReason - Text reason for rejection.
 * @param setRejectionReason - Callback to update rejection reason text.
 * @param onViewFile - Callback to trigger viewing document.
 * @param suggestions - Optional dynamic list of prioritized rejection reason suggestions.
 * @param onAttachmentRequired - Optional callback triggered when user taps decision without viewing attachment.
 * @param onInteraction - Optional callback tracking admin interactions.
 */
export interface DocumentTabProps {
    booking: Booking;
    docStates: DocState[];
    setDocStates: (states: DocState[]) => void;
    viewedDocs: Record<number, boolean>;
    isReviewComplete: boolean;
    isRejectedStatus: boolean;
    isCancelledStatus: boolean;
    hasRejections: boolean;
    showRejectionReason?: boolean;
    rejectionReason: string;
    setRejectionReason: (reason: string) => void;
    onViewFile: (fileUrl: string, index: number) => void;
    suggestions?: string[];
    onAttachmentRequired?: () => void;
    onInteraction?: () => void;
}

/**
 * DocumentTab — Displays the list of required documents for a booking and handles approvals/rejections.
 */
const DocumentTab: React.FC<DocumentTabProps> = ({ 
    booking: _booking, 
    docStates, 
    setDocStates,
    viewedDocs, 
    isReviewComplete, 
    isRejectedStatus: _isRejectedStatus, 
    isCancelledStatus,
    hasRejections, 
    showRejectionReason = false,
    rejectionReason, 
    setRejectionReason, 
    onViewFile,
    suggestions,
    onAttachmentRequired,
    onInteraction
}) => {

    const toggleDocDecision = (index: number, statusString: DocValidState) => {
        if (isReviewComplete) return; 
        
        if (!viewedDocs[index] && docStates[index].valid === 'pending') {
            if (onAttachmentRequired) {
                onAttachmentRequired();
                return;
            }
            return Alert.alert(
                "Review Required", 
                "Please open the attachment first."
            );
        }
        
        onInteraction?.();
        const updated = [...docStates];
        updated[index] = { ...updated[index], valid: statusString };
        setDocStates(updated);
    };

    return (
        <View style={styles.tabContent}>
            
            {docStates.length === 0 ? (
                <View style={styles.emptyCard}>
                    <CustomIcon library="Feather" name="file-text" size={32} color={Colors.TEXT_SECONDARY} />
                    <CustomText style={styles.emptyTitle}>No Documents Required</CustomText>
                    <CustomText variant="caption" style={styles.emptySubtitle}>
                        This reservation has no document requirements.
                    </CustomText>
                </View>
            ) : (
                docStates.map((doc, index) => (
                    <DocumentReviewCard 
                        key={index} 
                        doc={doc} 
                        index={index} 
                        needsReview={!viewedDocs[index] && doc.valid === 'pending'}
                        isViewed={!!viewedDocs[index]}
                        isReviewComplete={isReviewComplete}
                        isCancelledStatus={isCancelledStatus}
                        onViewFile={onViewFile} 
                        onToggleDecision={toggleDocDecision}
                    />
                ))
            )}

            {!isReviewComplete && (hasRejections || showRejectionReason) && (
                <View style={styles.reasonBox}>
                    <CustomFeedbackInput 
                        label="Rejection Reason *"
                        helperText="Explain why the booking or documents were rejected. The hiker will receive this exact message."
                        placeholder="Explain what needs to be fixed..."
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        suggestions={suggestions || REJECTION_SUGGESTIONS}
                    />
                </View>
            )}
            
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: { 
        paddingTop: 4 
    },
    reasonBox: { 
        marginBottom: 24 
    },
    emptyCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 16,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
});

export default DocumentTab;
