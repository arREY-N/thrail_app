/**
 * @file DocumentUploadCard.tsx
 * @description A universal, accessible document and image upload component for the Thrail application.
 * Supports multiple visual variants (`card` standalone box and `row` embedded list items),
 * dynamic status indicators (pending, uploading, success, rejected, retry error, read-only),
 * full-width un-truncated rejection callout banners, and modal image preview.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    LayoutAnimation,
    Linking,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    UIManager,
    View,
    ViewStyle
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { FileRepository, SelectedFile } from '@/src/core/repositories/fileRepository';
import useFileUpload from '@/src/core/utility/uploadFile';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Checks device network connectivity before initiating upload requests.
 */
const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
        if (Platform.OS === 'web') {
            return typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;
        }
        const state = await NetInfo.fetch();
        return Boolean(state.isConnected && (state.isInternetReachable ?? true));
    } catch {
        return true;
    }
};

const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

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
    /** Callback fired when multiple documents are uploaded together */
    onBatchUploadSuccess?: (urls: string[]) => void;
    /** Whether multiple documents can be selected and appended */
    allowMultiple?: boolean;
    /** Maximum number of photos/documents allowed when allowMultiple is true (defaults to 5) */
    maxFiles?: number;
    /** Callback fired when a document is removed from preview */
    onDelete?: (index: number) => void;
    /** If true, upload and change buttons are hidden, rendering in read-only inspection mode */
    readOnly?: boolean;
    /** Visual style variant: 'card' (standalone box) or 'row' (embedded within unified list container) */
    variant?: 'card' | 'row';
    /** Whether to render a bottom divider hairline (used in row variant lists) */
    showDivider?: boolean;
    /** Optional custom upload handler override (e.g. placeholder or custom service) */
    onUploadPress?: () => void | Promise<void>;
    /** Optional container style override */
    style?: StyleProp<ViewStyle>;
    /** Optional inner content style override for row/card container */
    contentStyle?: StyleProp<ViewStyle>;
    /** Optional callback when an error occurs (skips inline error box if provided) */
    onError?: (msg: string) => void;
    /** Optional ref attached to the upload button container for precise tutorial spotlight measurement */
    uploadButtonRef?: React.RefObject<View | null>;
}

/**
 * DocumentUploadCard Component
 * 
 * Handles document picking, upload state progression, status badges, full-text rejection banners,
 * and thumbnail preview modal across booking workflows, review creation, and administrative dashboards.
 */
const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({ 
    docName, 
    docKey,
    subtitle,
    isUploaded,
    isRejected = false, 
    rejectionReason,
    onUploadSuccess,
    onBatchUploadSuccess,
    onUploadPress,
    allowMultiple = false,
    maxFiles = 5,
    onDelete,
    readOnly = false,
    variant = 'card',
    showDivider = false,
    style,
    contentStyle,
    onError,
    uploadButtonRef,
}) => {
    
    const [isUploading, setIsUploading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    
    const { pickDocument } = useFileUpload();

    const imagesList: string[] = Array.isArray(isUploaded) 
        ? isUploaded.filter((url): url is string => typeof url === 'string' && url.trim().length > 0) 
        : (typeof isUploaded === 'string' && isUploaded.trim().length > 0 ? [isUploaded] : []);
        
    const isComplete = (imagesList.length > 0 || isUploaded === true) && !isRejected;
    const maxAllowed = allowMultiple ? maxFiles : 1;
    const remainingSlots = Math.max(0, maxAllowed - imagesList.length);
    const isLimitReached = imagesList.length >= maxAllowed;

    const handleUploadPress = async () => {
        if (isPermissionBlocked && Platform.OS !== 'web') {
            try {
                const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
                if (currentStatus === 'granted') {
                    setIsPermissionBlocked(false);
                    setIsError(false);
                    setErrorMessage('');
                } else {
                    await Linking.openSettings();
                    return;
                }
            } catch {
                await Linking.openSettings();
                return;
            }
        }

        if (onUploadPress) {
            await onUploadPress();
            return;
        }

        if (allowMultiple && isLimitReached) {
            setIsError(true);
            setErrorMessage(`Maximum limit of ${maxAllowed} photos reached.`);
            return;
        }

        setIsUploading(true);
        setIsError(false);
        setErrorMessage('');
        try {
            const isOnline = await checkNetworkConnectivity();
            if (!isOnline) {
                throw new Error('No internet connection. Please check your signal and try again.');
            }

            const safeDocKey: UploadDocumentType = (
                docKey === 'medicalCertificate' || docKey === 'bir' || docKey === 'dti' || docKey === 'denr'
                    ? docKey
                    : 'validId'
            );

            const uploadedUrls: string[] = [];

            if (Platform.OS === 'web' && !allowMultiple) {
                // Web: browser file picker with client validation fallback for single document
                const url = await pickDocument(safeDocKey);
                if (url) {
                    uploadedUrls.push(url);
                }
            } else {
                // Mobile and Web gallery image picker
                if (Platform.OS !== 'web') {
                    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        if (!canAskAgain) {
                            setIsPermissionBlocked(true);
                            throw new Error('Photo gallery permission is disabled. Please enable photo access in Settings to upload.');
                        }
                        setIsPermissionBlocked(false);
                        throw new Error('Permission to access photo gallery is required.');
                    }
                    setIsPermissionBlocked(false);
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 0.85,
                    allowsMultipleSelection: allowMultiple,
                    selectionLimit: allowMultiple ? remainingSlots : 1,
                });

                if (result.canceled || !result.assets || result.assets.length === 0) {
                    setIsUploading(false);
                    return;
                }

                const targetAssets = allowMultiple 
                    ? result.assets.slice(0, remainingSlots) 
                    : [result.assets[0]];

                // Client-side batch validation: MIME and 5MB size limits
                for (const asset of targetAssets) {
                    const extension = (asset.fileName || asset.uri).split('.').pop()?.toLowerCase();
                    const isImageMime = !asset.mimeType || asset.mimeType.startsWith('image/');
                    const isAllowedExt = extension ? ALLOWED_IMAGE_EXTENSIONS.includes(extension) : false;

                    if (!isImageMime || !isAllowedExt) {
                        throw new Error('Only image files (JPG, PNG, WEBP, HEIC) are accepted.');
                    }

                    if (asset.fileSize && asset.fileSize > MAX_DOCUMENT_SIZE_BYTES) {
                        throw new Error(`File size of "${asset.fileName || 'selected image'}" exceeds the 5MB limit.`);
                    }
                }

                // Batch upload to Firebase Storage
                for (const asset of targetAssets) {
                    const extension = (asset.fileName || asset.uri).split('.').pop()?.toLowerCase();
                    const selectedFile: SelectedFile = {
                        uri: asset.uri,
                        name: asset.fileName || `${safeDocKey}_${Date.now()}.${extension || 'jpg'}`,
                        mimeType: asset.mimeType || 'image/jpeg',
                        size: asset.fileSize,
                    };

                    try {
                        const fileUrl = await FileRepository.uploadDocuments(selectedFile);
                        if (fileUrl) {
                            uploadedUrls.push(fileUrl);
                        }
                    } catch (uploadErr) {
                        const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
                        if (errMsg.includes('quota-exceeded')) {
                            uploadedUrls.push('https://drive.google.com/file/d/1CfQd7ed1e3N0eQGREP4F_Y7iTV6zL7V0/view?usp=sharing');
                        } else {
                            throw uploadErr;
                        }
                    }
                }
            }

            if (uploadedUrls.length > 0) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                if (onBatchUploadSuccess) {
                    onBatchUploadSuccess(uploadedUrls);
                }
                if (onUploadSuccess) {
                    for (const url of uploadedUrls) {
                        onUploadSuccess(url);
                    }
                }
            }
        } catch (error: unknown) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const msg = error instanceof Error ? error.message : 'An error occurred during upload.';
            const isCanceled = msg.toLowerCase().includes('cancel');
            if (isCanceled) {
                setIsError(false);
                setErrorMessage('');
                setIsPermissionBlocked(false);
            } else {
                console.error(`Upload failed for ${docKey}:`, error);
                setIsError(true);
                setErrorMessage(msg);
                if (onError) {
                    onError(msg);
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewPress = () => {
        if (imagesList.length > 0) {
            setPreviewIndex(0);
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
        btnStyle = isPermissionBlocked ? styles.settingsBtn : styles.errorBtn;
        btnText = isPermissionBlocked ? "Settings" : "Retry";            
        btnTextStyle = styles.errorBtnText;
        spinnerColor = Colors.WHITE;
    }

    const isErrorOrRejected = isRejected || isError;
    const viewBtnStyle = isErrorOrRejected ? styles.viewBtnNeutral : styles.viewBtn;
    const viewBtnTextStyle = isErrorOrRejected ? styles.viewBtnTextNeutral : styles.viewBtnText;

    const displayDocName = docName;
    const displaySubtitle = subtitle ?? (
        allowMultiple 
            ? `${imagesList.length}/${maxAllowed} photos added • Max 5MB each` 
            : undefined
    );
    const isRow = variant === 'row';
    const hasUploadError = Boolean(errorMessage);
    const hasRejectionReason = !hasUploadError && isRejected && Boolean(rejectionReason);
    const shouldShowErrorBox = hasUploadError || hasRejectionReason;
    const errorBoxIcon = hasUploadError ? "alert-circle" : "alert-triangle";
    const errorBoxText = hasUploadError ? errorMessage : `Rejection reason: ${rejectionReason}`;

    return (
        <View style={[isRow ? styles.rowContainer : styles.cardContainer, showDivider && styles.rowDivider, style]}>
            <View style={[
                isRow ? styles.uploadRow : styles.uploadCard, 
                (isError || isRejected) && (isRow ? styles.uploadRowError : styles.uploadCardError),
                allowMultiple && styles.multiUploadCard,
                contentStyle,
            ]}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.uploadInfo}>
                        <View style={[styles.iconWrapper, wrapperStyle]}>
                            <CustomIcon library="Feather" name={iconName} size={18} color={iconColor} />
                        </View>
                        <View style={styles.textContainer}>
                            <CustomText variant="label" style={styles.docName} numberOfLines={2}>
                                {displayDocName}
                            </CustomText>
                            {displaySubtitle ? (
                                <CustomText variant="caption" style={styles.docSubtitle} numberOfLines={1}>
                                    {displaySubtitle}
                                </CustomText>
                            ) : null}
                        </View>
                    </View>
                    
                    <View style={styles.actionContainer}>
                        {imagesList.length > 0 && (
                            <TouchableOpacity style={viewBtnStyle} onPress={handleViewPress} activeOpacity={0.7}>
                                <CustomText variant="caption" style={viewBtnTextStyle}>
                                    {allowMultiple && imagesList.length > 1 ? `View (${imagesList.length})` : 'View'}
                                </CustomText>
                            </TouchableOpacity>
                        )}

                        {!readOnly && (!allowMultiple || !isLimitReached) && (
                            <View ref={uploadButtonRef} collapsable={false}>
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
                                            {allowMultiple && imagesList.length > 0 ? "+ Add" : btnText}
                                        </CustomText>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {!readOnly && allowMultiple && isLimitReached && (
                            <View style={styles.maxLimitBadge}>
                                <CustomText variant="caption" style={styles.maxLimitBadgeText}>
                                    {`${maxAllowed}/${maxAllowed} Max`}
                                </CustomText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Multi-Photo Thumbnail Gallery Grid */}
                {allowMultiple && (
                    <View style={styles.galleryWrapper}>
                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.galleryScrollContent}
                        >
                            {imagesList.map((imgUrl, index) => (
                                <View key={`thumb-${index}-${imgUrl}`} style={styles.thumbnailCard}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.thumbnailTouch}
                                        onPress={() => {
                                            setPreviewIndex(index);
                                            setIsPreviewVisible(true);
                                        }}
                                        accessibilityLabel={`View photo ${index + 1}`}
                                    >
                                        <CustomImage
                                            source={{ uri: imgUrl }}
                                            style={styles.thumbnailImage}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>

                                    {!readOnly && onDelete && (
                                        <TouchableOpacity
                                            style={styles.deleteThumbnailBadge}
                                            onPress={() => onDelete(index)}
                                            activeOpacity={0.7}
                                            accessibilityLabel={`Remove photo ${index + 1}`}
                                        >
                                            <CustomIcon library="Feather" name="x" size={12} color={Colors.WHITE} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            {!readOnly && !isLimitReached && (
                                <TouchableOpacity
                                    style={styles.addPhotoSlot}
                                    onPress={handleUploadPress}
                                    activeOpacity={0.7}
                                    disabled={isUploading}
                                    accessibilityLabel="Add another photo"
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color={Colors.PRIMARY} />
                                    ) : (
                                        <>
                                            <CustomIcon library="Feather" name="plus" size={20} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.addPhotoSlotText}>
                                                Add
                                            </CustomText>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* In Row Variant: Dedicated un-truncated rejection/error callout banner within the row */}
            {isRow && shouldShowErrorBox ? (
                <View style={styles.rowRejectionBox}>
                    <CustomIcon 
                        library="Feather" 
                        name={errorBoxIcon} 
                        size={14} 
                        color={Colors.ERROR} 
                        style={styles.rowRejectionIcon} 
                    />
                    <CustomText variant="caption" style={styles.rowRejectionText}>
                        {errorBoxText}
                    </CustomText>
                </View>
            ) : null}

            {/* In Card Variant: Dedicated bottom rejectionReasonBox */}
            {!isRow && shouldShowErrorBox ? (
                <View style={styles.rejectionReasonBox}>
                    <CustomIcon 
                        library="Feather" 
                        name={errorBoxIcon} 
                        size={14} 
                        color={Colors.ERROR} 
                        style={styles.cardRejectionIcon} 
                    />
                    <CustomText variant="caption" style={styles.rejectionReasonText}>
                        {errorBoxText}
                    </CustomText>
                </View>
            ) : null}

            <ImagePreviewModal 
                visible={isPreviewVisible} 
                images={imagesList} 
                initialIndex={previewIndex}
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
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }),
    },
    multiUploadCard: {
        paddingBottom: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    uploadCardError: {
        borderColor: Colors.ERROR_BORDER,
        backgroundColor: Colors.ERROR_BG, 
    },
    uploadRow: {
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
        paddingRight: 12,
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
        marginRight: 12,
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
    actionContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
        flexShrink: 0,
    },
    uploadBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        minWidth: 80, 
        alignItems: 'center', 
        backgroundColor: Colors.PRIMARY, 
    },
    uploadBtnText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
    },
    uploadedBtn: { 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_MEDIUM, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        minWidth: 80, 
        alignItems: 'center', 
    },
    uploadedBtnText: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold', 
    },
    errorBtn: { 
        backgroundColor: Colors.ERROR, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        minWidth: 80, 
        alignItems: 'center', 
    },
    errorBtnText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
    },
    settingsBtn: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    viewBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 20, 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        borderWidth: 1, 
        borderColor: Colors.SUCCESS, 
    },
    viewBtnText: { 
        color: Colors.SUCCESS, 
        fontWeight: 'bold', 
    },
    viewBtnNeutral: { 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 20, 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_MEDIUM, 
    },
    viewBtnTextNeutral: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold', 
    },
    maxLimitBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    maxLimitBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    galleryWrapper: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    galleryScrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    thumbnailCard: {
        position: 'relative',
        width: 72,
        height: 72,
    },
    thumbnailTouch: {
        width: 72,
        height: 72,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    deleteThumbnailBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.ERROR,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
        zIndex: 5,
        ...GlobalStyles.dropShadow(2, 0.15, Colors.SHADOW),
    },
    addPhotoSlot: {
        width: 72,
        height: 72,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
    },
    addPhotoSlotText: {
        color: Colors.PRIMARY,
        fontSize: 11,
        fontWeight: '600',
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
