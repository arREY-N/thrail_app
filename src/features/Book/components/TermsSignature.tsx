/**
 * @file TermsSignature.tsx
 * @description Digital terms signature input component validating the hiker or legal guardian's name against terms of service and liability waiver.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { useToast } from '@/src/components/Toast/Toast';
import LegalTermsModal, { LegalTabType } from '@/src/components/LegalTermsModal';
import { Colors } from '@/src/constants/colors';

export interface TermsSignatureProps {
    expectedName: string;
    isMinor?: boolean;
    minorName?: string;
    showTitle?: boolean;
    /** If true, user must read and acknowledge policies before typing signature. Default: true */
    requireReadToAgree?: boolean;
    onValidChange: (isValid: boolean) => void;
    onTermsPress?: () => void;
    onPrivacyPress?: () => void;
    onBookingTermsPress?: () => void;
    /** Callback to display toast message on parent screen */
    onShowToast?: (message: string) => void;
}

/**
 * TermsSignature — Renders terms and privacy agreement with gated policy reading,
 * name-based signature input, and interactive feedback.
 */
const TermsSignature = ({ 
    expectedName, 
    isMinor = false, 
    minorName = '',
    showTitle = true,
    requireReadToAgree = true,
    onValidChange,
    onTermsPress,
    onPrivacyPress,
    onBookingTermsPress,
    onShowToast,
}: TermsSignatureProps): React.JSX.Element => {
    const { showToast } = useToast();
    const [signature, setSignature] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTab, setModalTab] = useState<LegalTabType>('terms');
    const [hasReadPolicies, setHasReadPolicies] = useState(!requireReadToAgree);

    const isPoliciesAcknowledged = !requireReadToAgree || hasReadPolicies;

    const cleanExpected = (expectedName || '').trim();
    const isSignatureMatched = Boolean(
        cleanExpected.length > 0 && 
        signature.trim().toLowerCase() === cleanExpected.toLowerCase()
    );

    const isFullyValid = isPoliciesAcknowledged && isSignatureMatched;

    useEffect(() => {
        onValidChange(isFullyValid);
    }, [isFullyValid, onValidChange]);

    const handleOpenModal = (tab: LegalTabType) => {
        setModalTab(tab);
        setModalVisible(true);
    };

    const handleLockedInputPress = () => {
        handleOpenModal('terms');
    };

    const handleModalDismissWithStatus = (status: { readCount: number; hasReadAll: boolean }) => {
        if (isPoliciesAcknowledged) return;
        if (status.hasReadAll) {
            const msg = "All policies reviewed! Tap 'I Understand & Agree' at the bottom to unlock signature.";
            if (onShowToast) {
                onShowToast(msg);
            } else {
                showToast.info(msg);
            }
        }
    };

    const hasExpectedName = cleanExpected.length > 0;
    const isInputEditable = isPoliciesAcknowledged;

    return (
        <View style={styles.container}>
            {showTitle && (
                <CustomText variant="h2" style={styles.title}>
                    Terms & Conditions
                </CustomText>
            )}
            
            <CustomText variant="body" style={styles.description}>
                {isMinor ? (
                    <CustomText style={styles.description}>
                        By typing your full name below, you declare under penalty of perjury that you are the legal parent or guardian of <CustomText style={styles.boldText}>{minorName || 'this minor'}</CustomText>, and you accept full legal liability for their participation. This confirms you agree to the Thrail{' '}
                    </CustomText>
                ) : (
                    <CustomText style={styles.description}>
                        By typing your full name below, you are providing a digital signature. This confirms that you agree to the Thrail{' '}
                    </CustomText>
                )}
                
                <CustomText 
                    style={styles.linkText} 
                    onPress={() => handleOpenModal('terms')}
                >
                    Terms of Service
                </CustomText>
                <CustomText style={styles.description}>, </CustomText>
                <CustomText 
                    style={styles.linkText} 
                    onPress={() => handleOpenModal('privacy')}
                >
                    Privacy Policy
                </CustomText>
                <CustomText style={styles.description}>, and our </CustomText>
                <CustomText 
                    style={styles.linkText} 
                    onPress={() => handleOpenModal('booking')}
                >
                    Booking & Cancellation Policies
                </CustomText>
                <CustomText style={styles.description}>.</CustomText>
            </CustomText>

            {/* In default unacknowledged state, render concise reminder box above input */}
            {!isPoliciesAcknowledged && (
                <View style={styles.instructionBox}>
                    <View style={styles.iconContainer}>
                        <CustomIcon 
                            library="Feather" 
                            name="file-text"
                            size={20} 
                            color={Colors.PRIMARY} 
                        />
                    </View>
                    <View style={styles.instructionTextWrapper}>
                        <CustomText style={styles.instructionGuidanceText}>
                            Please read and agree to all 3 legal policies above to unlock digital signature.
                        </CustomText>
                    </View>
                </View>
            )}

            {/* If acknowledged, render verified name instruction card above input */}
            {isPoliciesAcknowledged && (
                <View style={[styles.instructionBox, styles.instructionBoxVerified, !hasExpectedName && isMinor && styles.instructionBoxWarning]}>
                    <View style={[styles.iconContainer, styles.iconContainerVerified, !hasExpectedName && isMinor && styles.iconContainerWarning]}>
                        <CustomIcon 
                            library="Feather" 
                            name="check-circle"
                            size={22} 
                            color={Colors.STATUS_APPROVED_TEXT} 
                        />
                    </View>
                    <View style={styles.instructionTextWrapper}>
                        <CustomText variant="caption" style={[styles.instructionLabel, !hasExpectedName && isMinor && styles.instructionLabelWarning]}>
                            {isMinor 
                                ? (hasExpectedName ? "Parent/Guardian Signature (Type name exactly):" : "Guardian Signature Required:") 
                                : "Type your name exactly as registered:"
                            }
                        </CustomText>
                        <CustomText style={[styles.boldName, !hasExpectedName && isMinor && styles.boldNameMissing]}>
                            {hasExpectedName ? cleanExpected : (isMinor ? 'Please enter Guardian Name in Contact Details above' : '')}
                        </CustomText>
                    </View>
                </View>
            )}

            {/* Signature Input with Locked Interaction */}
            <TouchableOpacity
                activeOpacity={isInputEditable ? 1 : 0.75}
                onPress={!isInputEditable ? handleLockedInputPress : undefined}
                style={styles.inputWrapper}
            >
                <CustomTextInput
                    placeholder={
                        !isInputEditable
                            ? "Tap to review policies and unlock signature"
                            : (isMinor ? "Parent/Guardian Full Name" : "Digital Signature (Full Name)")
                    }
                    value={signature}
                    onChangeText={setSignature}
                    autoCapitalize="words"
                    editable={isInputEditable}
                    icon={!isInputEditable ? "lock" : (isSignatureMatched ? "check-circle" : "edit-2")}
                    iconLibrary="Feather"
                    iconColor={!isInputEditable ? Colors.TEXT_SECONDARY : (isSignatureMatched ? Colors.SUCCESS : undefined)}
                    style={styles.inputSpacing}
                    pointerEvents={isInputEditable ? "auto" : "none"}
                />
            </TouchableOpacity>

            <LegalTermsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialTab={modalTab}
                requireReadToAgree={requireReadToAgree}
                isAlreadyAcknowledged={isPoliciesAcknowledged}
                onDismissWithStatus={handleModalDismissWithStatus}
                onAcknowledgeAll={() => {
                    setHasReadPolicies(true);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    title: {
        marginBottom: 8,
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        lineHeight: 18,
    },
    boldText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    linkText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
    instructionBoxVerified: {
        borderColor: Colors.STATUS_APPROVED_BORDER,
        backgroundColor: Colors.BACKGROUND,
    },
    iconContainerVerified: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    instructionBox: {
        backgroundColor: Colors.BACKGROUND,
        padding: 14,
        borderRadius: 14,
        marginVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    instructionBoxWarning: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.STATUS_CANCELLED_BORDER,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconContainerWarning: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    instructionTextWrapper: {
        flex: 1,
        flexDirection: 'column',
    },
    instructionLabel: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    instructionLabelWarning: {
        color: Colors.STATUS_CANCELLED_TEXT,
        fontWeight: '600',
    },
    boldName: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 18,
        letterSpacing: 0.3,
    },
    boldNameMissing: {
        color: Colors.STATUS_CANCELLED_TEXT,
        fontStyle: 'italic',
        fontSize: 13,
        fontWeight: 'normal',
    },
    instructionGuidanceText: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    inputWrapper: {
        width: '100%',
    },
    inputSpacing: {
        marginBottom: 0, 
    },
});

export default TermsSignature;