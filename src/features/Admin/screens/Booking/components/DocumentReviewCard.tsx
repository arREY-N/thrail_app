import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

/** The validation state of a single document in admin review. */
type DocValidState = 'pending' | 'approved' | 'rejected';

/** Represents the state of a single document being reviewed. */
interface DocState {
    name: string;
    file: string;
    valid: DocValidState;
}

/**
 * Props for the DocumentReviewCard component.
 * @param doc - The document state object containing name, file URL, and validation status.
 * @param index - The index of this document in the docStates array.
 * @param needsReview - Whether the document hasn't been viewed yet and is still pending.
 * @param isViewed - Whether this document attachment has been opened/viewed.
 * @param isReviewComplete - Whether the overall review process is finalized.
 * @param isCancelledStatus - Whether the booking has a terminal cancelled status.
 * @param onViewFile - Callback to open the document's file attachment.
 * @param onToggleDecision - Callback to toggle the approve/reject decision for this document.
 */
interface DocumentReviewCardProps {
    doc: DocState;
    index: number;
    needsReview: boolean;
    isViewed: boolean;
    isReviewComplete: boolean;
    isCancelledStatus: boolean;
    onViewFile: (fileUrl: string, index: number) => void;
    onToggleDecision: (index: number, status: DocValidState) => void;
}

/**
 * DocumentReviewCard — Displays a single document for admin review with
 * view, approve, and reject actions. Locks interactions when review is complete.
 */
const DocumentReviewCard = ({
    doc,
    index,
    needsReview,
    isViewed,
    isReviewComplete,
    isCancelledStatus,
    onViewFile,
    onToggleDecision
}: DocumentReviewCardProps) => {
    
    return (
        <View 
            style={[
                styles.docCard,
                doc.valid === 'approved' && styles.cardApproved,
                doc.valid === 'rejected' && styles.cardRejected,
                isCancelledStatus && styles.cardCancelled
            ]}
        >
            <View style={styles.docHeader}>
                <CustomText style={styles.docName}>
                    {doc.name}
                </CustomText>
                
                {doc.valid !== 'pending' && !isCancelledStatus && (
                    <View 
                        style={[
                            styles.badge, 
                            { 
                                backgroundColor: doc.valid === 'approved' 
                                    ? Colors.STATUS_APPROVED_BG 
                                    : Colors.ERROR_BG 
                            }
                        ]}
                    >
                        <CustomText 
                            variant="caption" 
                            style={[
                                styles.badgeText, 
                                { 
                                    color: doc.valid === 'approved' 
                                        ? Colors.SUCCESS 
                                        : Colors.ERROR 
                                }
                            ]}
                        >
                            {doc.valid === 'approved' ? "APPROVED" : "REJECTED"}
                        </CustomText>
                    </View>
                )}
            </View>
            
            {/* VIEW ATTACHMENT BUTTON (ALWAYS VISIBLE & CLUTTER-FREE) */}
            <TouchableOpacity 
                style={[
                    styles.viewFileBtn, 
                    isViewed && !isCancelledStatus && styles.viewFileBtnViewed
                ]}
                onPress={() => onViewFile(doc.file, index)}
                activeOpacity={0.7}
            >
                <CustomIcon 
                    library="Feather" 
                    name={isViewed ? "check" : "eye"} 
                    size={16} 
                    color={isViewed ? Colors.TEXT_SECONDARY : Colors.PRIMARY} 
                />
                <CustomText 
                    style={[
                        styles.viewFileText, 
                        isViewed && { color: Colors.TEXT_SECONDARY }
                    ]}
                >
                    {isViewed ? "Document Viewed" : "View Document"}
                </CustomText>
            </TouchableOpacity>

            {!isReviewComplete && (
                <View style={styles.btnRow}>
                    <TouchableOpacity 
                        style={[
                            styles.decisionBtn,
                            doc.valid === 'approved' && styles.btnActiveApprove,
                            (isReviewComplete || needsReview) && { opacity: 0.4 }
                        ]}
                        onPress={() => !isReviewComplete && !needsReview && onToggleDecision(index, 'approved')}
                        activeOpacity={(isReviewComplete || needsReview) ? 1 : 0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="check" 
                            size={16} 
                            color={doc.valid === 'approved' ? Colors.WHITE : Colors.SUCCESS} 
                        />
                        <CustomText 
                            style={[
                                styles.btnText, 
                                doc.valid === 'approved' ? { color: Colors.WHITE } : { color: Colors.SUCCESS }
                            ]}
                        >
                            Approve
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.decisionBtn,
                            doc.valid === 'rejected' && styles.btnActiveReject,
                            (isReviewComplete || needsReview) && { opacity: 0.4 }
                        ]}
                        onPress={() => !isReviewComplete && !needsReview && onToggleDecision(index, 'rejected')}
                        activeOpacity={(isReviewComplete || needsReview) ? 1 : 0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="x" 
                            size={16} 
                            color={doc.valid === 'rejected' ? Colors.WHITE : Colors.ERROR} 
                        />
                        <CustomText 
                            style={[
                                styles.btnText, 
                                doc.valid === 'rejected' ? { color: Colors.WHITE } : { color: Colors.ERROR }
                            ]}
                        >
                            Reject
                        </CustomText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    docCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        padding: 16, 
        marginBottom: 16 
    },
    cardApproved: { 
        borderColor: Colors.SUCCESS 
    },
    cardRejected: { 
        borderColor: Colors.ERROR 
    },
    cardCancelled: { 
        borderColor: Colors.ERROR_BORDER, 
        backgroundColor: Colors.ERROR_BG 
    },
    docHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    docName: { 
        fontSize: 15, 
        fontWeight: '600' 
    },
    badge: { 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6 
    },
    badgeText: { 
        fontWeight: 'bold', 
        fontSize: 10 
    },
    viewFileBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        backgroundColor: Colors.WHITE, 
        padding: 12, 
        borderRadius: 12, 
        marginBottom: 12, 
        borderWidth: 1, 
        borderColor: Colors.PRIMARY 
    },
    viewFileBtnViewed: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.GRAY_LIGHT
    },
    viewFileText: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    btnRow: { 
        flexDirection: 'row', 
        gap: 12 
    },
    decisionBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        paddingVertical: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        backgroundColor: Colors.WHITE 
    },
    btnActiveApprove: { 
        backgroundColor: Colors.SUCCESS, 
        borderColor: Colors.SUCCESS 
    },
    btnActiveReject: { 
        backgroundColor: Colors.ERROR, 
        borderColor: Colors.ERROR 
    },
    btnText: { 
        fontWeight: 'bold', 
        fontSize: 14 
    }
});

export default DocumentReviewCard;
