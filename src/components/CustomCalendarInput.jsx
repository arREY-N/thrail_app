import React, { useEffect, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

// FIX: Import your new centralized utility formatters!
import { formatToMMDDYY, formatToMMDDYYYY, safeParseDateString } from '@/src/utils/dateFormatter';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const SHORT_MONTHS = MONTHS.map(m => m.substring(0, 3));

const CustomCalendarInput = ({ 
    value, 
    onChangeText, 
    label,
    placeholder = "MM/DD/YYYY", 
    showTodayButton = false, 
    allowFutureDates = false,
    defaultMode = 'date',
    maximumDate,
    dateFormat = 'MM/DD/YYYY' // Defaults to standard, but can be overridden
}) => {

    const [showPicker, setShowPicker] = useState(false);
    const [mode, setMode] = useState(defaultMode); 
    
    // Utilize your ultra-safe parser
    const [viewDate, setViewDate] = useState(value ? safeParseDateString(value) : new Date());

    useEffect(() => {
        if (value) {
            setViewDate(safeParseDateString(value));
        }
    }, [value]);

    const effectiveMaxDate = maximumDate || (allowFutureDates ? null : new Date());

    // Switch dynamically based on the requested format!
    const getDisplayDate = () => {
        if (!value) return '';
        if (dateFormat === 'MM/DD/YY') {
            return formatToMMDDYY(value);
        }
        return formatToMMDDYYYY(value);
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && 
            viewDate.getMonth() === today.getMonth() && 
            viewDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day) => {
        if (!value) return false;
        const d = safeParseDateString(value);
        return day === d.getDate() && 
            viewDate.getMonth() === d.getMonth() && 
            viewDate.getFullYear() === d.getFullYear();
    };

    const isPastDate = (day) => {
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate < today; 
    };

    const isFutureDate = (day) => {
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate > today; 
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const blanks = Array.from({ length: firstDayOfMonth }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarGrid = [...blanks, ...days];

    const currentYear = new Date().getFullYear();
    const topYear = effectiveMaxDate ? effectiveMaxDate.getFullYear() : currentYear;
    
    const years = allowFutureDates && !maximumDate
        ? Array.from({ length: 12 }, (_, i) => currentYear + i) 
        : Array.from({ length: 100 }, (_, i) => topYear - i);

    const handleOpen = () => {
        setMode(defaultMode);
        setShowPicker(true);
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (day) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (allowFutureDates && selectedDate < today) return; 
        if (!allowFutureDates && selectedDate > today) return; 
        
        onChangeText(selectedDate);
        setShowPicker(false);
    };

    const renderDateGrid = () => (
        <View>
            <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day, index) => (
                    <CustomText key={index} style={styles.weekdayText}>
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
                            style={[styles.dayCell, selected && styles.dayCellSelected]}
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

    const renderYearSelector = () => (
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
                        <CustomText style={[
                            styles.selectorText, 
                            viewDate.getFullYear() === y && styles.selectorTextActive
                        ]}>
                            {y}
                        </CustomText>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderMonthSelector = () => (
        <View style={styles.monthSelectorWrapper}>
            <View style={styles.selectorGrid}>
                {SHORT_MONTHS.map((m, index) => {
                    const isPastMonth = allowFutureDates 
                        && viewDate.getFullYear() === currentYear 
                        && index < new Date().getMonth();

                    const isFutureMonth = effectiveMaxDate
                        && viewDate.getFullYear() === effectiveMaxDate.getFullYear()
                        && index > effectiveMaxDate.getMonth();

                    const disabled = isPastMonth || isFutureMonth;

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
                            <CustomText style={[
                                styles.selectorText, 
                                viewDate.getMonth() === index && styles.selectorTextActive
                            ]}>
                                {m}
                            </CustomText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            
            {label && (
                <CustomText variant="label" style={styles.label}> 
                    {label} 
                </CustomText>
            )}

            <Pressable 
                style={[
                    styles.inputContainer, 
                    { borderColor: showPicker ? Colors.PRIMARY : Colors.GRAY_LIGHT }
                ]} 
                onPress={handleOpen}
            >
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

                <CustomIcon 
                    library="Feather" 
                    name="calendar" 
                    size={20} 
                    color={showPicker ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                />
            </Pressable>

            <Modal
                transparent={true}
                visible={showPicker}
                animationType="fade"
                onRequestClose={() => setShowPicker(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
                    <Pressable style={styles.calendarCard} onPress={() => {}}>
                        
                        <View style={styles.calendarHeader}>
                            {mode === 'date' ? (
                                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                                    <CustomIcon library="Feather" name="chevron-left" size={24} color={Colors.TEXT_PRIMARY} />
                                </TouchableOpacity>
                            ) : <View style={styles.navButtonPlaceholder} />}
                            
                            <TouchableOpacity 
                                style={styles.headerTitleContainer}
                                onPress={() => setMode(mode === 'date' ? 'year' : 'date')}
                                activeOpacity={0.7}
                            >
                                <CustomText style={styles.headerTitle}>
                                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </CustomText>
                                <CustomIcon 
                                    library="Feather" 
                                    name={mode === 'date' ? "chevron-down" : "chevron-up"} 
                                    size={18} 
                                    color={Colors.TEXT_PRIMARY} 
                                />
                            </TouchableOpacity>

                            {mode === 'date' ? (
                                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                                    <CustomIcon library="Feather" name="chevron-right" size={24} color={Colors.TEXT_PRIMARY} />
                                </TouchableOpacity>
                            ) : <View style={styles.navButtonPlaceholder} />}
                        </View>

                        <View style={styles.dynamicContentContainer}>
                            {mode === 'date' && renderDateGrid()}
                            {mode === 'year' && renderYearSelector()}
                            {mode === 'month' && renderMonthSelector()}
                        </View>

                        <View style={[styles.footerRow, !showTodayButton && styles.footerRowCenter]}>
                            <TouchableOpacity 
                                onPress={() => { 
                                    onChangeText(''); 
                                    setShowPicker(false); 
                                }}
                            >
                                <CustomText style={styles.footerButtonText}>Clear</CustomText>
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
                                    <CustomText style={styles.footerButtonTextToday}>Today</CustomText>
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
    container: { width: '100%', marginBottom: 16 },
    label: { marginBottom: 8, marginLeft: 2 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.BACKGROUND, borderWidth: 1, borderRadius: 12, height: 54, paddingHorizontal: 16 },
    textInputWrapper: { flex: 1 },
    inputText: { flex: 1, fontSize: 16, color: Colors.TEXT_PRIMARY, padding: 0, margin: 0, outlineStyle: 'none' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    calendarCard: { width: '90%', maxWidth: 360, backgroundColor: Colors.WHITE, borderRadius: 20, padding: 20, shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    navButton: { padding: 4 },
    navButtonPlaceholder: { width: 32 }, 
    
    dynamicContentContainer: { height: 330 }, 

    weekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekdayText: { width: `${100 / 7}%`, textAlign: 'center', color: Colors.TEXT_SECONDARY, fontSize: 14, fontWeight: 'bold' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, height: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 4 },
    dayCellSelected: { backgroundColor: Colors.PRIMARY },
    dayText: { fontSize: 16, color: Colors.TEXT_PRIMARY },
    dayTextSelected: { color: Colors.WHITE, fontWeight: 'bold' },
    dayTextToday: { color: Colors.PRIMARY, fontWeight: 'bold' },
    dayTextDisabled: { color: Colors.GRAY_LIGHT },

    monthSelectorWrapper: { flex: 1, justifyContent: 'center', paddingVertical: 4 },
    selectorScroll: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 16 }, 
    selectorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    
    monthCell: { width: '30%', height: 64, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginBottom: 16 },
    yearCell: { width: '30%', height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 14, marginBottom: 12 },

    selectorCellActive: { backgroundColor: Colors.PRIMARY },
    selectorText: { fontSize: 16, color: Colors.TEXT_PRIMARY },
    selectorTextActive: { color: Colors.WHITE, fontWeight: 'bold' },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT },
    footerRowCenter: { justifyContent: 'center' },
    footerButtonText: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold', fontSize: 15 },
    footerButtonTextToday: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 15 }
});

export default CustomCalendarInput;