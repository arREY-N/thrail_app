import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from "react-native";

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { PrivacyContent } from '@/src/features/Auth/screens/PrivacyScreen';
import { TermsContent } from '@/src/features/Auth/screens/TermsScreen';

import { Colors } from '@/src/constants/colors';

const TACScreen = ({ 
    onAcceptPress, 
    onDeclinePress,
}) => {
    const [activeTab, setActiveTab] = useState('terms');
    const [isChecked, setIsChecked] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    const handleProceed = () => {
        if (isChecked && onAcceptPress) {
            onAcceptPress();
        }
    };

    const handleDeclinePress = () => {
        setShowDeclineModal(true);
    };

    const confirmDecline = () => {
        setShowDeclineModal(false);
        if (onDeclinePress) onDeclinePress();
    };

    return (
        <ScreenWrapper backgroundColor="transparent">
            
            <View style={styles.modalOverlay}>
                
                <ConfirmationModal
                    visible={showDeclineModal}
                    title="Decline Terms?"
                    message="You must accept the Terms & Conditions to create an account. Declining will cancel the sign-up process."
                    confirmText="Decline"
                    cancelText="Cancel"
                    onConfirm={confirmDecline}
                    onClose={() => setShowDeclineModal(false)}
                />

                <View style={styles.modalCard}>
                    
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tabButton, activeTab === 'terms' && styles.activeTab]}
                            onPress={() => setActiveTab('terms')}
                            activeOpacity={0.7}
                        >
                            <CustomText style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
                                Terms & Conditions
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.tabButton, activeTab === 'privacy' && styles.activeTab]}
                            onPress={() => setActiveTab('privacy')}
                            activeOpacity={0.7}
                        >
                            <CustomText style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
                                Privacy Policy
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.documentWrapper}>
                        <View style={styles.documentBorder}>
                            {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
                        </View>
                    </View>

                    <View style={styles.agreementContainer}>
                        <TouchableOpacity 
                            style={styles.checkboxRow} 
                            onPress={() => setIsChecked(!isChecked)}
                            activeOpacity={1}
                        >
                            <View style={[styles.checkbox, isChecked && styles.checkedBox]}>
                                {isChecked && <CustomIcon library="Feather" name="check" size={14} color={Colors.WHITE} />}
                            </View>
                            
                            <CustomText variant="caption" style={styles.agreementText}>
                                I have read and accept the <CustomText style={styles.linkText}>Terms & Conditions</CustomText> and <CustomText style={styles.linkText}>Privacy Policy</CustomText>.
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                        <CustomButton 
                            title="Proceed" 
                            onPress={handleProceed}
                            variant="primary"
                            disabled={!isChecked} 
                            style={{ opacity: isChecked ? 1 : 0.5, marginBottom: 12 }} 
                        />

                        <CustomButton 
                            title="Decline" 
                            onPress={handleDeclinePress}
                            variant="outline"
                        />
                    </View>

                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        width: '100%',
    },
    modalCard: {
        width: '100%',
        height: '85%', 
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    
    tabContainer: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Colors.WHITE,
        
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    activeTabText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '700',
    },

    documentWrapper: {
        flex: 1, 
        width: '100%',
        marginBottom: 16,
    },
    documentBorder: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT, 
        borderRadius: 16,
        overflow: 'hidden', 
    },

    agreementContainer: {
        width: '100%',
        marginBottom: 16,
        justifyContent: 'center',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 4,
    },
    checkbox: {
        width: 20, 
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.GRAY_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkedBox: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    agreementText: {
        flex: 1, 
        fontSize: 12,
        lineHeight: 18,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'left', 
    },
    linkText: {
        fontWeight: '700',
        fontSize: 14,
        color: Colors.TEXT_PRIMARY, 
    },

    buttonContainer: {
        width: '100%',
    },
});

export default TACScreen;