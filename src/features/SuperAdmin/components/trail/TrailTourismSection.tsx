/**
 * @file TrailTourismSection.tsx
 * @description Tourism & Amenities card section for the TrailWrite form.
 * Features a responsive amenities grid (2-column on desktop, full-width on mobile)
 * with Yes/No toggle chips, and a viewpoints multi-select chip cloud.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { Trail } from '@/src/core/models/Trail/Trail';
import SelectionChip from '@/src/features/Auth/components/SelectionChip';
import TrailCardHeader from '@/src/features/SuperAdmin/components/trail/TrailCardHeader';
import {
    FACILITY_AMENITIES,
    NATURAL_CULTURAL_AMENITIES,
} from '@/src/features/SuperAdmin/utils/trailFormUtils';

export interface TrailTourismSectionProps {
    trail: Trail;
    viewpointsOptions: string[];
    isDesktop: boolean;
    isMobile: boolean;
    onUpdateField: (params: TEdit<Trail>) => void;
}

const TrailTourismSection: React.FC<TrailTourismSectionProps> = ({
    trail,
    viewpointsOptions,
    isDesktop,
    isMobile,
    onUpdateField,
}) => {
    const viewpointList: readonly string[] = trail?.tourism?.viewpoint || [];

    const handleToggleAmenity = (id: string, targetValue: boolean) => {
        const currentVal = trail?.tourism?.[id as keyof typeof trail.tourism];
        const nextVal = currentVal === targetValue ? null : targetValue;
        onUpdateField({ section: 'tourism', id, value: nextVal });
    };

    return (
        <View style={[styles.sectionCard, { padding: isMobile ? 16 : 24 }]}>
            <TrailCardHeader
                title="Tourism & Amenities"
                subtitle="On-trail facilities, water sources, natural features, and viewpoints"
                iconName="compass"
                iconLibrary="Feather"
                status="optional"
                hasError={false}
                isDesktop={isDesktop}
                isMobile={isMobile}
            />

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {/* 1. Viewpoints (Scenic Highlights) - Prominently at Top */}
                <View style={styles.fieldBlock}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.inputLabel}>
                            Viewpoints (Scenic Highlights)
                        </CustomText>
                    </View>
                    <View style={styles.chipContainer}>
                        {viewpointsOptions.map((vp: string) => {
                            const isSelected = viewpointList.includes(vp);
                            return (
                                <SelectionChip
                                    key={vp}
                                    label={vp}
                                    selected={isSelected}
                                    onPress={() => onUpdateField({ section: 'tourism', id: 'viewpoint', value: vp })}
                                />
                            );
                        })}
                    </View>
                </View>

                {/* 2. On-Trail Facilities (2x2 Grid on Desktop) */}
                <View style={styles.fieldBlock}>
                    <CustomText variant="label" style={styles.subSectionTitle}>
                        On-Trail Facilities
                    </CustomText>
                    <View style={styles.amenityGridContainer}>
                        {FACILITY_AMENITIES.map((item) => {
                            const val = trail?.tourism?.[item.id] as boolean | null | undefined;
                            return (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.amenityGridItem,
                                        isDesktop ? styles.amenityGridItemDesktop : styles.amenityGridItemMobile,
                                    ]}
                                >
                                    <View style={styles.amenityRow}>
                                        <CustomText variant="label" style={styles.amenityLabel}>
                                            {item.label}
                                        </CustomText>
                                        <View style={styles.booleanChipGroup}>
                                            <SelectionChip
                                                label="Yes"
                                                selected={val === true}
                                                onPress={() => handleToggleAmenity(item.id, true)}
                                            />
                                            <SelectionChip
                                                label="No"
                                                selected={val === false}
                                                onPress={() => handleToggleAmenity(item.id, false)}
                                            />
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 3. Natural & Cultural Attractions */}
                <View style={styles.fieldBlock}>
                    <CustomText variant="label" style={styles.subSectionTitle}>
                        Natural & Cultural Features
                    </CustomText>
                    <View style={styles.amenityGridContainer}>
                        {NATURAL_CULTURAL_AMENITIES.map((item) => {
                            const val = trail?.tourism?.[item.id] as boolean | null | undefined;
                            return (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.amenityGridItem,
                                        isDesktop ? styles.amenityGridItemDesktop : styles.amenityGridItemMobile,
                                    ]}
                                >
                                    <View style={styles.amenityRow}>
                                        <CustomText variant="label" style={styles.amenityLabel}>
                                            {item.label}
                                        </CustomText>
                                        <View style={styles.booleanChipGroup}>
                                            <SelectionChip
                                                label="Yes"
                                                selected={val === true}
                                                onPress={() => handleToggleAmenity(item.id, true)}
                                            />
                                            <SelectionChip
                                                label="No"
                                                selected={val === false}
                                                onPress={() => handleToggleAmenity(item.id, false)}
                                            />
                                        </View>
                                    </View>
                                </View>
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
    fieldBlock: {
        width: '100%',
    },
    subSectionTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 12,
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
    amenityGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    amenityGridItem: {
        justifyContent: 'center',
    },
    amenityGridItemDesktop: {
        width: '48%',
    },
    amenityGridItemMobile: {
        width: '100%',
    },
    amenityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    amenityLabel: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    booleanChipGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

export default TrailTourismSection;
