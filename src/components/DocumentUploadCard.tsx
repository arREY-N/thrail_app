import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import useFileUpload from '@/src/core/hook/file/useFileUpload';

/**
 * Props for the DocumentUploadCard component.
 */
interface DocumentUploadCardProps {
    /** The display name of the document to be uploaded */
    docName: string;
    /** The key/identifier for the document type */
    docKey?: string;
    /** Whether the document has been uploaded (can be boolean, string URL, or array of URLs) */
    isUploaded?: string | string[] | boolean;
    /** Indicates if the previously uploaded document was rejected */
    isRejected?: boolean;
    /** Callback fired when an upload is successfully completed */
    onUploadSuccess?: (url: string) => void;
    /** Whether multiple documents can be uploaded */
    allowMultiple?: boolean;
    /** Callback fired when a document is deleted */
    onDelete?: (index: number) => void;
}

/**
 * DocumentUploadCard — A card component that handles document/image uploads
 * with support for status indicators (pending, success, rejected, error) and image preview.
 */
const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({ 
    docName, 
    docKey,
    isUploaded,
    isRejected = false, 
    onUploadSuccess,
    allowMultiple = false,
    onDelete
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
            const url = await pickDocument((docKey || 'validId') as any);
            if (url && onUploadSuccess) {
                onUploadSuccess(url); 
            } else {
                setIsError(true);
                setErrorMessage('Upload failed or was canceled.');
            }
        } catch (error: any) {
            console.error(`Upload failed for ${docKey}:`, error);
            setIsError(true);
            setErrorMessage(error.message || 'An error occurred during upload.');
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

    const displayDocName = allowMultiple && imagesList.length > 0 
        ? `${imagesList.length} ${imagesList.length === 1 ? 'image' : 'images'} added`
        : docName;

    return (
        <View style={styles.container}>
            <View style={[styles.uploadCard, (isError || isRejected) && styles.uploadCardError]}>
                <View style={styles.uploadInfo}>
                    <View style={[styles.iconWrapper, wrapperStyle]}>
                        <CustomIcon library="Feather" name={iconName} size={20} color={iconColor} />
                    </View>
                    <CustomText variant="label" style={styles.docName} numberOfLines={2}>
                        {displayDocName}
                    </CustomText>
                </View>
                
                <View style={styles.actionContainer}>
                    {imagesList.length > 0 && (
                        <TouchableOpacity style={styles.viewBtn} onPress={handleViewPress} activeOpacity={0.7}>
                            <CustomText variant="caption" style={styles.viewBtnText}>
                                View
                            </CustomText>
                        </TouchableOpacity>
                    )}

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
                </View>
            </View>

            {isError && Boolean(errorMessage) ? (
                <View style={styles.rejectionReasonBox}>
                    <CustomText variant="caption" style={styles.rejectionReasonText}>
                        {errorMessage}
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
    container: {
        marginBottom: 12,
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
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
...GlobalStyles.dropShadow(2),},
    uploadCardError: {
        borderColor: Colors.ERROR_BORDER,
        backgroundColor: Colors.ERROR_BG, 
    },
    uploadInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1,
        paddingRight: 12
    },
    iconWrapper: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    iconWrapperPending: { backgroundColor: Colors.BACKGROUND },
    iconWrapperSuccess: { backgroundColor: Colors.STATUS_APPROVED_BG },
    iconWrapperError: { backgroundColor: Colors.WHITE }, 
    docName: { 
        flex: 1,
        flexShrink: 1
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
    rejectionReasonBox: { 
        backgroundColor: Colors.ERROR_BG, 
        padding: 10, 
        borderRadius: 8, 
        marginTop: 4, 
        marginLeft: 16,
        marginRight: 16,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        borderTopWidth: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    rejectionReasonText: { 
        color: Colors.ERROR, 
        fontSize: 12, 
        lineHeight: 18,
        fontStyle: 'italic'
    },
});

export default DocumentUploadCard;
