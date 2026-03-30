import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomDropdown from '@/src/components/CustomDropdown';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';

const formatTime = (dateObj) => {
    if (!dateObj) return '';
    try {
        const d = new Date(dateObj);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
};

const parseTimeToDate = (timeString) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); 
    
    try {
        const [timePart, period] = timeString.split(' ');
        let [hours, minutes] = timePart ? timePart.split(':') : ['', ''];
        
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10) || 0;

        if (isNaN(hours)) hours = 0; 

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        d.setHours(hours, minutes, 0, 0);
    } catch(e) {

    }
    
    return d; 
};

const PERIOD_OPTIONS = ['AM', 'PM']; 

const ScheduleBuilderModal = ({ visible, onClose, onSave, initialSchedule = [] }) => {
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        if (visible) {
            if (initialSchedule && initialSchedule.length > 0) {
                const formattedSchedule = initialSchedule.map(day => ({
                    day: day.day,
                    activities: day.activities.map(act => {
                        const fullTimeStr = formatTime(act.time); 
                        const [timePart, period] = fullTimeStr.split(' ');
                        const [h, m] = timePart ? timePart.split(':') : ['', ''];
                        
                        return {
                            hourVal: h || '',
                            minuteVal: m || '',
                            periodVal: period || '',
                            event: act.event
                        };
                    })
                }));
                setSchedule(formattedSchedule);
            } else {

                setSchedule([{ day: 1, activities: [{ hourVal: '', minuteVal: '', periodVal: '', event: '' }] }]);
            }
        }
    }, [visible, initialSchedule]);

    const handleAddDay = () => {
        const nextDayNum = schedule.length + 1;

        setSchedule([...schedule, { day: nextDayNum, activities: [{ hourVal: '', minuteVal: '', periodVal: '', event: '' }] }]);
    };

    const handleRemoveDay = (dayIndex) => {
        const newSchedule = schedule.filter((_, idx) => idx !== dayIndex);
        const renumbered = newSchedule.map((d, i) => ({ ...d, day: i + 1 }));
        setSchedule(renumbered);
    };

    const handleAddActivity = (dayIndex) => {
        const newSchedule = [...schedule];

        newSchedule[dayIndex].activities.push({ hourVal: '', minuteVal: '', periodVal: '', event: '' });
        setSchedule(newSchedule);
    };

    const handleRemoveActivity = (dayIndex, actIndex) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].activities = newSchedule[dayIndex].activities.filter((_, idx) => idx !== actIndex);
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

    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    
                    <View style={styles.modalHeader}>
                        <CustomText variant="h2">Build Itinerary</CustomText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {schedule.map((dayItem, dayIndex) => (
                            <View key={`day-${dayIndex}`} style={styles.dayCard}>
                                
                                <View style={styles.dayHeader}>
                                    <CustomText style={styles.dayTitle}>
                                        Day {dayItem.day}
                                    </CustomText>
                                    <TouchableOpacity onPress={() => handleRemoveDay(dayIndex)}>
                                        <CustomText style={styles.deleteDayText}>Delete Day</CustomText>
                                    </TouchableOpacity>
                                </View>

                                {dayItem.activities.map((activity, actIndex) => (
                                    <View key={`act-${actIndex}`} style={styles.activityBlock}>
                                        
                                        <View style={styles.activityTimeRow}>
                                            
                                            <View style={styles.timeInputContainer}>
                                                <View style={styles.timeInputBox}>
                                                    <TextInput 
                                                        placeholder="08"
                                                        value={activity.hourVal}
                                                        keyboardType="numeric"
                                                        maxLength={2}
                                                        onChangeText={(val) => handleUpdateActivity(dayIndex, actIndex, 'hourVal', val)}
                                                        style={styles.rawTimeInput}
                                                        placeholderTextColor={Colors.TEXT_SECONDARY}
                                                    />
                                                </View>

                                                <CustomText style={styles.timeColon}>:</CustomText>

                                                <View style={styles.timeInputBox}>
                                                    <TextInput 
                                                        placeholder="00"
                                                        value={activity.minuteVal}
                                                        keyboardType="numeric"
                                                        maxLength={2}
                                                        onChangeText={(val) => handleUpdateActivity(dayIndex, actIndex, 'minuteVal', val)}
                                                        style={styles.rawTimeInput}
                                                        placeholderTextColor={Colors.TEXT_SECONDARY}
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.dropdownWrapper}>
                                                <View style={styles.dropdownContainerOverride}>
                                                    <CustomDropdown 
                                                        options={PERIOD_OPTIONS} 
                                                        value={activity.periodVal}
                                                        onSelect={(val) => handleUpdateActivity(dayIndex, actIndex, 'periodVal', val)} 
                                                        placeholder="AM/PM" 
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.deleteActWrapper}>
                                                <TouchableOpacity 
                                                    style={styles.deleteActBtn}
                                                    onPress={() => handleRemoveActivity(dayIndex, actIndex)}
                                                >
                                                    <CustomIcon library="Feather" name="minus-circle" size={24} color={Colors.ERROR} />
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
                                ))}

                                <TouchableOpacity style={styles.addActBtn} onPress={() => handleAddActivity(dayIndex)}>
                                    <CustomIcon library="Feather" name="plus" size={14} color={Colors.PRIMARY} />
                                    <CustomText style={styles.addActText}>Add Activity</CustomText>
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addDayBtn} onPress={handleAddDay}>
                            <CustomText style={styles.addDayText}>+ Add Another Day</CustomText>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.footer}>
                        <CustomButton title="Save Itinerary" onPress={handleSave} variant="primary" />
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.BACKGROUND,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%', 
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    closeBtn: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    
    dayCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT, 
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20, 
    },
    dayTitle: {
        color: Colors.PRIMARY,
        fontSize: 16,
        fontWeight: 'bold', 
    },
    deleteDayText: {
        color: Colors.ERROR,
        fontSize: 12,
        fontWeight: 'bold',
    },
    
    activityBlock: {
        marginBottom: 20, 
    },
    activityTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12, 
        gap: 12, 
    },

    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeInputBox: {
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderRadius: 12,
        backgroundColor: Colors.WHITE,
        height: 54, 
        width: 54, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    rawTimeInput: {
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
        width: '100%',
        padding: 0,
        margin: 0,
        outlineStyle: 'none', 
    },
    timeColon: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2, 
    },

    dropdownWrapper: {
        width: 100, 
    },
    dropdownContainerOverride: {
        marginBottom: -16, 
    },

    deleteActWrapper: {
        flex: 1,
        alignItems: 'flex-end', 
    },
    deleteActBtn: {
        padding: 4,
    },
    eventInputWrapper: {
        width: '100%', 
    },
    noMargin: {
        marginBottom: 0,
    },

    addActBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6,
        marginTop: -4, 
    },
    addActText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
    
    addDayBtn: {
        backgroundColor: Colors.WHITE,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderStyle: 'dashed',
    },
    addDayText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
});

export default ScheduleBuilderModal;