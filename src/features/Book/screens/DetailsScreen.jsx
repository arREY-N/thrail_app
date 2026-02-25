import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';

import StickyFooter from '@/src/features/Book/components/StickyFooter';

const DetailsScreen = ({ selectedOffer, savedDetails, savedDocs, onContinue }) => {
    
    const [formData, setFormData] = useState(savedDetails || {
        fullName: '',
        phone: '',
        emergencyName: '',
        emergencyPhone: '',
    });

    const [uploadedDocs, setUploadedDocs] = useState(savedDocs || {});

    const requiredDocuments = selectedOffer?.documents || [];

    useEffect(() => {
        setFormData(savedDetails || {
            fullName: '',
            phone: '',
            emergencyName: '',
            emergencyPhone: '',
        });
        setUploadedDocs(savedDocs || {});
    }, [savedDetails, savedDocs]);

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
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Hiker Information
                    </CustomText>
                    
                    <CustomTextInput 
                        label="Full Name"
                        placeholder="Juan Dela Cruz"
                        value={formData.fullName}
                        onChangeText={(text) => handleInputChange('fullName', text)}
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
                    />
                </View>

                <View style={styles.section}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
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
                        <CustomText variant="h2" style={styles.sectionTitle}>
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
                title="Continue to Payment" 
                onPress={() => onContinue({ hikerDetails: formData, uploadedDocs })} 
                isDisabled={!isFormValid()}
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
    sectionTitle: {
        paddingTop: 16,
        paddingHorizontal: 0,
        marginBottom: 16,
    },
    sectionSubtitle: {
        marginBottom: 16,
        marginTop: -12,
        color: Colors.TEXT_SECONDARY,
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