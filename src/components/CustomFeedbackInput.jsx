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

const CustomFeedbackInput = ({ 
    label, 
    placeholder, 
    value = '', 
    onChangeText, 
    suggestions = [], 
    style 
}) => {

    const [contentWidth, setContentWidth] = useState(0);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const [scrollX, setScrollX] = useState(0);

    const showRightArrow = contentWidth > layoutWidth && scrollX < (contentWidth - layoutWidth - 10);

    const handleSuggestionPress = (suggestion) => {
        const currentText = value || '';
        const lines = currentText.split('\n');

        const isCurrentlyActive = lines.some(line => line.includes(suggestion));

        if (isCurrentlyActive) {
            const newLines = lines.filter(line => !line.includes(suggestion));
            onChangeText(newLines.join('\n'));
        } else {
            let newLines = [...lines];
            
            if (newLines.length > 0 && newLines[newLines.length - 1].trim() === '') {
                newLines.pop();
            }

            newLines.push(`• ${suggestion}`);
            
            onChangeText(newLines.join('\n') + '\n');
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
                        horizontal={true} 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScrollContent}
                        scrollEventThrottle={16}
                        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                        onContentSizeChange={(width) => setContentWidth(width)}
                        onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                    >
                        {suggestions.map((item, index) => {
                            const isActive = (value || '').includes(item);

                            return (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[
                                        styles.chip,
                                        isActive && styles.chipActive
                                    ]}
                                    onPress={() => handleSuggestionPress(item)}
                                    activeOpacity={0.7}
                                >
                                    <CustomText 
                                        style={[
                                            styles.chipText,
                                            isActive && styles.chipTextActive
                                        ]}
                                    >
                                        {isActive ? '✓ ' : '+ '}{item}
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

            <CustomTextInput 
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                multiline={true}
                numberOfLines={4}
                inputStyle={styles.textArea}
                style={styles.noMarginBottom}
            />
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
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    scrollWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    chipScrollContent: {
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
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    chip: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    chipActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    chipText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    chipTextActive: {
        color: Colors.WHITE,
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
    }
});

export default CustomFeedbackInput;