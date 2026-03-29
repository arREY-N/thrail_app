import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const DocumentUploadCard = ({ 
    docName, 
    isUploaded, 
    onUploadPress 
}) => {
    return (
        <View style={styles.uploadCard}>
            <View style={styles.uploadInfo}>
                <View 
                    style={[
                        styles.iconWrapper, 
                        isUploaded ? styles.iconWrapperSuccess : styles.iconWrapperPending
                    ]}
                >
                    <CustomIcon 
                        library="Feather" 
                        name={isUploaded ? "check" : "file-text"} 
                        size={20} 
                        color={isUploaded ? Colors.SUCCESS : Colors.PRIMARY} 
                    />
                </View>
                <CustomText variant="label" style={styles.docName}>
                    {docName}
                </CustomText>
            </View>
            
            <TouchableOpacity 
                style={[
                    styles.uploadBtn, 
                    isUploaded && styles.uploadedBtn
                ]}
                onPress={onUploadPress} 
                activeOpacity={0.7}
            >
                <CustomText 
                    variant="caption" 
                    style={isUploaded ? styles.uploadedBtnText : styles.uploadBtnText}
                >
                    {isUploaded ? "Uploaded" : "Upload"}
                </CustomText>
            </TouchableOpacity>
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
    uploadInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1 
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
        backgroundColor: '#E8F5E9' 
    },
    docName: { 
        flex: 1, 
        marginRight: 8 
    },
    uploadBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        borderRadius: 20, 
        backgroundColor: Colors.PRIMARY 
    },
    uploadedBtn: { 
        backgroundColor: Colors.BACKGROUND, 
        borderWidth: 1, 
        borderColor: Colors.SUCCESS 
    },
    uploadBtnText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold' 
    },
    uploadedBtnText: { 
        color: Colors.SUCCESS, 
        fontWeight: 'bold' 
    },
});

export default DocumentUploadCard;