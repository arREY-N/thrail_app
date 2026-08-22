import { TEdit } from "@/src/core/interface/domainHookInterface";
import { Booking } from "@/src/core/models/Booking/interfaces/Booking.types";
import { newBooking } from "@/src/core/models/Booking/utils/BookingFactory";
import { useState } from "react";

import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { BookingLogic } from "@/src/core/models/Booking/utils/Booking.logic";
import { useGroupStore } from "@/src/core/models/Group/Group";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { usePaymentUser } from "@/src/core/models/Payment/Payment";
import { UserLogic } from "@/src/core/models/User/User";
import { catchError } from "@/src/core/utility/errorFormatter";
import { produce } from "immer";

export function useBookingUser() {
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
                        (draft as Record<string, any>)[id] = value;
                    } else {
                        const nestedSection = section as keyof Booking;
                        if (draft[nestedSection] && typeof draft[nestedSection] === 'object') {
                            (draft[nestedSection] as Record<string, any>)[id] = value;
                        }
                    }
                })
            )
        } catch (error) {
            catchError(error as Error, 'error', 'useBookingUser()');
            setLocalError(`Failed updating ${String(section)} : ${id}`)
        }
    }

    const onCompleteBook = async (payload?: { hikerDetails?: { phone?: string } | null }): Promise<boolean> => {
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

            const editedPhone = payload?.hikerDetails?.phone;
            const bookingPhone = editedPhone || profile.phoneNumber;

            const finalBooking = newBooking({
                ...booking,
                trail: offer.trail,
                user: {
                    ...UserLogic.toBookingSummary(profile),
                    phoneNumber: bookingPhone,
                },
            })

            const group = await checkGroupExists(offer.id);

            if (!group)
                throw new Error('Cannot continue with booking as group has not been set yet.');

            const created = await createBooking(finalBooking)

            const member = {
                ...UserLogic.toSummary(profile),
                bookingId: created.id,
            }

            // TODO MOVE JOIN GROUP LOGIC AFTER BOOKING IS APPROVED

            await joinGroup(group, member);
            setBooking(newBooking());
            setLocalError(null);
            return true;
        } catch (error) {
            catchError(error as Error, 'error', 'useBookingUser()');
            setLocalError((error as Error).message || 'Failed completing booking')
            return false;
        }
    }

    const onSetOffer = (offer: Offer) => {
        try {

            const existingBooking = userBookings.find(b => b.offer.id === offer.id);

            if (existingBooking && existingBooking.status !== 'reservation-rejected') {
                throw new Error("You have already booked this offer and is currently in progress.");
            }

            setBooking(prev =>
                produce(prev, (draft) => {
                    if (!draft) return;
                    BookingLogic.setOffer(draft, offer);
                })
            );
        } catch (error) {
            catchError(error as Error, 'error', 'useBookingUser()');
            setLocalError((error as Error).message || 'Failed setting offer')
        }
    }

    const onPayOffer = async (amount: number, bookingId: string, type: string, returnUrl: string) => {
        try {
            if (!profile)
                throw new Error('No user found');

            const response = await payBooking({
                amount,
                bookingId,
                userId: profile.id,
                type,
                returnUrl,
            });

            return response;
        } catch (error) {
            setLocalError((error as Error).message || 'Failed setting payment');
            throw error;
        }
    }

    return {
        error: localError || error,
        onUpdatePress,
        onCompleteBook,
        onSetOffer,
        onPayOffer,
    }
}