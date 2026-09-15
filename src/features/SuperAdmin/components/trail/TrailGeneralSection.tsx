/**
 * @file TrailGeneralSection.tsx
 * @description General Information card section for the TrailWrite form.
 * Encapsulates Trail Name, Address, Province/Mountain selection chips, description, and active status.
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

export interface TrailGeneralSectionProps {
    trail: Trail;
    provinceOptions: string[];
    mountainOptions: string[];
    isComplete: boolean;
    hasError: boolean;
    isDesktop: boolean;
    isMobile: boolean;
    onUpdateField: (params: TEdit<Trail>) => void;
}

const TrailGeneralSection: React.FC<TrailGeneralSectionProps> = ({
    trail,
    provinceOptions,
    mountainOptions,
    isComplete,
    hasError,
    isDesktop,
    isMobile,
    onUpdateField,
}) => {
    const provinceList: readonly string[] = trail?.general?.province || [];
    const mountainList: readonly string[] = trail?.general?.mountain || [];

    return (
        <View style={[styles.sectionCard, { padding: isMobile ? 16 : 24 }]}>
            <TrailCardHeader
                title="General Information"
                subtitle="Basic trail identity, province, mountain tag, and active status"
                iconName="info"
                iconLibrary="Feather"
                status={isComplete ? 'ready' : 'required'}
                hasError={hasError}
                isDesktop={isDesktop}
                isMobile={isMobile}
            />

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {/* 1. Trail Name (Full Width) */}
                <View style={styles.fieldBlock}>
                    <CustomTextInput
                        label="Trail Name *"
                        placeholder="e.g. Mt. Batulao"
                        value={trail?.general?.name || ''}
                        onChangeText={(val: string) => onUpdateField({ section: 'general', id: 'name', value: val })}
                        style={styles.noMarginBottom}
                    />
                </View>

                {/* 2. Geographic Taxonomy: Province & Mountain (2-Column Desktop / Stacked Mobile) */}
                <View style={isDesktop ? styles.twoColRow : styles.singleCol}>
                    <View style={isDesktop ? styles.colHalf : styles.fieldBlock}>
                        <View style={styles.labelRow}>
                            <CustomText variant="label" style={styles.inputLabel}>
                                Province *
                            </CustomText>
                        </View>
                        <View style={styles.chipContainer}>
                            {provinceOptions.map((prov: string) => {
                                const isSelected = provinceList.includes(prov);
                                return (
                                    <SelectionChip
                                        key={prov}
                                        label={prov}
                                        selected={isSelected}
                                        onPress={() => onUpdateField({ section: 'general', id: 'province', value: prov })}
                                    />
                                );
                            })}
                        </View>
                    </View>

                    <View style={isDesktop ? styles.colHalf : styles.fieldBlock}>
                        <View style={styles.labelRow}>
                            <CustomText variant="label" style={styles.inputLabel}>
                                Mountain *
                            </CustomText>
                        </View>
                        <View style={styles.chipContainer}>
                            {mountainOptions.map((mtn: string) => {
                                const isSelected = mountainList.includes(mtn);
                                return (
                                    <SelectionChip
                                        key={mtn}
                                        label={mtn}
                                        selected={isSelected}
                                        onPress={() => onUpdateField({ section: 'general', id: 'mountain', value: mtn })}
                                    />
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* 3. Address (Specific Jump-off / Barangay) */}
                <View style={styles.fieldBlock}>
                    <CustomTextInput
                        label="Address *"
                        placeholder="e.g. Sitio Kayrilaw, Brgy. Kaybagal, Nasugbu"
                        value={trail?.general?.address || ''}
                        onChangeText={(val: string) => onUpdateField({ section: 'general', id: 'address', value: val })}
                        style={styles.noMarginBottom}
                    />
                </View>

                {/* 4. Description */}
                <View style={styles.fieldBlock}>
                    <CustomFeedbackInput
                        label="Description"
                        placeholder="Enter trail description, terrain details, and highlights..."
                        value={trail?.general?.description || ''}
                        onChangeText={(val: string) => onUpdateField({ section: 'general', id: 'description', value: val })}
                    />
                </View>

                {/* 5. Active Status */}
                <View style={styles.fieldBlock}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.inputLabel}>
                            Active Status *
                        </CustomText>
                    </View>
                    <View style={styles.chipContainer}>
                        <SelectionChip
                            label="Active"
                            selected={trail?.general?.active === true}
                            onPress={() => onUpdateField({ section: 'general', id: 'active', value: true })}
                        />
                        <SelectionChip
                            label="Inactive"
                            variant="danger"
                            selected={trail?.general?.active === false}
                            onPress={() => onUpdateField({ section: 'general', id: 'active', value: false })}
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
});

export default TrailGeneralSection;
