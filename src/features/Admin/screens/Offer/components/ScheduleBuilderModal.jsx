import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { formatTime, parseTimeToDate } from '@/src/utils/dateFormatter';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AMPMToggle = ({ value, onChange }) => (
    <View style={styles.toggleContainer}>
        <TouchableOpacity 
            style={[
                styles.toggleOption, 
                value === 'AM' && styles.toggleSelected
            ]} 
            onPress={() => onChange('AM')}
            activeOpacity={0.8}
        >
            <CustomText 
                style={[
                    styles.toggleText, 
                    value === 'AM' && styles.toggleTextSelected
                ]}
            >
                AM
            </CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[
                styles.toggleOption, 
                value === 'PM' && styles.toggleSelected
            ]} 
            onPress={() => onChange('PM')}
            activeOpacity={0.8}
        >
            <CustomText 
                style={[
                    styles.toggleText, 
                    value === 'PM' && styles.toggleTextSelected
                ]}
            >
                PM
            </CustomText>
        </TouchableOpacity>
    </View>
);

const ScheduleBuilderModal = ({ 
    visible, 
    onClose, 
    onSave, 
    initialSchedule = [], 
    offerDays = 0 
}) => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isDesktop = width >= 768;

    const [schedule, setSchedule] = useState([]);
    const [focusedField, setFocusedField] = useState(null);

    const [renderModal, setRenderModal] = useState(visible);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    useEffect(() => {
        if (visible) {
            const targetDays = parseInt(offerDays, 10) || 0;
            let formattedSchedule = [];

            if (initialSchedule && initialSchedule.length > 0) {
                formattedSchedule = initialSchedule.map(day => ({
                    day: day.day,
                    activities: day.activities.map(act => {
                        const fullTimeStr = formatTime(act.time); 
                        const [timePart, period] = fullTimeStr.split(' ');
                        const [h, m] = timePart ? timePart.split(':') : ['', ''];
                        
                        return {
                            hourVal: h || '',
                            minuteVal: m || '',
                            periodVal: period || 'AM',
                            event: act.event
                        };
                    })
                }));
            }

            if (targetDays > 0) {
                if (formattedSchedule.length > targetDays) {
                    formattedSchedule = formattedSchedule.slice(0, targetDays);
                } else if (formattedSchedule.length < targetDays) {
                    const daysToAdd = targetDays - formattedSchedule.length;
                    
                    for (let i = 0; i < daysToAdd; i++) {
                        formattedSchedule.push({ 
                            day: formattedSchedule.length + 1, 
                            activities: [
                                { 
                                    hourVal: '', 
                                    minuteVal: '', 
                                    periodVal: 'AM', 
                                    event: '' 
                                }
                            ] 
                        });
                    }
                }
            }
            setSchedule(formattedSchedule);
        }
    }, [visible, initialSchedule, offerDays]);

    const handleAddDay = () => {
        const newDayNum = schedule.length + 1;
        setSchedule([
            ...schedule, 
            { 
                day: newDayNum, 
                activities: [
                    { 
                        hourVal: '', 
                        minuteVal: '', 
                        periodVal: 'AM', 
                        event: '' 
                    }
                ] 
            }
        ]);
    };

    const handleRemoveDay = (dayIndexToRemove) => {
        const newSchedule = schedule
            .filter((_, idx) => idx !== dayIndexToRemove)
            .map((d, idx) => ({ ...d, day: idx + 1 }));
        setSchedule(newSchedule);
    };

    const handleAddActivity = (dayIndex) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities.push({ 
            hourVal: '', 
            minuteVal: '', 
            periodVal: 'AM', 
            event: '' 
        });
        setSchedule(newSchedule);
    };

    const handleRemoveActivity = (dayIndex, actIndex) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities = newSchedule[dayIndex].activities.filter(
            (_, idx) => idx !== actIndex
        );
        setSchedule(newSchedule);
    };

    const handleUpdateActivity = (dayIndex, actIndex, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities[actIndex][field] = value;
        setSchedule(newSchedule);
    };

    const handleSave = () => {
        const finalizedSchedule = schedule.map(d => ({
            day: d.day,
            activities: d.activities.map(act => ({
                time: parseTimeToDate(`${act.hourVal}:${act.minuteVal} ${act.periodVal}`), 
                event: act.event
            }))
        }));
        onSave(finalizedSchedule);
    };

    if (!renderModal) return null;

    return (
        <Modal 
            visible={renderModal} 
            animationType="none" 
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity 
                        style={styles.backdropTouch} 
                        activeOpacity={1} 
                        onPress={onClose} 
                    />
                </Animated.View>

                <Animated.View 
                    style={[
                        styles.modalContent, 
                        isDesktop ? styles.contentDesktop : styles.contentMobile,
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: isDesktop ? [50, 0] : [SCREEN_HEIGHT, 0],
                                    }),
                                },
                            ],
                            opacity: isDesktop ? animValue : 1,
                        }
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <CustomText variant="h2" style={{ marginBottom: 0 }}>
                            Build Itinerary
                        </CustomText>
                        
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CustomIcon 
                                library="Feather" 
                                name="x" 
                                size={24} 
                                color={Colors.TEXT_PRIMARY} 
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollContent}
                    >
                        {schedule.length === 0 ? (
                            <View style={styles.emptyState}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="calendar" 
                                    size={48} 
                                    color={Colors.GRAY_MEDIUM} 
                                />
                                <CustomText variant="h3" style={styles.emptyTitle}>
                                    No Itinerary Yet
                                </CustomText>
                                <CustomText style={styles.emptySubtitle}>
                                    Add your first day to start building the schedule.
                                </CustomText>
                                
                                <TouchableOpacity 
                                    style={styles.startDayBtn} 
                                    onPress={handleAddDay} 
                                    activeOpacity={0.7}
                                >
                                    <CustomText style={styles.startDayText}>
                                        + Start Day 1
                                    </CustomText>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {schedule.map((dayItem, dayIndex) => (
                                    <View key={`day-${dayIndex}`} style={styles.dayCard}>
                                        
                                        <View style={styles.dayHeader}>
                                            <CustomText style={styles.dayTitle}>
                                                Day {dayItem.day}
                                            </CustomText>
                                            
                                            <TouchableOpacity 
                                                onPress={() => handleRemoveDay(dayIndex)} 
                                                style={{ padding: 4 }}
                                            >
                                                <CustomIcon 
                                                    library="Feather" 
                                                    name="trash-2" 
                                                    size={20} 
                                                    color={Colors.ERROR} 
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        {dayItem.activities.map((activity, actIndex) => {
                                            const isHourFocused = focusedField === `${dayIndex}-${actIndex}-hour`;
                                            const isMinFocused = focusedField === `${dayIndex}-${actIndex}-min`;

                                            return (
                                                <View key={`act-${actIndex}`} style={styles.activityBlock}>
                                                    <View style={styles.activityTimeRow}>
                                                        
                                                        <View style={styles.timeInputContainer}>
                                                            <View 
                                                                style={[
                                                                    styles.timeInputBox, 
                                                                    isHourFocused ? styles.inputFocused : styles.inputUnfocused
                                                                ]}
                                                            >
                                                                <TextInput 
                                                                    placeholder="12" 
                                                                    value={activity.hourVal} 
                                                                    keyboardType="numeric" 
                                                                    maxLength={2}
                                                                    onChangeText={(val) => handleUpdateActivity(dayIndex, actIndex, 'hourVal', val)}
                                                                    style={styles.rawTimeInput} 
                                                                    placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                                                                    onFocus={() => setFocusedField(`${dayIndex}-${actIndex}-hour`)}
                                                                    onBlur={() => setFocusedField(null)}
                                                                />
                                                            </View>
                                                            
                                                            <CustomText style={styles.timeColon}>
                                                                :
                                                            </CustomText>
                                                            
                                                            <View 
                                                                style={[
                                                                    styles.timeInputBox, 
                                                                    isMinFocused ? styles.inputFocused : styles.inputUnfocused
                                                                ]}
                                                            >
                                                                <TextInput 
                                                                    placeholder="00" 
                                                                    value={activity.minuteVal} 
                                                                    keyboardType="numeric" 
                                                                    maxLength={2}
                                                                    onChangeText={(val) => handleUpdateActivity(dayIndex, actIndex, 'minuteVal', val)}
                                                                    style={styles.rawTimeInput} 
                                                                    placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                                                                    onFocus={() => setFocusedField(`${dayIndex}-${actIndex}-min`)}
                                                                    onBlur={() => setFocusedField(null)}
                                                                />
                                                            </View>
                                                        </View>
                                                        
                                                        <View style={styles.dropdownWrapper}>
                                                            <AMPMToggle 
                                                                value={activity.periodVal} 
                                                                onChange={(val) => handleUpdateActivity(dayIndex, actIndex, 'periodVal', val)} 
                                                            />
                                                        </View>
                                                        
                                                        <View style={styles.deleteActWrapper}>
                                                            <TouchableOpacity 
                                                                style={styles.deleteActBtn} 
                                                                onPress={() => handleRemoveActivity(dayIndex, actIndex)}
                                                            >
                                                                <CustomIcon 
                                                                    library="Feather" 
                                                                    name="minus-circle" 
                                                                    size={24} 
                                                                    color={Colors.ERROR} 
                                                                />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>

                                                    <View style={styles.eventInputWrapper}>
                                                        <CustomTextInput 
                                                            placeholder="Event description (e.g. Meet up at parking)"
                                                            value={activity.event}
                                                            onChangeText={(val) => handleUpdateActivity(dayIndex, actIndex, 'event', val)}
                                                            style={styles.noMargin}
                                                        />
                                                    </View>
                                                </View>
                                            );
                                        })}

                                        <TouchableOpacity 
                                            style={styles.addActBtn} 
                                            onPress={() => handleAddActivity(dayIndex)}
                                        >
                                            <CustomIcon 
                                                library="Feather" 
                                                name="plus" 
                                                size={16} 
                                                color={Colors.PRIMARY} 
                                            />
                                            <CustomText style={styles.addActText}>
                                                Add Activity
                                            </CustomText>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                
                                <TouchableOpacity 
                                    style={styles.addDayBtn} 
                                    onPress={handleAddDay}
                                >
                                    <CustomIcon 
                                        library="Feather" 
                                        name="plus-circle" 
                                        size={20} 
                                        color={Colors.PRIMARY} 
                                    />
                                    <CustomText style={styles.addDayText}>
                                        Add Another Day
                                    </CustomText>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>

                    <View 
                        style={[
                            styles.footer, 
                            isDesktop && styles.footerDesktop,
                            { paddingBottom: isDesktop ? 20 : Math.max(insets.bottom + 16, 20) }
                        ]}
                    >
                        <CustomButton 
                            title="Save Itinerary" 
                            onPress={handleSave} 
                            variant="primary" 
                        />
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const dropShadow = Platform.select({
    ios: { 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { 
            width: 0, 
            height: -4 
        }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12 
    },
    android: { 
        elevation: 10 
    },
    web: { 
        boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.08)' 
    }
});

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
    },
    backdropTouch: {
        flex: 1
    },
    modalContent: {
        backgroundColor: Colors.BACKGROUND,
        width: '100%',
        maxHeight: '90%',
        ...dropShadow
    },
    contentMobile: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24
    },
    contentDesktop: {
        alignSelf: 'center',
        marginBottom: 'auto',
        marginTop: 'auto',
        width: 680,
        borderRadius: 24
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT
    },
    closeBtn: {
        padding: 4,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 16
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        flexGrow: 1
    },
    emptyState: { 
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 40, 
        paddingHorizontal: 20 
    },
    emptyTitle: { 
        marginTop: 16, 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY 
    },
    emptySubtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 24 
    },
    startDayBtn: { 
        backgroundColor: '#E8F5E9', 
        paddingHorizontal: 24, 
        paddingVertical: 12, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: '#A5D6A7' 
    },
    startDayText: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold' 
    },
    addDayBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 16, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed', 
        gap: 8, 
        marginBottom: 20 
    },
    addDayText: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    dayCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { 
            width: 0, 
            height: 2 
        }, 
        shadowOpacity: 0.04, 
        shadowRadius: 4, 
        elevation: 1 
    },
    dayHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    dayTitle: { 
        color: Colors.PRIMARY, 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    activityBlock: { 
        marginBottom: 20 
    },
    activityTimeRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 12, 
        gap: 12 
    },
    timeInputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6 
    },
    timeInputBox: { 
        borderWidth: 1, 
        borderRadius: 12, 
        height: 54, 
        width: 54, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    inputUnfocused: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderColor: Colors.GRAY_LIGHT 
    },
    inputFocused: { 
        backgroundColor: Colors.WHITE, 
        borderColor: Colors.PRIMARY 
    },
    rawTimeInput: { 
        fontSize: 16, 
        color: Colors.TEXT_PRIMARY, 
        textAlign: 'center', 
        width: '100%', 
        padding: 0, 
        margin: 0, 
        outlineStyle: 'none' 
    },
    timeColon: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 2 
    },
    dropdownWrapper: { 
        flex: 1 
    },
    toggleContainer: { 
        flexDirection: 'row', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderRadius: 12, 
        padding: 4, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        height: 54, 
        alignItems: 'center' 
    },
    toggleOption: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 8, 
        height: '100%' 
    },
    toggleSelected: { 
        backgroundColor: Colors.PRIMARY 
    },
    toggleText: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: Colors.TEXT_SECONDARY 
    },
    toggleTextSelected: { 
        color: Colors.WHITE 
    },
    deleteActWrapper: { 
        alignItems: 'flex-end' 
    },
    deleteActBtn: { 
        padding: 4 
    },
    eventInputWrapper: { 
        width: '100%' 
    },
    noMargin: { 
        marginBottom: 0 
    },
    addActBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 12, 
        backgroundColor: Colors.BACKGROUND, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed', 
        gap: 6, 
        marginTop: 4 
    },
    addActText: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    footer: { 
        paddingHorizontal: 24, 
        paddingTop: 20,
        backgroundColor: Colors.WHITE, 
        borderTopWidth: 1, 
        borderTopColor: Colors.GRAY_ULTRALIGHT 
    },
    footerDesktop: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    }
});

export default ScheduleBuilderModal;