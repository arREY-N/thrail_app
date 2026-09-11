/**
 * @file OfferCalendar.tsx
 * @description Unified accordion calendar card for exploring and selecting available hike dates,
 * with directional month navigation counters (< 1 and 3 >), future date indicators, and full-width expand/collapse action.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { 
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { formatDateToStandard, safeParseDateString } from '@/src/utils/dateFormatter';

export interface OfferCalendarProps {
    uniqueDates?: string[];
    selectedDate?: string | null;
    onSelectDate: (date: string) => void;
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
] as const;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const getDaysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number): number => new Date(year, month, 1).getDay();

/**
 * OfferCalendar — Harmonious card component for picking hike dates.
 * Combines selected date summary, subtle availability indicator, directional month navigation with counters,
 * and standard full-width expand/collapse button.
 *
 * @param {OfferCalendarProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const OfferCalendar: React.FC<OfferCalendarProps> = ({ 
    uniqueDates = [], 
    selectedDate, 
    onSelectDate 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const [monthOffset, setMonthOffset] = useState(0);
    const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate);

    if (selectedDate !== prevSelectedDate) {
        setPrevSelectedDate(selectedDate);
        setMonthOffset(0);
    }

    const baseMonth = useMemo(() => {
        const initialDate = safeParseDateString(selectedDate);
        return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    }, [selectedDate]);

    const displayMonth = useMemo(() => {
        return new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthOffset, 1);
    }, [baseMonth, monthOffset]);

    const normalizedToday = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const todayFormatted = useMemo(() => formatDateToStandard(normalizedToday), [normalizedToday]);

    // Total upcoming available offers (today and future)
    const futureOfferDates = useMemo(() => {
        return uniqueDates.filter((dateStr) => {
            const parsed = safeParseDateString(dateStr);
            parsed.setHours(0, 0, 0, 0);
            return parsed >= normalizedToday;
        });
    }, [uniqueDates, normalizedToday]);

    const totalFutureDates = futureOfferDates.length;

    // Month Navigation bounds
    const currentViewYear = displayMonth.getFullYear();
    const currentViewMonth = displayMonth.getMonth();

    const startOfCurrentViewMonth = useMemo(() => {
        return new Date(currentViewYear, currentViewMonth, 1);
    }, [currentViewYear, currentViewMonth]);

    const startOfNextViewMonth = useMemo(() => {
        return new Date(currentViewYear, currentViewMonth + 1, 1);
    }, [currentViewYear, currentViewMonth]);

    const startOfActualCurrentMonth = useMemo(() => {
        return new Date(normalizedToday.getFullYear(), normalizedToday.getMonth(), 1);
    }, [normalizedToday]);

    // Prevent navigating into past months before today's month
    const canGoPrev = startOfCurrentViewMonth > startOfActualCurrentMonth;

    // Unique dates with offers in previous months (between today and start of current view month)
    const prevDatesCount = useMemo(() => {
        if (!canGoPrev) return 0;
        return futureOfferDates.filter((dateStr) => {
            const parsed = safeParseDateString(dateStr);
            return parsed >= normalizedToday && parsed < startOfCurrentViewMonth;
        }).length;
    }, [canGoPrev, futureOfferDates, normalizedToday, startOfCurrentViewMonth]);

    // Unique dates with offers in future months (strictly on or after next view month)
    const nextDatesCount = useMemo(() => {
        return futureOfferDates.filter((dateStr) => {
            const parsed = safeParseDateString(dateStr);
            return parsed >= startOfNextViewMonth;
        }).length;
    }, [futureOfferDates, startOfNextViewMonth]);

    const handlePrevMonth = useCallback(() => {
        if (!canGoPrev) return;
        setMonthOffset((prev) => prev - 1);
    }, [canGoPrev]);

    const handleNextMonth = useCallback(() => {
        setMonthOffset((prev) => prev + 1);
    }, []);

    const handleDayPress = useCallback((dateObj: Date, isPast: boolean) => {
        if (isPast) return;
        const formatted = formatDateToStandard(dateObj);
        onSelectDate(formatted);
    }, [onSelectDate]);

    const calendarMatrix = useMemo(() => {
        const year = displayMonth.getFullYear();
        const month = displayMonth.getMonth();
        
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const matrix: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

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
        <View style={styles.cardContainer}>
            {/* 1. TOP INFORMATION ROW */}
            <View style={styles.topInfoRow}>
                <View style={styles.dateInfoLeft}>
                    <View style={styles.calendarIconCircle}>
                        <CustomIcon library="Feather" name="calendar" size={16} color={Colors.PRIMARY} />
                    </View>
                    <View style={styles.dateTextGroup}>
                        <CustomText variant="label" style={styles.dateLabel}>
                            SELECTED DATE
                        </CustomText>
                        <CustomText variant="body" style={styles.selectedDateText}>
                            {selectedDate || 'Select a Date'}
                        </CustomText>
                    </View>
                </View>

                <View style={[
                    styles.statusBadge, 
                    totalFutureDates > 0 ? styles.statusBadgeSuccess : styles.statusBadgeMuted
                ]}>
                    <View style={[
                        styles.badgeDot, 
                        totalFutureDates > 0 ? styles.badgeDotSuccess : styles.badgeDotMuted
                    ]} />
                    <CustomText style={[
                        styles.statusBadgeText, 
                        totalFutureDates > 0 ? styles.statusBadgeTextSuccess : styles.statusBadgeTextMuted
                    ]}>
                        {totalFutureDates > 0 
                            ? `${totalFutureDates} ${totalFutureDates === 1 ? 'Date' : 'Dates'} Available` 
                            : 'No Dates Available'
                        }
                    </CustomText>
                </View>
            </View>

            {/* 2. MIDDLE CALENDAR GRID (When expanded) */}
            {isExpanded && (
                <View style={styles.expandedSection}>
                    <View style={styles.horizontalDivider} />

                    {/* Symmetrical Month Header with Directional Counters (< 1 and 2 >) */}
                    <View style={styles.monthHeaderRow}>
                        <TouchableOpacity 
                            onPress={handlePrevMonth} 
                            disabled={!canGoPrev}
                            style={[
                                styles.navButton, 
                                !canGoPrev && styles.navButtonDisabled,
                                prevDatesCount > 0 && canGoPrev && styles.navButtonWithCount
                            ]}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="chevron-left" 
                                size={16} 
                                color={canGoPrev ? (prevDatesCount > 0 ? Colors.PRIMARY : Colors.TEXT_PRIMARY) : Colors.GRAY_MEDIUM} 
                            />
                            {prevDatesCount > 0 && canGoPrev ? (
                                <CustomText style={styles.navCountText}>{prevDatesCount}</CustomText>
                            ) : null}
                        </TouchableOpacity>

                        <CustomText variant="subtitle" style={styles.monthTitle}>
                            {MONTH_NAMES[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                        </CustomText>

                        <TouchableOpacity 
                            onPress={handleNextMonth} 
                            style={[
                                styles.navButton,
                                nextDatesCount > 0 && styles.navButtonWithCount
                            ]}
                            activeOpacity={0.7}
                        >
                            {nextDatesCount > 0 ? (
                                <CustomText style={styles.navCountText}>{nextDatesCount}</CustomText>
                            ) : null}
                            <CustomIcon 
                                library="Feather" 
                                name="chevron-right" 
                                size={16} 
                                color={nextDatesCount > 0 ? Colors.PRIMARY : Colors.TEXT_PRIMARY} 
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Weekday Row */}
                    <View style={styles.weekDaysRow}>
                        {WEEK_DAYS.map((day, index) => (
                            <CustomText key={index} variant="caption" style={styles.weekDayText}>
                                {day}
                            </CustomText>
                        ))}
                    </View>

                    {/* Day Matrix Grid */}
                    <View style={styles.grid}>
                        {calendarMatrix.map((week, weekIdx) => (
                            <View key={`week-${weekIdx}`} style={styles.weekRow}>
                                {week.map((dateObj, dayIdx) => {
                                    if (!dateObj) {
                                        return <View key={`empty-${dayIdx}`} style={styles.dayCell} />;
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

                                            {hasOffer && !isSelected && !isPast && (
                                                <View style={styles.offerDot} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* 3. BOTTOM FULL-WIDTH EXPAND / COLLAPSE BUTTON */}
            <TouchableOpacity 
                style={[styles.expandButton, { marginTop: isExpanded ? 10 : 14 }]} 
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <CustomText style={styles.expandButtonText}>
                    {isExpanded ? "Hide Calendar" : "Show Calendar"}
                </CustomText>
                <CustomIcon 
                    library="Feather" 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={Colors.PRIMARY} 
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 20,
        ...GlobalStyles.dropShadow(3),
    },

    // 1. Top Info Row
    topInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    calendarIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateTextGroup: {
        flexDirection: 'column',
    },
    dateLabel: {
        color: Colors.PRIMARY,
        letterSpacing: 0.8,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    selectedDateText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
    },

    // Status Badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        gap: 5,
    },
    statusBadgeSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    statusBadgeMuted: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    badgeDotSuccess: {
        backgroundColor: Colors.SUCCESS,
    },
    badgeDotMuted: {
        backgroundColor: Colors.GRAY_MEDIUM,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    statusBadgeTextSuccess: {
        color: Colors.STATUS_APPROVED_TEXT,
    },
    statusBadgeTextMuted: {
        color: Colors.TEXT_SECONDARY,
    },

    // Dividers
    horizontalDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginTop: 16,
        marginBottom: 16,
    },

    // 2. Middle Expanded Section
    expandedSection: {
        width: '100%',
    },
    monthHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    monthTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
    },
    navButton: {
        minWidth: 36,
        height: 36,
        paddingHorizontal: 8,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 4,
    },
    navButtonWithCount: {
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        paddingHorizontal: 10,
    },
    navButtonDisabled: {
        opacity: 0.35,
        backgroundColor: Colors.WHITE,
    },
    navCountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
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
        fontWeight: '600',
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
        opacity: 0.35,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    dayTextSelected: {
        color: Colors.WHITE,
        fontWeight: 'bold',
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
        bottom: 3,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
    },

    // 3. Full-width Expand/Collapse Action
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 6,
        width: '100%',
    },
    expandButtonText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
});

export default React.memo(OfferCalendar);