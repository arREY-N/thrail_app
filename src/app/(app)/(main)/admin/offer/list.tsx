import { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/src/core/config/Firebase";
import { Stack } from "expo-router";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";

import { useAdminNavigation } from "@/src/core/models/Admin/Admin";
import { useBookingListenerAdminList, useBookingsStore } from "@/src/core/models/Booking/Booking";
import { cancellationConverter, useCancellationAdminList, useCancellationStore } from "@/src/core/models/Cancellation/Cancellation";
import { useOfferAdminList } from "@/src/core/models/Offer/Offer";
import { useAuthHook } from "@/src/core/models/User/User";
import OfferListScreen from "@/src/features/Admin/screens/Offer/OfferListScreen";

export default function AdminOfferList() {
    const { onBackPress } = useAppNavigation();

    const { onWriteOffer } = useAdminNavigation();

    const { businessId, profile } = useAuthHook();
    useBookingListenerAdminList();
    useCancellationAdminList();

    const businessCancellations = useCancellationStore(s => s.businessCancellations);

    // TODO: [Backend Handover / Issue #95]: Temporary controller-level onSnapshot listener for business cancellations because CancellationRepository lacks real-time listeners. Backend can remove or migrate to CancellationRepository/cancellationStore.
    useEffect(() => {
        if (!businessId || !profile || profile.role !== 'admin') return;

        const colRef = collection(db, 'businesses', businessId, 'cancellations').withConverter(cancellationConverter);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const list = snapshot.docs.map(d => d.data());
            useCancellationStore.setState({ businessCancellations: list });
        }, (err) => {
            console.error('Real-time admin cancellations subscription error in offer list:', err);
        });

        return () => unsubscribe();
    }, [businessId, profile]);

    const {
        isLoading,
        error,
        businessOffers,
        onViewOfferBookings
    } = useOfferAdminList();

    const bookingByOffer = useBookingsStore(s => s.bookingByOffer);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferListScreen
                offers={businessOffers}
                bookingByOffer={bookingByOffer}
                cancellations={businessCancellations}
                isLoading={isLoading}
                onAddOffer={onWriteOffer}
                onEditOffer={onWriteOffer}
                onViewOfferBookings={onViewOfferBookings}
                onBackPress={onBackPress}
                error={error}
            />
        </>
    );
}