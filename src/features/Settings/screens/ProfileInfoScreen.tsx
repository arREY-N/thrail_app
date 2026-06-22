/**
 * @file ProfileInfoScreen.tsx
 * @description Screen displaying and editing user profile information, including personal details, medical profile, emergency contacts, and hiking preferences.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from "@/src/components/ConfirmationModal";
import CustomFeedbackInput from "@/src/components/CustomFeedbackInput";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import CustomTextInput from "@/src/components/CustomTextInput";
import DocumentUploadCard from "@/src/components/DocumentUploadCard";
import ErrorMessage from "@/src/components/ErrorMessage";
import ImagePreviewModal from "@/src/components/ImagePreviewModal";
import ScreenWrapper from "@/src/components/ScreenWrapper";

import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from "@/src/constants/layout";
import { IEmergencyContact, IMedicalProfile, IPreference, IUser } from "@/src/core/models/User/User.types";
import { formatDate } from "@/src/core/utility/date";
import MountainSelectChip from "@/src/features/Auth/components/MountainSelectChip";
import SelectionOption from "@/src/features/Auth/components/SelectionOption";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { IconLibrary } from "@/src/types/ui.types";

const MOUNTAIN_OPTIONS = [
    'Mt. Ayaas (Rizal)', 'Mt. Banahaw (Quezon)', 'Mt. Batulao (Batangas)',
    'Mt. Binacayan (Rizal)', 'Mt. Bira-Bira (Rizal)', 'Mt. Cristobal (Laguna/Quezon)',
    'Mt. Daguldol (Batangas)', 'Mt. Daraitan (Rizal)', 'Mt. Hapunang Banoi (Rizal)',
    'Mt. Irid (Rizal)', 'Mt. Kalisungan (Laguna)', 'Mt. Mabilog (Laguna)',
    'Mt. Maculot (Batangas)', 'Mt. Makiling (Laguna)', 'Mt. Marami (Cavite)',
    'Mt. Pamitinan (Rizal)', 'Mt. Parawagan (Rizal)', 'Mt. Pico de Loro (Cavite)',
    'Mt. Romelo (Laguna)', 'Mt. Sembrano (Rizal)', 'Mt. Sipit Ulang (Rizal)',
    'Mt. Talamitam (Batangas)'
];

const DURATION_OPTIONS = ['1-3 Hour(s)', 'Half-Day', 'Full-Day', 'Overnight', 'Multi-Day'];
const PROVINCE_OPTIONS = ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'];

/**
 * Helper function to extract initials from a user's first and last name.
 * 
 * @param firstName - The user's first name
 * @param lastName - The user's last name
 * @returns The extracted initials (1 or 2 characters)
 */
const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return '?';
};

/**
 * Props for the InfoRow component.
 * @param label - The label describing the detail (e.g., "Username").
 * @param value - The value to display (e.g., "@john_doe").
 * @param noMargin - Optional flag to remove the bottom border and margin.
 */
interface InfoRowProps {
    label: string;
    value?: string | null;
    noMargin?: boolean;
    forceStack?: boolean;
}

/**
 * Renders a row of information with a label and a value.
 * Responsive design automatically stacks the label on top and value on bottom
 * if forceStack is enabled by the parent container.
 */
export const InfoRow = ({ label, value, noMargin, forceStack = false }: InfoRowProps) => {
    const displayValue = value || 'Not provided';

    if (forceStack) {
        return (
            <View style={[styles.stackedRow, noMargin && styles.noMargin]}>
                <CustomText style={styles.inlineLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</CustomText>
                <CustomText style={styles.stackedValue} numberOfLines={2} adjustsFontSizeToFit>{displayValue}</CustomText>
            </View>
        );
    }

    return (
        <View style={[styles.inlineRow, noMargin && styles.noMargin]}>
            <CustomText style={styles.inlineLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</CustomText>
            <CustomText style={styles.inlineValue} numberOfLines={2} adjustsFontSizeToFit>{displayValue}</CustomText>
        </View>
    );
};

/**
 * Props for the ProfileInfoScreen component.
 * @param user - The user object containing profile details.
 * @param onBackPress - Callback when back navigation is triggered.
 * @param onEditPress - Callback when the edit mode is activated.
 * @param isEditing - Indicates if the screen is in editing mode.
 * @param onCancelPress - Callback when editing is cancelled.
 * @param onSavePress - Callback when profile changes are saved.
 */
export interface ProfileInfoScreenProps {
    user: IUser;
    onBackPress: () => void;
    onEditPress: () => void;
    isEditing?: boolean;
    onCancelPress?: () => void;
    onSavePress?: (updatedFields: Partial<IUser>) => void;
}

/**
 * View screen displaying and editing hiker/admin profile information.
 */
const ProfileInfoScreen = ({ 
    user, 
    onBackPress, 
    onEditPress, 
    isEditing = false,
    onCancelPress,
    onSavePress,
}: ProfileInfoScreenProps) => {
    const { isDesktop, isTablet, isMobile, width } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const cardContentWidth = (() => {
        if (isMobile) return width - 80;
        const contentAreaWidth = Math.min(width, Layout.MAX_WIDTH);
        const cardWidth = (contentAreaWidth - 32 - 20) / 2;
        return cardWidth - 48;
    })();

    const checkSectionRequiresStack = (fields: { label: string; value?: string | null }[]) => {
        return fields.some(field => {
            const displayVal = field.value || 'Not provided';
            const estimatedRequiredWidth = field.label.length * 8.0 + displayVal.length * 8.5 + 32;
            return estimatedRequiredWidth > cardContentWidth;
        });
    };

    const personalDetailsFields = [
        { label: "Username", value: user.username ? `@${user.username}` : '' },
        { label: "Phone Number", value: user.phoneNumber },
        { label: "Birthday", value: user.birthday ? formatDate(user.birthday as Date) : null },
        { label: "Email Address", value: user.email },
        { label: "Address", value: user.address }
    ];
    const personalDetailsRequiresStack = checkSectionRequiresStack(personalDetailsFields);

    const emergencyContactFields = [
        { label: "Contact Name", value: user.emergencyContact?.name },
        { label: "Contact Number", value: user.emergencyContact?.contactNumber },
        { label: "Email Address", value: user.emergencyContact?.email }
    ];
    const emergencyContactRequiresStack = checkSectionRequiresStack(emergencyContactFields);

    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [isSaveModalVisible, setIsSaveModalVisible] = useState<boolean>(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState<boolean>(false);

    const [username, setUsername] = useState<string>(user.username || '');
    const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || '');
    const [birthday, setBirthday] = useState<Date | null>(user.birthday ? new Date(user.birthday) : null);
    const [address, setAddress] = useState<string>(user.address || '');
    const [medicalProfile, setMedicalProfile] = useState<IMedicalProfile>(user.medicalProfile || { hasCondition: false, details: '', clearanceUri: '' });
    const [emergencyContact, setEmergencyContact] = useState<IEmergencyContact>(user.emergencyContact || { name: '', contactNumber: '', email: '' });
    const [preferences, setPreferences] = useState<IPreference>(user.preferences || { experience: 'Beginner', location: [], hike_length: [], province: [] });

    const [formError, setFormError] = useState<string | null>(null);

    const clearanceImages = user.medicalProfile?.clearanceUri 
        ? user.medicalProfile.clearanceUri.split(',').map(s => s.trim()).filter(Boolean) 
        : [];

    useEffect(() => {
        if (!isEditing) {
            setUsername(user.username || '');
            setPhoneNumber(user.phoneNumber || '');
            setBirthday(user.birthday ? new Date(user.birthday) : null);
            setAddress(user.address || '');
            setMedicalProfile(user.medicalProfile || { hasCondition: false, details: '', clearanceUri: '' });
            setEmergencyContact(user.emergencyContact || { name: '', contactNumber: '', email: '' });
            setPreferences(user.preferences || { experience: 'Beginner', location: [], hike_length: [], province: [] });
            setFormError(null);
        }
    }, [isEditing, user]);

    const isDirty = 
        username !== (user.username || '') ||
        phoneNumber !== (user.phoneNumber || '') ||
        (birthday?.getTime() !== (user.birthday ? new Date(user.birthday).getTime() : undefined)) ||
        address !== (user.address || '') ||
        JSON.stringify(medicalProfile) !== JSON.stringify(user.medicalProfile || { hasCondition: false, details: '', clearanceUri: '' }) ||
        JSON.stringify(emergencyContact) !== JSON.stringify(user.emergencyContact || { name: '', contactNumber: '', email: '' }) ||
        JSON.stringify(preferences) !== JSON.stringify(user.preferences || { experience: 'Beginner', location: [], hike_length: [], province: [] });

    const handleConfirmEdit = (): void => {
        setIsEditModalVisible(false);
        onEditPress();
    };

    const handleCancelPress = () => {
        if (isDirty) {
            setIsCancelModalVisible(true);
        } else {
            if (onCancelPress) onCancelPress();
        }
    };

    const handleSavePress = () => {
        if (!username.trim()) {
            setFormError("Username is required.");
            return;
        }
        if (medicalProfile.hasCondition && !medicalProfile.details.trim()) {
            setFormError("Please specify your medical condition(s).");
            return;
        }

        setFormError(null);

        if (isDirty) {
            setIsSaveModalVisible(true);
        } else {
            handleSave();
        }
    };

    const handleSave = (): void => {
        if (onSavePress) {
            onSavePress({
                username,
                phoneNumber,
                birthday: birthday ?? undefined,
                address,
                medicalProfile,
                emergencyContact,
                preferences,
            });
        }
    };

    const getRoleDisplayName = (role: string) => {
        if (role === 'superadmin') return 'System Admin';
        if (role === 'admin') return 'Admin';
        return 'Hiker';
    };

    const getRoleColor = (role: string) => {
        if (role === 'superadmin') return Colors.ERROR;
        if (role === 'admin') return Colors.PRIMARY;
        return Colors.SECONDARY;
    };

    const getExperienceStyles = (exp?: string | null) => {
        const level = exp?.toLowerCase() || '';
        if (level.includes('begin') || level.includes('novice')) {
            return {
                bg: Colors.STATUS_PENDING_BG,
                text: Colors.STATUS_PENDING_TEXT,
                icon: 'trail-sign',
                library: 'Ionicons' as IconLibrary,
            };
        }
        if (level.includes('regular') || level.includes('intermed')) {
            return {
                bg: Colors.STATUS_APPROVED_BG,
                text: Colors.STATUS_APPROVED_TEXT,
                icon: 'compass',
                library: 'Ionicons' as IconLibrary,
            };
        }
        if (level.includes('exper') || level.includes('adv')) {
            return {
                bg: Colors.STATUS_WARNING_BG,
                text: Colors.STATUS_WARNING_TEXT,
                icon: 'trophy',
                library: 'Ionicons' as IconLibrary,
            };
        }
        return {
            bg: Colors.GRAY_ULTRALIGHT,
            text: Colors.TEXT_SECONDARY,
            icon: 'help-circle',
            library: 'Feather' as IconLibrary,
        };
    };

    // Render clean gamified chips without gray borders
    const renderGamifiedChips = (items?: string[], iconName?: string, isWarning?: boolean) => {
        if (!items || items.length === 0) {
            return (
                <View style={styles.emptyGamifiedChip}>
                    <CustomText style={styles.emptyGamifiedChipText}>Not specified</CustomText>
                </View>
            );
        }
        return (
            <View style={styles.gamifiedChipContainer}>
                {items.map((item, index) => (
                    <View key={index} style={[
                        styles.gamifiedChip,
                        isWarning && { backgroundColor: Colors.STATUS_PENDING_BG }
                    ]}>
                        {iconName && <CustomIcon library="Feather" name={iconName} size={12} color={isWarning ? Colors.STATUS_PENDING_TEXT : Colors.STATUS_APPROVED_TEXT} style={styles.gamifiedChipIcon} />}
                        <CustomText style={[
                            styles.gamifiedChipText,
                            isWarning && { color: Colors.STATUS_PENDING_TEXT }
                        ]}>{item}</CustomText>
                    </View>
                ))}
            </View>
        );
    };

    const expStyles = getExperienceStyles(user.preferences?.experience);
    const showMedicalProfile = user.medicalProfile && (user.medicalProfile.hasCondition || user.medicalProfile.clearanceUri);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title={isEditing ? "Edit Profile" : "Profile Information"}
                centerTitle={true}
                onBackPress={isEditing ? undefined : onBackPress} 
                leftAction={
                    isEditing ? (
                        <TouchableOpacity 
                            onPress={handleCancelPress} 
                            style={styles.headerCancelButton} 
                            activeOpacity={0.7}
                        >
                            <CustomText style={styles.cancelText}>Cancel</CustomText>
                        </TouchableOpacity>
                    ) : undefined
                }
                rightActions={
                    isEditing ? (
                        <TouchableOpacity 
                            onPress={handleSavePress} 
                            style={[
                                styles.headerSaveButton,
                                !isDirty && styles.headerSaveButtonDisabled
                            ]} 
                            disabled={!isDirty}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                style={[
                                    styles.saveText,
                                    !isDirty && styles.saveTextDisabled
                                ]}
                            >
                                Save
                            </CustomText>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={styles.headerActionButton}
                            onPress={() => setIsEditModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="edit-2" 
                                size={20} 
                                color={Colors.PRIMARY} 
                            />
                        </TouchableOpacity>
                    )
                }
            />

            <ScrollView 
                style={styles.contentArea}
                contentContainerStyle={[
                    styles.scrollContent,
                    isWideScreen && styles.scrollContentWide
                ]}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.profileHeaderBanner}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <CustomText style={styles.avatarInitial} numberOfLines={1} adjustsFontSizeToFit>
                                {getInitials(user.firstname, user.lastname)}
                            </CustomText>
                        </View>
                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                            <CustomText style={styles.roleText} numberOfLines={1} adjustsFontSizeToFit>{getRoleDisplayName(user.role)}</CustomText>
                        </View>
                    </View>
                    <View style={styles.nameContainer}>
                        <CustomText variant="h2" style={styles.profileName} numberOfLines={1} adjustsFontSizeToFit>
                            {user.firstname} {user.lastname}
                        </CustomText>
                        {user.createdAt && (
                            <CustomText variant="caption" style={styles.memberSinceText} numberOfLines={1} adjustsFontSizeToFit>
                                Member since {formatDate(user.createdAt, 'full')}
                            </CustomText>
                        )}
                    </View>
                </View>

                {isEditing && formError && (
                    <ErrorMessage error={formError} />
                )}
                <View style={!isMobile ? styles.desktopColumns : styles.mobileStack}>
                    
                    {/* LEFT COLUMN */}
                    <View style={[styles.column, isWideScreen && styles.columnWide]}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <CustomIcon library="Feather" name="user" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Personal Details</CustomText>
                            </View>
                            
                            <View style={styles.cardBody}>
                                {isEditing ? (
                                    <View style={styles.editForm}>
                                        <CustomTextInput label="Username" placeholder="Enter username" value={username} onChangeText={setUsername} icon="at-sign" />
                                        <CustomTextInput label="Phone Number" placeholder="Enter phone number" value={phoneNumber} onChangeText={setPhoneNumber} type="phone" icon="phone" />
                                        <CustomTextInput label="Birthday" placeholder="Select birthday" value={birthday} onChangeText={setBirthday} type="calendar" icon="calendar" iconPosition="left" />
                                        <CustomTextInput label="Address" placeholder="Enter address" value={address} onChangeText={setAddress} icon="map-pin" style={styles.noMarginBottom} />
                                    </View>
                                ) : (
                                    <View>
                                        <InfoRow label="Username" value={`@${user.username}`} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Phone Number" value={user.phoneNumber} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Birthday" value={user.birthday ? formatDate(user.birthday as Date) : null} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Email Address" value={user.email} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Address" value={user.address} noMargin={true} forceStack={personalDetailsRequiresStack} />
                                    </View>
                                )}
                            </View>
                        </View>

                        {user.emergencyContact && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <CustomIcon library="Feather" name="phone-call" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Emergency Contact</CustomText>
                                </View>
                                <View style={styles.cardBody}>
                                    {isEditing ? (
                                        <View style={styles.editForm}>
                                            <CustomTextInput label="Contact Name" placeholder="Enter emergency contact name" value={emergencyContact.name} onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, name: text }))} icon="user" />
                                            <CustomTextInput label="Contact Number" placeholder="Enter emergency contact number" value={emergencyContact.contactNumber} onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, contactNumber: text }))} type="phone" icon="phone" />
                                            <CustomTextInput label="Email Address" placeholder="Enter emergency contact email" value={emergencyContact.email} onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, email: text }))} icon="mail" style={styles.noMarginBottom} />
                                        </View>
                                    ) : (
                                        <View>
                                            <InfoRow label="Contact Name" value={user.emergencyContact.name} forceStack={emergencyContactRequiresStack} />
                                            <InfoRow label="Contact Number" value={user.emergencyContact.contactNumber} forceStack={emergencyContactRequiresStack} />
                                            <InfoRow label="Email Address" value={user.emergencyContact.email} noMargin={true} forceStack={emergencyContactRequiresStack} />
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* RIGHT COLUMN */}
                    <View style={[styles.column, isWideScreen && styles.columnWide]}>
                        {(showMedicalProfile || isEditing) && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <CustomIcon library="Feather" name="activity" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Medical Profile</CustomText>
                                </View>
                                <View style={styles.cardBody}>
                                    {isEditing ? (
                                        <View style={styles.editForm}>
                                            <CustomText variant="caption" style={styles.inputLabel}>Do you have any pre-existing medical conditions?</CustomText>
                                            <View style={styles.medicalToggleContainer}>
                                                <SelectionOption label="Yes" selected={medicalProfile.hasCondition === true} onPress={() => setMedicalProfile(prev => ({ ...prev, hasCondition: true }))} style={styles.medicalToggleOption} />
                                                <SelectionOption label="No" selected={medicalProfile.hasCondition === false} onPress={() => setMedicalProfile(prev => ({ ...prev, hasCondition: false }))} style={styles.medicalToggleOption} />
                                            </View>
                                            {medicalProfile.hasCondition && (
                                                <>
                                                    <CustomFeedbackInput label="Specify your condition(s)" placeholder="e.g. Asthma, Hypertension, Allergies..." value={medicalProfile.details} onChangeText={(text) => setMedicalProfile(prev => ({ ...prev, details: text }))} suggestions={["Asthma", "Allergies", "Hypertension", "Heart Condition", "Diabetes"]} />
                                                    <View style={{ marginTop: 16 }}>
                                                        <DocumentUploadCard docName="Medical Clearance" docKey="medicalClearance" isUploaded={medicalProfile.clearanceUri || false} onUploadSuccess={(url) => setMedicalProfile(prev => ({ ...prev, clearanceUri: url }))} onDelete={() => setMedicalProfile(prev => ({ ...prev, clearanceUri: '' }))} />
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    ) : (
                                        <View>
                                            {user.medicalProfile?.hasCondition && (
                                                <View style={[styles.stackedRow, { marginBottom: 8 }]}>
                                                    <CustomText style={styles.inlineLabel}>Medical Condition</CustomText>
                                                    <View style={{ marginTop: 8 }}>
                                                        {renderGamifiedChips(
                                                            user.medicalProfile.details ? user.medicalProfile.details.split(',').map(s => s.trim()).filter(Boolean) : [],
                                                            undefined,
                                                            true
                                                        )}
                                                    </View>
                                                </View>
                                            )}

                                            {clearanceImages.length > 0 ? (
                                                <View style={{ marginTop: user.medicalProfile?.hasCondition ? 8 : 0 }}>
                                                    <CustomText style={[styles.inlineLabel, { marginBottom: 12 }]}>Medical Document</CustomText>
                                                    <TouchableOpacity style={styles.largeImageWrapper} activeOpacity={0.9} onPress={() => setIsImageModalVisible(true)}>
                                                        <Image source={{ uri: clearanceImages[0] }} style={styles.largeImage} resizeMode="cover" />
                                                        <LinearGradient colors={['transparent', `${Colors.BLACK}99`]} style={styles.largeImageGradient}>
                                                            <View style={{ flex: 1 }} />
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                {clearanceImages.length > 1 && (
                                                                    <View style={styles.imageCountBadge}>
                                                                        <CustomText style={styles.imageCountText}>{`+${clearanceImages.length - 1}`}</CustomText>
                                                                    </View>
                                                                )}
                                                                <View style={styles.imageMaximizeBadge}>
                                                                    <CustomIcon library="Feather" name="maximize-2" size={14} color={Colors.WHITE} />
                                                                </View>
                                                            </View>
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : null}
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {user.onBoardingComplete && user.preferences && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <CustomIcon library="Feather" name="sliders" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Hiking Preferences</CustomText>
                                </View>

                                <View style={styles.cardBody}>
                                    {isEditing ? (
                                        <View style={styles.editForm}>
                                            <View style={styles.preferenceEditGroup}>
                                                <CustomText variant="caption" style={styles.inputLabel}>Experience Level (Read Only)</CustomText>
                                                <View style={[styles.experienceBadge, { backgroundColor: expStyles.bg, marginLeft: 0 }]}>
                                                    <CustomText variant="body" style={[styles.experienceBadgeText, { color: expStyles.text }]}>
                                                        {preferences.experience || 'Not set'}
                                                    </CustomText>
                                                </View>
                                            </View>

                                            <View style={styles.preferenceEditGroup}>
                                                <CustomText variant="caption" style={styles.inputLabel}>Preferred Duration</CustomText>
                                                <View style={styles.toggleChipsContainer}>
                                                    {DURATION_OPTIONS.map((opt) => {
                                                        const isSelected = (preferences.hike_length || []).includes(opt);
                                                        return (
                                                            <TouchableOpacity key={opt} style={[styles.toggleChip, isSelected && styles.toggleChipActive]} onPress={() => {
                                                                const current = preferences.hike_length || [];
                                                                const updated = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
                                                                setPreferences(prev => ({ ...prev, hike_length: updated }));
                                                            }} activeOpacity={0.7}>
                                                                <CustomIcon library="Feather" name={isSelected ? "check" : "plus"} size={12} color={isSelected ? Colors.PRIMARY : Colors.TEXT_SECONDARY} />
                                                                <CustomText variant="caption" style={[styles.toggleChipText, isSelected && styles.toggleChipTextActive]}>{opt}</CustomText>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>

                                            <View style={styles.preferenceEditGroup}>
                                                <CustomText variant="caption" style={styles.inputLabel}>Favorite Destinations</CustomText>
                                                <MountainSelectChip options={MOUNTAIN_OPTIONS} selectedValues={preferences.location || []} onToggle={(value) => {
                                                    const current = preferences.location || [];
                                                    const updated = current.includes(value) ? current.filter(x => x !== value) : [...current, value];
                                                    setPreferences(prev => ({ ...prev, location: updated }));
                                                }} />
                                            </View>

                                            <View style={[styles.preferenceEditGroup, styles.noMarginBottom]}>
                                                <CustomText variant="caption" style={styles.inputLabel}>Preferred Provinces</CustomText>
                                                <View style={styles.toggleChipsContainer}>
                                                    {PROVINCE_OPTIONS.map((opt) => {
                                                        const isSelected = (preferences.province || []).includes(opt);
                                                        return (
                                                            <TouchableOpacity key={opt} style={[styles.toggleChip, isSelected && styles.toggleChipActive]} onPress={() => {
                                                                const current = preferences.province || [];
                                                                const updated = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
                                                                setPreferences(prev => ({ ...prev, province: updated }));
                                                            }} activeOpacity={0.7}>
                                                                <CustomIcon library="Feather" name={isSelected ? "check" : "plus"} size={12} color={isSelected ? Colors.PRIMARY : Colors.TEXT_SECONDARY} />
                                                                <CustomText variant="caption" style={[styles.toggleChipText, isSelected && styles.toggleChipTextActive]}>{opt}</CustomText>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        </View>
                                    ) : (
                                        <View>
                                            {/* Experience Level Bar */}
                                            {(() => {
                                                const LEVELS = ['Beginner', 'Regular', 'Experienced'];
                                                const currentExp = user.preferences.experience || 'Beginner';
                                                const currentLevelIndex = Math.max(0, LEVELS.findIndex(l => l.toLowerCase() === currentExp.toLowerCase().trim()));

                                                return (
                                                    <View style={styles.expBarContainer}>
                                                        <View style={styles.expBarHeader}>
                                                            <View style={styles.expBarTextContainer}>
                                                                <CustomText style={styles.expBarLabel} numberOfLines={1} adjustsFontSizeToFit>Hiking Experience</CustomText>
                                                                <CustomText variant="h2" style={[styles.expBarValue, { color: expStyles.text }]} numberOfLines={1} adjustsFontSizeToFit>
                                                                    {currentExp}
                                                                </CustomText>
                                                            </View>
                                                            <View style={[styles.expBarIconWrapper, { backgroundColor: expStyles.bg }]}>
                                                                <CustomIcon library={expStyles.library} name={expStyles.icon} size={20} color={expStyles.text} />
                                                            </View>
                                                        </View>

                                                        <View style={styles.segmentsContainer}>
                                                            {LEVELS.map((lvl, idx) => {
                                                                const isActive = idx <= currentLevelIndex;
                                                                const isCurrent = idx === currentLevelIndex;
                                                                return (
                                                                    <View key={lvl} style={{ flex: 1, alignItems: 'center' }}>
                                                                        <View style={[
                                                                            styles.segment, 
                                                                            isActive && { backgroundColor: expStyles.text },
                                                                            idx === 0 && styles.segmentFirst,
                                                                            idx === LEVELS.length - 1 && styles.segmentLast,
                                                                        ]} />
                                                                        <CustomText 
                                                                            numberOfLines={1} 
                                                                            adjustsFontSizeToFit 
                                                                            style={[
                                                                                styles.segmentLabelText, 
                                                                                isActive && { color: Colors.TEXT_PRIMARY, fontWeight: 'bold' },
                                                                                isCurrent && { color: expStyles.text }
                                                                            ]}
                                                                        >
                                                                            {lvl}
                                                                        </CustomText>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>
                                                );
                                            })()}

                                            {/* Unified Gamified Preferences */}
                                            <View style={styles.preferencesSection}>
                                                <CustomText style={[styles.inlineLabel, { marginBottom: 6 }]}>Preferred Duration</CustomText>
                                                {renderGamifiedChips(user.preferences.hike_length, "clock")}
                                            </View>

                                            <View style={styles.preferencesSection}>
                                                <CustomText style={[styles.inlineLabel, { marginBottom: 6 }]}>Favorite Destinations</CustomText>
                                                {renderGamifiedChips(user.preferences.location, "map-pin")}
                                            </View>

                                            <View style={[styles.preferencesSection, styles.noMarginBottom]}>
                                                <CustomText style={[styles.inlineLabel, { marginBottom: 6 }]}>Preferred Provinces</CustomText>
                                                {renderGamifiedChips(user.preferences.province, "navigation")}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                </View>
                
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Modals remain exactly the same */}
            <ConfirmationModal visible={isEditModalVisible} title="Edit Profile" message="Are you sure you want to edit this profile information? You will be redirected to the edit screen." onConfirm={handleConfirmEdit} onClose={() => setIsEditModalVisible(false)} confirmText="Edit" cancelText="Cancel" />
            <ConfirmationModal visible={isSaveModalVisible} title="Save Changes" message="You have made changes to your profile. Do you want to save them?" onConfirm={() => { setIsSaveModalVisible(false); handleSave(); }} onClose={() => setIsSaveModalVisible(false)} confirmText="Save" cancelText="Keep Editing" />
            <ConfirmationModal visible={isCancelModalVisible} title="Discard Changes" message="You have unsaved changes. Are you sure you want to discard them?" onConfirm={() => { setIsCancelModalVisible(false); if (onCancelPress) onCancelPress(); }} onClose={() => setIsCancelModalVisible(false)} confirmText="Discard" cancelText="Keep Editing" />

            {clearanceImages.length > 0 && (
                <ImagePreviewModal visible={isImageModalVisible} images={clearanceImages} onClose={() => setIsImageModalVisible(false)} />
            )}
            
        </ScreenWrapper>
    );
};

const dropShadow = GlobalStyles.dropShadow(2);

const styles = StyleSheet.create({
    contentArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        gap: 20,
    },
    scrollContentWide: {
        maxWidth: Layout.MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
    },
    headerActionButton: {
        padding: 8,
    },
    desktopColumns: {
        flexDirection: 'row',
        gap: 20,
    },
    mobileStack: {
        flexDirection: 'column',
        gap: 20,
    },
    column: {
        gap: 20,
    },
    columnWide: {
        flex: 1,
    },
    profileHeaderBanner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    nameContainer: {
        alignItems: 'center',
        gap: 2,
    },
    avatarCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(3),
    },
    avatarInitial: {
        color: Colors.WHITE,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    profileName: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 0,
        fontSize: 20,
        textAlign: 'center',
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginTop: -16,
        borderWidth: 2,
        borderColor: Colors.WHITE,
        zIndex: 10,
        ...GlobalStyles.dropShadow(2),
    },
    roleText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    memberSinceText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        textAlign: 'center',
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    cardTitle: {
        marginBottom: 0,
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardBody: {
        flexDirection: 'column',
    },
    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        flexWrap: 'wrap',
    },
    inlineLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
    },
    inlineValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
    },
    stackedRow: {
        flexDirection: 'column',
        paddingVertical: 12,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    stackedLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stackedValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: '700',
    },
    noMargin: {
        marginBottom: 0,
        paddingBottom: 0,
        borderBottomWidth: 0,
    },
    largeImageWrapper: {
        position: 'relative',
        height: 180,
        width: '100%',
        borderRadius: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(2),
    },
    largeImage: {
        width: '100%',
        height: '100%',
    },
    largeImageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 12,
    },
    imageCountBadge: {
        backgroundColor: `${Colors.BLACK}A6`,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 12,
    },
    imageMaximizeBadge: {
        backgroundColor: `${Colors.BLACK}A6`,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expBarContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        marginBottom: 24,
        ...GlobalStyles.dropShadow(1),
    },
    expBarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    expBarTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    expBarLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
        marginBottom: 6,
    },
    expBarTitle: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    expBarValue: {
        fontSize: 20,
        marginBottom: 0,
    },
    expBarIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    segmentsContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    segment: {
        width: '100%',
        height: 10,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 8,
        borderRadius: 2,
    },
    segmentFirst: {
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    segmentLast: {
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    segmentLabelText: {
        fontSize: 10,
        color: Colors.TEXT_PLACEHOLDER,
        fontWeight: '600',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    preferenceEditGroup: {
        marginBottom: 20,
    },
    preferencesSection: {
        marginBottom: 24,
    },
    gamifiedChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gamifiedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexShrink: 1,
        maxWidth: '100%',
    },
    gamifiedChipIcon: {
        marginRight: 6,
    },
    gamifiedChipText: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '700',
        fontSize: 12,
        flexShrink: 1,
    },
    emptyGamifiedChip: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    emptyGamifiedChipText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
        fontSize: 12,
    },
    experienceBadge: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    experienceBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    editForm: {
        flexDirection: 'column',
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    headerCancelButton: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    headerSaveButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    headerSaveButtonDisabled: {
        backgroundColor: Colors.GRAY_LIGHT,
    },
    cancelText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    saveTextDisabled: {
        color: Colors.GRAY_MEDIUM,
    },
    bottomSpacer: {
        height: 40,
    },
    medicalToggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    medicalToggleOption: {
        flex: 1,
        marginBottom: 0,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    toggleChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    toggleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    toggleChipActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.WHITE,
    },
    toggleChipText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    toggleChipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
});

export default ProfileInfoScreen;