import CustomTextInput from "@/src/components/CustomTextInput";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const WriteComponent = ({
    informationSet,
    object,
    options,
    system,
    isLoading,
    onSubmit,
    onDelete,
    onEditProperty
}) => {
    return (
        <ScrollView style={styles.writeComponent}>
            {
                Object.entries(informationSet).map(([prop, value]) => {
                    const text = value.text;
                    const type = value.type;
                    const val = object[prop] ?? null;
                    if(type === 'text' || type == 'numerical'){
                        return(
                            <View key={prop} >
                                <Text>{prop}: {text}</Text>
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
                                <Text>{text}</Text>
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
                                <Text>{text}</Text>
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
                        return(
                            <View key={text}>
                                <Text>{text}</Text>
                                {
                                    options && options.map(o => {
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

                })
            }

            { system && <Text>{system}</Text>}
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={onSubmit}>
                <Text>SAVE</Text>
            </Pressable>
            <Pressable onPress={onDelete}>
                <Text>DELETE</Text>
            </Pressable>

            <View style={{margin: 50}}/>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    writeComponent: {
        margin: 10,
        padding: 10
    },
    group: {
        margin: 10,
        borderWidth: 1,
        padding: 10
    },
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