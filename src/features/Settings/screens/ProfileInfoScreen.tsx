/**
 * @file ProfileInfoScreen.tsx
 * @description Screen displaying and editing user profile information, including personal details, medical profile, emergency contacts, and hiking preferences.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';

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

import EmergencyModal from "@/src/components/EmergencyModal";
import { Colors } from "@/src/constants/colors";
import { Layout } from "@/src/constants/layout";
import { IUser } from "@/src/core/models/User/User";
import { formatDateToStandard } from "@/src/utils/dateFormatter";
import MountainSelectChip from "@/src/features/Auth/components/MountainSelectChip";
import SelectionOption from "@/src/features/Auth/components/SelectionOption";
import { useProfileForm } from "@/src/features/Settings/hooks/useProfileForm";
import { styles } from "@/src/features/Settings/styles/ProfileInfoStyles";
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

export const formatPhoneWithPrefix = (phone?: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('63')) {
        cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 10) {
        return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return `+63 ${cleaned}`;
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

    const emergencyContactFields = [
        { label: "Contact Name", value: user.emergencyContact?.name },
        { label: "Contact Number", value: user.emergencyContact?.contactNumber },
        { label: "Email Address", value: user.emergencyContact?.email }
    ];
    const personalDetailsFields = [
        { label: "Username", value: user.username ? `@${user.username}` : '' },
        { label: "Phone Number", value: user.phoneNumber },
        { label: "Birthday", value: user.birthday ? formatDateToStandard(user.birthday) : null },
        { label: "Email Address", value: user.email },
        { label: "Address", value: user.address }
    ];


    const personalDetailsRequiresStack = isWideScreen ? false : (isMobile ? checkSectionRequiresStack(personalDetailsFields) : false);
    const emergencyContactRequiresStack = isWideScreen ? false : (isMobile ? checkSectionRequiresStack(emergencyContactFields) : false);

    const {
        isEditModalVisible,
        setIsEditModalVisible,
        isSaveModalVisible,
        setIsSaveModalVisible,
        isCancelModalVisible,
        setIsCancelModalVisible,
        isImageModalVisible,
        setIsImageModalVisible,
        isEmergencyModalVisible,
        setIsEmergencyModalVisible,
        username,
        setUsername,
        phoneNumber,
        setPhoneNumber,
        birthday,
        setBirthday,
        address,
        setAddress,
        medicalProfile,
        setMedicalProfile,
        emergencyContact,
        setEmergencyContact,
        preferences,
        setPreferences,
        searchEmail,
        setSearchEmail,
        isSearching,
        searchError,
        searchSuccess,
        searchInfo,
        formError,
        isDirty,
        handleConfirmEdit,
        handleEmergencySearch,
        handleCancelPress,
        handleSavePress,
        handleSave,
    } = useProfileForm({ user, isEditing, onSavePress, onCancelPress, onEditPress });

    const clearanceImages = medicalProfile?.clearanceUri
        ? medicalProfile.clearanceUri.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const getRoleDisplayName = (role: string) => {
        if (role === 'superadmin') return 'System Admin';
        if (role === 'admin') return 'Admin';
        return 'Hiker';
    };

    const getRoleColor = (role: string) => {
        if (role === 'superadmin') return Colors.ROLE_SUPERADMIN_BG;
        if (role === 'admin') return Colors.ROLE_ADMIN_BG;
        return Colors.ROLE_HIKER_BG;
    };

    const getExperienceStyles = (exp?: string | null) => {
        const level = exp?.toLowerCase() || '';
        if (level.includes('begin') || level.includes('novice')) {
            return {
                bg: Colors.EXP_BEGINNER_BG,
                text: Colors.EXP_BEGINNER_TEXT,
                icon: 'trail-sign',
                library: 'Ionicons' as IconLibrary,
            };
        }
        if (level.includes('regular') || level.includes('intermed')) {
            return {
                bg: Colors.EXP_REGULAR_BG,
                text: Colors.EXP_REGULAR_TEXT,
                icon: 'compass',
                library: 'Ionicons' as IconLibrary,
            };
        }
        if (level.includes('exper') || level.includes('adv')) {
            return {
                bg: Colors.EXP_EXPERIENCED_BG,
                text: Colors.EXP_EXPERIENCED_TEXT,
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

    const getExperienceActiveColor = (exp?: string | null) => {
        const level = exp?.toLowerCase() || '';
        if (level.includes('begin') || level.includes('novice')) return Colors.SECONDARY;
        if (level.includes('regular') || level.includes('intermed')) return Colors.EXP_REGULAR_BG;
        if (level.includes('exper') || level.includes('adv')) return Colors.EXP_EXPERIENCED_BG;
        return Colors.PRIMARY;
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
    const activeColor = getExperienceActiveColor(user.preferences?.experience);
    const showMedicalProfile = user.medicalProfile && (user.medicalProfile.hasCondition || user.medicalProfile.clearanceUri);

    /**
     * Dynamic Layout Logic:
     * If user's list of favorite destinations is long (> 4 items), the Hiking Preferences card 
     * becomes very tall. In this case, we shift the Medical Profile card to the left column 
     * to balance column heights on web dashboards.
     */
    const isPreferencesLong = (user.preferences?.location?.length || 0) > 4;

    const renderMedicalProfile = () => {
        if (!(showMedicalProfile || isEditing)) return null;
        return (
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
                                    <CustomFeedbackInput label="Specify your condition(s)" placeholder="e.g. Asthma, Hypertension, Allergies..." value={medicalProfile.details.join('\n')} onChangeText={(text) => setMedicalProfile(prev => ({ ...prev, details: text.split('\n').filter(Boolean) }))} suggestions={["Asthma", "Allergies", "Hypertension", "Heart Condition", "Diabetes"]} />
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
                                            user.medicalProfile.details || [],
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
        );
    };

    const renderProfileHeader = () => (
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
                        Member since {formatDateToStandard(user.createdAt)}
                    </CustomText>
                )}
            </View>
        </View>
    );

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

                {renderProfileHeader()}

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
                                        <CustomTextInput label="Username" placeholder="Enter username" value={username} onChangeText={setUsername} />
                                        <CustomTextInput label="Phone Number" placeholder="Enter phone number" value={phoneNumber} onChangeText={setPhoneNumber} type="phone" prefix="+63" />
                                        <CustomTextInput label="Birthday" placeholder="Select birthday" value={birthday} onChangeText={setBirthday} type="calendar" dateFormat="MM/DD/YYYY" />
                                        <CustomTextInput label="Address" placeholder="Enter address" value={address} onChangeText={setAddress} style={styles.noMarginBottom} />
                                    </View>
                                ) : (
                                    <View>
                                        <InfoRow label="Username" value={`@${user.username}`} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Phone Number" value={formatPhoneWithPrefix(user.phoneNumber)} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Birthday" value={user.birthday ? formatDateToStandard(user.birthday) : null} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Email Address" value={user.email} forceStack={personalDetailsRequiresStack} />
                                        <InfoRow label="Address" value={user.address} noMargin={true} forceStack={personalDetailsRequiresStack} />
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                    <CustomIcon library="Feather" name="phone-call" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Emergency Contact</CustomText>
                                </View>
                            </View>
                            <View style={styles.cardBody}>
                                {isEditing ? (
                                    <View style={styles.editForm}>
                                        {/* Search Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                                            <View style={{ flex: 1 }}>
                                                <CustomTextInput label="Search by Email (Optional)" placeholder="friend@email.com" value={searchEmail} onChangeText={setSearchEmail} keyboardType="email-address" autoCapitalize="none" />
                                            </View>
                                            <TouchableOpacity onPress={handleEmergencySearch} disabled={isSearching} style={{ backgroundColor: Colors.PRIMARY, height: 54, width: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 28 }} activeOpacity={0.8}>
                                                {isSearching ? (
                                                    <ActivityIndicator color={Colors.WHITE} size="small" />
                                                ) : (
                                                    <CustomIcon library="Feather" name="search" size={20} color={Colors.WHITE} />
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        {searchError && <ErrorMessage error={searchError} style={{ marginBottom: 12 }} />}
                                        {searchSuccess && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.STATUS_APPROVED_BG, padding: 12, borderRadius: 12, marginBottom: 12, gap: 8 }}>
                                                <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.PRIMARY} />
                                                <CustomText style={{ color: Colors.PRIMARY, fontSize: 13, fontWeight: '500', flex: 1 }}>{searchSuccess}</CustomText>
                                            </View>
                                        )}
                                        {searchInfo && (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.STATUS_PENDING_BG, padding: 12, borderRadius: 12, marginBottom: 12, gap: 8 }}>
                                                <CustomIcon library="Feather" name="info" size={16} color={Colors.STATUS_PENDING_TEXT} />
                                                <CustomText style={{ color: Colors.STATUS_PENDING_TEXT, fontSize: 13, fontWeight: '500', flex: 1 }}>{searchInfo}</CustomText>
                                            </View>
                                        )}

                                        <CustomTextInput label="Contact Name" placeholder="Enter emergency contact name" value={emergencyContact.name} onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, name: text }))} />
                                        <CustomTextInput label="Contact Number" placeholder="Enter emergency contact number" value={emergencyContact.contactNumber} onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, contactNumber: text }))} type="phone" prefix="+63" />
                                        <CustomTextInput label="Email Address" placeholder="Enter emergency contact email" value={emergencyContact.email} onChangeText={(text) => setEmergencyContact(prev => ({ ...prev, email: text }))} style={styles.noMarginBottom} />
                                    </View>
                                ) : user.emergencyContact?.name ? (
                                    <View>
                                        <InfoRow label="Contact Name" value={user.emergencyContact.name} forceStack={emergencyContactRequiresStack} />
                                        <InfoRow label="Contact Number" value={formatPhoneWithPrefix(user.emergencyContact.contactNumber)} forceStack={emergencyContactRequiresStack} />
                                        <InfoRow label="Email Address" value={user.emergencyContact.email} noMargin={true} forceStack={emergencyContactRequiresStack} />
                                    </View>
                                ) : (
                                    <View style={styles.emptyEmergencyContainer}>
                                        <View style={styles.emptyEmergencyIconContainer}>
                                            <CustomIcon library="Feather" name="alert-triangle" size={24} color={Colors.WARNING} />
                                        </View>
                                        <CustomText style={styles.emptyEmergencyText}>No emergency contact set up. In case of emergencies, having a contact helps guides reach your family.</CustomText>
                                        <TouchableOpacity onPress={() => setIsEmergencyModalVisible(true)} style={styles.setupEmergencyBtn} activeOpacity={0.8}>
                                            <CustomText style={styles.setupEmergencyBtnText}>Set up Emergency Contact</CustomText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>

                        {isWideScreen && isPreferencesLong && renderMedicalProfile()}
                    </View>

                    {/* RIGHT COLUMN */}
                    <View style={[styles.column, isWideScreen && styles.columnWide]}>
                        {(!isWideScreen || !isPreferencesLong) && renderMedicalProfile()}

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
                                                                <CustomText variant="h2" style={[styles.expBarValue, { color: activeColor }]} numberOfLines={1} adjustsFontSizeToFit>
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
                                                                            isActive && { backgroundColor: activeColor },
                                                                            idx === 0 && styles.segmentFirst,
                                                                            idx === LEVELS.length - 1 && styles.segmentLast,
                                                                        ]} />
                                                                        <CustomText
                                                                            numberOfLines={1}
                                                                            adjustsFontSizeToFit
                                                                            style={[
                                                                                styles.segmentLabelText,
                                                                                isActive && { color: Colors.TEXT_PRIMARY, fontWeight: 'bold' },
                                                                                isCurrent && { color: activeColor }
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

            <EmergencyModal
                visible={isEmergencyModalVisible}
                onClose={() => setIsEmergencyModalVisible(false)}
                mode="emergency_only"
            />

        </ScreenWrapper>
    );
};



export default ProfileInfoScreen;