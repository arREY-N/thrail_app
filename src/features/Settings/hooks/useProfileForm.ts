/**
 * @file useProfileForm.ts
 * @description Hook managing profile edit states, validation, search inputs, and saving operations.
 */

import { useState } from 'react';

import { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import { EmergencyContactFlow } from "@/src/core/flows/EmergencyContactFlow";
import { IEmergencyContact, IMedicalProfile, IPreference, IUser } from "@/src/core/models/User/User";
import { toDateOrNull } from "@/src/core/utility/date";
import { safeParseDateString } from "@/src/utils/dateFormatter";

export interface UseProfileFormParams {
    user: IUser;
    isEditing: boolean;
    onSavePress?: (updatedFields: Partial<IUser>) => Promise<void>;
    onCancelPress?: () => void;
    onEditPress: () => void;
}

interface LinkedContactUser {
    id: string;
    phoneNumber?: string;
    email?: string;
}

export function useProfileForm({
    user,
    isEditing,
    onSavePress,
    onCancelPress,
    onEditPress,
}: UseProfileFormParams) {
    const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
    const [isSaveModalVisible, setIsSaveModalVisible] = useState<boolean>(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState<boolean>(false);
    const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState<boolean>(false);

    const [username, setUsername] = useState<string>(user.username || '');
    const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || '');
    const [birthday, setBirthday] = useState<Date | null>(user.birthday ? safeParseDateString(user.birthday) : null);
    const [address, setAddress] = useState<string>(user.address || '');
    const [medicalProfile, setMedicalProfile] = useState<IMedicalProfile>(user.medicalProfile || { hasCondition: false, details: [], clearanceUri: '' });
    const [emergencyContact, setEmergencyContact] = useState<IEmergencyContact>(user.emergencyContact || { name: '', contactNumber: '', email: '' });
    const [preferences, setPreferences] = useState<IPreference>(user.preferences || { experience: 'Beginner', location: [], hike_length: [], province: [] });

    const [linkedUser, setLinkedUser] = useState<LinkedContactUser | null>(
        user.emergencyContact?.userId
            ? {
                id: user.emergencyContact.userId,
                phoneNumber: user.emergencyContact.contactNumber || '',
                email: user.emergencyContact.email || '',
            }
            : null
    );

    const { findUser, setEmergencyContact: saveEmergencyContactToDb } = EmergencyContactFlow();

    const handleSaveEmergencyContact = async (contact: IEmergencyContact, linkedUserResult?: Partial<IUser> | null): Promise<boolean> => {
        const success = await saveEmergencyContactToDb(contact, linkedUserResult);
        if (success) {
            setEmergencyContact(contact);
            setLinkedUser(contact.userId ? {
                id: contact.userId,
                phoneNumber: contact.contactNumber,
                email: contact.email,
            } : null);
        }
        return success;
    };
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchSuccess, setSearchSuccess] = useState<string | null>(null);
    const [searchInfo, setSearchInfo] = useState<string | null>(null);

    const [formError, setFormError] = useState<string | null>(null);

    const [prevResetKey, setPrevResetKey] = useState({ isEditing, user });
    if (prevResetKey.isEditing !== isEditing || prevResetKey.user !== user) {
        setPrevResetKey({ isEditing, user });
        if (!isEditing) {
            setUsername(user.username || '');
            setPhoneNumber(user.phoneNumber || '');
            setBirthday(user.birthday ? safeParseDateString(user.birthday) : null);
            setAddress(user.address || '');
            setMedicalProfile(user.medicalProfile || { hasCondition: false, details: [], clearanceUri: '' });
            setEmergencyContact(user.emergencyContact || { name: '', contactNumber: '', email: '' });
            setPreferences(user.preferences || { experience: 'Beginner', location: [], hike_length: [], province: [] });
            setSearchEmail('');
            setLinkedUser(user.emergencyContact?.userId ? {
                id: user.emergencyContact.userId,
                phoneNumber: user.emergencyContact.contactNumber || '',
                email: user.emergencyContact.email || '',
            } : null);
            setSearchError(null);
            setSearchSuccess(null);
            setSearchInfo(null);
            setFormError(null);
        } else {
            setSearchEmail('');
            setSearchError(null);
            setSearchSuccess(null);
            setSearchInfo(null);
        }
    }

    const isDirty =
        username !== (user.username || '') ||
        phoneNumber !== (user.phoneNumber || '') ||
        (birthday?.getTime() !== (user.birthday ? safeParseDateString(user.birthday).getTime() : undefined)) ||
        address !== (user.address || '') ||
        JSON.stringify(medicalProfile) !== JSON.stringify(user.medicalProfile || { hasCondition: false, details: [], clearanceUri: '' }) ||
        JSON.stringify(emergencyContact) !== JSON.stringify(user.emergencyContact || { name: '', contactNumber: '', email: '' }) ||
        JSON.stringify(preferences) !== JSON.stringify(user.preferences || { experience: 'Beginner', location: [], hike_length: [], province: [] });

    const handleConfirmEdit = (): void => {
        setIsEditModalVisible(false);
        onEditPress();
    };

    const handleSearchEmailChange = (text: string) => {
        setSearchEmail(text);
        setSearchError(null);
        const cleaned = text.trim().toLowerCase();
        if (linkedUser && cleaned !== (linkedUser.email || '').trim().toLowerCase()) {
            setLinkedUser(null);
            setSearchSuccess(null);
            setEmergencyContact(prev => ({
                ...prev,
                userId: '',
                phoneVerifiedAt: null,
            }));
        }
    };

    const handleContactNameChange = (text: string) => {
        setEmergencyContact(prev => ({ ...prev, name: text }));
    };

    const handleContactNumberChange = (text: string) => {
        const cleanedText = cleanPhoneNumber(text);
        const linkedPhone = cleanPhoneNumber(linkedUser?.phoneNumber || '');
        const isPhoneMatchingLinked = !!(linkedUser && linkedPhone && cleanedText === linkedPhone);

        if (linkedUser && !isPhoneMatchingLinked) {
            setLinkedUser(null);
            setSearchSuccess(null);
            setEmergencyContact(prev => ({
                ...prev,
                contactNumber: text,
                userId: '',
                phoneVerifiedAt: null,
            }));
        } else {
            setEmergencyContact(prev => ({ ...prev, contactNumber: text }));
        }
    };

    const handleContactEmailChange = (text: string) => {
        const cleanedText = text.trim().toLowerCase();
        const linkedEmail = (linkedUser?.email || '').trim().toLowerCase();
        const isEmailMatchingLinked = !!(linkedUser && linkedEmail && cleanedText === linkedEmail);

        if (linkedUser && !isEmailMatchingLinked) {
            setLinkedUser(null);
            setSearchSuccess(null);
            setEmergencyContact(prev => ({
                ...prev,
                email: text,
                userId: '',
                phoneVerifiedAt: null,
            }));
        } else {
            setEmergencyContact(prev => ({ ...prev, email: text }));
        }
    };

    const handleEmergencySearch = async () => {
        setSearchError(null);
        setSearchSuccess(null);
        setSearchInfo(null);
        const cleanedEmail = searchEmail.trim().toLowerCase();
        if (!cleanedEmail) return;
        if (cleanedEmail === user.email?.trim().toLowerCase()) {
            setSearchError("You cannot use your own email.");
            return;
        }
        setIsSearching(true);
        try {
            const results = await findUser(cleanedEmail);
            if (!results || results.length === 0) {
                setSearchInfo("No Thrail account found with this email. Please provide the contact name and phone number manually, we will save this as an external SMS contact.");
                setSearchSuccess(null);
                setLinkedUser(null);
                setEmergencyContact(prev => ({
                    ...prev,
                    email: cleanedEmail,
                    userId: '',
                    phoneVerifiedAt: null,
                }));
            } else {
                const foundUser = results[0];
                setLinkedUser({
                    id: foundUser.id,
                    phoneNumber: foundUser.phoneNumber || '',
                    email: foundUser.email || '',
                });
                setEmergencyContact({
                    name: `${foundUser.firstname || ''} ${foundUser.lastname || ''}`.trim(),
                    contactNumber: foundUser.phoneNumber || '',
                    email: foundUser.email || '',
                    userId: foundUser.id,
                    phoneVerifiedAt: toDateOrNull(foundUser.phoneVerifiedAt),
                });
                setSearchSuccess(`Found and linked ${foundUser.firstname || 'user'}! This contact will unlock automated SOS group chats.`);
            }
        } catch {
            setSearchError("Error searching. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleCancelPress = () => {
        if (isDirty) {
            setIsCancelModalVisible(true);
        } else {
            if (onCancelPress) onCancelPress();
        }
    };

    const isPhoneChanged = phoneNumber.trim() !== (user.phoneNumber || '').trim();
    const isEmergencyPhoneChanged = (emergencyContact.contactNumber || '').trim() !== (user.emergencyContact?.contactNumber || '').trim();

    const willResetPersonalVerification = isPhoneChanged && !!user.phoneVerifiedAt;
    const willResetEmergencyVerification = isEmergencyPhoneChanged && !!user.emergencyContact?.phoneVerifiedAt;
    const willResetAnyVerification = willResetPersonalVerification || willResetEmergencyVerification;

    const handleSave = async (): Promise<void> => {
        if (onSavePress) {
            const hasName = !!emergencyContact.name?.trim();
            const hasPhone = !!emergencyContact.contactNumber?.trim();
            const hasEmail = !!emergencyContact.email?.trim();

            if (!hasName && !hasPhone && !hasEmail) {
                await onSavePress({
                    username,
                    phoneNumber,
                    birthday: birthday ?? undefined,
                    address,
                    medicalProfile,
                    emergencyContact: {
                        name: '',
                        contactNumber: '',
                        email: '',
                        userId: '',
                        phoneVerifiedAt: null,
                    },
                    preferences,
                    phoneVerifiedAt: isPhoneChanged ? null : (user.phoneVerifiedAt ?? null),
                });
                return;
            }

            const cleanedContactNumber = cleanPhoneNumber(emergencyContact.contactNumber || '');
            const linkedContactPhone = cleanPhoneNumber(linkedUser?.phoneNumber || '');
            const isPhoneMatch = !!(linkedUser && linkedContactPhone && cleanedContactNumber === linkedContactPhone);

            const isLinked = !!(
                linkedUser &&
                emergencyContact.userId &&
                linkedUser.id === emergencyContact.userId &&
                isPhoneMatch
            );

            const resolvedEmergencyContact: IEmergencyContact = {
                name: emergencyContact.name.trim(),
                contactNumber: emergencyContact.contactNumber.trim(),
                email: (emergencyContact.email || '').trim(),
                userId: isLinked ? emergencyContact.userId : '',
                phoneVerifiedAt: isLinked ? (isEmergencyPhoneChanged ? null : (user.emergencyContact?.phoneVerifiedAt ?? null)) : null,
            };

            await onSavePress({
                username,
                phoneNumber,
                birthday: birthday ?? undefined,
                address,
                medicalProfile,
                emergencyContact: resolvedEmergencyContact,
                preferences,
                phoneVerifiedAt: isPhoneChanged ? null : (user.phoneVerifiedAt ?? null),
            });
        }
    };


    const handleSavePress = () => {
        if (!username.trim()) {
            setFormError("Username is required.");
            return;
        }
        if (medicalProfile.hasCondition && (!medicalProfile.details || medicalProfile.details.length === 0)) {
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

    return {
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
        willResetAnyVerification,
        willResetPersonalVerification,
        willResetEmergencyVerification,
        findUser,
        handleSaveEmergencyContact,
        handleSearchEmailChange,
        handleContactNameChange,
        handleContactNumberChange,
        handleContactEmailChange,
        linkedUser,
    };
}
