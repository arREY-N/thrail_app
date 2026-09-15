/**
 * @file EmergencyModal.tsx
 * @description Modal bottom-sheet for configuring and searching emergency contacts with support for unified contact editing.
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput, { cleanPhoneNumber, formatLocalPhoneNumber } from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { calculateVerificationValidity } from '@/src/core/flows/PhoneVerificationFlow';
import { User, IEmergencyContact } from '@/src/core/models/User/User';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Props for the EmergencyModal component.
 */
export interface EmergencyModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback fired when the modal is requested to close */
    onClose?: () => void;
    /** Operating mode for the modal. Unified allows editing own phone number too. */
    mode?: 'emergency_only' | 'unified';
    /** The initial phone number of the current user (if in unified mode) */
    initialUserPhone?: string;
    /** The initial emergency contact model (if in unified mode) */
    initialEmergencyContact?: IEmergencyContact | null;
    /** The authenticated user profile passed from caller */
    currentUserProfile?: User | null;
    /** Async function to search users by email */
    onSearchUser?: (email: string) => Promise<UserSearchResult[]>;
    /** Async function to persist emergency contact in emergency_only mode */
    onSaveEmergencyContact?: (contact: IEmergencyContact, linkedUser?: User | UserSearchResult | null) => Promise<boolean>;
    /** Callback fired to save the user's local phone number */
    onSaveLocalPhone?: (phone: string) => void;
    /** Callback fired in unified booking mode to apply contact changes locally without immediate DB writes */
    onSaveUnifiedContacts?: (data: {
        phone: string;
        emergencyContact: IEmergencyContact;
        linkedUser?: User | UserSearchResult | null;
    }) => void;
    /** Callback fired when the user chooses to skip setup */
    onSkip?: () => void;
}

/**
 * Interface representing a user search result for emergency contact.
 */
export interface UserSearchResult {
    id: string;
    email: string;
    firstname?: string;
    lastname?: string;
    phoneNumber?: string;
    phoneVerifiedAt?: Date | null;
}

/**
 * EmergencyModal — A bottom sheet modal for users to set up or edit their
 * emergency contact information. Optionally allows editing their own phone number.
 * 
 * @param {EmergencyModalProps} props - Component props
 * @returns {React.JSX.Element | null} The rendered modal component
 */
const EmergencyModal = ({ 
    visible, 
    onClose, 
    mode = 'emergency_only', 
    initialUserPhone = '', 
    initialEmergencyContact,
    currentUserProfile,
    onSearchUser,
    onSaveEmergencyContact,
    onSaveLocalPhone, 
    onSaveUnifiedContacts,
    onSkip 
}: EmergencyModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const [myPhone, setMyPhone] = useState(initialUserPhone);
    const [searchEmail, setSearchEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'not_found'; message: string } | null>(null);

    const [renderModal, setRenderModal] = useState(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
            
            setMyPhone(initialUserPhone || formatLocalPhoneNumber(cleanPhoneNumber(currentUserProfile?.phoneNumber || '')));
            setSearchResults([]);
            setShowDropdown(false);
            setErrorMsg(null);
            setSearchStatus(null);
            
            const initEmail = initialEmergencyContact?.email ?? currentUserProfile?.emergencyContact?.email ?? '';
            const initUserId = initialEmergencyContact?.userId ?? currentUserProfile?.emergencyContact?.userId ?? '';
            const initName = initialEmergencyContact?.name ?? currentUserProfile?.emergencyContact?.name ?? '';
            const initPhone = formatLocalPhoneNumber(cleanPhoneNumber(initialEmergencyContact?.contactNumber ?? currentUserProfile?.emergencyContact?.contactNumber ?? ''));

            setSearchEmail(initEmail);
            setSelectedUser(
                initUserId 
                    ? { 
                        id: initUserId, 
                        email: initEmail,
                    } 
                    : null
            );
            setContactName(initName);
            setContactPhone(initPhone);
        }
    }

    useEffect(() => {
        if (visible) {
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, initialUserPhone, initialEmergencyContact, currentUserProfile, animValue]);

    const handleCloseOrSkip = () => {
        setErrorMsg(null);
        setSearchStatus(null);
        if (onSkip) onSkip();
        if (onClose) onClose();
    };

    const handleEmailChange = (text: string) => {
        setSearchEmail(text);
        setShowDropdown(false);
        setErrorMsg(null);
        setSearchStatus(null);

        if (selectedUser && text.trim().toLowerCase() !== (selectedUser.email || '').toLowerCase()) {
            setSelectedUser(null);
        }
    };

    const handleSearch = async () => {
        setErrorMsg(null);
        setSearchStatus(null);
        const cleanedSearch = searchEmail.trim().toLowerCase();

        if (!cleanedSearch) return;

        if (cleanedSearch === currentUserProfile?.email?.trim().toLowerCase()) {
            setErrorMsg("You cannot use your own email as an emergency contact.");
            return;
        }

        setIsSearching(true);
        setShowDropdown(false);

        try {
            const results = onSearchUser ? await onSearchUser(cleanedSearch) : [];

            if (!results || results.length === 0) {
                setSearchStatus({
                    type: 'not_found',
                    message: "No Thrail account found with this email. Please provide the contact name and phone number below, we will save this as an external SMS contact."
                });
                setSelectedUser(null);
            } else if (results.length === 1) {
                handleSelectUser(results[0]);
            } else {
                setSearchResults(results);
                setShowDropdown(true);
            }
        } catch {
            setErrorMsg("Could not connect to the server. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user: UserSearchResult) => {
        setSelectedUser(user);
        setShowDropdown(false);
        setSearchEmail(user.email);
        
        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
        setContactName(fullName || user.email);

        if (user.phoneNumber) {
            const validity = calculateVerificationValidity(user.phoneVerifiedAt);
            setContactPhone(formatLocalPhoneNumber(cleanPhoneNumber(user.phoneNumber)));
            setSearchStatus({
                type: 'success',
                message: validity.status === 'verified'
                    ? `Successfully linked to ${user.firstname || 'user'}! (Verified Contact Number)` 
                    : `Successfully linked to ${user.firstname || 'user'}!`
            });
        } else {
            setContactPhone('');
            setSearchStatus({
                type: 'success',
                message: `We found ${user.firstname || 'user'}, but their profile is missing a phone number. Please provide it below.`
            });
        }
    };

    const handleSave = async () => {
        setErrorMsg(null);
        setSearchStatus(null);

        const cleanedContactName = contactName.trim();
        const cleanedContactPhone = cleanPhoneNumber(contactPhone);
        const cleanedMyPhone = cleanPhoneNumber(myPhone);

        if (mode === 'unified') {
            if (!cleanedMyPhone || cleanedMyPhone.length < 10) {
                setErrorMsg("Please enter your 10-digit mobile phone number.");
                return;
            }
        }

        if (!cleanedContactName) {
            setErrorMsg("Please provide the full name for your emergency contact.");
            return;
        }

        if (!cleanedContactPhone || cleanedContactPhone.length < 10) {
            setErrorMsg("Please enter a valid 10-digit emergency contact phone number.");
            return;
        }

        if (mode === 'unified' && cleanedMyPhone === cleanedContactPhone) {
            setErrorMsg("Your emergency contact number cannot be the same as your own phone number.");
            return;
        }

        if (currentUserProfile?.phoneNumber && cleanPhoneNumber(currentUserProfile.phoneNumber) === cleanedContactPhone) {
            setErrorMsg("Your emergency contact number cannot be the same as your own phone number.");
            return;
        }

        const isSelectedUserPhoneMatching = !!(
            selectedUser &&
            selectedUser.phoneNumber &&
            cleanPhoneNumber(selectedUser.phoneNumber) === cleanedContactPhone
        );

        const isInitialContactPhoneMatching = !!(
            initialEmergencyContact?.contactNumber &&
            cleanPhoneNumber(initialEmergencyContact.contactNumber) === cleanedContactPhone
        );

        const resolvedPhoneVerifiedAt = isSelectedUserPhoneMatching
            ? (selectedUser?.phoneVerifiedAt || null)
            : (isInitialContactPhoneMatching
                ? (initialEmergencyContact?.phoneVerifiedAt ?? null)
                : null);

        const contactPayload: IEmergencyContact = {
            name: cleanedContactName,
            contactNumber: cleanedContactPhone,
            userId: selectedUser ? selectedUser.id : (isInitialContactPhoneMatching ? (initialEmergencyContact?.userId || '') : ''),
            email: selectedUser ? selectedUser.email : (isInitialContactPhoneMatching ? (initialEmergencyContact?.email || '') : ''),
            phoneVerifiedAt: resolvedPhoneVerifiedAt,
        };

        if (mode === 'unified' && onSaveUnifiedContacts) {
            onSaveUnifiedContacts({
                phone: cleanedMyPhone,
                emergencyContact: contactPayload,
                linkedUser: selectedUser || null,
            });
            if (onSaveLocalPhone) {
                onSaveLocalPhone(cleanedMyPhone);
            }
            if (onClose) onClose();
            return;
        }

        setIsSaving(true);
        let success = false;
        if (onSaveEmergencyContact) {
            success = await onSaveEmergencyContact(contactPayload, selectedUser);
        }
        setIsSaving(false);

        if (success) {
            if (mode === 'unified' && onSaveLocalPhone) {
                onSaveLocalPhone(cleanedMyPhone);
            }
            if (onClose) onClose();
        } else {
            setErrorMsg("Failed to save emergency contact. Please try again.");
        }
    };

    if (!renderModal) return null;

    return (
        <Modal
            visible={renderModal}
            transparent
            animationType="none"
            onRequestClose={handleCloseOrSkip}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >

                {/* Animated Background Overlay */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={handleCloseOrSkip}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.bottomSheet,
                        isWideScreen ? styles.bottomSheetDesktop : styles.bottomSheetMobile,
                        { paddingBottom: isWideScreen ? 32 : Math.max(insets.bottom + 24, 24) },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [50, 0] : [SCREEN_HEIGHT, 0]
                                    })
                                }
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        }
                    ]}
                >
                    <View style={styles.headerRow}>
                        <CustomText variant="h2" style={styles.headerTitle}>
                            {mode === 'unified' ? "Edit Contacts" : "Emergency Setup"}
                        </CustomText>
                        <TouchableOpacity
                            onPress={handleCloseOrSkip}
                            style={styles.closeBtn}
                            disabled={isSaving}
                        >
                            <CustomIcon
                                library="Feather"
                                name="x"
                                size={20}
                                color={Colors.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >

                        {mode === 'unified' && (
                            <View style={styles.section}>
                                <CustomText style={styles.sectionTitle}>
                                    Your Phone Number
                                </CustomText>
                                <CustomText style={styles.sectionSubtitle}>
                                    For your guide to reach you during this hike.
                                </CustomText>
                                <CustomTextInput
                                    label="Phone Number"
                                    placeholder="9XX XXX XXXX"
                                    prefix="+63"
                                    type="phone"
                                    value={myPhone}
                                    keyboardType="number-pad"
                                    onChangeText={setMyPhone}
                                    maxLength={12}
                                />
                            </View>
                        )}

                        <View
                            style={[
                                styles.section,
                                {
                                    borderTopWidth: mode === 'unified' ? 1 : 0,
                                    borderColor: Colors.GRAY_ULTRALIGHT,
                                    paddingTop: mode === 'unified' ? 16 : 0
                                }
                            ]}
                        >
                            <CustomText style={styles.sectionTitle}>
                                Emergency Contact
                            </CustomText>
                            <CustomText style={styles.sectionSubtitle}>
                                Link a Thrail account by email to enable automated SOS group chats, or enter their details manually below.
                            </CustomText>

                            <View style={styles.searchRow}>
                                <View style={{ flex: 1 }}>
                                    <CustomTextInput
                                        label="Search by Email (Optional)"
                                        placeholder="friend@email.com"
                                        value={searchEmail}
                                        onChangeText={handleEmailChange}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.searchBtn}
                                    onPress={handleSearch}
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <ActivityIndicator
                                            color={Colors.WHITE}
                                            size="small"
                                        />
                                    ) : (
                                        <CustomIcon
                                            library="Feather"
                                            name="search"
                                            size={20}
                                            color={Colors.WHITE}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.alertContainer}>
                                {errorMsg ? (
                                    <ErrorMessage
                                        error={errorMsg}
                                        style={{ marginBottom: 12, width: '100%' }}
                                    />
                                ) : null}
                                {searchStatus ? (
                                    <View style={[
                                        styles.infoBox,
                                        searchStatus.type === 'not_found' ? styles.infoBoxNotFound : styles.infoBoxSuccess
                                    ]}>
                                        <CustomIcon
                                            library="Feather"
                                            name={searchStatus.type === 'not_found' ? "alert-circle" : "check-circle"}
                                            size={16}
                                            color={searchStatus.type === 'not_found' ? Colors.STATUS_CANCELLED_TEXT : Colors.STATUS_APPROVED_TEXT}
                                        />
                                        <CustomText style={[
                                            styles.infoText,
                                            searchStatus.type === 'not_found' ? styles.infoTextNotFound : styles.infoTextSuccess
                                        ]}>
                                            {searchStatus.message}
                                        </CustomText>
                                    </View>
                                ) : null}
                            </View>

                            {showDropdown && searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    {searchResults.map((user) => (
                                        <TouchableOpacity
                                            key={user.id}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectUser(user)}
                                        >
                                            <View style={styles.dropdownAvatar}>
                                                <CustomIcon
                                                    library="Feather"
                                                    name="user"
                                                    size={16}
                                                    color={Colors.PRIMARY}
                                                />
                                            </View>
                                            <View>
                                                <CustomText style={styles.dropdownName}>
                                                    {user.firstname} {user.lastname}
                                                </CustomText>
                                                <CustomText style={styles.dropdownEmail}>
                                                    {user.email}
                                                </CustomText>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={styles.inputSpacing}>
                                <CustomTextInput
                                    label="Contact Name"
                                    placeholder="Maria Dela Cruz"
                                    value={contactName}
                                    onChangeText={setContactName}
                                />
                            </View>

                            <View style={styles.inputSpacing}>
                                <CustomTextInput
                                    label="Contact Phone Number"
                                    placeholder="9XX XXX XXXX"
                                    prefix="+63"
                                    type="phone"
                                    value={contactPhone}
                                    keyboardType="number-pad"
                                    onChangeText={setContactPhone}
                                    maxLength={12}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            isSaving && { opacity: 0.7 }
                        ]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <CustomText style={styles.saveBtnText}>
                                Save & Apply
                            </CustomText>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY
    },
    backdropTouch: {
        flex: 1,
        width: '100%'
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 24,
        paddingTop: 24,
        maxHeight: '90%',
        ...GlobalStyles.dropShadow(3),
    },
    bottomSheetMobile: {
        width: '100%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    bottomSheetDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: 500,
        borderRadius: 24,
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    headerTitle: {
        marginBottom: 0
    },
    closeBtn: {
        padding: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 20
    },
    section: {
        marginBottom: 4
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4
    },
    sectionSubtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 20,
        lineHeight: 18
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 0,
        zIndex: 10
    },
    searchBtn: {
        backgroundColor: Colors.PRIMARY,
        height: 50,
        width: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28
    },
    alertContainer: {
        width: '100%'
    },
    dropdown: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 20,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(3)
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 12
    },
    dropdownAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dropdownName: {
        fontSize: 15,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold'
    },
    dropdownEmail: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2
    },
    inputSpacing: {
        marginBottom: 0
    },
    saveBtn: {
        backgroundColor: Colors.PRIMARY,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12
    },
    saveBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 16
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        gap: 8,
        width: '100%'
    },
    infoBoxSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    infoBoxNotFound: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.STATUS_CANCELLED_BORDER,
    },
    infoText: {
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
        lineHeight: 18,
    },
    infoTextSuccess: {
        color: Colors.STATUS_APPROVED_TEXT,
    },
    infoTextNotFound: {
        color: Colors.STATUS_CANCELLED_TEXT,
    }
});

export default EmergencyModal;
