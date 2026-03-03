import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const OfferCalendar = ({ 
    uniqueDates, 
    selectedDate, 
    onSelectDate 
}) => {
    
    const initialViewDate = useMemo(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1); 
    }, []);

    const [viewDate, setViewDate] = useState(initialViewDate);

    const displayYear = viewDate.getFullYear();
    const displayMonth = viewDate.getMonth(); 
    
    const monthNames = [
        "January", "February", "March", "April", 
        "May", "June", "July", "August", 
        "September", "October", "November", "December"
    ];
    const monthName = monthNames[displayMonth];

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const currentDay = todayDate.getDate();
    const currentMonth = todayDate.getMonth();
    const currentYear = todayDate.getFullYear();

    const handlePrevMonth = () => {
        setViewDate(new Date(displayYear, displayMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(displayYear, displayMonth + 1, 1));
    };

    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
        const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
        
        const days = [];
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [displayYear, displayMonth]);

    const formatToMatchData = (year, month, day) => {
        const shortMonths = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        return `${shortMonths[month]} ${day}, ${year}`;
    };

    return (
        <View style={styles.calendarContainer}>
            
            <View style={styles.calendarHeader}>
                <TouchableOpacity 
                    onPress={handlePrevMonth} 
                    style={styles.navButton}
                    activeOpacity={0.7}
                >
                    <CustomIcon 
                        library="Feather" 
                        name="chevron-left" 
                        size={24} 
                        color={Colors.TEXT_PRIMARY} 
                    />
                </TouchableOpacity>

                <CustomText 
                    variant="h2" 
                    style={styles.monthTitle}
                >
                    {monthName} {displayYear}
                </CustomText>

                <TouchableOpacity 
                    onPress={handleNextMonth} 
                    style={styles.navButton}
                    activeOpacity={0.7}
                >
                    <CustomIcon 
                        library="Feather" 
                        name="chevron-right" 
                        size={24} 
                        color={Colors.TEXT_PRIMARY} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.daysOfWeekRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, idx) => (
                    <CustomText 
                        key={idx} 
                        variant="caption" 
                        style={styles.dayOfWeekText}
                    >
                        {day}
                    </CustomText>
                ))}
            </View>

            <View style={styles.grid}>
                {calendarDays.map((dayNum, index) => {
                    
                    const fullDateString = dayNum ? formatToMatchData(displayYear, displayMonth, dayNum) : null;
                    const cellDate = dayNum ? new Date(displayYear, displayMonth, dayNum) : null;
                    
                    const isAvailable = fullDateString ? uniqueDates.includes(fullDateString) : false;
                    const isSelected = selectedDate === fullDateString;
                    const isToday = dayNum === currentDay && displayMonth === currentMonth && displayYear === currentYear;
                    
                    const isPast = cellDate ? cellDate < todayDate : false;
                    
                    const isExpiredOffer = isAvailable && isPast;
                    const isActiveOffer = isAvailable && !isPast;

                    return (
                        <View 
                            key={index} 
                            style={styles.cellContainer}
                        >
                            {dayNum ? (
                                <TouchableOpacity
                                    style={[
                                        styles.dayCircle,
                                        isToday && !isSelected && !isActiveOffer && styles.todayDay, 
                                        isActiveOffer && !isSelected && styles.availableDay, 
                                        isExpiredOffer && !isSelected && styles.expiredDay,
                                        isSelected && styles.selectedDay,
                                        isSelected && isPast && styles.selectedExpiredDay
                                    ]}
                                    onPress={() => onSelectDate(fullDateString)}
                                    activeOpacity={0.7}
                                >
                                    <CustomText 
                                        variant="body"
                                        style={[
                                            styles.dayText,
                                            isToday && !isSelected && !isActiveOffer && styles.todayDayText,
                                            isActiveOffer && !isSelected && styles.availableDayText, 
                                            isExpiredOffer && !isSelected && styles.expiredDayText,
                                            isSelected && styles.selectedDayText,
                                            isSelected && isPast && styles.selectedExpiredDayText
                                        ]}
                                    >
                                        {dayNum}
                                    </CustomText>
                                    
                                    {isActiveOffer && !isSelected && (
                                        <View style={styles.indicatorDot} />
                                    )}
                                    
                                    {isExpiredOffer && !isSelected && (
                                        <View style={[styles.indicatorDot, styles.expiredIndicatorDot]} />
                                    )}
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    monthTitle: {
        marginBottom: 0,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    navButton: {
        padding: 8, 
    },
    
    daysOfWeekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    dayOfWeekText: {
        width: 32, 
        textAlign: 'center',
        fontWeight: '600',
    },
    
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cellContainer: {
        width: '14.28%', 
        aspectRatio: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    dayCircle: {
        width: 36, 
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    dayText: {
        color: Colors.TEXT_PRIMARY, 
    },
    
    todayDay: {
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.BACKGROUND,
    },
    todayDayText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    availableDay: {
        backgroundColor: Colors.PRIMARY, 
    },
    availableDayText: {
        color: Colors.WHITE, 
        fontWeight: 'bold',
    },
    expiredDay: {
        backgroundColor: 'transparent', 
    },
    expiredDayText: {
        color: Colors.TEXT_SECONDARY, 
    },
    selectedDay: {
        backgroundColor: Colors.WHITE,
        borderWidth: 2,
        borderColor: Colors.PRIMARY,
    },
    selectedDayText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    selectedExpiredDay: {
        backgroundColor: Colors.WHITE,
        borderWidth: 2,
        borderColor: Colors.GRAY_MEDIUM,
    },
    selectedExpiredDayText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    indicatorDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.WHITE,
        position: 'absolute',
        bottom: 4, 
    },
    expiredIndicatorDot: {
        backgroundColor: Colors.GRAY_MEDIUM,
    }
});

export default OfferCalendar;