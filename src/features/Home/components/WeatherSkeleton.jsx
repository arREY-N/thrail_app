import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';

const WeatherSkeleton = ({ onBackPress }) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Weather" centerTitle={true} onBackPress={onBackPress} />
            
            <View style={styles.scrollContent}>
                
                <View style={styles.heroSection}>
                    <View style={styles.heroTop}>
                        <View style={styles.heroTextCol}>
                            <SkeletonEffect style={styles.heroTempSkeleton} />
                            <SkeletonEffect style={styles.heroFeelsLikeSkeleton} />
                            <View style={styles.heroLocRow}>
                                <SkeletonEffect style={styles.heroLocIconSkeleton} />
                                <View style={styles.heroLocTextStack}>
                                    <SkeletonEffect style={styles.heroLocTextSkeleton} />
                                    <SkeletonEffect style={styles.heroLocSubtextSkeleton} />
                                </View>
                            </View>
                        </View>
                        <SkeletonEffect style={styles.heroIconSkeleton} />
                    </View>
                    <SkeletonEffect style={styles.heroDividerSkeleton} />
                    <View style={styles.heroBottom}>
                        <SkeletonEffect style={styles.heroSubTextLeft} />
                        <SkeletonEffect style={styles.heroSubTextCenter} />
                        <SkeletonEffect style={styles.heroSubTextRight} />
                    </View>
                </View>
                
                <View style={styles.fullWidthCard}>
                    <View style={styles.cardHeader}>
                        <SkeletonEffect style={styles.headerIconSkeleton} />
                        <SkeletonEffect style={styles.headerTextSkeleton} />
                    </View>
                    <View style={styles.forecastRow}>
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonEffect key={i} style={styles.forecastPillSkeleton} />
                        ))}
                    </View>
                </View>

                <View style={styles.bentoGrid}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.bentoBox}>
                            <View style={styles.bentoHeaderRow}>
                                <SkeletonEffect style={styles.bentoIconSkeleton} />
                                <SkeletonEffect style={styles.bentoTitleSkeleton} />
                            </View>
                            <View style={styles.bentoMiddle}>
                                <SkeletonEffect style={styles.bentoValueSkeleton} />
                            </View>
                            <View style={styles.bentoBottom}>
                                <SkeletonEffect style={styles.bentoDescSkeleton} />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.fullWidthCard}>
                    <View style={styles.cardHeader}>
                        <SkeletonEffect style={styles.headerIconSkeleton} />
                        <SkeletonEffect style={styles.headerTextSkeleton} />
                    </View>
                    <View style={styles.sunTimeRow}>
                        <View style={styles.sunItem}>
                            <SkeletonEffect style={styles.sunIconSkeleton} />
                            <View>
                                <SkeletonEffect style={styles.sunTimeSkeleton} />
                                <SkeletonEffect style={styles.sunLabelSkeleton} />
                            </View>
                        </View>
                        
                        <View style={styles.sunConnector} />

                        <View style={[styles.sunItem, styles.sunItemRight]}>
                            <SkeletonEffect style={styles.sunIconSkeleton} />
                            <View style={styles.sunItemRightAlign}>
                                <SkeletonEffect style={styles.sunTimeSkeleton} />
                                <SkeletonEffect style={styles.sunLabelSkeleton} />
                            </View>
                        </View>
                    </View>
                </View>

            </View>
        </ScreenWrapper>
    );
};

export const WeatherWidgetSkeleton = () => {
    return (
        <View style={styles.widgetContainer}>
            <View style={styles.widgetHero}>
                <SkeletonEffect style={styles.widgetTempSkeleton} />
                <SkeletonEffect style={styles.widgetConditionSkeleton} />
                <SkeletonEffect style={styles.widgetFeelsLikeSkeleton} />
                
                <SkeletonEffect style={styles.widgetSafetyPillSkeleton} />
            </View>

            <View style={styles.widgetForecastRow}>
                {[1, 2, 3, 4].map((i) => (
                    <SkeletonEffect key={i} style={styles.widgetForecastPill} />
                ))}
            </View>

            <View style={styles.widgetGridContainer}>
                {[1, 2, 3].map((rowIndex) => (
                    <View key={rowIndex} style={styles.widgetGridRow}>
                        <View style={styles.widgetGridItem}>
                            <SkeletonEffect style={styles.gridIconSkeleton} />
                            <SkeletonEffect style={styles.gridLabelSkeleton} />
                            <SkeletonEffect style={styles.gridValueSkeleton} />
                            <SkeletonEffect style={styles.gridSubtextSkeleton} />
                        </View>
                        <View style={styles.widgetGridItem}>
                            <SkeletonEffect style={styles.gridIconSkeleton} />
                            <SkeletonEffect style={styles.gridLabelSkeleton} />
                            <SkeletonEffect style={styles.gridValueSkeleton} />
                            <SkeletonEffect style={styles.gridSubtextSkeleton} />
                        </View>
                    </View>
                ))}
            </View>
            
            <View style={styles.widgetSunRowSkeleton}>
                <View style={styles.sunItem}>
                    <SkeletonEffect style={styles.sunIconSkeleton} />
                    <View>
                        <SkeletonEffect style={styles.widgetSunLabelSkeleton} />
                        <SkeletonEffect style={styles.widgetSunTimeSkeleton} />
                    </View>
                </View>
                
                <View style={styles.sunSeparatorSkeleton} />
                
                <View style={[styles.sunItem, styles.sunItemRight]}>
                    <SkeletonEffect style={styles.sunIconSkeleton} />
                    <View style={styles.sunItemRightAlign}>
                        <SkeletonEffect style={styles.widgetSunLabelSkeleton} />
                        <SkeletonEffect style={styles.widgetSunTimeSkeleton} />
                    </View>
                </View>
            </View>

            <View style={styles.refreshRowSkeleton}>
                <SkeletonEffect style={styles.refreshTextSkeleton} />
            </View>
        </View>
    );
};

const dropShadow = Platform.select({
    ios: { 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.06, 
        shadowRadius: 10 
    },
    android: { 
        elevation: 3 
    },
    web: { 
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)' 
    }
});

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        gap: 16, 
        paddingBottom: 32 
    },
    widgetContainer: { 
        paddingVertical: 8 
    },

    heroSection: { 
        paddingVertical: 12, 
        paddingHorizontal: 8 
    },
    heroTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    heroTextCol: { 
        gap: 8,
        flex: 1,
    },
    heroTempSkeleton: { 
        width: 140, 
        height: 72, 
        borderRadius: 16 
    },
    heroFeelsLikeSkeleton: {
        width: 90,
        height: 16,
        borderRadius: 4,
        marginBottom: 8,
        marginLeft: 4,
    },
    heroLocRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    heroLocIconSkeleton: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginTop: 2,
    },
    heroLocTextStack: {
        gap: 6,
    },
    heroLocTextSkeleton: { 
        width: 120, 
        height: 18,
        borderRadius: 4,
    },
    heroLocSubtextSkeleton: {
        width: 150,
        height: 14,
        borderRadius: 4,
    },
    heroIconSkeleton: { 
        width: 90, 
        height: 90, 
        borderRadius: 45,
        marginRight: 8,
    },
    heroDividerSkeleton: { 
        width: '100%', 
        height: 1, 
        marginVertical: 20 
    },
    heroBottom: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 4 
    },
    heroSubTextLeft: { 
        width: 80, 
        height: 16,
        borderRadius: 4,
    },
    heroSubTextCenter: {
        width: 100,
        height: 16,
        borderRadius: 4,
        alignSelf: 'flex-end',
    },
    heroSubTextRight: { 
        width: 120, 
        height: 16,
        borderRadius: 4,
    },

    fullWidthCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 20, 
        padding: 20, 
        gap: 16,
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...dropShadow 
    },
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    headerIconSkeleton: { 
        width: 20, 
        height: 20, 
        borderRadius: 10 
    },
    headerTextSkeleton: { 
        width: 100, 
        height: 16,
        borderRadius: 4,
    },

    forecastRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    forecastPillSkeleton: { 
        width: 70, 
        height: 100, 
        borderRadius: 16,
        marginRight: 12,
    },

    bentoGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: 16 
    },
    bentoBox: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 20, 
        padding: 16, 
        width: '47.5%', 
        minHeight: 140, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...dropShadow 
    },
    bentoHeaderRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    bentoIconSkeleton: { 
        width: 20, 
        height: 20, 
        borderRadius: 10 
    },
    bentoTitleSkeleton: { 
        width: 60, 
        height: 16,
        borderRadius: 4,
    },
    bentoMiddle: {
        marginTop: 16,
        height: 36,
        justifyContent: 'flex-end',
    },
    bentoValueSkeleton: { 
        width: 80, 
        height: 32, 
        borderRadius: 4
    },
    bentoBottom: {
        marginTop: 12,
    },
    bentoDescSkeleton: { 
        width: 100, 
        height: 14,
        borderRadius: 4
    },

    sunTimeRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    sunItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 
    },
    sunItemRight: {
        alignItems: 'flex-end',
    },
    sunItemRightAlign: {
        alignItems: 'flex-end',
    },
    sunIconSkeleton: { 
        width: 32, 
        height: 32, 
        borderRadius: 16 
    },
    sunTimeSkeleton: { 
        width: 80, 
        height: 24,
        marginBottom: 4,
        borderRadius: 4
    },
    sunLabelSkeleton: { 
        width: 50, 
        height: 14,
        borderRadius: 4
    },
    sunConnector: { 
        flex: 1, 
        height: 1, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed',
        marginHorizontal: 16,
    },

    // --- Weather Widget Skeleton Styles ---
    widgetHero: { 
        alignItems: 'center', 
        marginBottom: 32 
    },
    widgetTempSkeleton: { 
        width: 120, 
        height: 72, 
        borderRadius: 16, 
    },
    widgetConditionSkeleton: {
        width: 120,
        height: 20,
        borderRadius: 4,
        marginTop: 12,
    },
    widgetFeelsLikeSkeleton: { 
        width: 100, 
        height: 14,
        borderRadius: 4,
        marginTop: 6,
    },
    widgetSafetyPillSkeleton: {
        width: 180,
        height: 36,
        borderRadius: 18,
        marginTop: 16,
    },
    widgetForecastRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginBottom: 32,
        overflow: 'hidden'
    },
    widgetForecastPill: { 
        width: 70, 
        height: 100, 
        borderRadius: 16,
        marginRight: 12,
    },
    widgetGridContainer: {
        gap: 12,
        marginBottom: 24,
    },
    widgetGridRow: {
        flexDirection: 'row',
        gap: 12,
    },
    widgetGridItem: {
        flex: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        ...dropShadow,
    },
    gridIconSkeleton: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    gridLabelSkeleton: {
        width: 50,
        height: 14,
        borderRadius: 4,
        marginTop: 8,
        marginBottom: 2,
    },
    gridValueSkeleton: {
        width: 60,
        height: 24,
        borderRadius: 4,
        marginVertical: 4,
    },
    gridSubtextSkeleton: {
        width: 80,
        height: 12,
        borderRadius: 4,
        marginTop: 4,
    },
    widgetSunRowSkeleton: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1, 
        borderColor: 'transparent', 
        ...dropShadow
    },
    widgetSunLabelSkeleton: {
        width: 50,
        height: 12,
        borderRadius: 4,
        marginBottom: 4,
    },
    widgetSunTimeSkeleton: {
        width: 60,
        height: 18,
        borderRadius: 4,
    },
    sunSeparatorSkeleton: {
        width: 1,
        height: 40,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    refreshRowSkeleton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 10,
    },
    refreshTextSkeleton: {
        width: 120,
        height: 14,
        borderRadius: 4,
    }
});

export default WeatherSkeleton;