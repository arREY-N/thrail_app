import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import useFileUpload from '@/src/core/hook/file/useFileUpload';

const DocumentUploadCard = ({ 
    docName, 
    docKey,
    isUploaded,
    onUploadSuccess 
}) => {
    
    const [isUploading, setIsUploading] = useState(false);
    const [isError, setIsError] = useState(false);
    
    const { pickDocument } = useFileUpload();

    const isUrl = typeof isUploaded === 'string' && isUploaded.startsWith('http');
    const isComplete = !!isUploaded;

    const handleUploadPress = async () => {
        setIsUploading(true);
        setIsError(false);
        try {
            const url = await pickDocument(docKey || 'validId');
            if (url && onUploadSuccess) {
                onUploadSuccess(url); 
            } else {
                setIsError(true);
            }
        } catch (error) {
            console.error(`Upload failed for ${docKey}:`, error);
            setIsError(true);
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewPress = () => {
        if (isUrl) {
            if (Platform.OS === 'web') {
                window.open(isUploaded, '_blank');
            } else {
                Linking.openURL(isUploaded);
            }
        }
    };

    let iconName = "file-text";
    let iconColor = Colors.PRIMARY;
    let wrapperStyle = styles.iconWrapperPending;
    let btnStyle = styles.uploadBtn;
    let btnText = "Upload";
    let btnTextStyle = styles.uploadBtnText;

    if (isComplete) {
        iconName = "check";
        iconColor = Colors.SUCCESS;
        wrapperStyle = styles.iconWrapperSuccess;
        btnStyle = styles.uploadedBtn;
        btnText = "Change";
        btnTextStyle = styles.uploadedBtnText;
    } else if (isError) {
        iconName = "alert-circle";
        iconColor = Colors.ERROR;     
        wrapperStyle = styles.iconWrapperError;
        btnStyle = styles.errorBtn;
        btnText = "Retry";            
        btnTextStyle = styles.errorBtnText;
    }

    return (
        <View style={[styles.uploadCard, isError && styles.uploadCardError]}>
            <View style={styles.uploadInfo}>
                <View style={[styles.iconWrapper, wrapperStyle]}>
                    <CustomIcon library="Feather" name={iconName} size={20} color={iconColor} />
                </View>
                <CustomText variant="label" style={styles.docName} numberOfLines={2}>
                    {docName}
                </CustomText>
            </View>
            
            <View style={styles.actionContainer}>
                {isComplete && isUrl && (
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
                        <ActivityIndicator size="small" color={Colors.WHITE} />
                    ) : (
                        <CustomText variant="caption" style={btnTextStyle}>
                            {btnText}
                        </CustomText>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    uploadCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 16, 
        marginBottom: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4, 
        elevation: 2 
    },
    uploadCardError: {
        borderColor: Colors.ERROR_BORDER,
        backgroundColor: Colors.ERROR_BG, 
    },
    uploadInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1,
        paddingRight: 8
    },
    iconWrapper: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    iconWrapperPending: { 
        backgroundColor: Colors.BACKGROUND 
    },
    iconWrapperSuccess: { 
        backgroundColor: Colors.STATUS_APPROVED_BG 
    },
    iconWrapperError: { 
        backgroundColor: Colors.ERROR_BORDER 
    }, 
    docName: { 
        flex: 1 
    },
    actionContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    uploadBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        minWidth: 80, 
        alignItems: 'center', 
        backgroundColor: Colors.PRIMARY 
    },
    uploadBtnText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold' 
    },
    uploadedBtn: { 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_MEDIUM, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        minWidth: 80, 
        alignItems: 'center' 
    },
    uploadedBtnText: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold' 
    },
    errorBtn: { 
        backgroundColor: Colors.ERROR, 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        minWidth: 80, 
        alignItems: 'center' 
    },
    errorBtnText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold' 
    },
    viewBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 12, 
        borderRadius: 20, 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        borderWidth: 1, 
        borderColor: Colors.SUCCESS 
    },
    viewBtnText: { 
        color: Colors.SUCCESS, 
        fontWeight: 'bold' 
    }
});

export default DocumentUploadCard;