import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';

const TermsSignature = ({ 
    expectedName, 
    isMinor = false, 
    minorName = '',
    onValidChange,
    onTermsPress,
    onPrivacyPress
}) => {
    const [signature, setSignature] = useState('');

    useEffect(() => {
        const cleanExpected = (expectedName || '').trim().toLowerCase();
        const cleanSignature = signature.trim().toLowerCase();
        
        const isValid = cleanExpected.length > 0 && cleanExpected === cleanSignature;
        onValidChange(isValid);
    }, [signature, expectedName]);

    return (
        <View style={styles.container}>
            <CustomText variant="h2" style={styles.title}>
                Terms & Conditions
            </CustomText>
            
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
                
                <CustomText style={styles.linkText} onPress={onTermsPress}>
                    Terms of Service
                </CustomText>
                <CustomText style={styles.description}>
                    , Waiver of Liability, Cancellation Policy, and our{' '}
                </CustomText>
                <CustomText style={styles.linkText} onPress={onPrivacyPress}>
                    Privacy Policy
                </CustomText>
                <CustomText style={styles.description}>.</CustomText>
            </CustomText>
            
            <View style={styles.instructionBox}>
                <View style={styles.iconContainer}>
                    <CustomIcon 
                        library="Feather" 
                        name={isMinor ? "shield" : "info"}
                        size={16} 
                        color={Colors.PRIMARY} 
                    />
                </View>
                <View style={styles.instructionTextWrapper}>
                    <CustomText variant="caption" style={styles.instructionLabel}>
                        {isMinor 
                            ? "Parent/Guardian Signature (Type your name exactly):" 
                            : "Type your name exactly as registered:"
                        }
                    </CustomText>
                    <CustomText style={styles.boldName}>
                        {expectedName || (isMinor ? '[Enter Guardian Name Above]' : '')}
                    </CustomText>
                </View>
            </View>

            <CustomTextInput
                placeholder={isMinor ? "Parent/Guardian Full Name" : "Digital Signature (Full Name)"}
                value={signature}
                onChangeText={setSignature}
                autoCapitalize="words"
                style={styles.inputSpacing}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24, 
    },
    title: {
        paddingTop: 16,
        marginBottom: 16,
        color: Colors.TEXT_PRIMARY,
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 20,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    linkText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    
    instructionBox: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: 10,
        marginTop: 2,
    },
    instructionTextWrapper: {
        flex: 1,
        flexDirection: 'column',
    },
    instructionLabel: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 4,
    },
    boldName: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        letterSpacing: 0.5,
    },
    
    inputSpacing: {
        marginBottom: 0, 
    },
});

export default TermsSignature;