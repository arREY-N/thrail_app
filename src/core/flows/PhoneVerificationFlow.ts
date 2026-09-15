/**
 * @file PhoneVerificationFlow.ts
 * @description Core domain flow orchestrator for User Phone and Emergency Contact verification.
 * Handles 6-month validity countdown calculations, approval guard evaluation,
 * and Option A global synchronization to Firestore user profiles and booking documents.
 */

import { db } from '@/src/core/config/Firebase';
import { useAuthStore, UserRepo } from '@/src/core/models/User/User';
import { toDateOrNull } from '@/src/core/utility/date';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { useState } from 'react';

/**
 * Three-state lifecycle for phone verification.
 */
export type VerificationStatus = 'verified' | 'expired' | 'unverified';

/**
 * Detailed validity and remaining duration result.
 */
export interface VerificationValidityInfo {
    status: VerificationStatus;
    remainingMonths: number;
    remainingDays: number;
    remainingWeeks: number;
    isExpired: boolean;
    isValid: boolean;
    countdownText: string | null;
    expiryText: string | null;
}

/**
 * Result of evaluating approval safety guard for booking reviews.
 */
export interface PhoneVerificationGuardResult {
    canApprove: boolean;
    requiresOverride: boolean;
    unverifiedKeys: ('personal' | 'emergency')[];
    expiredKeys: ('personal' | 'emergency')[];
}

/**
 * Calculates the number of whole calendar months elapsed between two dates.
 *
 * @param newerDate - The later date (typically current date).
 * @param olderDate - The earlier date (verification date).
 * @returns Non-negative integer representing elapsed months.
 */
export const getDifferenceInMonths = (newerDate: Date, olderDate: Date): number => {
    let months = (newerDate.getFullYear() - olderDate.getFullYear()) * 12;
    months += newerDate.getMonth() - olderDate.getMonth();
    if (newerDate.getDate() < olderDate.getDate()) {
        months--;
    }
    return Math.max(0, months);
};

/**
 * Computes the 6-month verification validity, remaining duration, and multi-tier granular countdown.
 * Supports breakdown into months, weeks, and days for nearing-expiry warnings.
 *
 * @param dateInput - Raw date or Firestore timestamp.
 * @param now - Optional reference date for testing (defaults to current date).
 * @returns VerificationValidityInfo containing status, remainingMonths, remainingDays, remainingWeeks, isExpired, isValid, countdownText, and expiryText.
 */
export const calculateVerificationValidity = (
    dateInput: unknown,
    now: Date = new Date()
): VerificationValidityInfo => {
    const date = toDateOrNull(dateInput);
    if (!date) {
        return {
            status: 'unverified',
            remainingMonths: 0,
            remainingDays: 0,
            remainingWeeks: 0,
            isExpired: false,
            isValid: false,
            countdownText: null,
            expiryText: null,
        };
    }

    const expiryDate = new Date(date.getTime());
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    const diffMs = expiryDate.getTime() - now.getTime();
    if (diffMs <= 0) {
        return {
            status: 'expired',
            remainingMonths: 0,
            remainingDays: 0,
            remainingWeeks: 0,
            isExpired: true,
            isValid: false,
            countdownText: 'Expired',
            expiryText: 'Expired (> 6 mos)',
        };
    }

    const elapsedMonths = getDifferenceInMonths(now, date);
    if (elapsedMonths >= 6) {
        return {
            status: 'expired',
            remainingMonths: 0,
            remainingDays: 0,
            remainingWeeks: 0,
            isExpired: true,
            isValid: false,
            countdownText: 'Expired',
            expiryText: 'Expired (> 6 mos)',
        };
    }

    const remainingMonths = Math.max(1, 6 - elapsedMonths);
    const totalDaysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const remainingWeeks = Math.max(1, Math.floor(totalDaysRemaining / 7));

    let countdownText = '';
    if (totalDaysRemaining >= 60) {
        countdownText = `Valid for ${remainingMonths} mos`;
    } else if (totalDaysRemaining >= 30) {
        countdownText = `Valid for 1 mo`;
    } else if (totalDaysRemaining >= 14) {
        countdownText = `Expires in ${remainingWeeks} weeks`;
    } else if (totalDaysRemaining >= 7) {
        countdownText = `Expires in 1 week`;
    } else if (totalDaysRemaining > 1) {
        countdownText = `Expires in ${totalDaysRemaining} days`;
    } else if (totalDaysRemaining === 1) {
        countdownText = `Expires tomorrow`;
    } else {
        countdownText = `Expires today`;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[expiryDate.getMonth()];
    const year = expiryDate.getFullYear();

    let expiryText = '';
    if (totalDaysRemaining >= 30) {
        expiryText = `Valid until ${month} ${year}`;
    } else {
        expiryText = countdownText;
    }

    return {
        status: 'verified',
        remainingMonths,
        remainingDays: totalDaysRemaining,
        remainingWeeks,
        isExpired: false,
        isValid: true,
        countdownText,
        expiryText,
    };
};

/**
 * Checks whether a verification timestamp is currently active and valid (< 6 months).
 *
 * @param dateInput - Raw date or Firestore timestamp.
 * @param now - Optional reference date for testing.
 * @returns Boolean indicating if the contact is verified and unexpired.
 */
export const isPhoneVerificationValid = (
    dateInput: unknown,
    now: Date = new Date()
): boolean => {
    return calculateVerificationValidity(dateInput, now).isValid;
};

/**
 * Formats a verified timestamp into a human-friendly expiration date with granular nearing-expiry countdown.
 *
 * @param verifiedAtInput - Raw date, Firestore timestamp, or string.
 * @param now - Optional reference date for testing.
 * @returns Human-friendly string (e.g. "Valid until Mar 2027", "Expires in 3 weeks", "Expires in 4 days"), or null if not verified.
 */
export const formatVerificationExpiry = (
    verifiedAtInput: unknown,
    now: Date = new Date()
): string | null => {
    const validity = calculateVerificationValidity(verifiedAtInput, now);
    if (!validity.isValid) return null;
    return validity.expiryText;
};

/**
 * Evaluates whether a booking can be approved instantly or requires a safety override.
 *
 * @param personalStatus - Status of the hiker's personal phone number.
 * @param emergencyStatus - Status of the emergency contact's phone number.
 * @returns Guard evaluation indicating approval clearance and unverified/expired keys.
 */
export const evaluateApprovalGuard = (
    personalStatus: VerificationStatus,
    emergencyStatus: VerificationStatus
): PhoneVerificationGuardResult => {
    const unverifiedKeys: ('personal' | 'emergency')[] = [];
    const expiredKeys: ('personal' | 'emergency')[] = [];

    if (personalStatus === 'unverified') unverifiedKeys.push('personal');
    if (emergencyStatus === 'unverified') unverifiedKeys.push('emergency');

    if (personalStatus === 'expired') expiredKeys.push('personal');
    if (emergencyStatus === 'expired') expiredKeys.push('emergency');

    const requiresOverride = unverifiedKeys.length > 0 || expiredKeys.length > 0;

    return {
        canApprove: !requiresOverride,
        requiresOverride,
        unverifiedKeys,
        expiredKeys,
    };
};

/**
 * Hook providing asynchronous verification synchronization actions across Firestore.
 */
export function PhoneVerificationFlow() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Synchronizes a verification timestamp globally to users/{userId}.
     * Option A: Direct field-path update.
     */
    const syncGlobalVerification = async (
        userId: string,
        contactType: 'personal' | 'emergency',
        verifiedAt: Date | null
    ): Promise<boolean> => {
        if (!userId) {
            setError('User ID is required to sync verification globally.');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            await UserRepo.updateVerification(userId, contactType, verifiedAt);

            const currentProfile = useAuthStore.getState().profile;
            if (currentProfile && currentProfile.id === userId) {
                if (contactType === 'personal') {
                    useAuthStore.setState({
                        profile: {
                            ...currentProfile,
                            phoneVerifiedAt: verifiedAt,
                        },
                    });
                } else {
                    useAuthStore.setState({
                        profile: {
                            ...currentProfile,
                            emergencyContact: currentProfile.emergencyContact ? {
                                ...currentProfile.emergencyContact,
                                phoneVerifiedAt: verifiedAt,
                            } : currentProfile.emergencyContact,
                        },
                    });
                }
            }

            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sync global verification';
            console.warn('[PhoneVerificationFlow] syncGlobalVerification note:', message);
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Synchronizes a verification timestamp to a specific booking document: users/{userId}/bookings/{bookingId}.
     */
    const syncBookingVerification = async (
        userId: string,
        bookingId: string,
        contactType: 'personal' | 'emergency',
        verifiedAt: Date | null
    ): Promise<boolean> => {
        if (!userId || !bookingId) {
            setError('Both User ID and Booking ID are required to sync booking verification.');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
            const tsValue = verifiedAt instanceof Date && !isNaN(verifiedAt.getTime())
                ? Timestamp.fromDate(verifiedAt)
                : null;

            if (contactType === 'personal') {
                await updateDoc(bookingRef, {
                    'user.phoneVerifiedAt': tsValue,
                });
            } else {
                await updateDoc(bookingRef, {
                    'emergencyContact.phoneVerifiedAt': tsValue,
                });
            }

            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to sync booking verification';
            console.warn('[PhoneVerificationFlow] syncBookingVerification note:', message);
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Verifies a contact number, updating both the booking and the global user profile simultaneously.
     * If linkedUserId is provided (for emergency contacts linked to a registered hiker), syncs to that user doc as well.
     */
    const verifyContact = async (
        userId: string,
        bookingId: string,
        contactType: 'personal' | 'emergency',
        verifiedAt: Date = new Date(),
        linkedUserId?: string
    ): Promise<boolean> => {
        const bookingSuccess = await syncBookingVerification(userId, bookingId, contactType, verifiedAt);
        const globalSuccess = await syncGlobalVerification(userId, contactType, verifiedAt);
        let linkedSuccess = true;
        if (contactType === 'emergency' && linkedUserId) {
            linkedSuccess = await syncGlobalVerification(linkedUserId, 'personal', verifiedAt);
        }
        return bookingSuccess && globalSuccess && linkedSuccess;
    };

    /**
     * Marks a contact number as unverified on both the booking and the global user profile.
     * If linkedUserId is provided, un-verifies the linked user's personal verification as well.
     */
    const unverifyContact = async (
        userId: string,
        bookingId: string,
        contactType: 'personal' | 'emergency',
        linkedUserId?: string
    ): Promise<boolean> => {
        const bookingSuccess = await syncBookingVerification(userId, bookingId, contactType, null);
        const globalSuccess = await syncGlobalVerification(userId, contactType, null);
        let linkedSuccess = true;
        if (contactType === 'emergency' && linkedUserId) {
            linkedSuccess = await syncGlobalVerification(linkedUserId, 'personal', null);
        }
        return bookingSuccess && globalSuccess && linkedSuccess;
    };

    /**
     * Resets verification on the global user profile when a phone number is edited by the hiker.
     */
    const invalidateGlobalVerification = async (
        userId: string,
        contactType: 'personal' | 'emergency'
    ): Promise<boolean> => {
        return syncGlobalVerification(userId, contactType, null);
    };

    return {
        calculateVerificationValidity,
        isPhoneVerificationValid,
        evaluateApprovalGuard,
        syncGlobalVerification,
        syncBookingVerification,
        verifyContact,
        unverifyContact,
        invalidateGlobalVerification,
        isLoading,
        error,
    };
}
