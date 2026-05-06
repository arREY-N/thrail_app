import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { formatDateToStandard, safeParseDateString } from '@/src/utils/dateFormatter';

const FILTER_OPTIONS = ['All', 'Active', 'Expired', 'Rescheduled', 'Cancelled'];

const OfferListScreen = ({ 
    offers,
    isLoading, 
    error,
    onAddOffer, 
    onEditOffer,
    onViewOfferBookings,
    onBackPress 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEditId, setSelectedEditId] = useState(null);

    const filteredAndSortedOffers = useMemo(() => {
        if (!offers) return [];
        
        let filtered = [...offers];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(offer => {
                const trailName = offer.trail?.name || '';
                return trailName.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }

        if (activeFilter !== 'All') {
            filtered = filtered.filter(offer => {
                const status = (offer.status || '').toLowerCase();
                const offerDate = safeParseDateString(offer.date || offer.hikeDate);
                offerDate.setHours(0, 0, 0, 0);
                
                const isPast = offerDate < today;
                const isUpcomingOrToday = offerDate >= today;

                if (activeFilter === 'Cancelled') {
                    return status === 'cancelled';
                } else if (activeFilter === 'Rescheduled') {
                    return status === 'rescheduled';
                } else if (activeFilter === 'Expired') {
                    return isPast && status !== 'cancelled' && status !== 'rescheduled';
                } else if (activeFilter === 'Active') {
                    return isUpcomingOrToday && status !== 'cancelled' && status !== 'rescheduled';
                }
                
                return true;
            });
        }

        return filtered.sort((a, b) => {
            const dateA = safeParseDateString(a.date || a.hikeDate);
            const dateB = safeParseDateString(b.date || b.hikeDate);

            dateA.setHours(0, 0, 0, 0);
            dateB.setHours(0, 0, 0, 0);

            const statusA = (a.status || '').toLowerCase();
            const statusB = (b.status || '').toLowerCase();

            const isActiveA = dateA >= today && statusA !== 'cancelled' && statusA !== 'rescheduled';
            const isActiveB = dateB >= today && statusB !== 'cancelled' && statusB !== 'rescheduled';

            if (isActiveA && !isActiveB) return -1;
            if (!isActiveA && isActiveB) return 1;

            if (isActiveA && isActiveB) {
                return dateA - dateB;
            }

            return dateB - dateA;
        });
    }, [offers, searchQuery, activeFilter]);

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
            <CustomIcon library="Feather" name="plus" size={16} color={Colors.WHITE} />
            <CustomText style={styles.headerAddText}>New</CustomText>
        </TouchableOpacity>
    );

    const getOfferStatusDetails = (offer) => {
        const status = (offer.status || '').toLowerCase();
        const offerDate = safeParseDateString(offer.date || offer.hikeDate);
        offerDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (status === 'cancelled') return { label: 'Cancelled', color: Colors.ERROR, bg: Colors.ERROR_BG };
        if (status === 'rescheduled') return { label: 'Rescheduled', color: Colors.WARNING, bg: Colors.STATUS_WARNING_BG };
        if (offerDate < today) return { label: 'Expired', color: Colors.TEXT_SECONDARY, bg: Colors.GRAY_ULTRALIGHT };
        return { label: 'Active', color: Colors.SUCCESS, bg: Colors.STATUS_APPROVED_BG };
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
                            <ActivityIndicator size="large" color={Colors.PRIMARY} />
                        </View>
                    )}

                    {!isLoading && offers?.length === 0 && (
                        <View style={styles.emptyState}>
                            <CustomIcon library="Feather" name="inbox" size={48} color={Colors.GRAY_MEDIUM} />
                            <CustomText variant="h3" style={styles.emptyTitle}>No Offers Yet</CustomText>
                            <CustomText variant="body" style={styles.emptySubtitle}>
                                Create your first hiking package to start receiving bookings.
                            </CustomText>
                        </View>
                    )}

                    {!isLoading && offers?.length > 0 && filteredAndSortedOffers.length === 0 && (
                        <View style={styles.emptyState}>
                            <CustomIcon library="Feather" name="search" size={48} color={Colors.GRAY_MEDIUM} />
                            <CustomText variant="h3" style={styles.emptyTitle}>No Results</CustomText>
                            <CustomText variant="body" style={styles.emptySubtitle}>
                                No offers matched your search or filters.
                            </CustomText>
                        </View>
                    )}

                    {!isLoading && filteredAndSortedOffers.length > 0 && (
                        <View style={styles.listContainer}>
                            {filteredAndSortedOffers.map(offer => {
                                const statusDetails = getOfferStatusDetails(offer);
                                
                                return (
                                    <View key={offer.id} style={styles.offerCard}>
                                        
                                        <View style={styles.cardHeader}>
                                            <View style={styles.trailInfo}>
                                                <View style={styles.labelRow}>
                                                    <CustomText variant="label" style={styles.trailLabel}>TRAIL</CustomText>
                                                    
                                                    {statusDetails.label !== 'Active' && (
                                                        <View style={[styles.statusBadge, { backgroundColor: statusDetails.bg }]}>
                                                            <CustomText style={[styles.statusBadgeText, { color: statusDetails.color }]}>
                                                                {statusDetails.label}
                                                            </CustomText>
                                                        </View>
                                                    )}
                                                </View>
                                                <CustomText variant="h3" style={styles.trailName} numberOfLines={1}>
                                                    {offer.trail?.name || "Unknown Trail"}
                                                </CustomText>
                                            </View>
                                            <View style={styles.priceInfo}>
                                                <CustomText variant="title" style={styles.priceText}>
                                                    ₱{offer.price}
                                                </CustomText>
                                                <CustomText variant="caption" style={styles.perPax}>/ person</CustomText>
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.detailsGrid}>
                                            <View style={styles.detailRow}>
                                                <CustomIcon library="Feather" name="calendar" size={14} color={Colors.TEXT_SECONDARY} />
                                                <CustomText variant="caption" style={[
                                                    styles.detailText, 
                                                    statusDetails.label === 'Expired' && { textDecorationLine: 'line-through', color: Colors.ERROR }
                                                ]}>
                                                    {formatDateToStandard(offer.date || offer.hikeDate)}
                                                </CustomText>
                                            </View>
                                            
                                            <View style={styles.detailRow}>
                                                <CustomIcon library="Feather" name="clock" size={14} color={Colors.TEXT_SECONDARY} />
                                                <CustomText variant="caption" style={styles.detailText}>
                                                    {offer.duration || offer.hikeDuration || "1 Day"}
                                                </CustomText>
                                            </View>

                                            <View style={styles.detailRow}>
                                                <CustomIcon library="Feather" name="users" size={14} color={Colors.TEXT_SECONDARY} />
                                                <CustomText variant="caption" style={styles.detailText}>
                                                    {offer.minPax} - {offer.maxPax} Pax
                                                </CustomText>
                                            </View>
                                        </View>

                                        <CustomText variant="caption" style={styles.description} numberOfLines={2}>
                                            {offer.description}
                                        </CustomText>

                                        <CustomButton 
                                            title="Manage Bookings"
                                            onPress={() => onViewOfferBookings(offer.id)}
                                            variant="primary"
                                            style={styles.viewBookingsButton}
                                        />

                                        <CustomButton 
                                            title="Edit Offer"
                                            onPress={() => handleEditPress(offer.id)}
                                            variant="outline"
                                            style={styles.editButton}
                                        />
                                    </View>
                                );
                            })}
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
        paddingBottom: 40,
    },

    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center',
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
        gap: 4,
    },
    headerAddText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
    },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        color: Colors.TEXT_PRIMARY,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    listContainer: {
        gap: 16,
    },
    offerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    trailInfo: {
        flex: 1,
        paddingRight: 12,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    trailLabel: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 2,
    },
    trailName: {
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
    },
    priceInfo: {
        alignItems: 'flex-end',
        gap: 0
    },
    priceText: {
        color: Colors.PRIMARY,
        fontSize: 20,
    },
    perPax: {
        color: Colors.TEXT_SECONDARY,
        marginTop: -4,
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    detailText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
        marginBottom: 16,
    },
    viewBookingsButton: {
        paddingVertical: 10,
        marginBottom: 8,
    },
    editButton: {
        paddingVertical: 10,
    },
});

export default OfferListScreen;