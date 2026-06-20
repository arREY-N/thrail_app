/**
 * @file PrivacyPermissionsScreen.tsx
 * @description View for managing privacy toggles and device permissions.
 */
import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';

/**
 * Props for the PrivacyPermissionsScreen component
 * @param onBackPress - Callback to navigate back
 * @param publicProfile - Whether the hiker's profile is public
 * @param shareStats - Whether hiking stats are shared publicly
 * @param activityStatus - Whether the hiker's activity/online status is visible
 * @param onTogglePublicProfile - Callback triggered when the public profile setting is toggled
 * @param onToggleShareStats - Callback triggered when the share stats setting is toggled
 * @param onToggleActivityStatus - Callback triggered when the activity status setting is toggled
 */
export interface PrivacyPermissionsScreenProps {
    onBackPress: () => void;
    publicProfile: boolean;
    shareStats: boolean;
    activityStatus: boolean;
    onTogglePublicProfile: (value: boolean) => void;
    onToggleShareStats: (value: boolean) => void;
    onToggleActivityStatus: (value: boolean) => void;
}

/**
 * Details interface for permissions confirmation.
 */
interface PermissionDetail {
    title: string;
    consequences: string;
    iconName: string;
}

/**
 * Constant details for each permission type.
 */
const PERMISSION_DETAILS: Record<string, PermissionDetail> = {
    locationForeground: {
        title: "Foreground Location Services",
        consequences: "Without location services, Thrail cannot display your position on the map or guide you along the trail.",
        iconName: "map-pin",
    },
    locationBackground: {
        title: "Background Location Services",
        consequences: "Disabling background location stops active safety tracking. Guides won't receive your coordinates in an emergency if your screen is locked.",
        iconName: "navigation",
    },
    camera: {
        title: "Camera Access",
        consequences: "Without camera access, you won't be able to take photos of trail blockages or upload a new profile picture.",
        iconName: "camera",
    },
    photos: {
        title: "Photo Library Access",
        consequences: "Without photo access, you won't be able to choose existing trail photos or documents from your library.",
        iconName: "image",
    },
    notifications: {
        title: "Push Notifications",
        consequences: "Without notification access, you will miss critical safety warnings, severe weather alerts, and status updates for your bookings.",
        iconName: "bell",
    },
    storage: {
        title: "Storage & Files Access",
        consequences: "Without storage access, you cannot save maps to navigate offline, which is critical for remote trails.",
        iconName: "folder",
    },
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
}: PrivacyPermissionsScreenProps) => {
    const { isMobile } = useBreakpoints();
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedPermission, setSelectedPermission] = useState<PermissionDetail | null>(null);

    const handleManagePress = (key: string): void => {
        const detail = PERMISSION_DETAILS[key];
        if (detail) {
            setSelectedPermission(detail);
            setModalVisible(true);
        }
    };

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
                    
                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="map-pin" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Location Services</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Required to show your live position on trail maps and guide you during hikes.</CustomText>
                        </View>
                        <CustomButton 
                            title="Manage" 
                            onPress={() => handleManagePress('locationForeground')} 
                            variant="outline"
                            style={styles.manageBtn}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="navigation" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Background Location</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Enables emergency rescue tracking to keep you safe even if the app is closed.</CustomText>
                        </View>
                        <CustomButton 
                            title="Manage" 
                            onPress={() => handleManagePress('locationBackground')} 
                            variant="outline"
                            style={styles.manageBtn}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="camera" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Camera Access</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Needed to take pictures of trail hazards or update your profile photo.</CustomText>
                        </View>
                        <CustomButton 
                            title="Manage" 
                            onPress={() => handleManagePress('camera')} 
                            variant="outline"
                            style={styles.manageBtn}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="image" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Photo Library</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Allows selecting trail pictures or verification documents from your photo library.</CustomText>
                        </View>
                        <CustomButton 
                            title="Manage" 
                            onPress={() => handleManagePress('photos')} 
                            variant="outline"
                            style={styles.manageBtn}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="bell" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Push Notifications</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Delivers urgent weather alerts, trail warnings, and updates on your bookings.</CustomText>
                        </View>
                        <CustomButton 
                            title="Manage" 
                            onPress={() => handleManagePress('notifications')} 
                            variant="outline"
                            style={styles.manageBtn}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="folder" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={styles.rowTitle}>Storage Access</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Allows saving map files to your device so you can navigate trails without cell service.</CustomText>
                        </View>
                        <CustomButton 
                            title="Manage" 
                            onPress={() => handleManagePress('storage')} 
                            variant="outline"
                            style={styles.manageBtn}
                        />
                    </View>
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
    manageBtn: {
        width: 'auto',
        minWidth: 80,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    }
});

export default PrivacyPermissionsScreen;
