import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import OfferCardItem from '@/src/features/Book/components/OfferCardItem';
import StickyFooter from '@/src/features/Book/components/StickyFooter';

import { Colors } from '@/src/constants/colors';

const OffersScreen = ({ offers = [], selectedOfferId, onContinue }) => {
    
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

    useEffect(() => {
        if (selectedOfferId) {
            setLocalSelectedId(selectedOfferId);
            
            const preSelectedOffer = offers.find(o => o.id === selectedOfferId);
            if (preSelectedOffer && preSelectedOffer.date) {
                setSelectedDate(preSelectedOffer.date);
            }
        }
    }, [selectedOfferId, offers]);

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

            <StickyFooter 
                title="Continue" 
                onPress={() => onContinue(localSelectedId)} 
                isDisabled={!localSelectedId}
            />
        </View>
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
    emptyState: {
        paddingVertical: 32,
        alignItems: 'center',
    },
});

export default OffersScreen;