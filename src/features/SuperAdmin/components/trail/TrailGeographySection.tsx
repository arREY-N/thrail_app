/**
 * @file TrailGeographySection.tsx
 * @description Geography & Coordinates card section for the TrailWrite form.
 * Features MASL elevation, paired Start coordinates (Lat/Long), and paired End coordinates
 * with pixel-perfect vertically centered dividers.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { Trail } from '@/src/core/models/Trail/Trail';
import TrailCardHeader from '@/src/features/SuperAdmin/components/trail/TrailCardHeader';
import { getNumericDisplayValue } from '@/src/features/SuperAdmin/utils/trailFormUtils';

export interface TrailGeographySectionProps {
    trail: Trail;
    isEditMode: boolean;
    isComplete: boolean;
    hasError: boolean;
    isDesktop: boolean;
    isMobile: boolean;
    onUpdateField: (params: TEdit<Trail>) => void;
}

const TrailGeographySection: React.FC<TrailGeographySectionProps> = ({
    trail,
    isEditMode,
    isComplete,
    hasError,
    isDesktop,
    isMobile,
    onUpdateField,
}) => {
    return (
        <View style={[styles.sectionCard, { padding: isMobile ? 16 : 24 }]}>
            <TrailCardHeader
                title="Geography & Coordinates"
                subtitle="Elevation MASL, start coordinates, and end coordinates (decimal degrees)"
                iconName="navigation"
                iconLibrary="Feather"
                status={isComplete ? 'ready' : 'required'}
                hasError={hasError}
                isDesktop={isDesktop}
                isMobile={isMobile}
            />

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {/* 1. Peak Altitude: MASL */}
                <View style={isDesktop ? styles.halfWidthField : styles.fieldBlock}>
                    <CustomTextInput
                        label="MASL (Elevation) *"
                        placeholder="e.g. 811"
                        suffix="m"
                        value={getNumericDisplayValue(trail?.geography?.masl, isEditMode)}
                        onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'masl', value: val })}
                        type="numerical"
                        keyboardType="numbers-and-punctuation"
                        style={styles.noMarginBottom}
                    />
                </View>

                {/* 2. Start Point Coordinates */}
                <View style={styles.pairedRowContainer}>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Start Latitude *"
                            placeholder="e.g. 14.0412"
                            value={getNumericDisplayValue(trail?.geography?.startLat, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'startLat', value: val })}
                            type="coordinate"
                            keyboardType="numbers-and-punctuation"
                            style={styles.noMarginBottom}
                        />
                    </View>
                    <View style={styles.pairedDividerCol}>
                        <CustomText style={styles.dividerText}>
                            -
                        </CustomText>
                    </View>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Start Longitude *"
                            placeholder="e.g. 120.8015"
                            value={getNumericDisplayValue(trail?.geography?.startLong, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'startLong', value: val })}
                            type="coordinate"
                            keyboardType="numbers-and-punctuation"
                            style={styles.noMarginBottom}
                        />
                    </View>
                </View>

                {/* 3. End Point Coordinates */}
                <View style={styles.pairedRowContainer}>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="End Latitude *"
                            placeholder="e.g. 14.0485"
                            value={getNumericDisplayValue(trail?.geography?.endLat, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'endLat', value: val })}
                            type="coordinate"
                            keyboardType="numbers-and-punctuation"
                            style={styles.noMarginBottom}
                        />
                    </View>
                    <View style={styles.pairedDividerCol}>
                        <CustomText style={styles.dividerText}>
                            -
                        </CustomText>
                    </View>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="End Longitude *"
                            placeholder="e.g. 120.8112"
                            value={getNumericDisplayValue(trail?.geography?.endLong, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'geography', id: 'endLong', value: val })}
                            type="coordinate"
                            keyboardType="numbers-and-punctuation"
                            style={styles.noMarginBottom}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
    },
    cardBody: {
        gap: 24,
    },
    fieldBlock: {
        width: '100%',
    },
    halfWidthField: {
        width: '48%',
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    pairedRowContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
    },
    pairedFlexCol: {
        flex: 1,
    },
    pairedDividerCol: {
        height: 54,
        marginTop: 26,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dividerText: {
        fontSize: 20,
        color: Colors.GRAY_MEDIUM,
        fontWeight: '500',
        lineHeight: 22,
        textAlign: 'center',
    },
});

export default TrailGeographySection;
