/**
 * @file DetailsScreen.tsx
 * @description Screen component for hiker contact details, document upload requirements, and digital signature for booking reservations.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import DocumentUploadCard, { getDocSubtitle, getStrictDocKey } from '@/src/components/DocumentUploadCard';
import EmergencySetupModal, { UserSearchResult } from '@/src/components/EmergencyModal';
import { useToast } from '@/src/components/Toast/Toast';

import { cleanPhoneNumber, formatLocalPhoneNumber } from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { calculateVerificationValidity, formatVerificationExpiry } from '@/src/core/flows/PhoneVerificationFlow';
import { Offer } from '@/src/core/models/Offer/Offer';
import { IEmergencyContact, useAuthStore } from "@/src/core/models/User/User";
import { toDateOrNull } from '@/src/core/utility/date';
import TermsSignature from '@/src/features/Book/components/TermsSignature';
import { checkIfMinor } from '@/src/utils/dateFormatter';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface HikerBookingDetails {
    phone: string;
    emergencyContact: IEmergencyContact;
}

export interface DetailsScreenProps {
    selectedOffer?: Offer | { documents?: string[]; [key: string]: unknown } | null;
    savedDetails?: HikerBookingDetails | null;
    savedDocs?: Record<string, string> | null;
    onContinue: (payload: { hikerDetails: HikerBookingDetails; uploadedDocs: Record<string, string> }) => void;
    onProgressChange?: (hasProgress: boolean) => void;
    isSubmitting?: boolean;
    onSearchUser?: (email: string) => Promise<UserSearchResult[]>;
}

const DetailsScreen: React.FC<DetailsScreenProps> = ({ 
    selectedOffer, 
    savedDetails, 
    savedDocs, 
    onContinue, 
    onProgressChange,
    isSubmitting,
    onSearchUser,
}) => {
    const profile = useAuthStore(s => s.profile);
    const requiredDocuments = selectedOffer?.documents || [];

    const profileFullName = `${profile?.firstname || ''} ${profile?.lastname || ''}`.trim();
    const profilePhone = formatLocalPhoneNumber(cleanPhoneNumber(profile?.phoneNumber || ''));

    const getInitialData = (): HikerBookingDetails => {
        if (savedDetails) return savedDetails;
        return {
            phone: profilePhone,
            emergencyContact: {
                name: profile?.emergencyContact?.name || '',
                contactNumber: profile?.emergencyContact?.contactNumber ? formatLocalPhoneNumber(cleanPhoneNumber(profile.emergencyContact.contactNumber)) : '',
                email: profile?.emergencyContact?.email || '',
                userId: profile?.emergencyContact?.userId || '',
                phoneVerifiedAt: toDateOrNull(profile?.emergencyContact?.phoneVerifiedAt),
            },
        };
    };

    const getInitialUploadedDocs = (): Record<string, string> => {
        const initial: Record<string, string> = { ...(savedDocs || {}) };
        if (!initial['Medical Certificate'] && profile?.medicalProfile?.clearanceUri) {
            initial['Medical Certificate'] = profile.medicalProfile.clearanceUri;
        }
        return initial;
    };

    const { showToast } = useToast();
    const [formData, setFormData] = useState<HikerBookingDetails>(getInitialData());
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>(getInitialUploadedDocs());
    const [isSignatureValid, setIsSignatureValid] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [showUnifiedModal, setShowUnifiedModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const isConfirmingRef = useRef(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const isMinor = checkIfMinor(profile?.birthday);

    const activeDocuments = [...requiredDocuments];
    if (isMinor && !activeDocuments.includes('Parent/Guardian Valid ID')) {
        activeDocuments.push('Parent/Guardian Valid ID');
    }

    const prevDocsLengthRef = useRef(activeDocuments.length);
    useEffect(() => {
        if (prevDocsLengthRef.current !== activeDocuments.length) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            prevDocsLengthRef.current = activeDocuments.length;
        }
    }, [activeDocuments.length]);

    const isPhoneSet = !!formData.phone && cleanPhoneNumber(formData.phone).length >= 10;
    const isEmergencySet = !!formData.emergencyContact.name && !!formData.emergencyContact.contactNumber && cleanPhoneNumber(formData.emergencyContact.contactNumber).length >= 10;
    const isContactComplete = isPhoneSet && isEmergencySet;

    const isUserPhoneMatchingProfile = cleanPhoneNumber(formData.phone) === cleanPhoneNumber(profile?.phoneNumber || '');
    const hikerPhoneVerifiedAt = isUserPhoneMatchingProfile ? profile?.phoneVerifiedAt : null;
    const hikerPhoneValidity = calculateVerificationValidity(hikerPhoneVerifiedAt);
    const hikerExpiryText = formatVerificationExpiry(hikerPhoneVerifiedAt);

    const isEmergencyPhoneMatchingProfile = cleanPhoneNumber(formData.emergencyContact.contactNumber) === cleanPhoneNumber(profile?.emergencyContact?.contactNumber || '');
    const emergencyPhoneVerifiedAt = formData.emergencyContact?.phoneVerifiedAt || (
        isEmergencyPhoneMatchingProfile
            ? profile?.emergencyContact?.phoneVerifiedAt
            : null
    );
    const emergencyValidity = calculateVerificationValidity(emergencyPhoneVerifiedAt);
    const emergencyExpiryText = formatVerificationExpiry(emergencyPhoneVerifiedAt);

    const uploadedCount = activeDocuments.filter(doc => !!uploadedDocs[doc]).length;
    const areAllDocsUploaded = activeDocuments.length === 0 || uploadedCount === activeDocuments.length;

    const isFormValid = isContactComplete && areAllDocsUploaded && isSignatureValid;

    useEffect(() => {
        const hasUploaded = Object.values(uploadedDocs).some(val => !!val);
        const hasProgress = hasUploaded || isSignatureValid || (isPhoneSet && formData.phone !== profilePhone) || isEmergencySet;
        onProgressChange?.(hasProgress);
    }, [uploadedDocs, isSignatureValid, isPhoneSet, isEmergencySet, formData.phone, profilePhone, onProgressChange]);

    const handleReservePress = () => {
        if (isSubmitting || isConfirmingRef.current) return;

        if (!isPhoneSet) {
            setHasAttemptedSubmit(true);
            showToast.error("Please enter your contact phone number to proceed.", {
                onHide: () => setHasAttemptedSubmit(false),
            });
            return;
        }

        if (!isEmergencySet) {
            setHasAttemptedSubmit(true);
            showToast.error(
                isMinor 
                    ? "Parent / Guardian emergency contact is required to proceed." 
                    : "Emergency contact (name & phone number) is required to proceed.",
                { onHide: () => setHasAttemptedSubmit(false) }
            );
            return;
        }

        if (!areAllDocsUploaded) {
            setHasAttemptedSubmit(true);
            const remaining = activeDocuments.length - uploadedCount;
            showToast.error(`Please upload all required documents (${remaining} remaining).`, {
                onHide: () => setHasAttemptedSubmit(false),
            });
            return;
        }

        if (!isSignatureValid) {
            setHasAttemptedSubmit(true);
            showToast.error(
                isMinor
                    ? "Parent / Guardian signature and policy review are required to proceed."
                    : "Please review all policies and type your full name in the signature field to reserve.",
                { onHide: () => setHasAttemptedSubmit(false) }
            );
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmReservation = () => {
        if (isConfirmingRef.current || isSubmitting) return;
        isConfirmingRef.current = true;
        setShowConfirmModal(false);
        onContinue({ hikerDetails: formData, uploadedDocs });
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.constrainer}>
                    
                    {/* Section 1: Contact Details */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <CustomText variant="h2" style={styles.sectionTitleFlat}>Contact Details</CustomText>
                        </View>

                        <View style={styles.premiumCard}>
                            {/* Hiker Contact Row */}
                            <View style={styles.infoRow}>
                                <View style={[styles.iconCircle, { backgroundColor: isPhoneSet ? Colors.STATUS_APPROVED_BG : Colors.STATUS_CANCELLED_BG }]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="user" 
                                        size={16} 
                                        color={isPhoneSet ? Colors.STATUS_APPROVED_TEXT : Colors.STATUS_CANCELLED_TEXT} 
                                    />
                                </View>
                                <View style={styles.infoCol}>
                                    <CustomText variant="caption" style={styles.infoLabel}>Hiker Contact</CustomText>
                                    <CustomText style={styles.infoName}>{profileFullName}</CustomText>
                                    <CustomText style={formData.phone ? styles.infoDesc : styles.infoMissing}>
                                        {formData.phone || 'Phone number not set'}
                                    </CustomText>
                                </View>
                                <View style={styles.rowRightBadge}>
                                    {!formData.phone ? (
                                        <View style={styles.missingPill}>
                                            <CustomText style={styles.missingPillText}>Missing</CustomText>
                                        </View>
                                    ) : hikerPhoneValidity.status === 'verified' ? (
                                        <View style={styles.verifiedPillContainer}>
                                            <View style={styles.verifiedPill}>
                                                <CustomIcon library="Feather" name="check" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                                <CustomText style={styles.verifiedPillText}>Verified</CustomText>
                                            </View>
                                            {hikerExpiryText ? (
                                                <CustomText style={styles.validityCountdownText}>
                                                    {hikerExpiryText}
                                                </CustomText>
                                            ) : null}
                                        </View>
                                    ) : hikerPhoneValidity.status === 'expired' ? (
                                        <View style={styles.expiredPill}>
                                            <CustomIcon library="Feather" name="alert-octagon" size={10} color={Colors.VERIFICATION_EXPIRED_TEXT} />
                                            <CustomText style={styles.expiredPillText}>Expired</CustomText>
                                        </View>
                                    ) : (
                                        <View style={styles.unverifiedPill}>
                                            <CustomIcon library="Feather" name="info" size={10} color={Colors.TEXT_SECONDARY} />
                                            <CustomText style={styles.unverifiedPillText}>Unverified</CustomText>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.verticalConnector} />

                            {/* Emergency Contact Row */}
                            <View style={styles.infoRow}>
                                <View style={[styles.iconCircle, { backgroundColor: isEmergencySet ? Colors.STATUS_APPROVED_BG : Colors.STATUS_CANCELLED_BG }]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="phone-call" 
                                        size={16} 
                                        color={isEmergencySet ? Colors.STATUS_APPROVED_TEXT : Colors.STATUS_CANCELLED_TEXT} 
                                    />
                                </View>
                                <View style={styles.infoCol}>
                                    <CustomText variant="caption" style={styles.infoLabel}>
                                        {isMinor ? "Guardian Contact" : "Emergency Contact"}
                                    </CustomText>
                                    <CustomText style={[styles.infoName, !formData.emergencyContact.name && styles.infoNameMissing]}>
                                        {formData.emergencyContact.name || 'Not set'}
                                    </CustomText>
                                    <CustomText style={formData.emergencyContact.contactNumber ? styles.infoDesc : styles.infoMissing}>
                                        {formData.emergencyContact.contactNumber 
                                            ? formData.emergencyContact.contactNumber
                                            : 'No contact number'
                                        }
                                    </CustomText>
                                </View>
                                <View style={styles.rowRightBadge}>
                                    {!formData.emergencyContact.contactNumber ? (
                                        <View style={styles.missingPill}>
                                            <CustomText style={styles.missingPillText}>Required</CustomText>
                                        </View>
                                    ) : emergencyValidity.status === 'verified' ? (
                                        <View style={styles.verifiedPillContainer}>
                                            <View style={styles.verifiedPill}>
                                                <CustomIcon library="Feather" name="check" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                                <CustomText style={styles.verifiedPillText}>Verified</CustomText>
                                            </View>
                                            {emergencyExpiryText ? (
                                                <CustomText style={styles.validityCountdownText}>
                                                    {emergencyExpiryText}
                                                </CustomText>
                                            ) : null}
                                        </View>
                                    ) : emergencyValidity.status === 'expired' ? (
                                        <View style={styles.expiredPill}>
                                            <CustomIcon library="Feather" name="alert-octagon" size={10} color={Colors.VERIFICATION_EXPIRED_TEXT} />
                                            <CustomText style={styles.expiredPillText}>Expired</CustomText>
                                        </View>
                                    ) : (formData.emergencyContact.userId || profile?.emergencyContact?.userId) ? (
                                        <View style={styles.linkedBadge}>
                                            <CustomIcon library="Feather" name="link" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                                            <CustomText style={styles.linkedText}>Linked</CustomText>
                                        </View>
                                    ) : (
                                        <View style={styles.unverifiedPill}>
                                            <CustomText style={styles.unverifiedPillText}>Unverified</CustomText>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Informative Safety Notice */}
                            <View style={styles.verificationNoteBox}>
                                <CustomIcon library="Feather" name="shield" size={13} color={Colors.PRIMARY} />
                                <CustomText style={styles.verificationNoteText}>
                                    Tour organizers verify your contact numbers via a quick safety call upon reviewing your reservation.
                                </CustomText>
                            </View>

                            {/* Divider & Action Button inside Card */}
                            <View style={styles.cardDivider} />

                            {/* Edit / Setup Action Button */}
                            <TouchableOpacity 
                                style={styles.cardEditButton} 
                                onPress={() => setShowUnifiedModal(true)}
                                activeOpacity={0.7}
                            >
                                <CustomIcon library="Feather" name={isContactComplete ? "edit-3" : "plus-circle"} size={14} color={Colors.PRIMARY} />
                                <CustomText style={styles.cardEditButtonText}>
                                    {isContactComplete ? "Edit Contact Details" : "Set Up Contact Details"}
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Section 2: Required Documents (Unified Single Card) */}
                    {activeDocuments.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <CustomText variant="h2" style={styles.sectionTitleFlat}>
                                    Required Documents
                                </CustomText>
                            </View>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Please upload requirements specific to this reservation.
                            </CustomText>

                            <View style={styles.documentsContainerCard}>
                                {activeDocuments.map((doc, index) => (
                                    <DocumentUploadCard 
                                        key={index} 
                                        docName={doc} 
                                        docKey={getStrictDocKey(doc)} 
                                        subtitle={getDocSubtitle(doc)}
                                        variant="row"
                                        showDivider={index < activeDocuments.length - 1}
                                        isUploaded={uploadedDocs[doc]} 
                                        onUploadSuccess={(url) => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setUploadedDocs(prev => ({ ...prev, [doc]: url }));
                                        }} 
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Section 3: Terms and Conditions */}
                    <View style={styles.lastsection}>
                        <TermsSignature 
                            isMinor={isMinor} 
                            minorName={profileFullName} 
                            expectedName={isMinor ? formData.emergencyContact.name || '' : profileFullName} 
                            showTitle={true}
                            requireReadToAgree={true}
                            onValidChange={(valid) => {
                                setIsSignatureValid(valid);
                            }}
                            onShowToast={(message) => {
                                showToast.info(message);
                            }}
                            onSignatureFocus={() => {
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                }, 150);
                            }}
                        />
                    </View>

                </View>
            </ScrollView>

            <CustomStickyFooter 
                enableToastDock={true}
                primaryButton={{
                    title: isSubmitting ? "Reserving..." : "Reserve",
                    disabled: isSubmitting,
                    isLoading: isSubmitting,
                    validationState: isFormValid ? 'valid' : (hasAttemptedSubmit ? 'error' : 'idle'),
                    onPress: handleReservePress,
                }}
            />

            <EmergencySetupModal 
                visible={showUnifiedModal}
                onClose={() => setShowUnifiedModal(false)}
                mode="unified"
                initialUserPhone={formData.phone}
                initialEmergencyContact={formData.emergencyContact}
                currentUserProfile={profile}
                onSearchUser={onSearchUser}
                onSaveUnifiedContacts={(data) => {
                    setFormData({
                        phone: formatLocalPhoneNumber(data.phone),
                        emergencyContact: {
                            ...data.emergencyContact,
                            contactNumber: formatLocalPhoneNumber(data.emergencyContact.contactNumber),
                        },
                    });
                }}
            />

            {/* Confirmation Modal before submitting reservation */}
            <ConfirmationModal 
                visible={showConfirmModal}
                onClose={() => {
                    isConfirmingRef.current = false;
                    setShowConfirmModal(false);
                }}
                onConfirm={handleConfirmReservation}
                title="Confirm Reservation"
                message="Are you sure you want to proceed with this reservation? Please ensure all contact details and uploaded documents are accurate."
                confirmText="Yes, Reserve"
                cancelText="Review Details"
                isLoading={isSubmitting}
                iconName="calendar"
                iconLibrary="Feather"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND,
    },
    constrainer: { 
        width: '100%', 
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center', 
        paddingHorizontal: 16, 
        paddingTop: 16, 
        paddingBottom: 24,
    },
    scrollContent: { 
        paddingBottom: 100,
    },
    section: { 
        marginBottom: 24,
    },
    lastsection: { 
        marginBottom: 0,
    },
    sectionHeaderRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    sectionTitleFlat: { 
        marginBottom: 0,
    },
    sectionSubtitle: { 
        marginBottom: 16, 
        color: Colors.TEXT_SECONDARY,
    },
    
    // Card Standards (Law of Similarity)
    premiumCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT,     
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }), 
    },
    infoRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
    },
    nameBadgeRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
    },
    iconCircle: { 
        width: 34, 
        height: 34, 
        borderRadius: 999, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    infoCol: { 
        marginLeft: 12, 
        flex: 1,
    },
    infoLabel: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 2, 
        fontSize: 11,
    },
    infoName: { 
        fontSize: 15, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY,
    },
    infoNameMissing: { 
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    infoDesc: { 
        fontSize: 13, 
        color: Colors.TEXT_SECONDARY, 
        marginTop: 2,
    },
    infoMissing: { 
        fontSize: 12, 
        color: Colors.STATUS_CANCELLED_TEXT, 
        marginTop: 2, 
        fontWeight: '600',
    },
    verticalConnector: { 
        width: 2, 
        height: 16, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginLeft: 16, 
        marginVertical: 2,
    },
    linkedBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 8, 
        gap: 4, 
        borderWidth: 1, 
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    linkedText: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        color: Colors.STATUS_APPROVED_TEXT,
    },

    rowRightBadge: {
        marginLeft: 10,
        alignSelf: 'flex-start',
        marginTop: 16,
    },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    verifiedPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    verifiedPillContainer: {
        alignItems: 'flex-end',
    },
    validityCountdownText: {
        fontSize: 10,
        color: Colors.PRIMARY,
        fontWeight: '600',
        marginTop: 4,
    },
    expiredPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.VERIFICATION_EXPIRED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.VERIFICATION_EXPIRED_BORDER,
    },
    expiredPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.VERIFICATION_EXPIRED_TEXT,
    },
    unverifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    unverifiedPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    missingPill: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_BORDER,
    },
    missingPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    verificationNoteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 14,
        gap: 8,
    },
    verificationNoteText: {
        fontSize: 11,
        color: Colors.PRIMARY,
        fontWeight: '500',
        flex: 1,
        lineHeight: 15,
    },
    smsBadge: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    smsText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },

    // Unified Documents Card Container
    documentsContainerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }),
    },

    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginTop: 16,
        marginBottom: 12,
    },
    cardEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        gap: 6,
    },
    cardEditButtonText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 13,
    },
});

export default DetailsScreen;
