/**
 * @file TrailWriteScreen.tsx
 * @description Production presentation screen component for creating and editing trail domain records.
 * Orchestrates structured form sections (General, Geography, Difficulty, Tourism), responsive mobile/web padding,
 * CustomStickyFooter with interactive submit states, dismissible CustomToast validation alerts, and confirmation modals.
 */

import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomStickyFooter, { getStickyFooterScrollPadding } from '@/src/components/CustomStickyFooter';
import CustomToast from '@/src/components/CustomToast';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { IBaseWriteHook, TEdit } from '@/src/core/interface/domainHookInterface';
import { Trail } from '@/src/core/models/Trail/Trail';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import TrailDifficultySection from '@/src/features/SuperAdmin/components/trail/TrailDifficultySection';
import TrailGeneralSection from '@/src/features/SuperAdmin/components/trail/TrailGeneralSection';
import TrailGeographySection from '@/src/features/SuperAdmin/components/trail/TrailGeographySection';
import TrailRulesSection from '@/src/features/SuperAdmin/components/trail/TrailRulesSection';
import TrailTourismSection from '@/src/features/SuperAdmin/components/trail/TrailTourismSection';
import {
    FormToastConfig,
    getDeleteConfirmConfig,
    getDiscardConfirmConfig,
    getErrorToastConfig,
    getMissingFieldsSummary,
    getOptionStrings,
    getSaveButtonStyle,
    getSaveButtonTextStyle,
    getSaveButtonTitle,
    getSaveConfirmConfig,
    isDifficultyComplete,
    isFormValid,
    isGeneralComplete,
    isGeographyComplete,
    isRulesComplete,
} from '@/src/features/SuperAdmin/utils/trailFormUtils';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IUseTrailWrite = IBaseWriteHook<Trail>;

export interface TrailWriteScreenProps {
    controller: IUseTrailWrite;
    onBackPress: () => void;
    isSuperadminShell?: boolean;
    pendingCount?: number;
    onTabPress?: (tab: SuperadminTab) => void;
    onBackToSettings?: () => void;
    uploadPicture?: () => void;
}

const TrailWriteScreen: React.FC<TrailWriteScreenProps> = ({
    controller,
    onBackPress,
    isSuperadminShell = true,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
    uploadPicture,
}) => {
    const { isMobile, isDesktop } = useBreakpoints();
    const insets = useSafeAreaInsets();

    const {
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
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState<boolean>(false);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<'create' | 'save' | 'delete' | null>(null);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
    const [toastConfig, setToastConfig] = useState<FormToastConfig>({
        visible: false,
        message: '',
        type: 'error',
        mode: 'dismissible',
        triggerKey: 0,
    });

    const showToast = useCallback((
        message: string,
        type: 'error' | 'warning' | 'info' | 'success' = 'error',
        mode: 'simple' | 'dismissible' = 'dismissible',
        triggerKey: number = Date.now()
    ) => {
        setToastConfig({
            ...getErrorToastConfig(message, mode, triggerKey),
            type,
        });
    }, []);

    const [submitCount, setSubmitCount] = useState<number>(0);
    const [handledSubmitCount, setHandledSubmitCount] = useState<number>(0);

    // Reactive toast on controller error / submit completion
    const [prevError, setPrevError] = useState<string | null>(error);

    if (error && error !== prevError) {
        setPrevError(error);
        if (!isLoading) {
            setToastConfig(getErrorToastConfig(error));
        }
    } else if (!error && prevError) {
        setPrevError(null);
    }

    if (submitCount > handledSubmitCount) {
        setHandledSubmitCount(submitCount);
        if (error) {
            setToastConfig(getErrorToastConfig(error));
        }
    }

    const isEditMode = Boolean(trail?.id && trail.id.length > 0);
    const screenTitle = isEditMode ? 'Edit Trail' : 'Create New Trail';

    // Parse options from controller
    const provinceOptions = getOptionStrings(options, 'provinces');
    const mountainOptions = getOptionStrings(options, 'mountains');
    const classificationOptions = getOptionStrings(options, 'classification');
    const circularityOptions = getOptionStrings(options, 'circularity');
    const qualityOptions = getOptionStrings(options, 'quality');
    const difficultyPointsOptions = getOptionStrings(options, 'difficultyPoints');
    const viewpointsOptions = getOptionStrings(options, 'viewpoints');

    // Section completion states
    const generalComplete = isGeneralComplete(trail);
    const geographyComplete = isGeographyComplete(trail);
    const difficultyComplete = isDifficultyComplete(trail);
    const rulesComplete = isRulesComplete(trail);
    const formValid = isFormValid(trail);

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
        setIsDirty(false);
        setShowDiscardModal(false);
        onBackPress();
    };

    const handleConfirmDelete = async () => {
        if (!trail.id) return;
        setIsDirty(false);
        setShowDeleteModal(false);
        setActionLoading('delete');
        setSubmitCount(c => c + 1);
        try {
            await onRemovePress(trail.id);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSavePress = async () => {
        if (!formValid) {
            setHasAttemptedSubmit(true);
            showToast(
                getMissingFieldsSummary(generalComplete, geographyComplete, difficultyComplete, rulesComplete)
            );
            return;
        }

        // Always prompt confirmation before committing (both creation and edit)
        setShowSaveConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirmModal(false);
        setIsDirty(false);
        setActionLoading(isEditMode ? 'save' : 'create');
        setSubmitCount(c => c + 1);
        try {
            await onSubmitPress();
        } finally {
            setActionLoading(null);
        }
    };

    const isButtonError = !formValid && hasAttemptedSubmit && toastConfig.visible;

    const backHeaderAction = (
        <TouchableOpacity
            style={styles.backHeaderButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
        >
            <CustomIcon
                library="Feather"
                name="chevron-left"
                size={24}
                color={Colors.PRIMARY}
            />
        </TouchableOpacity>
    );

    const discardConfirmConfig = getDiscardConfirmConfig();
    const saveConfirmConfig = getSaveConfirmConfig(isEditMode, isLoading, trail?.general?.name);
    const deleteConfirmConfig = getDeleteConfirmConfig(isLoading, trail?.general?.name);

    const formContent = (
        <View style={styles.screenWrapper}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContainer,
                    isMobile ? styles.scrollPaddingMobile : styles.scrollPaddingDesktop,
                    { paddingBottom: getStickyFooterScrollPadding(insets.bottom, isMobile) },
                ]}
            >
                <View style={[
                    styles.maxContainer,
                    isSuperadminShell ? styles.maxContainerShell : styles.maxContainerWeb,
                ]}>
                    {/* 1. General Information Card */}
                    <TrailGeneralSection
                        trail={trail}
                        provinceOptions={provinceOptions}
                        mountainOptions={mountainOptions}
                        isComplete={generalComplete}
                        hasError={hasAttemptedSubmit && !generalComplete}
                        isDesktop={isDesktop}
                        isMobile={isMobile}
                        onUpdateField={handleUpdateField}
                        uploadPicture={uploadPicture}
                        onShowToast={showToast}
                    />

                    {/* 2. Geography & Coordinates Card */}
                    <TrailGeographySection
                        trail={trail}
                        isEditMode={isEditMode}
                        isComplete={geographyComplete}
                        hasError={hasAttemptedSubmit && !geographyComplete}
                        isDesktop={isDesktop}
                        isMobile={isMobile}
                        onUpdateField={handleUpdateField}
                    />

                    {/* 3. Difficulty & Hike Specs Card */}
                    <TrailDifficultySection
                        trail={trail}
                        classificationOptions={classificationOptions}
                        circularityOptions={circularityOptions}
                        qualityOptions={qualityOptions}
                        difficultyPointsOptions={difficultyPointsOptions}
                        isEditMode={isEditMode}
                        isComplete={difficultyComplete}
                        hasError={hasAttemptedSubmit && !difficultyComplete}
                        isDesktop={isDesktop}
                        isMobile={isMobile}
                        onUpdateField={handleUpdateField}
                    />

                    {/* 4. Rules, Safety & Advisories Card */}
                    <TrailRulesSection
                        trail={trail}
                        isComplete={rulesComplete}
                        hasError={hasAttemptedSubmit && !rulesComplete}
                        isDesktop={isDesktop}
                        isMobile={isMobile}
                        onUpdateField={handleUpdateField}
                    />

                    {/* 5. Tourism & Amenities Card */}
                    <TrailTourismSection
                        trail={trail}
                        viewpointsOptions={viewpointsOptions}
                        isDesktop={isDesktop}
                        isMobile={isMobile}
                        onUpdateField={handleUpdateField}
                    />
                </View>

                {/* Modal 1: Discard Unsaved Changes Confirmation */}
                <ConfirmationModal
                    visible={showDiscardModal}
                    title={discardConfirmConfig.title}
                    message={discardConfirmConfig.message}
                    confirmText={discardConfirmConfig.confirmText}
                    cancelText={discardConfirmConfig.cancelText}
                    isDestructive={true}
                    iconName="alert-triangle"
                    iconLibrary="Feather"
                    onConfirm={handleConfirmDiscard}
                    onClose={() => setShowDiscardModal(false)}
                />

                {/* Modal 2: Save / Create Confirmation */}
                <ConfirmationModal
                    visible={showSaveConfirmModal}
                    title={saveConfirmConfig.title}
                    message={saveConfirmConfig.message}
                    confirmText={saveConfirmConfig.confirmText}
                    cancelText={saveConfirmConfig.cancelText}
                    iconName="check-circle"
                    iconLibrary="Feather"
                    onConfirm={handleConfirmSave}
                    onClose={() => setShowSaveConfirmModal(false)}
                />

                {/* Modal 3: Delete Trail Confirmation (Edit state) */}
                <ConfirmationModal
                    visible={showDeleteModal}
                    title={deleteConfirmConfig.title}
                    message={deleteConfirmConfig.message}
                    confirmText={deleteConfirmConfig.confirmText}
                    cancelText={deleteConfirmConfig.cancelText}
                    isDestructive={true}
                    iconName="trash-2"
                    iconLibrary="Feather"
                    onConfirm={handleConfirmDelete}
                    onClose={() => setShowDeleteModal(false)}
                />
            </ScrollView>

            {/* Sticky Action Footer */}
            <CustomStickyFooter
                primaryButton={{
                    title: getSaveButtonTitle(isLoading, isEditMode),
                    disabled: isLoading,
                    isLoading: Boolean(isLoading && (actionLoading === 'save' || actionLoading === 'create')),
                    style: getSaveButtonStyle(isLoading, formValid, isButtonError),
                    textStyle: getSaveButtonTextStyle(formValid, isLoading, isButtonError),
                    onPress: handleSavePress,
                }}
                secondaryButton={isEditMode ? {
                    title: 'Delete Trail',
                    variant: 'outline',
                    style: { borderColor: Colors.ERROR },
                    textStyle: { color: Colors.ERROR },
                    disabled: isLoading,
                    isLoading: Boolean(isLoading && actionLoading === 'delete'),
                    onPress: () => setShowDeleteModal(true),
                } : undefined}
            />

            {/* Responsive Full-Screen Action Loading Overlay */}
            <CustomLoading
                visible={Boolean(isLoading && actionLoading)}
                message={
                    actionLoading === 'delete'
                        ? 'Deleting trail from database...'
                        : actionLoading === 'create'
                            ? 'Creating new trail in database...'
                            : 'Saving trail changes to database...'
                }
            />

            {/* Status Toast Notification positioned above sticky footer */}
            <CustomToast
                visible={toastConfig.visible}
                message={toastConfig.message}
                type={toastConfig.type || 'error'}
                mode={toastConfig.mode || 'dismissible'}
                triggerKey={toastConfig.triggerKey}
                position="sticky_footer"
                onHide={() => {
                    setToastConfig(prev => ({ ...prev, visible: false }));
                }}
            />
        </View>
    );

    if (isSuperadminShell) {
        return (
            <SuperadminShell
                activeTab="trail"
                pendingCount={pendingCount}
                onTabPress={onTabPress || (() => { })}
                onBackToSettings={onBackToSettings || (() => { })}
                titleOverride={screenTitle}
                leftActionOverride={backHeaderAction}
                noScroll={true}
                noPadding={true}
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
    screenWrapper: {
        flex: 1,
    },
    scrollContainer: {
        paddingVertical: 16,
    },
    scrollPaddingMobile: {
        paddingHorizontal: 16,
    },
    scrollPaddingDesktop: {
        paddingHorizontal: 24,
    },
    maxContainer: {
        width: '100%',
        alignSelf: 'center',
        gap: 20,
    },
    maxContainerWeb: {
        maxWidth: Layout.MAX_WIDTH,
    },
    maxContainerShell: {
        maxWidth: 860,
    },
    backHeaderButton: {
        padding: 6,
        marginLeft: -6,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TrailWriteScreen;
