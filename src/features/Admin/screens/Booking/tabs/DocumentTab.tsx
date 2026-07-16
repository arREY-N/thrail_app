/**
 * @file DocumentTab.tsx
 * @description Displays list of required files/documents for a booking and handles document validation decisions.
 */

import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import DocumentReviewCard from '@/src/features/Admin/screens/Booking/components/DocumentReviewCard';

export type DocValidState = 'pending' | 'approved' | 'rejected';

export interface DocState {
    name: string;
    file: string;
    valid: DocValidState;
}

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
 * @param rejectionReason - Text reason for rejection.
 * @param setRejectionReason - Callback to update rejection reason text.
 * @param onViewFile - Callback to trigger viewing document.
 */
export interface DocumentTabProps {
    booking: any;
    docStates: DocState[];
    setDocStates: (states: DocState[]) => void;
    viewedDocs: Record<number, boolean>;
    isReviewComplete: boolean;
    isRejectedStatus: boolean;
    isCancelledStatus: boolean;
    hasRejections: boolean;
    rejectionReason: string;
    setRejectionReason: (reason: string) => void;
    onViewFile: (fileUrl: string, index: number) => void;
}

/**
 * DocumentTab — Displays the list of required documents for a booking and handles approvals/rejections.
 */
const DocumentTab: React.FC<DocumentTabProps> = ({ 
    booking, 
    docStates, 
    setDocStates,
    viewedDocs, 
    isReviewComplete, 
    isRejectedStatus, 
    isCancelledStatus,
    hasRejections, 
    rejectionReason, 
    setRejectionReason, 
    onViewFile 
}) => {

    const toggleDocDecision = (index: number, statusString: DocValidState) => {
        if (isReviewComplete) return; 
        
        if (!viewedDocs[index] && docStates[index].valid === 'pending') {
            return Alert.alert(
                "Review Required", 
                "Please open the attachment first."
            );
        }
        
        const updated = [...docStates];
        updated[index] = { ...updated[index], valid: statusString };
        setDocStates(updated);
    };

    return (
        <View style={styles.tabContent}>
            
            {docStates.map((doc, index) => (
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
            ))}

            {!isReviewComplete && hasRejections && (
                <View style={styles.reasonBox}>
                    <CustomFeedbackInput 
                        label="Rejection Reason *"
                        helperText="Explain why the document was rejected. The hiker will receive this exact message."
                        placeholder="Explain what needs to be fixed..."
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        suggestions={[
                            "Blurry / Unreadable Image",
                            "Document Expired",
                            "Wrong File Uploaded"
                        ]}
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
    }
});

export default DocumentTab;
