import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from "react-native";

import CustomButton from '../../../components/CustomButton';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import ErrorMessage from '../../../components/ErrorMessage';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import ConfirmationModal from '../../../components/ConfirmationModal';

import { Colors } from '../../../constants/colors';
import { AuthStyles } from '../styles/AuthStyles';

const TermsScreen = ({ 
    onAcceptPress, 
    onDeclinePress, 
    onBackPress, 
    error 
}) => {

    const [showDeclineModal, setShowDeclineModal] = useState(false);

    const handleAcceptClick = () => {
        if (onAcceptPress) onAcceptPress();
    };

    const handleDeclineClick = () => {
        setShowDeclineModal(true);
    };

    const handleConfirmDecline = () => {
        setShowDeclineModal(false);
        if (onDeclinePress) onDeclinePress();
    };

    const handleCloseModal = () => {
        setShowDeclineModal(false);
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showDeclineModal}
                title="Decline Terms?"
                message="You need to accept the Terms & Conditions to create an account. This will take you back to the start screen."
                confirmText="Decline"
                cancelText="Back"
                onConfirm={handleConfirmDecline}
                onClose={handleCloseModal}
            />

            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <CustomHeader onBackPress={onBackPress} />

                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Terms & Conditions
                        </CustomText>

                        <ErrorMessage error={error} />

                        <View style={styles.legalContainer}>
                            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                                <CustomText variant="body" style={styles.legalText}>
                                    [TERMS AND CONDITIONS PLACEHOLDER]
                                    {'\n'}{'\n'}
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    {'\n'}{'\n'}
                                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                                    {'\n'}{'\n'}
                                </CustomText>
                            </ScrollView>
                        </View>

                        <CustomText variant="caption" style={styles.agreementText}>
                            By clicking "Accept", you acknowledge that you have read and agree to the Terms & Conditions and Privacy Policy.
                        </CustomText>

                        <View style={[AuthStyles.buttonContainer, styles.buttonGap]}>
                            <CustomButton 
                                title="Accept" 
                                onPress={handleAcceptClick}
                                variant="primary"
                            />

                            <CustomButton 
                                title="Decline" 
                                onPress={handleDeclineClick}
                                variant="outline" 
                            />
                        </View>

                    </View>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    legalContainer: {
        width: '100%',
        height: 300, 
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        marginBottom: 24,
    },
    legalText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
    },
    agreementText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
        paddingHorizontal: 8,
        marginBottom: 32,
    },
    buttonGap: {
        gap: 16, 
    }
});

export default TermsScreen;