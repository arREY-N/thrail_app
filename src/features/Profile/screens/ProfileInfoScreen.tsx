import React from "react";
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import CustomButton from "@/src/components/CustomButton";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import ScreenWrapper from "@/src/components/ScreenWrapper";

import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from "@/src/constants/layout";
import { IUser } from "@/src/core/models/User/User.types";
import { formatDate } from "@/src/core/utility/date";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";

/**
 * Props for the InfoRow component
 */
interface InfoRowProps {
    icon: string;
    label: string;
    value?: string | null;
}

/**
 * Component to display a simple key-value info pair with an icon
 */
export const InfoRow = ({ icon, label, value }: InfoRowProps) => (
    <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
            <CustomIcon library="Feather" name={icon} size={20} color={Colors.PRIMARY} />
        </View>
        <View style={styles.textContainer}>
            <CustomText variant="caption" style={styles.rowLabel}>{label}</CustomText>
            <CustomText variant="body" style={styles.rowValue}>
                {value || "Not provided"}
            </CustomText>
        </View>
    </View>
);

/**
 * Props for the PreferencePill component
 */
interface PreferencePillProps {
    label: string;
}

/**
 * Component to display a small selected preference tag
 */
const PreferencePill = ({ label }: PreferencePillProps) => (
    <View style={styles.pill}>
        <CustomText style={styles.pillText}>{label}</CustomText>
    </View>
);

/**
 * Props for the PreferenceRow component
 */
interface PreferenceRowProps {
    icon: string;
    label: string;
    items?: string[];
}

/**
 * Component to display an array of preferences using pills
 */
const PreferenceRow = ({ icon, label, items }: PreferenceRowProps) => (
    <View style={styles.infoRow}>
        <View style={styles.iconCircle}>
            <CustomIcon library="Feather" name={icon} size={20} color={Colors.PRIMARY} />
        </View>
        <View style={styles.textContainer}>
            <CustomText variant="caption" style={styles.rowLabel}>{label}</CustomText>
            <View style={styles.pillContainer}>
                {items && items.length > 0 ? (
                    items.map((item, idx) => <PreferencePill key={idx} label={item} />)
                ) : (
                    <CustomText variant="body" style={styles.emptyText}>None selected</CustomText>
                )}
            </View>
        </View>
    </View>
);

/**
 * Props for the ProfileInfoScreen component
 */
export interface ProfileInfoScreenProps {
    /** The authenticated user's profile data */
    user: IUser;
    /** Callback to navigate back */
    onBackPress: () => void;
    /** Callback to edit account details */
    onEditPress: () => void;
    /** Callback to delete account */
    onDeletePress: () => void;
}

/**
 * Screen displaying the user's detailed personal information and preferences.
 */
const ProfileInfoScreen = ({ 
    user, 
    onBackPress, 
    onEditPress, 
    onDeletePress 
}: ProfileInfoScreenProps) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Profile Information"
                centerTitle={true}
                onBackPress={onBackPress} 
            />

            <ScrollView 
                style={styles.contentArea}
                contentContainerStyle={[
                    styles.scrollContent,
                    isWideScreen && styles.scrollContentWide
                ]}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <CustomIcon library="Feather" name="user" size={20} color={Colors.BLACK} />
                        <CustomText variant="h3" style={styles.cardTitle}>Personal Details</CustomText>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <InfoRow icon="user" label="Name" value={`${user.firstname} ${user.lastname}`} />
                        <InfoRow icon="at-sign" label="Username" value={`@${user.username}`} />
                        <InfoRow icon="mail" label="Email" value={user.email} />
                        <InfoRow icon="phone" label="Phone Number" value={user.phoneNumber} />
                        <InfoRow icon="calendar" label="Birthday" value={user.birthday ? formatDate(user.birthday as Date) : null} />
                        <InfoRow icon="map-pin" label="Address" value={user.address} />
                    </View>
                </View>

                {user.onBoardingComplete && user.preferences && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <CustomIcon library="Feather" name="sliders" size={20} color={Colors.BLACK} />
                            <CustomText variant="h3" style={styles.cardTitle}>Hiking Preferences</CustomText>
                        </View>

                        <View style={styles.cardBody}>
                            {user.preferences.hiked && (
                                <>
                                    <InfoRow 
                                        icon="bar-chart-2" 
                                        label="Experience Level" 
                                        value={user.preferences.experience || 'None'} 
                                    />
                                    <PreferenceRow 
                                        icon="map" 
                                        label="Preferred Locations" 
                                        items={user.preferences.location} 
                                    />
                                </>
                            )}

                            <PreferenceRow 
                                icon="clock" 
                                label="Preferred Lengths" 
                                items={user.preferences.hike_length} 
                            />

                            <PreferenceRow 
                                icon="navigation" 
                                label="Preferred Provinces" 
                                items={user.preferences.province} 
                            />
                        </View>
                    </View>
                )}

                <View style={styles.actionContainer}>
                    <CustomButton 
                        title="Edit Account"
                        onPress={onEditPress}
                        style={styles.editButton}
                        textStyle={styles.editButtonText}
                    />
                    
                    <CustomButton 
                        title="Delete Account"
                        onPress={onDeletePress}
                        variant="outline"
                        style={styles.deleteButton}
                        textStyle={styles.deleteButtonText}
                    />
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

const styles = StyleSheet.create({
    contentArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        gap: 20,
    },
    scrollContentWide: {
        maxWidth: Layout.MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
    },
    
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    cardTitle: {
        marginBottom: 0,
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardBody: {
        gap: 20,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EAF4EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 2,
    },
    rowLabel: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 12,
        marginBottom: 2,
    },
    rowValue: {
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 15,
    },
    emptyText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
    },

    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    pill: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    pillText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },

    actionContainer: {
        marginTop: 8,
        gap: 12,
    },
    editButton: {
        backgroundColor: Colors.PRIMARY,
        borderRadius: 16,
    },
    editButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    deleteButton: {
        borderColor: Colors.ERROR,
    },
    deleteButtonText: {
        color: Colors.ERROR,
    }
});

export default ProfileInfoScreen;
