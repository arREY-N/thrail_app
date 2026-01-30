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
    onEditProperty,
}) => {
    return (
        <ScrollView>
            {
                Object.entries(informationSet).map(([group, groupValue]) => {
                    return(
                        <View style={styles.writeComponent}>
                            {
                                Object.entries(groupValue).map(([property, value]) => {
                                    const text = value.text;
                                    const type = value.type;
                                    const val = ((object[group] && object[group][property] !== null) ? object[group][property]: null);

                                    if(type === 'text' || type == 'numerical'){
                                            return(
                                                <View key={groupValue[property].text}>
                                                    <Text>{groupValue[property].text}</Text>
                                                    <CustomTextInput
                                                        placeholder={groupValue[property].text}
                                                        value={val || ''}
                                                        onChangeText={(text) => onEditProperty({
                                                            info: [group],
                                                            type: type,
                                                            key: property,
                                                            value: text
                                                        })}
                                                    />
                                                </View>
                                            )
                                        }

                                        if(type === 'multi-select'){
                                            const options = groupValue[property].options;
                                            return(
                                                <View key={groupValue[property].text}>
                                                    <Text>{groupValue[property].text}</Text>
                                                    {
                                                        options && options.map(o => {
                                                            return(
                                                                <Pressable style={val?.find(v => v === o) ? styles.true : styles.false} onPress={() => onEditProperty({
                                                                    info: group,
                                                                    type: type,
                                                                    key: property,
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
                                            const options = groupValue[property].options;
                                            return(
                                                <View key={groupValue[property].text}>
                                                    <Text>{groupValue[property].text}</Text>
                                                    {
                                                        options && options.map(o => {
                                                            return(
                                                                <Pressable style={val === o ? styles.true : styles.false} onPress={() => onEditProperty({
                                                                    info: group,
                                                                    type: type,
                                                                    key: property,
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
                                                <View key={groupValue[property].text}>
                                                    <Text>{groupValue[property].text}</Text>
                                                    {
                                                        options && options.map(o => {
                                                            return(
                                                                <Pressable style={(val && val.name === o) ? styles.true : styles.false} onPress={() => onEditProperty({
                                                                    info: group,
                                                                    type: type,
                                                                    key: property,
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
                                                <Pressable style={val === true ? styles.true : styles.false} onPress={() => onEditProperty({
                                                    info: group,
                                                    type: type,
                                                    key: property,
                                                    value: val
                                                })}>
                                                    <Text>{text}: {val === null ? 'NO DATA' : val === true ? 'True' : 'False'}</Text>
                                                </Pressable>
                                            )
                                        }
                                })
                            }
                        </View>
                    )
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
        borderWidth: 1,
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