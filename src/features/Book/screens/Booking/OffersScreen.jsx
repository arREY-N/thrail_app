import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import OfferCalendar from '@/src/features/Book/components/OfferCalendar';
import OfferCard from '@/src/features/Book/components/OfferCard';
import StickyFooter from '@/src/features/Book/components/StickyFooter';

import { Colors } from '@/src/constants/colors';

const formatDateToStandard = (dateObj) => {
    if (!dateObj) return '';

    let d;
    if (typeof dateObj.toDate === 'function') {
        d = dateObj.toDate();
    } else if (dateObj instanceof Date) {
        d = dateObj;
    } else if (dateObj.seconds) {
        d = new Date(dateObj.seconds * 1000);
    } else {
        d = new Date(dateObj);
    }

    if (isNaN(d.getTime())) return 'Invalid Date';

    const shortMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const getTodayString = () => {
    return formatDateToStandard(new Date());
};

const OffersScreen = ({ offers = [], selectedOfferId, onContinue }) => {
    const [selectedDate, setSelectedDate] = useState(getTodayString());
    const [localSelectedId, setLocalSelectedId] = useState(selectedOfferId);

    const safeOffers = useMemo(() => {
        return Array.isArray(offers) ? offers : [];
    }, [offers]);

    const uniqueDates = useMemo(() => {
        const dates = safeOffers
            .map((offer) => formatDateToStandard(offer?.date))
            .filter(Boolean);

        return [...new Set(dates)];
    }, [safeOffers]);

    const filteredOffers = useMemo(() => {
        if (!selectedDate) return [];
        return safeOffers.filter(
            (offer) => formatDateToStandard(offer?.date) === selectedDate
        );
    }, [safeOffers, selectedDate]);

    const isSelectedDatePast = useMemo(() => {
        if (!selectedDate) return false;
        
        const selected = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return selected < today;
    }, [selectedDate]);

    useEffect(() => {
        if (selectedOfferId) {
            setLocalSelectedId(selectedOfferId);

            const preSelectedOffer = safeOffers.find(
                (o) => o.id === selectedOfferId
            );
            
            if (preSelectedOffer && preSelectedOffer.date) {
                setSelectedDate(formatDateToStandard(preSelectedOffer.date));
            }
        } else {
            setLocalSelectedId(null);
            setSelectedDate(getTodayString());
        }
    }, [selectedOfferId, safeOffers]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setLocalSelectedId(null);
    };

    const handleOfferSelect = (offerId) => {
        if (localSelectedId === offerId) {
            setLocalSelectedId(null);
        } else {
            setLocalSelectedId(offerId);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.calendarSectionWrapper}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Select Date
                    </CustomText>

                    <OfferCalendar
                        uniqueDates={uniqueDates}
                        selectedDate={selectedDate}
                        onSelectDate={handleDateSelect}
                    />
                </View>

                <View style={styles.offersSection}>
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
                            <CustomText
                                variant="caption"
                                color={Colors.TEXT_SECONDARY}
                            >
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
        paddingTop: 16,
        paddingBottom: 16,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    calendarSectionWrapper: {
        marginBottom: 8,
    },
    sectionTitle: {
        paddingTop: 0,
        paddingHorizontal: 0,
        marginBottom: 16,
        fontWeight: 'bold',
    },
    offersSection: {
        paddingHorizontal: 0,
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
});

export default OffersScreen;