/**
 * @file TrailWriteScreen.tsx
 * @description Production presentation screen component for creating and editing trail domain records in Superadmin and Admin dashboards, equipped with ConfirmationModal for unsaved changes protection and deletion safety.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import WriteComponent from '@/src/components/CustomWriteComponents';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Trail } from '@/src/core/models/Trail/Trail';
import { IUseTrailWrite } from '@/src/core/hook/trail/useTrailWrite';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import { ITrailFormField } from '@/src/fields/trailFields';

/**
 * Interface representing the properties of the TrailWriteScreen component.
 * 
 * @param controller - Form controller object returned by useTrailWrite.
 * @param onBackPress - Navigation callback handler to return to trail list.
 * @param isSuperadminShell - Flag indicating if screen is rendered inside Superadmin shell dashboard layout.
 * @param pendingCount - Count of pending applications for Superadmin sidebar badge.
 * @param onTabPress - Navigation callback for Superadmin sidebar tabs.
 * @param onBackToSettings - Navigation callback handler for Superadmin sidebar settings action.
 */
export interface TrailWriteScreenProps {
    controller: IUseTrailWrite;
    onBackPress: () => void;
    isSuperadminShell?: boolean;
    pendingCount?: number;
    onTabPress?: (tab: SuperadminTab) => void;
    onBackToSettings?: () => void;
}

/**
 * TrailWriteScreen component rendering structured form sections with responsive card containers and confirmation modals.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered trail write/edit screen.
 */
const TrailWriteScreen: React.FC<TrailWriteScreenProps> = ({
    controller,
    onBackPress,
    isSuperadminShell = true,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
}) => {
    const {
        information,
        object: trail,
        error,
        isLoading,
        options,
        onSubmitPress,
        onRemovePress,
        onUpdatePress: onUpdateTrail,
    } = controller;

    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const isEditMode = Boolean(trail?.id && trail.id.length > 0);
    const screenTitle = isEditMode ? 'Edit Trail' : 'Create New Trail';

    const generalFields = information.filter((a: ITrailFormField) => a.section === 'general');
    const geographyFields = information.filter((a: ITrailFormField) => a.section === 'geography');
    const difficultyFields = information.filter((a: ITrailFormField) => a.section === 'difficulty');
    const tourismFields = information.filter((a: ITrailFormField) => a.section === 'tourism');

    const handleUpdateField = (params: TEdit<Trail>) => {
        setIsDirty(true);
        onUpdateTrail(params);
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
        if (!trail.id) return;
        setShowDeleteModal(false);
        await onRemovePress(trail.id);
    };

    const handleSave = async () => {
        await onSubmitPress();
    };

    // Header Back Action matching MountainWriteScreen
    const backHeaderAction = (
        <TouchableOpacity
            style={styles.backHeaderButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
        >
            <CustomIcon library="Feather" name="chevron-left" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
    );

    const formContent = (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                styles.scrollContainer,
                !isSuperadminShell && styles.scrollPaddingOuter,
            ]}
        >
            <View style={styles.maxContainer}>
                {/* 1. General Information Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconCircle}>
                            <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <CustomText variant="subtitle" style={styles.sectionTitle}>
                                General Information
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Basic trail identity, location, address, and active status
                            </CustomText>
                        </View>
                    </View>
                    <View style={styles.cardDivider} />
                    <WriteComponent
                        informationSet={generalFields}
                        object={trail}
                        optionSet={options}
                        onEditProperty={handleUpdateField}
                    />
                </View>

                {/* 2. Geography & Coordinates Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconCircle}>
                            <CustomIcon library="Feather" name="navigation" size={18} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <CustomText variant="subtitle" style={styles.sectionTitle}>
                                Geography & Coordinates
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Elevation MASL, start coordinates, and end coordinates
                            </CustomText>
                        </View>
                    </View>
                    <View style={styles.cardDivider} />
                    <WriteComponent
                        informationSet={geographyFields}
                        object={trail}
                        optionSet={options}
                        onEditProperty={handleUpdateField}
                    />
                </View>

                {/* 3. Difficulty & Hike Specs Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconCircle}>
                            <CustomIcon library="FontAwesome5" name="mountain" size={14} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <CustomText variant="subtitle" style={styles.sectionTitle}>
                                Difficulty & Hike Specs
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Classification (minor/major), LASCO rating, distance, gain, and hours
                            </CustomText>
                        </View>
                    </View>
                    <View style={styles.cardDivider} />
                    <WriteComponent
                        informationSet={difficultyFields}
                        object={trail}
                        optionSet={options}
                        onEditProperty={handleUpdateField}
                    />
                </View>

                {/* 4. Tourism & Amenities Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconCircle}>
                            <CustomIcon library="Feather" name="compass" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.headerTextWrapper}>
                            <CustomText variant="subtitle" style={styles.sectionTitle}>
                                Tourism & Amenities
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                On-trail facilities, water sources, natural features, and viewpoints
                            </CustomText>
                        </View>
                    </View>
                    <View style={styles.cardDivider} />
                    <WriteComponent
                        informationSet={tourismFields}
                        object={trail}
                        optionSet={options}
                        onEditProperty={handleUpdateField}
                    />
                </View>

                {/* Error Banner */}
                {Boolean(error) && (
                    <View style={styles.errorBanner}>
                        <CustomIcon library="Feather" name="alert-circle" size={16} color={Colors.ERROR} />
                        <CustomText variant="caption" style={styles.errorBannerText}>
                            {error}
                        </CustomText>
                    </View>
                )}

                {/* Action Buttons Stack Toolbar */}
                <View style={styles.actionToolbar}>
                    <CustomButton
                        title={isLoading ? 'Saving...' : 'Save Trail'}
                        onPress={handleSave}
                        disabled={isLoading}
                        variant="primary"
                    />

                    {isEditMode && (
                        <CustomButton
                            title="Delete Trail"
                            onPress={() => setShowDeleteModal(true)}
                            disabled={isLoading}
                            variant="outline"
                            style={{ borderColor: Colors.ERROR }}
                            textStyle={{ color: Colors.ERROR }}
                        />
                    )}
                </View>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color={Colors.PRIMARY} />
                        <CustomText variant="caption" style={styles.loadingText}>
                            Saving trail changes to database...
                        </CustomText>
                    </View>
                )}
            </View>

            {/* Modal 1: Discard Unsaved Changes Confirmation */}
            <ConfirmationModal
                visible={showDiscardModal}
                title="Discard Unsaved Changes?"
                message="You have unsaved changes in this form. Are you sure you want to leave without saving?"
                confirmText="Discard & Leave"
                cancelText="Keep Editing"
                onConfirm={handleConfirmDiscard}
                onClose={() => setShowDiscardModal(false)}
            />

            {/* Modal 2: Delete Trail Confirmation */}
            <ConfirmationModal
                visible={showDeleteModal}
                title="Delete Trail"
                message={`Are you sure you want to delete "${trail?.general?.name || 'this trail'}"? This action cannot be undone.`}
                confirmText="Delete Trail"
                cancelText="Cancel"
                isDestructive={true}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowDeleteModal(false)}
            />
        </ScrollView>
    );

    if (isSuperadminShell) {
        return (
            <SuperadminShell
                activeTab="trail"
                pendingCount={pendingCount}
                onTabPress={onTabPress || (() => {})}
                onBackToSettings={onBackToSettings || (() => {})}
                titleOverride={screenTitle}
                leftActionOverride={backHeaderAction}
            >
                {formContent}
            </SuperadminShell>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title={screenTitle}
                centerTitle
                onBackPress={handleHeaderBack}
            />
            {formContent}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingVertical: 16,
    },
    scrollPaddingOuter: {
        paddingHorizontal: 12,
    },
    maxContainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        gap: 16,
    },
    sectionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
        elevation: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 24,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrapper: {
        flex: 1,
        gap: 2,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        lineHeight: 18,
        marginBottom: 0,
    },
    sectionSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        lineHeight: 14,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 14,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.ERROR_BG,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    errorBannerText: {
        color: Colors.ERROR,
        fontWeight: '500',
        flex: 1,
    },
    actionToolbar: {
        gap: 12,
        marginTop: 8,
    },
    loadingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    loadingText: {
        color: Colors.TEXT_SECONDARY,
    },
    backHeaderButton: {
        padding: 6,
        marginLeft: -6,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TrailWriteScreen;
