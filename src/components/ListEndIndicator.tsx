/**
 * @file ListEndIndicator.tsx
 * @description Reusable Option A end-of-list footer indicator displaying flanking hairlines
 * and a muted centered caption. Responsively constrains desktop web width to Layout.MAX_WIDTH
 * while stretching cleanly across mobile viewports.
 */

import React from 'react';
import {
    DimensionValue,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

/**
 * Props for the ListEndIndicator component.
 *
 * @param label - Text label displayed between the horizontal hairline rules.
 * @param maxWidth - Maximum responsive container width (defaults to Layout.MAX_WIDTH for desktop web).
 * @param style - Optional container style overrides for parent-specific margins or horizontal inset.
 */
export interface ListEndIndicatorProps {
    label?: string;
    maxWidth?: DimensionValue;
    style?: StyleProp<ViewStyle>;
}

/**
 * ListEndIndicator — Shared responsive footer indicator marking the end of a list or feed.
 *
 * @param props - ListEndIndicatorProps
 * @returns React.JSX.Element rendering horizontal hairline rules with centered caption text
 */
const ListEndIndicator = ({
    label = "You've reached the end.",
    maxWidth = Layout.MAX_WIDTH,
    style,
}: ListEndIndicatorProps): React.JSX.Element => {
    return (
        <View
            style={[
                styles.container,
                { maxWidth },
                style,
            ]}
        >
            <View style={styles.hairline} />
            <CustomText
                variant="caption"
                style={styles.label}
            >
                {label}
            </CustomText>
            <View style={styles.hairline} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    hairline: {
        flex: 1,
        minWidth: 24,
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginTop: 2,
    },
    label: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
        textAlign: 'center',
        flexShrink: 1,
    },
});

export default ListEndIndicator;
