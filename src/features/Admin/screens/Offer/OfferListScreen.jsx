import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { safeParseDateString } from '@/src/utils/dateFormatter';

import useOfferFilters, { FILTER_OPTIONS } from '@/src/features/Admin/hooks/useOfferFilters';
import OfferCard from '@/src/features/Admin/screens/Offer/components/OfferCard';

const OfferListScreen = ({ 
    offers,
    bookingByOffer, 
    isLoading, 
    error,
    onAddOffer, 
    onEditOffer,
    onViewOfferBookings,
    onBackPress 
}) => {
    
    const { 
        searchQuery, 
        setSearchQuery, 
        activeFilter, 
        setActiveFilter, 
        filteredAndSortedOffers 
    } = useOfferFilters(offers);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEditId, setSelectedEditId] = useState(null);

    const handleEditPress = (offerId) => {
        setSelectedEditId(offerId);
        setShowEditModal(true);
    };

    const confirmEdit = () => {
        setShowEditModal(false);
        if (selectedEditId) {
            onEditOffer(selectedEditId);
        }
    };

    const HeaderAddAction = (
        <TouchableOpacity 
            style={styles.headerAddButton}
            onPress={onAddOffer}
            activeOpacity={0.7}
        >
            <CustomIcon 
                library="Feather" 
                name="plus" 
                size={16} 
                color={Colors.WHITE} 
            />
            <CustomText style={styles.headerAddText}>
                New
            </CustomText>
        </TouchableOpacity>
    );

    const getOfferStatusDetails = (offer) => {
        const status = (offer.status || '').toLowerCase();
        const offerDate = safeParseDateString(offer.date || offer.hikeDate);
        offerDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (status === 'cancelled') {
            return { 
                label: 'Cancelled', 
                color: Colors.ERROR, 
                bg: Colors.ERROR_BG 
            };
        }
        if (status === 'rescheduled') {
            return { 
                label: 'Rescheduled', 
                color: Colors.WARNING, 
                bg: Colors.STATUS_WARNING_BG 
            };
        }
        if (offerDate < today) {
            return { 
                label: 'Expired', 
                color: Colors.TEXT_SECONDARY, 
                bg: Colors.GRAY_ULTRALIGHT 
            };
        }
        return { 
            label: 'Active', 
            color: Colors.SUCCESS, 
            bg: Colors.STATUS_APPROVED_BG 
        };
    };

    const getActionableBookingsCount = (offerId) => {
        if (!bookingByOffer || !bookingByOffer[offerId]) return 0;
        
        return bookingByOffer[offerId].filter(b => {
            const status = b.status || '';
            return status === 'pending-docs' || 
                   status === 'for-reservation' || 
                   status === 'paid' || 
                   status === 'downpayment';
        }).length;
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Manage Offers" 
                centerTitle={true} 
                onBackPress={onBackPress}
                rightActions={HeaderAddAction} 
                hasSearch={true}
                searchProps={{
                    searchPlaceholder: "Search by trail name...",
                    searchValue: searchQuery,
                    onSearchChange: setSearchQuery,
                    tabs: FILTER_OPTIONS,
                    activeTab: activeFilter,
                    onTabSelect: setActiveFilter
                }}
            />

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    <ErrorMessage error={error} />

                    {isLoading && (
                        <View style={styles.centerContent}>
                            <ActivityIndicator 
                                size="large" 
                                color={Colors.PRIMARY} 
                            />
                        </View>
                    )}

                    {!isLoading && offers?.length === 0 && (
                        <View style={styles.emptyState}>
                            <CustomIcon 
                                library="Feather" 
                                name="inbox" 
                                size={48} 
                                color={Colors.GRAY_MEDIUM} 
                            />
                            <CustomText variant="h3" style={styles.emptyTitle}>
                                No Offers Yet
                            </CustomText>
                            <CustomText variant="body" style={styles.emptySubtitle}>
                                Create your first hiking package to start receiving bookings.
                            </CustomText>
                        </View>
                    )}

                    {!isLoading && offers?.length > 0 && filteredAndSortedOffers.length === 0 && (
                        <View style={styles.emptyState}>
                            <CustomIcon 
                                library="Feather" 
                                name="search" 
                                size={48} 
                                color={Colors.GRAY_MEDIUM} 
                            />
                            <CustomText variant="h3" style={styles.emptyTitle}>
                                No Results
                            </CustomText>
                            <CustomText variant="body" style={styles.emptySubtitle}>
                                No offers matched your search or filters.
                            </CustomText>
                        </View>
                    )}

                    {!isLoading && filteredAndSortedOffers.length > 0 && (
                        <View style={styles.listContainer}>
                            {filteredAndSortedOffers.map(offer => (
                                <OfferCard 
                                    key={offer.id}
                                    offer={offer}
                                    statusDetails={getOfferStatusDetails(offer)}
                                    actionableCount={getActionableBookingsCount(offer.id)}
                                    onViewBookings={onViewOfferBookings}
                                    onEditPress={handleEditPress}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <ConfirmationModal 
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Active Offer?"
                message="Editing this offer will change the details and requirements for all future bookings. Are you sure you want to proceed?"
                confirmText="Yes, Edit Offer"
                cancelText="Cancel"
                onConfirm={confirmEdit}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingVertical: 16, 
        paddingHorizontal: 16, 
        paddingBottom: 40 
    },
    constrainer: { 
        width: '100%', 
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center' 
    },
    centerContent: { 
        paddingVertical: 60, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    headerAddButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: Colors.PRIMARY, 
        paddingHorizontal: 16, 
        height: 32, 
        alignSelf: 'center', 
        borderRadius: 16, 
        gap: 4 
    },
    headerAddText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 12 
    },
    emptyState: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 60, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT 
    },
    emptyTitle: { 
        marginTop: 16, 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY 
    },
    emptySubtitle: { 
        color: Colors.TEXT_SECONDARY, 
        textAlign: 'center', 
        paddingHorizontal: 32 
    },
    listContainer: { 
        gap: 16 
    }
});

export default OfferListScreen;