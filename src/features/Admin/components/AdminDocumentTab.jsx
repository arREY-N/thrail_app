import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import DocumentReviewCard from '@/src/features/Admin/components/DocumentReviewCard';

const AdminDocumentTab = ({ 
    booking, 
    docStates, 
    setDocStates,
    viewedDocs, 
    isReviewComplete, 
    isRejectedStatus, 
    hasRejections, 
    rejectionReason, 
    setRejectionReason, 
    onViewFile 
}) => {

    const toggleDocDecision = (index, statusString) => {
        if (isReviewComplete) return; 
        
        if (!viewedDocs[index] && docStates[index].valid === 'pending') {
            return Alert.alert("Review Required", "Please open the attachment first.");
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
                    isReviewComplete={isReviewComplete}
                    onViewFile={onViewFile} 
                    onToggleDecision={toggleDocDecision}
                />
            ))}

            {isRejectedStatus && booking?.cancellationReason ? (
                <View style={styles.reasonBox}>
                    <CustomText style={styles.rejectionLabel}>
                        Rejection Reason
                    </CustomText>
                    
                    <View style={styles.readOnlyReason}>
                        <CustomText style={{ color: Colors.ERROR }}>
                            {booking.cancellationReason}
                        </CustomText>
                    </View>
                </View>
            ) : (
                hasRejections && !isReviewComplete && (
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
                )
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
    rejectionLabel: { 
        color: Colors.ERROR, 
        marginBottom: 8, 
        fontWeight: 'bold' 
    },
    readOnlyReason: { 
        backgroundColor: Colors.ERROR_BG, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER 
    }
});

export default AdminDocumentTab;