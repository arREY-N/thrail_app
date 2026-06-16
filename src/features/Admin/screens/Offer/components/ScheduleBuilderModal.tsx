import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
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

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { formatTime, parseTimeToDate } from '@/src/utils/dateFormatter';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Props for the AMPMToggle component.
 * @param {string} value - The currently active value ('AM' or 'PM').
 * @param {(val: string) => void} onChange - Callback triggered when an option is selected.
 */
export interface AMPMToggleProps {
    value: string;
    onChange: (val: string) => void;
}

/**
 * AMPMToggle
 * A simple, reusable two-option toggle specifically for AM/PM time selection.
 * @param {AMPMToggleProps} props - The props for the component.
 * @param {string} props.value - The currently active value ('AM' or 'PM').
 * @param {(val: string) => void} props.onChange - Callback triggered when an option is selected.
 */
const AMPMToggle = ({ value, onChange }: AMPMToggleProps) => (
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

/**
 * Props for the ScheduleBuilderModal component.
 * @param {boolean} visible - Controls the visibility of the modal.
 * @param {() => void} onClose - Callback triggered to close the modal.
 * @param {(schedule: any[]) => void} onSave - Callback triggered when the itinerary is saved.
 * @param {any[]} [initialSchedule] - Existing schedule data to pre-populate the builder.
 * @param {number | string} [offerDays] - The target number of days this offer spans, used to pad empty days.
 */
export interface ScheduleBuilderModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (schedule: any[]) => void;
    initialSchedule?: any[];
    offerDays?: number | string;
}

/**
 * ScheduleBuilderModal
 * A comprehensive modal interface allowing admins/guides to dynamically build 
 * a multi-day itinerary. It supports adding/removing days, adding/removing activities 
 * within those days, and setting specific times and events.
 * @param {ScheduleBuilderModalProps} props - The props for the component.
 * @param {boolean} props.visible - Controls the visibility of the modal.
 * @param {() => void} props.onClose - Callback triggered to close the modal.
 * @param {(schedule: any[]) => void} props.onSave - Callback triggered when the itinerary is saved. Passes the finalized schedule array.
 * @param {any[]} [props.initialSchedule=[]] - Existing schedule data to pre-populate the builder.
 * @param {number|string} [props.offerDays=0] - The target number of days this offer spans, used to pad empty days.
 */
const ScheduleBuilderModal = ({ 
    visible, 
    onClose, 
    onSave, 
    initialSchedule = [], 
    offerDays = 0 
}: ScheduleBuilderModalProps) => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isDesktop = width >= 768;

    const [schedule, setSchedule] = useState<any[]>([]);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    
    const [dayToDelete, setDayToDelete] = useState<{ index: number, dayNum: number } | null>(null);
    const [lastDayToDelete, setLastDayToDelete] = useState<{ index: number, dayNum: number } | null>(null);

    const [renderModal, setRenderModal] = useState(visible);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (dayToDelete !== null) {
            setLastDayToDelete(dayToDelete);
        }
    }, [dayToDelete]);

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            Animated.timing(animValue, { 
                toValue: 1, 
                duration: 300, 
                useNativeDriver: Platform.OS !== 'web' 
            }).start();
        } else {
            Animated.timing(animValue, { 
                toValue: 0, 
                duration: 250, 
                useNativeDriver: Platform.OS !== 'web' 
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    useEffect(() => {
        if (visible) {
            const targetDays = typeof offerDays === 'string' ? parseInt(offerDays, 10) : (offerDays || 0);
            let formattedSchedule: any[] = [];

            if (initialSchedule && initialSchedule.length > 0) {
                formattedSchedule = initialSchedule.map((day: any) => ({
                    day: day.day,
                    activities: day.activities.map((act: any) => {
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

    /**
     * Appends a new, empty day to the end of the schedule.
     */
    const handleAddDay = () => {
        setSchedule([
            ...schedule, 
            { 
                day: schedule.length + 1, 
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

    /**
     * Removes a specific day from the schedule and recalculates the day numbers.
     * @param {number} dayIndexToRemove - The array index of the day to delete.
     */
    const handleRemoveDay = (dayIndexToRemove: number) => {
        setSchedule(
            schedule
                .filter((_, idx) => idx !== dayIndexToRemove)
                .map((d, idx) => ({ ...d, day: idx + 1 }))
        );
    };

    /**
     * Adds an empty activity slot to a specific day.
     * @param {number} dayIndex - The array index of the day to append the activity to.
     */
    const handleAddActivity = (dayIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities.push({ 
            hourVal: '', 
            minuteVal: '', 
            periodVal: 'AM', 
            event: '' 
        });
        setSchedule(newSchedule);
    };

    /**
     * Removes a specific activity slot from a specific day.
     * @param {number} dayIndex - The array index of the day.
     * @param {number} actIndex - The array index of the activity to remove.
     */
    const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities = newSchedule[dayIndex].activities.filter(
            (_: any, idx: number) => idx !== actIndex
        );
        setSchedule(newSchedule);
    };

    /**
     * Updates a specific field within an activity.
     * @param {number} dayIndex - The array index of the day.
     * @param {number} actIndex - The array index of the activity to update.
     * @param {string} field - The object key to update (e.g., 'hourVal', 'event').
     * @param {string} value - The new value to set.
     */
    const handleUpdateActivity = (dayIndex: number, actIndex: number, field: string, value: string) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities[actIndex][field] = value;
        setSchedule(newSchedule);
    };

    /**
     * Processes the current local schedule state, parsing the time values back into Date objects,
     * and triggers the onSave callback.
     */
    const handleSave = () => {
        const finalizedSchedule = schedule.map(d => ({
            day: d.day,
            activities: d.activities.map((act: any) => ({
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
            
            <ConfirmationModal
                visible={dayToDelete !== null}
                onClose={() => setDayToDelete(null)}
                onConfirm={() => {
                    if (dayToDelete !== null) {
                        handleRemoveDay(dayToDelete.index);
                    }
                    setDayToDelete(null);
                }}
                title={lastDayToDelete ? `Remove Day ${lastDayToDelete.dayNum}?` : ''}
                message={lastDayToDelete ? `Are you sure you want to remove Day ${lastDayToDelete.dayNum} and all its activities?` : ''}
                confirmText="Remove"
                cancelText="Cancel"
                isDestructive={true}
                iconName="trash-2"
                iconLibrary="Feather"
            />

            <KeyboardAvoidingView 
                style={styles.modalContainer} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
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
                                        outputRange: isDesktop ? [50, 0] : [SCREEN_HEIGHT, 0] 
                                    }) 
                                }
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

                                        {/* --- DAY HEADER (Clean text without badges) --- */}
                                        <View style={styles.dayHeader}>
                                            <View style={styles.dayTitleRow}>
                                                <CustomIcon 
                                                    library="Feather" 
                                                    name="calendar" 
                                                    size={20} 
                                                    color={Colors.PRIMARY} 
                                                />
                                                <CustomText style={styles.dayTitle}>
                                                    Day {dayItem.day}
                                                </CustomText>
                                                <CustomText style={styles.dayCountText}>
                                                    • {dayItem.activities.length} {dayItem.activities.length === 1 ? 'Activity' : 'Activities'}
                                                </CustomText>
                                            </View>
                                            
                                            <TouchableOpacity 
                                                onPress={() => setDayToDelete({ index: dayIndex, dayNum: dayItem.day })} 
                                                style={styles.deleteDayBtn}
                                                activeOpacity={0.7}
                                            >
                                                <CustomIcon 
                                                    library="Feather" 
                                                    name="trash-2" 
                                                    size={14} 
                                                    color={Colors.TEXT_SECONDARY} 
                                                />
                                                <CustomText style={styles.deleteDayText}>
                                                    Remove
                                                </CustomText>
                                            </TouchableOpacity>
                                        </View>

                                        {/* --- TIMELINE LAYOUT --- */}
                                        <View style={styles.timelineWrapper}>
                                            {dayItem.activities.map((activity: any, actIndex: number) => {
                                                const isHourFocused = focusedField === `${dayIndex}-${actIndex}-hour`;
                                                const isMinFocused = focusedField === `${dayIndex}-${actIndex}-min`;
                                                
                                                // Check if this is the very last item in the timeline
                                                const isLast = actIndex === dayItem.activities.length - 1;

                                                return (
                                                    <View key={`act-${actIndex}`} style={styles.timelineRow}>
                                                        
                                                        {/* Timeline Line & Dot Column */}
                                                        <View style={styles.timelineGraphics}>
                                                            <View style={styles.timelineDot} />
                                                            {!isLast && <View style={styles.timelineLine} />}
                                                            {isLast && <View style={[styles.timelineLine, { height: 20 }]} />} 
                                                        </View>

                                                        {/* Activity Content Column */}
                                                        <View style={styles.activityContent}>
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

                                                                {/* Moved Delete Button Here */}
                                                                <TouchableOpacity 
                                                                    style={styles.deleteActBtn} 
                                                                    onPress={() => handleRemoveActivity(dayIndex, actIndex)} 
                                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                                >
                                                                    <CustomIcon 
                                                                        library="Feather" 
                                                                        name="minus-circle" 
                                                                        size={22} 
                                                                        color={Colors.ERROR} 
                                                                    />
                                                                </TouchableOpacity>
                                                            </View>

                                                            <View style={styles.eventInputWrapper}>
                                                                <CustomTextInput 
                                                                    placeholder="Event description (e.g. Meet up at parking)" 
                                                                    value={activity.event} 
                                                                    onChangeText={(val: string) => handleUpdateActivity(dayIndex, actIndex, 'event', val)} 
                                                                    style={styles.noMargin} 
                                                                />
                                                            </View>
                                                        </View>
                                                    </View>
                                                );
                                            })}

                                            {/* Add Activity Button appended directly to Timeline */}
                                            <View style={styles.timelineRow}>
                                                <View style={styles.timelineGraphics}>
                                                    {/* Hollow dot for the "Add" action */}
                                                    <View style={[styles.timelineDot, styles.timelineDotHollow]} />
                                                </View>
                                                <View style={[styles.activityContent, { paddingBottom: 0 }]}>
                                                    <TouchableOpacity 
                                                        style={styles.addActBtnTimeline} 
                                                        onPress={() => handleAddActivity(dayIndex)} 
                                                        activeOpacity={0.7}
                                                    >
                                                        <CustomIcon 
                                                            library="Feather" 
                                                            name="plus" 
                                                            size={16} 
                                                            color={Colors.PRIMARY} 
                                                        />
                                                        <CustomText style={styles.addActTextTimeline}>
                                                            Add Activity
                                                        </CustomText>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                                
                                <TouchableOpacity 
                                    style={styles.addDayBtn} 
                                    onPress={handleAddDay} 
                                    activeOpacity={0.8}
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
            </KeyboardAvoidingView>
        </Modal>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

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
        ...(dropShadow as any) 
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
    
    // Day Card & Header
    dayCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...dropShadow 
    },
    dayHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    dayTitleRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    dayTitle: { 
        color: Colors.PRIMARY, 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    dayCountText: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 14, 
        fontWeight: '600' 
    },
    
    // Muted Delete Day Button
    deleteDayBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        paddingVertical: 6, 
        paddingHorizontal: 10, 
        borderRadius: 8, 
        backgroundColor: Colors.GRAY_ULTRALIGHT 
    },
    deleteDayText: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 12, 
        fontWeight: 'bold' 
    },

    // --- TIMELINE STYLES ---
    timelineWrapper: { 
        paddingLeft: 0 
    },
    timelineRow: { 
        flexDirection: 'row' 
    },
    timelineGraphics: { 
        width: 30, 
        alignItems: 'center' 
    },
    timelineDot: { 
        width: 10, 
        height: 10, 
        borderRadius: 5, 
        backgroundColor: Colors.PRIMARY, 
        marginTop: 22 
    },
    timelineDotHollow: { 
        backgroundColor: Colors.WHITE, 
        borderWidth: 2, 
        borderColor: Colors.PRIMARY, 
        marginTop: 14 
    },
    timelineLine: { 
        width: 2, 
        flex: 1, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginTop: 4, 
        marginBottom: -22 
    },
    activityContent: { 
        flex: 1, 
        paddingBottom: 32 
    },
    
    // Time Row Inside Timeline
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
        height: 50, 
        width: 50, 
        justifyContent: 'center', 
        alignItems: 'center' 
    }, // Slightly smaller inputs to fit everything beautifully
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
        ...Platform.select({ web: { outlineStyle: 'none' } as any }) 
    },
    timeColon: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 2 
    },
    
    // Toggles & Inputs
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
        height: 50, 
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
    deleteActBtn: { 
        padding: 4, 
        marginLeft: 4 
    },
    eventInputWrapper: { 
        width: '100%' 
    },
    noMargin: { 
        marginBottom: 0 
    },
    
    // Action Buttons
    addActBtnTimeline: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 1, 
        gap: 6, 
        marginTop: 4 
    },
    addActTextTimeline: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 15 
    },
    
    addDayBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 18, 
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
    
    // Empty State
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
        backgroundColor: Colors.BUTTON_OUTLINE_BG, 
        paddingHorizontal: 24, 
        paddingVertical: 12, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.BUTTON_OUTLINE_BORDER 
    },
    startDayText: { 
        color: Colors.BUTTON_OUTLINE_TEXT, 
        fontWeight: 'bold' 
    },
    
    // Footer
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