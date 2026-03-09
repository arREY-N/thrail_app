import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const formatDateToStandard = (dateObj) => {
    if (!dateObj) return "";
    
    const shortMonths = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    return `${shortMonths[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
};

const OfferCalendar = ({ 
    uniqueDates = [], 
    selectedDate, 
    onSelectDate 
}) => {
    
    const [isExpanded, setIsExpanded] = useState(false);
    
    const [displayMonth, setDisplayMonth] = useState(() => {
        return selectedDate 
            ? new Date(selectedDate) 
            : new Date();
    });

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    
    const weekDays = [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ];

    const normalizedToday = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const todayFormatted = useMemo(() => formatDateToStandard(normalizedToday), [normalizedToday]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setDisplayMonth(new Date(
            displayMonth.getFullYear(), 
            displayMonth.getMonth() - 1, 
            1
        ));
    };

    const handleNextMonth = () => {
        setDisplayMonth(new Date(
            displayMonth.getFullYear(), 
            displayMonth.getMonth() + 1, 
            1
        ));
    };

    const handleDayPress = (dateObj, isPast) => {
        if (isPast) return;
        
        const formatted = formatDateToStandard(dateObj);
        onSelectDate(formatted);
    };

    const calendarMatrix = useMemo(() => {
        const year = displayMonth.getFullYear();
        const month = displayMonth.getMonth();
        
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        let matrix = [];
        let currentWeek = [];

        for (let i = 0; i < firstDay; i++) {
            currentWeek.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            currentWeek.push(new Date(year, month, i));
            
            if (currentWeek.length === 7) {
                matrix.push(currentWeek);
                currentWeek = [];
            }
        }

        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            matrix.push(currentWeek);
        }

        return matrix;
    }, [displayMonth]);

    return (
        <View style={styles.container}>
            
            <TouchableOpacity 
                style={[
                    styles.dropdownButton, 
                    isExpanded && styles.dropdownActive
                ]} 
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.8}
            >
                <CustomText variant="body" style={styles.dropdownText}>
                    {selectedDate || 'Select a Date'}
                </CustomText>
                
                <CustomIcon 
                    library="Ionicons" 
                    name="calendar-outline" 
                    size={20} 
                    color={Colors.TEXT_SECONDARY} 
                />
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.calendarCard}>
                    
                    <View style={styles.headerRow}>
                        <CustomText variant="subtitle" style={styles.monthTitle}>
                            {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                        </CustomText>
                        
                        <View style={styles.controlsWrapper}>
                            <TouchableOpacity 
                                onPress={handlePrevMonth} 
                                style={styles.controlButton}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="chevron-left" 
                                    size={20} 
                                    color={Colors.TEXT_PRIMARY} 
                                />
                            </TouchableOpacity>
                            
                            <View style={styles.controlDivider} />
                            
                            <TouchableOpacity 
                                onPress={handleNextMonth} 
                                style={styles.controlButton}
                            >
                                <CustomIcon 
                                    library="Feather" 
                                    name="chevron-right" 
                                    size={20} 
                                    color={Colors.TEXT_PRIMARY} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, index) => (
                            <CustomText 
                                key={index} 
                                variant="caption" 
                                style={styles.weekDayText}
                            >
                                {day}
                            </CustomText>
                        ))}
                    </View>

                    <View style={styles.grid}>
                        {calendarMatrix.map((week, weekIdx) => (
                            <View 
                                key={`week-${weekIdx}`} 
                                style={styles.weekRow}
                            >
                                {week.map((dateObj, dayIdx) => {
                                    
                                    if (!dateObj) {
                                        return (
                                            <View 
                                                key={`empty-${dayIdx}`} 
                                                style={styles.dayCell} 
                                            />
                                        );
                                    }

                                    const cellDateNormalized = new Date(dateObj);
                                    cellDateNormalized.setHours(0, 0, 0, 0);
                                    const isPast = cellDateNormalized < normalizedToday;

                                    const formattedString = formatDateToStandard(dateObj);
                                    
                                    const isSelected = formattedString === selectedDate;
                                    const isToday = formattedString === todayFormatted;
                                    const hasOffer = uniqueDates.includes(formattedString);

                                    return (
                                        <TouchableOpacity 
                                            key={formattedString}
                                            style={[
                                                styles.dayCell, 
                                                isSelected && styles.dayCellSelected,
                                                isPast && styles.dayCellPast
                                            ]}
                                            onPress={() => handleDayPress(dateObj, isPast)}
                                            activeOpacity={isPast ? 1 : 0.7}
                                        >
                                            <CustomText 
                                                variant="body" 
                                                style={[
                                                    styles.dayText,
                                                    isToday && !isSelected && styles.dayTextToday,
                                                    isSelected && styles.dayTextSelected,
                                                    !hasOffer && !isSelected && !isToday && styles.dayTextMuted,
                                                    isPast && styles.dayTextPast
                                                ]}
                                            >
                                                {dateObj.getDate()}
                                            </CustomText>

                                            {hasOffer && !isSelected && (
                                                <View style={[
                                                    styles.offerDot,
                                                    isPast && styles.offerDotPast
                                                ]} />
                                            )}
                                            
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dropdownActive: {
        borderColor: Colors.PRIMARY,
    },
    dropdownText: {
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    calendarCard: {
        marginTop: 8,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    monthTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    controlsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    controlButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    controlDivider: {
        width: 1,
        height: 16,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        width: 36,
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
        fontSize: 12,
    },
    grid: {
        flexDirection: 'column',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    
    dayCell: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        position: 'relative',
    },
    dayCellSelected: {
        backgroundColor: Colors.PRIMARY,
    },
    dayCellPast: {
        opacity: 0.4,
    },
    
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    dayTextSelected: {
        color: Colors.WHITE,
    },
    dayTextToday: {
        color: Colors.PRIMARY,
        fontWeight: '900',
    },
    dayTextMuted: {
        color: Colors.GRAY_MEDIUM,
        fontWeight: '400',
    },
    dayTextPast: {
        color: Colors.TEXT_SECONDARY,
    },
    
    offerDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
    },
    offerDotPast: {
        backgroundColor: Colors.GRAY_MEDIUM,
    }
});

export default OfferCalendar;