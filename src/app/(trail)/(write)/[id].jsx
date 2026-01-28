import CustomTextInput from "@/src/components/CustomTextInput";
import { TRAIL_CONSTANTS } from '@/src/constants/trails';
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function writeTrail(){
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const trailInformation = TRAIL_CONSTANTS.TRAIL_INFORMATION;
    const system = useTrailsStore(s => s.error);
    const trail = useTrailsStore(s => s.trail);
    const isLoading = useTrailsStore(s => s.isLoading);

    const removeTrail = useTrailsStore(s => s.removeTrail);
    const writeTrail = useTrailsStore(s => s.writeTrail);
    const createTrail = useTrailsStore(s => s.createTrail);
    const onEditProperty = useTrailsStore(s => s.editProperty);
    const resetTrail = useTrailsStore(s => s.resetTrail);

    useEffect(() => {
        resetTrail();
        if(id){
            writeTrail(id);
        }
    }, [id])

    const onSubmitTrailPress = async () => {
        const success = await createTrail();
        if(!success) return;
        router.back();
    }

    const onRemovePress = async () => {
        if(id) await removeTrail(id);
        router.back();
    }
    
    return (
        <TESTCREATETRAIL 
            trail={trail}
            trailInformation={trailInformation}
            system={system}
            isLoading={isLoading}

            onSubmitTrailPress={onSubmitTrailPress}
            onDeleteTrailPress={onRemovePress}
            onEditProperty={onEditProperty}
        />
    )
}

const TESTCREATETRAIL = ({
    trail,
    trailInformation,
    system,
    isLoading,

    onSubmitTrailPress,
    onDeleteTrailPress,
    onEditProperty,
}) => {
    return(
        <ScrollView>
            {
                Object.entries(trailInformation).map(([group, groupValue]) => {
                    return (
                        <View>
                            <View style={styles.group}>
                                {
                                    Object.entries(groupValue).map(([property, value]) => {
                                        const text = value.text
                                        const type = value.type
                                        const val = ((trail[group] && (trail[group][property] !== null)) ? trail[group][property] : null);
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
                        </View>
                    )
                })
            }
            { system && <Text>{system}</Text>}
            { isLoading && <Text>Loading</Text>}
            <Pressable onPress={onSubmitTrailPress}>
                <Text>SAVE TRAIL</Text>
            </Pressable>
            <Pressable onPress={onDeleteTrailPress}>
                <Text>DELETE TRAIL</Text>
            </Pressable>

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    trailForm: {
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