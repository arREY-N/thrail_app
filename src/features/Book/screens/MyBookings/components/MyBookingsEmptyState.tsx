/**
 * @file MyBookingsEmptyState.tsx
 * @description Contextual empty state component for MyBookingsScreen.
 * Distinguishes between tab-specific empty states and explicit filter match misses.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { FilterBy, TabId } from '@/src/features/Book/hooks/useBookingFilters';

interface MyBookingsEmptyStateProps {
    /** The active tab identifier */
    activeTab?: TabId;
    /** Current status filter applied */
    filterBy?: FilterBy;
    /** Whether the user has zero bookings in total across their entire account */
    isZeroBookingsAccount?: boolean;
    /** Callback when user clicks "Explore Trails" */
    onExplorePress?: () => void;
    /** Callback when user clicks "Reset Filters" (when filtered results are empty) */
    onResetFiltersPress?: () => void;
}

const MyBookingsEmptyState: React.FC<MyBookingsEmptyStateProps> = ({
    activeTab = 'upcoming',
    filterBy = 'all',
    isZeroBookingsAccount = false,
    onExplorePress,
    onResetFiltersPress,
}) => {
    // 1. Explicit filter is active, but yielded zero matching results
    if (filterBy !== 'all') {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.iconCircleMuted}>
                    <CustomIcon 
                        library="Feather" 
                        name="inbox" 
                        size={36} 
                        color={Colors.GRAY_LIGHT} 
                    />
                </View>

                <CustomText variant="h3" style={styles.title}>
                    No Bookings Match Your Filters
                </CustomText>

                <CustomText variant="body" style={styles.description}>
                    Try clearing or changing your status filter to see all bookings in this tab.
                </CustomText>

                {onResetFiltersPress && (
                    <CustomButton
                        title="Reset Filters"
                        variant="outline"
                        onPress={onResetFiltersPress}
                        style={styles.resetBtn}
                    />
                )}
            </View>
        );
    }

    // 2. Brand-new user with 0 bookings across all tabs
    if (isZeroBookingsAccount) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.iconCircle}>
                    <CustomIcon 
                        library="Feather" 
                        name="compass" 
                        size={40} 
                        color={Colors.PRIMARY} 
                    />
                </View>

                <CustomText variant="h3" style={styles.title}>
                    No Hikes Booked Yet
                </CustomText>

                <CustomText variant="body" style={styles.description}>
                    {"You haven't booked any mountain adventures yet. Discover breathtaking trails and reserve your next hike!"}
                </CustomText>

                {onExplorePress && (
                    <CustomButton
                        title="Explore Trails & Offers"
                        onPress={onExplorePress}
                        style={styles.actionBtn}
                    />
                )}
            </View>
        );
    }

    // 3. Tab-specific natural empty state (filterBy === 'all')
    if (activeTab === 'upcoming') {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.iconCircle}>
                    <CustomIcon 
                        library="Feather" 
                        name="calendar" 
                        size={36} 
                        color={Colors.PRIMARY} 
                    />
                </View>

                <CustomText variant="h3" style={styles.title}>
                    No Upcoming Hikes
                </CustomText>

                <CustomText variant="body" style={styles.description}>
                    {"You don't have any confirmed hikes scheduled right now. When you complete a booking and payment, your hike pass will appear here."}
                </CustomText>

                {onExplorePress && (
                    <CustomButton
                        title="Explore Trails & Offers"
                        onPress={onExplorePress}
                        style={styles.actionBtn}
                    />
                )}
            </View>
        );
    }

    if (activeTab === 'pending') {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.iconCircleMuted}>
                    <CustomIcon 
                        library="Feather" 
                        name="clock" 
                        size={36} 
                        color={Colors.GRAY_LIGHT} 
                    />
                </View>

                <CustomText variant="h3" style={styles.title}>
                    No Pending Bookings
                </CustomText>

                <CustomText variant="body" style={styles.description}>
                    You have no reservations awaiting payment, document submissions, or organizer review.
                </CustomText>
            </View>
        );
    }

    // Default for 'history' tab
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.iconCircleMuted}>
                <CustomIcon 
                    library="Feather" 
                    name="archive" 
                    size={36} 
                    color={Colors.GRAY_LIGHT} 
                />
            </View>

            <CustomText variant="h3" style={styles.title}>
                No Past Hikes
            </CustomText>

            <CustomText variant="body" style={styles.description}>
                Completed, expired, and cancelled bookings will appear here for your reference.
            </CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    iconCircleMuted: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 320,
        marginBottom: 20,
    },
    actionBtn: {
        minWidth: 200,
        borderRadius: 16,
    },
    resetBtn: {
        minWidth: 160,
        borderRadius: 16,
    },
});

export default MyBookingsEmptyState;
