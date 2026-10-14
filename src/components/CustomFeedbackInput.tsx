/**
 * @file CustomFeedbackInput.tsx
 * @description A specialized input component designed for collecting user feedback.
 * Features suggestion chips, a multiline text area, and status/helper text.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

/**
 * Props for the CustomFeedbackInput component.
 * 
 * @param label - The label text displayed above the feedback input.
 * @param helperText - The helper or info text displayed below the input.
 * @param placeholder - The placeholder text inside the text input.
 * @param value - The current text value of the feedback input.
 * @param onChangeText - Callback fired when the text value changes.
 * @param suggestions - List of pre-defined suggestion tags/chips.
 * @param variant - Visual style variant for suggestion chips ('primary' | 'danger'). Defaults to 'primary'.
 * @param style - Additional style prop for the root container.
 */
interface CustomFeedbackInputProps {
    label?: string;
    helperText?: string;
    placeholder?: string;
    value?: string;
    onChangeText: (text: string) => void;
    suggestions?: string[];
    variant?: 'primary' | 'danger';
    style?: StyleProp<ViewStyle>;
}

/**
 * CustomFeedbackInput — A specialized input component designed for collecting user feedback,
 * usually containing a multiline text input with interactive suggestion chips.
 */
const CustomFeedbackInput: React.FC<CustomFeedbackInputProps> = ({ 
    label, 
    helperText, 
    placeholder, 
    value = '', 
    onChangeText, 
    suggestions = [], 
    variant = 'primary',
    style 
}) => {
    const scrollRef = useRef<ScrollView>(null);

    const { 
        showLeftFade,
        showRightFade,
        scrollProps
    } = useScrollFades();

    // Enable drag-to-scroll functionality on web platforms
    useWebDragScroll(scrollRef, suggestions.length > 0);

    const isDanger = variant === 'danger';

    const activeLines = (value || '')
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

    const handleSuggestionPress = (suggestion: string): void => {
        const trimmedSuggestion = suggestion.trim();
        const isCurrentlyActive = activeLines.includes(trimmedSuggestion);

        if (isCurrentlyActive) {
            const newLines = activeLines.filter((line: string) => line !== trimmedSuggestion);
            onChangeText(newLines.length > 0 ? newLines.join('\n') : '');
        } else {
            const newLines = [...activeLines, trimmedSuggestion];
            onChangeText(newLines.join('\n'));
        }
    };

    const handleTextBlur = (): void => {
        const raw = value || '';
        const cleaned = raw
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .join('\n');

        if (cleaned !== raw) {
            onChangeText(cleaned);
        } else if (raw.trim() === '') {
            onChangeText('');
        }
    };

    return (
        <View style={[styles.container, style]}>
            
            {label && (
                <CustomText variant="label" style={styles.label}>
                    {label}
                </CustomText>
            )}

            {suggestions.length > 0 && (
                <View style={styles.scrollWrapper}>
                    <ScrollView 
                        ref={scrollRef}
                        horizontal={true} 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScrollContent}
                        {...scrollProps}
                    >
                        {suggestions.map((item: string, index: number) => {
                            const isActive = activeLines.includes(item.trim());

                            return (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[
                                        styles.chip,
                                        isActive && (isDanger ? styles.chipActiveDanger : styles.chipActive)
                                    ]}
                                    onPress={() => handleSuggestionPress(item)}
                                    activeOpacity={0.7}
                                >
                                    <CustomText 
                                        variant="caption"
                                        style={[
                                            styles.chipText,
                                            isActive && (isDanger ? styles.chipTextActiveDanger : styles.chipTextActive)
                                        ]}
                                    >
                                        {item}
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

            <CustomTextInput 
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                onBlur={handleTextBlur}
                multiline={true}
                numberOfLines={4}
                inputStyle={styles.textArea}
                style={styles.noMarginBottom}
            />

            {helperText && (
                <View style={styles.helperRow}>
                    <CustomIcon 
                        library="Feather" 
                        name="info" 
                        size={12} 
                        color={Colors.TEXT_SECONDARY} 
                    />
                    <CustomText style={styles.helperText}>
                        {helperText}
                    </CustomText>
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        marginBottom: 8,
        marginLeft: 2,
    },
    scrollWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    chipScrollContent: {
        gap: 8,
    },
    leftFade: {
        position: 'absolute',
        left: -1,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: -1,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    chip: {
        backgroundColor: Colors.BACKGROUND,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    chipActive: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.PRIMARY,
    },
    chipActiveDanger: {
        backgroundColor: Colors.ERROR_BG,
        borderColor: Colors.ERROR,
    },
    chipText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    chipTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    chipTextActiveDanger: {
        color: Colors.ERROR,
        fontWeight: 'bold',
    },
    textArea: {
        minHeight: 120,
        height: 'auto',
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    helperRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginLeft: 4,
        marginTop: 8,
        paddingRight: 16,
    },
    helperText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
        lineHeight: 16,
    },
});

export default CustomFeedbackInput;