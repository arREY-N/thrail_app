import { TEdit } from "@/src/core/interface/domainHookInterface";
import { Booking, BookingLogic, newBooking, Requirements, useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useGroupStore } from "@/src/core/models/Group/Group";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { usePaymentUser } from "@/src/core/models/Payment/Payment";
import { EmergencyContactFlow } from "@/src/core/flows/EmergencyContactFlow";
import { calculateVerificationValidity } from "@/src/core/flows/PhoneVerificationFlow";
import { IEmergencyContact, newUser, useAuthHook, useAuthStore, UserLogic, useUserStore, UserRepo } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { normalizePhoneNumber } from "@/src/core/utility/phone";
import { toDateOrNull } from "@/src/core/utility/date";
import { formatDateToStandard } from "@/src/utils/dateFormatter";
import { produce } from "immer";
import { useState } from "react";

export function CreateBookingFlow() {
    const [booking, setBooking] = useState<Booking>(newBooking());
    const [localError, setLocalError] = useState<string | null>(null);

    const { profile } = useAuthHook();

    const { payBooking } = usePaymentUser();

    const fetchOffer = useOfferStore(s => s.fetchOfferById);
    const checkGroupExists = useGroupStore(s => s.checkGroupExists);
    const createBooking = useBookingsStore(s => s.create);
    const joinGroup = useGroupStore(s => s.joinGroup);
    const error = useBookingsStore(s => s.error);
    const userBookings = useBookingsStore(s => s.userBookings);

    const onUpdatePress = (params: TEdit<Booking>) => {
        const { section, id, value } = params;
        try {
            setBooking(prev =>
                produce(prev, (draft) => {
                    if (!draft) return;

                    if (section === 'root') {
                        (draft as Record<string, unknown>)[id] = value;
                    } else {
                        const nestedSection = section as keyof Booking;
                        if (draft[nestedSection] && typeof draft[nestedSection] === 'object') {
                            (draft[nestedSection] as Record<string, unknown>)[id] = value;
                        }
                    }
                })
            );
        } catch (error) {
            catchError(error as Error, 'error', 'CreateBookingFlow()');
            setLocalError(`Failed updating ${String(section)} : ${id}`);
        }
    };

    const onCompleteBook = async (payload?: {
        hikerDetails?: {
            phone?: string;
            emergencyContact?: IEmergencyContact;
        } | null;
        uploadedDocs?: Record<string, string> | null;
    }): Promise<boolean> => {
        try {
            if (!profile)
                throw new Error('No user found');

            if (!booking)
                throw new Error('No booking found');

            await fetchOffer(booking.offer.id);

            const offers = useOfferStore.getState().data;
            const offer = offers.find(o => o.id === booking.offer.id) || null;

            if (!offer)
                throw new Error('Offer not found for booking');

            const currentPhone = normalizePhoneNumber(profile.phoneNumber || '');
            const currentEmergencyPhone = normalizePhoneNumber(profile.emergencyContact?.contactNumber || '');
            const currentEmergencyName = (profile.emergencyContact?.name || '').trim();

            const editedPhone = normalizePhoneNumber(payload?.hikerDetails?.phone || '');
            const bookingPhone = editedPhone || currentPhone;

            const isPhoneChanged = !!bookingPhone && bookingPhone !== currentPhone;

            // Inheritance for user phone verification:
            // If phone matches profile.phoneNumber, inherit profile.phoneVerifiedAt.
            // If the user changed the phone number, verification resets to null.
            const resolvedUserPhoneVerifiedAt = isPhoneChanged
                ? null
                : (profile.phoneVerifiedAt ?? null);

            const bookingEmergency: IEmergencyContact = {
                name: (payload?.hikerDetails?.emergencyContact?.name || booking.emergencyContact?.name || profile.emergencyContact?.name || '').trim(),
                contactNumber: normalizePhoneNumber(payload?.hikerDetails?.emergencyContact?.contactNumber || booking.emergencyContact?.contactNumber || profile.emergencyContact?.contactNumber || ''),
                email: payload?.hikerDetails?.emergencyContact?.email || booking.emergencyContact?.email || profile.emergencyContact?.email || '',
                userId: payload?.hikerDetails?.emergencyContact?.userId || booking.emergencyContact?.userId || profile.emergencyContact?.userId || '',
                phoneVerifiedAt: toDateOrNull(payload?.hikerDetails?.emergencyContact?.phoneVerifiedAt || booking.emergencyContact?.phoneVerifiedAt || profile.emergencyContact?.phoneVerifiedAt),
            };

            const isEmergencyPhoneChanged = bookingEmergency.contactNumber !== currentEmergencyPhone;
            const isEmergencyChanged = 
                (bookingEmergency.name && bookingEmergency.name !== currentEmergencyName) ||
                (bookingEmergency.contactNumber && isEmergencyPhoneChanged) ||
                (bookingEmergency.userId && bookingEmergency.userId !== (profile.emergencyContact?.userId || '')) ||
                (bookingEmergency.email && bookingEmergency.email !== (profile.emergencyContact?.email || ''));

            // Inheritance for emergency contact phone verification:
            // If explicit verified timestamp came from booking payload (e.g. linked verified account), preserve it.
            // Otherwise, if contactNumber matches profile, inherit profile verification. If changed, reset to null.
            const explicitEmergencyVerifiedAt = toDateOrNull(payload?.hikerDetails?.emergencyContact?.phoneVerifiedAt);
            const resolvedEmergencyPhoneVerifiedAt = explicitEmergencyVerifiedAt || (
                isEmergencyPhoneChanged
                    ? null
                    : (bookingEmergency.phoneVerifiedAt ?? profile.emergencyContact?.phoneVerifiedAt ?? booking.emergencyContact?.phoneVerifiedAt ?? null)
            );

            bookingEmergency.phoneVerifiedAt = resolvedEmergencyPhoneVerifiedAt;
    
            const formattedDocs: Requirements[] = payload?.uploadedDocs && Object.keys(payload.uploadedDocs).length > 0
                ? Object.keys(payload.uploadedDocs).map((name) => ({
                    name,
                    file: payload.uploadedDocs![name],
                    valid: 'pending' as const,
                }))
                : (booking.documents || []);

            const finalBooking = newBooking({
                ...booking,
                trail: offer.trail,
                user: {
                    ...UserLogic.toBookingSummary(profile),
                    phoneNumber: bookingPhone,
                    phoneVerifiedAt: resolvedUserPhoneVerifiedAt,
                },
                emergencyContact: bookingEmergency,
                documents: formattedDocs,
            });
            
            const group = await checkGroupExists(offer.id);

            if (!group)
                throw new Error('Cannot continue with booking as group has not been set yet.');

            const created = await createBooking(finalBooking);

            // Persist updated phone and emergency contact to User Profile in Firestore
            if (isPhoneChanged || isEmergencyChanged) {
                const updatedUser = newUser({
                    ...profile,
                    phoneNumber: bookingPhone || profile.phoneNumber,
                    phoneVerifiedAt: isPhoneChanged ? null : (profile.phoneVerifiedAt ?? null),
                    emergencyContact: {
                        ...profile.emergencyContact,
                        ...bookingEmergency,
                        phoneVerifiedAt: isEmergencyPhoneChanged
                            ? null
                            : (bookingEmergency.phoneVerifiedAt ?? profile.emergencyContact?.phoneVerifiedAt ?? null),
                    },
                });
                try {
                    await useUserStore.getState().create(updatedUser);
                    useAuthStore.setState({ profile: updatedUser });
                } catch (profileErr) {
                    console.warn("Failed syncing user profile updates to Firestore during booking:", profileErr);
                }
            }

            const member = {
                ...UserLogic.toSummary(profile),
                bookingId: created.id,
            };
            
            // TODO MOVE JOIN GROUP LOGIC AFTER BOOKING IS APPROVED

            await joinGroup(group, member);
            setBooking(newBooking());
            setLocalError(null);
            return true;
        } catch (error) {
            catchError(error as Error, 'error', 'CreateBookingFlow()');
            setLocalError((error as Error).message || 'Failed completing booking');
            return false;
        }
    };

    const onSetOffer = (offer: Offer) => {
        try {
            const offerDateStr = formatDateToStandard(offer.date);
            const existingBooking = userBookings.find(b => 
                !BookingLogic.isInactiveStatus(b.status) && 
                (b.offer?.id === offer.id || 
                (offerDateStr && formatDateToStandard(b.offer?.date) === offerDateStr))
            );

            if (existingBooking) {
                throw new Error("You already have an active booking on this date.");
            }

            setBooking(prev =>
                produce(prev, (draft) => {
                    if (!draft) return;
                    BookingLogic.setOffer(draft, offer);
                })
            );
            setLocalError(null);
        } catch (error) {
            catchError(error as Error, 'error', 'CreateBookingFlow()');
            setLocalError((error as Error).message || 'Failed setting offer');
        }
    };

    const onPayOffer = async (amount: number, bookingId?: string, type = 'payment', returnUrl = '') => {
        try {
            if (!profile)
                throw new Error('No user found');
            if (!bookingId)
                throw new Error('No booking ID provided');

            const response = await payBooking({
                amount,
                bookingId,
                userId: profile.id,
                type,
                returnUrl,
            });

            return response as { checkout_url: string };
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting payment');
            throw error;
        }
    };

    const onResubmitDocuments = async (
        booking: Booking,
        updatedDocs: Requirements[],
        updatedPhone?: string,
        updatedEmergency?: IEmergencyContact
    ): Promise<boolean> => {
        try {
            const updatedBooking = produce(booking, (draft) => {
                if (updatedDocs && updatedDocs.length > 0) {
                    draft.documents = updatedDocs;
                }
                if (updatedPhone !== undefined && draft.user) {
                    const cleaned = normalizePhoneNumber(updatedPhone);
                    const isPhoneChanged = normalizePhoneNumber(draft.user.phoneNumber) !== cleaned;
                    draft.user.phoneNumber = cleaned;
                    if (isPhoneChanged) {
                        draft.user.phoneVerifiedAt = null;
                    }
                }
                if (updatedEmergency !== undefined) {
                    const isEmergencyPhoneChanged =
                        normalizePhoneNumber(draft.emergencyContact?.contactNumber || '') !==
                        normalizePhoneNumber(updatedEmergency.contactNumber || '');
                    draft.emergencyContact = {
                        ...draft.emergencyContact,
                        ...updatedEmergency,
                        contactNumber: normalizePhoneNumber(updatedEmergency.contactNumber || ''),
                        phoneVerifiedAt: isEmergencyPhoneChanged
                            ? null
                            : (updatedEmergency.phoneVerifiedAt ?? draft.emergencyContact?.phoneVerifiedAt ?? null),
                    };
                }
                draft.status = 'pending-docs';
                delete draft.cancellationReason;
                delete draft.cancelledBy;
            });

            await createBooking(updatedBooking, false, true);

            // Persist updated phone and emergency contact to User Profile in Firestore and AuthStore
            if (profile && (updatedPhone !== undefined || updatedEmergency !== undefined)) {
                const cleanedPhone = updatedPhone !== undefined ? normalizePhoneNumber(updatedPhone) : profile.phoneNumber;
                const isPhoneChanged = updatedPhone !== undefined && normalizePhoneNumber(profile.phoneNumber) !== cleanedPhone;
                
                const isEmergencyPhoneChanged = updatedEmergency !== undefined &&
                    normalizePhoneNumber(profile.emergencyContact?.contactNumber || '') !== normalizePhoneNumber(updatedEmergency.contactNumber || '');

                const updatedUser = newUser({
                    ...profile,
                    phoneNumber: cleanedPhone || profile.phoneNumber,
                    phoneVerifiedAt: isPhoneChanged ? null : (profile.phoneVerifiedAt ?? null),
                    emergencyContact: updatedEmergency ? {
                        ...profile.emergencyContact,
                        ...updatedEmergency,
                        contactNumber: normalizePhoneNumber(updatedEmergency.contactNumber || ''),
                        phoneVerifiedAt: isEmergencyPhoneChanged
                            ? null
                            : (updatedEmergency.phoneVerifiedAt ?? profile.emergencyContact?.phoneVerifiedAt ?? null),
                    } : profile.emergencyContact,
                });

                try {
                    await useUserStore.getState().create(updatedUser);
                    useAuthStore.setState({ profile: updatedUser });
                } catch (profileErr) {
                    console.warn("[CreateBookingFlow] Failed syncing user profile updates during resubmit:", profileErr);
                }
            }

            setLocalError(null);
            return true;
        } catch (error) {
            catchError(error as Error, 'error', 'CreateBookingFlow.onResubmitDocuments()');
            setLocalError((error as Error).message || 'Failed to resubmit booking');
            return false;
        }
    };

    const onUpdateBookingContacts = async (
        bookingToUpdate: Booking,
        phone: string,
        emergencyContact: IEmergencyContact
    ): Promise<boolean> => {
        try {
            const cleanedPhone = normalizePhoneNumber(phone);
            const isPhoneChanged = normalizePhoneNumber(bookingToUpdate.user?.phoneNumber) !== cleanedPhone;
            const isEmergencyPhoneChanged = normalizePhoneNumber(bookingToUpdate.emergencyContact?.contactNumber) !== normalizePhoneNumber(emergencyContact.contactNumber);

            const updatedBooking = produce(bookingToUpdate, (draft) => {
                if (draft.user) {
                    draft.user.phoneNumber = cleanedPhone;
                    if (isPhoneChanged) {
                        draft.user.phoneVerifiedAt = null;
                    } else if (!draft.user.phoneVerifiedAt && profile?.phoneVerifiedAt) {
                        draft.user.phoneVerifiedAt = profile.phoneVerifiedAt;
                    }
                }
                const profileEmergencyVerifiedAt = (!isEmergencyPhoneChanged && !emergencyContact.phoneVerifiedAt && profile?.emergencyContact?.phoneVerifiedAt)
                    ? profile.emergencyContact.phoneVerifiedAt
                    : null;
                draft.emergencyContact = {
                    ...emergencyContact,
                    phoneVerifiedAt: isEmergencyPhoneChanged 
                        ? (emergencyContact.phoneVerifiedAt || null) 
                        : (draft.emergencyContact?.phoneVerifiedAt ?? emergencyContact.phoneVerifiedAt ?? profileEmergencyVerifiedAt ?? null),
                };
            });

            await createBooking(updatedBooking, false, true);

            // Persist updated phone and emergency contact to User Profile in Firestore and AuthStore
            if (profile && (isPhoneChanged || isEmergencyPhoneChanged)) {
                const updatedUser = newUser({
                    ...profile,
                    phoneNumber: cleanedPhone,
                    phoneVerifiedAt: isPhoneChanged ? null : (profile.phoneVerifiedAt ?? null),
                    emergencyContact: {
                        ...profile.emergencyContact,
                        ...emergencyContact,
                        contactNumber: normalizePhoneNumber(emergencyContact.contactNumber || ''),
                        phoneVerifiedAt: isEmergencyPhoneChanged
                            ? null
                            : (emergencyContact.phoneVerifiedAt ?? profile.emergencyContact?.phoneVerifiedAt ?? null),
                    },
                });
                try {
                    await useUserStore.getState().create(updatedUser);
                    useAuthStore.setState({ profile: updatedUser });
                } catch (profileErr) {
                    console.warn("[CreateBookingFlow] Failed syncing user profile updates in onUpdateBookingContacts:", profileErr);
                }
            }

            setLocalError(null);
            return true;
        } catch (updateError) {
            catchError(updateError as Error, 'error', 'CreateBookingFlow.onUpdateBookingContacts()');
            setLocalError((updateError as Error).message || 'Failed to update contact details');
            return false;
        }
    };

    const { findUser } = EmergencyContactFlow();

    const onSyncBookingVerification = async (bookingToCheck: Booking): Promise<void> => {
        try {
            if (!profile?.id || !bookingToCheck?.user?.id) return;
            if (profile.id !== bookingToCheck.user.id) return;

            const bookingPhoneClean = normalizePhoneNumber(bookingToCheck.user.phoneNumber);
            const profilePhoneClean = normalizePhoneNumber(profile.phoneNumber);
            if (!bookingPhoneClean || bookingPhoneClean !== profilePhoneClean) return;

            const bookingVerifiedAt = toDateOrNull(bookingToCheck.user.phoneVerifiedAt);
            const profileVerifiedAt = toDateOrNull(profile.phoneVerifiedAt);

            if (bookingVerifiedAt && !isNaN(bookingVerifiedAt.getTime())) {
                const bookingValidity = calculateVerificationValidity(bookingVerifiedAt);

                const shouldSyncPersonal = bookingValidity.status === 'verified' && (
                    !profileVerifiedAt || bookingVerifiedAt.getTime() > profileVerifiedAt.getTime()
                );

                if (shouldSyncPersonal) {
                    await UserRepo.updateVerification(profile.id, 'personal', bookingVerifiedAt);
                    useAuthStore.setState({
                        profile: {
                            ...profile,
                            phoneVerifiedAt: bookingVerifiedAt,
                        },
                    });
                }
            }

            const bookingEmergencyClean = normalizePhoneNumber(bookingToCheck.emergencyContact?.contactNumber);
            const profileEmergencyClean = normalizePhoneNumber(profile.emergencyContact?.contactNumber);
            if (bookingEmergencyClean && profileEmergencyClean && bookingEmergencyClean === profileEmergencyClean) {
                const bookingEmergVerifiedAt = toDateOrNull(bookingToCheck.emergencyContact?.phoneVerifiedAt);
                const profileEmergVerifiedAt = toDateOrNull(profile.emergencyContact?.phoneVerifiedAt);

                if (bookingEmergVerifiedAt && !isNaN(bookingEmergVerifiedAt.getTime())) {
                    const emergValidity = calculateVerificationValidity(bookingEmergVerifiedAt);
                    const shouldSyncEmergency = emergValidity.status === 'verified' && (
                        !profileEmergVerifiedAt || bookingEmergVerifiedAt.getTime() > profileEmergVerifiedAt.getTime()
                    );
                    if (shouldSyncEmergency) {
                        await UserRepo.updateVerification(profile.id, 'emergency', bookingEmergVerifiedAt);
                        useAuthStore.setState(state => {
                            if (state.profile?.emergencyContact) {
                                state.profile.emergencyContact.phoneVerifiedAt = bookingEmergVerifiedAt;
                            }
                        });
                    }
                }
            }
        } catch (err: unknown) {
            console.warn('[CreateBookingFlow] onSyncBookingVerification failed:', err);
        }
    };

    return {
        error: localError || error,
        userBookings,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
        onPayOffer,
        onResubmitDocuments,
        onUpdateBookingContacts,
        onSyncBookingVerification,
        findUser,
    };
}