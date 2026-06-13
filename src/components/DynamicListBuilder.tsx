import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';

/**
 * Props for the DynamicListBuilder component.
 */
interface DynamicListBuilderProps {
    /** The label for the input field */
    label: string;
    /** Placeholder text for the input field */
    placeholder?: string;
    /** List of currently selected or added items */
    items?: string[];
    /** The current value of the input field */
    inputValue: string;
    /** Callback to update the input field value */
    setInputValue: (val: string) => void;
    /** Callback fired when a new custom item is added */
    onAddItem: (val: string) => void;
    /** Callback fired when an item is removed */
    onRemoveItem: (val: string) => void;
    /** List of preset items that can be toggled on or off */
    presets?: string[];
    /** Callback fired when a preset item is toggled */
    onTogglePreset: (val: string) => void;
}

/**
 * DynamicListBuilder — A component that allows users to select from a list of presets
 * or dynamically add and remove their own custom string items.
 */
const DynamicListBuilder: React.FC<DynamicListBuilderProps> = ({ 
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
    const [contentWidth, setContentWidth] = useState(0);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [scrollX, setScrollX] = useState(0);

    const customItems = items.filter(item => !presets.includes(item));
    const allChips = [...presets, ...customItems];

    const showRightArrow = contentWidth > layoutWidth && scrollX < (contentWidth - layoutWidth - 10);

    return (
        <View style={styles.listBuilderContainer}>
            
            <CustomText 
                variant="label" 
                style={styles.inputLabel}
            >
                {label}
            </CustomText>
            
            {allChips.length > 0 && (
                <View style={styles.scrollWrapper}>
                    <ScrollView 
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.presetScrollContent}
                        scrollEventThrottle={16}
                        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                        onContentSizeChange={(width) => setContentWidth(width)}
                        onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                    >
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
                    </ScrollView>

                    {showRightArrow && (
                        <View style={styles.arrowOverlay} pointerEvents="none">
                            <CustomIcon 
                                library="Feather" 
                                name="chevron-right" 
                                size={20} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                        </View>
                    )}
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
        marginBottom: 0 
    },
    inputLabel: { 
        marginBottom: 8, 
        marginLeft: 2, 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold' 
    },
    scrollWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    presetScrollContent: {
        gap: 8,
        paddingRight: 32,
    },
    arrowOverlay: {
        position: 'absolute',
        right: 0,
        height: '100%',
        width: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 4,
        backgroundColor: `${Colors.BACKGROUND}CC`,
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
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    presetChipTextSelected: { 
        color: Colors.WHITE, 
        fontWeight: 'bold' 
    },
    listInputRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    flexOne: { 
        flex: 1 
    },
    noMarginBottom: {
        marginBottom: 0
    },
    addButton: {
        backgroundColor: Colors.PRIMARY,
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default DynamicListBuilder;
