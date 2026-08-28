/**
 * @file useProfileForm.ts
 * @description Hook managing profile edit states, validation, search inputs, and saving operations.
 */

import { useState } from 'react';

import { useEmergencyContact } from "@/src/core/hook/user/useEmergencyContact";
import { IEmergencyContact, IMedicalProfile, IPreference, IUser } from "@/src/core/models/User/User";
import { safeParseDateString } from "@/src/utils/dateFormatter";

export interface UseProfileFormParams {
    user: IUser;
    isEditing: boolean;
    onSavePress?: (updatedFields: Partial<IUser>) => void;
    onCancelPress?: () => void;
    onEditPress: () => void;
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

    const { findUser } = useEmergencyContact();
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
            setSearchEmail(user.emergencyContact?.email || '');
            setSearchError(null);
            setSearchSuccess(null);
            setSearchInfo(null);
            setFormError(null);
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
            } else {
                const foundUser = results[0];
                setEmergencyContact({
                    name: `${foundUser.firstname || ''} ${foundUser.lastname || ''}`.trim(),
                    contactNumber: foundUser.phoneNumber || '',
                    email: foundUser.email || '',
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
    };
}
