import useApproveBooking from "@/src/core/hook/admin/useApproveBooking";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import BookingReviewScreen from "@/src/features/Admin/screens/Booking/BookingReviewScreen";

export default function adminViewBooking() {
    const { bookingId: rawId, offerId: rawOfferId } = useLocalSearchParams();

    const bookingId = getSearchParam(rawId);
    const offerId = getSearchParam(rawOfferId);

    const { onBackPress } = useAppNavigation();

    const { 
        offer,
        offers,
        booking,
        error,
        isLoading,
        onApproveBooking,
        onRejectBooking, 
        onRescheduleBooking,
        // onValidateDocument,
        onRefund,
    } = useApproveBooking({ bookingId, offerId });

    if(!booking) return <Text>Booking not found</Text>;
    if(!offer) return <Text>Offer not found</Text>;
    
    console.log('Loaded booking: ', booking);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            
            <BookingReviewScreen
                booking={booking}
                offers={offers}
                onBackPress={onBackPress}
                onApprove={onApproveBooking}
                onReject={onRejectBooking}
                onReschedule={onRescheduleBooking}
                onRefund={onRefund}
                isLoading={isLoading}
                error={error}            
            />
        </>
    )
}

// export type TestAdminOfferView = {
//     offer: Offer | null;
//     offers: Offer[];
//     booking: Booking | null;
//     error: string | null;
//     onApproveBooking: (force?: boolean) => void;
//     onRejectBooking: (reason: string, force?: boolean) => void;
//     onRescheduleBooking: (offer: Offer) => void;
//     onRefund: () => void;
// }

// export const TestOfferView = (params: TestAdminOfferView) => {
//     const { error, offer, booking, onApproveBooking, onRejectBooking, onRefund } = params;

//     const [rejectionReason, setRejectionReason] = useState('');
//     if(!offer) return <Text>Offer not found</Text>;
//     if(!booking) return <Text>Booking not found</Text>;
    
//     return(
//         <ScrollView>
//             { error && <Text>{error}</Text>}
//             <Text>Reservation by: {booking.user.firstname} {booking.user.lastname}</Text>
//             <Text>Description: {offer.description}</Text>
//             <Text>Price: {offer.price}</Text>
//             <Text>Status: {booking.status}</Text>
//             { booking.status === 'reservation-rejected' && (
//                 <>
//                     <Text>Cancelled by: {booking.cancelledBy} </Text>
//                     <Text>Reason: {booking.cancellationReason} </Text>
//                 </>
//             )}
//             <CustomTextInput 
//                 label={'Rejection Reason'}
//                 placeholder={undefined}
//                 value={rejectionReason}
//                 onChangeText={setRejectionReason}
//                 secureTextEntry={undefined}
//                 keyboardType={undefined}
//                 isPasswordVisible={undefined}
//                 onTogglePassword={undefined}
//                 style={undefined}
//                 inputStyle={undefined}
//                 icon={undefined}
//                 prefix={undefined}
//                 children={undefined}
//                 showTodayButton={undefined}
//                 allowFutureDates={undefined}
//                 multiline={undefined} 
//                 defaultMode={undefined}
//                 />

//             <Pressable onPress={() => onApproveBooking()}>
//                 <Text>Approve</Text>
//             </Pressable>
//             <Pressable onPress={() => onApproveBooking(true)}>
//                 <Text>Force Approve</Text>
//             </Pressable>

//             <Pressable onPress={() => onRejectBooking(rejectionReason)}>
//                 <Text>Reject</Text>
//             </Pressable>


//             <Pressable onPress={() => onRejectBooking(rejectionReason, true)}>
//                 <Text>Force Reject</Text>
//             </Pressable>

//             <Pressable onPress={() => onRefund()}>
//                 <Text>Refund</Text>
//             </Pressable>

//             <Text>RESCHEDULE TO DIFFERENT OFFER</Text>
//             { 
//                 params.offers.map(o => o.id !== params.booking?.offer.id && (
//                     <Pressable key={o.id} onPress={() => params.onRescheduleBooking(o)}>
//                         <Text>Offer ID: {o.id}</Text>
//                         <Text>Price: {o.price}</Text>
//                         <Text>Date: {formatDate(o.date)}</Text>
//                     </Pressable>
//                 ))
//             }
//         </ScrollView>
//     )
// }