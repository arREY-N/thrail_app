/**
 * @file TrailDifficultySection.tsx
 * @description Difficulty & Hike Specs card section for the TrailWrite form.
 * Encapsulates Classification chips, Circularity chips, paired specs metrics (Length/Gain, Slope/Obstacles, LASCO),
 * and multi-select chips for Trail Quality and Difficulty Points.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { Trail } from '@/src/core/models/Trail/Trail';
import SelectionChip from '@/src/features/Auth/components/SelectionChip';
import TrailCardHeader from '@/src/features/SuperAdmin/components/trail/TrailCardHeader';
import { getNumericDisplayValue } from '@/src/features/SuperAdmin/utils/trailFormUtils';

export interface TrailDifficultySectionProps {
    trail: Trail;
    classificationOptions: string[];
    circularityOptions: string[];
    qualityOptions: string[];
    difficultyPointsOptions: string[];
    isEditMode: boolean;
    isComplete: boolean;
    hasError: boolean;
    isDesktop: boolean;
    isMobile: boolean;
    onUpdateField: (params: TEdit<Trail>) => void;
}

const TrailDifficultySection: React.FC<TrailDifficultySectionProps> = ({
    trail,
    classificationOptions,
    circularityOptions,
    qualityOptions,
    difficultyPointsOptions,
    isEditMode,
    isComplete,
    hasError,
    isDesktop,
    isMobile,
    onUpdateField,
}) => {
    const qualityList: readonly string[] = trail?.difficulty?.quality || [];
    const difficultyPointsList: readonly string[] = trail?.difficulty?.difficulty_points || [];
    const currentRating = trail?.difficulty?.lascoRating;

    return (
        <View style={[styles.sectionCard, { padding: isMobile ? 16 : 24 }]}>
            <TrailCardHeader
                title="Difficulty & Hike Specs"
                subtitle="Classification (minor/major), LASCO rating (1-9), distance, elevation gain, slope, and obstacles"
                iconName="mountain"
                iconLibrary="FontAwesome5"
                status={isComplete ? 'ready' : 'required'}
                hasError={hasError}
                isDesktop={isDesktop}
                isMobile={isMobile}
            />

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {/* 1. Profile: Classification * & Circularity * (2-Col Desktop / Stacked Mobile) */}
                <View style={styles.fieldBlock}>
                    <View style={isDesktop ? styles.twoColRow : styles.singleCol}>
                        <View style={isDesktop ? styles.colHalf : styles.fieldBlock}>
                            <View style={styles.labelRow}>
                                <CustomText variant="label" style={styles.inputLabel}>
                                    Classification *
                                </CustomText>
                            </View>
                            <View style={styles.chipContainer}>
                                {classificationOptions.map((opt: string) => {
                                    const isSelected = trail?.difficulty?.classification?.toLowerCase() === opt.toLowerCase();
                                    const displayLabel = opt.charAt(0).toUpperCase() + opt.slice(1);
                                    return (
                                        <SelectionChip
                                            key={opt}
                                            label={displayLabel}
                                            selected={isSelected}
                                            onPress={() => onUpdateField({ section: 'difficulty', id: 'classification', value: opt })}
                                        />
                                    );
                                })}
                            </View>
                        </View>

                        <View style={isDesktop ? styles.colHalf : styles.fieldBlock}>
                            <View style={styles.labelRow}>
                                <CustomText variant="label" style={styles.inputLabel}>
                                    Circularity *
                                </CustomText>
                            </View>
                            <View style={styles.chipContainer}>
                                {circularityOptions.map((opt: string) => {
                                    const isSelected = trail?.difficulty?.circularity?.toLowerCase() === opt.toLowerCase();
                                    const displayLabel = opt.charAt(0).toUpperCase() + opt.slice(1);
                                    return (
                                        <SelectionChip
                                            key={opt}
                                            label={displayLabel}
                                            selected={isSelected}
                                            onPress={() => onUpdateField({ section: 'difficulty', id: 'circularity', value: opt })}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                        <CustomFeedbackInput
                            label="Classification Description"
                            placeholder="Explain why this trail is classified as minor or major, entry requirements, or endurance needed..."
                            value={trail?.description?.classificationDescription || ''}
                            onChangeText={(val: string) => onUpdateField({ section: 'description', id: 'classificationDescription', value: val })}
                        />
                    </View>
                </View>

                {/* 2. LASCO Difficulty Rating (1-9) CustomTextInput */}
                <View style={styles.fieldBlock}>
                    <View style={isDesktop ? styles.halfWidthField : styles.fieldBlock}>
                        <CustomTextInput
                            label="LASCO Difficulty Rating *"
                            placeholder="e.g. 4"
                            suffix="/9"
                            maxLength={1}
                            value={currentRating && currentRating > 0 ? String(currentRating) : ''}
                            onChangeText={(val: string) => {
                                const cleaned = val.replace(/[^1-9]/g, '');
                                onUpdateField({ section: 'difficulty', id: 'lascoRating', value: cleaned });
                            }}
                            type="numerical"
                            keyboardType="number-pad"
                            style={styles.noMarginBottom}
                        />
                        <CustomText variant="caption" style={styles.ratingHelperText}>
                            {currentRating && currentRating >= 9
                                ? `Class ${currentRating} — Technical`
                                : currentRating && currentRating >= 8
                                ? `Class ${currentRating} — Strenuous`
                                : currentRating && currentRating >= 7
                                ? `Class ${currentRating} — Difficult`
                                : currentRating && currentRating >= 6
                                ? `Class ${currentRating} — Challenging`
                                : currentRating && currentRating >= 5
                                ? `Class ${currentRating} — Moderate`
                                : currentRating && currentRating >= 4
                                ? `Class ${currentRating} — Average`
                                : currentRating && currentRating >= 3
                                ? `Class ${currentRating} — Mild`
                                : currentRating && currentRating >= 2
                                ? `Class ${currentRating} — Easy`
                                : currentRating && currentRating >= 1
                                ? `Class ${currentRating} — Very Easy`
                                : 'Enter a rating from 1 (Very Easy) to 9 (Technical)'}
                        </CustomText>
                    </View>
                    <View style={{ marginTop: 12 }}>
                        <CustomFeedbackInput
                            label="Difficulty Description"
                            placeholder="Explain terrain challenges, steepness, or why this trail received this rating..."
                            value={trail?.description?.lascoRatingDescription || ''}
                            onChangeText={(val: string) => onUpdateField({ section: 'description', id: 'lascoRatingDescription', value: val })}
                        />
                    </View>
                </View>

                {/* 3. Distance & Climb Pair: Length & Elevation Gain */}
                <View style={styles.pairedRowContainer}>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Length *"
                            placeholder="e.g. 5.5"
                            suffix="km"
                            value={getNumericDisplayValue(trail?.difficulty?.length, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'difficulty', id: 'length', value: val })}
                            type="numerical"
                            keyboardType="decimal-pad"
                            style={styles.noMarginBottom}
                        />
                    </View>
                    <View style={[styles.pairedDividerCol, { paddingHorizontal: isMobile ? 3 : 8 }]}>
                        <CustomText style={styles.dividerText}>
                            -
                        </CustomText>
                    </View>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Elevation Gain *"
                            placeholder="e.g. 350"
                            suffix="m"
                            value={getNumericDisplayValue(trail?.difficulty?.gain, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'difficulty', id: 'gain', value: val })}
                            type="numerical"
                            keyboardType="number-pad"
                            style={styles.noMarginBottom}
                        />
                    </View>
                </View>

                {/* 4. Incline & Obstacles Pair: Slope & Obstacles */}
                <View style={styles.pairedRowContainer}>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Slope *"
                            placeholder="e.g. 15"
                            suffix="%"
                            value={getNumericDisplayValue(trail?.difficulty?.slope, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'difficulty', id: 'slope', value: val })}
                            type="numerical"
                            keyboardType="decimal-pad"
                            style={styles.noMarginBottom}
                        />
                    </View>
                    <View style={[styles.pairedDividerCol, { paddingHorizontal: isMobile ? 3 : 8 }]}>
                        <CustomText style={styles.dividerText}>
                            -
                        </CustomText>
                    </View>
                    <View style={styles.pairedFlexCol}>
                        <CustomTextInput
                            label="Obstacles *"
                            placeholder="e.g. 0"
                            suffix="m"
                            value={getNumericDisplayValue(trail?.difficulty?.obstacles, isEditMode)}
                            onChangeText={(val: string) => onUpdateField({ section: 'difficulty', id: 'obstacles', value: val })}
                            type="numerical"
                            keyboardType="number-pad"
                            style={styles.noMarginBottom}
                        />
                    </View>
                </View>

                {/* 6. Trail Quality Multi-Select */}
                <View style={styles.fieldBlock}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.inputLabel}>
                            Trail Quality *
                        </CustomText>
                    </View>
                    <View style={styles.chipContainer}>
                        {qualityOptions.map((q: string) => {
                            const isSelected = qualityList.includes(q);
                            return (
                                <SelectionChip
                                    key={q}
                                    label={q}
                                    selected={isSelected}
                                    onPress={() => onUpdateField({ section: 'difficulty', id: 'quality', value: q })}
                                />
                            );
                        })}
                    </View>
                </View>

                {/* 7. Difficulty Points Multi-Select */}
                <View style={styles.fieldBlock}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.inputLabel}>
                            Difficulty Points
                        </CustomText>
                    </View>
                    <View style={styles.chipContainer}>
                        {difficultyPointsOptions.map((dp: string) => {
                            const isSelected = difficultyPointsList.includes(dp);
                            return (
                                <SelectionChip
                                    key={dp}
                                    label={dp}
                                    selected={isSelected}
                                    onPress={() => onUpdateField({ section: 'difficulty', id: 'difficulty_points', value: dp })}
                                />
                            );
                        })}
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
    twoColRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        width: '100%',
    },
    colHalf: {
        flex: 1,
    },
    singleCol: {
        gap: 16,
        width: '100%',
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
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 2,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    ratingHelperText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 4,
        marginLeft: 2,
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
        fontWeight: '300',
        lineHeight: 22,
        textAlign: 'center',
    },
});

export default TrailDifficultySection;
