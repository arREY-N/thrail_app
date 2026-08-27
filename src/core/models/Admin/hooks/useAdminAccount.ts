// import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
// import { useBookingAdminList } from "@/src/core/models/Booking/Booking";
// import { useBusinessAdminItem } from "@/src/core/models/Business/Business";
// import { useOfferAdminList } from "@/src/core/models/Offer/Offer";
// import { useCallback, useMemo } from "react";

// export function useAdminAccount() {
//     const { profile, businessId, role } = useAuthHook();
//     const {
//         businessAccount,
//         businessAdmins,
//         isLoading: businessIsLoading,
//         onRefresh: businessRefresh,
//         error: businessError
//     } = useBusinessAdminItem();

//     const {
//         businessOffers,
//         onRefresh: offerRefresh,
//         isLoading: offerIsLoading,
//         error: offerError
//     } = useOfferAdminList();

//     const {
//         businessBookings,
//         isFetching: bookingsIsLoading,
//         error: bookingsError,
//         onRefresh: bookingRefresh
//     } = useBookingAdminList()

//     const onRefreshAdminAccount = useCallback(async () => {
//         if (!profile?.id || !businessId) return;

//         await Promise.all([
//             businessRefresh(),
//             offerRefresh(),
//             bookingRefresh()
//         ])
//     }, [profile?.id, businessId, businessRefresh, offerRefresh, bookingRefresh])

//     return useMemo(() => ({
//         onRefreshAdminAccount,
//         businessRefresh,
//         offerRefresh,
//         bookingRefresh,
//         businessOffers,
//         businessAccount,
//         businessBookings,
//         businessAdmins,
//         isLoading: businessIsLoading || offerIsLoading || bookingsIsLoading,
//         error: businessError || offerError || bookingsError,
//         profile,
//         role,
//         businessId
//     }), [onRefreshAdminAccount, businessRefresh, offerRefresh, bookingRefresh, businessOffers, businessAccount, businessBookings, businessAdmins, businessIsLoading, offerIsLoading, bookingsIsLoading, businessError, offerError, bookingsError, profile, role, businessId])
// }