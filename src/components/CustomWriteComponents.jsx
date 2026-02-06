import CustomTextInput from "@/src/components/CustomTextInput";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const WriteComponent = ({
    informationSet,
    object,
    options,
    optionSet,
    onEditProperty
}) => {
    return (
        <ScrollView style={styles.writeComponent}>
            {
                Object.entries(informationSet).map(([prop, value]) => {
                    const text = value.text;
                    const type = value.type;
                    const val = object[prop] ?? null;
                    const required = value.required;
                    if(type === 'text' || type == 'numerical'){
                        return(
                            <View key={prop} >
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

                    if(type === 'multi-select'){
                        const options = value.options;
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
                        const options = value.options;
                        return(
                            <View key={text}>
                                <Text>{text} { required ? '*' : ''}</Text>
                                {
                                    options && options.map(o => {
                                        return(
                                            <Pressable style={val === o ? styles.true : styles.false} onPress={() => onEditProperty({
                                                type: type,
                                                key: prop,
                                                value: o,
                                            })}>
                                                <Text>{o}</Text>
                                            </Pressable>
                                        )
                                    })
                                }
                            </View>
                        )
                    }

                    if(type === 'object-select'){
                        const optionKey = value.options ?? null;
                        const opts = optionKey ? optionSet[optionKey] : options;
                        console.log(opts);
                        return(
                            <View key={text}>
                                <Text>{text} { required ? '*' : ''}</Text>
                                {
                                    opts && opts.map(o => {
                                        return(
                                            <Pressable style={(val && val.name === o) ? styles.true : styles.false} onPress={() => onEditProperty({
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
    }
})

export default WriteComponent;