/**
 * @file PrivacyPermissionsScreen.tsx
 * @description View for managing privacy toggles and device permissions.
 */
import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { IPermissionState, PermissionKey, PermissionStatus } from '@/src/core/models/Permission/Permission.types';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

/**
 * Props for the PrivacyPermissionsScreen component
 * @param onBackPress - Callback to navigate back
 * @param publicProfile - Whether the hiker's profile is public
 * @param shareStats - Whether hiking stats are shared publicly
 * @param activityStatus - Whether the hiker's activity/online status is visible
 * @param onTogglePublicProfile - Callback triggered when the public profile setting is toggled
 * @param onToggleShareStats - Callback triggered when the share stats setting is toggled
 * @param onToggleActivityStatus - Callback triggered when the activity status setting is toggled
 * @param permissionStatuses - Map of permission keys to their current status
 * @param onRequestPermission - Handler to request a permission directly
 */
export interface PrivacyPermissionsScreenProps {
    onBackPress: () => void;
    publicProfile: boolean;
    shareStats: boolean;
    activityStatus: boolean;
    onTogglePublicProfile: (value: boolean) => void;
    onToggleShareStats: (value: boolean) => void;
    onToggleActivityStatus: (value: boolean) => void;
    permissionStatuses: Record<PermissionKey, PermissionStatus>;
    onRequestPermission: (key: PermissionKey) => Promise<IPermissionState>;
}

/**
 * Details interface for permissions confirmation.
 */
interface PermissionDetail {
    title: string;
    consequences: string;
    grantedMessage: string;
    iconName: string;
}

/**
 * Constant details for each permission type shown in the modal.
 */
const PERMISSION_DETAILS: Record<PermissionKey, PermissionDetail> = {
    location: {
        title: "Location Services",
        consequences: "If denied, you cannot view your map position or use safety tracking.\n\nIf allowed, guides can locate you during emergencies.",
        grantedMessage: "Location Services is currently allowed, enabling guides to locate you and track your coordinates during emergencies.\n\nTo manage permissions, please open your device system settings.",
        iconName: "map-pin",
    },
    camera: {
        title: "Camera Access",
        consequences: "If denied, you cannot document trail hazards during emergencies or share images in group chats.\n\nIf allowed, you can capture vital safety updates and upload photos directly to your group chats.",
        grantedMessage: "Camera Access is currently allowed, enabling you to document hazards and share photos in group chats.\n\nTo revoke or disable access, please open your device system settings.",
        iconName: "camera",
    },
    notifications: {
        title: "Push Notifications",
        consequences: "If denied, you may miss critical safety alerts and booking changes.\n\nIf allowed, you will stay fully informed before and during your hike.",
        grantedMessage: "Push Notifications is currently allowed, ensuring you receive urgent weather alerts and booking updates.\n\nTo revoke or disable alerts, please open your device system settings.",
        iconName: "bell",
    },
};

/**
 * Configuration structure for permission row details.
 */
interface PermissionRowConfig {
    key: PermissionKey;
    title: string;
    description: string;
    iconName: string;
}

/**
 * Constant details for each permission type shown in the permissions list.
 */
const PERMISSION_ROWS: PermissionRowConfig[] = [
    {
        key: 'location',
        title: 'Location Services',
        description: 'Required to show your live position on maps and active safety tracking.',
        iconName: 'map-pin',
    },
    {
        key: 'camera',
        title: 'Camera Access',
        description: 'Needed to document trail hazards or upload photos.',
        iconName: 'camera',
    },
    {
        key: 'notifications',
        title: 'Push Notifications',
        description: 'Required for real-time safety alerts and booking updates.',
        iconName: 'bell',
    },
];

/**
 * Safe helper to retrieve permission status without dynamic bracket notation.
 * @param statuses - Map of permission statuses.
 * @param key - The permission key to query.
 * @returns The current permission status.
 */
const getPermissionStatus = (
    statuses: Record<PermissionKey, PermissionStatus>,
    key: PermissionKey
): PermissionStatus => {
    switch (key) {
        case 'location':
            return statuses.location;
        case 'camera':
            return statuses.camera;
        case 'notifications':
            return statuses.notifications;
        default:
            return 'undetermined';
    }
};

/**
 * Safe helper to retrieve permission details without dynamic bracket notation.
 * @param key - The permission key to query.
 * @returns The permission detail configuration.
 */
const getPermissionDetail = (key: PermissionKey): PermissionDetail => {
    switch (key) {
        case 'location':
            return PERMISSION_DETAILS.location;
        case 'camera':
            return PERMISSION_DETAILS.camera;
        case 'notifications':
            return PERMISSION_DETAILS.notifications;
    }
};

/**
 * Props for the PermissionRow component.
 * @param permissionKey - The unique key identifying the permission.
 * @param title - The display title of the permission card.
 * @param description - The display description of what the permission is used for.
 * @param iconName - The name of the Feather icon to render.
 * @param status - The current status of this permission.
 * @param onPress - Callback when the permission card is pressed.
 */
interface PermissionRowProps {
    permissionKey: PermissionKey;
    title: string;
    description: string;
    iconName: string;
    status: PermissionStatus;
    onPress: (key: PermissionKey) => void;
}

/**
 * Reusable permission card row component displaying permission details and its status.
 * @param props - Component props containing key, details, status, and press callback.
 * @returns A React Element rendering the permission card.
 */
const PermissionRow = ({
    permissionKey,
    title,
    description,
    iconName,
    status,
    onPress,
}: PermissionRowProps) => {
    const handlePress = (): void => {
        onPress(permissionKey);
    };

    let badgeText = 'Not Allowed';
    let badgeBgStyle = styles.badgeDenied;
    let badgeTextStyle = styles.badgeTextDenied;

    if (status === 'granted') {
        badgeText = permissionKey === 'location' ? 'Always' : 'Allowed';
        badgeBgStyle = styles.badgeGranted;
        badgeTextStyle = styles.badgeTextGranted;
    } else if (status === 'while-using') {
        badgeText = 'While Using';
        badgeBgStyle = styles.badgeWhileUsing;
        badgeTextStyle = styles.badgeTextWhileUsing;
    }

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.iconWrapper}>
                <CustomIcon library="Feather" name={iconName} size={20} color={Colors.PRIMARY} />
            </View>
            <View style={styles.textBlock}>
                <CustomText variant="body" style={styles.rowTitle}>{title}</CustomText>
                <CustomText variant="caption" style={styles.rowDesc}>{description}</CustomText>
            </View>
            <View style={styles.rightSection}>
                <View style={[styles.badge, badgeBgStyle]}>
                    <CustomText style={[styles.badgeText, badgeTextStyle]}>
                        {badgeText}
                    </CustomText>
                </View>
                <CustomIcon library="Feather" name="chevron-right" size={20} color={Colors.GRAY_MEDIUM} />
            </View>
        </TouchableOpacity>
    );
};

/**
 * PrivacyPermissionsScreen allows users to configure profile visibility and hardware/device access.
 */
const PrivacyPermissionsScreen = ({
    onBackPress,
    publicProfile,
    shareStats,
    activityStatus,
    onTogglePublicProfile,
    onToggleShareStats,
    onToggleActivityStatus,
    permissionStatuses,
    onRequestPermission,
}: PrivacyPermissionsScreenProps) => {
    const { isMobile } = useBreakpoints();
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedPermission, setSelectedPermission] = useState<PermissionDetail | null>(null);

    /**
     * Handles when a permission management card is pressed.
     * Checks if permission is already granted, requests it, or triggers modal settings redirect.
     * @param key - The key of the permission being managed.
     * @returns A promise resolving when management action finishes.
     */
    const handleManagePress = async (key: PermissionKey): Promise<void> => {
        const status = getPermissionStatus(permissionStatuses, key);
        const detail = getPermissionDetail(key);

        if (status === 'granted') {
            // Already granted (Always Allow), show settings modal explaining how to revoke
            if (detail) {
                setSelectedPermission({
                    ...detail,
                    consequences: detail.grantedMessage
                });
                setModalVisible(true);
            }
            return;
        }

        if (status === 'while-using') {
            // Partially granted, show settings modal explaining how to elevate to 'Allow all the time'
            if (detail) {
                setSelectedPermission({
                    ...detail,
                    consequences: "Location access is currently limited to 'While Using App'.\n\nTo enable safety tracking when your screen is locked, please click 'Open Settings' below and set location access to 'Allow all the time'."
                });
                setModalVisible(true);
            }
            return;
        }

        // Try direct permission prompt
        const result = await onRequestPermission(key);

        if (result.status === 'granted' || result.status === 'while-using') {
            // Permission was successfully granted, direct return
            return;
        }

        // If permission was denied and cannot ask again, show the confirmation/redirect modal
        if (!result.canAskAgain) {
            if (detail) {
                setSelectedPermission(detail);
                setModalVisible(true);
            }
        }
    };

    /**
     * Confirms redirection to system settings to manage the permission.
     */
    const handleConfirmManage = (): void => {
        setModalVisible(false);
        Linking.openSettings();
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Privacy & Permissions" centerTitle onBackPress={onBackPress} />
            <ScrollView contentContainerStyle={[styles.content, !isMobile && styles.desktopContent]}>

                <View style={styles.section}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Privacy Settings</CustomText>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="eye" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Public Profile</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Share your profile and completed trails with the Thrail community.</CustomText>
                        </View>
                        <Switch
                            value={publicProfile}
                            onValueChange={onTogglePublicProfile}
                            trackColor={{ true: Colors.PRIMARY }}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="bar-chart-2" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Share Hiking Stats</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Feature your total hiking distance and achievements on leaderboards.</CustomText>
                        </View>
                        <Switch
                            value={shareStats}
                            onValueChange={onToggleShareStats}
                            trackColor={{ true: Colors.PRIMARY }}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="activity" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Show Activity Status</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Show friends and guides when you are currently active on a trail.</CustomText>
                        </View>
                        <Switch
                            value={activityStatus}
                            onValueChange={onToggleActivityStatus}
                            trackColor={{ true: Colors.PRIMARY }}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Device Permissions</CustomText>

                    {PERMISSION_ROWS.map((row) => (
                        <PermissionRow
                            key={row.key}
                            permissionKey={row.key}
                            title={row.title}
                            description={row.description}
                            iconName={row.iconName}
                            status={getPermissionStatus(permissionStatuses, row.key)}
                            onPress={handleManagePress}
                        />
                    ))}
                </View>

            </ScrollView>

            <ConfirmationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={handleConfirmManage}
                title={selectedPermission?.title}
                message={selectedPermission?.consequences}
                cancelText="Cancel"
                confirmText="Open Settings"
                iconName={selectedPermission?.iconName}
                iconLibrary="Feather"
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 48,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.GRAY_MEDIUM,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 16,
        ...GlobalStyles.dropShadow(2),
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBlock: {
        flex: 1,
    },
    rowTitle: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 4,
    },
    rowDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 18,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeGranted: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    badgeWhileUsing: {
        backgroundColor: Colors.STATUS_PENDING_BG,
    },
    badgeDenied: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    badgeTextGranted: {
        color: Colors.STATUS_APPROVED_TEXT,
    },
    badgeTextWhileUsing: {
        color: Colors.STATUS_PENDING_TEXT,
    },
    badgeTextDenied: {
        color: Colors.TEXT_SECONDARY,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    }
});

export default PrivacyPermissionsScreen;
