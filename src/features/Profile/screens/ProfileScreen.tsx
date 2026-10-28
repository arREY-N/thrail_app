import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter, { getStickyFooterScrollPadding } from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomTextInput, { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import EmergencyModal from '@/src/components/EmergencyModal';
import ErrorMessage from '@/src/components/ErrorMessage';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import {
    calculateVerificationValidity,
    formatVerificationExpiry
} from '@/src/core/flows/PhoneVerificationFlow';
import { Review } from '@/src/core/models/Review/Review';
import { IUser, Role, useAuthStore, UserRepo } from '@/src/core/models/User/User';
import { formatDate, toDateOrNull } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { formatDateToStandard, getInitials, safeParseDateString } from '@/src/utils/dateFormatter';

import { useProfileForm } from '@/src/features/Settings/hooks/useProfileForm';
import {
    badgeStyles,
    formatPhoneWithPrefix,
    InfoRow,
    renderVerificationBadge
} from '@/src/features/Settings/screens/ProfileInfoScreen';
import { styles as infoStyles } from '@/src/features/Settings/styles/ProfileInfoStyles';

import HikeLogTab from '@/src/features/Profile/tabs/HikeLogTab';
import MilestonesTab from '@/src/features/Profile/tabs/MilestonesTab';

/**
 * Props for the ProfileScreen component.
 */
export interface ProfileScreenProps {
    /** The authenticated user's profile data */
    profile?: IUser;
    /** The active role of the current user */
    role?: Role | null;
    /** Statistical milestones for the user */
    stats?: import('@/src/features/Profile/tabs/MilestonesTab').MilestonesTabProps['stats'];
    /** An array of reviews/hikes the user has logged */
    hikeLog?: Review[];
    /** When true, HikeLogTab renders PostCardSkeleton placeholders instead of empty state */
    isLoading?: boolean;
    /** When true, shows active pull-to-refresh spinner */
    isRefreshing?: boolean;
    /** Callback triggered upon pull-to-refresh */
    onRefresh?: () => Promise<void> | void;
    /** Error message if an error occurred while fetching hike data */
    error?: string | null;
    /** Callback for the settings gear icon */
    onSettingsPress: () => void;
    /** Callback when a review is liked */
    onLikeReview: (review: Review) => void;
    /** Helper to check if a review is liked by current user */
    isLiked: (review: Review) => boolean;
    /** Callback to edit a review */
    onEditReview: (id?: string) => void;
    /** Callback for FAB action */
    onGroupPress: () => void;
    /** Callback to view admin */
    onAdminPress?: () => void;
    /** Callback to view superadmin */
    onSuperadminPress?: () => void;
    /** Callback to apply for business */
    onApplyPress?: () => void;
    /** Callback to sign out */
    onSignOutPress?: () => void;
    /** Callback fired when user scrolls near bottom of hike log to reveal more items */
    onSeeMore?: () => void;
    /** When true, hike log has more items to reveal */
    hasMore?: boolean;
    /** Optional callback when user saves profile edits */
    onSavePress?: (updatedFields: Partial<IUser>) => Promise<void>;
    /** Optional flag if in editing mode */
    isEditing?: boolean;
    /** Optional callback when edit mode starts */
    onEditPress?: () => void;
    /** Optional callback when editing is canceled */
    onCancelPress?: () => void;
}

/**
 * Main Profile Screen displaying user information, milestones, and hike logs.
 */
const ProfileScreen = ({
    profile,
    role,
    stats,
    hikeLog,
    isLoading,
    isRefreshing,
    onRefresh,
    error,
    onSettingsPress,
    onLikeReview,
    isLiked,
    onEditReview,
    onGroupPress,
    onAdminPress,
    onSuperadminPress,
    onApplyPress,
    onSignOutPress,
    onSeeMore,
    hasMore,
    onSavePress,
    isEditing: propIsEditing,
    onEditPress: propOnEditPress,
    onCancelPress: propOnCancelPress,
}: ProfileScreenProps) => {

    const [activeTab, setActiveTab] = useState<'Information' | 'Milestones' | 'Hike Log'>('Information');
    const [localIsEditing, setLocalIsEditing] = useState(false);
    const isEditing = propIsEditing !== undefined ? propIsEditing : localIsEditing;
    const onEditPress = propOnEditPress || (() => setLocalIsEditing(true));
    const onCancelPress = propOnCancelPress || (() => setLocalIsEditing(false));

    // Stable refs so the scroll handler always reads fresh values
    // without causing re-renders. Synced in useEffect after each commit.
    const scrollYRef = useRef(0);
    const contentHeightRef = useRef(0);
    const layoutHeightRef = useRef(0);
    const activeTabRef = useRef(activeTab);
    const hasMoreRef = useRef(hasMore);
    const onSeeMoreRef = useRef(onSeeMore);
    // Guard: prevents repeated calls while a page is already being appended.
    const isPagingRef = useRef(false);

    // Synchronize scroll handler refs with the latest props and state
    useEffect(() => {
        activeTabRef.current = activeTab;
        hasMoreRef.current = hasMore;
        onSeeMoreRef.current = onSeeMore;
    }, [activeTab, hasMore, onSeeMore]);

    // Reset pagination throttle guard whenever the rendered list changes
    useEffect(() => {
        isPagingRef.current = false;
    }, [hikeLog]);

    // Stable scroll handler — created once. Reads via refs so it always
    // sees the latest tab/hasMore state without needing to be recreated.
    const handleScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
            const nearBottom =
                scrollYRef.current + layoutHeightRef.current >=
                contentHeightRef.current - 200;
            if (
                nearBottom &&
                activeTabRef.current === 'Hike Log' &&
                hasMoreRef.current &&
                onSeeMoreRef.current &&
                !isPagingRef.current
            ) {
                isPagingRef.current = true;
                onSeeMoreRef.current();
            }
        },
        [] // stable — all reads go through refs
    );

    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet, isMobile, width } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;
    const contentMaxWidth: number | `${number}%` = isDesktop ? 800 : (isTablet ? 650 : '100%');
    const responsiveAlignStyle = { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const };

    const [freshUser, setFreshUser] = useState<IUser | null>(null);
    const effectiveUser = freshUser || profile;

    useEffect(() => {
        let isMounted = true;
        const refreshUserProfile = async () => {
            if (!profile?.id) return;
            try {
                const latestUser = await UserRepo.fetchById(profile.id);
                if (isMounted && latestUser) {
                    setFreshUser(latestUser);
                    const currentStoreProfile = useAuthStore.getState().profile;
                    if (currentStoreProfile?.id === profile.id) {
                        useAuthStore.setState({ profile: latestUser });
                    }
                }
            } catch (err) {
                console.warn('[ProfileScreen] Failed to refresh user profile:', err);
            }
        };

        refreshUserProfile();
        return () => {
            isMounted = false;
        };
    }, [profile?.id]);

    const [linkedEmergencyVerifiedAt, setLinkedEmergencyVerifiedAt] = useState<Date | null>(null);

    const contactUserId = effectiveUser?.emergencyContact?.userId;
    const contactPhoneVerifiedAt = effectiveUser?.emergencyContact?.phoneVerifiedAt;
    const contactNumber = effectiveUser?.emergencyContact?.contactNumber;

    useEffect(() => {
        let isMounted = true;
        const resolveLinkedEmergency = async () => {
            if (contactUserId && !contactPhoneVerifiedAt) {
                try {
                    const linkedUser = await UserRepo.fetchById(contactUserId);
                    if (isMounted && linkedUser) {
                        const linkedPhone = cleanPhoneNumber(linkedUser.phoneNumber || '');
                        const contactPhone = cleanPhoneNumber(contactNumber || '');
                        if (linkedPhone && contactPhone && linkedPhone === contactPhone) {
                            setLinkedEmergencyVerifiedAt(toDateOrNull(linkedUser.phoneVerifiedAt));
                            return;
                        }
                    }
                } catch (err) {
                    console.warn('[ProfileScreen] Failed to resolve linked emergency contact:', err);
                }
            }
            if (isMounted) {
                setLinkedEmergencyVerifiedAt(null);
            }
        };

        resolveLinkedEmergency();
        return () => {
            isMounted = false;
        };
    }, [contactUserId, contactPhoneVerifiedAt, contactNumber]);

    const handleSaveAccount = async (updatedFields: Partial<IUser>): Promise<void> => {
        if (!onSavePress) return;
        const sanitizedFields = { ...updatedFields };
        if (sanitizedFields.emergencyContact) {
            const ec = sanitizedFields.emergencyContact;
            sanitizedFields.emergencyContact = {
                ...ec,
                userId: ec.userId || '',
                phoneVerifiedAt: ec.userId ? (ec.phoneVerifiedAt ?? null) : null,
            };
        }
        await onSavePress(sanitizedFields);
    };

    const {
        isEditModalVisible,
        setIsEditModalVisible,
        isSaveModalVisible,
        setIsSaveModalVisible,
        isCancelModalVisible,
        setIsCancelModalVisible,
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
        emergencyContact,
        searchEmail,
        isSearching,
        searchError,
        searchSuccess,
        searchInfo,
        formError,
        setFormError,
        isDirty,
        handleConfirmEdit,
        handleEmergencySearch,
        handleCancelPress,
        handleSavePress,
        handleSave,
        willResetAnyVerification,
        findUser,
        handleSaveEmergencyContact,
        handleSearchEmailChange,
        handleContactNameChange,
        handleContactNumberChange,
        handleContactEmailChange,
    } = useProfileForm({
        user: effectiveUser || ({} as IUser),
        isEditing,
        onSavePress: handleSaveAccount,
        onCancelPress,
        onEditPress,
    });

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
        { label: "Contact Name", value: effectiveUser?.emergencyContact?.name },
        { label: "Contact Number", value: effectiveUser?.emergencyContact?.contactNumber },
        { label: "Email Address", value: effectiveUser?.emergencyContact?.email }
    ];
    const personalDetailsFields = [
        { label: "Username", value: effectiveUser?.username ? `@${effectiveUser.username}` : '' },
        { label: "Phone Number", value: effectiveUser?.phoneNumber },
        { label: "Birthday", value: effectiveUser?.birthday ? formatDateToStandard(effectiveUser.birthday) : null },
        { label: "Email Address", value: effectiveUser?.email },
        { label: "Address", value: effectiveUser?.address }
    ];

    const personalDetailsRequiresStack = isWideScreen ? false : (isMobile ? checkSectionRequiresStack(personalDetailsFields) : false);
    const emergencyContactRequiresStack = isWideScreen ? false : (isMobile ? checkSectionRequiresStack(emergencyContactFields) : false);

    const maxAllowedBirthday = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 10);
        return d;
    }, []);

    const userBirthdayDate = effectiveUser?.birthday ? safeParseDateString(effectiveUser.birthday) : null;
    const isPlaceholderOrUnderageBirthday = !effectiveUser?.birthday || (userBirthdayDate ? userBirthdayDate > maxAllowedBirthday : true);

    const effectivePersonalPhoneVerifiedAt = toDateOrNull(effectiveUser?.phoneVerifiedAt);
    const phoneValidity = calculateVerificationValidity(effectivePersonalPhoneVerifiedAt);
    const personalExpiryText = phoneValidity.status === 'verified'
        ? formatVerificationExpiry(effectivePersonalPhoneVerifiedAt)
        : null;

    const effectiveEmergencyPhoneVerifiedAt = toDateOrNull(
        effectiveUser?.emergencyContact?.phoneVerifiedAt || linkedEmergencyVerifiedAt
    );
    const emergencyValidity = calculateVerificationValidity(effectiveEmergencyPhoneVerifiedAt);
    const emergencyExpiryText = emergencyValidity.status === 'verified'
        ? formatVerificationExpiry(effectiveEmergencyPhoneVerifiedAt)
        : null;

    const userName = effectiveUser?.firstname
        ? `${effectiveUser.firstname} ${effectiveUser.lastname}`
        : 'User Name';

    const userHandle = effectiveUser?.username
        ? `@${effectiveUser.username}`
        : '@username';

    let createdDate = 'Mar 2026';
    if (effectiveUser?.createdAt) {
        try {
            const rawDate: unknown = effectiveUser.createdAt;
            const dateObj = (rawDate as { toDate?: () => Date }).toDate?.() ?? new Date(rawDate as string | number | Date);

            if (!isNaN(dateObj.getTime())) {
                createdDate = formatDate(dateObj);
            }
        } catch (e) {
            console.warn("Date parse error", e);
        }
    }

    const userInitials = getInitials(effectiveUser?.firstname, effectiveUser?.lastname);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <CustomHeader
                title={isEditing ? "Edit Profile" : "Profile"}
                showDefaultIcons={!isEditing}
                onBackPress={isEditing ? handleCancelPress : undefined}
                style={styles.transparentHeader}
            />

            <ResponsiveScrollView
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[1]}
                onScroll={handleScroll}
                scrollEventThrottle={200}
                onContentSizeChange={(_w, h) => { contentHeightRef.current = h; }}
                onLayout={(e) => { layoutHeightRef.current = e.nativeEvent.layout.height; }}
                bounces={true}
                overScrollMode="always"
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={Boolean(isRefreshing)}
                            onRefresh={onRefresh}
                            colors={[Colors.PRIMARY]}
                            tintColor={Colors.PRIMARY}
                        />
                    ) : undefined
                }
            >
                <View style={[styles.userBanner, responsiveAlignStyle]}>
                    <View style={styles.userInfoLeft}>
                        <View style={styles.avatarPlaceholder}>
                            <CustomText style={styles.initialsText}>
                                {userInitials}
                            </CustomText>
                        </View>

                        <View style={styles.identityTextGroup}>
                            <CustomText
                                variant="h2"
                                style={styles.userNameText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {userName}
                            </CustomText>
                            <CustomText
                                variant="caption"
                                style={styles.userHandleText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {userHandle}
                            </CustomText>
                            <CustomText
                                variant="caption"
                                style={styles.memberSinceText}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                Member since {createdDate}
                            </CustomText>
                        </View>
                    </View>
                    {Platform.OS !== 'web' && (
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={onSettingsPress}
                            activeOpacity={0.7}
                        >
                            <CustomIcon
                                library="Feather"
                                name="settings"
                                size={22}
                                color={Colors.TEXT_PRIMARY}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.stickyTabWrapper}>
                    <View style={[styles.floatingTabsContainer, responsiveAlignStyle]}>
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'Milestones' && styles.tabButtonActive,
                                isEditing && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                if (!isEditing) setActiveTab('Milestones');
                            }}
                            disabled={isEditing}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Ionicons"
                                name="stats-chart"
                                size={activeTab === 'Milestones' ? 20 : 18}
                                color={activeTab === 'Milestones' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />

                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'Milestones' && styles.tabTextActive
                                ]}
                                numberOfLines={1}
                            >
                                Milestones
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'Hike Log' && styles.tabButtonActive,
                                isEditing && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                if (!isEditing) setActiveTab('Hike Log');
                            }}
                            disabled={isEditing}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Feather"
                                name="edit-3"
                                size={activeTab === 'Hike Log' ? 20 : 18}
                                color={activeTab === 'Hike Log' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />
                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'Hike Log' && styles.tabTextActive
                                ]}
                                numberOfLines={1}
                            >
                                Hike Log
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === 'Information' && styles.tabButtonActive
                            ]}
                            onPress={() => setActiveTab('Information')}
                            activeOpacity={0.9}
                        >
                            <CustomIcon
                                library="Feather"
                                name="info"
                                size={activeTab === 'Information' ? 20 : 18}
                                color={activeTab === 'Information' ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                            />

                            <CustomText
                                style={[
                                    styles.tabText,
                                    activeTab === 'Information' && styles.tabTextActive
                                ]}
                                numberOfLines={1}
                            >
                                Account
                            </CustomText>
                        </TouchableOpacity>

                    </View>
                </View>

                <View style={[styles.tabContentContainer, responsiveAlignStyle]}>
                    {/* Information Tab Content */}
                    <View style={activeTab !== 'Information' ? styles.hidden : undefined}>
                        {isEditing && formError && (
                            <ErrorMessage error={formError} />
                        )}

                        <View style={!isMobile ? infoStyles.desktopColumns : infoStyles.mobileStack}>
                            {/* LEFT COLUMN */}
                            <View style={[infoStyles.column, isWideScreen && infoStyles.columnWide]}>
                                {/* Personal Details Card */}
                                <View style={infoStyles.card}>
                                    <View style={infoStyles.cardHeader}>
                                        <CustomIcon library="Feather" name="user" size={18} color={Colors.PRIMARY} />
                                        <CustomText variant="h3" style={infoStyles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Personal Details</CustomText>
                                    </View>

                                    <View style={infoStyles.cardBody}>
                                        {isEditing ? (
                                            <View style={infoStyles.editForm}>
                                                <CustomTextInput label="Username" placeholder="Enter username" value={username} onChangeText={setUsername} />
                                                <CustomTextInput label="Phone Number" placeholder="Enter phone number" value={phoneNumber} onChangeText={setPhoneNumber} type="phone" prefix="+63" />
                                                <CustomTextInput
                                                    label="Birthday"
                                                    placeholder="Select birthday"
                                                    value={birthday}
                                                    onChangeText={(val: string | Date | null) => {
                                                        setFormError(null);
                                                        setBirthday(val instanceof Date ? val : (val ? safeParseDateString(val) : null));
                                                    }}
                                                    type="calendar"
                                                    dateFormat="MM/DD/YYYY"
                                                    defaultMode="year"
                                                    maximumDate={maxAllowedBirthday}
                                                    helperText="Minimum age requirement is 10 years old."
                                                />
                                                <CustomTextInput label="Address" placeholder="Enter address" value={address} onChangeText={setAddress} style={infoStyles.noMarginBottom} />
                                            </View>
                                        ) : (
                                            <View>
                                                <InfoRow label="Username" value={effectiveUser?.username ? `@${effectiveUser.username}` : ''} forceStack={personalDetailsRequiresStack} />
                                                <InfoRow
                                                    label="Phone Number"
                                                    value={formatPhoneWithPrefix(effectiveUser?.phoneNumber)}
                                                    badge={renderVerificationBadge(phoneValidity)}
                                                    badgePosition="before_value"
                                                    subValue={personalExpiryText}
                                                    forceStack={personalDetailsRequiresStack}
                                                />
                                                <InfoRow
                                                    label="Birthday"
                                                    value={effectiveUser?.birthday ? formatDateToStandard(effectiveUser.birthday) : 'Not provided'}
                                                    badge={
                                                        isPlaceholderOrUnderageBirthday ? (
                                                            <View style={badgeStyles.actionRequiredPill}>
                                                                <CustomIcon library="Feather" name="alert-triangle" size={10} color={Colors.ERROR} />
                                                                <CustomText style={badgeStyles.actionRequiredPillText}>Action Required</CustomText>
                                                            </View>
                                                        ) : undefined
                                                    }
                                                    badgePosition="before_value"
                                                    forceStack={personalDetailsRequiresStack}
                                                />
                                                <InfoRow label="Email Address" value={effectiveUser?.email} forceStack={personalDetailsRequiresStack} />
                                                <InfoRow
                                                    label="Address"
                                                    value={effectiveUser?.address}
                                                    noMargin={!isPlaceholderOrUnderageBirthday}
                                                    forceStack={personalDetailsRequiresStack}
                                                />

                                                {isPlaceholderOrUnderageBirthday && (
                                                    <TouchableOpacity
                                                        style={infoStyles.cardAlertCallout}
                                                        activeOpacity={0.8}
                                                        onPress={() => setIsEditModalVisible(true)}
                                                    >
                                                        <View style={infoStyles.cardAlertCalloutHeader}>
                                                            <CustomIcon library="Feather" name="alert-circle" size={14} color={Colors.ERROR} />
                                                            <CustomText style={infoStyles.cardAlertCalloutTitle}>
                                                                Minimum Age Requirement
                                                            </CustomText>
                                                        </View>
                                                        <CustomText variant="caption" style={infoStyles.cardAlertCalloutBody}>
                                                            {!effectiveUser?.birthday
                                                                ? 'Hikers must be at least 10 years old to register. Your birthdate is currently unset. Tap here to update it.'
                                                                : 'Hikers must be at least 10 years old to register. Your current birthdate indicates an age under 10. Tap here to update it.'}
                                                        </CustomText>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* RIGHT COLUMN */}
                            <View style={[infoStyles.column, isWideScreen && infoStyles.columnWide]}>
                                {/* Emergency Contact Card */}
                                <View style={infoStyles.card}>
                                    <View style={infoStyles.cardHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                            <CustomIcon library="Feather" name="phone-call" size={18} color={Colors.PRIMARY} />
                                            <CustomText variant="h3" style={infoStyles.cardTitle} numberOfLines={1} adjustsFontSizeToFit>Emergency Contact</CustomText>
                                        </View>
                                    </View>
                                    <View style={infoStyles.cardBody}>
                                        {isEditing ? (
                                            <View style={infoStyles.editForm}>
                                                {/* Search Row */}
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 0 }}>
                                                    <View style={{ flex: 1 }}>
                                                        <CustomTextInput label="Search by Email (Optional)" placeholder="contact@email.com" value={searchEmail} onChangeText={handleSearchEmailChange} keyboardType="email-address" autoCapitalize="none" />
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

                                                <CustomTextInput label="Contact Name" placeholder="Enter emergency contact name" value={emergencyContact.name} onChangeText={handleContactNameChange} />
                                                <CustomTextInput label="Contact Number" placeholder="Enter emergency contact number" value={emergencyContact.contactNumber} onChangeText={handleContactNumberChange} type="phone" prefix="+63" />
                                                <CustomTextInput label="Email Address" placeholder="Enter emergency contact email" value={emergencyContact.email} onChangeText={handleContactEmailChange} style={infoStyles.noMarginBottom} />
                                            </View>
                                        ) : effectiveUser?.emergencyContact?.name ? (
                                            <View>
                                                <InfoRow label="Contact Name" value={effectiveUser.emergencyContact.name} forceStack={emergencyContactRequiresStack} />
                                                <InfoRow
                                                    label="Contact Number"
                                                    value={formatPhoneWithPrefix(effectiveUser.emergencyContact.contactNumber)}
                                                    badge={renderVerificationBadge(emergencyValidity, !!effectiveUser.emergencyContact.userId)}
                                                    badgePosition="before_value"
                                                    subValue={emergencyExpiryText}
                                                    forceStack={emergencyContactRequiresStack}
                                                />
                                                <InfoRow label="Email Address" value={effectiveUser.emergencyContact.email} noMargin={true} forceStack={emergencyContactRequiresStack} />
                                            </View>
                                        ) : (
                                            <View style={infoStyles.emptyEmergencyContainer}>
                                                <View style={infoStyles.emptyEmergencyIconContainer}>
                                                    <CustomIcon library="Feather" name="alert-triangle" size={24} color={Colors.ERROR} />
                                                </View>
                                                <CustomText style={infoStyles.emptyEmergencyText}>No emergency contact set up. In case of emergencies, having a contact helps guides reach your family.</CustomText>
                                                <TouchableOpacity onPress={() => setIsEmergencyModalVisible(true)} style={infoStyles.setupEmergencyBtn} activeOpacity={0.8}>
                                                    <CustomText style={infoStyles.setupEmergencyBtnText}>Set up Emergency Contact</CustomText>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Bottom scroll padding for sticky footer */}
                        <View style={{ height: getStickyFooterScrollPadding(insets.bottom, isMobile) }} />
                    </View>

                    <View style={activeTab !== 'Milestones' ? styles.hidden : undefined}>
                        <MilestonesTab
                            stats={stats}
                            isLoading={Boolean(isLoading || isRefreshing)}
                        />
                    </View>
                    <View style={activeTab !== 'Hike Log' ? styles.hidden : undefined}>
                        <HikeLogTab
                            hikeLog={hikeLog}
                            isLoading={isLoading}
                            error={error}
                            onRetry={onRefresh}
                            onLikeReview={onLikeReview}
                            isLiked={(review) => Boolean(isLiked(review))}
                            onEditReview={(id: string) => onEditReview(id)}
                            onSeeMore={onSeeMore}
                            hasMore={hasMore}
                        />
                    </View>
                </View>

            </ResponsiveScrollView>

            {activeTab === 'Information' ? (
                <CustomStickyFooter
                    primaryButton={
                        isEditing
                            ? {
                                title: 'Save Changes',
                                onPress: handleSavePress,
                                disabled: !isDirty,
                            }
                            : {
                                title: 'Edit Profile',
                                onPress: () => setIsEditModalVisible(true),
                            }
                    }
                    secondaryButton={
                        isEditing
                            ? {
                                title: 'Cancel',
                                onPress: handleCancelPress,
                                variant: 'outline',
                            }
                            : undefined
                    }
                />
            ) : (
                <CustomFAB onPress={onGroupPress} />
            )}

            {/* Modals */}
            <ConfirmationModal
                visible={isEditModalVisible}
                title="Edit Profile"
                message="Are you sure you want to edit this profile information? You will be redirected to the edit screen."
                iconName="edit-3"
                onConfirm={handleConfirmEdit}
                onClose={() => setIsEditModalVisible(false)}
                confirmText="Edit"
                cancelText="Cancel"
            />
            <ConfirmationModal
                visible={isSaveModalVisible}
                title={willResetAnyVerification ? "Reset Verification Warning" : "Save Changes"}
                message={
                    willResetAnyVerification
                        ? "Modifying your verified phone number (or emergency contact) will reset its verification status and require tour organizers to re-verify it on your next reservation. Do you wish to proceed and save changes?"
                        : "You have made changes to your profile. Do you want to save them?"
                }
                iconName="check-circle"
                onConfirm={() => { setIsSaveModalVisible(false); handleSave(); }}
                onClose={() => setIsSaveModalVisible(false)}
                confirmText="Save"
                cancelText="Keep Editing"
            />
            <ConfirmationModal
                visible={isCancelModalVisible}
                title="Discard Changes"
                message="You have unsaved changes. Are you sure you want to discard them?"
                isDestructive={true}
                iconName="alert-triangle"
                onConfirm={() => { setIsCancelModalVisible(false); if (onCancelPress) onCancelPress(); }}
                onClose={() => setIsCancelModalVisible(false)}
                confirmText="Discard"
                cancelText="Keep Editing"
            />

            <EmergencyModal
                visible={isEmergencyModalVisible}
                onClose={() => setIsEmergencyModalVisible(false)}
                mode="emergency_only"
                currentUserProfile={effectiveUser}
                onSearchUser={findUser}
                onSaveEmergencyContact={handleSaveEmergencyContact}
            />

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    transparentHeader: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    tabContentContainer: {
        flex: 1,
        marginBottom: 24,
    },
    userBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
        minWidth: 0,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        flexShrink: 0,
    },
    initialsText: {
        color: Colors.WHITE,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    identityTextGroup: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        gap: 2,
    },
    userNameText: {
        marginBottom: 0,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -0.5,
    },
    userHandleText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    memberSinceText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 12,
        marginTop: 2,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        flexShrink: 0,
    },
    stickyTabWrapper: {
        backgroundColor: Colors.BACKGROUND,
        paddingVertical: 12,
        zIndex: 10,
        alignItems: 'center',
    },
    floatingTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 3,
        borderRadius: 20,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(4, 0.1, Colors.SHADOW, { radius: 8 }),
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    tabTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    hidden: {
        display: 'none',
    },
});

export default ProfileScreen;
