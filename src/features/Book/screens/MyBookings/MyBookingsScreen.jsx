import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

import BookingCard from '@/src/features/Book/components/BookingCard';
import BookTabs from '@/src/features/Book/components/BookTabs';
import useBookingFilters from '@/src/features/Book/hooks/useBookingFilters';

import BookingDetailsScreen from '@/src/features/Book/screens/MyBookings/BookingDetailsScreen';
import PaymentStatusScreen from '@/src/features/Book/screens/MyBookings/PaymentStatusScreen';
import ReceiptScreen from '@/src/features/Book/screens/MyBookings/ReceiptScreen';
import PaymentScreen from '@/src/features/Book/screens/Payment/PaymentScreen';

const MyBookingsScreen = ({
    userBookings,
    error,
    onBackPress,
    onCancelBookingPress,
    onRefundBookingPress, 
    getBookOffer
}) => {
    const [currentView, setCurrentView] = useState('list'); 
    const [selectedBooking, setSelectedBooking] = useState(null);

    const { 
        tabs, 
        activeTab, 
        setActiveTab, 
        filteredBookings 
    } = useBookingFilters(userBookings);

    const onHeaderBackPress = () => {
        if (currentView === 'overview') {
            setCurrentView('list');
            setSelectedBooking(null);
        } else if (currentView === 'payment') {
            setCurrentView('overview');
        } else {
            onBackPress();
        }
    };

    const onBookingSelectPress = (booking) => {
        setSelectedBooking(booking);

        if (booking.status === 'paid') {
            setCurrentView('payment-status');
        } else {
            setCurrentView('overview'); 
        }
    };

    const onProceedToPaymentPress = () => {
        setCurrentView('payment');
    };

    const onPaymentSubmitPress = (paymentData) => {
        console.log("Submitting Payment: ", paymentData);
        setCurrentView('payment-status');
    };

    const displayError = error === 'No trail ID provided' ? null : error;

    if (currentView === 'list') {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader 
                    title="My Bookings" 
                    centerTitle={true} 
                    onBackPress={onHeaderBackPress} 
                />

                <BookTabs 
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                >
                    {displayError && (
                        <View style={styles.errorBox}>
                            <CustomText variant="caption" color={Colors.ERROR}>
                                {displayError}
                            </CustomText>
                        </View>
                    )}

                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <BookingCard 
                                key={booking.id} 
                                booking={booking} 
                                onSelectBooking={onBookingSelectPress} 
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <CustomIcon 
                                library="Feather" 
                                name="inbox" 
                                size={48} 
                                color={Colors.GRAY_LIGHT} 
                            />
                            <CustomText variant="body" style={styles.emptyText}>
                                No bookings found in this category.
                            </CustomText>
                        </View>
                    )}
                </ScrollView>
            </ScreenWrapper>
        );
    }

    if (currentView === 'overview') {
        return (
            <BookingDetailsScreen
                booking={selectedBooking}
                getBookOffer={getBookOffer}
                onBackPress={onHeaderBackPress}
                onProceedToPayment={onProceedToPaymentPress}
                onViewReceipt={() => setCurrentView('receipt')}
                onCancelConfirm={(booking, reason) => {
                    onCancelBookingPress(booking, reason);
                    setCurrentView('list');
                }}
                onRefundConfirm={(booking, reason) => {
                    if (onRefundBookingPress) {
                        onRefundBookingPress(booking, reason);
                        setCurrentView('list');
                    }
                }}
                onReschedule={() => {
                    console.log("Reschedule pressed for: ", selectedBooking.id);
                }}
            />
        );
    }

    if (currentView === 'payment') {
        return (
            <PaymentScreen 
                bookingData={selectedBooking}
                onContinue={onPaymentSubmitPress}
                onBackPress={onHeaderBackPress}
            />
        );
    }

    if (currentView === 'payment-status') {
        return (
            <PaymentStatusScreen 
                bookingData={selectedBooking}
                onBackPress={() => setCurrentView('list')}
                onViewDetails={() => setCurrentView('overview')}
            />
        );
    }

    if (currentView === 'receipt') {
        return (
            <ReceiptScreen 
                bookingData={selectedBooking}
                onFinish={() => setCurrentView('overview')}
            />
        );
    }

    return null;
};

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40,
    },
    errorBox: { 
        backgroundColor: Colors.ERROR_BG, 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER,
    },
    emptyState: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 60, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT,
    },
    emptyText: { 
        marginTop: 12, 
        color: Colors.TEXT_SECONDARY,
    },
});

export default MyBookingsScreen;