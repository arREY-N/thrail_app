/**
 * @file MountainWriteScreen.tsx
 * @description Superadmin presentation form screen for adding or editing a Mountain document. Equipped with dynamic header title ("Add Mountain" / "Edit Mountain"), interactive province choice chips, unsaved form changes protection modal, and primary/delete action buttons wrapped inside SuperadminShell.
 */

import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import WriteComponent from '@/src/components/CustomWriteComponents';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { OPTIONS } from '@/src/constants/constants';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Mountain } from '@/src/core/models/Mountain/Mountain';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import { MountainUIConfig } from '@/src/fields/mountainFields';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the MountainWriteScreen component.
 */
export interface MountainWriteScreenProps {
    mountain: Mountain;
    error?: string | null;
    isLoading?: boolean;
    pendingCount?: number;
    onTabPress?: (tab: SuperadminTab) => void;
    onBackToSettings?: () => void;
    onSubmitPress: () => Promise<void>;
    onRemovePress: (id: string) => Promise<void>;
    onUpdatePress: (params: TEdit<Mountain>) => void;
    onBackPress: () => void;
}

/**
 * Superadmin presentation form screen for writing mountain database documents.
 */
const MountainWriteScreen: React.FC<MountainWriteScreenProps> = ({
    mountain,
    error = null,
    isLoading = false,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
    onSubmitPress,
    onRemovePress,
    onUpdatePress,
    onBackPress,
}) => {
    const { isDesktop } = useBreakpoints();

    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const isEditing = Boolean(mountain.id && mountain.id.length > 0);

    const handleUpdateField = (params: TEdit<Mountain>) => {
        setIsDirty(true);
        onUpdatePress(params);
    };

    const handleHeaderBack = () => {
        if (isDirty) {
            setShowDiscardModal(true);
        } else {
            onBackPress();
        }
    };

    const handleConfirmDiscard = () => {
        setShowDiscardModal(false);
        onBackPress();
    };

    const handleConfirmDelete = async () => {
        if (!mountain.id) return;
        setShowDeleteModal(false);
        await onRemovePress(mountain.id);
    };

    // Left Back Button Action for SuperadminShell HeaderBar
    const backHeaderAction = (
        <TouchableOpacity
            style={styles.backHeaderButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
        >
            <CustomIcon library="Feather" name="chevron-left" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
    );

    return (
        <SuperadminShell
            activeTab="mountain"
            titleOverride={isEditing ? 'Edit Mountain' : 'Add Mountain'}
            pendingCount={pendingCount}
            onTabPress={onTabPress || (() => {})}
            onBackToSettings={onBackToSettings || (() => {})}
            enableSearch={false}
            leftActionOverride={backHeaderAction}
        >
            <KeyboardAvoidingView
                style={styles.keyboardFlex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View
                    style={[
                        styles.scrollContainer,
                        isDesktop && styles.scrollContentDesktop,
                    ]}
                >
                    {/* Error Banner */}
                    {error ? (
                        <View style={styles.errorWrapper}>
                            <ErrorMessage error={error} />
                        </View>
                    ) : null}

                    {/* Main Form Card Container */}
                    <View style={styles.formCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.badgeCircle}>
                                <CustomIcon library="FontAwesome5" name="mountain" size={18} color={Colors.PRIMARY} />
                            </View>
                            <View style={styles.headerTextCol}>
                                <CustomText variant="h2" style={styles.cardTitle}>
                                    {isEditing ? 'Edit Mountain' : 'Add Mountain'}
                                </CustomText>
                                <CustomText variant="caption" style={styles.cardSubtitle}>
                                    Specify mountain name and assigned CALABARZON province location.
                                </CustomText>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.formContainer}>
                            <WriteComponent
                                informationSet={MountainUIConfig}
                                object={mountain}
                                optionSet={{ provinces: OPTIONS.provinces as string[] }}
                                onEditProperty={handleUpdateField}
                            />
                        </View>

                        {/* Action Buttons Footer */}
                        <View style={styles.buttonFooter}>
                            <CustomButton
                                title={isEditing ? 'Save Changes' : 'Create Mountain'}
                                onPress={onSubmitPress}
                                disabled={isLoading}
                                variant="primary"
                            />

                            {isEditing && (
                                <CustomButton
                                    title="Delete Mountain"
                                    onPress={() => setShowDeleteModal(true)}
                                    variant="outline"
                                    style={{ borderColor: Colors.ERROR }}
                                    textStyle={{ color: Colors.ERROR }}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Modal 1: Discard Unsaved Changes */}
            <ConfirmationModal
                visible={showDiscardModal}
                title="Discard Unsaved Changes?"
                message="You have unsaved changes in this form. Are you sure you want to leave without saving?"
                confirmText="Discard & Leave"
                cancelText="Keep Editing"
                onConfirm={handleConfirmDiscard}
                onClose={() => setShowDiscardModal(false)}
            />

            {/* Modal 2: Delete Mountain Confirmation */}
            <ConfirmationModal
                visible={showDeleteModal}
                title="Delete Mountain"
                message={`Are you sure you want to delete "${mountain.name || 'this mountain'}"? This action cannot be undone.`}
                confirmText="Delete Mountain"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowDeleteModal(false)}
            />
        </SuperadminShell>
    );
};

const styles = StyleSheet.create({
    keyboardFlex: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },

    scrollContentDesktop: {
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
        paddingVertical: 24,
    },
    backHeaderButton: {
        padding: 6,
        marginLeft: -6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorWrapper: {
        marginBottom: 16,
    },
    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 24,
        ...GlobalStyles.dropShadow(3),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    badgeCircle: {
        width: 44,
        height: 44,
        borderRadius: 24,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextCol: {
        flex: 1,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    cardSubtitle: {
        color: Colors.TEXT_SECONDARY,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    formContainer: {
        
    },
    buttonFooter: {
        gap: 12,
    },
});

export default MountainWriteScreen;
