import { TEdit } from "@/src/core/interface/domainHookInterface";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";
import { IFormField } from "../core/interface/formFieldInterface";
import CustomDropdown from "./CustomDropdown";
import CustomTextInput from "./CustomTextInput";

export interface IWriteComponentParams {
    informationSet: IFormField<any>[],
    object: any,
    optionSet?: { [key: string]: any[] | string[]; },
    onEditProperty: (params: TEdit) => void
}

const WriteComponent = (props: IWriteComponentParams) => {    
    const { 
        informationSet,
        object,
        optionSet,
        onEditProperty,
    } = props;

    return (
        <ScrollView style={styles.formCard}>
            {
                informationSet.map(i => {
                    const label: string = i.label;
                    const type: string = i.type;
                    const required: boolean = i.required;
                    const section: string = i.section;
                    const id : string = i.id;
                    
                    const isRoot = section === 'root';

                    if(type === 'text' || type == 'numerical'){
                        const val: string | null = isRoot ? object[id] : object[section][id] || null;
                        return(
                            <View key={label}>
                                <CustomTextInput
                                    label={`${label}${required ? '*' : ''}`}
                                    placeholder={label}
                                    value={val || ''}
                                    onChangeText={(value: string) => onEditProperty({section, id, value})}
                                    style={styles.inputSpacing} secureTextEntry={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined}                                />
                            </View>
                        )
                    }
                    
                    if(type === 'multi-select'){
                        const key = i.options;
                        
                        if(!optionSet) return <Text>Options Unavailable for {label}</Text>
                        
                        const options = optionSet[key as any];
                        
                        const val: string[] | null = isRoot ? object[id] : object[section][id] || null;
                        
                        return(
                            <View key={label}>
                                <Text>{label} { required ? '*' : ''}</Text>
                                {
                                    options.length > 0
                                        ? options.map(o => {
                                            return(
                                                <Pressable 
                                                    style={(val === o || (Array.isArray(val) && val?.find(v => v === o))) ? styles.true : styles.false} 
                                                    onPress={() => onEditProperty({section, id, value: o})}
                                                >
                                                    <Text>{o}</Text>
                                                </Pressable>
                                            )
                                        })
                                        : <Text>No available options</Text>
                                }
                             </View>
                        )
                    }

                    if(type === 'single-select'){
                        const key = i.options;
                        
                        if(!optionSet) return <Text>Options Unavailable for {label}</Text>
                        
                        const options: [] = optionSet[key as any] as []; 
                        
                        const val: string[] | null = isRoot ? object[id] : object[section][id] || null;
                        
                        return(
                            <View key={label}>
                                <CustomDropdown
                                    label={`${label}${ required ? '*' : ''}`}
                                    placeholder={`Select ${label}`}
                                    options={options}
                                    value={val}
                                    onSelect={(value: string) => onEditProperty({section, id, value})}
                                />
                            </View>
                        )
                    }

                    if(type === 'file'){
                        const val: string | null = isRoot ? object[id] : object[section][id] || null;
                        return(
                            <View key={label}>
                                <Text>{label} { required ? '*' : ''}</Text>
                                <CustomTextInput
                                    placeholder={label}
                                    value={val || ''}
                                    onChangeText={() => { } } 
                                    label={label} 
                                    secureTextEntry={undefined} 
                                    keyboardType={undefined} 
                                    isPasswordVisible={undefined} 
                                    onTogglePassword={undefined} 
                                    style={undefined} 
                                    icon={undefined}                                
                                />
                            </View>
                        )
                    }

                    if(type === 'object-select'){
                        const key = i.key;

                        if(!optionSet) return <Text>Options unavailable for {label}</Text>

                        const options: [] = optionSet[key as any] as [];

                        const val: any | null = isRoot ? object[id] : object[section][id] || null

                        return(
                            <View key={label}>
                                <Text>{label} { required ? '*' : ''}</Text>
                                {
                                    options && options.map(o => {
                                        return(
                                            <Pressable 
                                                style={(val === o || val.name === o) ? styles.true : styles.false} 
                                                onPress={() => onEditProperty({section, id, value: o})}>
                                                <Text>{o}</Text>
                                            </Pressable>
                                        )
                                    })
                                }
                            </View>
                        )
                    }

                    if(type === 'boolean'){
                        const val: boolean = isRoot ? object[id] : object[section][id];

                        return(
                            <View key={label}>
                                <Text>{label} { required ? '*' : ''}</Text>
                                <Pressable 
                                    style={!val ? styles.false : (val ? styles.true : styles.false)} 
                                    onPress={() => onEditProperty({section, id, value: val})}
                                >
                                    <Text>{val === null ? 'NO DATA' : (val ? 'TRUE' : 'FALSE')}</Text>
                                </Pressable>
                            </View>
                        )
                    }

                    if(type === 'date'){
                        const val: string | null = isRoot ? object[id] : object[section][id] || null;
                        
                        return(
                            <CustomTextInput
                                label={`${label} ${required ? '*' : ''}`}
                                placeholder="DD/MM/YYYY"
                                value={val}
                                onChangeText={(value: Date) => onEditProperty({section, id, value})}
                                type="date" 
                                secureTextEntry={undefined} 
                                keyboardType={undefined} 
                                isPasswordVisible={undefined} 
                                onTogglePassword={undefined} 
                                style={undefined} 
                                icon={undefined}                            
                            />
                        )
                    }
                })
            }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    true: {
        margin: 10,
        borderWidth: 1,
        padding: 10,
        backgroundColor: '#d2d2d2'
    },
    false: {
        margin: 10,
        borderWidth: 1,
        padding: 10,
        backgroundColor: '#4e4e4e'
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    pageTitle: {
        fontWeight: 'bold',
        fontSize: 20, // Clean subtitle size
        marginBottom: 6,
        color: Colors.TEXT_PRIMARY,
    },
    pageSubtitle: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        maxWidth: '85%',
    },
    successBox: {
        backgroundColor: '#E0F2FE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    successText: {
        color: '#0369A1',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    inputSpacing: {
        marginBottom: 16,
    },
    buttonContainer: {
        marginTop: 8,
    }
});

export default WriteComponent;