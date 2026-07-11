/**
 * @file HelpSupportScreen.tsx
 * @description View providing FAQs and a contact form for user support.
 */
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Represents a Frequently Asked Question.
 */
export interface IFAQ {
    /** The question text */
    q: string;
    /** The answer text */
    a: string;
}

/**
 * Props for the HelpSupportScreen component
 * @param faqs - List of Frequently Asked Questions
 * @param onSubmitRequest - Callback to submit the support message
 * @param onBackPress - Callback to navigate back
 */
export interface HelpSupportScreenProps {
    faqs: IFAQ[];
    onSubmitRequest: (message: string) => void;
    onBackPress: () => void;
}

/**
 * HelpSupportScreen displays frequently asked questions and provides contact support capabilities.
 */
const HelpSupportScreen = ({ faqs, onSubmitRequest, onBackPress }: HelpSupportScreenProps) => {
    const { isMobile } = useBreakpoints();
    
    // Modal states
    const [supportModalVisible, setSupportModalVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    
    // Input state
    const [message, setMessage] = useState('');

    const handleOpenSupport = () => setSupportModalVisible(true);
    const handleCloseSupport = () => setSupportModalVisible(false);

    const handleShowConfirm = () => {
        if (message.trim().length > 0) {
            setConfirmModalVisible(true);
        }
    };

    const handleConfirmSubmit = () => {
        setConfirmModalVisible(false);
        setSupportModalVisible(false);
        onSubmitRequest(message);
        setMessage(''); // Clear after submit
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Help & Support" centerTitle onBackPress={onBackPress} />
            
            <ScrollView 
                contentContainerStyle={[styles.content, !isMobile && styles.desktopContent]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <CustomText variant="h3" style={styles.sectionTitle}>FAQs</CustomText>
                    {faqs.map((faq, idx) => (
                        <AccordionItem 
                            key={idx}
                            title={faq.q}
                            icon="help-circle"
                            style={styles.accordionOverride}
                        >
                            <CustomText variant="body" style={styles.answer}>
                                {faq.a}
                            </CustomText>
                        </AccordionItem>
                    ))}
                </View>

                <View style={styles.section}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Contact Us</CustomText>
                    <View style={styles.contactCard}>
                        <CustomText variant="body" style={styles.contactDescription}>
                            Can't find what you're looking for? Send us a message and our support team will get back to you.
                        </CustomText>
                        <CustomButton 
                            title="Contact Support" 
                            onPress={handleOpenSupport} 
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Support Message Modal */}
            <Modal
                visible={supportModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCloseSupport}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, !isMobile && styles.modalCardDesktop]}>
                        
                        <View style={styles.modalHeader}>
                            <View style={styles.iconCircle}>
                                <CustomIcon library="Feather" name="mail" size={24} color={Colors.PRIMARY} />
                            </View>
                            <View>
                                <CustomText variant="h3" style={styles.modalTitle}>Contact Support</CustomText>
                                <CustomText variant="caption" style={styles.modalSubtitle}>We usually respond within 24 hours.</CustomText>
                            </View>
                        </View>
                        
                        <CustomFeedbackInput 
                            placeholder="How can we help you?"
                            value={message}
                            onChangeText={setMessage}
                        />

                        <View style={styles.modalActions}>
                            <CustomButton 
                                title="Cancel" 
                                variant="outline" 
                                onPress={handleCloseSupport}
                                style={styles.modalBtn}
                            />
                            <CustomButton 
                                title="Continue" 
                                onPress={handleShowConfirm}
                                disabled={message.trim().length === 0}
                                style={styles.modalBtn}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                visible={confirmModalVisible}
                title="Send Message"
                message="Would you like to send this to our support team?"
                confirmText="Send"
                cancelText="Cancel"
                onConfirm={handleConfirmSubmit}
                onClose={() => setConfirmModalVisible(false)}
                iconName="send"
            />

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        gap: 32,
        paddingBottom: 48,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    section: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    answer: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
        textAlign: 'justify',
    },
    accordionOverride: {
        marginHorizontal: 0,
        marginBottom: 8,
    },
    contactCard: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 16,
        ...GlobalStyles.dropShadow(3),
    },
    contactDescription: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
        textAlign: 'justify',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 24,
        gap: 20,
        ...GlobalStyles.dropShadow(3),
    },
    modalCardDesktop: {
        maxWidth: 500,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    modalSubtitle: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    modalBtn: {
        flex: 1,
    }
});

export default HelpSupportScreen;
