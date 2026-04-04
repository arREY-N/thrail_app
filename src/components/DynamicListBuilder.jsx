import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';

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
}) => {
    const customItems = items.filter(item => !presets.includes(item));
    const allChips = [...presets, ...customItems];

    return (
        <View style={styles.listBuilderContainer}>
            <CustomText 
                variant="label" 
                style={styles.inputLabel}
            >
                {label}
            </CustomText>
            
            {allChips.length > 0 && (
                <View style={styles.presetContainer}>
                    {allChips.map(chip => {
                        const isSelected = items.includes(chip);
                        const isCustom = !presets.includes(chip);

                        return (
                            <TouchableOpacity 
                                key={chip}
                                style={[
                                    styles.presetChip, 
                                    isSelected && styles.presetChipSelected
                                ]}
                                onPress={() => isCustom ? onRemoveItem(chip) : onTogglePreset(chip)}
                                activeOpacity={0.7}
                            >
                                <CustomText 
                                    variant="caption" 
                                    style={[
                                        styles.presetChipText, 
                                        isSelected && styles.presetChipTextSelected
                                    ]}
                                >
                                    {isSelected ? (isCustom ? '✕ ' : '✓ ') : '+ '}{chip}
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
                        style={styles.noMarginBottom}
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
                    <CustomIcon 
                        library="Feather" 
                        name="plus" 
                        size={20} 
                        color={Colors.WHITE} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
        gap: 8 
    },
    noMarginBottom: {
        marginBottom: 0
    },
    flexOne: { 
        flex: 1 
    },
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
});

export default DynamicListBuilder;