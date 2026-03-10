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
    placeholder = "DD/MM/YYYY",
    showTodayButton = false, 
    allowFutureDates = false 
}) => {

    const [showPicker, setShowPicker] = useState(false);
    const [mode, setMode] = useState('date'); // 'date' | 'month' | 'year'
    const [viewDate, setViewDate] = useState(
        value instanceof Date && !isNaN(value) ? value : new Date()
    );

    useEffect(() => {
        if (value instanceof Date && !isNaN(value)) {
            setViewDate(value);
        }
    }, [value]);

    const getDisplayDate = () => {
        if (!value || !(value instanceof Date) || isNaN(value)) return '';
        const dd = value.getDate().toString().padStart(2, '0');
        const mm = (value.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = value.getFullYear().toString();
        return `${dd}/${mm}/${yyyy}`;
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && 
            viewDate.getMonth() === today.getMonth() && 
            viewDate.getFullYear() === today.getFullYear();
    };

    const isSelected = (day) => {
        if (!value || !(value instanceof Date) || isNaN(value)) return false;
        return day === value.getDate() && 
            viewDate.getMonth() === value.getMonth() && 
            viewDate.getFullYear() === value.getFullYear();
    };

    const isFuture = (day) => {
        if (allowFutureDates) return false;
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return checkDate > new Date(); 
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const blanks = Array.from({ length: firstDayOfMonth }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarGrid = [...blanks, ...days];

    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: allowFutureDates ? 100 : 100 }, 
        (_, i) => allowFutureDates ? currentYear + 5 - i : currentYear - i
    );

    const handleOpen = () => {
        setMode('date');
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
        
        if (!allowFutureDates && selectedDate > new Date()) return; 
        
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
                    const disabled = isFuture(day);

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
        <ScrollView style={styles.selectorScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.selectorGrid}>
                {years.map(y => (
                    <TouchableOpacity 
                        key={y} 
                        style={[styles.selectorCell, viewDate.getFullYear() === y && styles.selectorCellActive]}
                        onPress={() => {
                            setViewDate(new Date(y, viewDate.getMonth(), 1));
                            setMode('month'); 
                        }}
                    >
                        <CustomText style={[styles.selectorText, viewDate.getFullYear() === y && styles.selectorTextActive]}>
                            {y}
                        </CustomText>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderMonthSelector = () => (
        <View style={styles.selectorGrid}>
            {SHORT_MONTHS.map((m, index) => (
                <TouchableOpacity 
                    key={m} 
                    style={[styles.selectorCell, viewDate.getMonth() === index && styles.selectorCellActive]}
                    onPress={() => {
                        setViewDate(new Date(viewDate.getFullYear(), index, 1));
                        setMode('date'); 
                    }}
                >
                    <CustomText style={[styles.selectorText, viewDate.getMonth() === index && styles.selectorTextActive]}>
                        {m}
                    </CustomText>
                </TouchableOpacity>
            ))}
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
                <View pointerEvents="none" style={styles.textInputWrapper}>
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
    // --- Layout & Inputs ---
    container: { width: '100%', marginBottom: 16 },
    label: { marginBottom: 8, marginLeft: 2 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.BACKGROUND, 
        borderWidth: 1, borderRadius: 12, height: 54, paddingHorizontal: 16,
    },
    textInputWrapper: { flex: 1 },
    inputText: { 
        flex: 1, fontSize: 16, color: Colors.TEXT_PRIMARY, padding: 0, margin: 0,
        outlineStyle: 'none'
    },

    // --- Modal Structure ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    calendarCard: {
        width: '90%', maxWidth: 360, backgroundColor: Colors.WHITE, borderRadius: 20, 
        padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    navButton: { padding: 4 },
    navButtonPlaceholder: { width: 32 }, 
    dynamicContentContainer: { minHeight: 230 }, 

    // --- Grid (Date) ---
    weekdaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekdayText: { width: `${100 / 7}%`, textAlign: 'center', color: Colors.TEXT_SECONDARY, fontSize: 14, fontWeight: 'bold' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 100, marginBottom: 4 },
    dayCellSelected: { backgroundColor: Colors.PRIMARY },
    dayText: { fontSize: 16, color: Colors.TEXT_PRIMARY },
    dayTextSelected: { color: Colors.WHITE, fontWeight: 'bold' },
    dayTextToday: { color: Colors.PRIMARY, fontWeight: 'bold' },
    dayTextDisabled: { color: Colors.GRAY_LIGHT },

    // --- Selectors (Month/Year) ---
    selectorScroll: { maxHeight: 230 },
    selectorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    selectorCell: { width: '30%', paddingVertical: 12, alignItems: 'center', borderRadius: 12, marginBottom: 10 },
    selectorCellActive: { backgroundColor: Colors.PRIMARY },
    selectorText: { fontSize: 16, color: Colors.TEXT_PRIMARY },
    selectorTextActive: { color: Colors.WHITE, fontWeight: 'bold' },

    // --- Footer ---
    footerRow: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT 
    },
    footerRowCenter: { justifyContent: 'center' },
    footerButtonText: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold', fontSize: 15 },
    footerButtonTextToday: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 15 },
});

export default CustomCalendarInput;