import React, { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomSelectionModal from '@/src/components/CustomSelectionModal';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import DynamicListBuilder from '@/src/components/DynamicListBuilder';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import ScheduleBuilderModal from '@/src/features/Admin/screens/Offer/components/ScheduleBuilderModal';

const PRESET_DOCS = ["Valid ID", "Medical Certificate"];
const PRESET_INC = ["Guide Fee"];
const PRESET_BRING = ["Water (2L+)", "Trail Snacks", "Extra Clothes", "First-aid kit", "Headlamp", "Tent"];

const OfferWriteScreen = ({
    offer,
    trails,
    isLoading,
    error,
    onSubmitOffer,
    onDeleteOffer,
    onUpdateOffer,
    onBackPress
}) => {
    const isEditing = Boolean(offer?.id && offer.id !== '');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [docInput, setDocInput] = useState('');
    const [incInput, setIncInput] = useState('');
    const [bringInput, setBringInput] = useState('');
    
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [showTrailModal, setShowTrailModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showBackWarningModal, setShowBackWarningModal] = useState(false);
    const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

    const [days, setDays] = useState('');
    const [nights, setNights] = useState('');
    const [focusedField, setFocusedField] = useState(null);

    const prevStartDate = useRef(offer?.date);
    const prevEndDate = useRef(offer?.endDate);

    useEffect(() => {
        if (!isEditing) {
            onUpdateOffer({ section: 'root', id: 'date', value: null });
            onUpdateOffer({ section: 'root', id: 'endDate', value: null });
        }
    }, []);

    const handleUpdate = (params) => {
        setHasUnsavedChanges(true);
        onUpdateOffer(params);
    };

    useEffect(() => {
        if (offer?.date && offer?.endDate) {
            const start = new Date(offer.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(offer.endDate);
            end.setHours(0, 0, 0, 0);

            if (end.getTime() < start.getTime()) {
                handleUpdate({ section: 'root', id: 'endDate', value: offer.date });
                return; 
            }

            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const calcDays = diffDays + 1;
            const calcNights = diffDays;

            setDays(String(calcDays));
            setNights(String(calcNights));

            let durString = '';
            if (calcDays > 0) durString += `${calcDays} Day${calcDays > 1 ? 's' : ''}`;
            if (calcDays > 0 && calcNights > 0) durString += ', ';
            if (calcNights > 0) durString += `${calcNights} Night${calcNights > 1 ? 's' : ''}`;

            if (offer.duration !== durString) {
                handleUpdate({ section: 'root', id: 'duration', value: durString });
            }
        } else if (offer?.schedule?.length > 0) {
            const calcDays = offer.schedule.length;
            const calcNights = calcDays > 0 ? calcDays - 1 : 0;

            setDays(String(calcDays));
            setNights(String(calcNights));

            let durString = '';
            if (calcDays > 0) durString += `${calcDays} Day${calcDays > 1 ? 's' : ''}`;
            if (calcDays > 0 && calcNights > 0) durString += ', ';
            if (calcNights > 0) durString += `${calcNights} Night${calcNights > 1 ? 's' : ''}`;

            if (offer.duration !== durString) {
                handleUpdate({ section: 'root', id: 'duration', value: durString });
            }
        } else {
            setDays('');
            setNights('');
            if (offer.duration !== '') {
                handleUpdate({ section: 'root', id: 'duration', value: '' });
            }
        }
        
        prevStartDate.current = offer?.date;
        prevEndDate.current = offer?.endDate;

    }, [offer?.date, offer?.endDate, offer?.schedule?.length]);

    const handleStartDateChange = (val) => {
        handleUpdate({ section: 'root', id: 'date', value: val });
        
        const scheduleLength = offer?.schedule?.length || 0;
        if (val && scheduleLength > 0) {
            const newEnd = new Date(val);
            newEnd.setHours(0, 0, 0, 0);
            newEnd.setDate(newEnd.getDate() + scheduleLength - 1);
            handleUpdate({ section: 'root', id: 'endDate', value: newEnd });
        }
    };

    const handleEndDateChange = (val) => {
        handleUpdate({ section: 'root', id: 'endDate', value: val });

        if (offer?.date && val) {
            const start = new Date(offer.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(val);
            end.setHours(0, 0, 0, 0);
            
            if (end >= start) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const targetDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                
                let currentSchedule = Array.isArray(offer?.schedule) ? [...offer.schedule] : [];
                
                if (currentSchedule.length < targetDays) {
                    const daysToAdd = targetDays - currentSchedule.length;
                    for (let i = 0; i < daysToAdd; i++) {
                        currentSchedule.push({ 
                            day: currentSchedule.length + 1, 
                            activities: [{ hourVal: '', minuteVal: '', periodVal: 'AM', event: '' }] 
                        });
                    }
                    handleUpdate({ section: 'root', id: 'schedule', value: currentSchedule });
                } else if (currentSchedule.length > targetDays) {
                    currentSchedule = currentSchedule.slice(0, targetDays);
                    handleUpdate({ section: 'root', id: 'schedule', value: currentSchedule });
                }
            }
        }
    };

    const handleAddToArray = (field, currentArray, value) => {
        if (!value.trim()) return;
        const arr = Array.isArray(currentArray) ? currentArray : [];
        if (arr.includes(value.trim())) return;
        const newArray = [...arr, value.trim()];
        handleUpdate({ section: 'root', id: field, value: newArray });
    };

    const handleRemoveFromArray = (field, currentArray, valueToRemove) => {
        const arr = Array.isArray(currentArray) ? currentArray : [];
        const newArray = arr.filter((item) => item !== valueToRemove);
        handleUpdate({ section: 'root', id: field, value: newArray });
    };

    const handleTogglePreset = (field, currentArray, presetValue) => {
        const arr = Array.isArray(currentArray) ? currentArray : [];
        if (arr.includes(presetValue)) {
            handleUpdate({ section: 'root', id: field, value: arr.filter(i => i !== presetValue) });
        } else {
            handleUpdate({ section: 'root', id: field, value: [...arr, presetValue] });
        }
    };

    const isFormValid = () => {
        const hasTrail = Boolean(offer?.trail?.id);
        const hasDesc = Boolean(offer?.description && offer.description.trim() !== '');
        const hasPrice = Boolean(offer?.price && Number(offer.price) > 0);
        const hasDate = Boolean(offer?.date);
        const hasEndDate = Boolean(offer?.endDate);
        const hasDuration = Boolean(offer?.duration && offer.duration.trim() !== '');
        const hasMinPax = Boolean(offer?.minPax && Number(offer.minPax) > 0);
        const hasMaxPax = Boolean(offer?.maxPax && Number(offer.maxPax) >= Number(offer.minPax));

        return hasTrail && hasDesc && hasPrice && hasDate && hasEndDate && hasDuration && hasMinPax && hasMaxPax;
    };

    const isReadyToSubmit = isFormValid() && !isLoading;

    const totalDays = Number(days) || 0;
    const totalActivities = offer?.schedule?.reduce((acc, curr) => {
        const validActivies = curr.activities?.reduce(act => act.event.trim() !== '') || [];
        return acc + validActivies.length;
    }, 0) || 0;

    const handleHeaderBack = () => {
        if (hasUnsavedChanges) {
            setShowBackWarningModal(true);
        } else {
            onBackPress();
        }
    };

    const handleSaveClick = () => {
        if (!isReadyToSubmit) return;
        
        if (docInput.trim()) { 
            handleAddToArray('documents', offer.documents, docInput); 
            setDocInput(''); 
        }
        if (incInput.trim()) { 
            handleAddToArray('inclusions', offer.inclusions, incInput); 
            setIncInput(''); 
        }
        if (bringInput.trim()) { 
            handleAddToArray('thingsToBring', offer.thingsToBring, bringInput); 
            setBringInput(''); 
        }

        if (Array.isArray(offer.reminders)) {
            const cleanedReminders = offer.reminders
                .map(line => line.replace(/^[•\-*]\s*/, '').trim())
                .filter(line => line !== '');
            
            handleUpdate({ section: 'root', id: 'reminders', value: cleanedReminders });
        }

        setTimeout(() => {
            if (isEditing && hasUnsavedChanges) {
                setShowSaveConfirmModal(true);
            } else {
                onSubmitOffer();
            }
        }, 100);
    };

    const trailOptions = trails ? trails.map(trail => ({
        label: trail.general?.name || "Unnamed Trail",
        value: trail.id,
        originalData: trail
    })) : [];

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={isEditing ? "Edit Offer" : "Add New Offer"} 
                centerTitle={true}
                onBackPress={handleHeaderBack} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>

                    <View style={styles.formCard}>
                        
                        <View style={styles.fieldContainer}>
                            <CustomText variant="label" style={styles.fieldLabel}>
                                Select Trail *
                            </CustomText>
                            <TouchableOpacity 
                                style={styles.dropdownButton} 
                                onPress={() => setShowTrailModal(true)} 
                                activeOpacity={0.7}
                            >
                                <CustomText style={offer?.trail?.name ? styles.dropdownText : styles.dropdownPlaceholder}>
                                    {offer?.trail?.name || "Select a trail..."}
                                </CustomText>
                                <CustomIcon 
                                    library="Feather" 
                                    name="chevron-down" 
                                    size={20} 
                                    color={Colors.TEXT_SECONDARY} 
                                />
                            </TouchableOpacity>
                        </View>

                        <CustomTextInput 
                            label="Description *" 
                            placeholder="Type the full description here..."
                            value={offer.description}
                            onChangeText={(text) => handleUpdate({ section: 'root', id: 'description', value: text })}
                            multiline={true} 
                            numberOfLines={5}
                            style={styles.noMarginBottom} 
                            inputStyle={styles.textArea}
                        />

                        <CustomTextInput 
                            label="Price per Pax *" 
                            placeholder="0" 
                            prefix="₱" 
                            value={offer.price ? String(offer.price) : ''}
                            keyboardType="numeric"
                            onChangeText={(text) => handleUpdate({ section: 'root', id: 'price', value: Number(text) || 0 })}
                            style={styles.noMarginBottom}
                        />

                        <View style={styles.fieldContainer}>
                            <CustomText variant="label" style={styles.fieldLabel}>
                                Pax Capacity *
                            </CustomText>
                            <View style={styles.inlineRowContainer}>
                                
                                <View style={[styles.durationWrapper, focusedField === 'minPax' && styles.wrapperFocused]}>
                                    <View style={styles.durationInputHalf}>
                                        <TextInput 
                                            placeholder="0" 
                                            value={offer.minPax ? String(offer.minPax) : ''}
                                            keyboardType="numeric"
                                            onChangeText={(text) => handleUpdate({ section: 'root', id: 'minPax', value: Number(text) || 0 })}
                                            style={styles.durationInput} 
                                            placeholderTextColor={Colors.TEXT_SECONDARY}
                                            onFocus={() => setFocusedField('minPax')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </View>
                                    <View style={styles.verticalDivider} />
                                    <View style={styles.durationLabelHalf}>
                                        <CustomText style={styles.durationLabelText}>Min</CustomText>
                                    </View>
                                </View>
                                
                                <View style={styles.dividerContainer}>
                                    <CustomText style={styles.dividerText}>-</CustomText>
                                </View>
                                
                                <View style={[styles.durationWrapper, focusedField === 'maxPax' && styles.wrapperFocused]}>
                                    <View style={styles.durationInputHalf}>
                                        <TextInput 
                                            placeholder="0" 
                                            value={offer.maxPax ? String(offer.maxPax) : ''}
                                            keyboardType="numeric"
                                            onChangeText={(text) => handleUpdate({ section: 'root', id: 'maxPax', value: Number(text) || 0 })}
                                            style={styles.durationInput} 
                                            placeholderTextColor={Colors.TEXT_SECONDARY}
                                            onFocus={() => setFocusedField('maxPax')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                    </View>
                                    <View style={styles.verticalDivider} />
                                    <View style={styles.durationLabelHalf}>
                                        <CustomText style={styles.durationLabelText}>Max</CustomText>
                                    </View>
                                </View>

                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <View style={styles.inlineRowContainer}>
                                <View style={styles.flexHalf}>
                                    <CustomTextInput 
                                        type="calendar" 
                                        label="Start Date *" 
                                        placeholder="Select Date"
                                        value={offer.date || null}
                                        onChangeText={handleStartDateChange}
                                        allowFutureDates={true} 
                                        showTodayButton={true} 
                                        defaultMode="date" 
                                        style={styles.noMarginBottom}
                                        dateFormat="MM/DD/YY"
                                    />
                                </View>
                                <View style={styles.dateDividerContainer}>
                                    <CustomText style={styles.dividerText}>-</CustomText>
                                </View>
                                <View style={styles.flexHalf}>
                                    <CustomTextInput 
                                        type="calendar" 
                                        label="End Date *" 
                                        placeholder="Select Date"
                                        value={offer.endDate || null}
                                        onChangeText={handleEndDateChange}
                                        allowFutureDates={true} 
                                        showTodayButton={true} 
                                        defaultMode="date" 
                                        style={styles.noMarginBottom}
                                        dateFormat="MM/DD/YY"
                                    />
                                </View>
                            </View>
                        </View>
                            
                        <View style={styles.fieldContainer}>
                            <CustomText variant="label" style={styles.fieldLabel}>
                                Itinerary & Schedule *
                            </CustomText>
                            <TouchableOpacity 
                                style={styles.scheduleCard} 
                                onPress={() => setShowScheduleModal(true)} 
                                activeOpacity={0.7}
                            >
                                <View>
                                    <CustomText style={styles.scheduleTitle}>
                                        {totalDays > 0 ? `${totalDays} Days Set` : "No Schedule Set"}
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.scheduleSubtitle}>
                                        {totalActivities} total activities planned
                                    </CustomText>
                                </View>
                                <CustomIcon 
                                    library="Feather" 
                                    name="edit-3" 
                                    size={20} 
                                    color={Colors.PRIMARY} 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.fieldContainer}>
                            <CustomText variant="label" style={styles.fieldLabel}>
                                Duration (Auto-calculated) *
                            </CustomText>
                            <View style={styles.inlineRowContainer}>
                                <View style={[styles.durationWrapper, { backgroundColor: Colors.GRAY_ULTRALIGHT }]}>
                                    <View style={styles.durationInputHalf}>
                                        <TextInput 
                                            placeholder="00" 
                                            value={days}
                                            editable={false} 
                                            style={[styles.durationInput, { color: Colors.TEXT_SECONDARY }]} 
                                        />
                                    </View>
                                    <View style={styles.verticalDivider} />
                                    <View style={[styles.durationLabelHalf, { backgroundColor: Colors.GRAY_ULTRALIGHT }]}>
                                        <CustomText style={styles.durationLabelText}>Days</CustomText>
                                    </View>
                                </View>
                                
                                <View style={styles.dividerContainer}>
                                    <CustomText style={styles.dividerText}>-</CustomText>
                                </View>
                                
                                <View style={[styles.durationWrapper, { backgroundColor: Colors.GRAY_ULTRALIGHT }]}>
                                    <View style={styles.durationInputHalf}>
                                        <TextInput 
                                            placeholder="00" 
                                            value={nights}
                                            editable={false} 
                                            style={[styles.durationInput, { color: Colors.TEXT_SECONDARY }]} 
                                        />
                                    </View>
                                    <View style={styles.verticalDivider} />
                                    <View style={[styles.durationLabelHalf, { backgroundColor: Colors.GRAY_ULTRALIGHT }]}>
                                        <CustomText style={styles.durationLabelText}>Nights</CustomText>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <DynamicListBuilder 
                            label="Required Documents *" 
                            placeholder="e.g. Valid ID" 
                            items={Array.isArray(offer.documents) ? offer.documents : []} 
                            inputValue={docInput} 
                            setInputValue={setDocInput} 
                            onAddItem={(val) => handleAddToArray('documents', offer.documents, val)}
                            onRemoveItem={(val) => handleRemoveFromArray('documents', offer.documents, val)} 
                            presets={PRESET_DOCS}
                            onTogglePreset={(val) => handleTogglePreset('documents', offer.documents, val)}
                        />

                        <DynamicListBuilder 
                            label="Inclusions" 
                            placeholder="e.g. Guide Fee" 
                            items={Array.isArray(offer.inclusions) ? offer.inclusions : []} 
                            inputValue={incInput} 
                            setInputValue={setIncInput} 
                            onAddItem={(val) => handleAddToArray('inclusions', offer.inclusions, val)}
                            onRemoveItem={(val) => handleRemoveFromArray('inclusions', offer.inclusions, val)}
                            presets={PRESET_INC}
                            onTogglePreset={(val) => handleTogglePreset('inclusions', offer.inclusions, val)}
                        />

                        <DynamicListBuilder 
                            label="Things to Bring" 
                            placeholder="e.g. 2L Water" 
                            items={Array.isArray(offer.thingsToBring) ? offer.thingsToBring : []} 
                            inputValue={bringInput} 
                            setInputValue={setBringInput} 
                            onAddItem={(val) => handleAddToArray('thingsToBring', offer.thingsToBring, val)}
                            onRemoveItem={(val) => handleRemoveFromArray('thingsToBring', offer.thingsToBring, val)}
                            presets={PRESET_BRING}
                            onTogglePreset={(val) => handleTogglePreset('thingsToBring', offer.thingsToBring, val)}
                        />

                        <CustomFeedbackInput 
                            label="Reminders" 
                            helperText="Tip: Type each reminder on a new line. They will automatically become bullet points for the hikers."
                            placeholder="e.g. Non-refundable. Please arrive 30 minutes early..."
                            value={Array.isArray(offer.reminders) ? offer.reminders.join('\n') : (offer.reminders || '')} 
                            onChangeText={(text) => handleUpdate({ section: 'root', id: 'reminders', value: text.split('\n') })}
                            suggestions={[
                                "Strictly Non-refundable",
                                "Arrive 30 mins before call time",
                                "Subject to weather conditions",
                                "Bring physical Valid ID"
                            ]}
                            style={styles.noMarginBottom}
                        />

                        {error && <ErrorMessage error={error} />}

                        <View style={styles.buttonContainer}>
                            <CustomButton 
                                title={isLoading ? "Saving..." : "Save Offer"}
                                onPress={handleSaveClick}
                                variant="primary"
                                style={!isReadyToSubmit ? styles.disabledButton : undefined}
                            />
                            
                            {isEditing && (
                                <CustomButton 
                                    title="Delete Offer"
                                    onPress={() => setIsDeleteModalVisible(true)}
                                    variant="outline"
                                    style={[styles.deleteBtn, isLoading && styles.disabledButton]}
                                    textStyle={{ color: Colors.ERROR }}
                                />
                            )}
                        </View>

                    </View>
                </View>
            </ScrollView>

            <CustomSelectionModal 
                visible={showTrailModal}
                onClose={() => setShowTrailModal(false)}
                title="Select Trail"
                options={trailOptions}
                selectedValue={offer?.trail?.id}
                onSelect={(selected) => {
                    handleUpdate({ 
                        section: 'root', 
                        id: 'trail', 
                        value: { id: selected.value, name: selected.label } 
                    });
                    setShowTrailModal(false);
                }}
            />

            <ScheduleBuilderModal 
                visible={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                initialSchedule={offer.schedule}
                offerDays={Number(days) || 0}
                onSave={(newSchedule) => {
                    handleUpdate({ section: 'root', id: 'schedule', value: newSchedule });
                    setShowScheduleModal(false);

                    const newDaysCount = newSchedule.length;
                    if (offer.date && newDaysCount > 0) {
                        const start = new Date(offer.date);
                        start.setHours(0,0,0,0);
                        start.setDate(start.getDate() + newDaysCount - 1);
                        handleUpdate({ section: 'root', id: 'endDate', value: start }); 
                    }
                }}
            />

            <ConfirmationModal 
                visible={isDeleteModalVisible} 
                title="Delete Offer?" 
                message="Are you sure you want to permanently delete this offer?" 
                confirmText={isLoading ? "Deleting..." : "Delete"} 
                cancelText="Cancel" 
                onConfirm={() => { 
                    setIsDeleteModalVisible(false); 
                    onDeleteOffer(offer.id); 
                }} 
                onClose={() => setIsDeleteModalVisible(false)} 
                isDestructive={true}
                iconName="trash-2"
            />
            
            <ConfirmationModal 
                visible={showBackWarningModal} 
                title="Discard Changes?" 
                message="You have unsaved changes. Leave without saving?" 
                confirmText="Discard" 
                cancelText="Keep Editing" 
                onConfirm={() => { 
                    setShowBackWarningModal(false); 
                    onBackPress(); 
                }} 
                onClose={() => setShowBackWarningModal(false)} 
                isDestructive={true}
                iconName="alert-triangle"
            />
            
            <ConfirmationModal 
                visible={showSaveConfirmModal} 
                title="Save Changes?" 
                message="Apply these changes to all new hikers?" 
                confirmText={isLoading ? "Saving..." : "Save Changes"} 
                cancelText="Cancel" 
                onConfirm={() => { 
                    setShowSaveConfirmModal(false); 
                    onSubmitOffer(); 
                }} 
                onClose={() => setShowSaveConfirmModal(false)} 
            />

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingVertical: 24, 
        paddingHorizontal: 16 
    },
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center',
        flex: 1,
    },
    formCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        paddingVertical: 24, 
        paddingHorizontal: 16, 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 2, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 24,
    },
    fieldContainer: {
        gap: 8,
    },
    fieldLabel: { 
        marginLeft: 4, 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold' 
    },
    dropdownButton: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderRadius: 12, 
        backgroundColor: Colors.BACKGROUND 
    },
    dropdownText: { 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 16 
    },
    dropdownPlaceholder: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 16 
    },
    scheduleCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed' 
    },
    scheduleTitle: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold', 
        marginBottom: 4 
    },
    scheduleSubtitle: { 
        color: Colors.TEXT_SECONDARY 
    },
    inlineRowContainer: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    dividerContainer: { 
        paddingHorizontal: 12, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    dateDividerContainer: { 
        paddingHorizontal: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 20 
    },
    dividerText: { 
        fontSize: 24, 
        color: Colors.GRAY_MEDIUM, 
        fontWeight: '300' 
    },
    flexHalf: { 
        flex: 1 
    },
    noMarginBottom: { 
        marginBottom: 0
    },
    durationWrapper: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderRadius: 12, 
        backgroundColor: Colors.BACKGROUND, 
        height: 54, 
        overflow: 'hidden', 
        paddingHorizontal: 0 
    },
    wrapperFocused: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.WHITE,
    },
    durationInputHalf: { 
        flex: 1, 
        height: '100%', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    durationInput: { 
        width: '100%', 
        fontSize: 16, 
        color: Colors.TEXT_PRIMARY, 
        textAlign: 'center', 
        outlineStyle: 'none' 
    },
    verticalDivider: { 
        width: 1, 
        height: 32, 
        backgroundColor: Colors.GRAY_LIGHT 
    },
    durationLabelHalf: { 
        flex: 1, 
        height: '100%', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE 
    },
    durationLabelText: { 
        fontSize: 15, 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: '500' 
    },
    textArea: { 
        minHeight: 140, 
        height: 140, 
        textAlignVertical: 'top', 
        paddingTop: 16, 
        paddingBottom: 16 
    },
    buttonContainer: { 
        marginTop: 8,
        gap: 12 
    },
    deleteBtn: { 
        borderColor: Colors.ERROR 
    },
    disabledButton: { 
        opacity: 0.5 
    }
});

export default OfferWriteScreen;