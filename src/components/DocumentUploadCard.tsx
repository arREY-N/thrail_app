/**
 * @file DocumentUploadCard.tsx
 * @description A universal, accessible document and image upload component for the Thrail application.
 * Supports multiple visual variants (`card` standalone box and `row` embedded list items),
 * dynamic status indicators (pending, uploading, success, rejected, retry error, read-only),
 * full-width un-truncated rejection callout banners, and modal image preview.
 */

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import useFileUpload from '@/src/core/utility/uploadFile';

/**
 * Valid strict document storage keys supported by backend file services.
 */
export type UploadDocumentType = 'validId' | 'medicalCertificate' | 'bir' | 'dti' | 'denr';

/**
 * Maps document requirement names to strict keys for storage folder partitions and upload services.
 *
 * @param docName - Name of the document requirement (e.g. "Medical Certificate", "Valid ID")
 * @returns Strict document storage key
 */
export const getStrictDocKey = (docName: string): UploadDocumentType => {
    if (!docName) return 'validId';
    const lower = docName.toLowerCase();
    if (lower.includes('medical') || lower.includes('cert')) return 'medicalCertificate';
    if (lower.includes('bir')) return 'bir';
    if (lower.includes('dti')) return 'dti';
    if (lower.includes('denr')) return 'denr';
    return 'validId';
};

/**
 * Returns user-facing subtitle guidance based on the document requirement name.
 *
 * @param docName - Name of the document requirement
 * @returns Descriptive hint or criteria string
 */
export const getDocSubtitle = (docName: string): string => {
    const lower = docName.toLowerCase();
    if (lower.includes('medical') || lower.includes('cert')) return 'Valid within 6 months of hike date';
    if (lower.includes('parent') || lower.includes('guardian')) return 'Required for minor safety & verification';
    return 'Government-issued photo ID';
};

/**
 * Props for the DocumentUploadCard component.
 */
interface DocumentUploadCardProps {
    /** The primary title/name of the document requirement (e.g. "Valid Identification ID") */
    docName: string;
    /** The strict document key mapped to storage folder partitions (`validId`, `medicalCertificate`, etc.) */
    docKey?: string;
    /** Optional helper subtitle displayed beneath the title (e.g. "Passport or Driver's License") */
    subtitle?: string;
    /** Whether the document has been uploaded (accepts boolean, single URL string, or string array of URLs) */
    isUploaded?: string | string[] | boolean;
    /** Indicates if the previously uploaded document was rejected by admin verification */
    isRejected?: boolean;
    /** Specific reason message explaining why the document was rejected by admin */
    rejectionReason?: string;
    /** Callback fired when an upload is successfully completed with the new file URL */
    onUploadSuccess?: (url: string) => void;
    /** Whether multiple documents can be selected and appended */
    allowMultiple?: boolean;
    /** Callback fired when a document is removed from preview */
    onDelete?: (index: number) => void;
    /** If true, upload and change buttons are hidden, rendering in read-only inspection mode */
    readOnly?: boolean;
    /** Visual style variant: 'card' (standalone box) or 'row' (embedded within unified list container) */
    variant?: 'card' | 'row';
    /** Whether to render a bottom divider hairline (used in row variant lists) */
    showDivider?: boolean;
}

/**
 * DocumentUploadCard Component
 * 
 * Handles document picking, upload state progression, status badges, full-text rejection banners,
 * and thumbnail preview modal across both booking workflows and administrative review dashboards.
 */
const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({ 
    docName, 
    docKey,
    subtitle,
    isUploaded,
    isRejected = false, 
    rejectionReason,
    onUploadSuccess,
    allowMultiple = false,
    onDelete,
    readOnly = false,
    variant = 'card',
    showDivider = false,
}) => {
    
    const [isUploading, setIsUploading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    
    const { pickDocument } = useFileUpload();

    const imagesList: string[] = Array.isArray(isUploaded) 
        ? isUploaded.filter((url): url is string => typeof url === 'string' && url.trim().length > 0) 
        : (typeof isUploaded === 'string' && isUploaded.trim().length > 0 ? [isUploaded] : []);
        
    const isComplete = (imagesList.length > 0 || isUploaded === true) && !isRejected;

    const handleUploadPress = async () => {
        setIsUploading(true);
        setIsError(false);
        setErrorMessage('');
        try {
            const safeDocKey: UploadDocumentType = (
                docKey === 'medicalCertificate' || docKey === 'bir' || docKey === 'dti' || docKey === 'denr'
                    ? docKey
                    : 'validId'
            );
            const url = await pickDocument(safeDocKey);
            if (url && onUploadSuccess) {
                onUploadSuccess(url); 
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'An error occurred during upload.';
            const isCanceled = msg.toLowerCase().includes('cancel');
            if (isCanceled) {
                // User intentionally cancelled picker. Gracefully reset.
                setIsError(false);
                setErrorMessage('');
            } else {
                console.error(`Upload failed for ${docKey}:`, error);
                setIsError(true);
                setErrorMessage(msg);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewPress = () => {
        if (imagesList.length > 0) {
            setIsPreviewVisible(true);
        }
    };

    let iconName = "file-text";
    let iconColor = Colors.PRIMARY;
    let wrapperStyle = styles.iconWrapperPending;
    let btnStyle = styles.uploadBtn;
    let btnText = "Upload";
    let btnTextStyle = styles.uploadBtnText;
    let spinnerColor = Colors.WHITE;

    if (isComplete) {
        iconName = "check";
        iconColor = Colors.SUCCESS;
        wrapperStyle = styles.iconWrapperSuccess;
        btnStyle = styles.uploadedBtn;
        btnText = allowMultiple ? "Add More" : "Change";
        btnTextStyle = styles.uploadedBtnText;
        spinnerColor = Colors.TEXT_SECONDARY;
    } else if (isRejected) {
        iconName = "x-circle";
        iconColor = Colors.ERROR;
        wrapperStyle = styles.iconWrapperError;
        btnStyle = styles.errorBtn;
        btnText = "Re-upload";
        btnTextStyle = styles.errorBtnText;
        spinnerColor = Colors.WHITE;
    } else if (isError) {
        iconName = "alert-circle";
        iconColor = Colors.ERROR;     
        wrapperStyle = styles.iconWrapperError;
        btnStyle = styles.errorBtn;
        btnText = "Retry";            
        btnTextStyle = styles.errorBtnText;
        spinnerColor = Colors.WHITE;
    }

    const isErrorOrRejected = isRejected || isError;
    const viewBtnStyle = isErrorOrRejected ? styles.viewBtnNeutral : styles.viewBtn;
    const viewBtnTextStyle = isErrorOrRejected ? styles.viewBtnTextNeutral : styles.viewBtnText;

    const displayDocName = allowMultiple && imagesList.length > 0 
        ? `${imagesList.length} ${imagesList.length === 1 ? 'image' : 'images'} added`
        : docName;
    const isRow = variant === 'row';
    const displayError = errorMessage || (isRejected ? rejectionReason : '');

    return (
        <View style={[isRow ? styles.rowContainer : styles.cardContainer, showDivider && styles.rowDivider]}>
            <View style={[
                isRow ? styles.uploadRow : styles.uploadCard, 
                (isError || isRejected) && (isRow ? styles.uploadRowError : styles.uploadCardError)
            ]}>
                <View style={styles.uploadInfo}>
                    <View style={[styles.iconWrapper, wrapperStyle]}>
                        <CustomIcon library="Feather" name={iconName} size={18} color={iconColor} />
                    </View>
                    <View style={styles.textContainer}>
                        <CustomText variant="label" style={styles.docName} numberOfLines={2}>
                            {displayDocName}
                        </CustomText>
                        {subtitle ? (
                            <CustomText variant="caption" style={styles.docSubtitle} numberOfLines={1}>
                                {subtitle}
                            </CustomText>
                        ) : null}
                    </View>
                </View>
                
                <View style={styles.actionContainer}>
                    {imagesList.length > 0 && (
                        <TouchableOpacity style={viewBtnStyle} onPress={handleViewPress} activeOpacity={0.7}>
                            <CustomText variant="caption" style={viewBtnTextStyle}>
                                View
                            </CustomText>
                        </TouchableOpacity>
                    )}

                    {!readOnly && (
                        <TouchableOpacity 
                            style={btnStyle}
                            onPress={handleUploadPress} 
                            activeOpacity={0.7}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color={spinnerColor} />
                            ) : (
                                <CustomText variant="caption" style={btnTextStyle}>
                                    {btnText}
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* In Row Variant: Dedicated un-truncated rejection callout banner within the row */}
            {isRow && Boolean(displayError) ? (
                <View style={styles.rowRejectionBox}>
                    <CustomIcon 
                        library="Feather" 
                        name={isRejected ? "alert-triangle" : "alert-circle"} 
                        size={14} 
                        color={Colors.ERROR} 
                        style={styles.rowRejectionIcon} 
                    />
                    <CustomText variant="caption" style={styles.rowRejectionText}>
                        {isRejected ? `Rejection reason: ${displayError}` : displayError}
                    </CustomText>
                </View>
            ) : null}

            {/* In Card Variant: Dedicated bottom rejectionReasonBox */}
            {!isRow && Boolean(displayError) ? (
                <View style={styles.rejectionReasonBox}>
                    <CustomIcon 
                        library="Feather" 
                        name={isRejected ? "alert-triangle" : "alert-circle"} 
                        size={14} 
                        color={Colors.ERROR} 
                        style={styles.cardRejectionIcon} 
                    />
                    <CustomText variant="caption" style={styles.rejectionReasonText}>
                        {isRejected ? `Rejection reason: ${displayError}` : displayError}
                    </CustomText>
                </View>
            ) : null}

            <ImagePreviewModal 
                visible={isPreviewVisible} 
                images={imagesList} 
                onClose={() => setIsPreviewVisible(false)} 
                onDelete={onDelete ? (idx: number) => onDelete(idx) : undefined} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 12,
    },
    rowContainer: {
        width: '100%',
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    uploadCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }),
    },
    uploadCardError: {
        borderColor: Colors.ERROR_BORDER,
        backgroundColor: Colors.ERROR_BG, 
    },
    uploadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: Colors.WHITE,
    },
    uploadRowError: {
        backgroundColor: Colors.WHITE,
    },
    uploadInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1,
        paddingRight: 12
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    iconWrapper: { 
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    iconWrapperPending: { backgroundColor: Colors.BACKGROUND },
    iconWrapperSuccess: { backgroundColor: Colors.STATUS_APPROVED_BG },
    iconWrapperError: { backgroundColor: Colors.STATUS_CANCELLED_BG }, 
    docName: { 
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    docSubtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    rowRejectionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.ERROR_BG,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginBottom: 12,
        marginTop: 0,
        gap: 8,
    },
    rowRejectionIcon: {
        marginTop: 1,
        flexShrink: 0,
    },
    rowRejectionText: {
        color: Colors.ERROR,
        fontSize: 12,
        lineHeight: 17,
        flex: 1,
        fontWeight: '500',
    },
    actionContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
        flexShrink: 0
    },
    uploadBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center', backgroundColor: Colors.PRIMARY },
    uploadBtnText: { color: Colors.WHITE, fontWeight: 'bold' },
    uploadedBtn: { backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.GRAY_MEDIUM, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center' },
    uploadedBtnText: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold' },
    errorBtn: { backgroundColor: Colors.ERROR, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 80, alignItems: 'center' },
    errorBtnText: { color: Colors.WHITE, fontWeight: 'bold' },
    viewBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: Colors.STATUS_APPROVED_BG, borderWidth: 1, borderColor: Colors.SUCCESS },
    viewBtnText: { color: Colors.SUCCESS, fontWeight: 'bold' },
    viewBtnNeutral: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.GRAY_MEDIUM },
    viewBtnTextNeutral: { color: Colors.TEXT_PRIMARY, fontWeight: 'bold' },
    rejectionReasonBox: { 
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.ERROR_BG, 
        padding: 12, 
        borderRadius: 8, 
        marginTop: 4, 
        marginHorizontal: 16,
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER, 
        borderTopWidth: 0, 
        borderTopLeftRadius: 0, 
        borderTopRightRadius: 0,
        gap: 8,
    },
    cardRejectionIcon: {
        marginTop: 2,
        flexShrink: 0,
    },
    rejectionReasonText: { 
        color: Colors.ERROR, 
        fontSize: 12, 
        lineHeight: 18,
        flex: 1,
        fontWeight: '500',
    },
});

export default DocumentUploadCard;
