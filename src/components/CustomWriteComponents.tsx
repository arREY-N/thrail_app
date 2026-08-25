import { TEdit } from "@/src/core/interface/domainHookInterface";
import { formatDate } from "@/src/core/utility/date";
import SelectionChip from "@/src/features/Auth/components/SelectionChip";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "../constants/colors";
import { IFormField } from "../core/interface/formFieldInterface";
import CustomDropdown from "./CustomDropdown";
import CustomFeedbackInput from "./CustomFeedbackInput";
import CustomText from "./CustomText";
import CustomTextInput from "./CustomTextInput";

export interface IWriteComponentParams {
    informationSet: IFormField<any>[],
    object: any,
    optionSet?: { [key: string]: any[] | string[]; },
    onEditProperty: (params: TEdit<any>) => void
}

const WriteComponent = (props: IWriteComponentParams) => {    
    const { 
        informationSet,
        object,
        optionSet,
        onEditProperty,
    } = props;

    return (
        <View style={styles.formContainer}>
            {
                informationSet.length > 0
                    ? informationSet.map(i => {
                        const label: string = i.label;
                        const type: string = i.type;
                        const required: boolean = i.required;
                        const section: string = i.section;
                        const id : string = i.id;
                        
                        const isRoot = section === 'root';
                        const elementKey = `${section}_${id}`;

                        if (id === 'description') {
                            const rawVal = isRoot ? object[id] : object[section]?.[id];
                            const displayVal = rawVal || '';
                            return (
                                <View key={elementKey} style={styles.inputSpacing}>
                                    <CustomFeedbackInput
                                        label={`${label}${required ? ' *' : ''}`}
                                        placeholder="Enter trail description..."
                                        value={displayVal}
                                        onChangeText={(val: string) => onEditProperty({ section, id, value: val })}
                                    />
                                </View>
                            );
                        }

                        if (type === 'text' || type === 'numerical') {
                            const rawVal = isRoot ? object[id] : object[section]?.[id];
                            
                            const isCoordinate = id.toLowerCase().includes('lat') || id.toLowerCase().includes('long');
                            const inputType = isCoordinate ? 'coordinate' : (type === 'numerical' ? 'numerical' : 'text');

                            let displayVal = '';
                            if (rawVal !== null && rawVal !== undefined) {
                                if (type === 'numerical' && rawVal === 0) {
                                    displayVal = '';
                                } else {
                                    displayVal = String(rawVal);
                                }
                            }

                            return (
                                <View key={elementKey}>
                                    <CustomTextInput
                                        label={`${label}${required ? ' *' : ''}`}
                                        placeholder={label}
                                        value={displayVal}
                                        onChangeText={(val: string) => onEditProperty({ section, id, value: val })}
                                        type={inputType}
                                        style={styles.inputSpacing}
                                        keyboardType={inputType === 'coordinate' || inputType === 'numerical' ? 'numbers-and-punctuation' : undefined}
                                    />
                                </View>
                            );
                        }
                        
                        if (type === 'multi-select') {
                            const key = i.options;
                            
                            if (!optionSet) return <CustomText key={elementKey}>Options Unavailable for {label}</CustomText>;
                            
                            const options = optionSet[key as any];
                            
                            const val: string[] | null = isRoot ? object[id] : object[section]?.[id] || null;
                            
                            return (
                                <View key={elementKey} style={styles.inputSpacing}>
                                    <CustomText variant="caption" style={styles.inputLabel}>
                                        {label} {required ? '*' : ''}
                                    </CustomText>
                                    <View style={styles.chipContainer}>
                                        {options && options.length > 0
                                            ? options.map(o => {
                                                const optionKey = typeof o === 'string' ? o : JSON.stringify(o);
                                                const isSelected = val === o || (Array.isArray(val) && val?.find(v => v === o));
                                                return (
                                                    <SelectionChip 
                                                        key={optionKey}
                                                        label={String(o)}
                                                        selected={!!isSelected}
                                                        onPress={() => onEditProperty({ section, id, value: o })}
                                                    />
                                                );
                                            })
                                            : <CustomText key="no-options">No available options</CustomText>
                                        }
                                    </View>
                                </View>
                            );
                        }

                        if (type === 'single-select') {
                            const key = i.options;
                            
                            if (!optionSet) return <CustomText key={elementKey}>Options Unavailable for {label}</CustomText>;
                            
                            const options: any[] = optionSet[key as any] || [];
                            const val: string | null = isRoot ? object[id] : object[section]?.[id] || null;
                            
                            if (key === 'classification' || key === 'circularity') {
                                return (
                                    <View key={elementKey} style={styles.inputSpacing}>
                                        <CustomText variant="caption" style={styles.inputLabel}>
                                            {label} {required ? '*' : ''}
                                        </CustomText>
                                        <View style={styles.chipContainer}>
                                            {options.map(o => {
                                                const optionKey = String(o);
                                                const isSelected = val === o;
                                                return (
                                                    <SelectionChip
                                                        key={optionKey}
                                                        label={optionKey.charAt(0).toUpperCase() + optionKey.slice(1)}
                                                        selected={isSelected}
                                                        onPress={() => onEditProperty({ section, id, value: o })}
                                                    />
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            }

                            return (
                                <View key={elementKey} style={styles.inputSpacing}>
                                    <CustomDropdown
                                        label={`${label}${required ? ' *' : ''}`}
                                        placeholder={`Select ${label}`}
                                        options={options}
                                        value={val as any}
                                        onSelect={(value: string) => onEditProperty({ section, id, value })}
                                    />
                                </View>
                            );
                        }

                        if (type === 'file') {
                            const val: string | null = isRoot ? object[id] : object[section]?.[id] || null;
                            return (
                                <View key={elementKey}>
                                    <CustomTextInput
                                        placeholder={label}
                                        label={`${label} ${required ? '*' : ''}`}
                                        value={val || ''}
                                        onChangeText={(value: string) => onEditProperty({ section, id, value })}
                                    />
                                </View>
                            );
                        }

                        if (type === 'object-select') {
                            const key = i.key;

                            if (!optionSet) return <CustomText key={elementKey}>Options unavailable for {label}</CustomText>;

                            const options: any[] = optionSet[key as any] as any[];
                            const val: any | null = isRoot ? object[id] : object[section]?.[id] || null;

                            return (
                                <View key={elementKey} style={styles.inputSpacing}>
                                    <CustomText variant="caption" style={styles.inputLabel}>
                                        {label} {required ? '*' : ''}
                                    </CustomText>
                                    <View style={styles.chipContainer}>
                                        {options && options.map(o => {
                                            const optionKey = typeof o === 'string' ? o : (o.id || o.name || JSON.stringify(o));
                                            const isSelected = val === o || val?.name === o;
                                            return (
                                                <SelectionChip 
                                                    key={optionKey}
                                                    label={String(o)}
                                                    selected={!!isSelected}
                                                    onPress={() => onEditProperty({ section, id, value: o })}
                                                />
                                            );
                                        })}
                                    </View>
                                </View>
                            );
                        }

                        if (type === 'boolean') {
                            const val: boolean | null = isRoot ? object[id] : object[section]?.[id] ?? null;
                            const isStatus = id === 'active';

                            const trueLabel = isStatus ? 'Active' : 'Yes';
                            const falseLabel = isStatus ? 'Inactive' : 'No';

                            return (
                                <View key={elementKey} style={styles.inputSpacing}>
                                    <CustomText variant="caption" style={styles.inputLabel}>
                                        {label} {required ? '*' : ''}
                                    </CustomText>
                                    <View style={styles.chipContainer}>
                                        <SelectionChip 
                                            label={trueLabel}
                                            selected={val === true}
                                            onPress={() => onEditProperty({ section, id, value: true })}
                                        />
                                        <SelectionChip 
                                            label={falseLabel}
                                            selected={val === false}
                                            onPress={() => onEditProperty({ section, id, value: false })}
                                        />
                                    </View>
                                </View>
                            );
                        }

                        if (type === 'date') {
                            const val: Date | null = isRoot ? object[id] : object[section]?.[id] || null;
                            
                            return (
                                <CustomTextInput
                                    key={elementKey}
                                    label={`${label} ${required ? '*' : ''}`}
                                    placeholder="DD/MM/YYYY"
                                    value={formatDate(val)}
                                    onChangeText={(value: Date) => onEditProperty({ section, id, value })}
                                    type="date"
                                />
                            );
                        }
                    })
                    : <CustomText>No Fields detected</CustomText>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    inputLabel: {
        fontWeight: 'bold',
        marginBottom: 8,
        color: Colors.TEXT_PRIMARY,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    formContainer: {
        gap: 16,
    },
    inputSpacing: {
        marginBottom: 4,
    },
});

export default WriteComponent;