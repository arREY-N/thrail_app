import React, { useEffect, useState } from 'react';
import { Platform,  ScrollView, StyleSheet, TouchableOpacity, View  } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import EmergencySetupModal from '@/src/components/EmergencyModal';

import { cleanPhoneNumber, formatLocalPhoneNumber } from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import TermsSignature from '@/src/features/Book/components/TermsSignature';
import { checkIfMinor } from '@/src/utils/dateFormatter';

export interface HikerDetails {
    phone?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    [key: string]: unknown;
}

export interface DetailsScreenProps {
    selectedOffer?: { documents?: string[]; [key: string]: unknown } | null;
    savedDetails?: HikerDetails | null;
    savedDocs?: Record<string, string> | null;
    onContinue: (payload: { hikerDetails: HikerDetails; uploadedDocs: Record<string, string> }) => void;
    isSubmitting?: boolean;
    onTermsPress?: () => void;
    onPrivacyPress?: () => void;
}

const getStrictDocKey = (docName: string) => {
    if (!docName) return 'validId';
    const lower = docName.toLowerCase();
    if (lower.includes('medical') || lower.includes('cert')) return 'medicalCertificate';
    if (lower.includes('bir')) return 'bir';
    if (lower.includes('dti')) return 'dti';
    if (lower.includes('denr')) return 'denr';
    if (lower.includes('parent') || lower.includes('guardian')) return 'guardianId'; 
    return 'validId';
};

const DetailsScreen: React.FC<DetailsScreenProps> = ({ 
    selectedOffer, 
    savedDetails, 
    savedDocs, 
    onContinue, 
    isSubmitting, 
    onTermsPress, 
    onPrivacyPress 
}) => {
    const { profile } = useAuthStore();
    const requiredDocuments = selectedOffer?.documents || [];

    const profileFullName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim();
    const profilePhone = formatLocalPhoneNumber(cleanPhoneNumber(profile?.phoneNumber || ''));

    const getInitialData = (): HikerDetails => {
        if (savedDetails) return savedDetails;
        return {
            phone: profilePhone,
            emergencyName: profile?.emergencyContact?.name || '',
            emergencyPhone: profile?.emergencyContact?.contactNumber || '',
        };
    };

    const [formData, setFormData] = useState<HikerDetails>(getInitialData());
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>(savedDocs || {});
    const [isSignatureValid, setIsSignatureValid] = useState(false);
    const [isMinor, setIsMinor] = useState(false);
    const [showUnifiedModal, setShowUnifiedModal] = useState(false);

    useEffect(() => { setIsMinor(checkIfMinor(profile?.birthday)); }, [profile?.birthday]);

    const activeDocuments = [...requiredDocuments];
    if (isMinor && !activeDocuments.includes('Parent/Guardian Valid ID')) {
        activeDocuments.push('Parent/Guardian Valid ID');
    }

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            emergencyName: profile?.emergencyContact?.name || '',
            emergencyPhone: profile?.emergencyContact?.contactNumber || '',
        }));
    }, [profile?.emergencyContact]);

    const handleLocalPhoneSave = (newPhone: string) => {
        setFormData(prev => ({ ...prev, phone: formatLocalPhoneNumber(newPhone) }));
    };

    const isFormValid = () => {
        const isBasicInfoFilled = !!(formData.phone && formData.emergencyName && formData.emergencyPhone);
        const areAllDocsUploaded = activeDocuments.every(doc => !!uploadedDocs[doc]);
        return isBasicInfoFilled && areAllDocsUploaded && isSignatureValid;
    };
    
    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.constrainer}>
                    
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <CustomText variant="h2" style={styles.sectionTitleFlat}>Contact Summary</CustomText>

                            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowUnifiedModal(true)}>
                                <CustomIcon library="Feather" name="edit-3" size={14} color={Colors.PRIMARY} />
                                <CustomText style={styles.headerActionBtnText}>Edit Contacts</CustomText>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.premiumCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.iconCircle}>
                                    <CustomIcon library="Feather" name="user" size={16} color={Colors.TEXT_PRIMARY} />
                                </View>
                                <View style={styles.infoCol}>
                                    <CustomText variant="caption" style={styles.infoLabel}>Hiker Contact</CustomText>
                                    <CustomText style={styles.infoName}>{profileFullName}</CustomText>
                                    <CustomText style={styles.infoDesc}>{formData.phone || 'Not set'}</CustomText>
                                </View>
                            </View>

                            <View style={styles.verticalConnector} />

                            <View style={styles.infoRow}>
                                <View style={[styles.iconCircle, { backgroundColor: Colors.ERROR_BG }]}>
                                    <CustomIcon library="Feather" name="phone-call" size={16} color={Colors.ERROR} />
                                </View>
                                <View style={styles.infoCol}>
                                    <CustomText variant="caption" style={styles.infoLabel}>{isMinor ? "Guardian Contact" : "Emergency Contact"}</CustomText>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <CustomText style={styles.infoName}>{formData.emergencyName || 'Not set'}</CustomText>
                                        {profile?.emergencyContact?.userId ? (
                                            <View style={styles.linkedBadge}>
                                                <CustomIcon library="Feather" name="link" size={10} color={Colors.PRIMARY} />
                                                <CustomText style={styles.linkedText}>Linked</CustomText>
                                            </View>
                                        ) : null}
                                    </View>
                                    <CustomText style={styles.infoDesc}>
                                        {formData.emergencyPhone || 'No number'}
                                        {(!profile?.emergencyContact?.userId && formData.emergencyPhone) ? ' • SMS Only' : ''}
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    </View>

                    {activeDocuments.length > 0 && (
                        <View style={styles.section}>
                            <CustomText variant="h2" style={styles.sectionTitleFlatDocuments}>Required Documents</CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>Please upload the requirements specific to this offer.</CustomText>
                            {activeDocuments.map((doc, index) => (
                                <DocumentUploadCard key={index} docName={doc} docKey={getStrictDocKey(doc)} isUploaded={uploadedDocs[doc]} onUploadSuccess={(url) => setUploadedDocs(prev => ({ ...prev, [doc]: url }))} />
                            ))}
                        </View>
                    )}

                    <View style={styles.section}>
                        <TermsSignature isMinor={isMinor} minorName={profileFullName} expectedName={isMinor ? formData.emergencyName || '' : profileFullName} onValidChange={setIsSignatureValid} onTermsPress={onTermsPress || (() => {})} onPrivacyPress={onPrivacyPress || (() => {})} />
                    </View>
                </View>
            </ScrollView>

            <CustomStickyFooter 
                primaryButton={{
                    title: isSubmitting ? "Reserving..." : "Reserve",
                    disabled: !isFormValid() || isSubmitting,
                    onPress: () => onContinue({ hikerDetails: formData, uploadedDocs })
                }}
            />

            <EmergencySetupModal 
                visible={showUnifiedModal}
                onClose={() => setShowUnifiedModal(false)}
                mode="unified"
                initialUserPhone={formData.phone}
                onSaveLocalPhone={handleLocalPhoneSave}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.BACKGROUND },
    constrainer: { width: '100%', maxWidth: Layout.MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16 },
    scrollContent: { paddingBottom: 120 },
    section: { marginBottom: 24 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitleFlat: { marginBottom: 0 },
    sectionTitleFlatDocuments: { marginBottom: 4 },
    sectionSubtitle: { marginBottom: 16, color: Colors.TEXT_SECONDARY },
    
    headerActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
    headerActionBtnText: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 13 },
    
    premiumCard: { backgroundColor: Colors.WHITE, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT,     ...GlobalStyles.dropShadow(3), },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.GRAY_ULTRALIGHT, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
    infoCol: { marginLeft: 16, flex: 1 },
    infoLabel: { color: Colors.TEXT_SECONDARY, marginBottom: 2 },
    infoName: { fontSize: 16, fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    infoDesc: { fontSize: 14, color: Colors.TEXT_SECONDARY, marginTop: 4 },
    verticalConnector: { width: 2, height: 32, backgroundColor: Colors.GRAY_ULTRALIGHT, marginLeft: 17, marginVertical: 4 },
    linkedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
    linkedText: { fontSize: 10, fontWeight: 'bold', color: Colors.PRIMARY }
});

export default DetailsScreen;