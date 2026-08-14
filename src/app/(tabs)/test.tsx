import CustomLoading from "@/src/components/CustomLoading";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingAdminList } from "@/src/core/models/Booking/hooks/useBookingAdminList";
import { useBookingUserList } from "@/src/core/models/Booking/hooks/useBookingUserList";
import {
    useCancellationAdmin,
    useCancellationAdminList,
    useCancellationUser,
    useCancellationUserList
} from "@/src/core/models/Cancellation/Cancellation";
import { useOfferSimilarList } from "@/src/core/models/Offer/hooks/useOfferSimilarList";
import { Offer } from "@/src/core/models/Offer/Offer";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function test() {
    const { role } = useAuthHook();

    const isAdmin = role === 'admin';
    const isSuperAdmin = role === 'superadmin';

    return (
        <ScrollView>
            <Text>Test Screen</Text>
            <Text>Feature: Cancellation</Text>

            { isSuperAdmin 
                ? <View>
                    <AdminCancellation />
                    <UserCancellation />
                </View>
                : isAdmin
                    ? <AdminCancellation />
                    : <UserCancellation />
            }
        </ScrollView>
    )
}

const AdminCancellation = () => {
    const [reason, setReason] = useState<string>("");

    const {
        isFetching: isCancellationFetching,
        businessCancellations,
        refreshAdminCancellations,
    } = useCancellationAdminList();
    
    const {
        isWriting,
        storeError,
        writingError,
        processCancellationRequest,
        cancelUserBooking,
        revertCancellationRequest,
        proceedToRefund
    } = useCancellationAdmin();

    const {
        businessBookings,
        isFetching: isBookingFetching,
        error: subscriptionError
    } = useBookingAdminList();
    
    if(isBookingFetching) {
        return <CustomLoading message="Fetching bookings..." />
    }

    if(isCancellationFetching) {
        return <CustomLoading message="Fetching cancellations..." />
    }

    if(isWriting) {
        return <CustomLoading message="Processing cancellation request..." />
    }

    return (
        <View>
            <Text>Admin Cancellation</Text>
            
            <View style={styles.box}>
                <Text>View Cancellations</Text>
                <Pressable onPress={refreshAdminCancellations} style={{ backgroundColor: 'blue', padding: 10, marginTop: 10 }}>
                    <Text>Refresh Cancellations</Text>
                </Pressable>
                { writingError && <Text style={{ color: 'red' }}>{writingError}</Text> }
                <TextInput
                    placeholder="Enter admin note for approval/rejection"
                    value={reason}
                    onChangeText={setReason}
                    style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginBottom: 10 }}
                />
                
                <Text>Cancellations by Admin</Text>
                { businessCancellations.length > 0 && businessCancellations.filter(c => c.cancelledBy === 'admin').map(c => (
                    <View key={c.id} style={styles.box}>
                        <Text>Cancellation ID: {c.id}</Text>    
                        <Text>Booking ID: {c.bookingId}</Text>
                        <Text>Offer ID: {c.offerId}</Text>
                        <Text>Reason: {c.reason}</Text>
                        <Text>Status: {c.status}</Text>
                        { c.status === 'pending' && (
                            <View>
                                <Pressable 
                                    onPress={() => {}} 
                                    style={{ backgroundColor: 'green', padding: 10, marginTop: 10 }}
                                >
                                    <Text>Update</Text>
                                </Pressable>
                                <Pressable 
                                    onPress={() => revertCancellationRequest(c)} 
                                    style={{ backgroundColor: 'red', padding: 10, marginTop: 10 }}
                                >
                                    <Text>Cancel</Text>
                                </Pressable>
                            </View>
                        )}
                        { c.status === 'approved' && (
                            <Pressable 
                                onPress={() => proceedToRefund(c)}
                                style={{ backgroundColor: 'green', padding: 10, marginTop: 10 }}
                            >
                                <Text>Process Refund</Text>
                            </Pressable>
                        )}
                        
                    </View>
                ))}
                
                <Text>Cancellations by User</Text>
                { businessCancellations.length > 0 && businessCancellations.filter(c => c.cancelledBy === 'user').map(c => (
                    <View key={c.id} style={styles.box}>
                        <Text>Cancellation ID: {c.id}</Text>    
                        <Text>Booking ID: {c.bookingId}</Text>
                        <Text>Offer ID: {c.offerId}</Text>
                        <Text>Reason: {c.reason}</Text>
                        <Text>Status: {c.status}</Text>
                        <Pressable onPress={() => processCancellationRequest(c, true, reason)} 
                            style={{ backgroundColor: 'green', padding: 10, marginTop: 10 }}
                        >
                            <Text>Approve</Text>
                        </Pressable>
                        <Pressable onPress={() => processCancellationRequest(c, false, reason)} 
                            style={{ backgroundColor: 'red', padding: 10, marginTop: 10 }}
                        >
                            <Text>Reject</Text>
                        </Pressable>
                    </View>
                ))}

                <View style={styles.box}>
                <Text>View Bookings</Text>
                <Pressable onPress={() => {}} style={{ backgroundColor: 'blue', padding: 10, marginTop: 10 }}>
                    <Text>Refresh Bookings</Text>
                </Pressable>
                { writingError && <Text style={{ color: 'red' }}>{writingError}</Text> }
                { subscriptionError && <Text style={{ color: 'red' }}>{subscriptionError}</Text> }
                { storeError && <Text style={{ color: 'red' }}>{storeError}</Text> }
                <TextInput
                    placeholder="Enter reason for cancellation"
                    value={reason}
                    onChangeText={setReason}
                    style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginBottom: 10 }}
                />
                
                { /** DISPLAY BUSINESS BOOKINGS */}

                { businessBookings.length > 0 && businessBookings.filter(b => b.trail.name === 'Mt. Batulao').map(c => (
                    <View key={c.id} style={styles.box}>
                        <Text>Booking ID: {c.id}</Text>    
                        <Text>Offer ID: {c.offer.id}</Text>
                        <Text>User: {c.user.username}</Text>
                        <Text>Trail: {c.trail.name}</Text>
                        <Text>Status: {c.status}</Text>
                        <Text>Reserved on: {c.createdAt.toLocaleDateString()}</Text>
                        <Text>Status: {c.offer.date < new Date() ? 'Expired' : 'Active'}</Text>
                        <Pressable onPress={() => cancelUserBooking(c, reason)} 
                            style={{ backgroundColor: 'green', padding: 10, marginTop: 10 }}
                        >
                            <Text>Cancel User Booking</Text>
                        </Pressable>
                    </View>
                ))}
            </View>
            </View>
        </View>
    )
}

const UserCancellation = () => {
    const [reason, setReason] = useState<string>("");
    const [offer, setOffer] = useState<Offer | null>(null);
    
    const {
        newCancellationRequest,
        updateCancellationReason,
        cancelUserRequest,
        proceedToAdminCancellation,
        proceedToAdminReschedule,
        writingError: error,
        isWriting,
    } = useCancellationUser();

    const {
        seeSimilarOffers,
        error: similarOffersError,
        similarOffers
    } = useOfferSimilarList();

    const {
        bookings,
        subscriptionError
    } = useBookingUserList();

    const {
        userCancellations,
        isFetching,
        refreshUserCancellations
    } = useCancellationUserList();

    if(isFetching) {
        return <CustomLoading message="Fetching your cancellations..." />
    }

    if(isWriting) {
        return <CustomLoading message="Submitting your request..." />
    }

    return (
        <View>
            <Text>User Cancellation</Text>
            { error && <Text style={{ color: 'red' }}>{error}</Text> }
            { subscriptionError && <Text style={{ color: 'red' }}>{subscriptionError}</Text> }
            
            <Pressable onPress={refreshUserCancellations} style={{ backgroundColor: 'blue', padding: 10, marginTop: 10 }}>
                <Text>Refresh Cancellations</Text>
            </Pressable> 
            <TextInput
                placeholder="Enter cancellation reason"
                value={reason}
                onChangeText={setReason}
                style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginBottom: 10 }}
            />

            <Text>Cancellations by Admin</Text>
            { userCancellations.length > 0 && userCancellations.filter(c => c.cancelledBy === 'admin').map(c => (
                <View key={c.id} style={styles.box}>
                    <Text>Cancellation ID: {c.id}</Text>
                    <Text>Booking ID: {c.bookingId}</Text>
                    <Text>Reason: {c.reason}</Text>
                    <Text>Status: {c.status}</Text>
                    { c.status === 'pending' && (
                        <View>
                            <Pressable onPress={() => proceedToAdminCancellation(c)}>
                                <Text>Approve Admin Cancellation</Text>
                            </Pressable>
                            

                            <Pressable onPress={() => seeSimilarOffers(c.offerId)}>
                                <Text>See Similar Offers to Reschedule</Text>
                            </Pressable>

                            { similarOffers && (
                                <View>
                                    <br/>
                                    <Text>Similar Offers by Trail</Text>
                                    { similarOffers.similarTrail.map(offer => (
                                        <Pressable key={offer.id} style={styles.box} onPress={() => proceedToAdminReschedule(c, offer)}>
                                            <Text>Offer ID: {offer.id}</Text>
                                            <Text>Trail: {offer.trail.name}</Text>
                                            <Text>Date: {offer.date.toLocaleDateString()}</Text>
                                            <Text>Price: P{offer.price.toFixed(2)}</Text>
                                        </Pressable>
                                    ))}
                                    <br/>
                                    <Text>Similar Offers by Date</Text>
                                    { similarOffers.similarDate.map(offer => (
                                        <Pressable key={offer.id} style={styles.box} onPress={() => proceedToAdminReschedule(c, offer)}>
                                            <Text>Offer ID: {offer.id}</Text>
                                            <Text>Trail: {offer.trail.name}</Text>
                                            <Text>Date: {offer.date.toLocaleDateString()}</Text>
                                            <Text>Price: P{offer.price.toFixed(2)}</Text>
                                        </Pressable>
                                    ))}

                                    <br/>
                                    <Text>Similar Offers by Price</Text>
                                    { similarOffers.similarPrice.map(offer => (
                                        <Pressable key={offer.id} style={styles.box} onPress={() => proceedToAdminReschedule(c, offer)}>
                                            <Text>Offer ID: {offer.id}</Text>
                                            <Text>Trail: {offer.trail.name}</Text>
                                            <Text>Date: {offer.date.toLocaleDateString()}</Text>
                                            <Text>Price: P{offer.price.toFixed(2)}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            ))}

            <Text>Cancellations by User</Text>
            { userCancellations.length > 0 && userCancellations.filter(c => c.cancelledBy === 'user').map(c => (
                <View key={c.id} style={styles.box}>
                    <Text>Cancellation ID: {c.id}</Text>
                    <Text>Booking ID: {c.bookingId}</Text>
                    <Text>Reason: {c.reason}</Text>
                    <Text>Status: {c.status}</Text>
                    { c.status === 'pending' && (
                        <Pressable 
                            onPress={() => cancelUserRequest(c)} 
                            style={{ backgroundColor: 'red', padding: 10, marginTop: 10 }}
                        >
                            <Text>Cancel Request</Text>
                        </Pressable>
                    )}

                    { c.status === 'approved' && (
                        <View>
                            <Text style={{ marginTop: 10, color: 'green' }}>
                                Request Approved
                            </Text>
                        </View>
                    )}

                    { c.status === 'rejected' && (
                        <View>
                            <Pressable 
                                onPress={() => updateCancellationReason({
                                reason: reason,
                                oldRequest: c})}
                                style={{ backgroundColor: 'orange', padding: 10, marginTop: 10 }}   
                            >
                                <Text>Update Cancellation Reason</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            ))}

            <Text>Bookings</Text>
            { bookings.length > 0 && bookings.map(b => (
                <View key={b.id} style={styles.box}>
                    <Text>Booking ID: {b.id}</Text>
                    <Text>Trail: {b.trail.name}</Text>
                    <Text>On: {b.offer.date.toLocaleDateString()}</Text>
                    <Pressable onPress={() => {
                        const request = {
                            businessId: b.business.id,
                            bookingId: b.id,
                            offerId: b.offer.id,
                            reason: reason,
                        };
                        newCancellationRequest(request, b.offer.date);
                    }}>
                        <Text>Submit Cancellation Request</Text>
                    </Pressable>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    box: {
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        margin: 10,
    }
});