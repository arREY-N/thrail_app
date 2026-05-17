import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import OfferCalendar from '@/src/features/Book/components/OfferCalendar';
import OfferCard from '@/src/features/Book/components/OfferCard';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { formatDateToStandard, safeParseDateString } from '@/src/utils/dateFormatter';

const OffersScreen = ({ offers = [], selectedOfferId, onContinue }) => {
    const [selectedDate, setSelectedDate] = useState(() => formatDateToStandard(new Date()));
    const [localSelectedId, setLocalSelectedId] = useState(selectedOfferId);

    const safeOffers = useMemo(() => Array.isArray(offers) ? offers : [], [offers]);

    const uniqueDates = useMemo(() => {
        const dates = safeOffers
            .map((offer) => formatDateToStandard(offer?.date))
            .filter(Boolean);
        return [...new Set(dates)];
    }, [safeOffers]);

    const filteredOffers = useMemo(() => {
        if (!selectedDate) return [];
        return safeOffers.filter((offer) => formatDateToStandard(offer?.date) === selectedDate);
    }, [safeOffers, selectedDate]);

    const isSelectedDatePast = useMemo(() => {
        if (!selectedDate) return false;
        const selected = safeParseDateString(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected < today;
    }, [selectedDate]);

    useEffect(() => {
        if (selectedOfferId) {
            setLocalSelectedId(selectedOfferId);
            const preSelectedOffer = safeOffers.find((o) => o.id === selectedOfferId);
            if (preSelectedOffer && preSelectedOffer.date) {
                setSelectedDate(formatDateToStandard(preSelectedOffer.date));
            }
        } else {
            setLocalSelectedId(null);
            setSelectedDate(formatDateToStandard(new Date()));
        }
    }, [selectedOfferId, safeOffers]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setLocalSelectedId(null);
    };

    const handleOfferSelect = (offerId) => {
        setLocalSelectedId(localSelectedId === offerId ? null : offerId);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>

                    <View style={styles.calendarContainer}>
                        <CustomText variant="h2" style={styles.sectionTitle}>
                            Select Date
                        </CustomText>
                        <OfferCalendar
                            uniqueDates={uniqueDates}
                            selectedDate={selectedDate}
                            onSelectDate={handleDateSelect}
                        />
                    </View>

                    <View style={styles.offersContainer}>
                        <CustomText variant="h2" style={styles.sectionTitle}>
                            Available Offers
                        </CustomText>

                        {filteredOffers.length > 0 ? (
                            filteredOffers.map((offer) => (
                                <OfferCard
                                    key={offer.id}
                                    offer={offer}
                                    isSelected={localSelectedId === offer.id}
                                    isExpired={isSelectedDatePast}
                                    onSelect={() => handleOfferSelect(offer.id)}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="calendar" 
                                    size={32} 
                                    color={Colors.GRAY_LIGHT} 
                                    style={styles.emptyIcon}
                                />
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                                    No offers available for this date.
                                </CustomText>
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: "Continue",
                    onPress: () => onContinue(localSelectedId),
                    disabled: !localSelectedId
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Colors.BACKGROUND, 
        paddingTop: 16 
    },
    scrollContent: { 
        paddingBottom: 100 
    },

    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
    },

    calendarContainer: {
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
        marginBottom: 32,
    },

    offersContainer: {
        width: '100%',
        marginBottom: 32,
    },
    
    sectionTitle: { 
        paddingTop: 0, 
        paddingHorizontal: 0, 
        marginBottom: 16, 
        fontWeight: 'bold' 
    },
    
    emptyState: { 
        paddingVertical: 40, 
        paddingHorizontal: 20,
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    emptyIcon: {
        marginBottom: 12,
    }
});

export default OffersScreen;