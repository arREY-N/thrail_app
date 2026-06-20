/**
 * @file SecurityScreen.tsx
 * @description View for managing account security settings like password and account deletion.
 */
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the SecurityScreen component.
 * @param onChangePasswordPress - Callback to handle changing the user's password.
 * @param onVerifyPassword - Callback to verify the user's current password.
 * @param onDeleteAccount - Callback to handle final account deletion.
 * @param onBackPress - Callback to handle navigation back.
 */
export interface SecurityScreenProps {
    onChangePasswordPress: (oldPass: string, newPass: string) => Promise<void>;
    onVerifyPassword: (password: string) => Promise<boolean>;
    onDeleteAccount: (password: string) => Promise<void>;
    onBackPress: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

/**
 * SecurityScreen component allows users to change their password or delete their account.
 */
const SecurityScreen = ({ 
    onChangePasswordPress, 
    onVerifyPassword,
    onDeleteAccount,
    onBackPress 
}: SecurityScreenProps) => {
    const { isMobile } = useBreakpoints();

    // Change Password States
    const [changeModalVisible, setChangeModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changeError, setChangeError] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [changeConfirmVisible, setChangeConfirmVisible] = useState(false);

    // Delete Account States
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

    // --- Change Password Flow ---
    const handleOpenChangeModal = () => {
        setOldPassword('');
        setNewPassword('');
        setChangeError('');
        setChangeModalVisible(true);
    };

    const handleAttemptChange = () => {
        setChangeError('');
        if (!oldPassword || !newPassword) {
            setChangeError("Please fill out both fields.");
            return;
        }
        if (!PASSWORD_REGEX.test(newPassword)) {
            setChangeError("New password does not meet the requirements.");
            return;
        }
        // Passed local validation, show confirmation
        setChangeConfirmVisible(true);
    };

    const handleConfirmChange = async () => {
        setChangeConfirmVisible(false);
        setIsChanging(true);
        setChangeError('');
        try {
            await onChangePasswordPress(oldPassword, newPassword);
            setChangeModalVisible(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to change password.";
            setChangeError(message);
        } finally {
            setIsChanging(false);
        }
    };

    // --- Delete Account Flow ---
    const handleOpenDeleteModal = () => {
        setDeletePassword('');
        setDeleteError('');
        setDeleteModalVisible(true);
    };

    const handleVerifyDelete = async () => {
        setDeleteError('');
        if (!deletePassword) {
            setDeleteError("Please enter your password.");
            return;
        }
        setIsVerifying(true);
        try {
            const isValid = await onVerifyPassword(deletePassword);
            if (isValid) {
                // If valid, show final confirmation
                setDeleteConfirmVisible(true);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Incorrect password.";
            setDeleteError(message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleteConfirmVisible(false);
        setIsVerifying(true);
        try {
            await onDeleteAccount(deletePassword);
            setDeleteModalVisible(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to delete account.";
            setDeleteError(message);
            setIsVerifying(false);
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Security" centerTitle onBackPress={onBackPress} />
            <ScrollView contentContainerStyle={[styles.content, !isMobile && styles.desktopContent]}>
                
                <View style={!isMobile ? styles.rowLayout : styles.columnLayout}>
                    {/* Change Password Card */}
                    <View style={[styles.card, styles.shadow, !isMobile && styles.desktopCard]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardIconCircle}>
                                <CustomIcon library="Feather" name="lock" size={18} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="h3" style={styles.cardTitle}>Password Settings</CustomText>
                        </View>
                        <CustomText variant="body" style={styles.description}>
                            Keep your account secure by updating your password regularly. Choose a strong, unique password to protect your data.
                        </CustomText>
                        <CustomButton 
                            title="Change Password" 
                            onPress={handleOpenChangeModal} 
                            variant="primary"
                            style={styles.button}
                        />
                    </View>

                    {/* Delete Account Card */}
                    <View style={[styles.card, styles.shadow, !isMobile && styles.desktopCard]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardDangerIconCircle}>
                                <CustomIcon library="Feather" name="trash-2" size={18} color={Colors.ERROR} />
                            </View>
                            <CustomText variant="h3" style={styles.cardTitle}>Delete Account</CustomText>
                        </View>
                        <CustomText variant="body" style={styles.description}>
                            Permanently delete your account and all associated data. This action cannot be undone, so please be absolutely sure.
                        </CustomText>
                        <CustomButton 
                            title="Delete Account" 
                            onPress={handleOpenDeleteModal} 
                            variant="outline"
                            style={styles.deleteButton}
                            textStyle={styles.deleteButtonText}
                        />
                    </View>
                </View>

            </ScrollView>

            {/* --- Change Password Modal --- */}
            <Modal
                visible={changeModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => !isChanging && setChangeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, !isMobile && styles.modalCardDesktop]}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.iconCircle, styles.approvedIconCircle]}>
                                <CustomIcon library="Feather" name="key" size={24} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="h3" style={styles.modalTitle}>Change Password</CustomText>
                        </View>

                        <CustomTextInput
                            placeholder="Old Password"
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            secureTextEntry
                        />
                        <CustomTextInput
                            placeholder="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            style={styles.newPasswordInput}
                        />
                        
                        <CustomText variant="caption" style={styles.passwordRequirements}>
                            Your new password must contain:
                        </CustomText>
                        
                        <View style={styles.checklistContainer}>
                            {[
                                {
                                    label: "At least 8 characters",
                                    valid: newPassword.length >= 8,
                                },
                                {
                                    label: "Uppercase letter",
                                    valid: /[A-Z]/.test(newPassword),
                                },
                                {
                                    label: "Lowercase letter",
                                    valid: /[a-z]/.test(newPassword),
                                },
                                {
                                    label: "Number",
                                    valid: /\d/.test(newPassword),
                                },
                                {
                                    label: "Special character",
                                    valid: /[!@#$%^&*]/.test(newPassword),
                                },
                            ].map((rule, idx) => (
                                <View key={idx} style={styles.checklistItem}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name={rule.valid ? "check-circle" : "circle"} 
                                        size={14} 
                                        color={rule.valid ? Colors.SUCCESS : Colors.TEXT_PLACEHOLDER} 
                                    />
                                    <CustomText 
                                        variant="caption" 
                                        style={[
                                            styles.checklistText, 
                                            rule.valid && styles.checklistTextValid,
                                        ]}
                                    >
                                        {rule.label}
                                    </CustomText>
                                </View>
                            ))}
                        </View>

                        <ErrorMessage error={changeError} style={styles.errorMargin} />

                        <View style={styles.modalActions}>
                            <CustomButton 
                                title="Cancel" 
                                variant="outline" 
                                onPress={() => setChangeModalVisible(false)}
                                style={styles.modalBtn}
                                disabled={isChanging}
                            />
                            <CustomButton 
                                title={isChanging ? "Changing..." : "Change"} 
                                onPress={handleAttemptChange}
                                disabled={!oldPassword || !newPassword || isChanging}
                                style={styles.modalBtn}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Change Password Confirmation Modal */}
            <ConfirmationModal
                visible={changeConfirmVisible}
                title="Update Password?"
                message="Are you sure you want to update your password? You will need to use your new password next time you sign in."
                confirmText="Yes, Change"
                cancelText="Cancel"
                onConfirm={handleConfirmChange}
                onClose={() => setChangeConfirmVisible(false)}
                iconName="check-circle"
            />

            {/* --- Delete Account Modal --- */}
            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => !isVerifying && setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, !isMobile && styles.modalCardDesktop]}>
                        <View style={styles.modalHeader}>
                            <View style={[styles.iconCircle, styles.dangerIconCircle]}>
                                <CustomIcon library="Feather" name="user-x" size={24} color={Colors.ERROR} />
                            </View>
                            <CustomText variant="h3" style={styles.modalTitle}>Verify Identity</CustomText>
                        </View>

                        <CustomText variant="body" style={styles.deleteWarningText}>
                            Deleting your account is permanent and cannot be undone. To proceed, please enter your password to verify your identity.
                        </CustomText>

                        <CustomTextInput
                            placeholder="Password"
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                            secureTextEntry
                        />

                        <ErrorMessage error={deleteError} style={styles.errorMargin} />

                        <View style={styles.modalActions}>
                            <CustomButton 
                                title="Cancel" 
                                variant="outline" 
                                onPress={() => setDeleteModalVisible(false)}
                                style={styles.modalBtn}
                                disabled={isVerifying}
                            />
                            <CustomButton 
                                title={isVerifying ? "Verifying..." : "Verify"} 
                                variant="destructive"
                                onPress={handleVerifyDelete}
                                disabled={!deletePassword || isVerifying}
                                style={styles.modalBtn}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Final Confirmation Modal */}
            <ConfirmationModal
                visible={deleteConfirmVisible}
                title="Delete Account"
                message="Are you sure you want to permanently delete your account? This will erase all your hiking logs, booking records, and profile details."
                confirmText="Yes, Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteConfirmVisible(false)}
                iconName="trash-2"
                isDestructive={true}
            />

        </ScreenWrapper>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 48,
        gap: 20,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    rowLayout: {
        flexDirection: 'row',
        gap: 20,
        width: '100%',
    },
    columnLayout: {
        flexDirection: 'column',
        gap: 20,
        width: '100%',
    },
    desktopCard: {
        flex: 1,
    },
    card: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    shadow: {
        ...dropShadow,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDangerIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 0,
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 16,
        fontSize: 14,
        lineHeight: 20,
    },
    button: {
        borderRadius: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 24,
    },
    deleteButton: {
        borderColor: Colors.ERROR,
        borderRadius: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 24,
    },
    deleteButtonText: {
        color: Colors.ERROR,
    },
    
    // Modal Styles
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
        gap: 16,
        ...dropShadow,
    },
    modalCardDesktop: {
        maxWidth: 500,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    approvedIconCircle: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    dangerIconCircle: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    passwordRequirements: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 8,
        lineHeight: 16,
    },
    newPasswordInput: {
        marginBottom: 4,
    },
    errorMargin: {
        marginTop: 8,
        marginBottom: 0,
    },
    checklistContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        width: '46%', // 2 columns
    },
    checklistText: {
        color: Colors.TEXT_SECONDARY,
    },
    checklistTextValid: {
        color: Colors.SUCCESS,
    },
    deleteWarningText: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 8,
        lineHeight: 22,
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

export default SecurityScreen;
