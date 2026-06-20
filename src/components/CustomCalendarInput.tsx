import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

import { formatToMMDDYY, formatToMMDDYYYY, safeParseDateString } from '@/src/utils/dateFormatter';

const WEEKDAYS: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const SHORT_MONTHS: string[] = MONTHS.map(m => m.substring(0, 3));

/**
 * A text input component that integrates a calendar for date selection.
 */
interface CustomCalendarInputProps {
    value?: string | Date | null;
    style?: StyleProp<ViewStyle>;
    onChangeText: (value: Date | string) => void;
    label?: string;
    placeholder?: string;
    showTodayButton?: boolean;
    allowFutureDates?: boolean;
    defaultMode?: 'date' | 'month' | 'year';
    maximumDate?: Date | null;
    dateFormat?: string;
    iconPosition?: 'left' | 'right';
}

const CustomCalendarInput: React.FC<CustomCalendarInputProps> = ({ 
    value,
    style,
    onChangeText, 
    label,
    placeholder = "MM/DD/YYYY", 
    showTodayButton = false, 
    allowFutureDates = false,
    defaultMode = 'date',
    maximumDate,
    dateFormat = 'MM/DD/YYYY',
    iconPosition = 'right'
}) => {

    const [showPicker, setShowPicker] = useState<boolean>(false);
    const [mode, setMode] = useState<'date' | 'month' | 'year'>(defaultMode); 
    
    const [viewDate, setViewDate] = useState<Date>(
        value ? safeParseDateString(value as string) : new Date()
    );

    useEffect(() => {
        if (value) {
            setViewDate(safeParseDateString(value as string));
        }
    }, [value]);

    const effectiveMaxDate: Date | null = maximumDate || (allowFutureDates ? null : new Date());

    const getDisplayDate = (): string => {
        if (!value) return '';
        if (dateFormat === 'MM/DD/YY') {
            return formatToMMDDYY(value as string);
        }
        return formatToMMDDYYYY(value as string);
    };

    const isToday = (day: number): boolean => {
        const today = new Date();
        return day === today.getDate() && 
            viewDate.getMonth() === today.getMonth() && 
            viewDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day: number): boolean => {
        if (!value) return false;
        const d = safeParseDateString(value as string);
        return day === d.getDate() && 
            viewDate.getMonth() === d.getMonth() && 
            viewDate.getFullYear() === d.getFullYear();
    };

    const isPastDate = (day: number): boolean => {
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate < today; 
    };

    const isFutureDate = (day: number): boolean => {
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate > today; 
    };

    const daysInMonth: number = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth: number = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const blanks: (null)[] = Array.from({ length: firstDayOfMonth }, () => null);
    const days: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarGrid: (number | null)[] = [...blanks, ...days];

    const currentYear: number = new Date().getFullYear();
    const topYear: number = effectiveMaxDate ? effectiveMaxDate.getFullYear() : currentYear;
    
    const years: number[] = allowFutureDates && !maximumDate
        ? Array.from({ length: 12 }, (_, i) => currentYear + i) 
        : Array.from({ length: 100 }, (_, i) => topYear - i);

    const handleOpen = (): void => {
        setMode(defaultMode);
        setShowPicker(true);
    };

    const handlePrevMonth = (): void => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (): void => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (day: number): void => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (allowFutureDates && selectedDate < today) return; 
        if (!allowFutureDates && selectedDate > today) return; 
        
        onChangeText(selectedDate);
        setShowPicker(false);
    };

    const renderDateGrid = (): React.ReactNode => (
        <View>
            <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day, index) => (
                    <CustomText 
                        key={index} 
                        style={styles.weekdayText}
                    >
                        {day}
                    </CustomText>
                ))}
            </View>
            <View style={styles.daysGrid}>
                {calendarGrid.map((day, index) => {
                    if (day === null) {
                        return <View key={`blank-${index}`} style={styles.dayCell} />;
                    }

                    const selected = isSelected(day);
                    const today = isToday(day);
                    const disabled = allowFutureDates ? isPastDate(day) : isFutureDate(day);

                    return (
                        <TouchableOpacity 
                            key={`day-${day}`} 
                            style={[
                                styles.dayCell, 
                                selected && styles.dayCellSelected
                            ]}
                            onPress={() => handleSelectDate(day)}
                            disabled={disabled}
                            activeOpacity={0.7}
                        >
                            <CustomText 
                                style={[
                                    styles.dayText,
                                    selected && styles.dayTextSelected,
                                    today && !selected && styles.dayTextToday,
                                    disabled && styles.dayTextDisabled
                                ]}
                            >
                                {day}
                            </CustomText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const renderYearSelector = (): React.ReactNode => (
        <ScrollView 
            style={styles.selectorScroll} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.selectorGrid}>
                {years.map(y => (
                    <TouchableOpacity 
                        key={y} 
                        style={[
                            styles.yearCell, 
                            viewDate.getFullYear() === y && styles.selectorCellActive
                        ]}
                        onPress={() => {
                            setViewDate(new Date(y, viewDate.getMonth(), 1));
                            setMode('month'); 
                        }}
                    >
                        <CustomText 
                            style={[
                                styles.selectorText, 
                                viewDate.getFullYear() === y && styles.selectorTextActive
                            ]}
                        >
                            {y}
                        </CustomText>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderMonthSelector = (): React.ReactNode => (
        <View style={styles.monthSelectorWrapper}>
            <View style={styles.selectorGrid}>
                {SHORT_MONTHS.map((m, index) => {
                    const isPastMonth = allowFutureDates 
                        && viewDate.getFullYear() === currentYear 
                        && index < new Date().getMonth();

                    const isFutureMonth = effectiveMaxDate
                        && viewDate.getFullYear() === effectiveMaxDate.getFullYear()
                        && index > effectiveMaxDate.getMonth();

                    const disabled = !!(isPastMonth || isFutureMonth);

                    return (
                        <TouchableOpacity
                            key={m} 
                            style={[
                                styles.monthCell, 
                                viewDate.getMonth() === index && styles.selectorCellActive,
                                disabled && { opacity: 0.3 }
                            ]}
                            disabled={disabled}
                            onPress={() => {
                                setViewDate(new Date(viewDate.getFullYear(), index, 1));
                                setMode('date'); 
                            }}
                        >
                            <CustomText 
                                style={[
                                    styles.selectorText, 
                                    viewDate.getMonth() === index && styles.selectorTextActive
                                ]}
                            >
                                {m}
                            </CustomText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, style]}>
            
            {label && (
                <CustomText variant="label" style={styles.label}> 
                    {label} 
                </CustomText>
            )}

            <Pressable 
                style={[
                    styles.inputContainer, 
                    { 
                        borderColor: showPicker ? Colors.PRIMARY : Colors.GRAY_LIGHT 
                    }
                ]} 
                onPress={handleOpen}
            >
                {iconPosition === 'left' && (
                    <CustomIcon 
                        library="Feather" 
                        name="calendar" 
                        size={20} 
                        color={showPicker ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                        style={{ marginRight: 12 }}
                    />
                )}
                <View 
                    style={[
                        styles.textInputWrapper, 
                        { pointerEvents: 'none' } 
                    ]}
                >
                    <TextInput 
                        style={styles.inputText}
                        value={getDisplayDate()}
                        placeholder={placeholder}
                        placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                        editable={false}
                    />
                </View>

                {iconPosition === 'right' && (
                    <CustomIcon 
                        library="Feather" 
                        name="calendar" 
                        size={20} 
                        color={showPicker ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                    />
                )}
            </Pressable>

            <Modal
                transparent={true}
                visible={showPicker}
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setShowPicker(false)}
                >
                    <Pressable 
                        style={styles.calendarCard} 
                        onPress={() => {}}
                    >
                        
                        <View style={styles.calendarHeader}>
                            {mode === 'date' ? (
                                <TouchableOpacity 
                                    onPress={handlePrevMonth} 
                                    style={styles.navButton}
                                >
                                    <CustomIcon 
                                        library="Feather" 
                                        name="chevron-left" 
                                        size={24} 
                                        color={Colors.TEXT_PRIMARY} 
                                    />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.navButtonPlaceholder} />
                            )}
                            
                            <TouchableOpacity 
                                style={styles.headerTitleContainer}
                                onPress={() => setMode(mode === 'date' ? 'year' : 'date')}
                                activeOpacity={0.7}
                            >
                                <CustomText style={styles.headerTitle}>
                                    {MONTHS.find((_, i) => i === viewDate.getMonth())} {viewDate.getFullYear()}
                                </CustomText>
                                <CustomIcon 
                                    library="Feather" 
                                    name={mode === 'date' ? "chevron-down" : "chevron-up"} 
                                    size={18} 
                                    color={Colors.TEXT_PRIMARY} 
                                />
                            </TouchableOpacity>

                            {mode === 'date' ? (
                                <TouchableOpacity 
                                    onPress={handleNextMonth} 
                                    style={styles.navButton}
                                >
                                    <CustomIcon 
                                        library="Feather" 
                                        name="chevron-right" 
                                        size={24} 
                                        color={Colors.TEXT_PRIMARY} 
                                    />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.navButtonPlaceholder} />
                            )}
                        </View>

                        <View style={styles.dynamicContentContainer}>
                            {mode === 'date' && renderDateGrid()}
                            {mode === 'year' && renderYearSelector()}
                            {mode === 'month' && renderMonthSelector()}
                        </View>

                        <View 
                            style={[
                                styles.footerRow, 
                                !showTodayButton && styles.footerRowCenter
                            ]}
                        >
                            <TouchableOpacity 
                                onPress={() => { 
                                    onChangeText(''); 
                                    setShowPicker(false); 
                                }}
                            >
                                <CustomText style={styles.footerButtonText}>
                                    Clear
                                </CustomText>
                            </TouchableOpacity>

                            {showTodayButton && (
                                <TouchableOpacity 
                                    onPress={() => { 
                                        const today = new Date();
                                        setViewDate(today);
                                        onChangeText(today); 
                                        setShowPicker(false); 
                                    }}
                                >
                                    <CustomText style={styles.footerButtonTextToday}>
                                        Today
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                        </View>

                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        width: '100%', 
        marginBottom: 16, 
    },
    label: { 
        marginBottom: 8, 
        marginLeft: 2, 
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.BACKGROUND, 
        borderWidth: 1, 
        borderRadius: 12, 
        height: 54, 
        paddingHorizontal: 16, 
    },
    textInputWrapper: { 
        flex: 1, 
    },
    inputText: { 
        flex: 1, 
        fontSize: 16, 
        color: Colors.TEXT_PRIMARY, 
        padding: 0, 
        margin: 0, 
        outlineStyle: 'none' as any, 
    },

    modalOverlay: { 
        flex: 1, 
        backgroundColor: Colors.MODAL_OVERLAY, 
        justifyContent: 'center', 
        alignItems: 'center', 
    },
    calendarCard: { 
        width: '90%', 
        maxWidth: 360, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 20, 
        padding: 20, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { 
            width: 0, 
            height: 10, 
        }, 
        shadowOpacity: 0.15, 
        shadowRadius: 20, 
...GlobalStyles.dropShadow(10), 
    },
    calendarHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20, 
    },
    headerTitleContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
    },
    navButton: { 
        padding: 4, 
    },
    navButtonPlaceholder: { 
        width: 32, 
    }, 
    
    dynamicContentContainer: { 
        height: 330, 
    }, 

    weekdaysRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 10, 
    },
    weekdayText: { 
        width: `${100 / 7}%`, 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 14, 
        fontWeight: 'bold', 
    },
    daysGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
    },
    dayCell: { 
        width: `${100 / 7}%`, 
        height: 46, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 12, 
        marginBottom: 4, 
    },
    dayCellSelected: { 
        backgroundColor: Colors.PRIMARY, 
    },
    dayText: { 
        fontSize: 16, 
        color: Colors.TEXT_PRIMARY, 
    },
    dayTextSelected: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
    },
    dayTextToday: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
    },
    dayTextDisabled: { 
        color: Colors.GRAY_LIGHT, 
    },

    monthSelectorWrapper: { 
        flex: 1, 
        justifyContent: 'center', 
        paddingVertical: 4, 
    },
    selectorScroll: { 
        flex: 1, 
    },
    scrollContent: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        paddingBottom: 16, 
    }, 
    selectorGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
    },
    
    monthCell: { 
        width: '30%', 
        height: 64, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 16, 
        marginBottom: 16, 
    },
    yearCell: { 
        width: '30%', 
        height: 52, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 14, 
        marginBottom: 12, 
    },

    selectorCellActive: { 
        backgroundColor: Colors.PRIMARY, 
    },
    selectorText: { 
        fontSize: 16, 
        color: Colors.TEXT_PRIMARY, 
    },
    selectorTextActive: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
    },

    footerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 16, 
        paddingTop: 16, 
        borderTopWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
    },
    footerRowCenter: { 
        justifyContent: 'center', 
    },
    footerButtonText: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: 'bold', 
        fontSize: 15, 
    },
    footerButtonTextToday: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 15, 
    }
});

export default CustomCalendarInput;