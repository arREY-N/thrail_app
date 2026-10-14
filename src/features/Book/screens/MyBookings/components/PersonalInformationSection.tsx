/**
 * @file PersonalInformationSection.tsx
 * @description Renders the personal information accordion section in BookingDetailsScreen,
 * displaying hiker and emergency contact details with vertically centered verification pills.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { cleanPhoneNumber, formatLocalPhoneNumber } from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';
import { VerificationValidityInfo } from '@/src/core/flows/PhoneVerificationFlow';
import { BookingStatus, IUserBooking } from '@/src/core/models/Booking/Booking';
import { IEmergencyContact, User } from '@/src/core/models/User/User';

import AccordionItem from '@/src/features/Book/screens/MyBookings/components/AccordionItem';

export interface PersonalInformationSectionProps {
    /** The authenticated user profile or booking user information */
    user?: IUserBooking<Date> | User | null;
    /** Current local/staged hiker phone number */
    localUserPhone: string;
    /** Current local/staged emergency contact details */
    localEmergencyContact?: IEmergencyContact | null;
    /** Validity state for hiker phone number */
    userPhoneValidity: VerificationValidityInfo;
    /** Validity state for emergency contact number */
    emergencyPhoneValidity: VerificationValidityInfo;
    /** Human-readable expiration countdown for user phone */
    userExpiryText?: string | null;
    /** Human-readable expiration countdown for emergency contact */
    emergencyExpiryText?: string | null;
    /** Current display status of the booking */
    displayStatus?: BookingStatus;
    /** Whether the booking is in a cancelled/terminal state */
    isCancelled: boolean;
    /** Callback when user presses Edit Contact Details */
    onEditContactsPress: () => void;
}

/**
 * PersonalInformationSection component for booking details.
 *
 * @param props - Component properties
 * @returns Rendered JSX element
 */
const PersonalInformationSection = ({
    user,
    localUserPhone,
    localEmergencyContact,
    userPhoneValidity,
    emergencyPhoneValidity,
    userExpiryText,
    emergencyExpiryText,
    displayStatus,
    isCancelled,
    onEditContactsPress,
}: PersonalInformationSectionProps): React.JSX.Element => {
    const renderVerificationPill = (validity: VerificationValidityInfo, isLinked?: boolean): React.JSX.Element => {
        if (validity.status === 'verified') {
            return (
                <View style={styles.verifiedPill}>
                    <CustomIcon library="Feather" name="check" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                    <CustomText style={styles.verifiedPillText}>
                        Verified
                    </CustomText>
                </View>
            );
        }
        if (validity.status === 'expired') {
            return (
                <View style={styles.expiredPill}>
                    <CustomIcon library="Feather" name="alert-octagon" size={10} color={Colors.VERIFICATION_EXPIRED_TEXT} />
                    <CustomText style={styles.expiredPillText}>
                        Expired
                    </CustomText>
                </View>
            );
        }
        if (isLinked) {
            return (
                <View style={styles.linkedPill}>
                    <CustomIcon library="Feather" name="link" size={10} color={Colors.STATUS_APPROVED_TEXT} />
                    <CustomText style={styles.linkedPillText}>
                        Linked
                    </CustomText>
                </View>
            );
        }
        return (
            <View style={styles.unverifiedPill}>
                <CustomText style={styles.unverifiedPillText}>
                    Unverified
                </CustomText>
            </View>
        );
    };

    return (
        <AccordionItem
            title="Personal Information"
            icon="user"
            defaultOpen={displayStatus === 'reservation-rejected'}
        >
            {user ? (
                <View style={styles.attendeeBlock}>
                    <View>
                        <CustomText variant="caption" style={styles.attendeeLabel}>
                            Full Name
                        </CustomText>
                        <CustomText variant="body" style={styles.attendeeValue}>
                            {user.firstname} {user.lastname}
                        </CustomText>
                        <CustomText variant="caption" style={styles.attendeeSubValue}>
                            {user.email}
                        </CustomText>
                    </View>
                    <View style={styles.phoneSectionRow}>
                        <View style={styles.phoneDetailsColumn}>
                            <CustomText variant="caption" style={styles.attendeeLabel}>
                                Phone Number
                            </CustomText>
                            <CustomText variant="body" style={styles.attendeeValue}>
                                {localUserPhone ? formatLocalPhoneNumber(cleanPhoneNumber(localUserPhone)) : 'Not set'}
                            </CustomText>
                            {userExpiryText ? (
                                <CustomText variant="caption" style={styles.validityCountdownText}>
                                    {userExpiryText}
                                </CustomText>
                            ) : null}
                        </View>
                        {localUserPhone ? renderVerificationPill(userPhoneValidity, false) : null}
                    </View>
                </View>
            ) : null}

            {user && localEmergencyContact ? <View style={styles.divider} /> : null}

            {localEmergencyContact ? (
                <View style={styles.attendeeBlock}>
                    <View>
                        <CustomText variant="caption" style={styles.attendeeLabel}>
                            Emergency Contact
                        </CustomText>
                        <CustomText variant="body" style={styles.attendeeValue}>
                            {localEmergencyContact.name || 'Not set'}
                        </CustomText>
                    </View>
                    <View style={styles.phoneSectionRow}>
                        <View style={styles.phoneDetailsColumn}>
                            <CustomText variant="caption" style={styles.attendeeLabel}>
                                Contact Number
                            </CustomText>
                            <CustomText variant="body" style={styles.attendeeValue}>
                                {localEmergencyContact.contactNumber
                                    ? formatLocalPhoneNumber(cleanPhoneNumber(localEmergencyContact.contactNumber))
                                    : 'No contact number'}
                            </CustomText>
                            {emergencyExpiryText ? (
                                <CustomText variant="caption" style={styles.validityCountdownText}>
                                    {emergencyExpiryText}
                                </CustomText>
                            ) : null}
                        </View>
                        {localEmergencyContact.contactNumber ? renderVerificationPill(emergencyPhoneValidity, Boolean(localEmergencyContact.userId)) : null}
                    </View>
                </View>
            ) : null}

            {displayStatus === 'reservation-rejected' && !isCancelled ? (
                <TouchableOpacity
                    style={styles.editContactsBtn}
                    onPress={onEditContactsPress}
                    activeOpacity={0.7}
                >
                    <CustomIcon library="Feather" name="edit-3" size={13} color={Colors.PRIMARY} />
                    <CustomText style={styles.editContactsBtnText}>
                        Edit Contact Details
                    </CustomText>
                </TouchableOpacity>
            ) : null}
        </AccordionItem>
    );
};

const styles = StyleSheet.create({
    attendeeBlock: {
        marginVertical: 0,
    },
    attendeeLabel: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 3,
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    attendeeValue: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
    },
    attendeeSubValue: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    phoneSectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    phoneDetailsColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    validityCountdownText: {
        fontSize: 10,
        color: Colors.PRIMARY,
        fontWeight: '600',
        marginTop: 3,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 10,
    },
    editContactsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 12,
    },
    editContactsBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    verifiedPillText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    expiredPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.VERIFICATION_EXPIRED_BG,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.VERIFICATION_EXPIRED_BORDER,
    },
    expiredPillText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.VERIFICATION_EXPIRED_TEXT,
    },
    unverifiedPill: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    unverifiedPillText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    linkedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    linkedPillText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
});

export default PersonalInformationSection;
