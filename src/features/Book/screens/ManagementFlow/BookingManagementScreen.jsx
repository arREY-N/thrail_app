import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

const BookingManagementScreen = ({ userBookings, isLoading, onBackPress }) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="My Bookings" onBackPress={onBackPress} />
            
            <View style={styles.container}>
                <CustomText variant="h2">Booking Hub</CustomText>
                <CustomText variant="body" color={Colors.TEXT_SECONDARY}>
                    List of upcoming and past hikes will go here.
                </CustomText>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    }
});

export default BookingManagementScreen;