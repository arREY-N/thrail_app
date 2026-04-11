import React from 'react';
import {
    Platform,
    StyleSheet,
    View
} from 'react-native';

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
                        <View style={{ gap: 8 }}>
                            <SkeletonEffect style={{ width: 140, height: 80, borderRadius: 16 }} />
                            <SkeletonEffect style={{ width: 100, height: 20 }} />
                        </View>
                        <SkeletonEffect style={{ width: 96, height: 96, borderRadius: 48 }} />
                    </View>
                    <SkeletonEffect style={{ width: '100%', height: 2, marginVertical: 16 }} />
                    <View style={styles.heroBottom}>
                        <SkeletonEffect style={{ width: 100, height: 20 }} />
                        <SkeletonEffect style={{ width: 150, height: 20 }} />
                    </View>
                </View>
                
                <View style={styles.fullWidthCard}>
                    <View style={styles.cardHeader}>
                        <SkeletonEffect style={{ width: 20, height: 20, borderRadius: 10 }} />
                        <SkeletonEffect style={{ width: 100, height: 16 }} />
                    </View>
                    <View style={styles.forecastRow}>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={styles.fItem}>
                                <SkeletonEffect style={{ width: 32, height: 32, borderRadius: 16 }} />
                                <SkeletonEffect style={{ width: 30, height: 14, marginTop: 4 }} />
                                <SkeletonEffect style={{ width: 40, height: 18, marginTop: 4 }} />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bentoGrid}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.bentoBox}>
                            <View style={styles.bentoHeader}>
                                <SkeletonEffect style={{ width: 20, height: 20, borderRadius: 10 }} />
                                <SkeletonEffect style={{ width: 60, height: 16 }} />
                            </View>
                            <View>
                                <SkeletonEffect style={{ width: 50, height: 24, marginBottom: 8 }} />
                                <SkeletonEffect style={{ width: 80, height: 14 }} />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.fullWidthCard}>
                    <View style={styles.cardHeader}>
                        <SkeletonEffect style={{ width: 20, height: 20, borderRadius: 10 }} />
                        <SkeletonEffect style={{ width: 60, height: 16 }} />
                    </View>
                    <View style={styles.sunTimeRow}>
                        <View style={styles.sunItem}>
                            <SkeletonEffect style={{ width: 32, height: 32, borderRadius: 16 }} />
                            <SkeletonEffect style={{ width: 60, height: 20 }} />
                            <SkeletonEffect style={{ width: 50, height: 14 }} />
                        </View>
                        <View style={[styles.sunItem, { alignItems: 'flex-end' }]}>
                            <SkeletonEffect style={{ width: 32, height: 32, borderRadius: 16 }} />
                            <SkeletonEffect style={{ width: 60, height: 20 }} />
                            <SkeletonEffect style={{ width: 50, height: 14 }} />
                        </View>
                    </View>
                </View>

            </View>
        </ScreenWrapper>
    );
};

const dropShadow = Platform.select({
    ios: {
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    android: {
        elevation: 3,
    },
    web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
    }
});

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 32,
    },
    heroSection: {
        paddingVertical: 16,
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    fullWidthCard: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 16,
        padding: 16,
        gap: 16,
        ...dropShadow, 
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    forecastRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    fItem: {
        alignItems: 'center',
        gap: 4,
    },
    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    bentoBox: {
        backgroundColor: Colors.WHITE, 
        borderRadius: 16,
        padding: 16,
        margin: 8,
        flex: 1,
        minWidth: 140,
        minHeight: 160,
        justifyContent: 'space-between',
        ...dropShadow, 
    },
    bentoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sunTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sunItem: {
        gap: 8,
    }
});

export default WeatherSkeleton;