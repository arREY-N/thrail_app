/**
 * @file EmergencyModal.tsx
 * @description Streamlined responsive modal for configuring, verifying, and linking emergency contacts.
 * Features inline account linking/unlinking, contextual input icons, dynamic phone normalization,
 * guaranteed mobile keyboard lifting, and real-time self-referential validation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput, { cleanPhoneNumber, formatLocalPhoneNumber } from '@/src/components/CustomTextInput';
import { CustomToast } from '@/src/components/Toast/Toast';
import {
    createReplayHelpStep,
    CustomTutorialModal,
    registerMeasureCallback,
    registerTutorialLayout,
    TutorialHelpButton,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';
import {
    emergencyModalOnlySteps,
    emergencyModalUnifiedSteps,
} from '@/src/components/Tutorial/constants';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { calculateVerificationValidity } from '@/src/core/flows/PhoneVerificationFlow';
import { IEmergencyContact, User } from '@/src/core/models/User/User';
import { toDateOrNull } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

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
 * EmergencyModal — Streamlined bottom-sheet / centered dialog for emergency contact management.
 *
 * @param props - Component props
 * @returns The rendered modal component or null
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
    onSkip,
}: EmergencyModalProps): React.JSX.Element | null => {
    const insets = useSafeAreaInsets();
    const breakpoints = useBreakpoints();
    const isWideScreen = !breakpoints.isMobile;

    const scrollViewRef = useRef<ScrollView>(null);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

    const [myPhone, setMyPhone] = useState<string>(() =>
        formatLocalPhoneNumber(cleanPhoneNumber(initialUserPhone || currentUserProfile?.phoneNumber || ''))
    );
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(() => {
        const initUserId = initialEmergencyContact?.userId ?? currentUserProfile?.emergencyContact?.userId ?? '';
        const initEmail = initialEmergencyContact?.email ?? currentUserProfile?.emergencyContact?.email ?? '';
        const initPhone = formatLocalPhoneNumber(
            cleanPhoneNumber(initialEmergencyContact?.contactNumber ?? currentUserProfile?.emergencyContact?.contactNumber ?? '')
        );
        const initPhoneVerifiedAt = toDateOrNull(initialEmergencyContact?.phoneVerifiedAt ?? currentUserProfile?.emergencyContact?.phoneVerifiedAt);
        const initName = initialEmergencyContact?.name ?? currentUserProfile?.emergencyContact?.name ?? '';
        return initUserId
            ? {
                id: initUserId,
                email: initEmail,
                phoneNumber: initPhone,
                phoneVerifiedAt: initPhoneVerifiedAt,
                firstname: initName,
            }
            : null;
    });

    const [contactName, setContactName] = useState<string>(
        () => initialEmergencyContact?.name ?? currentUserProfile?.emergencyContact?.name ?? ''
    );
    const [contactPhone, setContactPhone] = useState<string>(() =>
        formatLocalPhoneNumber(
            cleanPhoneNumber(initialEmergencyContact?.contactNumber ?? currentUserProfile?.emergencyContact?.contactNumber ?? '')
        )
    );
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'not_found'; message: string } | null>(null);

    const [toastConfig, setToastConfig] = useState<{
        message: string | null;
        type: 'error' | 'warning' | 'info' | 'success';
    }>({
        message: null,
        type: 'error',
    });
    const [hasAttemptedSave, setHasAttemptedSave] = useState<boolean>(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

    const showModalToast = (
        message: string,
        type: 'error' | 'warning' | 'info' | 'success' = 'error'
    ) => {
        setToastConfig({ message, type });
    };

    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState<boolean>(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);

            setMyPhone(
                formatLocalPhoneNumber(cleanPhoneNumber(initialUserPhone || currentUserProfile?.phoneNumber || ''))
            );
            setSearchResults([]);
            setShowDropdown(false);
            setErrorMsg(null);
            setSearchStatus(null);
            setToastConfig({ message: null, type: 'error' });
            setHasAttemptedSave(false);
            setShowDiscardConfirm(false);

            const initEmail = initialEmergencyContact?.email ?? currentUserProfile?.emergencyContact?.email ?? '';
            const initUserId = initialEmergencyContact?.userId ?? currentUserProfile?.emergencyContact?.userId ?? '';
            const initName = initialEmergencyContact?.name ?? currentUserProfile?.emergencyContact?.name ?? '';
            const initPhone = formatLocalPhoneNumber(
                cleanPhoneNumber(initialEmergencyContact?.contactNumber ?? currentUserProfile?.emergencyContact?.contactNumber ?? '')
            );
            const initPhoneVerifiedAt = toDateOrNull(initialEmergencyContact?.phoneVerifiedAt ?? currentUserProfile?.emergencyContact?.phoneVerifiedAt);

            setSearchEmail(initEmail);
            setSelectedUser(
                initUserId
                    ? {
                        id: initUserId,
                        email: initEmail,
                        phoneNumber: initPhone,
                        phoneVerifiedAt: initPhoneVerifiedAt,
                        firstname: initName,
                    }
                    : null
            );
            setContactName(initName);
            setContactPhone(initPhone);
        }
    }

    // Keyboard listener for physical bottom sheet lift on Android and iOS
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const phoneInputRef = useRef<View>(null);
    const searchAccountRef = useRef<View>(null);
    const manualContactRef = useRef<View>(null);
    const saveBtnRef = useRef<View>(null);

    const dynamicTourSteps = useMemo(() => {
        const isUnified = mode === 'unified';
        const baseSteps = isUnified ? emergencyModalUnifiedSteps : emergencyModalOnlySteps;
        return [...baseSteps, createReplayHelpStep(isUnified ? 'Contacts' : 'Emergency Contact')];
    }, [mode]);

    const tutorial = useTutorialGuide('emergency_modal', visible && renderModal, dynamicTourSteps);

    const measurePhoneNow = useCallback(() => {
        phoneInputRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_user_phone', { x, y, width, height });
            }
        });
    }, []);

    const measureSearchAccountNow = useCallback(() => {
        searchAccountRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_search_account', { x, y, width, height });
            }
        });
    }, []);

    const measureManualContactNow = useCallback(() => {
        manualContactRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_manual_contact', { x, y, width, height });
            }
        });
    }, []);

    const measureSaveBtnNow = useCallback(() => {
        saveBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('emergency_save_btn', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const unsubPhone = registerMeasureCallback('emergency_user_phone', measurePhoneNow);
        const unsubSearch = registerMeasureCallback('emergency_search_account', measureSearchAccountNow);
        const unsubManual = registerMeasureCallback('emergency_manual_contact', measureManualContactNow);
        const unsubSave = registerMeasureCallback('emergency_save_btn', measureSaveBtnNow);
        return () => {
            unsubPhone();
            unsubSearch();
            unsubManual();
            unsubSave();
        };
    }, [measurePhoneNow, measureSearchAccountNow, measureManualContactNow, measureSaveBtnNow]);

    useEffect(() => {
        if (visible && renderModal && tutorial.isVisible) {
            const stepTarget = tutorial.currentStep?.targetSpotlight;
            if (stepTarget === 'emergency_user_phone' || stepTarget === 'emergency_search_account') {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }
            const timer = setTimeout(() => {
                measurePhoneNow();
                measureSearchAccountNow();
                measureManualContactNow();
                measureSaveBtnNow();
            }, 260);
            return () => clearTimeout(timer);
        }
    }, [
        visible,
        renderModal,
        tutorial.isVisible,
        tutorial.currentStepIndex,
        tutorial.currentStep?.targetSpotlight,
        measurePhoneNow,
        measureSearchAccountNow,
        measureManualContactNow,
        measureSaveBtnNow,
    ]);

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
    }, [visible, animValue]);

    // Derived values & selective link dirty tracking
    const cleanedContactName = contactName.trim();
    const cleanedContactPhone = cleanPhoneNumber(contactPhone);
    const cleanedMyPhone = cleanPhoneNumber(myPhone);

    const initialUserId = useMemo(() => {
        return initialEmergencyContact?.userId ?? currentUserProfile?.emergencyContact?.userId ?? '';
    }, [initialEmergencyContact, currentUserProfile]);

    const initialSearchEmail = useMemo(() => {
        return (initialEmergencyContact?.email ?? currentUserProfile?.emergencyContact?.email ?? '').trim().toLowerCase();
    }, [initialEmergencyContact, currentUserProfile]);

    // Triggers discard confirmation ONLY when linked account or email search diverged
    const isLinkDirty = useMemo(() => {
        const currentUserId = selectedUser?.id || '';
        const currentEmail = searchEmail.trim().toLowerCase();
        return currentUserId !== initialUserId || currentEmail !== initialSearchEmail;
    }, [selectedUser, searchEmail, initialUserId, initialSearchEmail]);

    const isOverallDirty = useMemo(() => {
        const phoneChanged =
            mode === 'unified' &&
            cleanedMyPhone !== cleanPhoneNumber(initialUserPhone || currentUserProfile?.phoneNumber || '');
        const initialContactPhone = cleanPhoneNumber(
            initialEmergencyContact?.contactNumber ?? currentUserProfile?.emergencyContact?.contactNumber ?? ''
        );
        const initialContactName = (
            initialEmergencyContact?.name ?? currentUserProfile?.emergencyContact?.name ?? ''
        ).trim();

        const contactPhoneChanged = cleanedContactPhone !== initialContactPhone;
        const contactNameChanged = cleanedContactName !== initialContactName;

        return isLinkDirty || phoneChanged || contactPhoneChanged || contactNameChanged;
    }, [
        isLinkDirty,
        mode,
        cleanedMyPhone,
        initialUserPhone,
        currentUserProfile,
        cleanedContactPhone,
        cleanedContactName,
        initialEmergencyContact,
    ]);

    const dismissModal = useCallback(() => {
        setErrorMsg(null);
        setSearchStatus(null);
        setToastConfig({ message: null, type: 'error' });
        setHasAttemptedSave(false);
        setShowDiscardConfirm(false);
        if (onSkip) onSkip();
        if (onClose) onClose();
    }, [onSkip, onClose]);

    const handleCloseOrSkip = useCallback(() => {
        if (isLinkDirty) {
            setShowDiscardConfirm(true);
            return;
        }
        dismissModal();
    }, [isLinkDirty, dismissModal]);

    // Physical Escape key dismissal on Web
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showDiscardConfirm) {
                    setShowDiscardConfirm(false);
                } else {
                    handleCloseOrSkip();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, handleCloseOrSkip, showDiscardConfirm]);

    const handleEmailChange = (text: string) => {
        setSearchEmail(text);
        setShowDropdown(false);
        setErrorMsg(null);
        setSearchStatus(null);

        // Modifying or clearing the email search detaches the active link
        if (selectedUser) {
            setSelectedUser(null);
            if (!text.trim()) {
                setContactName('');
                setContactPhone('');
            }
        }
    };

    const handleClearEmail = () => {
        setSearchEmail('');
        setSelectedUser(null);
        setSearchStatus(null);
        setErrorMsg(null);
        setShowDropdown(false);
        setContactName('');
        setContactPhone('');
    };

    const handleSearch = async () => {
        setErrorMsg(null);
        setSearchStatus(null);
        const cleanedSearch = searchEmail.trim().toLowerCase();

        if (!cleanedSearch) return;

        if (cleanedSearch === currentUserProfile?.email?.trim().toLowerCase()) {
            const msg = 'You cannot use your own email as an emergency contact.';
            setErrorMsg(msg);
            showModalToast(msg, 'error');
            return;
        }

        setIsSearching(true);
        setShowDropdown(false);

        try {
            const results = onSearchUser ? await onSearchUser(cleanedSearch) : [];

            if (!results || results.length === 0) {
                setSearchStatus({
                    type: 'not_found',
                    message: 'No Thrail account found — saving as SMS contact.',
                });
                setSelectedUser(null);
            } else if (results.length === 1) {
                handleSelectUser(results[0]);
            } else {
                setSearchResults(results);
                setShowDropdown(true);
            }
        } catch {
            const msg = 'Could not connect to the server. Please try again.';
            setErrorMsg(msg);
            showModalToast(msg, 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user: UserSearchResult) => {
        setSelectedUser(user);
        setShowDropdown(false);
        setSearchEmail(user.email);
        setErrorMsg(null);

        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
        setContactName(fullName || user.email);

        if (user.phoneNumber) {
            const validity = calculateVerificationValidity(user.phoneVerifiedAt);
            setContactPhone(formatLocalPhoneNumber(cleanPhoneNumber(user.phoneNumber)));
            setSearchStatus({
                type: 'success',
                message:
                    validity.status === 'verified'
                        ? `Linked to ${user.firstname || 'user'}! (Verified Contact Number)`
                        : `Linked to ${user.firstname || 'user'}!`,
            });
        } else {
            setContactPhone('');
            setSearchStatus({
                type: 'success',
                message: `Linked to ${user.firstname || 'user'}. Please enter their contact number below for SMS alerts.`,
            });
        }
    };

    // Derived states & validation
    const isContactPhoneSelf = useMemo(() => {
        if (!cleanedContactPhone) return false;
        if (mode === 'unified' && cleanedMyPhone && cleanedMyPhone === cleanedContactPhone) {
            return true;
        }
        if (currentUserProfile?.phoneNumber && cleanPhoneNumber(currentUserProfile.phoneNumber) === cleanedContactPhone) {
            return true;
        }
        return false;
    }, [cleanedContactPhone, cleanedMyPhone, mode, currentUserProfile]);

    const isContactPhoneValid = cleanedContactPhone.length === 11 && cleanedContactPhone.startsWith('09');
    const isMyPhoneValid = mode !== 'unified' || (cleanedMyPhone.length === 11 && cleanedMyPhone.startsWith('09'));
    const isContactNameValid = cleanedContactName.length >= 2;

    const isLinked = Boolean(selectedUser);
    const isPhoneLocked = Boolean(isLinked && selectedUser?.phoneNumber);
    const isNameLocked = isLinked;

    const isSaveDisabled =
        isSaving ||
        isSearching ||
        !isContactNameValid ||
        !isContactPhoneValid ||
        !isMyPhoneValid ||
        isContactPhoneSelf;

    const handleSave = async () => {
        setErrorMsg(null);
        setSearchStatus(null);

        // Feedback toast when opened and clicked without any modifications
        if (!isOverallDirty) {
            showModalToast('No changes made. Contact details are already up to date.', 'info');
            return;
        }

        if (mode === 'unified') {
            if (!cleanedMyPhone || cleanedMyPhone.length < 11 || !cleanedMyPhone.startsWith('09')) {
                const msg = 'Please enter your 10-digit mobile phone number (09XX XXX XXXX).';
                setErrorMsg(msg);
                setHasAttemptedSave(true);
                showModalToast(msg, 'error');
                return;
            }
        }

        if (!cleanedContactName) {
            const msg = 'Please provide the full name for your emergency contact.';
            setErrorMsg(msg);
            setHasAttemptedSave(true);
            showModalToast(msg, 'error');
            return;
        }

        if (!cleanedContactPhone || cleanedContactPhone.length < 11 || !cleanedContactPhone.startsWith('09')) {
            const msg = 'Please enter a valid 10-digit emergency contact phone number (09XX XXX XXXX).';
            setErrorMsg(msg);
            setHasAttemptedSave(true);
            showModalToast(msg, 'error');
            return;
        }

        if (isContactPhoneSelf) {
            const msg = 'Your emergency contact number cannot be the same as your own phone number.';
            setErrorMsg(msg);
            setHasAttemptedSave(true);
            showModalToast(msg, 'error');
            return;
        }

        const isSelectedUserPhoneMatching = Boolean(
            selectedUser &&
            selectedUser.phoneNumber &&
            cleanPhoneNumber(selectedUser.phoneNumber) === cleanedContactPhone
        );

        const hasValidUserLink = Boolean(selectedUser && (isSelectedUserPhoneMatching || !selectedUser.phoneNumber));

        const contactPayload: IEmergencyContact = {
            name: cleanedContactName,
            contactNumber: cleanedContactPhone,
            userId: selectedUser && hasValidUserLink ? selectedUser.id : '',
            email: selectedUser ? selectedUser.email : searchEmail.trim(),
            phoneVerifiedAt: selectedUser && hasValidUserLink ? (selectedUser.phoneVerifiedAt || null) : null,
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
            const msg = 'Failed to save emergency contact. Please try again.';
            setErrorMsg(msg);
            setHasAttemptedSave(true);
            showModalToast(msg, 'error');
        }
    };

    if (!renderModal) return null;

    // Email field icon & color determination
    const emailLeftIcon = isLinked ? 'check-circle' : searchStatus?.type === 'not_found' || errorMsg ? 'alert-circle' : 'search';
    const emailLeftIconColor = isLinked ? Colors.PRIMARY : searchStatus?.type === 'not_found' || errorMsg ? Colors.ERROR : Colors.TEXT_SECONDARY;

    // Toast offset calculation: guarantee clean 12px floating headroom above Save & Apply button
    const footerPadding = isWideScreen ? 24 : Math.max(insets.bottom + 16, 24);
    const footerTotalHeight =
        (keyboardHeight > 0 ? keyboardHeight + 16 : footerPadding) + 52 + 8 + 1;
    const toastBottomOffset = footerTotalHeight + 12;

    return (
        <Modal
            visible={renderModal}
            transparent={true}
            animationType="none"
            onRequestClose={handleCloseOrSkip}
            statusBarTranslucent={true}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={undefined}
            >
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={handleCloseOrSkip}
                    />
                </Animated.View>

                {/* Modal Container */}
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        isWideScreen ? styles.bottomSheetDesktop : styles.bottomSheetMobile,
                        {
                            paddingBottom: keyboardHeight > 0
                                ? keyboardHeight + 16
                                : isWideScreen
                                ? 24
                                : Math.max(insets.bottom + 16, 24),
                            maxHeight: isWideScreen
                                ? '85%'
                                : keyboardHeight > 0
                                ? Math.round((SCREEN_HEIGHT - keyboardHeight - insets.top) * 0.88) + keyboardHeight + 16
                                : '90%',
                        },
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isWideScreen ? [40, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isWideScreen ? animValue : 1,
                        },
                    ]}
                >
                    {/* Fixed Header */}
                    <View style={styles.fixedHeader}>
                        {!isWideScreen && <View style={styles.sheetHandle} />}
                        <View style={styles.headerTitleRow}>
                            <CustomText variant="h2" style={styles.headerTitle}>
                                {mode === 'unified' ? 'Edit Contacts' : 'Emergency Setup'}
                            </CustomText>
                            <View style={styles.headerActions}>
                                <TutorialHelpButton onPress={tutorial.onReplayTour} />
                                <TouchableOpacity
                                    onPress={handleCloseOrSkip}
                                    style={styles.closeBtn}
                                    disabled={isSaving}
                                    accessibilityLabel="Close emergency contact modal"
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon
                                        library="Feather"
                                        name="x"
                                        size={20}
                                        color={Colors.TEXT_PRIMARY}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Scrollable Form Body */}
                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollBody}
                    >
                        {/* Section 1: User's Phone Number (Unified Mode) */}
                        {mode === 'unified' && (
                            <View ref={phoneInputRef} collapsable={false} style={styles.sectionContainer}>
                                <CustomText style={styles.sectionTitle}>
                                    Your Phone Number
                                </CustomText>
                                <CustomText style={styles.sectionSubtitle}>
                                    For your guide and organizers to reach you during this hike.
                                </CustomText>
                                <CustomTextInput
                                    placeholder="9XX XXX XXXX"
                                    prefix="+63"
                                    type="phone"
                                    value={myPhone}
                                    keyboardType="number-pad"
                                    onChangeText={setMyPhone}
                                    maxLength={12}
                                />
                                <View style={styles.sectionDivider} />
                            </View>
                        )}

                        {/* Section 2: Emergency Contact */}
                        <View style={styles.sectionContainer}>
                            <CustomText style={styles.sectionTitle}>
                                Emergency Contact
                            </CustomText>
                            <CustomText style={styles.sectionSubtitle}>
                                Link a Thrail account for automated SOS chat, or enter their details manually below.
                            </CustomText>

                            {/* Search Hiker by Email Input */}
                            <View ref={searchAccountRef} collapsable={false} style={styles.searchFieldWrapper}>
                                <CustomText variant="label" style={styles.fieldLabel}>
                                    Search Hiker by Email (Optional)
                                </CustomText>
                                <View style={styles.searchRow}>
                                    <View style={styles.searchInputFlex}>
                                        <CustomTextInput
                                            placeholder="hiker@email.com"
                                            value={searchEmail}
                                            onChangeText={handleEmailChange}
                                            onSubmitEditing={handleSearch}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            icon={emailLeftIcon}
                                            iconColor={emailLeftIconColor}
                                            style={[
                                                styles.searchInputStyle,
                                                isLinked && styles.inputContainerLinked,
                                            ]}
                                            innerRightElement={
                                                searchEmail.trim().length > 0 ? (
                                                    <TouchableOpacity
                                                        onPress={handleClearEmail}
                                                        style={styles.innerClearBtn}
                                                        activeOpacity={0.7}
                                                        accessibilityLabel="Clear email"
                                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                    >
                                                        <CustomIcon
                                                            library="Feather"
                                                            name="x-circle"
                                                            size={18}
                                                            color={Colors.GRAY_MEDIUM}
                                                        />
                                                    </TouchableOpacity>
                                                ) : null
                                            }
                                        />
                                    </View>

                                    {!isLinked && (
                                        <TouchableOpacity
                                            onPress={handleSearch}
                                            style={[
                                                styles.searchBtn,
                                                (searchEmail.trim().length === 0 || isSearching) && styles.searchBtnDisabled,
                                            ]}
                                            activeOpacity={0.7}
                                            disabled={searchEmail.trim().length === 0 || isSearching}
                                            accessibilityLabel="Search user"
                                        >
                                            {isSearching ? (
                                                <ActivityIndicator size="small" color={Colors.WHITE} />
                                            ) : (
                                                <CustomIcon
                                                    library="Feather"
                                                    name="search"
                                                    size={20}
                                                    color={Colors.WHITE}
                                                />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Inline Contextual Helper / Status */}
                                {isLinked && (
                                    <View style={styles.inlineStatusRow}>
                                        <CustomText style={styles.linkedCaptionText}>
                                            {`Linked to ${contactName || 'Thrail hiker'} (Automated SOS chat enabled)`}
                                        </CustomText>
                                    </View>
                                )}

                                {searchStatus?.type === 'not_found' && !isLinked && (
                                    <CustomText style={styles.notFoundCaptionText}>
                                        No Thrail account found — saving as external SMS contact.
                                    </CustomText>
                                )}

                            </View>

                            {/* Dropdown for multiple search results */}
                            {showDropdown && searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    {searchResults.map((user) => (
                                        <TouchableOpacity
                                            key={user.id}
                                            style={styles.dropdownItem}
                                            onPress={() => handleSelectUser(user)}
                                            activeOpacity={0.7}
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

                            {/* Manual Contact Details */}
                            <View ref={manualContactRef} collapsable={false} style={styles.manualContactSection}>
                                {/* Contact Name Input */}
                                <View style={styles.fieldWrapper}>
                                    <CustomTextInput
                                        label="Contact Name"
                                        placeholder="Full Name (e.g. Maria Dela Cruz)"
                                        value={contactName}
                                        onChangeText={setContactName}
                                        editable={!isNameLocked}
                                        icon={isLinked ? 'user-check' : 'user'}
                                        iconColor={isLinked ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                                        style={isNameLocked ? styles.inputLocked : undefined}
                                        innerRightElement={
                                            isNameLocked ? (
                                                <View style={styles.innerLockBadge}>
                                                    <CustomIcon
                                                        library="Feather"
                                                        name="lock"
                                                        size={16}
                                                        color={Colors.TEXT_SECONDARY}
                                                    />
                                                </View>
                                            ) : undefined
                                        }
                                    />
                                </View>

                                {/* Contact Phone Input */}
                                <View style={styles.fieldWrapper}>
                                    <CustomTextInput
                                        label="Contact Phone Number"
                                        placeholder="9XX XXX XXXX"
                                        prefix="+63"
                                        type="phone"
                                        value={contactPhone}
                                        keyboardType="number-pad"
                                        onChangeText={setContactPhone}
                                        maxLength={12}
                                        editable={!isPhoneLocked}
                                        style={[
                                            styles.noMarginBottom,
                                            isPhoneLocked && styles.inputLocked,
                                        ]}
                                        innerRightElement={
                                            isPhoneLocked ? (
                                                <View style={styles.innerLockBadge}>
                                                    <CustomIcon
                                                        library="Feather"
                                                        name="lock"
                                                        size={16}
                                                        color={Colors.TEXT_SECONDARY}
                                                    />
                                                </View>
                                            ) : undefined
                                        }
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Fixed Footer CTA with Encapsulated Validation State */}
                    <View style={styles.fixedFooter}>
                        <View ref={saveBtnRef} collapsable={false} style={styles.saveBtnWrapper}>
                            <CustomButton
                                title="Save & Apply"
                                onPress={handleSave}
                                disabled={isSaving}
                                isLoading={isSaving}
                                validationState={
                                    !isSaveDisabled && isOverallDirty
                                        ? 'valid'
                                        : (hasAttemptedSave ? 'error' : 'idle')
                                }
                                isIdleDisabled={false}
                                style={styles.saveBtn}
                            />
                        </View>
                    </View>

                    {/* Floating Toast Alert inside Modal with Responsive Safe-Area Docking */}
                    <CustomToast
                        visible={!!toastConfig.message}
                        message={toastConfig.message || ''}
                        onHide={() => {
                            setToastConfig({ message: null, type: 'error' });
                            setHasAttemptedSave(false);
                        }}
                        type={toastConfig.type}
                        mode="simple"
                        position="floating"
                        bottomOffset={toastBottomOffset}
                    />
                </Animated.View>

                {/* In-app walkthrough overlay for EmergencyModal */}
                <CustomTutorialModal
                    visible={tutorial.isVisible}
                    tourConfig={tutorial.tourConfig}
                    currentStep={tutorial.currentStep}
                    currentStepIndex={tutorial.currentStepIndex}
                    totalSteps={tutorial.totalSteps}
                    useModal={Platform.OS === 'web'}
                    onNext={tutorial.onNextStep}
                    onPrev={tutorial.onPrevStep}
                    onSkip={tutorial.onSkipTour}
                />
            </KeyboardAvoidingView>

            {/* Discard Unsaved Changes Confirmation Modal */}
            <ConfirmationModal
                visible={showDiscardConfirm}
                title="Discard Changes?"
                message="You changed the linked emergency contact. Do you want to exit without saving?"
                confirmText="Discard"
                cancelText="Keep Editing"
                isDestructive={true}
                onConfirm={() => {
                    setShowDiscardConfirm(false);
                    dismissModal();
                }}
                onClose={() => setShowDiscardConfirm(false)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
        width: '100%',
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 16 }),
    },
    bottomSheetMobile: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    bottomSheetDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: '92%',
        maxWidth: 520,
        borderRadius: 24,
    },
    fixedHeader: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16,
    },
    scrollBody: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    sectionContainer: {
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 14,
        lineHeight: 18,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginTop: 0,
        marginBottom: 12,
        width: '100%',
    },
    fieldWrapper: {
        width: '100%',
        marginBottom: 0,
    },
    searchFieldWrapper: {
        width: '100%',
        marginBottom: 16,
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    fieldLabel: {
        marginLeft: 2,
        marginBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    searchInputFlex: {
        flex: 1,
    },
    searchInputStyle: {
        marginBottom: 0,
    },
    searchBtn: {
        width: 54,
        height: 54,
        borderRadius: 12,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBtnDisabled: {
        backgroundColor: Colors.GRAY_LIGHT,
        opacity: 0.6,
    },
    inputContainerLinked: {
        borderColor: Colors.PRIMARY,
    },
    innerClearBtn: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineStatusRow: {
        marginTop: 6,
        paddingLeft: 4,
    },
    linkedCaptionText: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    notFoundCaptionText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 6,
        paddingLeft: 4,
    },
    inputLocked: {
        opacity: 0.85,
    },
    innerLockBadge: {
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdown: {
        backgroundColor: Colors.WHITE,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 12,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(3),
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
    },
    dropdownAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownName: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    dropdownEmail: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    fixedFooter: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    saveBtnWrapper: {
        width: '100%',
    },
    manualContactSection: {
        width: '100%',
        marginBottom: 0,
    },
    saveBtn: {
        width: '100%',
        borderRadius: 14,
    },
});

export default EmergencyModal;
