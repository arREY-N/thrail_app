import { useEffect, useMemo, useState } from 'react';
import { Booking } from '@/src/core/models/Booking/Booking';
import { IEmergencyContact, User, UserRepo } from '@/src/core/models/User/User';
import { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import { calculateVerificationValidity, formatVerificationExpiry } from '@/src/core/flows/PhoneVerificationFlow';

/**
 * Props for configuring the useBookingContactVerification hook.
 */
export interface UseBookingContactVerificationProps {
    /** The booking instance. */
    booking: Booking;
    /** Local state of the user's phone number. */
    localUserPhone: string;
    /** Local state of the user's emergency contact. */
    localEmergencyContact?: IEmergencyContact;
    /** The authenticated user's profile. */
    currentUserProfile?: User | null;
    /** Callback to manually synchronize the backend verification status of the booking. */
    onSyncBookingVerification?: (booking: Booking) => Promise<void>;
}

/**
 * Custom hook to handle contact verification checks for a booking.
 * Determines effective verification timestamps by falling back to the user's global profile
 * and linked user records if the local booking records are missing or unverified.
 *
 * @param {UseBookingContactVerificationProps} props - The dependencies required to compute verification validity.
 * @returns An object containing the computed validity state, timestamp objects, and formatted expiry text.
 */
export function useBookingContactVerification({
    booking,
    localUserPhone,
    localEmergencyContact,
    currentUserProfile,
    onSyncBookingVerification,
}: UseBookingContactVerificationProps) {
    const [linkedEmergencyVerifiedAt, setLinkedEmergencyVerifiedAt] = useState<Date | null>(null);

    // Determine effective user phone verification:
    // If the booking itself has a valid timestamp and phone matches localUserPhone, use it.
    // If missing on booking, fallback to currentUserProfile.phoneVerifiedAt if phone matches.
    const effectiveUserPhoneVerifiedAt = useMemo(() => {
        const bookingClean = cleanPhoneNumber(booking?.user?.phoneNumber || '');
        const currentClean = cleanPhoneNumber(localUserPhone);

        if (booking?.user?.phoneVerifiedAt && bookingClean === currentClean) {
            return booking.user.phoneVerifiedAt;
        }

        if (currentUserProfile?.phoneVerifiedAt && currentUserProfile?.phoneNumber) {
            const profileClean = cleanPhoneNumber(currentUserProfile.phoneNumber);
            if (currentClean && currentClean === profileClean) {
                return currentUserProfile.phoneVerifiedAt;
            }
        }

        return null;
    }, [booking?.user, localUserPhone, currentUserProfile]);

    // Resolve linked emergency contact user profile if linked via userId
    useEffect(() => {
        let isMounted = true;

        const resolveLinkedEmergencyContact = async () => {
            if (localEmergencyContact?.userId && !localEmergencyContact.phoneVerifiedAt) {
                try {
                    const contactUser = await UserRepo.fetchById(localEmergencyContact.userId);
                    if (isMounted && contactUser) {
                        const contactPhoneClean = cleanPhoneNumber(contactUser.phoneNumber || '');
                        const emergencyPhoneClean = cleanPhoneNumber(localEmergencyContact.contactNumber || '');

                        if (contactPhoneClean && contactPhoneClean === emergencyPhoneClean && contactUser.phoneVerifiedAt) {
                            setLinkedEmergencyVerifiedAt(contactUser.phoneVerifiedAt);
                            return;
                        }
                    }
                } catch {
                    // Fail silently, fallback to null
                }
            }
            if (isMounted) {
                setLinkedEmergencyVerifiedAt(null);
            }
        };

        resolveLinkedEmergencyContact();
        return () => {
            isMounted = false;
        };
    }, [localEmergencyContact?.userId, localEmergencyContact?.phoneVerifiedAt, localEmergencyContact?.contactNumber]);

    const effectiveEmergencyPhoneVerifiedAt = useMemo(() => {
        const contactClean = cleanPhoneNumber(localEmergencyContact?.contactNumber || '');

        if (localEmergencyContact?.phoneVerifiedAt) {
            return localEmergencyContact.phoneVerifiedAt;
        }

        if (linkedEmergencyVerifiedAt) {
            return linkedEmergencyVerifiedAt;
        }

        if (currentUserProfile?.emergencyContact?.phoneVerifiedAt && currentUserProfile?.emergencyContact?.contactNumber) {
            const profileContactClean = cleanPhoneNumber(currentUserProfile.emergencyContact.contactNumber);
            if (contactClean && contactClean === profileContactClean) {
                return currentUserProfile.emergencyContact.phoneVerifiedAt;
            }
        }

        return null;
    }, [localEmergencyContact, linkedEmergencyVerifiedAt, currentUserProfile]);

    const userPhoneValidity = calculateVerificationValidity(effectiveUserPhoneVerifiedAt);
    const emergencyPhoneValidity = calculateVerificationValidity(effectiveEmergencyPhoneVerifiedAt);
    const userExpiryText = formatVerificationExpiry(effectiveUserPhoneVerifiedAt);
    const emergencyExpiryText = formatVerificationExpiry(effectiveEmergencyPhoneVerifiedAt);

    // Trigger flow-level verification synchronization if provided
    useEffect(() => {
        if (onSyncBookingVerification && booking) {
            onSyncBookingVerification(booking);
        }
    }, [booking, onSyncBookingVerification]);

    return {
        effectiveUserPhoneVerifiedAt,
        effectiveEmergencyPhoneVerifiedAt,
        userPhoneValidity,
        emergencyPhoneValidity,
        userExpiryText,
        emergencyExpiryText,
    };
}
