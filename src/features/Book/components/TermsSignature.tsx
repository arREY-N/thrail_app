/**
 * @file TermsSignature.tsx
 * @description Digital terms signature input component validating the hiker or legal guardian's name against terms of service and liability waiver.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import LegalTermsModal, { LegalTabType } from '@/src/components/LegalTermsModal';
import { Colors } from '@/src/constants/colors';

export interface TermsSignatureProps {
    expectedName: string;
    isMinor?: boolean;
    minorName?: string;
    showTitle?: boolean;
    onValidChange: (isValid: boolean) => void;
    onTermsPress?: () => void;
    onPrivacyPress?: () => void;
    onBookingTermsPress?: () => void;
}

/**
 * TermsSignature — Renders terms and privacy agreement with a name-based signature input.
 *
 * @param {TermsSignatureProps} props - Component props
 * @returns {React.JSX.Element} The rendered component
 */
const TermsSignature = ({ 
    expectedName, 
    isMinor = false, 
    minorName = '',
    showTitle = true,
    onValidChange,
    onTermsPress,
    onPrivacyPress,
    onBookingTermsPress,
}: TermsSignatureProps): React.JSX.Element => {
    const [signature, setSignature] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTab, setModalTab] = useState<LegalTabType>('terms');

    const cleanExpected = (expectedName || '').trim();
    const isSignatureMatched = Boolean(
        cleanExpected.length > 0 && 
        signature.trim().toLowerCase() === cleanExpected.toLowerCase()
    );

    useEffect(() => {
        onValidChange(isSignatureMatched);
    }, [isSignatureMatched, onValidChange]);

    const handleOpenModal = (tab: LegalTabType, customCallback?: () => void) => {
        if (customCallback) {
            customCallback();
            return;
        }
        setModalTab(tab);
        setModalVisible(true);
    };

    const hasExpectedName = cleanExpected.length > 0;

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
                    onPress={() => handleOpenModal('terms', onTermsPress)}
                >
                    Terms of Service
                </CustomText>
                <CustomText style={styles.description}>, </CustomText>
                <CustomText 
                    style={styles.linkText} 
                    onPress={() => handleOpenModal('privacy', onPrivacyPress)}
                >
                    Privacy Policy
                </CustomText>
                <CustomText style={styles.description}>, and our </CustomText>
                <CustomText 
                    style={styles.linkText} 
                    onPress={() => handleOpenModal('booking', onBookingTermsPress)}
                >
                    Booking & Cancellation Policies
                </CustomText>
                <CustomText style={styles.description}>.</CustomText>
            </CustomText>
            
            <View style={[styles.instructionBox, !hasExpectedName && isMinor && styles.instructionBoxWarning]}>
                <View style={[styles.iconContainer, !hasExpectedName && isMinor && styles.iconContainerWarning]}>
                    <CustomIcon 
                        library="Feather" 
                        name={!hasExpectedName && isMinor ? "alert-circle" : (isMinor ? "shield" : "info")}
                        size={18} 
                        color={!hasExpectedName && isMinor ? Colors.STATUS_CANCELLED_TEXT : Colors.PRIMARY} 
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

            <CustomTextInput
                placeholder={isMinor ? "Parent/Guardian Full Name" : "Digital Signature (Full Name)"}
                value={signature}
                onChangeText={setSignature}
                autoCapitalize="words"
                icon={isSignatureMatched ? "check-circle" : "edit-2"}
                iconLibrary="Feather"
                iconColor={isSignatureMatched ? Colors.SUCCESS : undefined}
                style={styles.inputSpacing}
            />

            <LegalTermsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialTab={modalTab}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    title: {
        // fontSize: 20,
        // fontWeight: 'bold',
        // color: Colors.TEXT_PRIMARY,
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
    
    instructionBox: {
        backgroundColor: Colors.BACKGROUND,
        padding: 12,
        borderRadius: 12,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
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
        fontSize: 15,
        letterSpacing: 0.3,
    },
    boldNameMissing: {
        color: Colors.STATUS_CANCELLED_TEXT,
        fontStyle: 'italic',
        fontSize: 13,
        fontWeight: 'normal',
    },
    
    inputSpacing: {
        marginBottom: 0, 
    },
});

export default TermsSignature;