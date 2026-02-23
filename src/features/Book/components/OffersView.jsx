import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const OffersView = ({ offers = [], selectedOfferId, onContinue }) => {
    
    const uniqueDates = useMemo(() => {
        const dates = offers
            .map(offer => offer.date)
            .filter(Boolean);
            
        return [...new Set(dates)];
    }, [offers]);

    const [selectedDate, setSelectedDate] = useState(
        uniqueDates.length > 0 ? uniqueDates[0] : null
    );
    
    const [localSelectedId, setLocalSelectedId] = useState(selectedOfferId);
    
    const [expandedId, setExpandedId] = useState(null);

    const filteredOffers = useMemo(() => {
        if (!selectedDate) {
            return [];
        }
        return offers.filter(offer => offer.date === selectedDate);
    }, [offers, selectedDate]);

    const toggleExpand = (id) => {
        setExpandedId(prevId => prevId === id ? null : id);
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                {uniqueDates.length > 0 && (
                    <View style={styles.calendarSection}>
                        <CustomText variant="h2" style={styles.sectionTitle}>
                            Select Date
                        </CustomText>
                        
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.dateScroll}
                        >
                            {uniqueDates.map((date, index) => {
                                const isSelected = selectedDate === date;
                                
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[
                                            styles.dateChip, 
                                            isSelected ? styles.activeDateChip : styles.inactiveDateChip
                                        ]}
                                        onPress={() => {
                                            setSelectedDate(date);
                                            setLocalSelectedId(null); 
                                            setExpandedId(null); 
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <CustomText 
                                            style={isSelected ? styles.activeDateText : styles.inactiveDateText}
                                        >
                                            {date}
                                        </CustomText>
                                        
                                        <View 
                                            style={[
                                                styles.dot, 
                                                isSelected ? styles.activeDot : styles.inactiveDot
                                            ]} 
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.offersSection}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Select Offer
                    </CustomText>
                    
                    {filteredOffers.length > 0 ? (
                        filteredOffers.map((offer) => (
                            <OfferCardItem 
                                key={offer.id}
                                offer={offer}
                                isSelected={localSelectedId === offer.id}
                                isExpanded={expandedId === offer.id}
                                onSelect={() => setLocalSelectedId(offer.id)}
                                onToggleExpand={() => toggleExpand(offer.id)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                                No offers available for this date.
                            </CustomText>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <CustomButton 
                    title="Continue" 
                    onPress={() => localSelectedId && onContinue(localSelectedId)}
                    style={!localSelectedId ? styles.disabledButton : undefined}
                />
            </View>
        </View>
    );
};

const OfferCardItem = ({ offer, isSelected, isExpanded, onSelect, onToggleExpand }) => {
    return (
        <TouchableOpacity 
            activeOpacity={0.8}
            style={[
                styles.offerCard, 
                isSelected && styles.selectedOfferCard
            ]}
            onPress={onSelect}
        >
            <View style={styles.cardHeader}>
                <View style={styles.guideAvatar}>
                    <CustomIcon 
                        library="FontAwesome5" 
                        name="user-circle" 
                        size={24} 
                        color={Colors.WHITE} 
                    />
                </View>
                
                <View style={styles.guideInfo}>
                    <CustomText variant="label" style={styles.guideName}>
                        {offer.business?.name || "Independent Guide"}
                    </CustomText>
                    
                    <View style={styles.ratingRow}>
                        <CustomIcon 
                            library="AntDesign" 
                            name="star" 
                            size={12} 
                            color={Colors.YELLOW} 
                        />
                        <CustomText variant="caption">
                            4.9 (60 reviews)
                        </CustomText>
                    </View>
                </View>

                <View style={styles.priceInfo}>
                    <CustomText variant="title" style={styles.priceText}>
                        ₱{offer.price}
                    </CustomText>
                    <CustomText variant="caption" style={styles.perPerson}>
                        / Per Person
                    </CustomText>
                </View>
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    
                    {offer.description && (
                        <View style={styles.detailBlock}>
                            <CustomText variant="label" style={styles.detailLabel}>
                                About
                            </CustomText>
                            <CustomText variant="caption" style={styles.detailText}>
                                {offer.description}
                            </CustomText>
                        </View>
                    )}

                    {offer.inclusions && offer.inclusions.length > 0 && (
                        <View style={styles.detailBlock}>
                            <CustomText variant="label" style={styles.detailLabel}>
                                Inclusions
                            </CustomText>
                            {offer.inclusions.map((item, idx) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.bulletPoint} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    )}

                    {offer.documents && offer.documents.length > 0 && (
                        <View style={styles.detailBlock}>
                            <CustomText variant="label" style={styles.detailLabel}>
                                Requirements
                            </CustomText>
                            {offer.documents.map((item, idx) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.bulletPoint} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity 
                style={styles.chevronContainer}
                onPress={onToggleExpand}
                activeOpacity={0.6}
            >
                <CustomIcon 
                    library="Feather" 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.GRAY_MEDIUM} 
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 16,
    },
    scrollContent: {
        paddingBottom: 80, 
    },
    sectionTitle: {
        paddingTop: 16,
        paddingHorizontal: 0,
        marginBottom: 16,
    },
    
    calendarSection: {
        paddingTop: 0,
        marginBottom: 0,
    },
    dateScroll: {
        paddingHorizontal: 0,
        gap: 8,
    },
    dateChip: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    activeDateChip: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    inactiveDateChip: {
        backgroundColor: Colors.WHITE,
        borderColor: Colors.GRAY_LIGHT,
    },
    activeDateText: {
        fontWeight: '600',
        color: Colors.WHITE,
    },
    inactiveDateText: {
        fontWeight: '500',
        color: Colors.TEXT_PRIMARY,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeDot: {
        backgroundColor: Colors.WHITE,
    },
    inactiveDot: {
        backgroundColor: Colors.PRIMARY,
    },
    
    offersSection: {
        paddingHorizontal: 0,
    },
    offerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        paddingBottom: 4, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,

        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,

        elevation: 2,
    },
    selectedOfferCard: {
        borderColor: Colors.PRIMARY,
        borderWidth: 2,
        backgroundColor: Colors.BACKGROUND,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guideAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    guideInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    guideName: {
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceInfo: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    priceText: {
        fontSize: 20,
        color: Colors.PRIMARY,
        marginBottom: 2,
    },
    perPerson: {
        fontSize: 11,
    },
    
    expandedContent: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    detailBlock: {
        marginBottom: 12,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    detailText: {
        color: Colors.TEXT_SECONDARY,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        paddingLeft: 8,
    },
    bulletPoint: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
        marginRight: 8,
    },
    bulletText: {
        color: Colors.TEXT_SECONDARY,
        flex: 1,
    },
    chevronContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    emptyState: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: Colors.WHITE,

        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,

        elevation: 10, 
    },
    disabledButton: {
        opacity: 0.5,
    }
});

export default OffersView;