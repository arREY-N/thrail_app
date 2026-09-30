import React, { useState } from 'react';
import {
    StyleProp,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

export interface ExpandableTextProps {
    /** The full text to display */
    text: string;
    /** Character limit before truncating into expandable state (default: 180) */
    characterLimit?: number;
    /** Optional custom style for the text body */
    textStyle?: StyleProp<TextStyle>;
    /** Optional custom style for the toggle button text ("Read More" / "Read Less") */
    toggleTextStyle?: StyleProp<TextStyle>;
    /** Optional container style for the toggle action button */
    toggleContainerStyle?: StyleProp<ViewStyle>;
    /** Optional container style wrapping the whole component */
    containerStyle?: StyleProp<ViewStyle>;
    /** Whether to enclose the text within quotation marks */
    quote?: boolean;
    /** Label to show when collapsed (default: "Read More") */
    readMoreText?: string;
    /** Label to show when expanded (default: "Read Less") */
    readLessText?: string;
    /** Custom color for the chevron arrow (defaults to Colors.PRIMARY) */
    arrowColor?: string;
    /** Size of the chevron icon (default: 14) */
    arrowSize?: number;
    /** Initially expanded state (default: false) */
    defaultExpanded?: boolean;
}

/**
 * ExpandableText — A reusable text component that displays a clamped summary of long text,
 * expanding smoothly with a "Read More" / "Read Less" toggle button and chevron arrow.
 */
const ExpandableText: React.FC<ExpandableTextProps> = ({
    text,
    characterLimit = 180,
    textStyle,
    toggleTextStyle,
    toggleContainerStyle,
    containerStyle,
    quote = false,
    readMoreText = 'Read More',
    readLessText = 'Read Less',
    arrowColor = Colors.PRIMARY,
    arrowSize = 14,
    defaultExpanded = false,
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

    const trimmed = text?.trim() || '';
    const shouldTruncate = trimmed.length > characterLimit;

    const displayedText = isExpanded || !shouldTruncate
        ? trimmed
        : `${trimmed.substring(0, characterLimit).trim()}...`;

    const formattedContent = quote ? `"${displayedText}"` : displayedText;

    return (
        <View style={[styles.container, containerStyle]}>
            <CustomText style={[styles.defaultText, textStyle]}>
                {formattedContent}
            </CustomText>

            {shouldTruncate && (
                <TouchableOpacity
                    onPress={() => setIsExpanded(!isExpanded)}
                    style={[styles.toggleBtn, toggleContainerStyle]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={isExpanded ? readLessText : readMoreText}
                >
                    <CustomText style={[styles.defaultToggleText, { color: arrowColor }, toggleTextStyle]}>
                        {isExpanded ? readLessText : readMoreText}
                    </CustomText>
                    <CustomIcon
                        library="Feather"
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={arrowSize}
                        color={arrowColor}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    defaultText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        lineHeight: 19,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        marginTop: 6,
        paddingVertical: 2,
    },
    defaultToggleText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ExpandableText;
