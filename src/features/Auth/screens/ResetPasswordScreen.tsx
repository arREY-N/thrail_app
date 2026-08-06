/**
 * @file ResetPasswordScreen.tsx
 * @description Pure-UI screen component for the Reset Password flow, letting the user set and confirm a new password.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
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

/**
 * Props for the ResetPasswordScreen component.
 * @param onResetPassword - Function to handle resetting the password.
 * @param error - Error message to display, if any.
 * @param success - Indicates if the password was successfully reset.
 * @param onLanding - Function to navigate to the landing screen.
 * @param onLogIn - Function to navigate back to the log-in page.
 */
export interface ResetPasswordScreenProps {
    onResetPassword: (data: { confirm: string; password: string }) => Promise<void>;
    error: string | null;
    success: boolean;
    onLanding: () => void;
    onLogIn: () => void;
}

/**
 * Screen component that renders the Reset Password interface.
 */
const ResetPasswordScreen = ({
    onResetPassword,
    error,
    success,
    onLanding,
    onLogIn,
}: ResetPasswordScreenProps) => {
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPasswords, setShowPasswords] = useState<boolean>(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState<boolean>(false);

    // Password strength logic
    const strength = password.length === 0 ? 0 : (
        /[A-Z]/.test(password) && 
        /[a-z]/.test(password) && 
        /\d/.test(password) && 
        /[!@#$%^&*]/.test(password) && 
        password.length >= 8 ? 3 : (password.length >= 8 ? 2 : 1)
    );

    const getStrengthColor = (): string => {
        const colors = [
            Colors.STRENGTH_EMPTY,
            Colors.STRENGTH_WEAK,
            Colors.STRENGTH_MEDIUM,
            Colors.STRENGTH_STRONG
        ];
        return colors[strength];
    };

    const handleReset = () => {
        onResetPassword({ confirm: confirmPassword, password });
    };

    const handleBackPress = () => {
        setIsConfirmModalVisible(true);
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader onBackPress={success ? undefined : handleBackPress} />  

            <ResponsiveScrollView 
                minHeight={600} 
                style={AuthStyles.container} 
                contentContainerStyle={AuthStyles.scrollContent}
            >
                <View style={AuthStyles.contentContainer}>
                    <View style={AuthStyles.formConstrainer}>

                        <CustomText variant="title" style={AuthStyles.pageTitle}>
                            Reset Password
                        </CustomText>
                        
                        {success ? (
                            <>
                                <View style={styles.successCard}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="check-circle" 
                                        size={20} 
                                        color={Colors.SUCCESS} 
                                        style={styles.successIcon}
                                    />
                                    <View style={styles.successTextContainer}>
                                        <CustomText variant="body" style={styles.successText}>
                                            Password Updated! Please log in with your new password.
                                        </CustomText>
                                    </View>
                                </View>
                                
                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Log In"
                                        onPress={onLogIn}
                                        variant="primary" 
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View>
                                    <CustomTextInput
                                        label="New Password *"
                                        placeholder="Type your password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        isPasswordVisible={showPasswords}
                                        onTogglePassword={() => setShowPasswords(!showPasswords)}
                                        style={styles.inputSpacing}
                                    />

                                    <View style={AuthStyles.strengthContainer}>
                                        {[1, 2, 3].map((level) => (
                                            <View 
                                                key={level}
                                                style={[
                                                    AuthStyles.strengthBar,
                                                    { 
                                                        backgroundColor: strength >= level 
                                                            ? getStrengthColor() 
                                                            : Colors.STRENGTH_EMPTY
                                                    }
                                                ]} 
                                            />
                                        ))}
                                    </View>
                                </View>

                                <CustomTextInput
                                    label="Confirm Password *"
                                    placeholder="Retype your password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    isPasswordVisible={showPasswords}
                                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                                />

                                <ErrorMessage error={error} />

                                <View style={AuthStyles.buttonContainer}>
                                    <CustomButton 
                                        title="Reset Password"
                                        onPress={handleReset}
                                        variant="primary" 
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ResponsiveScrollView>

            <ConfirmationModal
                visible={isConfirmModalVisible}
                onClose={() => setIsConfirmModalVisible(false)}
                onConfirm={() => {
                    setIsConfirmModalVisible(false);
                    onLanding();
                }}
                title="Cancel Password Reset?"
                message="Are you sure you want to go back? Your new password progress will be lost."
                confirmText="Yes, Cancel"
                cancelText="No, Keep Writing"
                isDestructive
                iconName="alert-triangle"
                iconLibrary="Feather"
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    successCard: {
        flexDirection: 'row',
        alignItems: 'flex-start', 
        backgroundColor: Colors.STATUS_APPROVED_BG,
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
        gap: 12,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    successIcon: {
        marginTop: 2,
    },
    successTextContainer: {
        flex: 1,
    },
    successText: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '500',
        lineHeight: 22,
    },
    inputSpacing: {
        marginBottom: 0,
    },
});

export default ResetPasswordScreen;
