/**
 * @file ForgotPasswordScreen.tsx
 * @description Pure-UI screen component for the Forgot Password flow, handling user input validation and displaying feedback on success.
 */

import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { AuthStyles } from '@/src/features/Auth/styles/AuthStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the ForgotPasswordScreen component.
 * @param onSendResetEmail - Function to handle sending the password reset email.
 * @param error - Error message to display, if any.
 * @param success - Indicates if the reset email was successfully sent.
 * @param onLogIn - Function to navigate back to the log-in page.
 * @param onBackPress - Function to navigate back to the previous screen.
 * @param isSplitScreen - When true, renders without ScreenWrapper/ResponsiveScrollView for the split-screen layout.
 */
export interface ForgotPasswordScreenProps {
    onSendResetEmail: (email: string) => Promise<void>;
    error: string | null;
    success: boolean;
    onLogIn: () => void;
    onBackPress: () => void;
    isSplitScreen?: boolean;
}

/**
 * Screen component that renders the Forgot Password interface.
 */
const ForgotPasswordScreen = ({ 
    onSendResetEmail, 
    error, 
    success, 
    onLogIn, 
    onBackPress,
    isSplitScreen
}: ForgotPasswordScreenProps) => {
    const { isLargeScreen } = useBreakpoints();
    const [email, setEmail] = useState<string>('');
    const [submittedEmail, setSubmittedEmail] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSendEmail = () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setLocalError('Please enter your email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setLocalError('Please enter a valid email address.');
            return;
        }

        setLocalError(null);
        setSubmittedEmail(trimmedEmail);
        onSendResetEmail(trimmedEmail);
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (localError) {
            setLocalError(null);
        }
    };

    const displayError = localError || error;

    const formContent = (
        <View style={AuthStyles.formConstrainer}>
            <CustomText
                variant="title"
                style={[
                    AuthStyles.pageTitle,
                    isSplitScreen && AuthStyles.splitScreenTitle,
                ]}
            >
                {success ? "Email Sent!" : "Forgot Password"}
            </CustomText>

            {success ? (
                <>
                    <View style={styles.successIntroContainer}>
                        <View style={styles.successIconOuter}>
                            <View style={styles.successIconInner}>
                                <CustomIcon
                                    library="Feather"
                                    name="mail"
                                    size={40}
                                    color={Colors.PRIMARY}
                                />
                            </View>
                        </View>
                        
                        <CustomText variant="body" style={styles.successIntroText}>
                            We have sent a secure password reset link to your email:
                        </CustomText>
                        
                        <CustomText variant="h3" style={styles.successEmailText}>
                            {submittedEmail || email}
                        </CustomText>
                    </View>

                    <View style={styles.tipsCard}>
                        <CustomText variant="label" style={styles.tipsCardTitle}>
                            Next Steps
                        </CustomText>
                        
                        <View style={styles.tipItem}>
                            <CustomIcon 
                                library="Feather" 
                                name="clock" 
                                size={16} 
                                color={Colors.GRAY_MEDIUM} 
                                style={styles.tipIcon}
                            />
                            <CustomText variant="caption" style={styles.tipText}>
                                The link is valid for <CustomText variant="caption" style={styles.boldText}>1 hour</CustomText> for security reasons.
                            </CustomText>
                        </View>

                        <View style={styles.tipItem}>
                            <CustomIcon 
                                library="Feather" 
                                name="inbox" 
                                size={16} 
                                color={Colors.GRAY_MEDIUM}
                                style={styles.tipIcon}
                            />
                            <CustomText variant="caption" style={styles.tipText}>
                                If you do not see the email, please check your spam or junk folders.
                            </CustomText>
                        </View>

                        <View style={styles.tipItem}>
                            <CustomIcon 
                                library="Feather" 
                                name="refresh-cw" 
                                size={16} 
                                color={Colors.GRAY_MEDIUM}
                                style={styles.tipIcon}
                            />
                            <CustomText variant="caption" style={styles.tipText}>
                                You can try sending another reset request if the link expired.
                            </CustomText>
                        </View>
                    </View>
                    
                    <View style={[AuthStyles.buttonContainer, isSplitScreen && AuthStyles.splitScreenSection]}>
                        <CustomButton 
                            title="Back to Log In"
                            onPress={onLogIn}
                            variant="primary" 
                        />
                    </View>
                </>
            ) : (
                <>
                    <CustomText variant="body" style={styles.descriptionText}>
                        Enter your email address below and we'll send you instructions to reset your password.
                    </CustomText>

                    <CustomTextInput
                        label="Email Address"
                        placeholder="name@example.com"
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onSubmitEditing={handleSendEmail}
                    />

                    <ErrorMessage error={displayError} />

                    <View style={[AuthStyles.buttonContainer, isSplitScreen && AuthStyles.splitScreenSection]}>
                        <CustomButton 
                            title="Send Reset Email"
                            onPress={handleSendEmail}
                            variant="primary" 
                        />
                    </View>

                    <View style={styles.footerContainer}>
                        <CustomText variant="caption">
                            Remember your password?{' '}
                        </CustomText>
                        <TouchableOpacity onPress={onLogIn}>
                            <CustomText variant="caption" style={styles.logInLink}>
                                Log In
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );

    if (isSplitScreen) {
        return (
            <ScrollView
                style={AuthStyles.container}
                contentContainerStyle={AuthStyles.splitScreenScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {formContent}
            </ScrollView>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader onBackPress={success ? undefined : onBackPress} />  

            <ResponsiveScrollView 
                minHeight={isLargeScreen ? 0 : 600}
                style={AuthStyles.container}
                contentContainerStyle={[
                    AuthStyles.scrollContent,
                    isLargeScreen && { justifyContent: 'center' }
                ]}      
            >
                <View style={AuthStyles.contentContainer}>
                    {formContent}
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    successIntroContainer: {
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    successIconOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    successIconInner: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successIntroText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 6,
    },
    successEmailText: {
        textAlign: 'center',
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    tipsCard: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
        gap: 16,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    tipsCardTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    tipIcon: {
        marginTop: 2,
    },
    tipText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },
    descriptionText: {
        textAlign: 'center',
        marginBottom: 24,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    logInLink: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginLeft: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
});

export default ForgotPasswordScreen;
