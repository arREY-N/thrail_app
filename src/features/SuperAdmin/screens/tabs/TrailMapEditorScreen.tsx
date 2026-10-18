/**
 * @file TrailMapEditorScreen.tsx
 * @description Role-adaptive presentation screen component for visually editing trail map pins.
 * In Superadmin: Uses SuperadminShell with noPadding & noScroll.
 *   - Web: Header has 'Map Editor · [Trail Name]' with Save button + Pin badge.
 *   - Mobile: Header has 'Map Editor · [Trail Name]' + Pin badge; Save button rendered in CustomStickyFooter.
 * In Admin: Uses ScreenWrapper + CustomHeader with stacked Title & Subtitle.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { IOfflinePoint, Trail } from '@/src/core/models/Trail/Trail';
import StaticTrailMap from '@/src/features/Map/components/StaticTrailMap';
import { IWaypointPoint } from '@/src/features/Map/interfaces/Map.types';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Interface representing the properties of the TrailMapEditorScreen component.
 *
 * @param activeTrail - The active Trail domain model being edited.
 * @param isLoading - Flag indicating whether data is loading.
 * @param isSaving - Flag indicating whether save operation is in progress.
 * @param offlinePoints - Array of working offline points/pins.
 * @param onPointsChange - Callback when the offline points list is modified.
 * @param onSave - Async callback handler to persist offline points with toast callback.
 * @param onBackPress - Callback handler to return to previous route or list.
 * @param isSuperadminShell - Flag indicating if layout is rendered inside Superadmin shell dashboard.
 * @param pendingCount - Count of pending applications for sidebar badge.
 * @param onTabPress - Navigation callback handler for Superadmin sidebar tabs.
 * @param onBackToSettings - Navigation callback handler for Superadmin settings action.
 */
export interface TrailMapEditorScreenProps {
    activeTrail: Trail | null;
    isLoading?: boolean;
    isSaving?: boolean;
    offlinePoints: (IOfflinePoint | IWaypointPoint)[];
    onPointsChange: (points: (IOfflinePoint | IWaypointPoint)[]) => void;
    onSave: (showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void) => Promise<boolean | void>;
    onBackPress: () => void;
    isSuperadminShell?: boolean;
    pendingCount?: number;
    onTabPress?: (tab: SuperadminTab) => void;
    onBackToSettings?: () => void;
}

/**
 * TrailMapEditorScreen presentation component.
 * 
 * @param props - Component properties.
 * @returns {React.JSX.Element} The rendered TrailMapEditorScreen.
 */
const TrailMapEditorScreen = ({
    activeTrail,
    isLoading = false,
    isSaving = false,
    offlinePoints = [],
    onPointsChange,
    onSave,
    onBackPress,
    isSuperadminShell = true,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
}: TrailMapEditorScreenProps): React.JSX.Element => {
    const { isMobile } = useBreakpoints();
    const { showToast } = useToast();
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [hasAttemptedSave, setHasAttemptedSave] = useState<boolean>(false);
    const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState<boolean>(false);

    const handlePointsModified = (updatedPoints: IWaypointPoint[]) => {
        setIsDirty(true);
        setHasAttemptedSave(false);
        onPointsChange(updatedPoints);
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

    const handleInitiateSave = () => {
        if (isSaving) return;
        if (!isDirty) {
            setHasAttemptedSave(true);
            showToast.error("No changes to save. Tap on the map to add or edit waypoints first.", {
                mode: 'dismissible',
                position: isMobile ? 'sticky_footer' : undefined,
                onHide: () => {
                    setHasAttemptedSave(false);
                },
            });
            return;
        }
        setShowSaveConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setShowSaveConfirmModal(false);
        await onSave((msg, type) => showToast(msg, type));
        setIsDirty(false);
        setHasAttemptedSave(false);
    };

    const trailName = activeTrail?.general?.name || 'Trail Route Map';
    const pointCount = offlinePoints.length;

    // Header Back Action Button
    const backHeaderAction = (
        <TouchableOpacity
            style={styles.backHeaderButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
        >
            <CustomIcon library="Feather" name="chevron-left" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
    );

    // Pin Counter Badge with Primary Green Semantic Tokens
    const pinBadge = (
        <View style={styles.badgePill}>
            <CustomIcon library="Feather" name="map-pin" size={12} color={Colors.PIN_BADGE_TEXT} />
            <CustomText variant="caption" style={styles.badgeText}>
                {pointCount}
            </CustomText>
        </View>
    );

    // Web Header Right Actions (Pin Badge + Save Button)
    const headerRightActionsWeb = (
        <View style={styles.headerRightRow}>
            {pinBadge}
            <TouchableOpacity
                style={[
                    styles.saveHeaderBtn,
                    !isDirty && (hasAttemptedSave ? styles.saveHeaderBtnError : styles.saveHeaderBtnDisabled),
                ]}
                onPress={handleInitiateSave}
                disabled={isSaving}
                activeOpacity={0.7}
            >
                <CustomIcon
                    library="Feather"
                    name="save"
                    size={16}
                    color={
                        isDirty
                            ? Colors.WHITE
                            : (hasAttemptedSave ? Colors.STATUS_CANCELLED_TEXT : Colors.TEXT_SECONDARY)
                    }
                />
                <CustomText
                    variant="caption"
                    style={[
                        styles.saveHeaderBtnText,
                        !isDirty && (hasAttemptedSave ? styles.saveHeaderBtnTextError : styles.saveHeaderBtnTextDisabled),
                    ]}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </CustomText>
            </TouchableOpacity>
        </View>
    );

    // Mobile Header Right Actions (Pin Badge only)
    const headerRightActionsMobile = (
        <View style={styles.headerRightRow}>
            {pinBadge}
        </View>
    );

    // Render loading state when fetching trail record
    if (!activeTrail && isLoading) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <View style={styles.stateContainer}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                    <CustomText variant="caption" style={styles.stateText}>
                        Loading trail map details...
                    </CustomText>
                </View>
            </ScreenWrapper>
        );
    }

    // Render missing state if trail does not exist
    if (!activeTrail) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <View style={styles.stateContainer}>
                    <CustomIcon library="Feather" name="alert-circle" size={48} color={Colors.ERROR} />
                    <CustomText variant="subtitle" style={[styles.stateText, styles.stateTextError]}>
                        Trail details not found.
                    </CustomText>
                    <CustomButton
                        title="Go Back"
                        onPress={onBackPress}
                        variant="primary"
                        style={styles.backBtn}
                    />
                </View>
            </ScreenWrapper>
        );
    }

    const editorContent = (
        <View style={styles.screenFlex}>
            {/* Instruction Tip Guidance Banner */}
            <View style={styles.tipBanner}>
                <CustomIcon library="Feather" name="info" size={14} color={Colors.TEXT_SECONDARY} />
                <CustomText variant="caption" style={styles.tipText}>
                    {trailName} · Tap map to place pin. Tap pin to view details, edit, or delete.
                </CustomText>
            </View>

            {/* Map Canvas Viewport */}
            <View style={styles.mapViewport}>
                <StaticTrailMap
                    trailId={activeTrail.id}
                    trailName={trailName}
                    offlinePoints={offlinePoints}
                    isEditable={true}
                    onChange={handlePointsModified}
                />
            </View>

            {/* Mobile Sticky Footer for Thumb-Friendly Save Action */}
            {isMobile && (
                <CustomStickyFooter
                    enableToastDock={true}
                    primaryButton={{
                        title: isSaving ? 'Saving Changes...' : 'Save Offline Points',
                        onPress: handleInitiateSave,
                        disabled: isSaving,
                        validationState: isDirty ? 'valid' : (hasAttemptedSave ? 'error' : 'idle'),
                    }}
                />
            )}

            {/* Save Confirmation Modal */}
            <ConfirmationModal
                visible={showSaveConfirmModal}
                title="Save Offline Points?"
                message={`Are you sure you want to save ${pointCount} offline map ${pointCount === 1 ? 'point' : 'points'} for "${trailName}"?`}
                confirmText="Save Points"
                cancelText="Keep Editing"
                iconName="map-pin"
                onConfirm={handleConfirmSave}
                onClose={() => setShowSaveConfirmModal(false)}
            />

            {/* Discard Unsaved Changes Confirmation Modal */}
            <ConfirmationModal
                visible={showDiscardModal}
                title="Discard Unsaved Map Pins?"
                message="You have unsaved changes to your offline map points. Are you sure you want to leave without saving?"
                confirmText="Discard & Leave"
                cancelText="Keep Editing"
                isDestructive={true}
                iconName="alert-triangle"
                onConfirm={handleConfirmDiscard}
                onClose={() => setShowDiscardModal(false)}
            />
        </View>
    );

    if (isSuperadminShell && !isMobile) {
        return (
            <SuperadminShell
                activeTab="trail"
                pendingCount={pendingCount}
                onTabPress={onTabPress || (() => { })}
                onBackToSettings={onBackToSettings || (() => { })}
                titleOverride={`Map Editor · ${trailName}`}
                leftActionOverride={backHeaderAction}
                rightActions={headerRightActionsWeb}
                noPadding={true}
                noScroll={true}
            >
                {editorContent}
            </SuperadminShell>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                centerTitle={true}
                onBackPress={handleHeaderBack}
                rightActions={isMobile ? headerRightActionsMobile : headerRightActionsWeb}
            >
                <View style={styles.headerContentBox}>
                    <CustomText variant="h3" style={styles.headerTitle}>
                        Map Editor
                    </CustomText>
                    <CustomText variant="caption" style={styles.headerSubtitle}>
                        {trailName}
                    </CustomText>
                </View>
            </CustomHeader>
            {editorContent}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    screenFlex: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.WHITE,
        position: 'relative',
    },
    stateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
    },
    stateText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
    },
    backBtn: {
        marginTop: 12,
        paddingHorizontal: 24,
    },
    headerRightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    badgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.PIN_BADGE_BG,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.PIN_BADGE_BORDER,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.PIN_BADGE_TEXT,
    },
    saveHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
    },
    saveHeaderBtnDisabled: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    saveHeaderBtnError: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
        borderWidth: 1.5,
    },
    saveHeaderBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.WHITE,
    },
    saveHeaderBtnTextDisabled: {
        color: Colors.TEXT_SECONDARY,
    },
    saveHeaderBtnTextError: {
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    tipBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.CHIP_INACTIVE,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    tipText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
    },
    mapViewport: {
        flex: 1,
    },
    backHeaderButton: {
        padding: 6,
        marginLeft: -6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContentBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: 0,
    },
    headerSubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 2,
        marginBottom: 0,
    },
    stateTextError: {
        color: Colors.ERROR,
    },
});

export default TrailMapEditorScreen;
