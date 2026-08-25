/**
 * @file DynamicListBuilder.tsx
 * @description A component that allows users to select from a list of presets
 * or dynamically add and remove their own custom string items.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

/**
 * Props for the DynamicListBuilder component.
 * 
 * @param label - The label for the input field.
 * @param placeholder - Placeholder text for the input field.
 * @param items - List of currently selected or added items.
 * @param inputValue - The current value of the input field.
 * @param setInputValue - Callback to update the input field value.
 * @param onAddItem - Callback fired when a new custom item is added.
 * @param onRemoveItem - Callback fired when an item is removed.
 * @param presets - List of preset items that can be toggled on or off.
 * @param onTogglePreset - Callback fired when a preset item is toggled.
 */
interface DynamicListBuilderProps {
    label: string;
    placeholder?: string;
    items?: string[];
    inputValue: string;
    setInputValue: (val: string) => void;
    onAddItem: (val: string) => void;
    onRemoveItem: (val: string) => void;
    presets?: string[];
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
    const scrollRef = useRef<ScrollView>(null);

    const { 
        showLeftFade,
        showRightFade,
        scrollProps
    } = useScrollFades();

    const customItems = items.filter(item => !presets.includes(item));
    const allChips = [...presets, ...customItems];

    // Enable drag-to-scroll functionality on Web platforms
    useWebDragScroll(scrollRef, allChips.length > 0);

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
                        ref={scrollRef}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.presetScrollContent}
                        {...scrollProps}
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

                    {showLeftFade && (
                        <LinearGradient 
                            colors={[Colors.BACKGROUND, Colors.BACKGROUND_FADE, Colors.BACKGROUND_TRANSPARENT]} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }} 
                            style={styles.leftFade} 
                            pointerEvents="none" 
                        />
                    )}

                    {showRightFade && (
                        <LinearGradient 
                            colors={[Colors.BACKGROUND_TRANSPARENT, Colors.BACKGROUND_FADE, Colors.BACKGROUND]} 
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }} 
                            style={styles.rightFade} 
                            pointerEvents="none" 
                        />
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
                        style={null as any}
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
        marginBottom: 0,
    },
    inputLabel: {
        marginBottom: 8,
        marginLeft: 2,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    scrollWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                isolation: 'isolate',
            },
        }),
    },
    presetScrollContent: {
        gap: 8,
    },
    leftFade: {
        position: 'absolute',
        left: -2,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: -2,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    presetChip: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
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
        fontWeight: 'bold',
    },
    listInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flexOne: {
        flex: 1,
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    addButton: {
        backgroundColor: Colors.PRIMARY,
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
});

export default DynamicListBuilder;
