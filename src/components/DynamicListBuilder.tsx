/**
 * @file DynamicListBuilder.tsx
 * @description Universal multi-select and dynamic custom chip builder component.
 * Mirrors the SelectionChip design standard (soft green tint, primary green border, pill radius),
 * features debounced search suggestions (300ms delay matching CustomSearchBar),
 * and supports collapsible input disclosure and cross-platform horizontal scrolling.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
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
 * @param label - The label for the list builder field.
 * @param placeholder - Placeholder text for the input field.
 * @param items - List of currently selected or added items.
 * @param inputValue - Optional controlled input field value.
 * @param setInputValue - Optional callback to update controlled input value.
 * @param onAddItem - Callback fired when a new custom item is added.
 * @param onRemoveItem - Callback fired when an item is removed.
 * @param presets - List of preset items that can be toggled on or off.
 * @param onTogglePreset - Callback fired when a preset item is toggled.
 * @param layout - Layout mode: 'scroll' (horizontal scroll) or 'wrap' (multi-line flex wrap). Defaults to 'scroll'.
 * @param collapsibleInput - If true, hides input row behind a "+ Other" toggle chip. Defaults to false.
 * @param suggestions - Optional historical options list for auto-suggestions while typing.
 * @param debounceDelay - Delay in milliseconds before suggestions are computed. Defaults to 300.
 * @param maxSuggestions - Maximum number of suggestions to display at once. Defaults to 5.
 */
export interface DynamicListBuilderProps {
    label: string;
    placeholder?: string;
    items?: string[];
    inputValue?: string;
    setInputValue?: (val: string) => void;
    onAddItem: (val: string) => void;
    onRemoveItem: (val: string) => void;
    presets?: string[];
    onTogglePreset: (val: string) => void;
    layout?: 'scroll' | 'wrap';
    collapsibleInput?: boolean;
    suggestions?: string[];
    debounceDelay?: number;
    maxSuggestions?: number;
    maxVisiblePresets?: number;
    onError?: (message: string, type?: 'error' | 'warning' | 'info') => void;
}

/**
 * Universal preset selector and dynamic custom chip creator.
 * 
 * @param {DynamicListBuilderProps} props - Component properties.
 * @returns {React.JSX.Element} Rendered builder component.
 */
const DynamicListBuilder = ({ 
    label, 
    placeholder = 'Enter item...', 
    items = [], 
    inputValue, 
    setInputValue, 
    onAddItem, 
    onRemoveItem,
    presets = [],
    onTogglePreset,
    layout = 'scroll',
    collapsibleInput = false,
    suggestions = [],
    debounceDelay = 300,
    maxSuggestions = 5,
    maxVisiblePresets = 8,
    onError,
}: DynamicListBuilderProps): React.JSX.Element => {
    const scrollRef = useRef<ScrollView>(null);

    // Internal state fallback for uncontrolled mode
    const [localInput, setLocalInput] = useState<string>(inputValue || '');
    const [prevPropInput, setPrevPropInput] = useState<string>(inputValue || '');
    const [debouncedQuery, setDebouncedQuery] = useState<string>('');

    // Synchronize controlled inputValue prop changes
    if (inputValue !== undefined && inputValue !== prevPropInput) {
        setPrevPropInput(inputValue);
        setLocalInput(inputValue);
    }

    const currentInputValue = inputValue !== undefined ? inputValue : localInput;
    const handleInputChange = (val: string) => {
        setLocalInput(val);
        setInputValue?.(val);
    };

    // Collapsible "+ Other" state
    const [isOtherOpen, setIsOtherOpen] = useState<boolean>(false);
    // Overflow "+X more" state
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { 
        showLeftFade,
        showRightFade,
        scrollProps,
    } = useScrollFades();

    const hasOverflow = presets.length > maxVisiblePresets;
    const selectedPresets = presets.filter(p => items.includes(p));
    const unselectedPresets = presets.filter(p => !items.includes(p));
    const remainingSlots = Math.max(0, maxVisiblePresets - selectedPresets.length);
    const visibleUnselected = unselectedPresets.slice(0, remainingSlots);
    const visiblePresetSet = new Set([...selectedPresets, ...visibleUnselected]);
    const visiblePresets = (!hasOverflow || isExpanded)
        ? presets
        : presets.filter(p => visiblePresetSet.has(p));
    const hiddenCount = presets.length - visiblePresets.length;

    const customItems = items.filter(item => !presets.includes(item));
    const allChips = [...visiblePresets, ...customItems];

    // Enable drag-to-scroll functionality on Web platforms when scrolling
    useWebDragScroll(scrollRef, layout === 'scroll' && allChips.length > 0);

    // Debounce query propagation to optimize suggestion updates (mirroring CustomSearchBar)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(currentInputValue.trim().toLowerCase());
        }, debounceDelay);

        return () => clearTimeout(handler);
    }, [currentInputValue, debounceDelay]);

    /**
     * Handles adding item with case-insensitive deduplication and smart preset matching.
     */
    const handleCommitItem = (rawVal?: string) => {
        const textToAdd = (rawVal !== undefined ? rawVal : currentInputValue).trim();
        if (!textToAdd) return;

        // 1. Check if matching an existing preset (case-insensitive)
        const matchedPreset = presets.find(p => p.toLowerCase() === textToAdd.toLowerCase());
        if (matchedPreset) {
            if (!items.includes(matchedPreset)) {
                onTogglePreset(matchedPreset);
                onError?.(`"${matchedPreset}" is an existing preset and has been selected.`, 'error');
            } else {
                onError?.(`"${matchedPreset}" is already selected.`, 'error');
            }
            handleInputChange('');
            if (collapsibleInput) setIsOtherOpen(false);
            return;
        }

        // 2. Check if matching any already selected items (case-insensitive)
        const matchedItem = items.find(item => item.toLowerCase() === textToAdd.toLowerCase());
        if (matchedItem) {
            onError?.(`"${matchedItem}" is already in your list.`, 'error');
            handleInputChange('');
            if (collapsibleInput) setIsOtherOpen(false);
            return;
        }

        // 3. New custom addition
        onAddItem(textToAdd);
        handleInputChange('');
        if (collapsibleInput) setIsOtherOpen(false);
    };

    const handleClearInput = () => {
        handleInputChange('');
        setDebouncedQuery('');
    };

    // Filter historical suggestions matching debounced query (excluding already selected and presets)
    const filteredSuggestions = (suggestions && debouncedQuery.length > 0)
        ? suggestions.filter(s => 
            s.toLowerCase().includes(debouncedQuery) &&
            !items.some(i => i.toLowerCase() === s.toLowerCase()) &&
            !presets.some(p => p.toLowerCase() === s.toLowerCase())
        ).slice(0, maxSuggestions)
        : [];

    const otherToggleChip = collapsibleInput ? (
        <TouchableOpacity 
            key="__other_toggle_chip__"
            style={[
                styles.otherChip, 
                isOtherOpen && styles.otherChipActive,
            ]}
            onPress={() => setIsOtherOpen(prev => !prev)}
            activeOpacity={0.7}
        >
            <CustomIcon
                library="Feather"
                name={isOtherOpen ? 'x' : 'plus'}
                size={13}
                color={isOtherOpen ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
            />
            <CustomText 
                variant="caption" 
                style={[
                    styles.otherChipText,
                    isOtherOpen && styles.otherChipTextActive,
                ]}
            >
                {isOtherOpen ? 'Cancel' : 'Other'}
            </CustomText>
        </TouchableOpacity>
    ) : null;

    const moreToggleChip = hasOverflow ? (
        <TouchableOpacity 
            key="__more_toggle_chip__"
            style={[
                styles.moreChip, 
                isExpanded && styles.moreChipActive,
            ]}
            onPress={() => setIsExpanded(prev => !prev)}
            activeOpacity={0.7}
        >
            <CustomIcon
                library="Feather"
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={isExpanded ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
            />
            <CustomText 
                variant="caption" 
                style={[
                    styles.moreChipText,
                    isExpanded && styles.moreChipTextActive,
                ]}
            >
                {isExpanded ? 'Show less' : `+${hiddenCount} more`}
            </CustomText>
        </TouchableOpacity>
    ) : null;

    const renderChipList = () => {
        const chipElements = allChips.map(chip => {
            const isSelected = items.includes(chip);
            const isCustom = !presets.includes(chip);

            if (isCustom) {
                // Custom item chip: selected appearance with dedicated remove action
                return (
                    <TouchableOpacity 
                        key={chip}
                        style={[styles.chip, styles.chipSelected, styles.chipWithAction]}
                        onPress={() => onRemoveItem(chip)}
                        activeOpacity={0.7}
                    >
                        <CustomText 
                            variant="caption" 
                            style={styles.chipTextSelected}
                        >
                            {chip}
                        </CustomText>
                        <View style={styles.chipRemoveBadge}>
                            <CustomIcon 
                                library="Feather" 
                                name="x" 
                                size={12} 
                                color={Colors.PRIMARY} 
                            />
                        </View>
                    </TouchableOpacity>
                );
            }

            // Preset item chip: mirrors SelectionChip exactly
            return (
                <TouchableOpacity 
                    key={chip}
                    style={[
                        styles.chip, 
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                    onPress={() => onTogglePreset(chip)}
                    activeOpacity={0.7}
                >
                    <CustomText 
                        variant="caption" 
                        style={[
                            styles.chipText, 
                            isSelected && styles.chipTextSelected,
                        ]}
                    >
                        {chip}
                    </CustomText>
                </TouchableOpacity>
            );
        });

        if (layout === 'wrap') {
            return (
                <View style={styles.wrapContainer}>
                    {chipElements}
                    {moreToggleChip}
                    {otherToggleChip}
                </View>
            );
        }

        return (
            <View style={styles.scrollWrapper}>
                <ScrollView 
                    ref={scrollRef}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetScrollContent}
                    {...scrollProps}
                >
                    {chipElements}
                    {moreToggleChip}
                    {otherToggleChip}
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
        );
    };

    return (
        <View style={styles.listBuilderContainer}>
            <CustomText 
                variant="label" 
                style={styles.inputLabel}
            >
                {label}
            </CustomText>
            
            {(allChips.length > 0 || collapsibleInput) && renderChipList()}

            {(!collapsibleInput || isOtherOpen) && (
                <View style={styles.inputBlock}>
                    <View style={styles.listInputRow}>
                        <View style={styles.flexOne}>
                            <View style={styles.textInputWrapper}>
                                <CustomTextInput 
                                    placeholder={placeholder}
                                    value={currentInputValue}
                                    onChangeText={handleInputChange}
                                    onSubmitEditing={() => handleCommitItem()}
                                    returnKeyType="done"
                                    style={styles.noMarginBottom}
                                />
                                {currentInputValue.length > 0 && (
                                    <TouchableOpacity 
                                        style={styles.clearInputButton} 
                                        onPress={handleClearInput}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <CustomIcon 
                                            library="Feather" 
                                            name="x-circle" 
                                            size={16} 
                                            color={Colors.GRAY_MEDIUM} 
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={[
                                styles.addButton,
                                !currentInputValue.trim() && styles.addButtonDisabled,
                            ]}
                            onPress={() => handleCommitItem()}
                            disabled={!currentInputValue.trim()}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="plus" 
                                size={18} 
                                color={Colors.WHITE} 
                            />
                        </TouchableOpacity>
                    </View>

                    {filteredSuggestions.length > 0 && (
                        <View style={styles.suggestionsCard}>
                            <View style={styles.suggestionsHeader}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="search" 
                                    size={12} 
                                    color={Colors.PRIMARY} 
                                />
                                <CustomText 
                                    variant="caption" 
                                    style={styles.suggestionsTitle}
                                >
                                    Matching suggestions
                                </CustomText>
                            </View>
                            <View style={styles.suggestionsRow}>
                                {filteredSuggestions.map(sug => (
                                    <TouchableOpacity
                                        key={`sug-${sug}`}
                                        style={styles.suggestionChip}
                                        onPress={() => handleCommitItem(sug)}
                                        activeOpacity={0.7}
                                    >
                                        <CustomIcon 
                                            library="Feather" 
                                            name="plus" 
                                            size={11} 
                                            color={Colors.PRIMARY} 
                                        />
                                        <CustomText 
                                            variant="caption" 
                                            style={styles.suggestionText}
                                        >
                                            {sug}
                                        </CustomText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
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
    wrapContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
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

    // ── Canonical Chip Styles (Directly Mirroring SelectionChip) ──
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    chipUnselected: {
        backgroundColor: Colors.BACKGROUND,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipSelected: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.PRIMARY,
    },
    chipWithAction: {
        paddingRight: 10,
        gap: 6,
    },
    chipText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    chipRemoveBadge: {
        marginLeft: 4,
        marginTop: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── "+ Other" Disclosure Chip ──
    otherChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    otherChipActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    otherChipText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    otherChipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },

    // ── "+X more" / "Show less" Overflow Counter Chip ──
    moreChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    moreChipActive: {
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    moreChipText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    moreChipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },

    // ── Input & Add Button ──
    inputBlock: {
        gap: 8,
    },
    listInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    flexOne: {
        flex: 1,
    },
    textInputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    clearInputButton: {
        position: 'absolute',
        right: 12,
        zIndex: 1,
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
    addButtonDisabled: {
        opacity: 0.5,
    },

    // ── Suggestions Container & Chips ──
    suggestionsCard: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 14,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 8,
        marginTop: 2,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    suggestionsTitle: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    suggestionChip: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    suggestionText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
});

export default DynamicListBuilder;
