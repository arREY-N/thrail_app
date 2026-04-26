import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from "react-native";

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { PrivacyContent } from '@/src/features/Legal/screens/PrivacyScreen';
import { TermsContent } from '@/src/features/Legal/screens/TermsScreen';

import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const TACScreen = ({ 
    onAcceptPress, 
    onDeclinePress,
}) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isLargeScreen = isDesktop || isTablet;

    const [activeTab, setActiveTab] = useState('terms');
    const [isChecked, setIsChecked] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    const [hasReadTerms, setHasReadTerms] = useState(false);
    const [hasReadPrivacy, setHasReadPrivacy] = useState(false);

    const canAccept = hasReadTerms && hasReadPrivacy;

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

    const isTermsActive = activeTab === 'terms';
    const isPrivacyActive = activeTab === 'privacy';

    return (
        <ScreenWrapper backgroundColor="transparent">
            
            <View style={[styles.modalOverlay, isLargeScreen && styles.modalOverlayLarge]}>
                
                <ConfirmationModal
                    visible={showDeclineModal}
                    title="Decline Terms?"
                    message="You must accept the Terms & Conditions to create an account. Declining will cancel the sign-up process."
                    confirmText="Confirm"
                    cancelText="Cancel"
                    onConfirm={confirmDecline}
                    onClose={() => setShowDeclineModal(false)}
                />

                {/* 4. Card swaps constraints based on screen size */}
                <View style={[
                    styles.modalCard, 
                    isLargeScreen ? styles.modalCardLarge : styles.modalCardMobile
                ]}>
                    
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[
                                styles.tabButton, 
                                isTermsActive && styles.activeTab,
                                isTermsActive && hasReadTerms && styles.activeTabRead
                            ]}
                            onPress={() => setActiveTab('terms')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tabContentRow}>
                                <CustomText 
                                    numberOfLines={1} 
                                    adjustsFontSizeToFit={true}
                                    style={[
                                        styles.tabText, 
                                        isTermsActive && styles.activeTabText,
                                        isTermsActive && hasReadTerms && styles.activeTabTextRead
                                    ]}
                                >
                                    Terms & Conditions
                                </CustomText>
                                {hasReadTerms && (
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check" 
                                        size={14} 
                                        color={isTermsActive ? Colors.WHITE : Colors.PRIMARY} 
                                    />
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.tabButton, 
                                isPrivacyActive && styles.activeTab,
                                isPrivacyActive && hasReadPrivacy && styles.activeTabRead
                            ]}
                            onPress={() => setActiveTab('privacy')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tabContentRow}>
                                <CustomText 
                                    numberOfLines={1}
                                    adjustsFontSizeToFit={true}
                                    style={[
                                        styles.tabText, 
                                        isPrivacyActive && styles.activeTabText,
                                        isPrivacyActive && hasReadPrivacy && styles.activeTabTextRead
                                    ]}
                                >
                                    Privacy Policy
                                </CustomText>
                                {hasReadPrivacy && (
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check" 
                                        size={14} 
                                        color={isPrivacyActive ? Colors.WHITE : Colors.PRIMARY} 
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.documentWrapper}>
                        <View style={styles.documentBorder}>
                            {isTermsActive ? (
                                <TermsContent onScrollToBottom={() => setHasReadTerms(true)} />
                            ) : (
                                <PrivacyContent onScrollToBottom={() => setHasReadPrivacy(true)} />
                            )}
                        </View>
                    </View>

                    <View style={styles.agreementContainer}>
                        
                        <View style={[styles.instructionBox, canAccept && styles.instructionBoxSuccess]}>
                            <View style={[styles.iconCircle, canAccept && styles.iconCircleSuccess]}>
                                <CustomIcon 
                                    library="Ionicons" 
                                    name={canAccept ? "checkmark-circle" : "book"} 
                                    size={18} 
                                    color={canAccept ? Colors.SUCCESS : Colors.PRIMARY} 
                                />
                            </View>
                            <CustomText style={[styles.instructionText, canAccept && styles.instructionTextSuccess]}>
                                {canAccept 
                                    ? "Thank you for reviewing the terms." 
                                    : "To continue, please read through to the bottom of both Terms and Privacy tabs."}
                            </CustomText>
                        </View>

                        <TouchableOpacity 
                            style={[
                                styles.checkboxRow, 
                                !canAccept && { opacity: 0.5 }
                            ]} 
                            onPress={() => {
                                if (canAccept) setIsChecked(!isChecked);
                            }}
                            activeOpacity={canAccept ? 0.7 : 1}
                        >
                            <View style={[styles.checkbox, isChecked && styles.checkedBox]}>
                                {isChecked && (
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check" 
                                        size={14} 
                                        color={Colors.WHITE} 
                                    />
                                )}
                            </View>
                            
                            <CustomText variant="caption" style={styles.agreementText}>
                                I have read and agree to follow the <CustomText style={styles.linkText}>Terms & Conditions</CustomText> and <CustomText style={styles.linkText}>Privacy Policy</CustomText>.
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                        <CustomButton 
                            title="Decline" 
                            onPress={handleDeclinePress}
                            variant="outline"
                            style={{ flex: 1 }}
                        />

                        <CustomButton 
                            title="Proceed" 
                            onPress={handleProceed}
                            variant="primary"
                            disabled={!isChecked} 
                            style={{ flex: 1, opacity: isChecked ? 1 : 0.5 }}
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
    modalOverlayLarge: {
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    modalCard: {
        width: '100%',
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalCardLarge: {
        maxWidth: 900,
        maxHeight: 800,
        paddingHorizontal: 32,
        paddingVertical: 32,
    },
    modalCardMobile: {
        maxWidth: 450,
        maxHeight: '95%',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
        padding: 4, 
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4, 
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: Colors.WHITE,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    activeTabRead: {
        backgroundColor: Colors.PRIMARY,
    },
    tabContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
        flexShrink: 1, 
    },
    activeTabText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '700',
    },
    activeTabTextRead: {
        color: Colors.WHITE,
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
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 10,     
        paddingHorizontal: 12,   
        borderRadius: 12,
        marginBottom: 12,        
        gap: 10,                 
    },
    instructionBoxSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.SUCCESS,
    },
    iconCircle: {
        width: 28,               
        height: 28,              
        borderRadius: 14,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 1,
    },
    iconCircleSuccess: {
        backgroundColor: Colors.WHITE, 
        paddingTop: -1,
    },
    instructionText: {
        flex: 1,
        fontSize: 13,            
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
        lineHeight: 18,
    },
    instructionTextSuccess: {
        color: Colors.SUCCESS,
        fontWeight: 'bold',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
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
        fontSize: 14,
        lineHeight: 20,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'left', 
    },
    linkText: {
        fontWeight: '700',
        fontSize: 13,
        color: Colors.PRIMARY,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
});

export default TACScreen;