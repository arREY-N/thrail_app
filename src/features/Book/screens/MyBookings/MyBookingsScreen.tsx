/**
 * @file MyBookingsScreen.tsx
 * @description Main container screen for displaying a user's booking list, filtering, payment overview, and receipt views.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomFilterModal from '@/src/components/CustomFilterModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomText from '@/src/components/CustomText';
import CustomToast from '@/src/components/CustomToast';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

import BookingCard from '@/src/features/Book/components/BookingCard';
import BookTabs from '@/src/features/Book/components/BookTabs';
import useBookingFilters from '@/src/features/Book/hooks/useBookingFilters';

import BookingDetailsScreen from '@/src/features/Book/screens/MyBookings/BookingDetailsScreen';
import MyBookingsEmptyState from '@/src/features/Book/screens/MyBookings/components/MyBookingsEmptyState';
import MyBookingsSkeleton from '@/src/features/Book/screens/MyBookings/components/MyBookingsSkeleton';
import { MyBookingsView, useMyBookingsWorkflow } from '@/src/features/Book/screens/MyBookings/hooks/useMyBookingsWorkflow';
import PaymentScreen, { PaymentResultResponse } from '@/src/features/Book/screens/Payment/PaymentScreen';
import ReceiptScreen from '@/src/features/Book/screens/Payment/ReceiptScreen';

import { UserSearchResult } from '@/src/components/EmergencyModal';
import { Booking, Requirements } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { IOffer } from '@/src/core/models/Offer/Offer';
import { IEmergencyContact, User } from '@/src/core/models/User/User';

export interface MyBookingsScreenProps {
    /** Array of user's bookings */
    userBookings: Booking[];
    /** Error message, if any */
    error?: string | null;
    /** Loading state */
    isLoading?: boolean;
    /** Back button handler */
    onBackPress: () => void;
    /** Callback when cancel is pressed */
    onCancelBookingPress: (booking: Booking, reason: string) => Promise<void> | void;
    /** Callback for refund confirmation */
    onRefundBookingPress?: (booking: Booking, reason: string) => Promise<void> | void;
    /** Callback when re-uploading all rejected documents and/or updating contacts on rejected bookings */
    onResubmitDocuments?: (
        booking: Booking,
        updatedDocs: Requirements[],
        updatedPhone?: string,
        updatedEmergency?: IEmergencyContact
    ) => Promise<boolean>;
    /** Callback when updating contact details on rejected bookings */
    onUpdateBookingContacts?: (booking: Booking, phone: string, emergencyContact: IEmergencyContact) => Promise<boolean>;
    /** Callback to reschedule */
    onRescheduleBooking?: (booking: Booking, newOffer: IOffer) => Promise<void> | void;
    /** Callback to pay */
    onPayOffer: (amount: number, bookingId?: string, method?: string, returnUrl?: string) => Promise<PaymentResultResponse>;
    /** Function to fetch full offer */
    getBookOffer: (id: string) => Promise<IOffer | null>;
    /** Available future offers for rescheduling */
    availableFutureOffers?: IOffer[];
    /** Initial booking ID to open */
    initialBookingId?: string | null;
    /** Initial view mode */
    initialView?: MyBookingsView;
    /** Callback for Terms of Service */
    onTermsPress: () => void;
    /** Callback for Privacy Policy */
    onPrivacyPress: () => void;
    /** Array of active cancellations for user's bookings */
    userCancellations?: Cancellation[];
    /** Callback to withdraw cancellation */
    onWithdrawCancellation?: (cancellation: Cancellation) => Promise<void> | void;
    /** Callback to appeal / update cancellation reason */
    onUpdateCancellationReason?: (params: { reason: string; oldRequest: Cancellation }) => Promise<void> | void;
    /** Callback to accept admin cancellation */
    onAcceptAdminCancellation?: (cancellation: Cancellation) => Promise<void> | void;
    /** The authenticated user profile passed from controller */
    currentUserProfile?: User | null;
    /** Callback to self-heal phone verification on profile */
    onSyncBookingVerification?: (booking: Booking) => Promise<void>;
    /** Async user search passed to emergency setup modal */
    onSearchUser?: (email: string) => Promise<UserSearchResult[]>;
    /** Callback to explore trails when zero bookings exist */
    onExplorePress?: () => void;
    /** Callback to retry loading on error */
    onRetry?: () => void;
    /** Loading indicator for active retry request */
    isRetrying?: boolean;
}

/**
 * Main container screen for a user's bookings list and details views.
 * 
 * @param {MyBookingsScreenProps} props - Component props
 */
const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({
    userBookings = [],
    error,
    isLoading = false,
    onBackPress,
    onCancelBookingPress,
    onRefundBookingPress,
    onResubmitDocuments,
    onUpdateBookingContacts,
    onRescheduleBooking,
    onPayOffer,
    getBookOffer,
    availableFutureOffers,
    initialBookingId,
    initialView,
    onTermsPress,
    onPrivacyPress,
    currentUserProfile,
    onSyncBookingVerification,
    onSearchUser,
    userCancellations = [],
    onWithdrawCancellation,
    onUpdateCancellationReason,
    onAcceptAdminCancellation,
    onExplorePress,
    onRetry,
    isRetrying = false,
}) => {
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

    // Coordinate workflows, view transitions, selection, and toast notifications
    const {
        currentView, setCurrentView,
        selectedBooking,
        selectedBookingCancellation,
        toastConfig,
        hideToast,
        handleHeaderBackPress,
        handleBookingSelectPress,
        handleProceedToPaymentPress,
        handleViewReceiptPress,
        handleCancelConfirm,
        handleRescheduleConfirm,
        handleRefundConfirm,
    } = useMyBookingsWorkflow({
        userBookings,
        userCancellations,
        initialBookingId,
        initialView,
        onBackPress,
        onCancelBookingPress,
        onRescheduleBooking,
        onRefundBookingPress,
    });

    // In-memory tab, sort, and status filtering
    const {
        tabs,
        activeTab, setActiveTab,
        filteredBookings,
        filterSections,
        sortBy, setSortBy,
        sortOrder, setSortOrder,
        filterBy, setFilterBy,
    } = useBookingFilters(userBookings, userCancellations);

    const displayError = error === 'No trail ID provided' ? null : error;

    const flatListRef = useRef<FlatList<Booking>>(null);
    const scrollOffsetY = useRef<number>(0);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetY.current = event.nativeEvent.contentOffset.y;
    }, []);

    const handleTabPress = useCallback((tabId: import('@/src/features/Book/hooks/useBookingFilters').TabId) => {
        if (tabId === activeTab) {
            if (scrollOffsetY.current > 0) {
                const shouldAnimate = scrollOffsetY.current < 3000;
                flatListRef.current?.scrollToOffset({ offset: 0, animated: shouldAnimate });
            }
        } else {
            setActiveTab(tabId);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }
    }, [activeTab, setActiveTab]);

    // View 1: Main Bookings List
    if (currentView === 'list') {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title="My Bookings"
                    centerTitle={true}
                    onBackPress={handleHeaderBackPress}
                    rightActions={
                        <TouchableOpacity
                            style={styles.headerOptionsBtn}
                            onPress={() => setShowFilterModal(true)}
                            activeOpacity={0.7}
                        >
                            <CustomIcon
                                library="Feather"
                                name="sliders"
                                size={22}
                                color={Colors.PRIMARY}
                            />
                        </TouchableOpacity>
                    }
                />

                <View style={[styles.constrainer, styles.stickyTabsContainer]}>
                    <BookTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(id: string) =>
                            handleTabPress(id as import('@/src/features/Book/hooks/useBookingFilters').TabId)
                        }
                    />
                </View>

                <FlatList
                    ref={flatListRef}
                    data={filteredBookings}
                    keyExtractor={(item) => item.id}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => (
                        <View style={styles.constrainer}>
                            <BookingCard
                                booking={item}
                                cancellation={userCancellations.find(c => c.bookingId === item.id)}
                                onSelectBooking={handleBookingSelectPress}
                            />
                        </View>
                    )}
                    ListHeaderComponent={
                        displayError ? (
                            <View style={styles.constrainer}>
                                <ErrorMessage
                                    error={displayError}
                                    onRetry={onRetry}
                                    isRetrying={isRetrying}
                                />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.constrainer}>
                            {isLoading ? (
                                <MyBookingsSkeleton count={3} />
                            ) : (
                                <MyBookingsEmptyState
                                    activeTab={activeTab}
                                    filterBy={filterBy}
                                    isZeroBookingsAccount={userBookings.length === 0}
                                    onExplorePress={onExplorePress}
                                    onResetFiltersPress={() => setFilterBy('all')}
                                />
                            )}
                        </View>
                    }
                    ListFooterComponent={
                        filteredBookings.length > 0 && !isLoading ? (
                            <View style={[styles.constrainer, styles.footerContainer]}>
                                <CustomText variant="caption" style={styles.footerText}>
                                    No more bookings to show.
                                </CustomText>
                            </View>
                        ) : null
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={5}
                    windowSize={5}
                    maxToRenderPerBatch={5}
                    removeClippedSubviews={Platform.OS !== 'web'}
                />

                <CustomFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    title="Sort & Filter"
                    sections={filterSections}
                    initialValues={{ sortBy, sortOrder, filterBy }}
                    defaultValues={{
                        sortBy: activeTab === 'pending' ? 'last-updated' : 'hike-date',
                        sortOrder: activeTab === 'upcoming' ? 'asc' : 'desc',
                        filterBy: 'all',
                    }}
                    onApply={(values: Record<string, unknown>) => {
                        if (typeof values.sortBy === 'string') {
                            setSortBy(values.sortBy as import('@/src/features/Book/hooks/useBookingFilters').SortBy);
                        }
                        if (typeof values.sortOrder === 'string') {
                            setSortOrder(values.sortOrder as import('@/src/features/Book/hooks/useBookingFilters').SortOrder);
                        }
                        if (typeof values.filterBy === 'string') {
                            setFilterBy(values.filterBy as import('@/src/features/Book/hooks/useBookingFilters').FilterBy);
                        }
                    }}
                />

                <CustomToast
                    visible={toastConfig.visible}
                    type={toastConfig.type}
                    message={toastConfig.message}
                    mode={toastConfig.type === 'error' ? 'dismissible' : 'simple'}
                    position="tabbar"
                    onHide={hideToast}
                />
            </ScreenWrapper>
        );
    }

    // View 2: Booking Details / Overview
    if (currentView === 'overview') {
        if (!selectedBooking) {
            return (
                <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                    <CustomHeader title="Booking Details" onBackPress={handleHeaderBackPress} />
                    <CustomLoading visible={true} message="Loading booking details..." />
                </ScreenWrapper>
            );
        }

        return (
            <BookingDetailsScreen
                booking={selectedBooking}
                getBookOffer={getBookOffer}
                availableFutureOffers={availableFutureOffers}
                onBackPress={handleHeaderBackPress}
                onProceedToPayment={handleProceedToPaymentPress}
                onViewReceipt={handleViewReceiptPress}
                onResubmitDocuments={onResubmitDocuments}
                onUpdateContacts={onUpdateBookingContacts}
                currentUserProfile={currentUserProfile}
                onSyncBookingVerification={onSyncBookingVerification}
                onSearchUser={onSearchUser}
                cancellation={selectedBookingCancellation}
                onWithdrawCancellation={onWithdrawCancellation}
                onUpdateCancellationReason={onUpdateCancellationReason}
                onAcceptAdminCancellation={onAcceptAdminCancellation}
                onCancelConfirm={handleCancelConfirm}
                onRefundConfirm={handleRefundConfirm}
                onReschedule={handleRescheduleConfirm}
            />
        );
    }

    // View 3: Payment Screen
    if (currentView === 'payment') {
        if (!selectedBooking) {
            return (
                <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                    <CustomHeader title="Payment" onBackPress={handleHeaderBackPress} />
                    <CustomLoading visible={true} message="Loading payment details..." />
                </ScreenWrapper>
            );
        }

        return (
            <PaymentScreen
                bookingData={selectedBooking}
                onContinue={() => setCurrentView('overview')}
                onBackPress={handleHeaderBackPress}
                onPayOffer={onPayOffer}
                onTermsPress={onTermsPress}
                onPrivacyPress={onPrivacyPress}
            />
        );
    }

    // View 4: Receipt Screen
    if (currentView === 'receipt') {
        if (!selectedBooking) {
            return (
                <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                    <CustomHeader title="Receipt" onBackPress={handleHeaderBackPress} />
                    <CustomLoading visible={true} message="Loading receipt..." />
                </ScreenWrapper>
            );
        }

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
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    headerOptionsBtn: {
        paddingHorizontal: 8,
    },
    stickyTabsContainer: {
        zIndex: 10,
        backgroundColor: Colors.BACKGROUND,
    },
    footerContainer: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    },
});

export default MyBookingsScreen;
