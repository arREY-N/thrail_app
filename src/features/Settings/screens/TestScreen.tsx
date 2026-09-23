/**
 * @file TestScreen.tsx
 * @description Dedicated lightweight developer scratchpad screen accessible only in development (__DEV__).
 * Used for isolated component testing, layout experiments, and prototyping.
 */

import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface TestScreenProps {
    onBackPress: () => void;
}

/**
 * Lightweight Developer Test Screen.
 */
export const TestScreen: React.FC<TestScreenProps> = ({ onBackPress }) => {
    const { isMobile } = useBreakpoints();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Test Screen"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.scrollContent, !isMobile && styles.desktopContent]}
                showsVerticalScrollIndicator={false}
            >
                {/* Dev Environment Notice Card */}
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconCircle}>
                            <CustomIcon
                                library="Feather"
                                name="sliders"
                                size={22}
                                color={Colors.PRIMARY}
                            />
                        </View>
                        <View style={styles.headerTextGroup}>
                            <CustomText variant="h3" style={styles.cardTitle}>
                                Developer Test Environment
                            </CustomText>
                            <View style={styles.devBadge}>
                                <CustomText variant="caption" style={styles.devBadgeText}>
                                    __DEV__ ACTIVE
                                </CustomText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <CustomText variant="body" style={styles.description}>
                        This is a dedicated scratchpad screen for isolated UI prototyping and debugging.
                        All previous trail taxonomy and registration tests have been completed and integrated into production.
                    </CustomText>

                    <View style={styles.infoRow}>
                        <CustomText variant="caption" style={styles.infoLabel}>
                            Build Target:
                        </CustomText>
                        <CustomText variant="caption" style={styles.infoValue}>
                            Development ({Platform.OS})
                        </CustomText>
                    </View>

                    <View style={styles.infoRow}>
                        <CustomText variant="caption" style={styles.infoLabel}>
                            Production Visibility:
                        </CustomText>
                        <CustomText variant="caption" style={styles.infoValue}>
                            Hidden in APK Releases
                        </CustomText>
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextGroup: {
        flex: 1,
        gap: 4,
    },
    cardTitle: {
        color: Colors.TEXT_PRIMARY,
    },
    devBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    devBadgeText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 10,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 16,
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    infoLabel: {
        color: Colors.TEXT_SECONDARY,
    },
    infoValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
});

export default TestScreen;
