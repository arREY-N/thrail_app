import CustomLoading from "@/src/components/CustomLoading";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingUserList } from "@/src/core/models/Booking/hooks/useBookingUserList";
import {
    useCancellationAdmin,
    useCancellationAdminList,
    useCancellationUser,
    useCancellationUserList
} from "@/src/core/models/Cancellation/Cancellation";
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
        isFetching,
        businessCancellations,
        refreshAdminCancellations,
    } = useCancellationAdminList();
    
    const {
        isWriting,
        localError,
        processCancellationRequest
    } = useCancellationAdmin();
    
    if(isFetching) {
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
                { localError && <Text style={{ color: 'red' }}>{localError}</Text> }
                <TextInput
                    placeholder="Enter admin note for approval/rejection"
                    value={reason}
                    onChangeText={setReason}
                    style={{ borderWidth: 1, borderColor: 'gray', padding: 5, marginBottom: 10 }}
                />
                { businessCancellations.length > 0 && businessCancellations.map(c => (
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
            </View>
        </View>
    )
}

const UserCancellation = () => {
    const [reason, setReason] = useState<string>("");
    
    const {
        newCancellationRequest,
        updateCancellationReason,
        cancelRequest,
        writingError: error,
        isWriting,
    } = useCancellationUser();

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

            <Text>Cancellations</Text>
            { userCancellations.length > 0 && userCancellations.map(c => (
                <View key={c.id} style={styles.box}>
                    <Text>Cancellation ID: {c.id}</Text>
                    <Text>Booking ID: {c.bookingId}</Text>
                    <Text>Reason: {c.reason}</Text>
                    <Text>Status: {c.status}</Text>
                    <Pressable onPress={() => updateCancellationReason({
                        reason: reason,
                        oldRequest: c
                    })}>
                        <Text>Update Cancellation Reason</Text>
                    </Pressable>
                    <Pressable onPress={() => cancelRequest(c)}>
                        <Text>Cancel Request</Text>
                    </Pressable>
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