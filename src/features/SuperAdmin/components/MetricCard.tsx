/**
 * @file MetricCard.tsx
 * @description Unified SaaS metrics card component displaying platform metrics with contextual sub-metric breakdown icons.
 * Features padded inset divider lines (not touching top/bottom container edges),
 * inline monochrome title icons, and responsive 1-row desktop / 2x2 mobile layouts.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { IconLibrary } from '@/src/types/ui.types';

export interface SingleMetricItem {
    title: string;
    count: number | string;
    icon: string;
    library: IconLibrary;
    color: string;
    subtitle?: string;
    subIcon?: string;
    subLibrary?: IconLibrary;
    onPress?: () => void;
}

/**
 * Interface representing the properties of the MetricCard component.
 * 
 * @param metrics - Array of single metric item objects to display inside the card grid.
 */
interface Props {
    metrics: SingleMetricItem[];
}

/**
 * Formats sub-metric breakdown text so numbers/counts stand out clearly.
 */
const renderSubtitleContent = (subtitle: string) => {
    const spaceIndex = subtitle.indexOf(' ');
    if (spaceIndex !== -1) {
        const valuePart = subtitle.substring(0, spaceIndex);
        const textPart = subtitle.substring(spaceIndex);
        return (
            <CustomText variant="caption" style={styles.subMetricTextBase}>
                <CustomText style={styles.subMetricValueHighlight}>{valuePart}</CustomText>
                {textPart}
            </CustomText>
        );
    }
    return (
        <CustomText variant="caption" style={styles.subMetricValueHighlight}>
            {subtitle}
        </CustomText>
    );
};

/**
 * MetricCard component displaying unified platform metrics.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement | null} The rendered metrics card or null.
 */
const MetricCard = ({ metrics }: Props): React.JSX.Element => {
    const { isDesktop } = useBreakpoints();

    if (!metrics || metrics.length === 0) {
        return <View />;
    }

    if (isDesktop) {
        return (
            <View style={styles.containerCard}>
                <View style={styles.desktopRow}>
                    {metrics.map((item, index) => {
                        const isLast = index === metrics.length - 1;
                        const isTextCount = typeof item.count === 'string' && isNaN(Number(item.count));

                        const CellContainer = item.onPress ? TouchableOpacity : View;

                        return (
                            <React.Fragment key={index}>
                                <CellContainer
                                    style={styles.cellDesktop}
                                    {...(item.onPress ? { onPress: item.onPress, activeOpacity: 0.7 } : {})}
                                >
                                    {/* Header: Inline Monochrome Gray Icon + Title */}
                                    <View style={styles.cellHeader}>
                                        <CustomIcon
                                            library={item.library}
                                            name={item.icon}
                                            size={14}
                                            color={Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText variant="caption" style={styles.titleText} numberOfLines={1}>
                                            {item.title}
                                        </CustomText>
                                    </View>

                                    {/* Main Metric Value */}
                                    <CustomText
                                        variant={isTextCount ? "body" : "h2"}
                                        style={[
                                            styles.countText,
                                            isTextCount && styles.countTextString
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.count}
                                    </CustomText>

                                    {/* Subtitle / Micro Trend Line */}
                                    {item.subtitle ? (
                                        <View style={styles.trendRow}>
                                            {renderSubtitleContent(item.subtitle)}
                                        </View>
                                    ) : null}
                                </CellContainer>

                                {!isLast && <View style={styles.verticalDividerDesktop} />}
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>
        );
    }

    // --- Mobile Layout: 2x2 Grid with Inset Divider Lines ---
    const topRow = metrics.slice(0, 2);
    const bottomRow = metrics.slice(2, 4);

    return (
        <View style={styles.containerCard}>
            {/* Top Row: Metric 0 & Metric 1 */}
            <View style={styles.mobileRow}>
                {topRow.map((item, index) => {
                    const isTextCount = typeof item.count === 'string' && isNaN(Number(item.count));

                    const CellContainer = item.onPress ? TouchableOpacity : View;

                    return (
                        <React.Fragment key={index}>
                            <CellContainer
                                style={styles.cellMobile}
                                {...(item.onPress ? { onPress: item.onPress, activeOpacity: 0.7 } : {})}
                            >
                                <View style={styles.cellHeader}>
                                    <CustomIcon
                                        library={item.library}
                                        name={item.icon}
                                        size={14}
                                        color={Colors.TEXT_SECONDARY}
                                    />
                                    <CustomText variant="caption" style={styles.titleText} numberOfLines={1}>
                                        {item.title}
                                    </CustomText>
                                </View>

                                <CustomText
                                    variant={isTextCount ? "body" : "h3"}
                                    style={[
                                        styles.countText,
                                        isTextCount && styles.countTextString
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.count}
                                </CustomText>

                                {item.subtitle ? (
                                    <View style={styles.trendRow}>
                                        {renderSubtitleContent(item.subtitle)}
                                    </View>
                                ) : null}
                            </CellContainer>

                            {index === 0 && topRow.length > 1 && (
                                <View style={styles.verticalDividerMobile} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>

            {/* Inset Horizontal Divider Line between rows */}
            {bottomRow.length > 0 && <View style={styles.horizontalDividerMobile} />}

            {/* Bottom Row: Metric 2 & Metric 3 */}
            {bottomRow.length > 0 && (
                <View style={styles.mobileRow}>
                    {bottomRow.map((item, index) => {
                        const isTextCount = typeof item.count === 'string' && isNaN(Number(item.count));

                        const CellContainer = item.onPress ? TouchableOpacity : View;

                        return (
                            <React.Fragment key={index}>
                                <CellContainer
                                    style={styles.cellMobile}
                                    {...(item.onPress ? { onPress: item.onPress, activeOpacity: 0.7 } : {})}
                                >
                                    <View style={styles.cellHeader}>
                                        <CustomIcon
                                            library={item.library}
                                            name={item.icon}
                                            size={14}
                                            color={Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText variant="caption" style={styles.titleText} numberOfLines={1}>
                                            {item.title}
                                        </CustomText>
                                    </View>

                                    <CustomText
                                        variant={isTextCount ? "body" : "h3"}
                                        style={[
                                            styles.countText,
                                            isTextCount && styles.countTextString
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.count}
                                    </CustomText>

                                    {item.subtitle ? (
                                        <View style={styles.trendRow}>
                                            {renderSubtitleContent(item.subtitle)}
                                        </View>
                                    ) : null}
                                </CellContainer>

                                {index === 0 && bottomRow.length > 1 && (
                                    <View style={styles.verticalDividerMobile} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    containerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    desktopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cellDesktop: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    cellHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    titleText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '600',
    },
    countText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        includeFontPadding: false,
    },
    countTextString: {
        fontSize: 19,
        lineHeight: 24,
    },
    countAndSubRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginTop: 4,
    },
    countAndSubColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    subMetricTextBase: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    subMetricValueHighlight: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    verticalDividerDesktop: {
        width: 1,
        height: 38,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    verticalDividerDesktopTall: {
        height: 64,
    },
    mobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cellMobile: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    verticalDividerMobile: {
        width: 1,
        height: 36,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    verticalDividerMobileTall: {
        height: 50,
    },
    horizontalDividerMobile: {
        height: 1,
        width: '100%',
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 4,
    },
});

export default MetricCard;
