/**
 * @file SettingsScreen.tsx
 * @description Main Settings screen where users can configure app preferences, account details, and view info.
 */
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for SectionHeader component
 * @param title - The title to display
 */
export interface SectionHeaderProps {
    title: string;
}

/**
 * A header component for settings sections
 */
const SectionHeader = ({ title }: SectionHeaderProps) => (
    <CustomText variant="h3" style={styles.sectionHeader}>
        {title}
    </CustomText>
);

/**
 * Props for SettingsItem component
 * @param icon - The name of the icon
 * @param library - The icon library to use (defaults to Feather)
 * @param title - The title of the setting
 * @param onPress - Callback when pressed
 * @param isDestructive - Whether it is a destructive action
 */
export interface SettingsItemProps {
    icon: string;
    library?: IconLibrary;
    title: string;
    onPress: () => void;
    isDestructive?: boolean;
}

/**
 * A selectable item row within the settings list
 */
const SettingsItem = ({ icon, library = "Feather", title, onPress, isDestructive }: SettingsItemProps) => (
    <TouchableOpacity 
        style={styles.itemContainer} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.itemLeft}>
            <View style={[styles.iconCircle, isDestructive && styles.iconCircleDestructive]}>
                <CustomIcon 
                    library={library} 
                    name={icon} 
                    size={20} 
                    color={isDestructive ? Colors.ERROR : Colors.PRIMARY} 
                />
            </View>
            <CustomText 
                variant="body" 
                style={[styles.itemTitle, isDestructive && styles.itemTitleDestructive]}
            >
                {title}
            </CustomText>
        </View>
        <CustomIcon 
            library="Feather" 
            name="chevron-right" 
            size={20} 
            color={Colors.GRAY_MEDIUM} 
        />
    </TouchableOpacity>
);


/**
 * Props for the SettingsScreen component
 */
export interface SettingsScreenProps {
    /** The active role of the current user */
    role?: string;
    /** Callback to navigate back */
    onBackPress: () => void;
    /** Callback to navigate to profile information screen */
    onProfileInfoPress: () => void;
    /** Callback to navigate to Security Settings */
    onSecurityPress: () => void;
    /** Callback to navigate to admin dashboard */
    onAdminPress: () => void;
    /** Callback to navigate to superadmin dashboard */
    onSuperadminPress: () => void;
    /** Callback to navigate to business application form */
    onApplyPress?: () => void;
    /** Callback to navigate to Privacy & Permissions Settings */
    onPrivacySettingsPress: () => void;
    /** Callback to navigate to Notifications Settings */
    onNotificationsPress: () => void;
    /** Callback to navigate to About Screen */
    onAboutPress: () => void;
    /** Callback for initiating user sign out */
    onSignOutPress: () => void;
}

/**
 * Main Settings screen where users can configure app preferences, account details, and view info.
 */
const SettingsScreen = ({
    role,
    onBackPress,
    onProfileInfoPress,
    onSecurityPress,
    
    onAdminPress,
    onSuperadminPress,
    onApplyPress,
    
    onNotificationsPress,
    onPrivacySettingsPress,
    
    onAboutPress,
    onSignOutPress
}: SettingsScreenProps) => {

    const [showSignOutModal, setShowSignOutModal] = useState<boolean>(false);
    const { isMobile } = useBreakpoints();

    const handleConfirmSignOut = () => {
        setShowSignOutModal(false);
        onSignOutPress();
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showSignOutModal}
                title="Log Out Confirmation"
                message="Are you sure you want to log out?"
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={handleConfirmSignOut}
                onClose={() => setShowSignOutModal(false)}
            />

            <CustomHeader 
                title="Settings"
                centerTitle={true}
                onBackPress={onBackPress} 
            />

            <ScrollView 
                style={styles.contentArea}
                contentContainerStyle={[styles.scrollContent, !isMobile && styles.desktopContent]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <SectionHeader title="Account & Security" />
                    <SettingsItem icon="user" title="Profile Information" onPress={onProfileInfoPress} />
                    <SettingsItem icon="shield" title="Security" onPress={onSecurityPress} />
                    
                    {role === 'superadmin' && (
                        <>
                            <SettingsItem icon="briefcase" title="Apply for Business Account" onPress={onApplyPress || (() => {})} />
                            <SettingsItem icon="database" title="Superadmin Dashboard" onPress={onSuperadminPress} />
                        </>
                    )}
                    
                    {role === 'admin' && (
                        <SettingsItem icon="command" title="Admin Dashboard" onPress={onAdminPress} />
                    )}
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Access & Control" />
                    <SettingsItem icon="bell" title="Notifications" onPress={onNotificationsPress} />
                    <SettingsItem icon="lock" title="Privacy & Permissions" onPress={onPrivacySettingsPress} />
                </View>

                <View style={styles.section}>
                    <SectionHeader title="App Information" />
                    <SettingsItem icon="info" title="About The App" onPress={onAboutPress} />
                </View>

                <View style={styles.logoutContainer}>
                    <CustomButton 
                        title="Log Out"
                        onPress={() => setShowSignOutModal(true)}
                        variant="primary" 
                        style={styles.logoutButton}
                    />
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    contentArea: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 60,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },

    section: {
        marginBottom: 32,
        gap: 8,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 8,
    },
    
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleDestructive: {
        backgroundColor: Colors.ERROR_BG,
    },
    itemTitle: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        fontSize: 15,
    },
    itemTitleDestructive: {
        color: Colors.ERROR,
    },

    logoutContainer: {
        // marginTop: 16,
        alignItems: 'center',
    },
    logoutButton: {
        // borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        width: 200,
        borderRadius: 24,
    },
});

export default SettingsScreen;
