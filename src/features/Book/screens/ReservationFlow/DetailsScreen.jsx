import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/core/stores/authStore';
import StickyFooter from '@/src/features/Book/components/StickyFooter';

const DetailsScreen = ({ 
    selectedOffer, 
    savedDetails, 
    savedDocs, 
    onContinue, 
    isSubmitting 
}) => {
    
    const { profile } = useAuthStore();
    const hasProfileData = !!(profile?.firstname || profile?.lastname);

    const profileFullName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim();
    
    let profilePhone = profile?.phoneNumber || '';
    if (profilePhone.startsWith('+63')) {
        profilePhone = profilePhone.substring(3);
    } else if (profilePhone.startsWith('0')) {
        profilePhone = profilePhone.substring(1);
    }

    const getInitialData = () => {
        if (savedDetails) return savedDetails;
        return {
            phone: profilePhone,
            emergencyName: '',
            emergencyPhone: '',
        };
    };

    const [formData, setFormData] = useState(getInitialData());
    const [uploadedDocs, setUploadedDocs] = useState(savedDocs || {});
    
    const [isEditingPhone, setIsEditingPhone] = useState(!hasProfileData); 
    const [showEditModal, setShowEditModal] = useState(false);

    const requiredDocuments = selectedOffer?.documents || [];

    useEffect(() => {
        setFormData(getInitialData());
        setUploadedDocs(savedDocs || {});
    }, [savedDetails, savedDocs, profile]); 

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSimulateUpload = (docName) => {
        setUploadedDocs(prev => ({ ...prev, [docName]: !prev[docName] }));
    };

    const confirmEditPhone = () => {
        setIsEditingPhone(true);
        setShowEditModal(false);
    };

    const handleResetPhone = () => {
        setFormData(prev => ({ ...prev, phone: profilePhone }));
        setIsEditingPhone(false);
    };

    const isFormValid = () => {
        const isBasicInfoFilled = formData.phone && formData.emergencyName && formData.emergencyPhone;
        const areAllDocsUploaded = requiredDocuments.every(doc => uploadedDocs[doc]);
        return isBasicInfoFilled && areAllDocsUploaded;
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h2" style={styles.sectionTitleFlat}>
                            Hiker Information
                        </CustomText>

                        {hasProfileData && !isEditingPhone && (
                            <TouchableOpacity 
                                style={styles.headerActionBtn} 
                                onPress={() => setShowEditModal(true)}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="edit-3" 
                                    size={14} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText variant="caption" style={styles.headerActionBtnText}>
                                    Edit Phone
                                </CustomText>
                            </TouchableOpacity>
                        )}
                        
                        {hasProfileData && isEditingPhone && (
                            <TouchableOpacity 
                                style={styles.headerResetBtn} 
                                onPress={handleResetPhone}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="refresh-ccw" 
                                    size={14} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText variant="caption" style={styles.headerResetBtnText}>
                                    Reset
                                </CustomText>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={styles.lockedInputContainer}>
                        <CustomTextInput 
                            label="Full Name"
                            value={profileFullName}
                            editable={false} 
                            style={styles.inputSpacing}
                        />
                    </View>

                    <View style={!isEditingPhone ? styles.lockedInputContainer : {}}>
                        <CustomTextInput 
                            label="Phone Number"
                            placeholder="9XX XXX XXXX"
                            prefix="+63"
                            type="phone"
                            value={formData.phone  || ''}
                            keyboardType="number-pad"
                            editable={isEditingPhone}
                            onChangeText={(text) => handleInputChange('phone', text)}
                            maxLength={12}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Emergency Contact
                    </CustomText>
                    
                    <CustomTextInput 
                        label="Contact Name"
                        placeholder="Maria Dela Cruz"
                        value={formData.emergencyName  || ''}
                        onChangeText={(text) => handleInputChange('emergencyName', text)}
                        style={styles.inputSpacing}
                    />

                    <CustomTextInput 
                        label="Contact Phone Number"
                        placeholder="9XX XXX XXXX"
                        prefix="+63"
                        type="phone"
                        value={formData.emergencyPhone  || ''}
                        keyboardType="number-pad"
                        onChangeText={(text) => handleInputChange('emergencyPhone', text)}
                        maxLength={12}
                    />
                </View>

                {requiredDocuments.length > 0 && (
                    <View style={styles.section}>
                        <CustomText variant="h2" style={styles.sectionTitleFlatDocuments}>
                            Required Documents
                        </CustomText>
                        <CustomText variant="caption" style={styles.sectionSubtitle}>
                            Please upload the requirements specific to this offer.
                        </CustomText>

                        {requiredDocuments.map((doc, index) => {
                            const isUploaded = uploadedDocs[doc];
                            
                            return (
                                <View key={index} style={styles.uploadCard}>
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
                                            {doc}
                                        </CustomText>
                                    </View>

                                    <TouchableOpacity 
                                        style={[
                                            styles.uploadBtn, 
                                            isUploaded && styles.uploadedBtn
                                        ]}
                                        onPress={() => handleSimulateUpload(doc)}
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
                        })}
                    </View>
                )}
            </ScrollView>

            <StickyFooter 
                title={isSubmitting ? "Reserving..." : "Reserve"} 
                onPress={() => onContinue({ hikerDetails: formData, uploadedDocs })} 
                isDisabled={!isFormValid() || isSubmitting}
            />

            <ConfirmationModal 
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onConfirm={confirmEditPhone}
                title="Change Phone Number?"
                message="Are you sure you want to use a different phone number for this booking? Please ensure it is an active number so your guide can easily reach you on the day of the hike."
                confirmText="Edit Number"
                cancelText="Cancel"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND, 
        paddingHorizontal: 16, 
        paddingTop: 0, 
        paddingBottom: 16 
    },
    scrollContent: { 
        paddingBottom: 80 
    },
    section: { 
        marginBottom: 0 
    },
    
    sectionHeaderRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        paddingTop: 16 
    },
    sectionTitleFlat: { 
        marginBottom: 0 
    },
    sectionTitleFlatDocuments: { 
        marginBottom: 8, 
        paddingTop: 16 
    },
    sectionTitle: { 
        paddingTop: 16, 
        paddingHorizontal: 0, 
        marginBottom: 16 
    },
    sectionSubtitle: { 
        marginBottom: 16, 
        color: Colors.TEXT_SECONDARY 
    },
    
    headerActionBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 16, 
        gap: 6 
    },
    headerActionBtnText: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold' 
    },
    headerResetBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 16, 
        gap: 6 
    },
    headerResetBtnText: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold' 
    },

    lockedInputContainer: { 
        opacity: 0.6, 
        marginBottom: 8 
    },
    inputSpacing: { 
        marginBottom: 16 
    },

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

export default DetailsScreen;