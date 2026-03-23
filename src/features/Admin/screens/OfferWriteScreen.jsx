import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import SelectionOption from '@/src/features/Auth/components/SelectionOption';

import { Colors } from '@/src/constants/colors';

const PRESET_DOCS = [
    "Valid ID", 
    "Medical Certificate", 
    "Waiver", 
    "Vaccination Card"
];
const PRESET_BRING = [
    "Water (2L+)", 
    "Trail Snacks", 
    "Extra Clothes", 
    "First-aid kit", 
    "Headlamp", 
    "Tent"
];

const DynamicListBuilder = ({ 
    label, 
    placeholder, 
    items = [], 
    inputValue, 
    setInputValue, 
    onAddItem, 
    onRemoveItem,
    presets = [],
    onTogglePreset
}) => (
    <View style={styles.listBuilderContainer}>
        <CustomText variant="label" style={styles.inputLabel}>{label}</CustomText>
        
        {presets.length > 0 && (
            <View style={styles.presetContainer}>
                {presets.map(preset => {
                    const isSelected = items.includes(preset);
                    return (
                        <TouchableOpacity 
                            key={preset}
                            style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                            onPress={() => onTogglePreset(preset)}
                            activeOpacity={0.7}
                        >
                            <CustomText variant="caption" style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}>
                                {isSelected ? '✓ ' : '+ '}{preset}
                            </CustomText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        )}

        <View style={styles.listInputRow}>
            <View style={styles.flexOne}>
                <CustomTextInput 
                    placeholder={placeholder}
                    value={inputValue}
                    onChangeText={setInputValue}
                    style={{ marginBottom: 0 }}
                />
            </View>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                    onAddItem(inputValue);
                    setInputValue('');
                }}
                activeOpacity={0.7}
            >
                <CustomIcon library="Feather" name="plus" size={20} color={Colors.WHITE} />
            </TouchableOpacity>
        </View>

        {items.length > 0 && (
            <View style={styles.chipContainer}>
                {items.map((item, idx) => (
                    <View key={idx} style={styles.chip}>
                        <CustomText variant="caption" style={styles.chipText}>{item}</CustomText>
                        <TouchableOpacity 
                            onPress={() => onRemoveItem(idx)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <CustomIcon library="Feather" name="x" size={14} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        )}
    </View>
);

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

    const [docInput, setDocInput] = useState('');
    const [incInput, setIncInput] = useState('');
    const [bringInput, setBringInput] = useState('');
    const [remInput, setRemInput] = useState('');

    const handleAddToArray = (field, currentArray, value) => {
        if (!value.trim()) return;
        if (currentArray?.includes(value.trim())) return;
        const newArray = [...(currentArray || []), value.trim()];
        onUpdateOffer({ section: 'root', id: field, value: newArray });
    };

    const handleRemoveFromArray = (field, currentArray, indexToRemove) => {
        const newArray = currentArray.filter((_, idx) => idx !== indexToRemove);
        onUpdateOffer({ section: 'root', id: field, value: newArray });
    };

    const handleTogglePreset = (field, currentArray, presetValue) => {
        const arr = currentArray || [];
        if (arr.includes(presetValue)) {
            onUpdateOffer({ section: 'root', id: field, value: arr.filter(i => i !== presetValue) });
        } else {
            onUpdateOffer({ section: 'root', id: field, value: [...arr, presetValue] });
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={isEditing ? "Edit Offer" : "Add New Offer"} 
                onBackPress={onBackPress} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.formCard}>
                    
                    <CustomTextInput 
                        label="Description *"
                        placeholder="e.g. Basic Mountaineering Course"
                        value={offer.description}
                        onChangeText={(text) => onUpdateOffer({ section: 'root', id: 'description', value: text })}
                        style={styles.inputSpacing}
                    />

                    <CustomTextInput 
                        label="Price (PHP) *"
                        placeholder="0"
                        value={offer.price ? String(offer.price) : ''}
                        keyboardType="numeric"
                        onChangeText={(text) => onUpdateOffer({ section: 'root', id: 'price', value: Number(text) || 0 })}
                        style={styles.inputSpacing}
                    />

                    <View style={styles.row}>
                        <View style={styles.flexHalf}>
                            <CustomTextInput 
                                type="calendar"
                                label="Start Date *"
                                placeholder="Select Date"
                                value={offer.date || null}
                                allowFutureDates={true}
                                onChangeText={(val) => onUpdateOffer({ section: 'root', id: 'date', value: val })}
                                style={styles.inputSpacing}
                            />
                        </View>
                        <View style={styles.flexHalf}>
                            <CustomTextInput 
                                type="calendar"
                                label="End Date *"
                                placeholder="Select Date"
                                value={offer.endDate || null}
                                allowFutureDates={true}
                                onChangeText={(val) => onUpdateOffer({ section: 'root', id: 'endDate', value: val })}
                                style={styles.inputSpacing}
                            />
                        </View>
                    </View>

                    <CustomTextInput 
                        label="Duration *"
                        placeholder="e.g. 2 Days, 1 Night"
                        value={offer.duration || ''}
                        onChangeText={(text) => onUpdateOffer({ section: 'root', id: 'duration', value: text })}
                        style={styles.inputSpacing}
                    />

                    <View style={styles.row}>
                        <View style={styles.flexHalf}>
                            <CustomTextInput 
                                label="Min Pax *"
                                placeholder="0"
                                value={offer.minPax ? String(offer.minPax) : ''}
                                keyboardType="numeric"
                                onChangeText={(text) => onUpdateOffer({ section: 'root', id: 'minPax', value: Number(text) || 0 })}
                                style={styles.inputSpacing}
                            />
                        </View>
                        <View style={styles.flexHalf}>
                            <CustomTextInput 
                                label="Max Pax *"
                                placeholder="0"
                                value={offer.maxPax ? String(offer.maxPax) : ''}
                                keyboardType="numeric"
                                onChangeText={(text) => onUpdateOffer({ section: 'root', id: 'maxPax', value: Number(text) || 0 })}
                                style={styles.inputSpacing}
                            />
                        </View>
                    </View>

                    <DynamicListBuilder 
                        label="Required Documents" 
                        placeholder="e.g. Valid ID" 
                        items={offer.documents} 
                        inputValue={docInput} 
                        setInputValue={setDocInput} 
                        onAddItem={(val) => handleAddToArray('documents', offer.documents, val)}
                        onRemoveItem={(idx) => handleRemoveFromArray('documents', offer.documents, idx)}
                        presets={PRESET_DOCS}
                        onTogglePreset={(val) => handleTogglePreset('documents', offer.documents, val)}
                    />

                    <DynamicListBuilder 
                        label="Inclusions" 
                        placeholder="e.g. Guide Fee" 
                        items={offer.inclusions} 
                        inputValue={incInput} 
                        setInputValue={setIncInput} 
                        onAddItem={(val) => handleAddToArray('inclusions', offer.inclusions, val)}
                        onRemoveItem={(idx) => handleRemoveFromArray('inclusions', offer.inclusions, idx)}
                    />

                    <DynamicListBuilder 
                        label="Things to Bring" 
                        placeholder="e.g. 2L Water" 
                        items={offer.thingsToBring} 
                        inputValue={bringInput} 
                        setInputValue={setBringInput} 
                        onAddItem={(val) => handleAddToArray('thingsToBring', offer.thingsToBring, val)}
                        onRemoveItem={(idx) => handleRemoveFromArray('thingsToBring', offer.thingsToBring, idx)}
                        presets={PRESET_BRING}
                        onTogglePreset={(val) => handleTogglePreset('thingsToBring', offer.thingsToBring, val)}
                    />

                    <DynamicListBuilder 
                        label="Reminders" 
                        placeholder="e.g. Non-refundable" 
                        items={offer.reminders} 
                        inputValue={remInput} 
                        setInputValue={setRemInput} 
                        onAddItem={(val) => handleAddToArray('reminders', offer.reminders, val)}
                        onRemoveItem={(idx) => handleRemoveFromArray('reminders', offer.reminders, idx)}
                    />

                    <CustomText variant="label" style={styles.multiSelectLabel}>
                        Select Trail *
                    </CustomText>
                    
                    <View style={styles.locationsContainer}>
                        {trails.map(trail => (
                            <SelectionOption
                                key={trail.id}
                                label={trail.general.name}
                                selected={offer.trail?.id === trail.id}
                                onPress={() => {
                                    onUpdateOffer({
                                        section: 'root',
                                        id: 'trail',
                                        value: { id: trail.id, name: trail.general.name }
                                    });
                                }}
                                style={styles.compactSelection}
                            />
                        ))}
                    </View>

                    {error && <ErrorMessage error={error} />}

                    <View style={styles.buttonContainer}>
                        <CustomButton 
                            title={isLoading ? "Saving..." : "Save Offer"}
                            onPress={() => onSubmitOffer()}
                            variant="primary"
                            disabled={isLoading}
                        />
                        
                        {isEditing && (
                            <CustomButton 
                                title="Delete Offer"
                                onPress={() => onDeleteOffer(offer.id)}
                                variant="outline"
                                disabled={isLoading}
                                style={styles.deleteBtn}
                            />
                        )}
                    </View>

                </View>
            </ScrollView>
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
    inputSpacing: { 
        marginBottom: 16 
    },
    row: { 
        flexDirection: 'row', 
        gap: 16 
    },
    flexHalf: { 
        flex: 1 
    },
    flexOne: { 
        flex: 1 
    },
    
    listBuilderContainer: { 
        marginBottom: 20 
    },
    inputLabel: { 
        marginBottom: 8, 
        marginLeft: 2, 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold' 
    },
    listInputRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 },
    addButton: {
        backgroundColor: Colors.PRIMARY,
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    presetContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginBottom: 12 
    },
    presetChip: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    presetChipSelected: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    presetChipText: { 
        color: Colors.TEXT_SECONDARY 
    },
    presetChipTextSelected: { 
        color: Colors.WHITE, 
        fontWeight: 'bold' 
    },

    chipContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginTop: 12 
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipText: { 
        color: Colors.TEXT_PRIMARY 
    },

    multiSelectLabel: { 
        marginBottom: 8, 
        marginLeft: 2, 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold' 
    },
    locationsContainer: { 
        marginTop: 4, 
        marginBottom: 16 
    },
    compactSelection: { 
        marginBottom: 10, 
        paddingVertical: 14, 
        backgroundColor: Colors.BACKGROUND 
    },
    buttonContainer: { 
        marginTop: 16, 
        gap: 12 
    },
    deleteBtn: { 
        borderColor: Colors.ERROR 
    },
});

export default OfferWriteScreen;