import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import DynamicListBuilder from '@/src/components/DynamicListBuilder';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import ScheduleBuilderModal from '@/src/features/Admin/components/ScheduleBuilderModal';

const PRESET_DOCS = ["Valid ID", "Medical Certificate", "Waiver"];
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
    const [focusedDuration, setFocusedDuration] = useState(null);

    const prevStartDate = useRef(offer?.date);
    const prevEndDate = useRef(offer?.endDate);

    useEffect(() => {
        if (!isEditing) {
            onUpdateOffer({ section: 'root', id: 'date', value: null });
            onUpdateOffer({ section: 'root', id: 'endDate', value: null });
        }
    }, []);

    useEffect(() => {
        if (offer?.duration) {
            const dMatch = offer.duration.match(/(\d+)\s*Day/i);
            const nMatch = offer.duration.match(/(\d+)\s*Night/i);
            if (dMatch) setDays(dMatch[1]);
            if (nMatch) setNights(nMatch[1]);
        }
    }, [offer?.id]);

    const handleUpdate = (params) => {
        setHasUnsavedChanges(true);
        onUpdateOffer(params);
    };

    // AUTO-CALCULATION LOGIC
    useEffect(() => {
        // Skip if dates haven't actually changed
        if (offer?.date === prevStartDate.current && offer?.endDate === prevEndDate.current) {
            return;
        }

        if (offer?.date && offer?.endDate) {
            const start = new Date(offer.date);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(offer.endDate);
            end.setHours(0, 0, 0, 0);

            // 1. Strict Auto-Correction: End Date cannot be before Start Date
            if (end.getTime() < start.getTime()) {
                handleUpdate({ section: 'root', id: 'endDate', value: offer.date });
                return; // Exit and let the effect re-trigger with the corrected date
            }

            // 2. Calculate Duration Math
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const calcDays = diffDays + 1;
            const calcNights = diffDays;

            setDays(String(calcDays));
            setNights(String(calcNights));

            // Generate duration string
            let durString = '';
            if (calcDays > 0) durString += `${calcDays} Day${calcDays > 1 ? 's' : ''}`;
            if (calcDays > 0 && calcNights > 0) durString += ', ';
            if (calcNights > 0) durString += `${calcNights} Night${calcNights > 1 ? 's' : ''}`;

            // Update the global offer state if it doesn't match
            if (offer.duration !== durString) {
                handleUpdate({ section: 'root', id: 'duration', value: durString });
            }
        } else {
            // Fallback: If dates are null (e.g. New Offer), clear local duration state
            setDays('');
            setNights('');
        }
        
        // Update refs for next change
        prevStartDate.current = offer?.date;
        prevEndDate.current = offer?.endDate;

    }, [offer?.date, offer?.endDate]);


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

    const handleDurationChange = (type, value) => {
        const newDays = type === 'days' ? value : days;
        const newNights = type === 'nights' ? value : nights;
        
        if (type === 'days') setDays(value);
        if (type === 'nights') setNights(value);

        let durString = '';
        if (newDays && Number(newDays) > 0) durString += `${newDays} Day${newDays > 1 ? 's' : ''}`;
        if (newDays && newNights && Number(newDays) > 0 && Number(newNights) > 0) durString += ', ';
        if (newNights && Number(newNights) > 0) durString += `${newNights} Night${newNights > 1 ? 's' : ''}`;
        
        handleUpdate({ section: 'root', id: 'duration', value: durString });
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

    const totalDays = offer?.schedule?.length || 0;
    const totalActivities = offer?.schedule?.reduce((acc, curr) => acc + (curr.activities?.length || 0), 0) || 0;

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

        setTimeout(() => {
            if (isEditing && hasUnsavedChanges) {
                setShowSaveConfirmModal(true);
            } else {
                onSubmitOffer();
            }
        }, 100);
    };

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
                <View style={styles.formCard}>
                    
                    <CustomText variant="label" style={styles.multiSelectLabel}>
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
                        <CustomIcon library="Feather" name="chevron-down" size={20} color={Colors.TEXT_SECONDARY} />
                    </TouchableOpacity>

                    <CustomTextInput 
                        label="Price per Pax *"
                        placeholder="0"
                        prefix="₱" 
                        value={offer.price ? String(offer.price) : ''}
                        keyboardType="numeric"
                        onChangeText={(text) => handleUpdate({ section: 'root', id: 'price', value: Number(text) || 0 })}
                        style={styles.inputSpacing}
                    />

                    <CustomTextInput 
                        label="Description *"
                        placeholder="Type the full description here..."
                        value={offer.description}
                        onChangeText={(text) => handleUpdate({ section: 'root', id: 'description', value: text })}
                        multiline={true}
                        numberOfLines={5}
                        style={styles.inputSpacing}
                        inputStyle={styles.textArea}
                    />

                    <View style={styles.inlineRowContainer}>
                        <View style={styles.flexHalf}>
                            <CustomTextInput 
                                type="calendar"
                                label="Start Date *"
                                placeholder="Select Date"
                                value={offer.date || null}
                                onChangeText={(val) => handleUpdate({ section: 'root', id: 'date', value: val })}
                                allowFutureDates={true}
                                showTodayButton={true}
                                defaultMode="date"
                                style={styles.noMarginBottom}
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
                                onChangeText={(val) => handleUpdate({ section: 'root', id: 'endDate', value: val })}
                                allowFutureDates={true}
                                showTodayButton={true}
                                defaultMode="date"
                                style={styles.noMarginBottom}
                            />
                        </View>
                    </View>

                    <CustomText variant="label" style={[styles.multiSelectLabel, { marginTop: 16 }]}>
                        Duration *
                    </CustomText>
                    <View style={styles.inlineRowContainer}>
                        
                        <View style={[
                            styles.durationWrapper, 
                            focusedDuration === 'days' && styles.activeBorder
                        ]}>
                            <View style={styles.durationInputHalf}>
                                <TextInput 
                                    placeholder="00"
                                    value={days}
                                    keyboardType="numeric"
                                    maxLength={2}
                                    onChangeText={(val) => handleDurationChange('days', val)}
                                    style={styles.durationInput}
                                    placeholderTextColor={Colors.TEXT_SECONDARY}
                                    onFocus={() => setFocusedDuration('days')}
                                    onBlur={() => setFocusedDuration(null)}
                                />
                            </View>
                            
                            <View style={styles.verticalDivider} />
                            
                            <View style={styles.durationLabelHalf}>
                                <CustomText style={styles.durationLabelText}>Days</CustomText>
                            </View>
                        </View>
                        
                        <View style={styles.dividerContainer}>
                            <CustomText style={styles.dividerText}>-</CustomText>
                        </View>
                        
                        <View style={[
                            styles.durationWrapper, 
                            focusedDuration === 'nights' && styles.activeBorder
                        ]}>
                            <View style={styles.durationInputHalf}>
                                <TextInput 
                                    placeholder="00"
                                    value={nights}
                                    keyboardType="numeric"
                                    maxLength={2}
                                    onChangeText={(val) => handleDurationChange('nights', val)}
                                    style={styles.durationInput}
                                    placeholderTextColor={Colors.TEXT_SECONDARY}
                                    onFocus={() => setFocusedDuration('nights')}
                                    onBlur={() => setFocusedDuration(null)}
                                />
                            </View>
                            
                            <View style={styles.verticalDivider} />
                            
                            <View style={styles.durationLabelHalf}>
                                <CustomText style={styles.durationLabelText}>Nights</CustomText>
                            </View>
                        </View>

                    </View>

                    <CustomText variant="label" style={[styles.multiSelectLabel, { marginTop: 24 }]}>
                        Pax Capacity *
                    </CustomText>
                    
                    <View style={styles.inlineRowContainer}>
                        
                        <View style={[
                            styles.durationWrapper, 
                            focusedDuration === 'minPax' && styles.activeBorder
                        ]}>
                            <View style={styles.durationInputHalf}>
                                <TextInput 
                                    placeholder="0"
                                    value={offer.minPax ? String(offer.minPax) : ''}
                                    keyboardType="numeric"
                                    onChangeText={(text) => handleUpdate({ section: 'root', id: 'minPax', value: Number(text) || 0 })}
                                    style={styles.durationInput}
                                    placeholderTextColor={Colors.TEXT_SECONDARY}
                                    onFocus={() => setFocusedDuration('minPax')}
                                    onBlur={() => setFocusedDuration(null)}
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
                        
                        <View style={[
                            styles.durationWrapper, 
                            focusedDuration === 'maxPax' && styles.activeBorder
                        ]}>
                            <View style={styles.durationInputHalf}>
                                <TextInput 
                                    placeholder="0"
                                    value={offer.maxPax ? String(offer.maxPax) : ''}
                                    keyboardType="numeric"
                                    onChangeText={(text) => handleUpdate({ section: 'root', id: 'maxPax', value: Number(text) || 0 })}
                                    style={styles.durationInput}
                                    placeholderTextColor={Colors.TEXT_SECONDARY}
                                    onFocus={() => setFocusedDuration('maxPax')}
                                    onBlur={() => setFocusedDuration(null)}
                                />
                            </View>
                            
                            <View style={styles.verticalDivider} />
                            
                            <View style={styles.durationLabelHalf}>
                                <CustomText style={styles.durationLabelText}>Max</CustomText>
                            </View>
                        </View>

                    </View>

                    <View style={styles.scheduleSection}>
                        <CustomText variant="label" style={styles.multiSelectLabel}>
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
                            <CustomIcon library="Feather" name="edit-3" size={20} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 24 }}>
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
                    </View>

                    <CustomTextInput 
                        label="Reminders"
                        placeholder="e.g. Non-refundable. Please arrive 30 minutes early..."
                        value={Array.isArray(offer.reminders) ? offer.reminders.join('\n') : offer.reminders} 
                        onChangeText={(text) => handleUpdate({ section: 'root', id: 'reminders', value: text })}
                        multiline={true}
                        numberOfLines={4}
                        style={styles.inputSpacing}
                        inputStyle={styles.textArea}
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
                                style={[
                                    styles.deleteBtn,
                                    isLoading && styles.disabledButton
                                ]}
                            />
                        )}
                    </View>

                </View>
            </ScrollView>

            <Modal visible={showTrailModal} animationType="fade" transparent={true}>
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowTrailModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <CustomText variant="h3">Select Trail</CustomText>
                            <TouchableOpacity onPress={() => setShowTrailModal(false)} style={styles.closeBtn}>
                                <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {trails.map(trail => {
                                const isSelected = offer?.trail?.id === trail.id;
                                return (
                                    <TouchableOpacity 
                                        key={trail.id}
                                        style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                                        onPress={() => {
                                            handleUpdate({
                                                section: 'root',
                                                id: 'trail',
                                                value: { id: trail.id, name: trail.general.name }
                                            });
                                            setShowTrailModal(false);
                                        }}
                                    >
                                        <CustomText style={isSelected ? styles.modalTextSelected : styles.modalText}>
                                            {trail.general.name}
                                        </CustomText>
                                        {isSelected && (
                                            <CustomIcon library="Feather" name="check" size={20} color={Colors.PRIMARY} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <ScheduleBuilderModal 
                visible={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                initialSchedule={offer.schedule}
                offerDays={Number(days) || 0}
                onSave={(newSchedule) => {
                    handleUpdate({ section: 'root', id: 'schedule', value: newSchedule });
                    setShowScheduleModal(false);
                }}
            />

            <ConfirmationModal 
                visible={isDeleteModalVisible}
                title="Delete Offer?"
                message="Are you sure you want to permanently delete this offer? This action cannot be undone."
                confirmText={isLoading ? "Deleting..." : "Delete"}
                cancelText="Cancel"
                onConfirm={() => {
                    setIsDeleteModalVisible(false);
                    onDeleteOffer(offer.id);
                }}
                onClose={() => setIsDeleteModalVisible(false)}
                isDestructive={true} 
            />

            <ConfirmationModal 
                visible={showBackWarningModal}
                title="Discard Changes?"
                message="You have unsaved changes. Are you sure you want to leave without saving?"
                confirmText="Discard"
                cancelText="Keep Editing"
                onConfirm={() => {
                    setShowBackWarningModal(false);
                    onBackPress();
                }}
                onClose={() => setShowBackWarningModal(false)}
                isDestructive={true} 
            />

            <ConfirmationModal 
                visible={showSaveConfirmModal}
                title="Save Changes?"
                message="Are you sure you want to apply these changes? This will instantly update the details for all new hikers looking at this offer."
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
    },
    
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: Colors.BACKGROUND,
    },
    dropdownText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
    },
    dropdownPlaceholder: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 16,
    },

    scheduleSection: {
        marginTop: 24,
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
        borderStyle: 'dashed',
    },
    scheduleTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scheduleSubtitle: {
        color: Colors.TEXT_SECONDARY,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    closeBtn: {
        padding: 4,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    modalOptionSelected: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    modalText: {
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
    },
    modalTextSelected: {
        fontSize: 16,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },

    inlineRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dividerContainer: {
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateDividerContainer: {
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    dividerText: {
        fontSize: 24,
        color: Colors.GRAY_MEDIUM,
        fontWeight: '300',
    },
    flexHalf: { 
        flex: 1 
    },
    noMarginBottom: {
        marginBottom: 0,
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
        paddingHorizontal: 0,
    },
    durationInputHalf: {
        flex: 1, 
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center', 
    },
    durationInput: {
        width: '100%', 
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center', 
        outlineStyle: 'none', 
    },
    verticalDivider: {
        width: 1,
        height: 32, 
        backgroundColor: Colors.GRAY_LIGHT,
    },
    durationLabelHalf: {
        flex: 1, 
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center', 
        backgroundColor: Colors.WHITE,
    },
    durationLabelText: {
        fontSize: 15, 
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    activeBorder: {
        borderColor: Colors.PRIMARY, 
        backgroundColor: Colors.WHITE,
    },

    inputSpacing: { 
        marginBottom: 16 
    },
    textArea: {
        minHeight: 140,
        height: 140,
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
    },
    row: { 
        flexDirection: 'row', 
        gap: 16 
    },
    multiSelectLabel: { 
        marginBottom: 8, 
        marginLeft: 4, 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold' 
    },
    buttonContainer: { 
        marginTop: 16, 
        gap: 12 
    },
    deleteBtn: { 
        borderColor: Colors.ERROR 
    },
    disabledButton: {
        opacity: 0.5,
    }
});

export default OfferWriteScreen;