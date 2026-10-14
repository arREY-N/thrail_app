/**
 * @file CustomWriteComponents.tsx
 * @description Dynamic structured form builder component that renders text inputs, numerical inputs, single-select, multi-select, and boolean option chips based on domain field definitions.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomDropdown from '@/src/components/CustomDropdown';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { IFormField } from '@/src/core/interface/formFieldInterface';
import { formatDate } from '@/src/core/utility/date';
import SelectionChip from '@/src/features/Auth/components/SelectionChip';

/**
 * Extended form field item supporting optional placeholder and helper text.
 */
export interface FormFieldItem<T = string> extends IFormField<T> {
    placeholder?: string;
    helperText?: string;
}

/**
 * Props for the WriteComponent form renderer.
 * 
 * @param informationSet - Array of field configuration objects.
 * @param object - The domain entity data object being created or edited.
 * @param optionSet - Lookup map of selectable options for dropdowns and chips.
 * @param onEditProperty - Mutation callback handler invoked on field change.
 */
export interface IWriteComponentParams<T extends object = Record<string, unknown>> {
    informationSet: FormFieldItem<keyof T | 'root'>[];
    object: T;
    optionSet?: Record<string, (string | { id?: string; name?: string })[]>;
    onEditProperty: (params: TEdit<T>) => void;
}

/**
 * WriteComponent dynamically renders typed form controls for entity inspection and editing.
 * 
 * @param props - Component parameters.
 * @returns {React.JSX.Element} The rendered form layout.
 */
const WriteComponent = <T extends object = Record<string, unknown>>(
    props: IWriteComponentParams<T>
): React.JSX.Element => {
    const { 
        informationSet,
        object,
        optionSet,
        onEditProperty,
    } = props;

    const dataRecord = object as Record<string, unknown>;

    return (
        <View style={styles.formContainer}>
            {informationSet.length > 0 ? (
                informationSet.map((i) => {
                    const label = i.label;
                    const type = i.type;
                    const required = i.required;
                    const section = i.section;
                    const id = i.id;

                    const isRoot = (section as string) === 'root';
                    const elementKey = `${String(section)}_${id}`;
                    const sectionRecord = !isRoot && typeof dataRecord[section as string] === 'object' && dataRecord[section as string] !== null
                        ? (dataRecord[section as string] as Record<string, unknown>)
                        : null;

                    if (id === 'description' && type === 'text') {
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const displayVal = typeof rawVal === 'string' ? rawVal : '';
                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <CustomFeedbackInput
                                    label={`${label}${required ? ' *' : ''}`}
                                    placeholder={i.placeholder || 'Enter trail description...'}
                                    value={displayVal}
                                    onChangeText={(val: string) => onEditProperty({ section, id, value: val })}
                                />
                            </View>
                        );
                    }

                    if (type === 'text' || type === 'numerical') {
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const isCoordinate = id.toLowerCase().includes('lat') || id.toLowerCase().includes('long');
                        const inputType = isCoordinate ? 'coordinate' : (type === 'numerical' ? 'numerical' : 'text');

                        const isNewDraft = !dataRecord.id || (typeof dataRecord.id === 'string' && dataRecord.id.trim() === '');
                        let displayVal = '';
                        if (rawVal !== null && rawVal !== undefined) {
                            if (type === 'numerical' && rawVal === 0 && isNewDraft) {
                                displayVal = '';
                            } else {
                                displayVal = String(rawVal);
                            }
                        }

                        const placeholderText = i.placeholder || label;

                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <CustomTextInput
                                    label={`${label}${required ? ' *' : ''}`}
                                    placeholder={placeholderText}
                                    value={displayVal}
                                    onChangeText={(val: string) => onEditProperty({ section, id, value: val })}
                                    type={inputType}
                                    keyboardType={inputType === 'coordinate' || inputType === 'numerical' ? 'numbers-and-punctuation' : undefined}
                                />
                            </View>
                        );
                    }

                    if (type === 'multi-select') {
                        const key = i.options || '';
                        if (!optionSet || !optionSet[key]) {
                            return (
                                <View key={elementKey} style={styles.fieldBlock}>
                                    <CustomText variant="caption">Options unavailable for {label}</CustomText>
                                </View>
                            );
                        }

                        const options = optionSet[key];
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const selectedList: string[] = Array.isArray(rawVal) ? rawVal : [];

                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <View style={styles.labelRow}>
                                    <CustomText variant="label" style={styles.inputLabel}>
                                        {label} {required ? '*' : ''}
                                    </CustomText>
                                </View>
                                <View style={styles.chipContainer}>
                                    {options && options.length > 0 ? (
                                        options.map((opt) => {
                                            const optionString = typeof opt === 'string' ? opt : (opt.name || opt.id || '');
                                            const isSelected = selectedList.includes(optionString);
                                            return (
                                                <SelectionChip 
                                                    key={optionString}
                                                    label={optionString}
                                                    selected={isSelected}
                                                    onPress={() => onEditProperty({ section, id, value: optionString })}
                                                />
                                            );
                                        })
                                    ) : (
                                        <CustomText variant="caption">No options available</CustomText>
                                    )}
                                </View>
                            </View>
                        );
                    }

                    if (type === 'single-select') {
                        const key = i.options || '';
                        if (!optionSet || !optionSet[key]) {
                            return (
                                <View key={elementKey} style={styles.fieldBlock}>
                                    <CustomText variant="caption">Options unavailable for {label}</CustomText>
                                </View>
                            );
                        }

                        const options = optionSet[key];
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const valString = typeof rawVal === 'string' ? rawVal : '';

                        if (key === 'classification' || key === 'circularity') {
                            return (
                                <View key={elementKey} style={styles.fieldBlock}>
                                    <View style={styles.labelRow}>
                                        <CustomText variant="label" style={styles.inputLabel}>
                                            {label} {required ? '*' : ''}
                                        </CustomText>
                                    </View>
                                    <View style={styles.chipContainer}>
                                        {options.map((opt) => {
                                            const optString = typeof opt === 'string' ? opt : (opt.name || opt.id || '');
                                            const isSelected = valString.toLowerCase() === optString.toLowerCase();
                                            const displayChipLabel = optString.charAt(0).toUpperCase() + optString.slice(1);
                                            return (
                                                <SelectionChip
                                                    key={optString}
                                                    label={displayChipLabel}
                                                    selected={isSelected}
                                                    onPress={() => onEditProperty({ section, id, value: optString })}
                                                />
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        }

                        const stringOptions = options.map((opt) => typeof opt === 'string' ? opt : (opt.name || opt.id || ''));

                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <CustomDropdown
                                    label={`${label}${required ? ' *' : ''}`}
                                    placeholder={`Select ${label}`}
                                    options={stringOptions}
                                    value={valString}
                                    onSelect={(value: string) => onEditProperty({ section, id, value })}
                                />
                            </View>
                        );
                    }

                    if (type === 'object-select') {
                        const key = i.key || i.options || '';
                        if (!optionSet || !optionSet[key]) {
                            return (
                                <View key={elementKey} style={styles.fieldBlock}>
                                    <CustomText variant="caption">Options unavailable for {label}</CustomText>
                                </View>
                            );
                        }

                        const options = optionSet[key];
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const selectedVal = typeof rawVal === 'string' ? rawVal : '';

                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <View style={styles.labelRow}>
                                    <CustomText variant="label" style={styles.inputLabel}>
                                        {label} {required ? '*' : ''}
                                    </CustomText>
                                </View>
                                <View style={styles.chipContainer}>
                                    {options && options.map((opt) => {
                                        const optString = typeof opt === 'string' ? opt : (opt.name || opt.id || '');
                                        const isSelected = selectedVal === optString;
                                        return (
                                            <SelectionChip 
                                                key={optString}
                                                label={optString}
                                                selected={isSelected}
                                                onPress={() => onEditProperty({ section, id, value: optString })}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    }

                    if (type === 'boolean') {
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const val: boolean | null = typeof rawVal === 'boolean' ? rawVal : null;
                        const isStatus = id === 'active';

                        const trueLabel = isStatus ? 'Active' : 'Yes';
                        const falseLabel = isStatus ? 'Inactive' : 'No';

                        const handleSelectBoolean = (chosenValue: boolean) => {
                            if (val === chosenValue && !isStatus) {
                                onEditProperty({ section, id, value: null });
                            } else {
                                onEditProperty({ section, id, value: chosenValue });
                            }
                        };

                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <View style={styles.labelRow}>
                                    <CustomText variant="label" style={styles.inputLabel}>
                                        {label} {required ? '*' : ''}
                                    </CustomText>
                                </View>
                                <View style={styles.chipContainer}>
                                    <SelectionChip 
                                        label={trueLabel}
                                        selected={val === true}
                                        onPress={() => handleSelectBoolean(true)}
                                    />
                                    <SelectionChip 
                                        label={falseLabel}
                                        selected={val === false}
                                        onPress={() => handleSelectBoolean(false)}
                                    />
                                </View>
                            </View>
                        );
                    }

                    if (type === 'date') {
                        const rawVal = isRoot ? dataRecord[id] : sectionRecord?.[id];
                        const dateVal = rawVal instanceof Date ? rawVal : null;

                        return (
                            <View key={elementKey} style={styles.fieldBlock}>
                                <CustomTextInput
                                    label={`${label} ${required ? '*' : ''}`}
                                    placeholder="DD/MM/YYYY"
                                    value={formatDate(dateVal)}
                                    onChangeText={(value: Date) => onEditProperty({ section, id, value })}
                                    type="date"
                                />
                            </View>
                        );
                    }

                    return null;
                })
            ) : (
                <CustomText variant="caption">No fields detected</CustomText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    formContainer: {
        gap: 16,
        width: '100%',
    },
    fieldBlock: {
        width: '100%',
    },
    labelRow: {
        marginBottom: 8,
    },
    inputLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginLeft: 2,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
});

export default WriteComponent;