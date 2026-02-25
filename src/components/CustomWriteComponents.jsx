import CustomTextInput from "@/src/components/CustomTextInput";
import { OPTIONS } from "@/src/constants/constants";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";
import CustomDropdown from "./CustomDropdown";

const WriteComponent = ({
    informationSet,
    object,
    optionSet,
    onEditProperty,
}) => {
    return (
        <ScrollView style={styles.formCard}>
            {
                Object.entries(informationSet).map(([prop, value]) => {
                    const text = value.text;
                    const type = value.type;
                    const val = object[prop] ?? null;
                    const required = value.required;
                    
                    if(type === 'text' || type == 'numerical'){
                        return(
                            <View key={prop}>
                                <CustomTextInput
                                    label={`${text}${ required ? '*' : ''}`}
                                    placeholder={text}
                                    value={val || ''}
                                    onChangeText={(text) => onEditProperty({
                                        type: type,
                                        key: prop,
                                        value: text
                                    })}
                                    style={styles.inputSpacing}
                                />
                            </View>
                        )
                    }

                    if(type === 'multi-select'){
                        const options = OPTIONS[value.options] ?? [];
                        return(
                            <View key={prop}>
                                <Text>{text} { required ? '*' : ''}</Text>
                                {
                                    options && options.map(o => {
                                        return(
                                            <Pressable style={val?.find(v => v === o) ? styles.true : styles.false} onPress={() => onEditProperty({
                                                type: type,
                                                key: prop,
                                                value: o
                                            })}>
                                                <Text>{o}</Text>
                                            </Pressable>
                                        )
                                    })
                                }
                            </View>
                        )
                    }

                    if(type === 'single-select'){
                        const options = OPTIONS[value.options] ?? [];
                        return(
                            <View key={text}>
                                <CustomDropdown
                                    label={`${text}${ required ? '*' : ''}`}
                                    placeholder={`Select ${text}`}
                                    options={options}
                                    value={val}
                                    onSelect={(item) => onEditProperty({
                                            type: type,
                                            key: prop,
                                            value: item,
                                        })
                                    }
                                />
                            </View>
                        )
                    }

                    if(type === 'file'){
                        return(
                            <View key={text}>
                                <Text>{text} { required ? '*' : ''}</Text>
                                <CustomTextInput
                                    placeholder={text}
                                    value={val || ''}
                                    onChangeText={(text) => onEditProperty({
                                        type: type,
                                        key: prop,
                                        value: text
                                    })}
                                />
                            </View>
                        )
                    }

                    if(type === 'object-select'){
                        const optionKey = value.options ?? null;
                        const opts = optionKey ? optionSet[optionKey] : [];
                        return(
                            <View key={text}>
                                <Text>{text} { required ? '*' : ''}</Text>
                                {
                                    opts && opts.map(o => {
                                        return(
                                            <Pressable style={(val === o || val.name === o) ? styles.true : styles.false} onPress={() => onEditProperty({
                                                type: type,
                                                key: prop,
                                                value: o
                                            })}>
                                                <Text>{o}</Text>
                                            </Pressable>
                                        )
                                    })
                                }
                            </View>
                        )
                    }

                    if(type === 'boolean'){
                        return(
                            <View key={text}>
                                <Text>{ text } { required ? '*' : ''}</Text>
                                <Pressable style={!val ? styles.false : (val ? styles.true : styles.false)} onPress={() => onEditProperty({
                                    type: type,
                                    key: prop,
                                    value: val
                                })}>
                                    <Text>{val === null ? 'NO DATA' : (val ? 'TRUE' : 'FALSE')}</Text>
                                </Pressable>
                            </View>
                        )
                    }

                    if(type === 'date'){
                        return(
                            <CustomTextInput
                                label={`${text} ${ required ? '*' : ''}`} 
                                placeholder="DD/MM/YYYY"
                                value={val}
                                onChangeText={(val) => onEditProperty({
                                    type: type,
                                    key: prop,
                                    value: val,
                                })}
                                type="date"
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