/**
 * @file refund.tsx
 * @description Controller route for hiker refund e-wallet submission screen.
 */

import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import CustomLoading from '@/src/components/CustomLoading';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import CustomButton from '@/src/components/CustomButton';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { useBookingUserList } from '@/src/core/models/Booking/Booking';
import { useCancellationUserList, useCancellationStore, IUserWalletDetails } from '@/src/core/models/Cancellation/Cancellation';
import { UserRefundScreen } from '@/src/features/Book/screens/Refund/UserRefundScreen';
import getSearchParam from '@/src/core/utility/getSearchParam';

export default function BookRefundRoute() {
    const router = useRouter();
    const { bookingId: rawBookingId, cancellationId: rawCancellationId } = useLocalSearchParams();
    const bookingId = getSearchParam(rawBookingId);
    const cancellationId = getSearchParam(rawCancellationId);

    const { bookings, isFetching: isBookingFetching } = useBookingUserList();
    const { userCancellations, isFetching: isCancellationLoading } = useCancellationUserList();

    const booking = bookings.find(b => b.id === bookingId);
    const cancellation = userCancellations.find(c => 
        (cancellationId && c.id === cancellationId) || (bookingId && c.bookingId === bookingId)
    );

    const handleBack = () => {
        router.back();
    };

    if (isBookingFetching || isCancellationLoading) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <Stack.Screen options={{ headerShown: false }} />
                <CustomHeader title="Refund Details" centerTitle={true} onBackPress={handleBack} />
                <CustomLoading message="Loading refund details..." />
            </ScreenWrapper>
        );
    }

    if (!booking || !cancellation) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <Stack.Screen options={{ headerShown: false }} />
                <CustomHeader title="Refund Details" centerTitle={true} onBackPress={handleBack} />
                <View style={styles.emptyContainer}>
                    <CustomText variant="h3" style={styles.emptyTitle}>
                        Refund Not Found
                    </CustomText>
                    <CustomText style={styles.emptySubtitle}>
                        Could not locate an active refund request for this booking.
                    </CustomText>
                    <CustomButton
                        title="Return to Bookings"
                        variant="primary"
                        onPress={handleBack}
                        style={{ marginTop: 16 }}
                    />
                </View>
            </ScreenWrapper>
        );
    }

    const handleSubmitWallet = async (walletData: IUserWalletDetails<Date>) => {
        const updatedCancellation = {
            ...cancellation,
            userWallet: walletData,
            handshakeStep: 'awaiting_admin_payout' as const,
            updatedAt: new Date(),
        };

        await useCancellationStore.getState().write({
            cancellation: updatedCancellation,
            isAdmin: false,
        });

        router.back();
        return true;
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <UserRefundScreen
                booking={booking}
                cancellation={cancellation}
                onBackPress={handleBack}
                onSubmitWallet={handleSubmitWallet}
            />
        </>
    );
}

const styles = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
});
