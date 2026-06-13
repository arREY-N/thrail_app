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
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for SectionHeader component
 */
interface SectionHeaderProps {
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
 */
interface SettingsItemProps {
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
    /** Callback for initiating user sign out */
    onSignOutPress: () => void;
    /** Callback to navigate to admin dashboard */
    onAdminPress: () => void;
    /** Callback to navigate to superadmin dashboard */
    onSuperadminPress: () => void;
    /** Callback to navigate to business application form */
    onApplyPress: () => void;
    /** Callback to navigate to profile information screen */
    onProfileInfoPress: () => void;
    /** Callback to navigate to Terms & Conditions */
    onTerms: () => void;
    /** Callback to navigate to Privacy Policy */
    onPrivacy: () => void;
}

/**
 * Main Settings screen where users can configure app preferences, account details, and view info.
 */
const SettingsScreen = ({
    role,
    onBackPress,
    onSignOutPress,
    onAdminPress,
    onSuperadminPress,
    onApplyPress,
    onProfileInfoPress,
    onTerms,
    onPrivacy
}: SettingsScreenProps) => {

    const [showSignOutModal, setShowSignOutModal] = useState<boolean>(false);

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
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <SectionHeader title="Account" />
                    <SettingsItem icon="user" title="Profile Information" onPress={onProfileInfoPress} />
                    {/* <SettingsItem icon="lock" title="Change Password" onPress={() => {}} /> */}
                    
                    {role === 'superadmin' && (
                        <>
                            <SettingsItem icon="briefcase" title="Apply for Business Account" onPress={onApplyPress} />
                            <SettingsItem icon="database" title="Superadmin Dashboard" onPress={onSuperadminPress} />
                        </>
                    )}
                    
                    {role === 'admin' && (
                        <SettingsItem icon="command" title="Admin Dashboard" onPress={onAdminPress} />
                    )}
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Hiking Setup" />
                    {/* <SettingsItem icon="map" title="Downloaded Maps" onPress={() => {}} /> */}
                    <SettingsItem icon="sliders" title="Hiking Preferences" onPress={() => {}} />
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Access & Control" />
                    <SettingsItem icon="shield" title="Privacy & Permissions" onPress={() => {}} />
                </View>

                <View style={styles.section}>
                    <SectionHeader title="App Information" />
                    <SettingsItem icon="info" title="About The App" onPress={() => {}} />
                    <SettingsItem icon="file-text" title="Terms & Conditions" onPress={onTerms} />
                    <SettingsItem icon="file-text" title="Privacy Policy" onPress={onPrivacy} />
                </View>

                <View style={styles.logoutContainer}>
                    <CustomButton 
                        title="Log Out"
                        onPress={() => setShowSignOutModal(true)}
                        variant="outline" 
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

    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 16,
    },
    
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        marginBottom: 8,
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
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        width: '60%',
        borderRadius: 24,
    },
});

export default SettingsScreen;
