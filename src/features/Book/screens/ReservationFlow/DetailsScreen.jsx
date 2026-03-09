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

const DetailsScreen = ({ selectedOffer, savedDetails, savedDocs, onContinue }) => {
    
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
            fullName: profileFullName,
            phone: profilePhone,
            emergencyName: '',
            emergencyPhone: '',
        };
    };

    const [formData, setFormData] = useState(getInitialData());
    const [uploadedDocs, setUploadedDocs] = useState(savedDocs || {});

    const [isEditingHiker, setIsEditingHiker] = useState(() => {
        if (!hasProfileData) return true; 
        if (savedDetails) {
            if (savedDetails.fullName !== profileFullName || savedDetails.phone !== profilePhone) {
                return true;
            }
        }
        return false; 
    });

    const [showEditModal, setShowEditModal] = useState(false);

    const requiredDocuments = selectedOffer?.documents || [];

    useEffect(() => {
        setFormData(getInitialData());
        setUploadedDocs(savedDocs || {});
    }, [savedDetails, savedDocs, profile]); 

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ 
            ...prev, 
            [field]: value 
        }));
    };

    const handleSimulateUpload = (docName) => {
        setUploadedDocs(prev => ({
            ...prev,
            [docName]: !prev[docName]
        }));
    };

    const handleEditPress = () => {
        setShowEditModal(true);
    };

    const confirmEdit = () => {
        setIsEditingHiker(true);
        setShowEditModal(false);
    };

    const handleResetPress = () => {
        setFormData(prev => ({
            ...prev,
            fullName: profileFullName,
            phone: profilePhone
        }));
        setIsEditingHiker(false);
    };

    const isFormValid = () => {
        const isBasicInfoFilled = formData.fullName && formData.emergencyName && formData.emergencyPhone;
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
                        <View style={styles.sectionHeaderTitles}>
                            <CustomText 
                                variant="h2" 
                                style={styles.sectionTitleFlat}
                            >
                                Hiker Information
                            </CustomText>
                            
                            {hasProfileData && !isEditingHiker ? (
                                <View style={[styles.statusBadge, styles.badgeSuccess]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check-circle" 
                                        size={14} 
                                        color={Colors.SUCCESS} 
                                    />
                                    <CustomText style={styles.badgeTextSuccess}>
                                        Auto-filled from profile
                                    </CustomText>
                                </View>
                            ) : hasProfileData && isEditingHiker ? (
                                <View style={[styles.statusBadge, styles.badgeEditing]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="info" 
                                        size={14} 
                                        color={Colors.TEXT_SECONDARY} 
                                    />
                                    <CustomText style={styles.badgeTextEditing}>
                                        Editing for this booking only
                                    </CustomText>
                                </View>
                            ) : null}
                        </View>

                        {hasProfileData && !isEditingHiker && (
                            <TouchableOpacity 
                                onPress={handleEditPress} 
                                style={styles.actionBtn}
                                activeOpacity={0.6}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="edit-2" 
                                    size={14} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText 
                                    variant="label" 
                                    style={styles.actionBtnText}
                                >
                                    Edit
                                </CustomText>
                            </TouchableOpacity>
                        )}

                        {hasProfileData && isEditingHiker && (
                            <TouchableOpacity 
                                onPress={handleResetPress} 
                                style={styles.actionBtnReset}
                                activeOpacity={0.6}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="rotate-ccw" 
                                    size={14} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                                <CustomText 
                                    variant="label" 
                                    style={styles.actionBtnTextReset}
                                >
                                    Reset
                                </CustomText>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={!isEditingHiker && styles.lockedInputContainer}>
                        <CustomTextInput 
                            label="Full Name"
                            placeholder="Juan Dela Cruz"
                            value={formData.fullName}
                            onChangeText={(text) => handleInputChange('fullName', text)}
                            editable={isEditingHiker} 
                        />

                        <CustomTextInput 
                            label="Phone Number"
                            placeholder="9XX XXX XXXX"
                            prefix="+63"
                            type="phone"
                            value={formData.phone}
                            keyboardType="number-pad"
                            onChangeText={(text) => handleInputChange('phone', text)}
                            maxLength={12}
                            editable={isEditingHiker} 
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <CustomText 
                        variant="h2" 
                        style={styles.sectionTitle}
                    >
                        Emergency Contact
                    </CustomText>
                    
                    <CustomTextInput 
                        label="Contact Name"
                        placeholder="Maria Dela Cruz"
                        value={formData.emergencyName}
                        onChangeText={(text) => handleInputChange('emergencyName', text)}
                    />

                    <CustomTextInput 
                        label="Contact Phone Number"
                        placeholder="9XX XXX XXXX"
                        prefix="+63"
                        type="phone"
                        value={formData.emergencyPhone}
                        keyboardType="number-pad"
                        onChangeText={(text) => handleInputChange('emergencyPhone', text)}
                        maxLength={12}
                    />
                </View>

                {requiredDocuments.length > 0 && (
                    <View style={styles.section}>
                        <CustomText 
                            variant="h2" 
                            style={styles.sectionTitleFlat}
                        >
                            Required Documents
                        </CustomText>
                        <CustomText 
                            variant="caption" 
                            style={styles.sectionSubtitle}
                        >
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

            {/* ONLY THIS LINE WAS CHANGED */}
            <StickyFooter 
                title="Reserve" 
                onPress={() => onContinue({ hikerDetails: formData, uploadedDocs })} 
                isDisabled={!isFormValid()}
            />

            <ConfirmationModal 
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onConfirm={confirmEdit}
                title="Edit Hiker Details?"
                message="Booking for someone else? These changes will only affect this booking, not your saved profile."
                confirmText="Yes, Edit"
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
        paddingBottom: 16,
    },
    scrollContent: {
        paddingBottom: 80, 
    },
    section: {
        marginBottom: 0, 
    },
    
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingTop: 16,
        zIndex: 10, 
    },
    sectionHeaderTitles: {
        flex: 1,
        paddingRight: 16, 
    },
    sectionTitle: {
        paddingTop: 16,
        paddingHorizontal: 0,
        marginBottom: 16,
    },
    sectionTitleFlat: {
        marginBottom: 8, 
    },
    sectionSubtitle: {
        marginBottom: 16,
        color: Colors.TEXT_SECONDARY,
    },
    
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 6,
        minHeight: 28,
    },
    badgeSuccess: {
        backgroundColor: '#E8F5E9', 
    },
    badgeTextSuccess: {
        color: Colors.SUCCESS,
        fontWeight: 'bold',
        fontSize: 13,
    },
    badgeEditing: {
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
    },
    badgeTextEditing: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 13,
        fontStyle: 'italic',
    },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        marginTop: 4,
    },
    actionBtnText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    actionBtnReset: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        marginTop: 4,
    },
    actionBtnTextReset: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },

    lockedInputContainer: {
        opacity: 0.6, 
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
        elevation: 2,
    },
    uploadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconWrapperPending: {
        backgroundColor: Colors.BACKGROUND,
    },
    iconWrapperSuccess: {
        backgroundColor: '#E8F5E9', 
    },
    docName: {
        flex: 1,
        marginRight: 8,
    },
    uploadBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.PRIMARY,
    },
    uploadedBtn: {
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.SUCCESS,
    },
    uploadBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    uploadedBtnText: {
        color: Colors.SUCCESS,
        fontWeight: 'bold',
    },
});

export default DetailsScreen;