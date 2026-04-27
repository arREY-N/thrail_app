import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const DocumentReviewCard = ({
    doc,
    index,
    needsReview,
    isReviewComplete,
    onViewFile,
    onToggleDecision
}) => {
    
    const getHelperStatus = () => {
        if (needsReview) {
            return { 
                text: "* Please open the attachment first to unlock options", 
                color: Colors.TEXT_SECONDARY 
            };
        }
        if (doc.valid === 'pending') {
            return { 
                text: "Attachment opened. Please approve or reject below.", 
                color: Colors.PRIMARY 
            };
        }
        if (doc.valid === 'approved') {
            return { 
                text: "✓ Document marked as valid", 
                color: Colors.SUCCESS 
            };
        }
        if (doc.valid === 'rejected') {
            return { 
                text: "✕ Document marked as invalid", 
                color: Colors.ERROR 
            };
        }
        
        return { 
            text: "", 
            color: Colors.TEXT_SECONDARY 
        };
    };

    const helperStatus = getHelperStatus();

    return (
        <View 
            style={[
                styles.docCard,
                doc.valid === 'approved' && styles.cardApproved,
                doc.valid === 'rejected' && styles.cardRejected
            ]}
        >
            <View style={styles.docHeader}>
                <CustomText style={styles.docName}>
                    {doc.name}
                </CustomText>
                
                {doc.valid !== 'pending' && (
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
                            {doc.valid === 'approved' ? "VALID" : "INVALID"}
                        </CustomText>
                    </View>
                )}
            </View>
            
            <TouchableOpacity 
                style={[
                    styles.viewFileBtn, 
                    needsReview && styles.viewFileBtnHighlight
                ]}
                onPress={() => onViewFile(doc.file, index)}
                activeOpacity={0.7}
            >
                <CustomIcon 
                    library="Feather" 
                    name="eye" 
                    size={16} 
                    color={needsReview ? Colors.STATUS_PENDING_TEXT : Colors.PRIMARY} 
                />
                <CustomText 
                    style={[
                        styles.viewFileText, 
                        needsReview && { color: Colors.STATUS_PENDING_TEXT }
                    ]}
                >
                    Open Attachment
                </CustomText>
            </TouchableOpacity>

            <CustomText style={[styles.viewRequiredText, { color: helperStatus.color }]}>
                {helperStatus.text}
            </CustomText>

            <View style={styles.btnRow}>
                <TouchableOpacity 
                    style={[
                        styles.decisionBtn,
                        doc.valid === 'approved' && styles.btnActiveApprove,
                        (isReviewComplete || needsReview) && { opacity: 0.4 }
                    ]}
                    onPress={() => onToggleDecision(index, 'approved')}
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
                            doc.valid === 'approved' && { color: Colors.WHITE }
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
                    onPress={() => onToggleDecision(index, 'rejected')}
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
                            doc.valid === 'rejected' && { color: Colors.WHITE }
                        ]}
                    >
                        Reject
                    </CustomText>
                </TouchableOpacity>
            </View>
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
        borderColor: Colors.SUCCESS,
        backgroundColor: Colors.STATUS_APPROVED_BG
    },
    cardRejected: {
        borderColor: Colors.ERROR,
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
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT
    },
    viewFileBtnHighlight: {
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderColor: Colors.STATUS_PENDING_BORDER,
        borderWidth: 1
    },
    viewFileText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 13
    },

    viewRequiredText: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 12,
        fontStyle: 'italic'
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
        fontSize: 14,
        color: Colors.TEXT_PRIMARY
    }
});

export default DocumentReviewCard;